from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Request,
    File,
    UploadFile,
    Query,
)
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List

import time

from sqlalchemy import text
from app.database import engine, get_db
from app import models, schemas, crud
from app.xml_importer import import_from_xml
from app.logger import logger

app = FastAPI(title="Hierarchical Directory Service")


app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="templates")


def wait_for_db():
    max_retries = 10
    retry_delay = 5

    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connection successful")
            return True
        except Exception as e:
            logger.warning(
                f"Database connection attempt {attempt + 1} failed: {str(e)}"
            )
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                logger.error("Could not connect to database after multiple attempts")
                return False


@app.on_event("startup")
async def startup_event():
    logger.info("Waiting for database to be ready...")
    if wait_for_db():
        try:
            models.Base.metadata.create_all(bind=engine)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {str(e)}")
    else:
        logger.error("Failed to connect to database on startup")


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/items/tree", response_model=List[dict])
def get_directory_tree(db: Session = Depends(get_db)):
    try:
        tree = crud.get_tree(db)
        return tree
    except Exception as e:
        logger.error(f"Error getting directory tree: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/search/items/", response_model=List[dict])
def search_directory_items(
    code: str = Query(None),
    name: str = Query(None),
    db: Session = Depends(get_db),
):
    try:
        logger.info(f"Search request - code: {code}, name: {name}")

        if not code and not name:
            raise HTTPException(
                status_code=400,
                detail="At least one search parameter (code or name) is required",
            )

        tree = crud.search_items_with_children(db, code, name)
        return tree
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching items: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/items", response_model=schemas.DirectoryItem)
def create_directory_item(
    item: schemas.DirectoryItemCreate, db: Session = Depends(get_db)
):
    try:

        existing_item = crud.get_item_by_code(db, item.code)
        if existing_item:
            raise HTTPException(
                status_code=400, detail="Элемент с таким кодом уже существует"
            )

        return crud.create_item(db, item)

    except ValueError as e:

        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:

        raise
    except Exception as e:

        logger.error(f"Unexpected error creating item: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")


@app.get("/api/items/{item_id}", response_model=schemas.DirectoryItem)
def read_directory_item(item_id: int, db: Session = Depends(get_db)):
    item = crud.get_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/api/items/{item_id}", response_model=schemas.DirectoryItem)
def update_directory_item(
    item_id: int, item: schemas.DirectoryItemUpdate, db: Session = Depends(get_db)
):
    try:
        db_item = crud.update_item(db, item_id, item)
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        return db_item
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating item: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.delete("/api/items/{item_id}")
def delete_directory_item(item_id: int, db: Session = Depends(get_db)):
    success = crud.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}


@app.delete("/api/items/{item_id}/with-children")
def delete_directory_item_with_children(item_id: int, db: Session = Depends(get_db)):
    success = crud.delete_item_with_children(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item and all children deleted successfully"}


@app.post("/api/import/xml")
async def import_xml(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        imported_count = import_from_xml(db, content)
        return {
            "success": True,
            "message": f"Успешно импортировано {imported_count} элемент(ов)",
            "imported_count": imported_count,
        }
    except Exception as e:
        logger.error(f"XML import failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

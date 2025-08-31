from lxml import etree
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.logger import logger


def import_from_xml(db: Session, xml_content: str):
    try:
        root = etree.fromstring(xml_content)
        imported_count = 0

        db.query(models.DirectoryItem).delete()
        db.commit()

        def process_element(element, parent_code=None):
            nonlocal imported_count

            code = element.get("code")
            name = element.get("name")

            if code and name:
                item_data = schemas.DirectoryItemCreate(
                    code=code, name=name, parent_code=parent_code
                )

                try:
                    crud.create_item(db, item_data)
                    imported_count += 1
                except Exception as e:
                    logger.error(f"Error importing item {code}: {str(e)}")

            for child in element:
                process_element(child, code)

        process_element(root)

        db.commit()
        logger.info(f"Successfully imported {imported_count} items from XML")
        return imported_count

    except Exception as e:
        db.rollback()
        logger.error(f"XML import error: {str(e)}")
        raise

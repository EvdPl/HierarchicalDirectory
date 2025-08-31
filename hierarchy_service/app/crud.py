from sqlalchemy.orm import Session
from app import models, schemas
from app.logger import logger


def get_item_by_code(db: Session, code: str):
    return (
        db.query(models.DirectoryItem).filter(models.DirectoryItem.code == code).first()
    )


def get_item(db: Session, item_id: int):
    return (
        db.query(models.DirectoryItem)
        .filter(models.DirectoryItem.id == item_id)
        .first()
    )


def get_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.DirectoryItem).offset(skip).limit(limit).all()


def create_item(db: Session, item: schemas.DirectoryItemCreate):
    parent_id = None
    if item.parent_code:
        parent = get_item_by_code(db, item.parent_code)
        if parent:
            parent_id = parent.id
        else:
            raise ValueError(f"Родительский код {item.parent_code} не найден")

    db_item = models.DirectoryItem(code=item.code, name=item.name, parent_id=parent_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    logger.info(f"Добавлен элемент: {item.code} - {item.name}")
    return db_item


def update_item(db: Session, item_id: int, item: schemas.DirectoryItemUpdate):
    db_item = get_item(db, item_id)
    if not db_item:
        return None

    if item.code is not None:
        db_item.code = item.code
    if item.name is not None:
        db_item.name = item.name

    if item.parent_code is not None:
        if item.parent_code == "":
            db_item.parent_id = None
        else:
            parent = get_item_by_code(db, item.parent_code)
            if parent:
                db_item.parent_id = parent.id
            else:
                raise ValueError(f"Родительский код {item.parent_code} не найден")

    db.commit()
    db.refresh(db_item)
    logger.info(f"Редактирован элемент: {db_item.code} - {db_item.name}")
    return db_item


def delete_item(db: Session, item_id: int):
    db_item = get_item(db, item_id)
    if db_item:
        db.delete(db_item)
        db.commit()
        logger.info(f"Удален элемент: {db_item.code} - {db_item.name}")
        return True
    return False


def delete_item_with_children(db: Session, item_id: int):

    db_item = get_item(db, item_id)
    if not db_item:
        return False

    children = (
        db.query(models.DirectoryItem)
        .filter(models.DirectoryItem.parent_id == item_id)
        .all()
    )
    for child in children:
        delete_item_with_children(db, child.id)

    db.delete(db_item)
    db.commit()
    logger.info(f"Удален элемент с детьми: {db_item.code} - {db_item.name}")
    return True


def search_items_with_children(db: Session, code: str = None, name: str = None):

    logger.info(f"Поиск с параметрами: код={code}, название={name}")

    query = db.query(models.DirectoryItem)

    if code:
        logger.info(f"Фильтрация по коду содержит: {code}")
        query = query.filter(models.DirectoryItem.code.contains(code))
    if name:
        logger.info(f"Фильтрация по названию содержит: {name}")
        query = query.filter(models.DirectoryItem.name.contains(name))

    found_items = query.all()
    logger.info(f"Найдено элементов, соответствующих критериям: {len(found_items)}")

    if not found_items:
        return []

    found_ids = [item.id for item in found_items]

    def get_all_parents(item_ids):
        parent_ids = set()
        items = (
            db.query(models.DirectoryItem)
            .filter(models.DirectoryItem.id.in_(item_ids))
            .all()
        )

        for item in items:
            if item.parent_id and item.parent_id not in found_ids:
                parent_ids.add(item.parent_id)

        return parent_ids

    all_parent_ids = set()
    current_level_ids = set(found_ids)

    while current_level_ids:
        parent_ids = get_all_parents(current_level_ids)
        if not parent_ids:
            break

        all_parent_ids.update(parent_ids)
        current_level_ids = parent_ids

    all_item_ids = set(found_ids) | all_parent_ids
    all_items = (
        db.query(models.DirectoryItem)
        .filter(models.DirectoryItem.id.in_(all_item_ids))
        .all()
    )

    logger.info(f"Всего элементов в дереве (с родителями): {len(all_items)}")
    logger.info(f"Найдено родителей: {len(all_parent_ids)}")

    tree = build_tree(all_items)

    total_in_tree = count_items_in_tree(tree)
    logger.info(f"Всего элементов в построенном дереве: {total_in_tree}")

    return tree


def count_items_in_tree(tree):

    count = 0
    for item in tree:
        count += 1
        if item["children"]:
            count += count_items_in_tree(item["children"])
    return count


def build_tree(items, parent_id=None):
    tree = []
    for item in items:
        if item.parent_id == parent_id:
            children = build_tree(items, item.id)
            item_dict = {
                "id": item.id,
                "code": item.code,
                "name": item.name,
                "children": children,
            }
            tree.append(item_dict)
    return tree


def get_tree(db: Session):
    items = db.query(models.DirectoryItem).all()
    return build_tree(items)

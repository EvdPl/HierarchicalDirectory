<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?> - Иерархичный справочник</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .navbar { background: #f4f4f4; padding: 10px; margin-bottom: 20px; }
        .navbar a { margin-right: 15px; text-decoration: none; color: #333; }
        .tree { margin-left: 20px; }
        .tree-item { margin: 5px 0; }
        .tree-children { margin-left: 30px; }
        .success { color: green; }
        .error { color: red; }
        form { margin: 20px 0; }
        label { display: block; margin: 10px 0 5px; }
        input, select { padding: 5px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="navbar">
        <a href="index.php">Просмотр</a>
        <a href="index.php?action=search">Поиск</a>
        <a href="index.php?action=add">Добавить</a>
        <a href="index.php?action=import">Импорт XML</a>
    </div>

    <?php if (isset($_GET['message'])): ?>
        <div class="success">
            <?php
            $messages = [
                'added' => 'Элемент добавлен',
                'updated' => 'Элемент обновлен',
                'deleted' => 'Элемент удален',
                'imported' => 'Данные импортированы'
            ];
            echo $messages[$_GET['message']] ?? 'Операция выполнена';
            ?>
        </div>
    <?php endif; ?>

    <?php if (isset($_GET['error'])): ?>
        <div class="error">
            <?php
            $errors = [
                'not_found' => 'Элемент не найден',
                'delete_failed' => 'Ошибка при удалении'
            ];
            echo $errors[$_GET['error']] ?? 'Произошла ошибка';
            ?>
        </div>
    <?php endif; ?>

    <h1><?= $title ?></h1>
    
    <?php 
    if (isset($content)) {
        echo $content;
    }
    ?>
</body>
</html>
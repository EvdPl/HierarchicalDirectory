<?php
require_once 'config/database.php';
require_once 'models/DirectoryModel.php';
require_once 'controllers/DirectoryController.php';

$database = new Database();
$db = $database->getConnection();

$model = new DirectoryModel($db);
$controller = new DirectoryController($model);

$action = $_GET['action'] ?? 'index';

$actionMap = [
    '' => 'index',
    'view' => 'index',
    'search' => 'search',
    'add' => 'add',
    'edit' => 'edit',
    'delete' => 'delete',
    'import' => 'import'
];

$method = $actionMap[$action] ?? $action;

if (!method_exists($controller, $method)) {
    header('Location: index.php?error=not_found');
    exit;
}

$result = $controller->$method();

if (headers_sent()) {
    exit;
}

$view = $result['view'];
$data = $result['data'] ?? [];
$title = $result['title'] ?? 'Иерархичный справочник';

extract($data);

ob_start();
include "views/$view.php";
$content = ob_get_clean();

include "views/layout.php";
?>
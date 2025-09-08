<?php
class DirectoryController {
    private $model;
    
    public function __construct($model) {
        $this->model = $model;
    }
    
    public function index() {
        $tree = $this->model->getTree();
        return [
            'view' => 'tree',
            'data' => ['tree' => $tree],
            'title' => 'Просмотр справочника'
        ];
    }
    
    public function search() {
        $search_term = $_GET['q'] ?? '';
        $data = ['search_term' => $search_term];
        
        if (!empty($search_term)) {
            $data['results'] = $this->model->search($search_term);
            $title = 'Поиск: ' . $search_term;
        } else {
            $title = 'Поиск по справочнику';
        }
        
        return [
            'view' => 'search',
            'data' => $data,
            'title' => $title
        ];
    }
    
    public function add() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $code = $_POST['code'];
            $name = $_POST['name'];
            $parent_code = $_POST['parent_code'] ?: null;
            
            if ($this->model->create($code, $name, $parent_code)) {
                header('Location: index.php?message=added');
                exit;
            }
        }
        
        return [
            'view' => 'edit',
            'data' => ['tree' => $this->model->getTree()],
            'title' => 'Добавить элемент'
        ];
    }
    
    public function edit() {
        $code = $_GET['code'] ?? '';
        $item = $this->model->getByCode($code);
        
        if (!$item) {
            header('Location: index.php?error=not_found');
            exit;
        }
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $new_code = $_POST['code'];
            $name = $_POST['name'];
            $parent_code = $_POST['parent_code'] ?: null;
            
            if ($this->model->update($code, $new_code, $name, $parent_code)) {
                header('Location: index.php?message=updated');
                exit;
            }
        }
        
        return [
            'view' => 'edit',
            'data' => [
                'item' => $item,
                'tree' => $this->model->getTree()
            ],
            'title' => 'Редактировать элемент'
        ];
    }
    
    public function delete() {
        $code = $_GET['code'] ?? '';
        
        if ($this->model->delete($code)) {
            header('Location: index.php?message=deleted');
            exit;
        } else {
            header('Location: index.php?error=delete_failed');
            exit;
        }
    }
    
    public function import() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['xml_file'])) {
            $file = $_FILES['xml_file'];
            
            if ($file['error'] === UPLOAD_ERR_OK) {
                if ($this->model->importFromXML($file['tmp_name'])) {
                    header('Location: index.php?message=imported');
                    exit;
                }
            }
        }
        
        return [
            'view' => 'import',
            'data' => [],
            'title' => 'Импорт из XML'
        ];
    }
}
?>
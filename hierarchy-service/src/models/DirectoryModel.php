<?php
class DirectoryModel {
    private $conn;
    private $table_name = "directory_items";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getTree($parent_code = null) {
        $query = "SELECT * FROM " . $this->table_name . " 
                 WHERE parent_code " . ($parent_code ? "= :parent_code" : "IS NULL") . 
                 " ORDER BY code";
        
        $stmt = $this->conn->prepare($query);
        if ($parent_code) {
            $stmt->bindParam(':parent_code', $parent_code);
        }
        $stmt->execute();
        
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result = [];
        
        foreach ($items as $item) {
            $children = $this->getTree($item['code']);
            if ($children) {
                $item['children'] = $children;
            }
            $result[] = $item;
        }
        
        return $result;
    }

    public function search($search_term) {
        $query = "SELECT * FROM " . $this->table_name . " 
                 WHERE code LIKE :code OR name LIKE :name 
                 ORDER BY code";
        
        $stmt = $this->conn->prepare($query);
        $search_pattern = "%$search_term%";
        $stmt->bindParam(':code', $search_pattern);
        $stmt->bindParam(':name', $search_pattern);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($code, $name, $parent_code = null) {
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                    (code, name, parent_code) 
                    VALUES (:code, :name, :parent_code)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':code', $code);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':parent_code', $parent_code);
            
            $result = $stmt->execute();
            
            if ($result) {
                $this->log("CREATE", "Добавлен элемент: $code - $name" . 
                    ($parent_code ? " (родитель: $parent_code)" : ""));
            }
            
            return $result;
        } catch (PDOException $e) {
            $this->log("ERROR", "Create error: " . $e->getMessage());
            return false;
        }
    }

    public function update($old_code, $new_code, $name, $parent_code = null) {
        try {
            $query = "UPDATE " . $this->table_name . " 
                     SET code = :new_code, name = :name, parent_code = :parent_code 
                     WHERE code = :old_code";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':new_code', $new_code);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':parent_code', $parent_code);
            $stmt->bindParam(':old_code', $old_code);
            
            $result = $stmt->execute();
            
            if ($result) {
                $changes = [];
                if ($old_code !== $new_code) {
                    $changes[] = "код: $old_code → $new_code";
                }
                $changes[] = "название: $name";
                if ($parent_code) {
                    $changes[] = "родитель: $parent_code";
                } else {
                    $changes[] = "родитель: удален";
                }
                
                $this->log("UPDATE", "Обновлен элемент: " . implode(', ', $changes));
            }
            
            return $result;
        } catch (PDOException $e) {
            $this->log("ERROR", "Update error: " . $e->getMessage());
            return false;
        }
    }

    public function delete($code) {
        try {
            $item = $this->getByCode($code);
            $item_name = $item ? $item['name'] : 'неизвестно';
            
            $query = "DELETE FROM " . $this->table_name . " WHERE parent_code = :code";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':code', $code);
            $child_deleted = $stmt->execute();
            $child_count = $stmt->rowCount();
            
            $query = "DELETE FROM " . $this->table_name . " WHERE code = :code";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':code', $code);
            $result = $stmt->execute();
            
            if ($result) {
                $this->log("DELETE", "Удален элемент: $code - $item_name" . 
                    ($child_count > 0 ? " (вместе с $child_count дочерними элементами)" : ""));
            }
            
            return $result;
        } catch (PDOException $e) {
            $this->log("ERROR", "Delete error: " . $e->getMessage());
            return false;
        }
    }

    public function codeExists($code) {
        $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE code = :code";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':code', $code);
        $stmt->execute();
        
        return $stmt->fetchColumn() > 0;
    }

    public function getByCode($code) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE code = :code";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':code', $code);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function importFromXML($xml_file) {
        try {
            $xml = simplexml_load_file($xml_file);
            $this->conn->beginTransaction();
            
            $count_before = $this->getTotalCount();
            
            $this->conn->exec("DELETE FROM " . $this->table_name);
            
            $imported_count = 0;
            foreach ($xml->item as $item) {
                $code = (string)$item->code;
                $name = (string)$item->name;
                $parent_code = (string)$item->parent_code;
                if (empty($parent_code)) $parent_code = null;
                
                if ($this->create($code, $name, $parent_code)) {
                    $imported_count++;
                }
            }
            
            $this->conn->commit();
            
            $this->log("IMPORT", "Импорт XML: добавлено $imported_count элементов, " . 
                "удалено " . ($count_before) . " старых элементов");
            
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            $this->log("ERROR", "XML Import error: " . $e->getMessage());
            return false;
        }
    }

    private function getTotalCount() {
        $query = "SELECT COUNT(*) FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchColumn();
    }

    private function log($type, $message) {
        $logFile = '/var/www/logs/app.log';
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] [$type] $message\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);
    }
}
?>
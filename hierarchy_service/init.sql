CREATE DATABASE IF NOT EXISTS directory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE directory_db;

CREATE TABLE IF NOT EXISTS directory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    parent_id INT NULL,
    FOREIGN KEY (parent_id) REFERENCES directory_items(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert sample data with proper encoding
INSERT INTO directory_items (code, name, parent_id) VALUES
('001', 'Главный раздел', NULL),
('001.001', 'Подраздел 1', 1),
('001.002', 'Подраздел 2', 1),
('001.001.001', 'Элемент 1.1.1', 2),
('001.001.002', 'Элемент 1.1.2', 2),
('002', 'Второй раздел', NULL);
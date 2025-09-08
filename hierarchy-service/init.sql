CREATE DATABASE IF NOT EXISTS hierarchy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hierarchy_db;

CREATE TABLE IF NOT EXISTS directory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_code VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_code) REFERENCES directory_items(code) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_code ON directory_items(code);
CREATE INDEX idx_parent_code ON directory_items(parent_code);
CREATE INDEX idx_name ON directory_items(name);

INSERT INTO directory_items (code, name, parent_code) VALUES
('001', 'Главный раздел', NULL),
('001.001', 'Подраздел 1', '001'),
('001.002', 'Подраздел 2', '001'),
('001.001.001', 'Элемент 1.1', '001.001'),
('001.001.002', 'Элемент 1.2', '001.001'),
('002', 'Второй раздел', NULL);
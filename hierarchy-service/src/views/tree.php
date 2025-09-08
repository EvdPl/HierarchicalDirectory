<?php
function renderTree($items, $level = 0) {
    if (empty($items)) {
        return '<p>Справочник пуст</p>';
    }
    
    $html = '<div class="tree">';
    foreach ($items as $item) {
        $html .= '<div class="tree-item">';
        $html .= '<strong>' . htmlspecialchars($item['code']) . '</strong>: ';
        $html .= htmlspecialchars($item['name']);
        $html .= ' <a href="index.php?action=edit&code=' . $item['code'] . '">[ред.]</a>';
        $html .= ' <a href="index.php?action=delete&code=' . $item['code'] . '" onclick="return confirm(\'Удалить?\')">[уд.]</a>';
        
        if (!empty($item['children'])) {
            $html .= renderTree($item['children'], $level + 1);
        }
        
        $html .= '</div>';
    }
    $html .= '</div>';
    
    return $html;
}

echo renderTree($tree);
?>
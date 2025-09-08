<?php
$is_edit = isset($item);
?>

<form method="POST" action="index.php?action=<?= $is_edit ? 'edit&code=' . $item['code'] : 'add' ?>">
    <label>Код:</label>
    <input type="text" name="code" value="<?= $is_edit ? htmlspecialchars($item['code']) : '' ?>" required>
    
    <label>Название:</label>
    <input type="text" name="name" value="<?= $is_edit ? htmlspecialchars($item['name']) : '' ?>" required>
    
    <label>Родительский элемент:</label>
    <select name="parent_code">
        <option value="">(нет)</option>
        <?php
        function buildOptions($items, $current_code = null, $parent_code = null, $level = 0) {
            $options = '';
            foreach ($items as $item) {
                if ($item['code'] === $current_code) continue;
                
                $prefix = str_repeat('--', $level);
                $selected = ($item['code'] === $parent_code) ? 'selected' : '';
                
                $options .= '<option value="' . $item['code'] . '" ' . $selected . '>' 
                          . $prefix . ' ' . $item['code'] . ' - ' . $item['name'] . '</option>';
                
                if (!empty($item['children'])) {
                    $options .= buildOptions($item['children'], $current_code, $parent_code, $level + 1);
                }
            }
            return $options;
        }

        if (isset($tree)) {
            $current_code = $is_edit ? $item['code'] : null;
            $parent_code = $is_edit ? $item['parent_code'] : null;
            echo buildOptions($tree, $current_code, $parent_code);
        }
        ?>
    </select>
    
    <br>
    <button type="submit"><?= $is_edit ? 'Обновить' : 'Добавить' ?></button>
    <a href="index.php">Отмена</a>
</form>
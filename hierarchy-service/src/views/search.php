<form method="GET" action="index.php">
    <input type="hidden" name="action" value="search">
    <input type="text" name="q" value="<?= isset($search_term) ? htmlspecialchars($search_term) : '' ?>" placeholder="Поиск по коду или названию">
    <button type="submit">Найти</button>
</form>

<?php if (isset($search_term) && !empty($search_term)): ?>
    <?php if (isset($results) && !empty($results)): ?>
        <h2>Результаты поиска:</h2>
        <?php foreach ($results as $result): ?>
            <div class="tree-item">
                <strong><?= htmlspecialchars($result['code']) ?></strong>: 
                <?= htmlspecialchars($result['name']) ?>
                <a href="index.php?action=edit&code=<?= $result['code'] ?>">[ред.]</a>
            </div>
        <?php endforeach; ?>
    <?php else: ?>
        <p>Ничего не найдено</p>
    <?php endif; ?>
<?php endif; ?>
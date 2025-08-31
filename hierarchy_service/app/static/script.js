let currentTree = [];
let currentItemIdToDelete = null;

function showConfirmModal(itemId) {
    currentItemIdToDelete = itemId;
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'block';
}

function hideConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
    currentItemIdToDelete = null;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');

    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'flex';
    notification.style.justifyContent = 'space-between';
    notification.style.alignItems = 'center';

    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'none';
}

function initEventHandlers() {

    setTimeout(() => {
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        const cancelDeleteBtn = document.getElementById('cancelDelete');

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async function () {
                if (currentItemIdToDelete) {
                    await performDeleteItem(currentItemIdToDelete);
                }
                hideConfirmModal();
            });
        }

        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', hideConfirmModal);
        }

        const form = document.getElementById('item-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = {
                    code: document.getElementById('item-code').value,
                    name: document.getElementById('item-name').value,
                    parent_code: document.getElementById('item-parent').value || null
                };

                const itemId = document.getElementById('item-id').value;

                try {
                    let response;
                    if (itemId) {
                        response = await fetch(`/api/items/${itemId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(formData)
                        });
                    } else {
                        response = await fetch('/api/items', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(formData)
                        });
                    }

                    if (response.ok) {
                        showNotification('Элемент успешно сохранен', 'success');
                        resetForm();
                        loadTree();
                    } else {
                        const error = await response.json();
                        throw new Error(error.detail);
                    }
                } catch (error) {
                    console.error('Save error:', error);
                    showNotification('Ошибка сохранения: ' + error.message, 'error');
                }
            });
        }
    }, 100);
}

async function loadTree() {
    try {
        const response = await fetch('/api/items/tree');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        currentTree = await response.json();
        renderTree(currentTree, 'directory-tree');
    } catch (error) {
        console.error('Error loading tree:', error);
        showNotification('Ошибка загрузки дерева: ' + error.message, 'error');
    }
}

function renderTree(tree, containerId, searchTerm = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!tree || tree.length === 0) {
        container.innerHTML = '<p>Нет данных</p>';
        return;
    }

    function createTreeNode(item, level = 0) {
        const hasChildren = item.children && item.children.length > 0;
        const nodeDiv = document.createElement('div');
        nodeDiv.className = `tree-item ${hasChildren ? 'has-children' : 'no-children'}`;

        const header = document.createElement('div');
        header.className = 'tree-header';
        header.style.paddingLeft = (level * 20) + 'px';

        if (hasChildren) {
            header.onclick = (e) => {
                if (!e.target.closest('.tree-actions')) {
                    toggleTreeNode(nodeDiv);
                }
            };
            header.style.cursor = 'pointer';
        }

        if (hasChildren) {
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle';
            toggle.innerHTML = '▶';
            header.appendChild(toggle);
        }

        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.innerHTML = hasChildren ? '📁' : '📄';
        header.appendChild(icon);

        const codeSpan = document.createElement('span');
        codeSpan.className = 'tree-code';
        if (searchTerm && item.code.includes(searchTerm)) {
            codeSpan.innerHTML = highlightText(item.code, searchTerm);
        } else {
            codeSpan.textContent = item.code;
        }
        header.appendChild(codeSpan);

        header.appendChild(document.createTextNode(' - '));

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tree-name';
        if (searchTerm && item.name.includes(searchTerm)) {
            nameSpan.innerHTML = highlightText(item.name, searchTerm);
        } else {
            nameSpan.textContent = item.name;
        }
        header.appendChild(nameSpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'tree-actions';
        actionsDiv.onclick = (e) => e.stopPropagation();

        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editItem(item.id);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteItem(item.id);
        };

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        header.appendChild(actionsDiv);

        nodeDiv.appendChild(header);

        if (hasChildren) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            childrenContainer.style.display = 'none';

            item.children.forEach(child => {
                childrenContainer.appendChild(createTreeNode(child, level + 1));
            });

            nodeDiv.appendChild(childrenContainer);
        }

        return nodeDiv;
    }

    tree.forEach(item => {
        container.appendChild(createTreeNode(item));
    });
}

function highlightText(text, searchTerm) {
    if (!text || !searchTerm) return text;

    try {
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    } catch (e) {
        console.error('Error highlighting text:', e);
        return text;
    }
}

function toggleTreeNode(nodeElement) {
    const childrenContainer = nodeElement.querySelector('.tree-children');
    const toggle = nodeElement.querySelector('.tree-toggle');

    if (childrenContainer && toggle) {
        if (childrenContainer.style.display === 'none') {
            childrenContainer.style.display = 'block';
            toggle.innerHTML = '▼';
            nodeElement.classList.add('expanded');
        } else {
            childrenContainer.style.display = 'none';
            toggle.innerHTML = '▶';
            nodeElement.classList.remove('expanded');
        }
    }
}

function expandAll() {
    const allTreeItems = document.querySelectorAll('.tree-item.has-children');
    allTreeItems.forEach(item => {
        const childrenContainer = item.querySelector('.tree-children');
        const toggle = item.querySelector('.tree-toggle');

        if (childrenContainer && toggle && childrenContainer.style.display === 'none') {
            childrenContainer.style.display = 'block';
            toggle.innerHTML = '▼';
            item.classList.add('expanded');
        }
    });
}

function collapseAll() {
    const allTreeItems = document.querySelectorAll('.tree-item.has-children');
    allTreeItems.forEach(item => {
        const childrenContainer = item.querySelector('.tree-children');
        const toggle = item.querySelector('.tree-toggle');

        if (childrenContainer && toggle && childrenContainer.style.display !== 'none') {
            childrenContainer.style.display = 'none';
            toggle.innerHTML = '▶';
            item.classList.remove('expanded');
        }
    });
}

function expandAllSearchResults() {
    const searchTreeItems = document.querySelectorAll('.tree-search-result .tree-item.has-children');

    searchTreeItems.forEach(item => {
        const childrenContainer = item.querySelector('.tree-children');
        const toggle = item.querySelector('.tree-toggle');

        if (childrenContainer && toggle && childrenContainer.style.display === 'none') {
            childrenContainer.style.display = 'block';
            toggle.innerHTML = '▼';
            item.classList.add('expanded');
        }
    });
}

async function searchItems() {
    const code = document.getElementById('search-code').value.trim();
    const name = document.getElementById('search-name').value.trim();

    if (!code && !name) {
        showNotification('Введите код или название для поиска', 'warning');
        return;
    }

    try {
        let url = '/api/search/items?';
        const params = [];

        if (code) params.push(`code=${encodeURIComponent(code)}`);
        if (name) params.push(`name=${encodeURIComponent(name)}`);

        url += params.join('&');

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const searchTree = await response.json();
        renderSearchResults(searchTree, code, name);

        showNotification('Поиск выполнен успешно', 'success');

    } catch (error) {
        console.error('Ошибка поиска:', error);
        showNotification('Ошибка поиска: ' + error.message, 'error');
    }
}

function renderSearchResults(tree, searchCode, searchName) {
    const container = document.getElementById('search-results');
    if (!container) return;

    container.innerHTML = '';

    if (!tree || tree.length === 0) {
        container.innerHTML = '<p>Ничего не найдено</p>';
        return;
    }

    const totalInTree = countTreeItems(tree);
    let directMatches = 0;

    function countDirectMatches(node) {
        let isMatch = false;

        if (searchCode && node.code && node.code.includes(searchCode)) {
            isMatch = true;
        }
        if (searchName && node.name && node.name.includes(searchName)) {
            isMatch = true;
        }

        if (isMatch) directMatches++;

        if (node.children) {
            node.children.forEach(child => countDirectMatches(child));
        }
    }

    tree.forEach(item => countDirectMatches(item));

    const infoDiv = document.createElement('div');
    infoDiv.className = 'search-info';
    infoDiv.innerHTML = `
        <div >
            <p style="margin: 5px 0; font-weight: bold;">Результаты поиска:</p>
            <p style="margin: 5px 0;">• Непосредственных совпадений: <span style="color: #2e7d32; font-weight: bold;">${directMatches}</span></p>
            <p style="margin: 5px 0;">• Всего в дереве (с родителями): <span style="color: #1565c0; font-weight: bold;">${totalInTree}</span></p>
            ${directMatches === 0 ? '<p style="margin: 5px 0; color: #f44336;">⚠️ Не найдено прямых совпадений, показано частичное совпадение</p>' : ''}
        </div>
    `;

    container.appendChild(infoDiv);

    const treeContainer = document.createElement('div');
    treeContainer.className = 'tree-search-result';
    renderTreeToContainer(tree, treeContainer, searchCode, searchName);
    container.appendChild(treeContainer);

    setTimeout(() => {
        expandAllSearchResults();
    }, 100);
}

function renderTreeToContainer(tree, container, searchCode, searchName) {
    function createTreeNode(item, level = 0) {
        const hasChildren = item.children && item.children.length > 0;
        const nodeDiv = document.createElement('div');
        nodeDiv.className = `tree-item ${hasChildren ? 'has-children' : 'no-children'}`;

        const header = document.createElement('div');
        header.className = 'tree-header';
        header.style.paddingLeft = (level * 20) + 'px';

        if (hasChildren) {
            header.onclick = (e) => {
                if (!e.target.closest('.tree-actions')) {
                    toggleTreeNode(nodeDiv);
                }
            };
            header.style.cursor = 'pointer';
        }

        if (hasChildren) {
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle';
            toggle.innerHTML = '▶';
            header.appendChild(toggle);
        }

        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.innerHTML = hasChildren ? '📁' : '📄';
        header.appendChild(icon);

        const codeSpan = document.createElement('span');
        codeSpan.className = 'tree-code';
        if (searchCode && item.code && item.code.includes(searchCode)) {
            codeSpan.innerHTML = highlightText(item.code, searchCode);
        } else {
            codeSpan.textContent = item.code;
        }
        header.appendChild(codeSpan);

        header.appendChild(document.createTextNode(' - '));

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tree-name';
        if (searchName && item.name && item.name.includes(searchName)) {
            nameSpan.innerHTML = highlightText(item.name, searchName);
        } else {
            nameSpan.textContent = item.name;
        }
        header.appendChild(nameSpan);

        nodeDiv.appendChild(header);

        if (hasChildren) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            childrenContainer.style.display = 'none';

            item.children.forEach(child => {
                childrenContainer.appendChild(createTreeNode(child, level + 1));
            });

            nodeDiv.appendChild(childrenContainer);
        }

        return nodeDiv;
    }

    tree.forEach(item => {
        container.appendChild(createTreeNode(item));
    });
}

function countTreeItems(tree) {
    let count = 0;

    function countItems(node) {
        count++;
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => countItems(child));
        }
    }

    tree.forEach(item => countItems(item));
    return count;
}

async function editItem(itemId) {
    try {
        const response = await fetch(`/api/items/${itemId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const item = await response.json();

        document.getElementById('item-id').value = item.id;
        document.getElementById('item-code').value = item.code;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-parent').value = item.parent_code || '';

        openTab('add');
        showNotification('Элемент загружен для редактирования', 'info');
    } catch (error) {
        console.error('Error loading item:', error);
        showNotification('Ошибка загрузки элемента: ' + error.message, 'error');
    }
}

async function deleteItem(itemId) {
    showDeleteOptionsModal(itemId);
}

async function performDeleteItem(itemId) {
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Элемент успешно удален', 'success');
            loadTree();
        } else {
            throw new Error('Ошибка при удалении');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Ошибка при удалении элемента: ' + error.message, 'error');
    }
}

function showDeleteOptionsModal(itemId) {
    currentItemIdToDelete = itemId;


    const modalContent = `
        <div class="modal-content">
            <h3>Выберите тип удаления</h3>
            <p>Что вы хотите сделать с элементом и его дочерними элементами?</p>
            <div class="modal-buttons" style="flex-direction: column; gap: 10px;">
                <button onclick="deleteItemOnly(${itemId})" class="btn-secondary">
                    Удалить только этот элемент (дети станут корневыми)
                </button>
                <button onclick="deleteItemWithChildren(${itemId})" class="btn-danger">
                    Удалить элемент и всех его потомков
                </button>
                <button onclick="hideDeleteOptionsModal()" class="btn-secondary">
                    Отмена
                </button>
            </div>
        </div>
    `;

    let modal = document.getElementById('deleteOptionsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'deleteOptionsModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = modalContent;
    modal.style.display = 'block';
}

function hideDeleteOptionsModal() {
    const modal = document.getElementById('deleteOptionsModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentItemIdToDelete = null;
}


async function deleteItemOnly(itemId) {
    hideDeleteOptionsModal();
    await performDeleteItem(itemId);
}


async function deleteItemWithChildren(itemId) {
    hideDeleteOptionsModal();
    await performDeleteItemWithChildren(itemId);
}


async function performDeleteItemWithChildren(itemId) {
    try {
        const response = await fetch(`/api/items/${itemId}/with-children`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Элемент и все дочерние элементы успешно удалены', 'success');
            loadTree();
        } else {
            throw new Error('Ошибка при удалении элемента с детьми');
        }
    } catch (error) {
        console.error('Delete with children error:', error);
        showNotification('Ошибка при удалении элемента с детьми: ' + error.message, 'error');
    }
}

function resetForm() {
    document.getElementById('item-form').reset();
    document.getElementById('item-id').value = '';
}

async function importXML() {
    const fileInput = document.getElementById('xml-file');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('Выберите XML файл', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/import/xml', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        const resultDiv = document.getElementById('import-result');
        if (response.ok) {
            resultDiv.innerHTML = `<p class="success">${result.message}</p>`;
            showNotification(result.message, 'success');
            loadTree();
        } else {
            resultDiv.innerHTML = `<p class="error">${result.detail}</p>`;
            showNotification(result.detail, 'error');
        }
    } catch (error) {
        console.error('Import error:', error);
        showNotification('Ошибка импорта: ' + error.message, 'error');
    }
}

function openTab(tabName) {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }

    const tabButtons = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }

    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    if (tabName === 'view') {
        loadTree();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initEventHandlers();
    setTimeout(() => {
        loadTree();
    }, 100);
});
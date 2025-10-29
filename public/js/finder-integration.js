/**
 * Finder Browser Integration Module
 * Connects the macOS Finder-style UI with Desa Wire backend
 */

class FinderBrowser {
    constructor(options = {}) {
        this.projectId = options.projectId || null;
        this.currentFolderId = options.folderId || null;
        this.itemType = options.itemType || 'plans'; // 'plans', 'specifications', 'files', etc.
        this.gridView = document.getElementById('finderGridView');
        this.listView = document.getElementById('finderListView');
        this.currentView = 'grid';
        this.selectedItems = new Set();
        this.items = [];
        this.folders = [];

        this.init();
    }

    init() {
        this.setupViewToggle();
        this.setupBreadcrumb();
        this.loadData();
    }

    // ============================================
    // Data Loading
    // ============================================

    async loadData() {
        try {
            this.showLoading();

            // Load folders and items based on type
            if (this.itemType === 'plans') {
                await this.loadPlans();
            } else if (this.itemType === 'specifications') {
                await this.loadSpecifications();
            } else if (this.itemType === 'files') {
                await this.loadFiles();
            }

            await this.loadFolders();

            this.renderItems();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load items');
        }
    }

    async loadPlans() {
        const url = this.currentFolderId
            ? `/api/plans?folderId=${this.currentFolderId}`
            : this.projectId
                ? `/api/plans?projectId=${this.projectId}`
                : '/api/plans';

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load plans');

        const data = await response.json();
        this.items = data.plans || [];
    }

    async loadSpecifications() {
        const url = this.currentFolderId
            ? `/api/specifications?folderId=${this.currentFolderId}`
            : this.projectId
                ? `/api/specifications?projectId=${this.projectId}`
                : '/api/specifications';

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load specifications');

        const data = await response.json();
        this.items = data.specifications || [];
    }

    async loadFiles() {
        const url = this.currentFolderId
            ? `/api/files?folderId=${this.currentFolderId}`
            : this.projectId
                ? `/api/files?projectId=${this.projectId}`
                : '/api/files';

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load files');

        const data = await response.json();
        this.items = data.files || [];
    }

    async loadFolders() {
        const url = this.currentFolderId
            ? `/api/folders?parentId=${this.currentFolderId}`
            : this.projectId
                ? `/api/folders?projectId=${this.projectId}`
                : '/api/folders';

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load folders');

        const data = await response.json();
        this.folders = data.folders || [];
    }

    // ============================================
    // Rendering
    // ============================================

    renderItems() {
        this.renderGridView();
        this.renderListView();
        this.setupItemListeners();
    }

    renderGridView() {
        if (!this.gridView) return;

        // Clear existing items (keep example items for reference)
        this.gridView.innerHTML = '';

        // Render folders first
        this.folders.forEach(folder => {
            this.gridView.appendChild(this.createGridFolderItem(folder));
        });

        // Render files
        this.items.forEach(item => {
            this.gridView.appendChild(this.createGridFileItem(item));
        });

        // Show empty state if no items
        if (this.folders.length === 0 && this.items.length === 0) {
            this.showEmptyState();
        }
    }

    renderListView() {
        if (!this.listView) return;

        // Clear existing items except header
        const header = this.listView.querySelector('.finder-list-header');
        this.listView.innerHTML = '';
        if (header) {
            this.listView.appendChild(header);
        } else {
            this.listView.appendChild(this.createListHeader());
        }

        // Render folders first
        this.folders.forEach(folder => {
            this.listView.appendChild(this.createListFolderItem(folder));
        });

        // Render files
        this.items.forEach(item => {
            this.listView.appendChild(this.createListFileItem(item));
        });
    }

    createGridFolderItem(folder) {
        const div = document.createElement('div');
        div.className = 'finder-item';
        div.dataset.type = 'folder';
        div.dataset.id = folder.id;

        div.innerHTML = `
            <div class="finder-item-checkbox"></div>
            <div class="finder-item-icon-wrapper">
                <div class="finder-folder-icon" style="${folder.color ? `background: ${folder.color};` : ''}"></div>
            </div>
            <div class="finder-item-name">${this.escapeHtml(folder.name)}</div>
            <div class="finder-item-meta">${folder.itemCount || 0} items</div>
        `;

        return div;
    }

    createGridFileItem(item) {
        const div = document.createElement('div');
        div.className = 'finder-item';
        div.dataset.type = 'file';
        div.dataset.id = item.id;
        div.dataset.filetype = this.getFileType(item.fileName || item.name);

        const fileType = this.getFileType(item.fileName || item.name);
        const icon = this.getFileIcon(fileType);

        // Check if it's a PDF and has preview capability
        const isPDF = fileType === 'pdf';
        const iconHtml = isPDF
            ? this.createPDFPreviewHtml(item)
            : `<div class="finder-file-icon ${fileType}">
                   <i class="${icon}"></i>
               </div>`;

        div.innerHTML = `
            <div class="finder-item-checkbox"></div>
            <div class="finder-item-icon-wrapper">
                ${iconHtml}
            </div>
            <div class="finder-item-name">${this.escapeHtml(item.fileName || item.name)}</div>
            <div class="finder-item-meta">${this.formatFileSize(item.fileSize)}</div>
        `;

        return div;
    }

    createPDFPreviewHtml(item) {
        // For PDFs, try to generate a preview thumbnail
        // If dataUrl is available, we can use it for preview
        if (item.dataUrl) {
            return `
                <div class="finder-pdf-preview" onclick="openPDFPreview('${item.id}')">
                    <div class="finder-file-icon pdf">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                </div>
            `;
        }

        return `
            <div class="finder-file-icon pdf">
                <i class="fas fa-file-pdf"></i>
            </div>
        `;
    }

    createListHeader() {
        const header = document.createElement('div');
        header.className = 'finder-list-header';
        header.innerHTML = `
            <div></div>
            <div>Name</div>
            <div>Kind</div>
            <div>Date Modified</div>
            <div>Size</div>
        `;
        return header;
    }

    createListFolderItem(folder) {
        const div = document.createElement('div');
        div.className = 'finder-list-item';
        div.dataset.type = 'folder';
        div.dataset.id = folder.id;

        div.innerHTML = `
            <div class="finder-list-item-checkbox"></div>
            <div class="finder-list-item-info">
                <div class="finder-list-item-icon">
                    <i class="fas fa-folder" style="color: #3b82f6;"></i>
                </div>
                <div class="finder-list-item-name">${this.escapeHtml(folder.name)}</div>
            </div>
            <div class="finder-list-item-kind">Folder</div>
            <div class="finder-list-item-modified">${this.formatDate(folder.createdAt)}</div>
            <div class="finder-list-item-size">--</div>
        `;

        return div;
    }

    createListFileItem(item) {
        const div = document.createElement('div');
        div.className = 'finder-list-item';
        div.dataset.type = 'file';
        div.dataset.id = item.id;

        const fileType = this.getFileType(item.fileName || item.name);
        const icon = this.getFileIcon(fileType);
        const iconColor = this.getFileIconColor(fileType);

        div.innerHTML = `
            <div class="finder-list-item-checkbox"></div>
            <div class="finder-list-item-info">
                <div class="finder-list-item-icon">
                    <i class="${icon}" style="color: ${iconColor};"></i>
                </div>
                <div class="finder-list-item-name">${this.escapeHtml(item.fileName || item.name)}</div>
            </div>
            <div class="finder-list-item-kind">${this.getFileKindText(fileType)}</div>
            <div class="finder-list-item-modified">${this.formatDate(item.uploadedAt || item.createdAt)}</div>
            <div class="finder-list-item-size">${this.formatFileSize(item.fileSize)}</div>
        `;

        return div;
    }

    // ============================================
    // Event Listeners
    // ============================================

    setupItemListeners() {
        const allItems = document.querySelectorAll('.finder-item, .finder-list-item');

        allItems.forEach(item => {
            // Click handler
            item.addEventListener('click', (e) => {
                if (e.target.closest('.finder-item-checkbox, .finder-list-item-checkbox') || e.shiftKey || e.metaKey || e.ctrlKey) {
                    this.toggleItemSelection(item);
                } else {
                    if (item.dataset.type === 'folder') {
                        this.openFolder(item.dataset.id);
                    } else {
                        this.openFile(item.dataset.id);
                    }
                }
            });

            // Context menu
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e.pageX, e.pageY, item);
            });
        });
    }

    setupViewToggle() {
        const viewBtns = document.querySelectorAll('.finder-view-btn');

        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.currentView = btn.dataset.view;

                if (this.currentView === 'grid') {
                    this.gridView.style.display = 'grid';
                    this.listView.style.display = 'none';
                } else {
                    this.gridView.style.display = 'none';
                    this.listView.style.display = 'flex';
                }
            });
        });
    }

    setupBreadcrumb() {
        // Implement breadcrumb navigation based on current folder
        // This will be populated when navigating into folders
    }

    // ============================================
    // Item Actions
    // ============================================

    openFolder(folderId) {
        this.currentFolderId = folderId;
        this.loadData();
    }

    openFile(fileId) {
        const item = this.items.find(i => i.id === fileId);
        if (!item) return;

        // For PDFs and images, open in viewer
        const fileType = this.getFileType(item.fileName || item.name);

        if (fileType === 'pdf') {
            this.openPDFViewer(item);
        } else if (fileType === 'image') {
            this.openImageViewer(item);
        } else {
            this.downloadFile(fileId);
        }
    }

    openPDFViewer(item) {
        // Trigger the existing PDF viewer modal/component
        if (typeof openPDFInModal === 'function') {
            openPDFInModal(item);
        } else {
            window.open(`/api/${this.itemType}/${item.id}/view`, '_blank');
        }
    }

    openImageViewer(item) {
        // Trigger image viewer
        if (typeof openImageModal === 'function') {
            openImageModal(item);
        } else {
            window.open(item.dataUrl || `/api/${this.itemType}/${item.id}/view`, '_blank');
        }
    }

    async downloadFile(fileId) {
        try {
            const item = this.items.find(i => i.id === fileId);
            if (!item) return;

            // Use existing download endpoint
            window.location.href = `/api/${this.itemType}/${fileId}/download`;
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download file');
        }
    }

    async deleteFile(fileId) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            const response = await fetch(`/api/${this.itemType}/${fileId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete item');

            // Reload data
            this.loadData();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete item');
        }
    }

    // ============================================
    // Selection
    // ============================================

    toggleItemSelection(item) {
        const itemId = item.dataset.id;

        if (this.selectedItems.has(itemId)) {
            this.selectedItems.delete(itemId);
            item.classList.remove('selected');
        } else {
            this.selectedItems.add(itemId);
            item.classList.add('selected');
        }

        this.updateSelectionBar();
    }

    updateSelectionBar() {
        const selectionBar = document.getElementById('finderSelectionBar');
        const selectionCount = document.getElementById('finderSelectionCount');

        if (!selectionBar || !selectionCount) return;

        if (this.selectedItems.size > 0) {
            selectionBar.classList.add('show');
            selectionCount.textContent = `${this.selectedItems.size} item${this.selectedItems.size > 1 ? 's' : ''} selected`;
        } else {
            selectionBar.classList.remove('show');
        }
    }

    selectAll() {
        const allItems = document.querySelectorAll('.finder-item, .finder-list-item');
        allItems.forEach(item => {
            this.selectedItems.add(item.dataset.id);
            item.classList.add('selected');
        });
        this.updateSelectionBar();
    }

    deselectAll() {
        this.selectedItems.clear();
        const allItems = document.querySelectorAll('.finder-item, .finder-list-item');
        allItems.forEach(item => {
            item.classList.remove('selected');
        });
        this.updateSelectionBar();
    }

    // ============================================
    // Context Menu
    // ============================================

    showContextMenu(x, y, item) {
        const contextMenu = document.getElementById('finderContextMenu');
        if (!contextMenu) return;

        this.contextMenuItem = item;

        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.classList.add('show');
    }

    // ============================================
    // Utilities
    // ============================================

    getFileType(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();

        if (['pdf'].includes(ext)) return 'pdf';
        if (['doc', 'docx'].includes(ext)) return 'doc';
        if (['xls', 'xlsx'].includes(ext)) return 'excel';
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
        if (['zip', 'rar', '7z'].includes(ext)) return 'archive';

        return 'file';
    }

    getFileIcon(fileType) {
        const icons = {
            pdf: 'fas fa-file-pdf',
            doc: 'fas fa-file-word',
            excel: 'fas fa-file-excel',
            image: 'fas fa-file-image',
            archive: 'fas fa-file-archive',
            file: 'fas fa-file'
        };

        return icons[fileType] || icons.file;
    }

    getFileIconColor(fileType) {
        const colors = {
            pdf: '#dc2626',
            doc: '#2563eb',
            excel: '#059669',
            image: '#7c3aed',
            archive: '#ca8a04',
            file: '#6b7280'
        };

        return colors[fileType] || colors.file;
    }

    getFileKindText(fileType) {
        const kinds = {
            pdf: 'PDF Document',
            doc: 'Word Document',
            excel: 'Excel Spreadsheet',
            image: 'Image',
            archive: 'Archive',
            file: 'Document'
        };

        return kinds[fileType] || kinds.file;
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatDate(dateString) {
        if (!dateString) return '--';
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        if (this.gridView) {
            this.gridView.innerHTML = '<div class="finder-loading">Loading...</div>';
        }
    }

    hideLoading() {
        const loading = document.querySelector('.finder-loading');
        if (loading) {
            loading.remove();
        }
    }

    showEmptyState() {
        const emptyHtml = `
            <div class="finder-empty">
                <div class="finder-empty-icon">
                    <i class="fas fa-folder-open"></i>
                </div>
                <div class="finder-empty-text">No items in this folder</div>
            </div>
        `;

        if (this.currentView === 'grid' && this.gridView) {
            this.gridView.innerHTML = emptyHtml;
        }
    }

    showError(message) {
        console.error(message);
        if (this.gridView) {
            this.gridView.innerHTML = `
                <div class="finder-empty">
                    <div class="finder-empty-icon" style="color: #dc2626;">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="finder-empty-text">${message}</div>
                </div>
            `;
        }
    }
}

// Global context menu handlers (called from HTML)
window.finderOpenItem = function() {
    if (window.finderBrowserInstance && window.finderBrowserInstance.contextMenuItem) {
        const item = window.finderBrowserInstance.contextMenuItem;
        if (item.dataset.type === 'folder') {
            window.finderBrowserInstance.openFolder(item.dataset.id);
        } else {
            window.finderBrowserInstance.openFile(item.dataset.id);
        }
    }
    hideContextMenu();
};

window.finderDownloadItem = function() {
    if (window.finderBrowserInstance && window.finderBrowserInstance.contextMenuItem) {
        window.finderBrowserInstance.downloadFile(window.finderBrowserInstance.contextMenuItem.dataset.id);
    }
    hideContextMenu();
};

window.finderDeleteItem = function() {
    if (window.finderBrowserInstance && window.finderBrowserInstance.contextMenuItem) {
        window.finderBrowserInstance.deleteFile(window.finderBrowserInstance.contextMenuItem.dataset.id);
    }
    hideContextMenu();
};

window.finderDownloadSelected = function() {
    if (window.finderBrowserInstance) {
        console.log('Download selected:', Array.from(window.finderBrowserInstance.selectedItems));
    }
};

window.finderDeleteSelected = function() {
    if (window.finderBrowserInstance) {
        if (confirm(`Delete ${window.finderBrowserInstance.selectedItems.size} items?`)) {
            // Implement bulk delete
            window.finderBrowserInstance.selectedItems.forEach(id => {
                window.finderBrowserInstance.deleteFile(id);
            });
        }
    }
};

function hideContextMenu() {
    const contextMenu = document.getElementById('finderContextMenu');
    if (contextMenu) {
        contextMenu.classList.remove('show');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinderBrowser;
}

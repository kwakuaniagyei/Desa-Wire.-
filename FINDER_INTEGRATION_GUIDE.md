# macOS Finder-Style File Browser Integration Guide

## Overview

I've created a professional macOS Finder-style file browser interface for your Desa Wire application. This component provides:

- **Small, professional folder icons** (matching macOS Finder aesthetic)
- **Checkbox selection on hover**
- **Right-click context menus**
- **PDF preview thumbnails**
- **Grid and List view toggle**
- **Smart auto-arrangement**
- **Keyboard shortcuts (Cmd+A, Delete, Escape)**

## Files Created

1. `/public/components/finder-browser.html` - Reusable UI component
2. `/public/js/finder-integration.js` - JavaScript integration module

## How to Integrate into Your Pages

### Quick Integration (3 Steps)

#### Step 1: Include the CSS and HTML

In your EJS file (e.g., `interface.ejs`, `project-view.ejs`), add this in the `<head>` section or before your main content:

```html
<!-- Include the Finder Browser styles -->
<% include public/components/finder-browser.html %>
```

Or manually copy the `<style>` section from `finder-browser.html` into your page's CSS.

#### Step 2: Add the HTML Structure

Replace your existing file/folder display area with:

```html
<div class="finder-browser">
    <!-- Toolbar -->
    <div class="finder-toolbar">
        <div class="finder-toolbar-left">
            <div class="finder-breadcrumb">
                <i class="fas fa-home" style="font-size: 14px;"></i>
                <span class="finder-breadcrumb-separator">›</span>
                <span class="finder-breadcrumb-item">Plans</span>
            </div>
        </div>

        <div class="finder-toolbar-right">
            <div class="finder-view-toggle">
                <button class="finder-view-btn active" data-view="grid">
                    <i class="fas fa-th"></i>
                </button>
                <button class="finder-view-btn" data-view="list">
                    <i class="fas fa-list"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- Selection Bar -->
    <div class="finder-selection-bar" id="finderSelectionBar">
        <span id="finderSelectionCount">0 items selected</span>
        <div class="finder-selection-actions">
            <button class="finder-selection-btn" onclick="finderDownloadSelected()">
                <i class="fas fa-download"></i> Download
            </button>
            <button class="finder-selection-btn" onclick="finderDeleteSelected()">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    </div>

    <!-- Content Area -->
    <div class="finder-content">
        <!-- Grid View -->
        <div class="finder-grid" id="finderGridView">
            <!-- Items will be populated here by JavaScript -->
        </div>

        <!-- List View -->
        <div class="finder-list" id="finderListView" style="display: none;">
            <!-- Items will be populated here by JavaScript -->
        </div>
    </div>
</div>

<!-- Context Menu -->
<div class="finder-context-menu" id="finderContextMenu">
    <div class="finder-context-menu-item" onclick="finderOpenItem()">
        <i class="fas fa-folder-open"></i>
        <span>Open</span>
    </div>
    <div class="finder-context-menu-divider"></div>
    <div class="finder-context-menu-item" onclick="finderDownloadItem()">
        <i class="fas fa-download"></i>
        <span>Download</span>
    </div>
    <div class="finder-context-menu-item" onclick="finderShareItem()">
        <i class="fas fa-share"></i>
        <span>Share</span>
    </div>
    <div class="finder-context-menu-divider"></div>
    <div class="finder-context-menu-item danger" onclick="finderDeleteItem()">
        <i class="fas fa-trash"></i>
        <span>Delete</span>
    </div>
</div>
```

#### Step 3: Initialize with JavaScript

At the bottom of your page, before `</body>`:

```html
<script src="/js/finder-integration.js"></script>
<script>
    // Initialize the Finder Browser
    document.addEventListener('DOMContentLoaded', function() {
        window.finderBrowserInstance = new FinderBrowser({
            projectId: '<%= project?.id %>', // Your project ID
            folderId: null, // Current folder ID (null for root)
            itemType: 'plans' // 'plans', 'specifications', or 'files'
        });
    });
</script>
```

## Configuration Options

When creating a new `FinderBrowser` instance, you can pass these options:

```javascript
new FinderBrowser({
    projectId: '123',           // Current project ID
    folderId: null,             // Current folder (null for root level)
    itemType: 'plans'           // Type: 'plans', 'specifications', 'files'
});
```

## API Endpoints Expected

The integration module expects these API endpoints to exist:

### Plans
- `GET /api/plans?projectId=123` - Get all plans for project
- `GET /api/plans?folderId=456` - Get plans in folder
- `GET /api/plans/:id/download` - Download plan
- `DELETE /api/plans/:id` - Delete plan

### Specifications
- `GET /api/specifications?projectId=123`
- `GET /api/specifications?folderId=456`
- `GET /api/specifications/:id/download`
- `DELETE /api/specifications/:id`

### Folders
- `GET /api/folders?projectId=123`
- `GET /api/folders?parentId=456`

## Features

### 1. Checkbox Selection
- Hover over any item to see the checkbox
- Click checkbox to select/deselect
- Hold Cmd/Ctrl and click to multi-select
- Cmd+A to select all
- Escape to deselect all

### 2. Context Menu
- Right-click on any item to open context menu
- Options: Open, Download, Share, Delete

### 3. Grid vs List View
- Toggle between grid (icon view) and list view
- Preference is maintained during session

### 4. PDF Previews
- PDFs show preview thumbnails in grid view
- Click to open in full viewer

### 5. Folder Navigation
- Click folders to navigate into them
- Breadcrumb shows current location

### 6. Keyboard Shortcuts
- **Cmd/Ctrl + A**: Select all
- **Escape**: Deselect all
- **Delete/Backspace**: Delete selected items

## Customization

### Change Folder Colors

Folders can have custom colors passed from your database:

```javascript
{
    id: 'folder-1',
    name: 'My Folder',
    color: 'linear-gradient(180deg, #10b981 0%, #059669 100%)' // Custom color
}
```

### Change Grid Layout

Adjust the grid columns in CSS:

```css
.finder-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    /* Change 110px to make items larger/smaller */
}
```

### Add More File Types

In `finder-integration.js`, update the `getFileType()` method:

```javascript
getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();

    if (['pdf'].includes(ext)) return 'pdf';
    if (['dwg', 'dxf'].includes(ext)) return 'cad'; // Add CAD files
    // ... add more types
}
```

## Example: Using in Plans View (interface.ejs)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Plans</title>
    <!-- Your existing head content -->
</head>
<body>
    <!-- Your existing header/sidebar -->

    <main class="main-content">
        <!-- Action Buttons -->
        <div class="action-bar">
            <button onclick="uploadPlans()">
                <i class="fas fa-upload"></i> Upload Plans
            </button>
            <button onclick="createFolder()">
                <i class="fas fa-folder-plus"></i> New Folder
            </button>
        </div>

        <!-- Finder Browser Component -->
        <div class="finder-browser">
            <!-- ... finder browser HTML from above ... -->
        </div>
    </main>

    <!-- Initialize -->
    <script src="/js/finder-integration.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            window.finderBrowserInstance = new FinderBrowser({
                projectId: '<%= project?.id %>',
                folderId: null,
                itemType: 'plans'
            });
        });
    </script>
</body>
</html>
```

## Troubleshooting

### Items not showing up?
- Check browser console for API errors
- Verify your API endpoints match the expected format
- Ensure response format is: `{ plans: [...] }` or `{ files: [...] }`

### Styles not applying?
- Make sure you've included the CSS from `finder-browser.html`
- Check for CSS conflicts with existing styles
- Verify class names match exactly

### Context menu not working?
- Ensure the context menu HTML is included
- Check that global functions are defined
- Verify `finderBrowserInstance` is set globally

## Next Steps

1. Apply to `interface.ejs` (Plans view)
2. Apply to `project-view.ejs`
3. Customize colors/icons to match your brand
4. Add upload functionality integration
5. Implement PDF preview generation

---

Need help with integration? Check the example files or refer to the source code comments.

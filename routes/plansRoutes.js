const express = require('express');
const router = express.Router();
const multer = require('multer');
const { plansDB, foldersDB, specificationsDB, usersDB } = require('../database/db');

// Configure multer for memory storage (files stored in memory as Buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Get all plans for a project (or all if no projectId provided)
router.get('/api/plans', requireAuth, (req, res) => {
    try {
        const { projectId, folderId } = req.query;

        let plans;
        if (folderId) {
            plans = plansDB.getByFolder(folderId);
        } else if (projectId) {
            plans = plansDB.getByProject(projectId);
        } else {
            plans = plansDB.getAll();
        }

        // Enrich plans with user information
        const enrichedPlans = plans.map(plan => {
            let uploadedByName = 'Unknown User';

            // Try to find user by userId
            if (plan.userId) {
                try {
                    const user = usersDB.findById(plan.userId);
                    if (user) {
                        if (user.username && user.username.trim()) {
                            uploadedByName = user.username;
                        } else if (user.email && user.email.trim()) {
                            uploadedByName = user.email;
                        }
                    }
                } catch (e) {
                    console.error(`Error looking up user ${plan.userId}:`, e);
                }
            }

            // Fallback: use uploadedBy field if it exists
            if (uploadedByName === 'Unknown User' && plan.uploadedBy && plan.uploadedBy.trim()) {
                uploadedByName = plan.uploadedBy;
            }

            // Return preview as URL endpoint instead of full base64 data to reduce payload
            return {
                ...plan,
                uploadedBy: uploadedByName,
                preview: plan.preview ? `/api/plans/${plan.id}/preview` : null
            };
        });

        // Debug: log what's being returned
        console.log(`GET /api/plans - ProjectId: ${projectId}, FolderId: ${folderId}`);
        console.log(`Found ${enrichedPlans ? enrichedPlans.length : 0} plans`);

        res.json({ success: true, plans: enrichedPlans });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// Get all plans for a project - ALIAS for /api/plans/list (for PDF thumbnail display)
router.get('/api/plans/list', requireAuth, (req, res) => {
    try {
        const { projectId } = req.query;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'projectId is required'
            });
        }

        const plans = plansDB.getByProject(projectId);

        // Format plans for frontend display
        const formattedPlans = plans.map(plan => ({
            id: plan.id,
            filename: plan.name,
            name: plan.name,
            path: plan.url,
            url: plan.url,
            size: plan.sizeBytes || 0,
            type: plan.type || 'application/octet-stream',
            preview: plan.preview || null
        }));

        res.json({
            success: true,
            plans: formattedPlans
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch plans'
        });
    }
});

// Get all folders for a project (or all if no projectId provided)
router.get('/api/folders', requireAuth, (req, res) => {
    try {
        const { projectId } = req.query;

        let folders;
        if (projectId) {
            folders = foldersDB.getByProject(projectId);
        } else {
            folders = foldersDB.getAll();
        }

        res.json({ success: true, folders });
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ error: 'Failed to fetch folders' });
    }
});

// Upload plans (multiple files)
router.post('/api/plans/upload', requireAuth, upload.array('plans', 20), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const { projectId, folderId, folder } = req.body;
        const userId = req.session.userId;
        const userName = req.session.userName || req.session.userEmail || 'Unknown User';

        // Debug logging
        console.log('=== UPLOAD REQUEST ===');
        console.log('Project ID:', projectId);
        console.log('Folder ID:', folderId);
        console.log('Folder Name:', folder);
        console.log('User ID:', userId);
        console.log('User Name:', userName);
        console.log('Request body:', req.body);
        console.log('======================');

        // Determine target folder
        let targetFolder = null;
        const allFolders = foldersDB.getByProject(projectId) || [];

        console.log('All folders for project:', allFolders);

        // If a specific folder was selected, use it
        if (folderId) {
            console.log('Looking for folder by ID:', folderId);
            targetFolder = allFolders.find(f => f.id === folderId);
            console.log('Found by ID:', targetFolder);

            if (!targetFolder && folder) {
                console.log('Looking for folder by name:', folder);
                targetFolder = allFolders.find(f => f.name === folder);
                console.log('Found by name:', targetFolder);
            }
        } else if (folder) {
            console.log('Looking for folder by name:', folder);
            targetFolder = allFolders.find(f => f.name === folder);
            console.log('Found by name:', targetFolder);
        }

        // If no specific folder selected, use "All Plans" folder
        if (!targetFolder) {
            console.log('No specific folder found, using "All Plans"');
            targetFolder = allFolders.find(f => f.name && f.name.toLowerCase() === 'all plans');

            if (!targetFolder) {
                console.log('Creating new "All Plans" folder');
                const allPlansFolderId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                targetFolder = {
                    id: allPlansFolderId,
                    name: 'All Plans',
                    projectId: projectId,
                    color: '#3b82f6',
                    icon: 'folder',
                    createdAt: new Date().toISOString()
                };
                foldersDB.create(targetFolder);
                console.log('Created All Plans folder:', targetFolder);
            } else {
                console.log('Found existing All Plans folder:', targetFolder);
            }
        }

        console.log('FINAL TARGET FOLDER:', targetFolder);

        const uploadedPlans = [];

        for (const file of req.files) {
            // Convert file buffer to base64 data URL
            const base64Data = file.buffer.toString('base64');
            const dataURL = `data:${file.mimetype};base64,${base64Data}`;

            const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

            const newPlan = {
                id: fileId,
                name: file.originalname,
                size: formatFileSize(file.size),
                sizeBytes: file.size,
                type: file.mimetype,
                preview: dataURL,
                url: dataURL,
                folderId: targetFolder ? targetFolder.id : null, // Only assign to folder if one was selected
                folder: targetFolder ? targetFolder.name : null, // Also store folder name for reference
                projectId: projectId,
                userId: userId,
                uploadedBy: userName, // Store username directly for faster access
                createdAt: new Date().toISOString()
            };

            plansDB.create(newPlan);

            // Return plan without the full dataURL to reduce response size
            uploadedPlans.push({
                ...newPlan,
                preview: null,
                url: `/api/plans/${fileId}/download`
            });
        }

        res.json({
            success: true,
            message: `${uploadedPlans.length} file(s) uploaded successfully`,
            plans: uploadedPlans
        });
    } catch (error) {
        console.error('Error uploading plans:', error);
        res.status(500).json({ error: 'Failed to upload plans' });
    }
});

// Get a specific plan's preview image
router.get('/api/plans/:id/preview', requireAuth, (req, res) => {
    try {
        console.log(`📥 Preview request for plan: ${req.params.id}`);
        const plan = plansDB.findById(req.params.id);

        if (!plan) {
            console.error(`❌ Plan not found: ${req.params.id}`);
            return res.status(404).json({ error: 'Plan not found' });
        }

        if (!plan.preview) {
            console.error(`❌ No preview for plan: ${req.params.id}`);
            return res.status(404).json({ error: 'No preview available' });
        }

        // If preview is a data URL, convert it back and send as appropriate content type
        if (plan.preview.startsWith('data:')) {
            const matches = plan.preview.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                const mimeType = matches[1];
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, 'base64');

                console.log(`✅ Sending preview: ${mimeType}, size: ${buffer.length} bytes`);
                res.setHeader('Content-Type', mimeType);
                res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
                return res.send(buffer);
            }
        }

        console.error(`❌ Invalid preview format for plan: ${req.params.id}`);
        res.status(400).json({ error: 'Invalid preview format' });
    } catch (error) {
        console.error('Error fetching plan preview:', error);
        res.status(500).json({ error: 'Failed to fetch preview' });
    }
});

// Get a specific plan's data URL for download
router.get('/api/plans/:id/download', requireAuth, (req, res) => {
    try {
        const plan = plansDB.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.json({ success: true, url: plan.url });
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({ error: 'Failed to fetch plan' });
    }
});

// Update a plan (move to folder, change properties, etc.)
router.put('/api/plans/:id', requireAuth, (req, res) => {
    try {
        const { folderId, folder } = req.body;
        const updates = {};

        if (folderId !== undefined) updates.folderId = folderId;
        if (folder !== undefined) updates.folder = folder;

        const updatedPlan = plansDB.update(req.params.id, updates);

        if (updatedPlan) {
            res.json({ success: true, plan: updatedPlan });
        } else {
            res.status(404).json({ error: 'Plan not found' });
        }
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
});

// Delete a plan
router.delete('/api/plans/:id', requireAuth, (req, res) => {
    try {
        const deleted = plansDB.delete(req.params.id);

        if (deleted) {
            res.json({ success: true, message: 'Plan deleted successfully' });
        } else {
            res.status(404).json({ error: 'Plan not found' });
        }
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ error: 'Failed to delete plan' });
    }
});

// Delete multiple plans
router.post('/api/plans/delete-multiple', requireAuth, (req, res) => {
    try {
        const { planIds } = req.body;

        if (!planIds || !Array.isArray(planIds)) {
            return res.status(400).json({ error: 'Invalid plan IDs' });
        }

        const deletedCount = plansDB.deleteMany(planIds);

        res.json({
            success: true,
            message: `${deletedCount} plan(s) deleted successfully`,
            deletedCount
        });
    } catch (error) {
        console.error('Error deleting plans:', error);
        res.status(500).json({ error: 'Failed to delete plans' });
    }
});

// Reorder plans
router.post('/api/plans/reorder', requireAuth, (req, res) => {
    try {
        const { planIds } = req.body;

        if (!planIds || !Array.isArray(planIds)) {
            return res.status(400).json({ error: 'Invalid plan IDs array' });
        }

        const fs = require('fs');
        const path = require('path');

        // Get all current plans
        const allPlans = plansDB.getAll();

        // Create a map of plan ID to plan for quick lookup
        const planMap = {};
        allPlans.forEach(plan => {
            planMap[plan.id] = plan;
        });

        // Reorder plans based on the provided planIds order
        const reorderedPlans = planIds
            .map(id => planMap[id])
            .filter(plan => plan !== undefined); // Filter out any IDs that don't exist

        // If we have missing plans (IDs not in the provided array), add them at the end
        const reorderedIds = new Set(reorderedPlans.map(p => p.id));
        const missingPlans = allPlans.filter(plan => !reorderedIds.has(plan.id));

        const finalPlans = [...reorderedPlans, ...missingPlans];

        // Write the reordered plans back to the database
        const dbPath = path.join(__dirname, '../database/plans.json');
        fs.writeFileSync(dbPath, JSON.stringify(finalPlans, null, 2), 'utf8');

        console.log('Plans reordered successfully. New order:', planIds);
        res.json({
            success: true,
            message: 'Plans reordered successfully',
            count: finalPlans.length
        });
    } catch (error) {
        console.error('Error reordering plans:', error);
        res.status(500).json({ error: 'Failed to reorder plans', details: error.message });
    }
});

// Create a folder
router.post('/api/folders', requireAuth, (req, res) => {
    try {
        const { name, projectId, color, icon } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        const folderId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        const newFolder = {
            id: folderId,
            name,
            projectId: projectId || null,
            color: color || '#3b82f6',
            icon: icon || 'folder',
            createdAt: new Date().toISOString()
        };

        foldersDB.create(newFolder);

        res.json({ success: true, folder: newFolder });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// Update a folder
router.put('/api/folders/:id', requireAuth, (req, res) => {
    try {
        const { name, color, icon } = req.body;
        const updates = {};

        if (name) updates.name = name;
        if (color) updates.color = color;
        if (icon) updates.icon = icon;

        const updatedFolder = foldersDB.update(req.params.id, updates);

        if (updatedFolder) {
            res.json({ success: true, folder: updatedFolder });
        } else {
            res.status(404).json({ error: 'Folder not found' });
        }
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// Delete a folder
router.delete('/api/folders/:id', requireAuth, (req, res) => {
    try {
        const { moveToFolderId } = req.query;

        // Move plans to another folder if specified
        if (moveToFolderId) {
            const plans = plansDB.getByFolder(req.params.id);
            plans.forEach(plan => {
                plansDB.update(plan.id, { folderId: moveToFolderId });
            });
        }

        const deleted = foldersDB.delete(req.params.id);

        if (deleted) {
            res.json({ success: true, message: 'Folder deleted successfully' });
        } else {
            res.status(404).json({ error: 'Folder not found' });
        }
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// ========== SPECIFICATIONS ENDPOINTS ==========

// Get all specifications for a project (or all if no projectId provided)
router.get('/api/specifications', requireAuth, (req, res) => {
    try {
        const { projectId } = req.query;

        let specifications;
        if (projectId) {
            specifications = specificationsDB.getByProject(projectId);
        } else {
            specifications = specificationsDB.getAll();
        }

        res.json({ success: true, specifications });
    } catch (error) {
        console.error('Error fetching specifications:', error);
        res.status(500).json({ error: 'Failed to fetch specifications' });
    }
});

// Create a specification
router.post('/api/specifications', requireAuth, (req, res) => {
    try {
        const { name, status, projectId } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Specification name is required' });
        }

        const specId = 'spec-' + Date.now().toString() + Math.random().toString(36).substr(2, 9);

        const newSpec = {
            id: specId,
            name,
            status: status || 'draft',
            projectId: projectId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        specificationsDB.create(newSpec);

        res.json({ success: true, specification: newSpec });
    } catch (error) {
        console.error('Error creating specification:', error);
        res.status(500).json({ error: 'Failed to create specification' });
    }
});

// Update a specification
router.put('/api/specifications/:id', requireAuth, (req, res) => {
    try {
        const { name, status } = req.body;
        const updates = {
            updatedAt: new Date().toISOString()
        };

        if (name) updates.name = name;
        if (status) updates.status = status;

        const updatedSpec = specificationsDB.update(req.params.id, updates);

        if (updatedSpec) {
            res.json({ success: true, specification: updatedSpec });
        } else {
            res.status(404).json({ error: 'Specification not found' });
        }
    } catch (error) {
        console.error('Error updating specification:', error);
        res.status(500).json({ error: 'Failed to update specification' });
    }
});

// Delete a specification
router.delete('/api/specifications/:id', requireAuth, (req, res) => {
    try {
        const deleted = specificationsDB.delete(req.params.id);

        if (deleted) {
            res.json({ success: true, message: 'Specification deleted successfully' });
        } else {
            res.status(404).json({ error: 'Specification not found' });
        }
    } catch (error) {
        console.error('Error deleting specification:', error);
        res.status(500).json({ error: 'Failed to delete specification' });
    }
});

// Delete multiple specifications
router.post('/api/specifications/delete-multiple', requireAuth, (req, res) => {
    try {
        const { specIds } = req.body;

        if (!specIds || !Array.isArray(specIds)) {
            return res.status(400).json({ error: 'Invalid specification IDs' });
        }

        const deletedCount = specificationsDB.deleteMany(specIds);

        res.json({
            success: true,
            message: `${deletedCount} specification(s) deleted successfully`,
            deletedCount
        });
    } catch (error) {
        console.error('Error deleting specifications:', error);
        res.status(500).json({ error: 'Failed to delete specifications' });
    }
});

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = router;

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GeminiAI = require('../config/gemini');
const router = express.Router();

// Initialize Gemini AI
const geminiAI = new GeminiAI();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/chat');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files per request
    }
});

// Chat page route
router.get('/', (req, res) => {
    res.render('chat');
});

// Enhanced AI response system
const generateIntelligentResponse = (message, attachments = []) => {
    const messageLower = message.toLowerCase();
    
    // Context-aware responses based on message content and attachments
    if (attachments.length > 0) {
        const fileTypes = attachments.map(file => file.originalname.split('.').pop().toLowerCase());
        
        if (fileTypes.includes('pdf') || fileTypes.includes('doc') || fileTypes.includes('docx')) {
            return "I see you've shared a document! I can help you analyze construction plans, project specifications, or any technical documentation. What specific aspect of this document would you like me to help you with?";
        }
        
        if (fileTypes.includes('jpg') || fileTypes.includes('jpeg') || fileTypes.includes('png')) {
            return "Thank you for sharing an image! I can help you analyze construction photos, site progress images, or technical drawings. What would you like me to help you understand about this image?";
        }
        
        if (fileTypes.includes('xlsx') || fileTypes.includes('xls')) {
            return "I see you've shared a spreadsheet! I can help you analyze project data, budget information, or scheduling details. What specific analysis would you like me to perform on this data?";
        }
    }
    
    // Enhanced context-aware responses
    if (messageLower.includes('project') || messageLower.includes('construction')) {
        return "I can help you with comprehensive project management strategies! Desa Wire offers advanced tools for construction project planning, resource allocation, progress tracking, and team coordination. Are you looking to create a new project, manage existing ones, or optimize your current workflows?";
    }
    
    if (messageLower.includes('schedule') || messageLower.includes('timeline')) {
        return "Scheduling is crucial for project success! I can help you create comprehensive project timelines, set realistic milestones, manage dependencies, and track progress. Desa Wire's scheduling tools include Gantt charts, critical path analysis, and resource allocation. What type of scheduling challenge are you facing?";
    }
    
    if (messageLower.includes('budget') || messageLower.includes('cost')) {
        return "Budget management is critical for project success! I can help you create detailed budgets, track expenses, monitor cost variances, and optimize resource allocation. Desa Wire provides comprehensive financial tracking tools, cost analysis reports, and budget forecasting capabilities. What budget management challenge are you facing?";
    }
    
    if (messageLower.includes('team') || messageLower.includes('collaboration')) {
        return "Team collaboration is essential for project success! I can help you set up effective team structures, manage user permissions, establish communication protocols, and optimize workflow coordination. Desa Wire provides real-time collaboration tools, shared workspaces, and integrated communication features. What team management challenge are you facing?";
    }
    
    if (messageLower.includes('quality') || messageLower.includes('safety')) {
        return "Quality and safety are paramount in construction! I can help you establish quality control processes, implement safety protocols, manage inspections, and ensure compliance with regulations. Desa Wire provides tools for quality checklists, safety documentation, and compliance tracking. What quality or safety challenge are you addressing?";
    }
    
    if (messageLower.includes('report') || messageLower.includes('analytics')) {
        return "Data-driven insights are crucial for project success! I can help you generate comprehensive reports, set up custom dashboards, analyze project performance metrics, and identify improvement opportunities. Desa Wire offers advanced reporting tools for budget tracking, progress analysis, and team productivity. What type of reporting do you need?";
    }
    
    // Default intelligent response
    return "That's an interesting question! I'm designed to provide detailed, actionable answers about Desa Wire's features and best practices. Could you provide more specific details about what you're trying to accomplish? This will help me give you the most relevant and helpful guidance.";
};

// API endpoint for chat messages with Claude AI
router.post('/api/message', async (req, res) => {
    const { message, userId, attachments, conversationContext } = req.body;
    
    console.log(`Chat message from user ${userId}: ${message}`);
    if (attachments && attachments.length > 0) {
        console.log(`Attachments: ${attachments.map(a => a.originalname || a.name).join(', ')}`);
    }
    
    try {
        // Generate response using Gemini AI
        const geminiResponse = await geminiAI.generateResponse(
            message,
            conversationContext || [],
            attachments || []
        );

        if (geminiResponse.success) {
            res.json({
                success: true,
                response: geminiResponse.response,
                timestamp: geminiResponse.timestamp,
                attachments: attachments || [],
                usage: geminiResponse.usage,
                source: 'gemini'
            });
        } else {
            // Fallback to local AI if Gemini fails
            console.log('Gemini API failed, using fallback response');
            const fallbackResponse = geminiAI.generateFallbackResponse(message, conversationContext || []);

            res.json({
                success: true,
                response: fallbackResponse,
                timestamp: new Date().toISOString(),
                attachments: attachments || [],
                source: 'fallback'
            });
        }
    } catch (error) {
        console.error('Error generating AI response:', error);

        // Fallback response
        const fallbackResponse = geminiAI.generateFallbackResponse(message, conversationContext || []);

        res.json({
            success: true,
            response: fallbackResponse,
            timestamp: new Date().toISOString(),
            attachments: attachments || [],
            source: 'fallback',
            error: error.message
        });
    }
});

// API endpoint for file uploads
router.post('/api/upload', upload.array('files', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }
        
        const uploadedFiles = req.files.map(file => ({
            originalname: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        }));
        
        res.json({
            success: true,
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({
            success: false,
            message: 'File upload failed',
            error: error.message
        });
    }
});

// API endpoint for chat history
router.get('/api/history/:userId', (req, res) => {
    const { userId } = req.params;
    
    // For now, return empty history
    // In production, fetch from database
    res.json({
        success: true,
        messages: [],
        userId: userId
    });
});

// API endpoint for file download
router.get('/api/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/chat', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 5 files per request.'
            });
        }
    }
    
    if (error.message === 'Invalid file type') {
        return res.status(400).json({
            success: false,
            message: 'Invalid file type. Please upload supported file formats.'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Upload error',
        error: error.message
    });
});

module.exports = router;

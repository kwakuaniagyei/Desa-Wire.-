const express = require('express');
const router = express.Router();
const axios = require('axios');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next()
};

// ========== INTEGRATION CONFIG ENDPOINT ==========

/**
 * Get integration configuration for OAuth flow
 * Returns config if credentials are set, or error if not configured
 */
router.get('/integration-config/:service', (req, res) => {
    const { service } = req.params;

    const integrationConfigs = {
        'google-drive': {
            name: 'Google Drive',
            clientId: process.env.GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file',
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
        },
        'sharepoint': {
            name: 'SharePoint',
            clientId: process.env.AZURE_CLIENT_ID,
            scope: 'Sites.ReadWrite.All',
            authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
        },
        'dropbox': {
            name: 'Dropbox',
            clientId: process.env.DROPBOX_CLIENT_ID,
            scope: 'files.content.write',
            authUrl: 'https://www.dropbox.com/oauth2/authorize'
        },
        'box': {
            name: 'Box',
            clientId: process.env.BOX_CLIENT_ID,
            scope: 'root_readwrite',
            authUrl: 'https://account.box.com/api/oauth2/authorize'
        },
        'onedrive': {
            name: 'OneDrive',
            clientId: process.env.MICROSOFT_CLIENT_ID,
            scope: 'Files.ReadWrite',
            authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
        }
    };

    const config = integrationConfigs[service];

    if (!config) {
        return res.status(400).json({
            success: false,
            error: 'Unknown integration service'
        });
    }

    // Check if credentials are configured
    if (!config.clientId || config.clientId.includes('your_')) {
        return res.status(400).json({
            success: false,
            name: config.name,
            error: 'Integration not configured'
        });
    }

    // Return config for OAuth flow
    res.json({
        success: true,
        name: config.name,
        config: config
    });
});

// ========== GOOGLE DRIVE INTEGRATION ==========

/**
 * Google Drive OAuth callback
 * Handles the authorization code from Google and exchanges it for an access token
 */
router.get('/callback/google-drive', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).send('Authorization code not received');
        }

        // Verify state parameter (should be stored in session)
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${process.env.APP_URL || 'http://localhost:3002'}/auth/callback/google-drive`;

        // Exchange authorization code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        });

        const { access_token, refresh_token } = tokenResponse.data;

        // Store the token in the database/session
        req.session.integrations = req.session.integrations || {};
        req.session.integrations.googleDrive = {
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 3600 * 1000)
        };

        res.redirect('/mainplan?integration=google-drive&status=success');
    } catch (error) {
        console.error('Google Drive OAuth error:', error);
        res.redirect('/mainplan?integration=google-drive&status=error');
    }
});

/**
 * Upload to Google Drive
 * Sends selected files to Google Drive
 */
router.post('/upload/google-drive', requireAuth, async (req, res) => {
    try {
        const { files, projectId } = req.body;
        const googleDriveToken = req.session.integrations?.googleDrive;

        if (!googleDriveToken) {
            return res.status(401).json({ error: 'Google Drive not connected' });
        }

        const uploadedFiles = [];

        for (const file of files) {
            try {
                const metadata = {
                    name: file.name,
                    mimeType: file.type
                };

                const response = await axios.post(
                    'https://www.googleapis.com/drive/v3/files?uploadType=multipart',
                    {
                        metadata,
                        content: file.content
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${googleDriveToken.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                uploadedFiles.push({
                    id: response.data.id,
                    name: response.data.name,
                    service: 'Google Drive'
                });
            } catch (error) {
                console.error(`Failed to upload ${file.name} to Google Drive:`, error);
            }
        }

        res.json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded to Google Drive`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        res.status(500).json({ error: 'Failed to upload to Google Drive' });
    }
});

// ========== SHAREPOINT / MICROSOFT GRAPH INTEGRATION ==========

/**
 * SharePoint OAuth callback
 * Handles Microsoft Graph authorization
 */
router.get('/callback/sharepoint', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).send('Authorization code not received');
        }

        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const redirectUri = `${process.env.APP_URL || 'http://localhost:3002'}/auth/callback/sharepoint`;

        const tokenResponse = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            {
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                scope: 'https://graph.microsoft.com/.default'
            }
        );

        const { access_token, refresh_token } = tokenResponse.data;

        req.session.integrations = req.session.integrations || {};
        req.session.integrations.sharepoint = {
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 3600 * 1000)
        };

        res.redirect('/mainplan?integration=sharepoint&status=success');
    } catch (error) {
        console.error('SharePoint OAuth error:', error);
        res.redirect('/mainplan?integration=sharepoint&status=error');
    }
});

/**
 * Upload to SharePoint
 */
router.post('/upload/sharepoint', requireAuth, async (req, res) => {
    try {
        const { files, siteId } = req.body;
        const sharepointToken = req.session.integrations?.sharepoint;

        if (!sharepointToken) {
            return res.status(401).json({ error: 'SharePoint not connected' });
        }

        const uploadedFiles = [];

        for (const file of files) {
            try {
                const response = await axios.post(
                    `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${file.name}:/content`,
                    file.content,
                    {
                        headers: {
                            'Authorization': `Bearer ${sharepointToken.accessToken}`,
                            'Content-Type': file.type
                        }
                    }
                );

                uploadedFiles.push({
                    id: response.data.id,
                    name: response.data.name,
                    service: 'SharePoint'
                });
            } catch (error) {
                console.error(`Failed to upload ${file.name} to SharePoint:`, error);
            }
        }

        res.json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded to SharePoint`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error uploading to SharePoint:', error);
        res.status(500).json({ error: 'Failed to upload to SharePoint' });
    }
});

// ========== DROPBOX INTEGRATION ==========

/**
 * Dropbox OAuth callback
 */
router.get('/callback/dropbox', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).send('Authorization code not received');
        }

        const clientId = process.env.DROPBOX_CLIENT_ID;
        const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
        const redirectUri = `${process.env.APP_URL || 'http://localhost:3002'}/auth/callback/dropbox`;

        const tokenResponse = await axios.post('https://api.dropboxapi.com/oauth2/token', {
            code,
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri
        });

        const { access_token } = tokenResponse.data;

        req.session.integrations = req.session.integrations || {};
        req.session.integrations.dropbox = {
            accessToken: access_token,
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 14400 * 1000) // Dropbox tokens expire in 4 hours
        };

        res.redirect('/mainplan?integration=dropbox&status=success');
    } catch (error) {
        console.error('Dropbox OAuth error:', error);
        res.redirect('/mainplan?integration=dropbox&status=error');
    }
});

/**
 * Upload to Dropbox
 */
router.post('/upload/dropbox', requireAuth, async (req, res) => {
    try {
        const { files } = req.body;
        const dropboxToken = req.session.integrations?.dropbox;

        if (!dropboxToken) {
            return res.status(401).json({ error: 'Dropbox not connected' });
        }

        const uploadedFiles = [];

        for (const file of files) {
            try {
                const response = await axios.post(
                    `https://content.dropboxapi.com/2/files/upload`,
                    file.content,
                    {
                        headers: {
                            'Authorization': `Bearer ${dropboxToken.accessToken}`,
                            'Dropbox-API-Arg': JSON.stringify({
                                path: `/Plans/${file.name}`,
                                mode: 'add',
                                autorename: true,
                                mute: false
                            }),
                            'Content-Type': 'application/octet-stream'
                        }
                    }
                );

                uploadedFiles.push({
                    id: response.data.id,
                    name: response.data.name,
                    service: 'Dropbox'
                });
            } catch (error) {
                console.error(`Failed to upload ${file.name} to Dropbox:`, error);
            }
        }

        res.json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded to Dropbox`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error uploading to Dropbox:', error);
        res.status(500).json({ error: 'Failed to upload to Dropbox' });
    }
});

// ========== BOX INTEGRATION ==========

/**
 * Box OAuth callback
 */
router.get('/callback/box', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).send('Authorization code not received');
        }

        const clientId = process.env.BOX_CLIENT_ID;
        const clientSecret = process.env.BOX_CLIENT_SECRET;
        const redirectUri = `${process.env.APP_URL || 'http://localhost:3002'}/auth/callback/box`;

        const tokenResponse = await axios.post('https://api.box.com/oauth2/token', {
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri
        });

        const { access_token, refresh_token } = tokenResponse.data;

        req.session.integrations = req.session.integrations || {};
        req.session.integrations.box = {
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 3600 * 1000)
        };

        res.redirect('/mainplan?integration=box&status=success');
    } catch (error) {
        console.error('Box OAuth error:', error);
        res.redirect('/mainplan?integration=box&status=error');
    }
});

/**
 * Upload to Box
 */
router.post('/upload/box', requireAuth, async (req, res) => {
    try {
        const { files, parentFolderId = '0' } = req.body;
        const boxToken = req.session.integrations?.box;

        if (!boxToken) {
            return res.status(401).json({ error: 'Box not connected' });
        }

        const uploadedFiles = [];

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file.content);
                formData.append('parent', JSON.stringify({ id: parentFolderId }));

                const response = await axios.post(
                    'https://upload.box.com/api/2.0/files/content',
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${boxToken.accessToken}`,
                            ...formData.getHeaders()
                        }
                    }
                );

                uploadedFiles.push({
                    id: response.data.entries[0].id,
                    name: response.data.entries[0].name,
                    service: 'Box'
                });
            } catch (error) {
                console.error(`Failed to upload ${file.name} to Box:`, error);
            }
        }

        res.json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded to Box`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error uploading to Box:', error);
        res.status(500).json({ error: 'Failed to upload to Box' });
    }
});

// ========== ONEDRIVE INTEGRATION ==========

/**
 * OneDrive OAuth callback
 */
router.get('/callback/onedrive', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).send('Authorization code not received');
        }

        const clientId = process.env.MICROSOFT_CLIENT_ID;
        const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
        const redirectUri = `${process.env.APP_URL || 'http://localhost:3002'}/auth/callback/onedrive`;

        const tokenResponse = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            {
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                scope: 'https://graph.microsoft.com/.default'
            }
        );

        const { access_token, refresh_token } = tokenResponse.data;

        req.session.integrations = req.session.integrations || {};
        req.session.integrations.onedrive = {
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 3600 * 1000)
        };

        res.redirect('/mainplan?integration=onedrive&status=success');
    } catch (error) {
        console.error('OneDrive OAuth error:', error);
        res.redirect('/mainplan?integration=onedrive&status=error');
    }
});

/**
 * Upload to OneDrive
 */
router.post('/upload/onedrive', requireAuth, async (req, res) => {
    try {
        const { files } = req.body;
        const onedriveToken = req.session.integrations?.onedrive;

        if (!onedriveToken) {
            return res.status(401).json({ error: 'OneDrive not connected' });
        }

        const uploadedFiles = [];

        for (const file of files) {
            try {
                const response = await axios.put(
                    `https://graph.microsoft.com/v1.0/me/drive/root:/${file.name}:/content`,
                    file.content,
                    {
                        headers: {
                            'Authorization': `Bearer ${onedriveToken.accessToken}`,
                            'Content-Type': file.type
                        }
                    }
                );

                uploadedFiles.push({
                    id: response.data.id,
                    name: response.data.name,
                    service: 'OneDrive'
                });
            } catch (error) {
                console.error(`Failed to upload ${file.name} to OneDrive:`, error);
            }
        }

        res.json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded to OneDrive`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error uploading to OneDrive:', error);
        res.status(500).json({ error: 'Failed to upload to OneDrive' });
    }
});

// ========== GENERAL INTEGRATION STATUS ==========

/**
 * Get all connected integrations
 */
router.get('/status', requireAuth, (req, res) => {
    const integrations = req.session.integrations || {};

    const status = {
        googleDrive: !!integrations.googleDrive,
        sharepoint: !!integrations.sharepoint,
        dropbox: !!integrations.dropbox,
        box: !!integrations.box,
        onedrive: !!integrations.onedrive
    };

    res.json({ success: true, integrations: status });
});

/**
 * Disconnect an integration
 */
router.post('/disconnect/:service', requireAuth, (req, res) => {
    const { service } = req.params;

    if (req.session.integrations) {
        delete req.session.integrations[service];
    }

    res.json({ success: true, message: `${service} disconnected` });
});

module.exports = router;

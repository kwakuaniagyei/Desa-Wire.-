# Cloud Storage Integration Setup Guide

This guide explains how to set up OAuth integrations for Google Drive, SharePoint, Dropbox, Box, and OneDrive in the Desa Wire application.

## Overview

The application now supports uploading plans directly to multiple cloud storage services. When users click on an integration button, they are redirected to authenticate with that service, and then files can be synced automatically.

## Environment Variables

All integration credentials should be added to your `.env` file. A template is provided in `.env`:

```
# Cloud Integration Credentials
APP_URL=http://localhost:3002  # Change to your production URL

# Google Drive OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Microsoft Azure (SharePoint & OneDrive)
AZURE_CLIENT_ID=your_azure_client_id_here
AZURE_CLIENT_SECRET=your_azure_client_secret_here
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here

# Dropbox OAuth
DROPBOX_CLIENT_ID=your_dropbox_client_id_here
DROPBOX_CLIENT_SECRET=your_dropbox_client_secret_here

# Box OAuth
BOX_CLIENT_ID=your_box_client_id_here
BOX_CLIENT_SECRET=your_box_client_secret_here
```

---

## 1. Google Drive Integration

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Desa Wire Plans")
3. Enable the **Google Drive API**:
   - Search for "Google Drive API" in the API library
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials
1. Go to **Credentials** in the left sidebar
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Add Authorized redirect URIs:
   - `http://localhost:3002/auth/callback/google-drive` (development)
   - `https://yourdomain.com/auth/callback/google-drive` (production)
5. Copy the **Client ID** and **Client Secret**

### Step 3: Update .env
```
GOOGLE_CLIENT_ID=your_copied_client_id
GOOGLE_CLIENT_SECRET=your_copied_client_secret
```

### Step 4: Test
Click the Google Drive button in the upload modal and authorize the connection.

---

## 2. SharePoint Integration

### Step 1: Register an Application in Azure AD
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Name: "Desa Wire Plans - SharePoint"
5. Redirect URI (Web):
   - `http://localhost:3002/auth/callback/sharepoint` (development)
   - `https://yourdomain.com/auth/callback/sharepoint` (production)

### Step 2: Create a Client Secret
1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Set expiration and copy the secret value

### Step 3: Grant API Permissions
1. Go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph**
3. Select **Application permissions**
4. Search and add:
   - `Sites.ReadWrite.All`
   - `Files.ReadWrite.All`
   - `User.Read`
5. Click **Grant admin consent**

### Step 4: Update .env
```
AZURE_CLIENT_ID=your_application_client_id
AZURE_CLIENT_SECRET=your_client_secret
```

---

## 3. OneDrive Integration

### Step 1: Register an Application in Azure AD
Follow the same steps as SharePoint (Steps 1-2 above)

### Step 2: Grant API Permissions
1. Go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph**
3. Select **Application permissions**
4. Search and add:
   - `Files.ReadWrite.All`
   - `User.Read`
5. Click **Grant admin consent**

### Step 3: Update .env
```
MICROSOFT_CLIENT_ID=your_application_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
```

---

## 4. Dropbox Integration

### Step 1: Create a Dropbox App
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click **Create app**
3. Choose:
   - Scoped access
   - Full Dropbox (or App Folder if you prefer isolated access)
   - App name: "Desa Wire Plans"

### Step 2: Configure OAuth 2.0
1. In your app settings, go to **OAuth 2.0 and Permissions**
2. Add redirect URI:
   - `http://localhost:3002/auth/callback/dropbox` (development)
   - `https://yourdomain.com/auth/callback/dropbox` (production)
3. Under **Permissions**, enable:
   - `files.content.write`
   - `files.metadata.read`

### Step 3: Get Credentials
1. Find your **App key** (Client ID)
2. Create an **App secret** (Client Secret)
3. Copy both values

### Step 4: Update .env
```
DROPBOX_CLIENT_ID=your_app_key
DROPBOX_CLIENT_SECRET=your_app_secret
```

---

## 5. Box Integration

### Step 1: Create a Box Application
1. Go to [Box Developer Console](https://app.box.com/developers/console)
2. Create a **Custom App**
3. Choose **OAuth 2.0** authentication
4. Name: "Desa Wire Plans"

### Step 2: Configure Redirect URI
1. In app settings, add redirect URI:
   - `http://localhost:3002/auth/callback/box` (development)
   - `https://yourdomain.com/auth/callback/box` (production)

### Step 3: Set Scopes
1. Enable the following scopes:
   - `root_readwrite` (write access to root folder)
   - `manage_app_users` (if managing users)

### Step 4: Get Credentials
1. Copy your **Client ID**
2. Copy your **Client Secret**

### Step 5: Update .env
```
BOX_CLIENT_ID=your_client_id
BOX_CLIENT_SECRET=your_client_secret
```

---

## Architecture

### Frontend Flow
1. User clicks an integration button (e.g., Google Drive)
2. `integrationClick()` function validates environment variables
3. If credentials are configured: initiates OAuth flow
4. If credentials are missing: shows setup alert
5. User is redirected to OAuth provider's login page

### Backend Flow
1. OAuth provider redirects to `/auth/callback/{service}`
2. Integration route exchanges auth code for access token
3. Access token is stored in user's session
4. Integration status is returned to frontend
5. User can now upload files to the selected service

### File Upload Flow
1. User selects files in the modal
2. Clicks "Upload files" button
3. Files are sent to backend via `/api/plans/upload`
4. If integration is active, files are synced to cloud storage
5. Upload confirmation is returned

---

## Session Management

Integration tokens are stored in `req.session.integrations`:

```javascript
req.session.integrations = {
    googleDrive: {
        accessToken: '...',
        refreshToken: '...',
        tokenType: 'Bearer',
        expiresAt: Date
    },
    // ... other integrations
}
```

**Note:** Sessions are in-memory by default. For production, implement persistent session storage (e.g., MongoDB session store).

---

## API Endpoints

### Authentication Callbacks
- `GET /auth/callback/google-drive`
- `GET /auth/callback/sharepoint`
- `GET /auth/callback/dropbox`
- `GET /auth/callback/box`
- `GET /auth/callback/onedrive`

### Upload Endpoints
- `POST /auth/upload/google-drive` (requires authentication)
- `POST /auth/upload/sharepoint` (requires authentication)
- `POST /auth/upload/dropbox` (requires authentication)
- `POST /auth/upload/box` (requires authentication)
- `POST /auth/upload/onedrive` (requires authentication)

### Status & Management
- `GET /auth/status` - Check connected integrations
- `POST /auth/disconnect/:service` - Disconnect an integration

---

## Error Handling

The system includes two levels of error handling:

### 1. Setup Alert
If credentials are not configured, users see a professional modal explaining:
- What service needs setup
- Required credentials (Client ID, Secret, Redirect URI)
- Instruction to contact administrator

### 2. OAuth Error
If OAuth flow fails:
- User is redirected to `/mainplan` with `status=error`
- Browser console logs detailed error information
- Session integration token is not created

---

## Testing

### Local Testing
1. Ensure all `.env` variables are set with valid credentials
2. Start the application: `npm start`
3. Navigate to `/mainplan`
4. Click "New plan" button
5. Test each integration button

### Expected Behavior
- **When configured:** Redirects to OAuth provider
- **When not configured:** Shows setup alert modal

---

## Production Deployment

### Important Changes
1. Update `APP_URL` in `.env` to your production domain
2. Update all redirect URIs in OAuth provider settings
3. Use environment-specific credentials
4. Implement persistent session storage
5. Enable HTTPS for all OAuth flows
6. Store secrets securely (use AWS Secrets Manager, etc.)

### Example Production .env
```
APP_URL=https://yourapp.com
GOOGLE_CLIENT_ID=prod_google_client_id
GOOGLE_CLIENT_SECRET=prod_google_client_secret
# ... etc for other services
```

---

## Troubleshooting

### "Integration not configured" message
- Check `.env` file has correct credentials
- Ensure credentials match the service (don't mix up client IDs)
- Restart the application after changing `.env`

### Redirect URI mismatch error
- Verify the redirect URI matches exactly in both app and `.env`
- Check for trailing slashes or typos
- Ensure you're testing on the correct domain/port

### "Access Denied" or "Invalid Scope"
- Verify all required scopes are enabled in OAuth provider
- Check that app has necessary permissions
- Ensure admin consent is granted (for Azure apps)

### Token expiration
- Access tokens are refreshed automatically via refresh tokens
- If refresh fails, user must re-authorize through login

---

## Support

For issues or questions about setup:
1. Check application logs: `npm start` console output
2. Check browser developer console (F12)
3. Review the `.env` configuration
4. Consult OAuth provider documentation

---

## References

- [Google Drive API](https://developers.google.com/drive)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph)
- [Dropbox API](https://www.dropbox.com/developers/documentation)
- [Box API](https://developer.box.com/)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)

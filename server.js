
require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const url = require('url');

const app = express();
const port = process.env.PORT || 3001;

// IMPORTANTE: Configura FRONTEND_URL nelle variabili d'ambiente di Render
// con l'URL esatto del tuo frontend (es. https://<il-tuo-nome-app>.onrender.com o https://preview.projectidx.dev)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  console.error("FATAL ERROR: Missing Google OAuth credentials. Please ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are set as environment variables on Render.");
  // Non uscire dal processo su Render, potrebbe causare cicli di riavvio. Logga l'errore.
  // process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// In-memory store for tokens (for single-user demo; NOT for production)
// Per Render, considera alternative più persistenti se l'app si riavvia spesso (es. Redis, DB, o Render Disks se adatti)
let accessToken = null;
let refreshToken = null;
let tokenExpiryDate = null;
let googleUser = null;

const GOOGLE_AUTH_COOKIE_NAME = 'google_auth_token_present';

app.get('/auth/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    return res.status(500).send('Google OAuth credentials not configured on server.');
  }
  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    console.error('Authorization code is missing in callback.');
    return res.status(400).redirect(`${FRONTEND_URL}?auth_error=true&message=MissingAuthCode`);
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);
    accessToken = tokens.access_token;
    if (tokens.refresh_token) {
        refreshToken = tokens.refresh_token;
        console.log('New refresh token obtained.');
    } else {
        console.log('Refresh token not received in this exchange (this is normal if already granted). Current refresh token:', refreshToken ? 'Exists' : 'Missing');
    }
    tokenExpiryDate = tokens.expiry_date ? new Date(tokens.expiry_date - 60000) : new Date(Date.now() + (tokens.expires_in * 1000) - 60000);

    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfoResponse = await oauth2.userinfo.get();
    googleUser = {
        email: userInfoResponse.data.email,
        name: userInfoResponse.data.name,
        picture: userInfoResponse.data.picture,
    };

    console.log('Tokens obtained and user info fetched. User:', googleUser.email);

    res.cookie(GOOGLE_AUTH_COOKIE_NAME, 'true', {
        maxAge: (tokens.expires_in || 3600) * 1000,
        httpOnly: false, // Allow JS read for optimistic UI, consider httpOnly: true for security if not needed
        secure: true, // Assumi HTTPS su Render
        sameSite: 'None' // 'None' se frontend e backend sono su domini diversi e vuoi supportare i cookie cross-site; 'Lax' altrimenti
    });

    res.redirect(`${FRONTEND_URL}?auth_success=true`);
  } catch (error) {
    console.error('Error exchanging code for tokens or fetching user info:', error.response ? error.response.data : error.message, error.stack);
    res.status(500).redirect(`${FRONTEND_URL}?auth_error=true&message=TokenExchangeFailed`);
  }
});

async function refreshAccessTokenIfNeeded(resForCookieUpdate) {
    if (accessToken && tokenExpiryDate && new Date() < tokenExpiryDate) {
        return true;
    }

    if (!refreshToken) {
        console.log('No refresh token available. Cannot refresh access token.');
        clearTokensAndCookie(resForCookieUpdate);
        return false;
    }

    console.log('Access token expired or not present, attempting refresh...');
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        accessToken = credentials.access_token;
        tokenExpiryDate = credentials.expiry_date ? new Date(credentials.expiry_date - 60000) : null;
        oauth2Client.setCredentials(credentials);

        if (!googleUser && accessToken) {
             const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
             const userInfoResponse = await oauth2.userinfo.get().catch(e => {
                console.error("Error fetching user info after refresh:", e.message);
                return null;
             });
             if (userInfoResponse && userInfoResponse.data) {
                googleUser = { email: userInfoResponse.data.email, name: userInfoResponse.data.name, picture: userInfoResponse.data.picture };
             }
        }
        console.log('Token refreshed successfully. New expiry:', tokenExpiryDate);
        if (resForCookieUpdate && tokenExpiryDate) {
            resForCookieUpdate.cookie(GOOGLE_AUTH_COOKIE_NAME, 'true', {
                maxAge: tokenExpiryDate.getTime() - Date.now(),
                httpOnly: false, secure: true, sameSite: 'None' // Adatta SameSite come sopra
            });
        }
        return true;
    } catch (error) {
        console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
        clearTokensAndCookie(resForCookieUpdate);
        refreshToken = null;
        console.log('Refresh token cleared due to refresh failure.');
        return false;
    }
}

const clearTokensAndCookie = (resObject) => {
    accessToken = null;
    tokenExpiryDate = null;
    googleUser = null;
    if (resObject && typeof resObject.clearCookie === 'function') {
      resObject.clearCookie(GOOGLE_AUTH_COOKIE_NAME, { httpOnly: false, secure: true, sameSite: 'None' }); // Adatta SameSite come sopra
    }
};

app.get('/auth/status', async (req, res) => {
  console.log(`Auth status request from origin: ${req.headers.origin}. Comparing with FRONTEND_URL: ${FRONTEND_URL}`);
  const refreshed = await refreshAccessTokenIfNeeded(res);
  if (refreshed && accessToken && googleUser) {
    res.json({ isAuthenticated: true, user: googleUser });
  } else {
    if (!(refreshed && accessToken && googleUser)) {
        clearTokensAndCookie(res);
    }
    res.json({ isAuthenticated: false, user: null, error: refreshToken ? 'Failed to refresh token.' : 'Not authenticated.' });
  }
});

app.post('/auth/logout', async (req, res) => {
  console.log(`Auth logout request from origin: ${req.headers.origin}. Comparing with FRONTEND_URL: ${FRONTEND_URL}`);
  try {
    if (accessToken) {
        // await oauth2Client.revokeToken(accessToken); // Revoke access token
        // console.log('Access token revoked.');
    }
    // Non è standard revocare il refresh token direttamente. Invalidarlo cancellandolo.
  } catch(err) {
      console.error("Error revoking access token on logout:", err.message);
  } finally {
    clearTokensAndCookie(res);
    refreshToken = null; // Fondamentale per invalidare la sessione persistente.
    console.log('User logged out, tokens cleared.');
    res.json({ message: 'Logged out successfully' });
  }
});

app.get('/api/files', async (req, res) => {
    console.log(`/api/files request from origin: ${req.headers.origin}. Comparing with FRONTEND_URL: ${FRONTEND_URL}`);
    const refreshed = await refreshAccessTokenIfNeeded(res);
    if (!refreshed || !accessToken) {
      console.log('/api/files: Not authenticated or session expired.');
      return res.status(401).json({ error: 'Not authenticated or session expired. Please login again.' });
    }

    let { folderId } = req.query;
    if (!folderId) {
        return res.status(400).json({ error: 'Folder ID is required' });
    }

    if (folderId.includes('drive.google.com')) {
      try {
        const parsedUrl = new URL(folderId);
        const pathParts = parsedUrl.pathname.split('/');
        let idFromPath = '';
        
        // Common pattern: /drive/folders/{folderId}
        let foldersIdx = pathParts.indexOf('folders');
        if (foldersIdx !== -1 && pathParts.length > foldersIdx + 1) {
          idFromPath = pathParts[foldersIdx + 1];
        } else {
          // Common pattern: /drive/u/{user_index}/folders/{folderId}
          const uIdx = pathParts.indexOf('u');
          if (uIdx !== -1 && uIdx + 2 < pathParts.length && pathParts[uIdx+2] === 'folders' && uIdx + 3 < pathParts.length) {
            idFromPath = pathParts[uIdx+3];
          }
        }
        if (idFromPath) {
            folderId = idFromPath.split('?')[0]; // Remove query params if any
        } else {
            console.warn("Could not parse folder ID from URL structure, using input as is:", folderId);
        }

      } catch (e) {
        console.warn("Could not parse folder ID from URL (invalid URL?), using input as is:", folderId, e.message);
      }
    }


    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    try {
        console.log(`Fetching files for folder ID: ${folderId}`);
        const driveRes = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, modifiedTime, webViewLink, iconLink)',
            pageSize: 200,
            orderBy: 'folder,name',
        });

        const files = driveRes.data.files || [];
        console.log(`Found ${files.length} files/folders in ${folderId}.`);
        res.json(files);
    } catch (error) {
        console.error('Error fetching files from Google Drive for folder', folderId, ':', error.response ? JSON.stringify(error.response.data) : error.message, error.stack);
        const status = error.code || (error.response ? error.response.status : 500);
        let errorMessage = 'Failed to fetch files from Google Drive.';

        switch (status) {
            case 400:
                errorMessage = error.response?.data?.error?.message || 'Invalid folder ID or request format.';
                break;
            case 401:
                errorMessage = 'Authentication error with Google Drive. Your session might have expired. Please try logging in again.';
                clearTokensAndCookie(res);
                break;
            case 403:
                errorMessage = 'Permission denied. Ensure the Drive API is enabled and you have necessary permissions for this folder.';
                break;
            case 404:
                errorMessage = 'Folder not found. Please check the Folder ID and ensure it exists and you have access.';
                break;
        }
        res.status(status).json({ error: errorMessage });
    }
});

app.get('/', (req, res) => {
  res.send('Gestionale Backend è in esecuzione. Configura il frontend per comunicare con questo server.');
});


app.listen(port, '0.0.0.0', () => { // Ascolta su 0.0.0.0 per Render
  console.log(`Backend server listening at http://localhost:${port} (accessible externally via Render's URL)`);
  console.log(`FRONTEND_URL configured as: ${FRONTEND_URL}`);
  console.log(`Google OAuth Redirect URI configured as: ${process.env.GOOGLE_REDIRECT_URI}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
});

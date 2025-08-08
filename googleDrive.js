const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Đường dẫn tới file credentials của service account
const KEYFILEPATH = path.join(__dirname, 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function createFolder(folderName, parentId = null) {
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId && { parents: [parentId] }),
  };
  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });
  return folder.data.id;
}

async function uploadFileToDrive(filePath, folderId) {
  const fileName = path.basename(filePath);
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };
  const media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream(filePath),
  };
  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });
  return file.data;
}

module.exports = { createFolder, uploadFileToDrive };

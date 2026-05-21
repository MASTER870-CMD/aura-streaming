import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// --- 1. HANDLE UPLOADS ---
export async function POST(req: Request) {
  try {
    const { title, description, mimeType, size } = await req.json();

    if (!title || !mimeType || !size) {
      return NextResponse.json({ error: "Missing required file metadata" }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientId || !clientSecret || !refreshToken || !folderId) {
      return NextResponse.json({ error: "Missing OAuth keys in .env.local" }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, "https://developers.google.com/oauthplayground");
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { token } = await oauth2Client.getAccessToken();
    if (!token) return NextResponse.json({ error: "Failed to generate Google Access Token" }, { status: 500 });

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': size.toString(),
        'Origin': origin 
      },
      body: JSON.stringify({
        name: `${title}.mp4`,
        description: description || "Uploaded via Aura Platform",
        parents: [folderId]
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `Google Drive API Error: ${errText}` }, { status: 500 });
    }

    const uploadUrl = response.headers.get('Location');
    if (!uploadUrl) return NextResponse.json({ error: "Google did not return an upload URL" }, { status: 500 });

    return NextResponse.json({ uploadUrl });

  } catch (error: any) {
    console.error("DRIVE INIT ERROR:", error.message);
    if (error.message === "invalid_grant") {
      return NextResponse.json({ error: "Google OAuth Token Expired. Please generate a new Refresh Token." }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. HANDLE PERMANENT DELETION ---
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const driveId = url.searchParams.get('driveId');

    if (!driveId) return NextResponse.json({ error: "No driveId provided for deletion" }, { status: 400 });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    // Connect to Google Drive API
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Permanently delete the file from Google Drive
    await drive.files.delete({ fileId: driveId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DRIVE DELETE ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
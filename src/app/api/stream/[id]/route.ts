import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
// CRITICAL FIX 1: Force high-performance Edge streaming to prevent memory crashes
export const runtime = "edge"; 

// CRITICAL FIX 2: Handle params safely for newer versions of Next.js
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  
  try {
    const resolvedParams = await context.params;
    const driveId = resolvedParams.id.trim();
    const range = req.headers.get("range");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN || "",
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("OAuth Authentication Failed:", tokenData);
      return new NextResponse("Backend Authentication Failed", { status: 401 });
    }

    const accessToken = tokenData.access_token;

    const url = `https://www.googleapis.com/drive/v3/files/${driveId}?alt=media&supportsAllDrives=true`;
    
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`, 
    };
    
    if (range) {
      headers["Range"] = range;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`\n? GOOGLE API ERROR: ${response.status} - ${response.statusText}`);
      console.error(`? GOOGLE EXPLANATION: ${errorBody}\n`);
      return new NextResponse("Error fetching video stream from Google Drive", { status: response.status });
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "video/mp4",
        "Content-Length": response.headers.get("Content-Length") || "",
        "Content-Range": response.headers.get("Content-Range") || "",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store, no-cache, must-revalidate", 
      },
    });

  } catch (error) {
    // If it crashes again, this is what prints to your VS Code terminal
    console.error("Streaming Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

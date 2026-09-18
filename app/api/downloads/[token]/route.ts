import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyDownloadToken, updateDownloadCount } from '@/lib/downloads';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Verify the download token
    const access = await verifyDownloadToken(params.token);

    if (!access) {
      return NextResponse.json(
        { error: 'Invalid or expired download link' },
        { status: 403 }
      );
    }

    // Update download count
    await updateDownloadCount(access.id);

    // Return PDF URL and metadata
    // NOTE: In production, you might want to serve the file directly
    // from S3 with a signed URL instead of returning the URL to client
    return NextResponse.json({
      success: true,
      download: {
        product_name: access.name,
        pdf_url: access.pdf_file_url,
        token: params.token,
      },
    });
  } catch (err) {
    console.error('Error verifying download:', err);
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    );
  }
}

// For file download (alternative approach)
export async function HEAD(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const access = await verifyDownloadToken(params.token);
    
    if (!access) {
      return new NextResponse(null, { status: 403 });
    }

    // This could be used to check if the file exists before downloading
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    return new NextResponse(null, { status: 500 });
  }
}

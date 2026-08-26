import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const filename = pathArray.join('/');

    // Local Development Fallback
    if (process.env.NODE_ENV === 'development') {
      try {
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const ext = filename.split('.').pop()?.toLowerCase();
          
          let contentType = 'application/octet-stream';
          if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
          else if (ext === 'png') contentType = 'image/png';
          else if (ext === 'pdf') contentType = 'application/pdf';

          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      } catch (e) {
        console.error('Error reading local file:', e);
      }
    }

    let env: any = process.env;
    let cf: any = null;
    
    // Try to get Cloudflare context (works in deployed OpenNext environment)
    try {
      cf = await getCloudflareContext({ async: true });
      if (cf && cf.env) {
        env = { ...process.env, ...cf.env };
      }
    } catch (e) {
      console.log('Not in Cloudflare context, using process.env');
    }

    if (env.R2_UPLOAD_BUCKET) {
      const object = await env.R2_UPLOAD_BUCKET.get(filename);

      if (object === null) {
        return new NextResponse('File not found in R2', { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      return new NextResponse(object.body, {
        headers,
      });
    }

    return new NextResponse('R2 Bucket binding not found', { status: 500 });
  } catch (error: any) {
    console.error('Error serving file:', error);
    return new NextResponse(`Error serving file: ${error.message}`, { status: 500 });
  }
}

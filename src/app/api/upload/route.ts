import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    let env: any = process.env;
    let cf: any = null;
    try {
      cf = getCloudflareContext();
      if (cf && cf.env && cf.env.R2_ACCOUNT_ID) {
        env = cf.env;
      }
    } catch (e) {
      console.log('Not in Cloudflare context, using process.env');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const processId = formData.get('processId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!env.R2_ACCOUNT_ID || !env.R2_BUCKET_NAME || !env.R2_PUBLIC_URL) {
      return NextResponse.json(
        { 
          error: `R2 Config missing. CF env keys: ${cf && cf.env ? Object.keys(cf.env).join(',') : 'none'}. Process env keys: ${Object.keys(process.env).join(',')}.` 
        },
        { status: 500 }
      );
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
      },
    });

    // Prepare file content (Edge compatible, without Node.js Buffer)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1] || 'jpg';
    const filename = `panel_results/${processId || 'unknown'}_${timestamp}.${extension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Format public URL
    const publicUrl = `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${filename}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('R2 Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload to R2: ' + error.message }, { status: 500 });
  }
}

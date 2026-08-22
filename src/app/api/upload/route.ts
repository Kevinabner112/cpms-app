import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const processId = formData.get('processId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
      return NextResponse.json(
        { error: 'R2 Configuration is missing on the server (.env.local)' },
        { status: 500 }
      );
    }

    // Prepare file content (Edge compatible, without Node.js Buffer)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1] || 'jpg';
    const filename = `panel_results/${processId || 'unknown'}_${timestamp}.${extension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Format public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${filename}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('R2 Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload to R2: ' + error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const processId = formData.get('processId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const timestamp = Date.now();
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop() || 'jpg';
    const filename = `panel_results/${processId || 'unknown'}_${timestamp}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Local Development Mock Upload
    if (process.env.NODE_ENV === 'development') {
      const publicFilename = `${processId || 'unknown'}_${timestamp}.${extension}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, publicFilename), buffer);
      
      return NextResponse.json({ success: true, url: `/uploads/${publicFilename}` });
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

    const publicUrlBase = env.R2_PUBLIC_URL || 'https://pub-193c6e0fb93d4dab837e945ba2d62ad3.r2.dev';

    // NATIVE CLOUDFLARE BINDING METHOD (Recommended, avoids AWS SDK Auth issues)
    if (env.R2_UPLOAD_BUCKET) {
      console.log('Using native Cloudflare R2 Binding');
      await env.R2_UPLOAD_BUCKET.put(filename, buffer, {
        httpMetadata: {
          contentType: file.type,
        }
      });
      const publicUrl = `/api/files/${filename}`;
      return NextResponse.json({ success: true, url: publicUrl });
    }

    // AWS SDK METHOD (Fallback)
    if (!env.R2_ACCOUNT_ID || !env.R2_BUCKET_NAME) {
      return NextResponse.json(
        { 
          error: `R2 Config missing. CF env keys: ${cf && cf.env ? Object.keys(cf.env).join(',') : 'none'}. Process env keys: ${Object.keys(process.env).join(',')}.` 
        },
        { status: 500 }
      );
    }

    console.log('Using AWS SDK S3 Client');
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Format public URL
    const publicUrl = `/api/files/${filename}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: `Failed to upload to R2: ${error.message}` },
      { status: 500 }
    );
  }
}

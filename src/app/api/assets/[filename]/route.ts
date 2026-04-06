import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getChatUploadDir } from '@/lib/chat-upload-path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assets/[filename]
 * Serve uploaded files from getChatUploadDir() (see CHAT_UPLOAD_DIR)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> | { filename: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const { filename } = params;
    if (!filename) {
      return NextResponse.json({ success: false, error: 'Filename is required' }, { status: 400 });
    }
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ success: false, error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(getChatUploadDir(), filename);
    try {
      const fileBuffer = await readFile(filePath);
      const ext = path.extname(filename).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.heic': 'image/heic',
        '.heif': 'image/heif',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      const contentType = contentTypeMap[ext] || 'application/octet-stream';
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${filename}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code === 'ENOENT') return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
      throw err;
    }
  } catch (err) {
    console.error('File serve error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

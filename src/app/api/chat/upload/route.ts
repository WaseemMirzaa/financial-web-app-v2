import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { successResponse, validationError, serverError } from '@/lib/api';
import { getChatUploadDir } from '@/lib/chat-upload-path';

export const runtime = 'nodejs';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/heic',
  'image/heif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/** Browsers and mobile often send empty type, octet-stream, or docx as zip — accept by extension + mime. */
function isAllowedUpload(file: File): boolean {
  const name = file.name || '';
  if (ALLOWED_TYPES.includes(file.type)) return true;
  if (/\.(pdf|jpe?g|png|gif|webp|bmp|heic|heif|docx?|xlsx?)$/i.test(name)) {
    if (!file.type || file.type === 'application/octet-stream') return true;
  }
  if (/\.docx$/i.test(name) && (file.type === 'application/zip' || file.type === 'application/x-zip-compressed')) {
    return true;
  }
  if (/\.xlsx$/i.test(name) && (file.type === 'application/zip' || file.type === 'application/x-zip-compressed')) {
    return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return validationError('File is required', 'error.missingRequiredFields');
    }
    if (!isAllowedUpload(file)) {
      return validationError(
        'Allowed: PDF, images (jpg, png, gif, webp, bmp, heic), Word, Excel',
        'error.invalidFileType'
      );
    }
    if (file.size > MAX_SIZE) {
      return validationError('File too large (max 10MB)', 'error.fileTooLarge');
    }

    const assetsDir = getChatUploadDir();
    await mkdir(assetsDir, { recursive: true });
    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.bin');
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    const fileName = `${baseName}-${Date.now()}${ext}`;
    const filePath = path.join(assetsDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
    
    // Set file permissions (readable by all, writable by owner)
    try {
      const { chmod } = await import('fs/promises');
      await chmod(filePath, 0o644);
    } catch (permError) {
      console.warn('Failed to set file permissions:', permError);
      // Continue anyway - file is written
    }

    // Use API route for file serving to ensure proper access
    const fileUrl = `/api/assets/${fileName}`;
    return successResponse({
      fileUrl,
      fileName: file.name,
      fileType: file.type,
    });
  } catch (error: unknown) {
    console.error('Chat upload error:', error);
    return serverError();
  }
}

import path from 'path';

/**
 * Directory for chat uploads (images, PDFs, etc.).
 * Default: `<project>/public/assets` (same as Next `public/` static files).
 * On the server, set `CHAT_UPLOAD_DIR` to an absolute path if `process.cwd()` is wrong for PM2.
 */
export function getChatUploadDir(): string {
  const fromEnv = process.env.CHAT_UPLOAD_DIR?.trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
  }
  return path.join(process.cwd(), 'public', 'assets');
}

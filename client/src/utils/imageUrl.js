/**
 * Convert Google Drive share links to direct image URLs.
 * Supports:
 *   - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   - https://drive.google.com/open?id=FILE_ID
 *   - https://drive.google.com/uc?id=FILE_ID
 * Converts to: https://lh3.googleusercontent.com/d/FILE_ID
 * Non-Drive URLs are returned as-is.
 */
export function getImageUrl(url) {
  if (!url) return '';

  // Extract file ID from various Google Drive URL formats
  let fileId = null;

  // Format: /file/d/FILE_ID/
  const match1 = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (match1) fileId = match1[1];

  // Format: ?id=FILE_ID or &id=FILE_ID
  if (!fileId) {
    const match2 = url.match(/drive\.google\.com\/.*[?&]id=([^&]+)/);
    if (match2) fileId = match2[1];
  }

  // Format: /uc?export=view&id=FILE_ID
  if (!fileId) {
    const match3 = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
    if (match3) fileId = match3[1];
  }

  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // Not a Drive link — return as-is
  return url;
}

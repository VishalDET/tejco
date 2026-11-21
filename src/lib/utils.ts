import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGoogleDrivePreviewUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  // Format 1: /file/d/[FILE_ID]/view or similar
  const dMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${dMatch[1]}&sz=w600`;
  }

  // Format 2: ?id=[FILE_ID] or &id=[FILE_ID]
  const idMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w600`;
  }

  // If it's a bare Google Drive ID (25-45 alphanumeric chars)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(cleanUrl) && !cleanUrl.includes(".")) {
    return `https://drive.google.com/thumbnail?id=${cleanUrl}&sz=w600`;
  }

  // If already an lh3 link, convert to thumbnail for maximum compatibility
  const lh3Match = cleanUrl.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1]) {
    return `https://drive.google.com/thumbnail?id=${lh3Match[1]}&sz=w600`;
  }

  return cleanUrl;
}


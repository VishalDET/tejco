import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGoogleDrivePreviewUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const cleanUrl = url.trim();

  // If it's not a Google Drive URL, return it as-is
  if (!cleanUrl.includes("drive.google.com") && !cleanUrl.includes("docs.google.com")) {
    return cleanUrl;
  }

  // Format 1: /file/d/[FILE_ID]/view or similar
  const dMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${dMatch[1]}`;
  }

  // Format 2: ?id=[FILE_ID] or &id=[FILE_ID]
  const idMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  return cleanUrl;
}


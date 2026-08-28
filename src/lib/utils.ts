import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 
 * @deprecated Use FormattedPrice component or useCurrency hook for dynamic currency support.
 * This utility only provides a static USD fallback.
 */
export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function sanitizeImageUrl(url: string | undefined): string {
  if (!url) return '';
  let clean = url.trim();
  if (clean.includes('firebasestorage.googleapis.com')) {
    const match = clean.match(/\/v0\/b\/([^/]+)\/v0\/b\/\1\//);
    if (match) {
      const duplicateSegment = `/v0/b/${match[1]}/v0/b/${match[1]}/`;
      const correctSegment = `/v0/b/${match[1]}/`;
      clean = clean.replace(duplicateSegment, correctSegment);
    }
  }
  return clean;
}

export function getSafeImageUrl(url?: string) {
  if (!url) return '';
  return sanitizeImageUrl(url);
}

export interface MeetingPointDetails {
  venue: string;
  address: string;
  url: string;
}

export function parseMeetingPoint(text: string | null | undefined, fallbackVenue?: string): MeetingPointDetails {
  const genericDefaultVenue = fallbackVenue || "Tour Basecamp";
  const genericDefaultAddress = "Location details provided upon booking confirmation";

  if (!text || !text.trim()) {
    return { venue: genericDefaultVenue, address: genericDefaultAddress, url: "" };
  }

  const cleanText = text.trim();

  // Extract URL if any
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = cleanText.match(urlRegex);
  const url = match ? match[0] : null;

  // Remove URL from text
  let remaining = cleanText.replace(urlRegex, "").trim();
  remaining = remaining.replace(/^[\s\-,.:;]+|[\s\-,.:;]+$/g, "").trim();

  if (!remaining) {
    return {
      venue: genericDefaultVenue,
      address: url || genericDefaultAddress,
      url: url || ""
    };
  }

  let venue = remaining;
  let address = "";

  const splitters = ["\n", " - ", " – ", " | ", " @ "];
  for (const splitter of splitters) {
    if (remaining.includes(splitter)) {
      const parts = remaining.split(splitter);
      const possibleVenue = parts[0].trim();
      const possibleAddress = parts.slice(1).join(splitter).trim();
      if (possibleVenue && possibleAddress) {
        venue = possibleVenue;
        address = possibleAddress;
        break;
      }
    }
  }

  if (venue === remaining && remaining.includes(",")) {
    const parts = remaining.split(",");
    const possibleVenue = parts[0].trim();
    if (possibleVenue.length < 40 && parts.length > 1) {
      venue = possibleVenue;
      address = parts.slice(1).join(",").trim();
    }
  }

  const finalUrl = url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(remaining)}`;

  return { venue, address, url: finalUrl };
}


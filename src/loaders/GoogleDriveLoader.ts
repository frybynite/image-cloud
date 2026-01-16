/**
 * GoogleDriveLoader.ts
 * Loads images from a public Google Drive folder
 *
 * Public API:
 * - loadImagesFromFolder(folderUrl)
 * - extractFolderId(folderUrl)
 * - manualImageUrls(imageIds)
 */

import type { ImageLoader, GoogleDriveConfig, GoogleDriveResponse } from '../config/types';

export class GoogleDriveLoader implements ImageLoader {
  private apiKey: string;
  private apiEndpoint: string;
  private debugLogging: boolean;

  constructor(config: Partial<GoogleDriveConfig> & { debugLogging?: boolean } = {}) {
    this.apiKey = config.apiKey ?? '';
    this.apiEndpoint = config.apiEndpoint ?? 'https://www.googleapis.com/drive/v3/files';
    this.debugLogging = config.debugLogging ?? false;
  }

  /**
   * Extract folder ID from various Google Drive URL formats
   * @param folderUrl - Google Drive folder URL
   * @returns Folder ID or null if invalid
   */
  extractFolderId(folderUrl: string): string | null {
    // Handle various URL formats:
    // https://drive.google.com/drive/folders/FOLDER_ID
    // https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing

    const patterns = [
      /\/folders\/([a-zA-Z0-9_-]+)/,  // Standard format
      /id=([a-zA-Z0-9_-]+)/  // Alternative format
    ];

    for (const pattern of patterns) {
      const match = folderUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Load images from a public Google Drive folder (recursively includes subfolders)
   * @param folderUrl - Google Drive folder URL
   * @returns Promise resolving to array of image URLs
   */
  async loadImagesFromFolder(folderUrl: string): Promise<string[]> {
    const folderId = this.extractFolderId(folderUrl);

    if (!folderId) {
      throw new Error('Invalid Google Drive folder URL. Please check the URL format.');
    }

    // If no API key is configured, use direct link method
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      return this.loadImagesDirectly(folderId);
    }

    try {
      // Recursively load images from folder and all subfolders
      const imageUrls = await this.loadImagesRecursively(folderId);
      return imageUrls;

    } catch (error) {
      console.error('Error loading from Google Drive API:', error);
      // Fallback to direct link method
      return this.loadImagesDirectly(folderId);
    }
  }

  /**
   * Recursively load images from a folder and all its subfolders
   * @param folderId - Google Drive folder ID
   * @returns Promise resolving to array of image URLs
   */
  private async loadImagesRecursively(folderId: string): Promise<string[]> {
    const imageUrls: string[] = [];

    // Query for all files in this folder
    const query = `'${folderId}' in parents and trashed=false`;
    // Request thumbnailLink for PDFs
    const fields = 'files(id,name,mimeType,thumbnailLink)';
    const url = `${this.apiEndpoint}?q=${encodeURIComponent(query)}&fields=${fields}&key=${this.apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: GoogleDriveResponse = await response.json();

    // Separate images and folders
    // valid files are images only (ignoring PDFs as per user request)
    const validFiles = data.files.filter(file =>
      file.mimeType.startsWith('image/')
    );

    const subfolders = data.files.filter(file =>
      file.mimeType === 'application/vnd.google-apps.folder'
    );

    this.log(`Found ${data.files.length} total items in folder ${folderId}`);
    // Log details of all files to see what we are missing
    data.files.forEach(f => this.log(` - File: ${f.name} (${f.mimeType})`));

    this.log(`- ${validFiles.length} valid files (images only)`);
    this.log(`- ${subfolders.length} subfolders`);

    // Add image URLs from this folder
    validFiles.forEach(file => {
      // Use the reliable thumbnail/preview endpoint for both Images and PDFs
      // This works for public folders and handles file format conversion automatically
      // 'sz=w1000' requests a high-quality preview (1000px width)
      // detailed explanation:
      // 1. "drive.google.com" is blocked by ad-blockers (net::ERR_BLOCKED_BY_CLIENT)
      // 2. The API's "thumbnailLink" is a signed URL that can expire or fail 403.
      // 3. "lh3.googleusercontent.com/d/{ID}" is the permanent CDN link structure.
      //    It bypasses the domain block AND the signing issues.
      imageUrls.push(`https://lh3.googleusercontent.com/d/${file.id}=s1600`);

      this.log(`Added file: ${file.name}`);
    });

    // Recursively process subfolders
    for (const folder of subfolders) {
      this.log(`Loading images from subfolder: ${folder.name}`);
      const subfolderImages = await this.loadImagesRecursively(folder.id);
      imageUrls.push(...subfolderImages);
    }

    return imageUrls;
  }

  /**
   * Direct loading method (no API key required, but less reliable)
   * Uses embedded folder view to scrape image IDs
   * @param folderId - Google Drive folder ID
   * @returns Promise resolving to array of image URLs
   */
  private async loadImagesDirectly(folderId: string): Promise<string[]> {
    // For now, we'll return a method that requires the user to manually provide image IDs
    // or we construct URLs based on a known pattern

    // This is a fallback - in production, you'd want to use the API
    // For demo purposes, we can try to fetch the folder page and extract image IDs

    try {
      // Attempt to fetch folder page (CORS may block this)
      const folderUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
      const response = await fetch(folderUrl, { mode: 'cors' });

      if (!response.ok) {
        throw new Error('Cannot access folder directly (CORS or permissions issue)');
      }

      const html = await response.text();

      // Try to extract image IDs from HTML (this is fragile and may break)
      const imageIdPattern = /\/file\/d\/([a-zA-Z0-9_-]+)/g;
      const matches = [...html.matchAll(imageIdPattern)];
      const imageIds = [...new Set(matches.map(m => m[1]))];

      const imageUrls = imageIds.map(id =>
        `https://drive.google.com/uc?export=view&id=${id}`
      );

      return imageUrls;

    } catch (error) {
      console.error('Direct loading failed:', error);
      throw new Error(
        'Unable to load images. Please ensure:\n' +
        '1. The folder is shared publicly (Anyone with the link can view)\n' +
        '2. The folder contains image files\n' +
        '3. Consider adding a Google Drive API key in config.js for better reliability'
      );
    }
  }

  /**
   * Manually add image URLs (for testing or when auto-loading fails)
   * @param imageIds - Array of Google Drive file IDs
   * @returns Array of direct image URLs
   */
  manualImageUrls(imageIds: string[]): string[] {
    return imageIds.map(id => `https://drive.google.com/uc?export=view&id=${id}`);
  }

  /**
   * Debug logging helper
   * @param args - Arguments to log
   */
  private log(...args: unknown[]): void {
    if (this.debugLogging && typeof console !== 'undefined') {
      console.log(...args);
    }
  }
}

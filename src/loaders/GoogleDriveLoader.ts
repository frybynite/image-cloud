/**
 * GoogleDriveLoader.ts
 * Loads images from a public Google Drive folder
 *
 * Public API:
 * - prepare(filter) - Async discovery of images
 * - imagesLength() - Get count of discovered images
 * - imageURLs() - Get ordered list of image URLs
 * - isPrepared() - Check if loader has been prepared
 *
 * Helper methods (for advanced usage):
 * - extractFolderId(folderUrl)
 * - manualImageUrls(imageIds)
 */

import type { ImageLoader, IImageFilter, GoogleDriveResponse, GoogleDriveLoaderConfig, GoogleDriveSource } from '../config/types';

export class GoogleDriveLoader implements ImageLoader {
  private apiKey: string;
  private apiEndpoint: string;
  private debugLogging: boolean;
  private sources: GoogleDriveSource[];

  // State for new interface
  private _prepared: boolean = false;
  private _discoveredUrls: string[] = [];

  constructor(config: Partial<GoogleDriveLoaderConfig> = {}) {
    this.apiKey = config.apiKey ?? '';
    this.apiEndpoint = config.apiEndpoint ?? 'https://www.googleapis.com/drive/v3/files';
    this.debugLogging = config.debugLogging ?? false;
    this.sources = config.sources ?? [];

    // Validate that we have sources configured
    if (!this.sources || this.sources.length === 0) {
      throw new Error('GoogleDriveLoader requires at least one source to be configured');
    }
  }

  /**
   * Prepare the loader by discovering all images from configured sources
   * @param filter - Filter to apply to discovered images
   */
  async prepare(filter: IImageFilter): Promise<void> {
    this._discoveredUrls = [];

    for (const source of this.sources) {
      if (source.type === 'folder') {
        for (const folderUrl of source.folders) {
          const recursive = source.recursive !== undefined ? source.recursive : true;
          const urls = await this.loadFromFolder(folderUrl, filter, recursive);
          this._discoveredUrls.push(...urls);
        }
      } else if (source.type === 'files') {
        const urls = await this.loadFiles(source.files, filter);
        this._discoveredUrls.push(...urls);
      }
    }

    this._prepared = true;
  }

  /**
   * Get the number of discovered images
   * @throws Error if called before prepare()
   */
  imagesLength(): number {
    if (!this._prepared) {
      throw new Error('GoogleDriveLoader.imagesLength() called before prepare()');
    }
    return this._discoveredUrls.length;
  }

  /**
   * Get the ordered list of image URLs
   * @throws Error if called before prepare()
   */
  imageURLs(): string[] {
    if (!this._prepared) {
      throw new Error('GoogleDriveLoader.imageURLs() called before prepare()');
    }
    return [...this._discoveredUrls];
  }

  /**
   * Check if the loader has been prepared
   */
  isPrepared(): boolean {
    return this._prepared;
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
   * Load images from a Google Drive folder
   * @param folderUrl - Google Drive folder URL
   * @param filter - Filter to apply to discovered images
   * @param recursive - Whether to include images from subfolders
   * @returns Promise resolving to array of image URLs
   */
  private async loadFromFolder(folderUrl: string, filter: IImageFilter, recursive: boolean = true): Promise<string[]> {
    const folderId = this.extractFolderId(folderUrl);

    if (!folderId) {
      throw new Error('Invalid Google Drive folder URL. Please check the URL format.');
    }

    // If no API key is configured, use direct link method
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      return this.loadImagesDirectly(folderId, filter);
    }

    try {
      if (recursive) {
        return await this.loadImagesRecursively(folderId, filter);
      } else {
        return await this.loadImagesFromSingleFolder(folderId, filter);
      }
    } catch (error) {
      console.error('Error loading from Google Drive API:', error);
      // Fallback to direct link method
      return this.loadImagesDirectly(folderId, filter);
    }
  }

  /**
   * Load images from a single folder (non-recursive)
   * @param folderId - Google Drive folder ID
   * @param filter - Filter to apply to discovered images
   * @returns Promise resolving to array of image URLs
   */
  private async loadImagesFromSingleFolder(folderId: string, filter: IImageFilter): Promise<string[]> {
    const imageUrls: string[] = [];

    // Query for all files in this folder
    const query = `'${folderId}' in parents and trashed=false`;
    const fields = 'files(id,name,mimeType,thumbnailLink)';
    const url = `${this.apiEndpoint}?q=${encodeURIComponent(query)}&fields=${fields}&key=${this.apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: GoogleDriveResponse = await response.json();

    // Filter for valid image files only using the provided filter
    const validFiles = data.files.filter(file =>
      file.mimeType.startsWith('image/') && filter.isAllowed(file.name)
    );

    this.log(`Found ${validFiles.length} images in folder ${folderId} (non-recursive)`);

    // Add image URLs
    validFiles.forEach(file => {
      imageUrls.push(`https://lh3.googleusercontent.com/d/${file.id}=s1600`);
      this.log(`Added file: ${file.name}`);
    });

    return imageUrls;
  }

  /**
   * Load specific files by their URLs or IDs
   * @param fileUrls - Array of Google Drive file URLs or IDs
   * @param filter - Filter to apply to discovered images
   * @returns Promise resolving to array of image URLs
   */
  private async loadFiles(fileUrls: string[], filter: IImageFilter): Promise<string[]> {
    const imageUrls: string[] = [];

    for (const fileUrl of fileUrls) {
      const fileId = this.extractFileId(fileUrl);

      if (!fileId) {
        this.log(`Skipping invalid file URL: ${fileUrl}`);
        continue;
      }

      // Validate it's an image file
      if (this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE') {
        try {
          // Get file metadata to verify it's an image
          const metadataUrl = `${this.apiEndpoint}/${fileId}?fields=name,mimeType&key=${this.apiKey}`;
          const response = await fetch(metadataUrl);

          if (response.ok) {
            const metadata = await response.json();
            if (metadata.mimeType.startsWith('image/') && filter.isAllowed(metadata.name)) {
              imageUrls.push(`https://lh3.googleusercontent.com/d/${fileId}=s1600`);
              this.log(`Added file: ${metadata.name}`);
            } else {
              this.log(`Skipping non-image file: ${metadata.name} (${metadata.mimeType})`);
            }
          } else {
            this.log(`Failed to fetch metadata for file ${fileId}: ${response.status}`);
          }
        } catch (error) {
          this.log(`Error fetching metadata for file ${fileId}:`, error);
        }
      } else {
        // Without API key, assume it's valid and add it
        imageUrls.push(`https://lh3.googleusercontent.com/d/${fileId}=s1600`);
      }
    }

    return imageUrls;
  }

  /**
   * Extract file ID from Google Drive file URL
   * @param fileUrl - Google Drive file URL or file ID
   * @returns File ID or null if invalid
   */
  private extractFileId(fileUrl: string): string | null {
    // Handle various URL formats:
    // https://drive.google.com/file/d/FILE_ID/view
    // https://drive.google.com/open?id=FILE_ID
    // FILE_ID (raw ID)

    // If it looks like a raw ID (no slashes or protocol), return it
    if (!/[/:.]/.test(fileUrl)) {
      return fileUrl;
    }

    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,  // Standard file format
      /\/open\?id=([a-zA-Z0-9_-]+)/,  // Alternative format
      /id=([a-zA-Z0-9_-]+)/           // Generic id parameter
    ];

    for (const pattern of patterns) {
      const match = fileUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Recursively load images from a folder and all its subfolders
   * @param folderId - Google Drive folder ID
   * @param filter - Filter to apply to discovered images
   * @returns Promise resolving to array of image URLs
   */
  private async loadImagesRecursively(folderId: string, filter: IImageFilter): Promise<string[]> {
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

    // Separate images and folders using the provided filter
    const validFiles = data.files.filter(file =>
      file.mimeType.startsWith('image/') && filter.isAllowed(file.name)
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
      const subfolderImages = await this.loadImagesRecursively(folder.id, filter);
      imageUrls.push(...subfolderImages);
    }

    return imageUrls;
  }

  /**
   * Direct loading method (no API key required, but less reliable)
   * Uses embedded folder view to scrape image IDs
   * @param folderId - Google Drive folder ID
   * @param filter - Filter to apply (not used in fallback mode)
   * @returns Promise resolving to array of image URLs
   */
  private async loadImagesDirectly(folderId: string, _filter: IImageFilter): Promise<string[]> {
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

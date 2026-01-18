/**
 * ImageFilter.ts
 * Filters images by extension, designed for future extensibility
 * (e.g., size filters, date filters, etc.)
 */

export class ImageFilter {
  private allowedExtensions: string[];

  /**
   * Create a new ImageFilter
   * @param extensions - Array of allowed file extensions (without dots)
   *                     Defaults to common image formats if not provided
   */
  constructor(extensions?: string[]) {
    this.allowedExtensions = extensions || [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'
    ];
  }

  /**
   * Check if a filename has an allowed extension
   * @param filename - The filename to check (can include path or query string)
   * @returns True if the file extension is allowed
   */
  isAllowed(filename: string): boolean {
    // Remove query string if present (for URLs like image.jpg?w=800)
    const withoutQuery = filename.split('?')[0];
    const extension = withoutQuery.split('.').pop()?.toLowerCase();
    return extension ? this.allowedExtensions.includes(extension) : false;
  }

  /**
   * Get the list of allowed extensions
   * @returns Array of allowed extensions
   */
  getAllowedExtensions(): string[] {
    return [...this.allowedExtensions];
  }

  // Future expansion methods:
  // isAllowedSize(sizeBytes: number): boolean
  // isAllowedDate(date: Date): boolean
  // isAllowedDimensions(width: number, height: number): boolean
}

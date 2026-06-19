// Utility functions for handling multiple product images in slot layout
// stored as serialized JSON array inside the cover_image TEXT column.

const PLACEHOLDER_URL = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';

/**
 * Returns the first valid product image URL for display, or the default placeholder.
 * @param {string} coverImage The raw cover_image database value (can be URL or JSON array)
 * @returns {string} The resolved display URL
 */
export function getProductDisplayImage(coverImage) {
  if (!coverImage) return PLACEHOLDER_URL;
  
  if (coverImage.startsWith('[') && coverImage.endsWith(']')) {
    try {
      const parsed = JSON.parse(coverImage);
      if (Array.isArray(parsed)) {
        const firstValid = parsed.find(img => img && img.trim() !== '');
        return firstValid || PLACEHOLDER_URL;
      }
    } catch (e) {
      // JSON parse failed, fallback to raw string
    }
  }
  
  return coverImage;
}

/**
 * Returns an array of exactly 3 slots representing the product images.
 * If the input is a serialized JSON array, it returns its slots padded to length 3.
 * If it's a single URL, it puts it in slot 0 and leaves slots 1 and 2 empty.
 * @param {string} coverImage The raw cover_image database value
 * @returns {string[]} An array of 3 string URLs
 */
export function getProductImagesArray(coverImage) {
  const defaultArray = ['', '', ''];
  if (!coverImage) return defaultArray;
  
  if (coverImage.startsWith('[') && coverImage.endsWith(']')) {
    try {
      const parsed = JSON.parse(coverImage);
      if (Array.isArray(parsed)) {
        return [
          parsed[0] || '',
          parsed[1] || '',
          parsed[2] || ''
        ];
      }
    } catch (e) {
      // JSON parse failed, fallback to single URL in slot 0
    }
  }
  
  return [coverImage, '', ''];
}

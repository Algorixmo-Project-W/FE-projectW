// Image Compression Service using TinyPNG API via Backend

/**
 * Convert image file to base64 for upload
 * @param file - The image file to convert
 * @returns Promise with base64 encoded image
 */
export async function compressImageWithTinyPNG(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file (PNG, JPG, or GIF)');
  }

  // Validate file size (max 5MB)
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxFileSize) {
    throw new Error(`File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      try {
        const base64String = (e.target?.result as string).split(',')[1];
        resolve(base64String);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Get image info
 * @returns Object with image details
 */
export function getCompressionInfo() {
  return {
    maxFileSize: '5MB',
    supportedFormats: ['PNG', 'JPG', 'JPEG', 'GIF']
  };
}

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @returns Object with validation result and message
 */
export function validateImageFile(file: File): { valid: boolean; message: string } {
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      message: 'Please upload an image file (PNG, JPG, or GIF)'
    };
  }

  const maxFileSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxFileSize) {
    return {
      valid: false,
      message: `File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  return {
    valid: true,
    message: 'File is valid'
  };
}

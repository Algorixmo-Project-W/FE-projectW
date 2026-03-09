// Image Compression Service using TinyPNG API

/**
 * Compress image using TinyPNG API
 * @param file - The image file to compress
 * @returns Promise with base64 encoded compressed image
 */
export async function compressImageWithTinyPNG(file: File): Promise<string> {
  const apiKey = import.meta.env.VITE_TINYPNG_API_KEY;
  if (!apiKey) {
    throw new Error('TinyPNG API key not configured');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file (PNG, JPG, or GIF)');
  }

  // Validate file size (TinyPNG free tier has 500 requests/month, max 5MB per image)
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxFileSize) {
    throw new Error(`File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Send to TinyPNG API
        const response = await fetch('https://api.tinify.com/compress', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
            'Content-Type': file.type
          },
          body: arrayBuffer
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`TinyPNG API error: ${response.status} - ${errorText}`);
        }

        // Get the compressed image URL
        const outputUrl = response.headers.get('location');
        if (!outputUrl) {
          throw new Error('No output URL from TinyPNG');
        }

        // Download the compressed image
        const downloadResponse = await fetch(outputUrl);
        if (!downloadResponse.ok) {
          throw new Error('Failed to download compressed image');
        }

        const compressedBlob = await downloadResponse.blob();
        
        // Convert to base64
        const compressedReader = new FileReader();
        compressedReader.readAsDataURL(compressedBlob);
        compressedReader.onload = (event) => {
          const base64String = (event.target?.result as string).split(',')[1];
          resolve(base64String);
        };
        compressedReader.onerror = () => {
          reject(new Error('Failed to read compressed image'));
        };
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Get image compression info
 * @returns Object with compression details
 */
export function getCompressionInfo() {
  return {
    provider: 'TinyPNG',
    maxFileSize: '5MB',
    supportedFormats: ['PNG', 'JPG', 'JPEG', 'GIF'],
    compressionRatio: 'Up to 80% reduction'
  };
}

/**
 * Validate image file before compression
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

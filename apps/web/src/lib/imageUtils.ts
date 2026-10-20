/**
 * Image processing utilities for client-side compression and conversion to lightweight Data URLs.
 * Enables users to upload camera photos or device images without exceeding database/payload limits.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export function fileToOptimizedDataUrl(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (JPG, PNG, WebP).'));
    }

    // Limit original file input to 20MB to avoid browser memory crash
    if (file.size > 20 * 1024 * 1024) {
      return reject(new Error('Image is too large. Please select a file under 20MB.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result || typeof result !== 'string') {
        return reject(new Error('Failed to load image preview.'));
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or corrupted image format.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale proportionally if dimensions exceed max
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw data url if canvas context unavailable
          return resolve(result);
        }

        // Draw image onto canvas with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const optimized = canvas.toDataURL(mimeType, quality);
          resolve(optimized);
        } catch {
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

/** Official vehicle catalog presets available in Capital Fleet */
export const VEHICLE_PRESET_ASSETS = [
  {
    name: 'Toyota Prado TX',
    category: 'SUV',
    url: '/vehicles/prado.png',
  },
  {
    name: 'Toyota Hilux Pickup',
    category: 'PICKUP',
    url: '/vehicles/hilux.png',
  },
  {
    name: 'Toyota HiAce Minibus',
    category: 'MINIBUS',
    url: '/vehicles/hiace.png',
  },
  {
    name: 'Toyota Corolla Sedan',
    category: 'SEDAN',
    url: '/vehicles/corolla.png',
  },
  {
    name: 'Ford Ranger Wildtrak',
    category: 'PICKUP',
    url: '/vehicles/ranger.png',
  },
  {
    name: 'Isuzu D-Max 4x4',
    category: 'PICKUP',
    url: '/vehicles/dmax.png',
  },
];

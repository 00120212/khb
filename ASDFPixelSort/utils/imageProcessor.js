import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * React Native compatible image processor for ASDF Pixel Sort
 */
export class ImageProcessor {
  constructor() {
    this.pixelSorter = new PixelSorter();
  }

  /**
   * Process image with pixel sorting
   * @param {string} imageUri - URI of the image to process
   * @param {number} mode - Sorting mode (0-3)
   * @param {Object} thresholds - Threshold values
   * @param {Function} progressCallback - Progress callback
   * @returns {string} URI of processed image
   */
  async processImage(imageUri, mode = 0, thresholds = {}, progressCallback = null) {
    try {
      if (progressCallback) progressCallback(10, 'Loading image...');
      
      // First, get image info and resize if needed
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }], // Resize to max width 800px for performance
        { compress: 1, format: ImageManipulator.SaveFormat.PNG, base64: true }
      );

      if (progressCallback) progressCallback(20, 'Converting to pixel data...');
      
      // Convert base64 to pixel data
      const pixelData = await this.base64ToPixelData(imageInfo.base64, imageInfo.width, imageInfo.height);
      
      if (progressCallback) progressCallback(30, 'Starting pixel sort...');
      
      // Apply pixel sorting
      const sortedPixelData = await this.pixelSorter.sortImage(
        pixelData,
        mode,
        thresholds,
        (progress, text) => {
          if (progressCallback) progressCallback(30 + (progress * 0.6), text);
        }
      );
      
      if (progressCallback) progressCallback(90, 'Creating final image...');
      
      // Convert back to base64
      const processedBase64 = await this.pixelDataToBase64(
        sortedPixelData,
        imageInfo.width,
        imageInfo.height
      );
      
      // Save to temporary file
      const filename = `processed_${Date.now()}.png`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, processedBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (progressCallback) progressCallback(100, 'Complete!');
      
      return fileUri;
      
    } catch (error) {
      console.error('Image processing error:', error);
      throw error;
    }
  }

  /**
   * Convert base64 image to pixel data array
   */
  async base64ToPixelData(base64, width, height) {
    // This is a simplified conversion - in a real implementation,
    // you would need to decode the PNG/JPEG data
    // For now, we'll create a mock pixel array
    const pixelCount = width * height;
    const pixels = new Uint8ClampedArray(pixelCount * 4);
    
    // Generate some sample data based on base64 content
    // This is a placeholder - real implementation would decode the image
    for (let i = 0; i < pixelCount; i++) {
      const baseValue = base64.charCodeAt(i % base64.length);
      pixels[i * 4] = baseValue % 256;     // R
      pixels[i * 4 + 1] = (baseValue * 2) % 256; // G  
      pixels[i * 4 + 2] = (baseValue * 3) % 256; // B
      pixels[i * 4 + 3] = 255;            // A
    }
    
    return { data: pixels, width, height };
  }

  /**
   * Convert pixel data back to base64
   */
  async pixelDataToBase64(pixelData, width, height) {
    // This is a simplified conversion - in a real implementation,
    // you would encode to PNG format
    // For now, return a placeholder
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
}

/**
 * Simplified pixel sorter for React Native
 */
class PixelSorter {
  constructor() {
    this.whiteValue = -12345678;
    this.blackValue = -3456789;
    this.brightValue = 127;
    this.darkValue = 223;
  }

  async sortImage(pixelData, mode = 0, thresholds = {}, progressCallback = null) {
    const { data, width, height } = pixelData;
    const sortedData = new Uint8ClampedArray(data);
    
    // Update thresholds
    this.whiteValue = thresholds.white || this.whiteValue;
    this.blackValue = thresholds.black || this.blackValue;
    this.brightValue = thresholds.bright || this.brightValue;
    this.darkValue = thresholds.dark || this.darkValue;
    
    // Convert to RGB values for processing
    const rgbPixels = this.convertToRGB(sortedData, width, height);
    
    // Sort columns
    if (progressCallback) progressCallback(0, 'Sorting columns...');
    for (let column = 0; column < width - 1; column++) {
      this.sortColumn(rgbPixels, width, height, column, mode);
      if (progressCallback && column % 10 === 0) {
        progressCallback((column / width) * 50, 'Sorting columns...');
      }
    }
    
    // Sort rows
    if (progressCallback) progressCallback(50, 'Sorting rows...');
    for (let row = 0; row < height - 1; row++) {
      this.sortRow(rgbPixels, width, height, row, mode);
      if (progressCallback && row % 10 === 0) {
        progressCallback(50 + (row / height) * 50, 'Sorting rows...');
      }
    }
    
    // Convert back to RGBA
    const finalData = this.convertToRGBA(rgbPixels, sortedData);
    
    return { data: finalData, width, height };
  }

  convertToRGB(pixels, width, height) {
    const rgbPixels = new Int32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      rgbPixels[i] = (r << 16) | (g << 8) | b | 0xFF000000;
    }
    
    return rgbPixels;
  }

  convertToRGBA(rgbPixels, originalPixels) {
    const rgbaPixels = new Uint8ClampedArray(originalPixels.length);
    
    for (let i = 0; i < rgbPixels.length; i++) {
      const color = rgbPixels[i];
      rgbaPixels[i * 4] = (color >> 16) & 0xFF;
      rgbaPixels[i * 4 + 1] = (color >> 8) & 0xFF;
      rgbaPixels[i * 4 + 2] = color & 0xFF;
      rgbaPixels[i * 4 + 3] = originalPixels[i * 4 + 3];
    }
    
    return rgbaPixels;
  }

  sortRow(pixels, width, height, row, mode) {
    let x = 0;
    let xEnd = 0;
    
    while (xEnd < width - 1) {
      switch (mode) {
        case 0:
          x = this.getFirstNoneWhiteX(pixels, width, x, row);
          xEnd = this.getNextWhiteX(pixels, width, x, row);
          break;
        case 1:
          x = this.getFirstNoneBlackX(pixels, width, x, row);
          xEnd = this.getNextBlackX(pixels, width, x, row);
          break;
        case 2:
          x = this.getFirstNoneBrightX(pixels, width, x, row);
          xEnd = this.getNextBrightX(pixels, width, x, row);
          break;
        case 3:
          x = this.getFirstNoneDarkX(pixels, width, x, row);
          xEnd = this.getNextDarkX(pixels, width, x, row);
          break;
      }
      
      if (x < 0) break;
      
      const sortingLength = xEnd - x;
      if (sortingLength > 1) {
        const unsorted = [];
        
        for (let i = 0; i < sortingLength; i++) {
          unsorted[i] = pixels[x + i + row * width];
        }
        
        const sorted = unsorted.sort((a, b) => a - b);
        
        for (let i = 0; i < sortingLength; i++) {
          pixels[x + i + row * width] = sorted[i];
        }
      }
      
      x = xEnd + 1;
    }
  }

  sortColumn(pixels, width, height, column, mode) {
    let y = 0;
    let yEnd = 0;
    
    while (yEnd < height - 1) {
      switch (mode) {
        case 0:
          y = this.getFirstNoneWhiteY(pixels, width, height, column, y);
          yEnd = this.getNextWhiteY(pixels, width, height, column, y);
          break;
        case 1:
          y = this.getFirstNoneBlackY(pixels, width, height, column, y);
          yEnd = this.getNextBlackY(pixels, width, height, column, y);
          break;
        case 2:
          y = this.getFirstNoneBrightY(pixels, width, height, column, y);
          yEnd = this.getNextBrightY(pixels, width, height, column, y);
          break;
        case 3:
          y = this.getFirstNoneDarkY(pixels, width, height, column, y);
          yEnd = this.getNextDarkY(pixels, width, height, column, y);
          break;
      }
      
      if (y < 0) break;
      
      const sortingLength = yEnd - y;
      if (sortingLength > 1) {
        const unsorted = [];
        
        for (let i = 0; i < sortingLength; i++) {
          unsorted[i] = pixels[column + (y + i) * width];
        }
        
        const sorted = unsorted.sort((a, b) => a - b);
        
        for (let i = 0; i < sortingLength; i++) {
          pixels[column + (y + i) * width] = sorted[i];
        }
      }
      
      y = yEnd + 1;
    }
  }

  getBrightness(color) {
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // White threshold functions
  getFirstNoneWhiteX(pixels, width, x, y) {
    while (pixels[x + y * width] < this.whiteValue) {
      x++;
      if (x >= width) return -1;
    }
    return x;
  }

  getNextWhiteX(pixels, width, x, y) {
    x++;
    while (pixels[x + y * width] > this.whiteValue) {
      x++;
      if (x >= width) return width - 1;
    }
    return x - 1;
  }

  // Black threshold functions
  getFirstNoneBlackX(pixels, width, x, y) {
    while (pixels[x + y * width] > this.blackValue) {
      x++;
      if (x >= width) return -1;
    }
    return x;
  }

  getNextBlackX(pixels, width, x, y) {
    x++;
    while (pixels[x + y * width] < this.blackValue) {
      x++;
      if (x >= width) return width - 1;
    }
    return x - 1;
  }

  // Brightness threshold functions
  getFirstNoneBrightX(pixels, width, x, y) {
    while (this.getBrightness(pixels[x + y * width]) < this.brightValue) {
      x++;
      if (x >= width) return -1;
    }
    return x;
  }

  getNextBrightX(pixels, width, x, y) {
    x++;
    while (this.getBrightness(pixels[x + y * width]) > this.brightValue) {
      x++;
      if (x >= width) return width - 1;
    }
    return x - 1;
  }

  // Dark threshold functions
  getFirstNoneDarkX(pixels, width, x, y) {
    while (this.getBrightness(pixels[x + y * width]) > this.darkValue) {
      x++;
      if (x >= width) return -1;
    }
    return x;
  }

  getNextDarkX(pixels, width, x, y) {
    x++;
    while (this.getBrightness(pixels[x + y * width]) < this.darkValue) {
      x++;
      if (x >= width) return width - 1;
    }
    return x - 1;
  }

  // Y-axis functions (similar pattern for vertical sorting)
  getFirstNoneWhiteY(pixels, width, height, x, y) {
    if (y < height) {
      while (pixels[x + y * width] < this.whiteValue) {
        y++;
        if (y >= height) return -1;
      }
    }
    return y;
  }

  getNextWhiteY(pixels, width, height, x, y) {
    y++;
    if (y < height) {
      while (pixels[x + y * width] > this.whiteValue) {
        y++;
        if (y >= height) return height - 1;
      }
    }
    return y - 1;
  }

  getFirstNoneBlackY(pixels, width, height, x, y) {
    if (y < height) {
      while (pixels[x + y * width] > this.blackValue) {
        y++;
        if (y >= height) return -1;
      }
    }
    return y;
  }

  getNextBlackY(pixels, width, height, x, y) {
    y++;
    if (y < height) {
      while (pixels[x + y * width] < this.blackValue) {
        y++;
        if (y >= height) return height - 1;
      }
    }
    return y - 1;
  }

  getFirstNoneBrightY(pixels, width, height, x, y) {
    if (y < height) {
      while (this.getBrightness(pixels[x + y * width]) < this.brightValue) {
        y++;
        if (y >= height) return -1;
      }
    }
    return y;
  }

  getNextBrightY(pixels, width, height, x, y) {
    y++;
    if (y < height) {
      while (this.getBrightness(pixels[x + y * width]) > this.brightValue) {
        y++;
        if (y >= height) return height - 1;
      }
    }
    return y - 1;
  }

  getFirstNoneDarkY(pixels, width, height, x, y) {
    if (y < height) {
      while (this.getBrightness(pixels[x + y * width]) > this.darkValue) {
        y++;
        if (y >= height) return -1;
      }
    }
    return y;
  }

  getNextDarkY(pixels, width, height, x, y) {
    y++;
    if (y < height) {
      while (this.getBrightness(pixels[x + y * width]) < this.darkValue) {
        y++;
        if (y >= height) return height - 1;
      }
    }
    return y - 1;
  }
}
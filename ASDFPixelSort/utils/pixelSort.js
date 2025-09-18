/**
 * ASDF Pixel Sort Algorithm
 * Based on Kim Asendorf's original Processing code (2010)
 * 
 * Sorting modes:
 * 0 = white
 * 1 = black
 * 2 = bright
 * 3 = dark
 */

export class PixelSorter {
  constructor() {
    // Threshold values to determine sorting start and end pixels
    this.whiteValue = -12345678;
    this.blackValue = -3456789;
    this.brightValue = 127;
    this.darkValue = 223;
  }

  /**
   * Main function to sort an image
   * @param {ImageData} imageData - Canvas ImageData object
   * @param {number} mode - Sorting mode (0-3)
   * @param {Function} progressCallback - Optional progress callback
   * @returns {ImageData} Sorted image data
   */
  async sortImage(imageData, mode = 0, progressCallback = null) {
    const { width, height, data } = imageData;
    const pixels = new Uint8ClampedArray(data);
    
    // Convert RGBA to RGB values for processing
    const rgbPixels = this.convertToRGB(pixels, width, height);
    
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
    const sortedData = this.convertToRGBA(rgbPixels, pixels);
    
    if (progressCallback) progressCallback(100, 'Complete!');
    
    return new ImageData(sortedData, width, height);
  }

  /**
   * Convert RGBA pixel data to RGB values
   */
  convertToRGB(pixels, width, height) {
    const rgbPixels = new Int32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      // Convert to signed 32-bit integer (Processing color format)
      rgbPixels[i] = (r << 16) | (g << 8) | b | 0xFF000000;
    }
    
    return rgbPixels;
  }

  /**
   * Convert RGB values back to RGBA pixel data
   */
  convertToRGBA(rgbPixels, originalPixels) {
    const rgbaPixels = new Uint8ClampedArray(originalPixels.length);
    
    for (let i = 0; i < rgbPixels.length; i++) {
      const color = rgbPixels[i];
      rgbaPixels[i * 4] = (color >> 16) & 0xFF;     // R
      rgbaPixels[i * 4 + 1] = (color >> 8) & 0xFF; // G
      rgbaPixels[i * 4 + 2] = color & 0xFF;        // B
      rgbaPixels[i * 4 + 3] = originalPixels[i * 4 + 3]; // Keep original alpha
    }
    
    return rgbaPixels;
  }

  /**
   * Sort a single row of pixels
   */
  sortRow(pixels, width, height, row, mode) {
    let x = 0;
    let xEnd = 0;
    
    while (xEnd < width - 1) {
      switch (mode) {
        case 0: // white
          x = this.getFirstNoneWhiteX(pixels, width, x, row);
          xEnd = this.getNextWhiteX(pixels, width, x, row);
          break;
        case 1: // black
          x = this.getFirstNoneBlackX(pixels, width, x, row);
          xEnd = this.getNextBlackX(pixels, width, x, row);
          break;
        case 2: // bright
          x = this.getFirstNoneBrightX(pixels, width, x, row);
          xEnd = this.getNextBrightX(pixels, width, x, row);
          break;
        case 3: // dark
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

  /**
   * Sort a single column of pixels
   */
  sortColumn(pixels, width, height, column, mode) {
    let y = 0;
    let yEnd = 0;
    
    while (yEnd < height - 1) {
      switch (mode) {
        case 0: // white
          y = this.getFirstNoneWhiteY(pixels, width, height, column, y);
          yEnd = this.getNextWhiteY(pixels, width, height, column, y);
          break;
        case 1: // black
          y = this.getFirstNoneBlackY(pixels, width, height, column, y);
          yEnd = this.getNextBlackY(pixels, width, height, column, y);
          break;
        case 2: // bright
          y = this.getFirstNoneBrightY(pixels, width, height, column, y);
          yEnd = this.getNextBrightY(pixels, width, height, column, y);
          break;
        case 3: // dark
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

  /**
   * Get brightness value from RGB color
   */
  getBrightness(color) {
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // White threshold functions for X axis
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

  // Black threshold functions for X axis
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

  // Bright threshold functions for X axis
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

  // Dark threshold functions for X axis
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

  // White threshold functions for Y axis
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

  // Black threshold functions for Y axis
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

  // Bright threshold functions for Y axis
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

  // Dark threshold functions for Y axis
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

  /**
   * Update threshold values
   */
  setThresholds(whiteValue, blackValue, brightValue, darkValue) {
    this.whiteValue = whiteValue;
    this.blackValue = blackValue;
    this.brightValue = brightValue;
    this.darkValue = darkValue;
  }
}
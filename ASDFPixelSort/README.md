# ASDF Pixel Sort - Mobile App

A React Native/Expo mobile application implementing Kim Asendorf's ASDF Pixel Sort algorithm for iPhone and Android devices.

## Features

- **Four Sorting Modes**: White, Black, Bright, and Dark threshold-based pixel sorting
- **Interactive Controls**: Adjustable threshold sliders for fine-tuning effects
- **Real-time Progress**: Visual progress indicator during image processing
- **Beautiful UI**: Modern dark theme with intuitive interface
- **Image Management**: Load from photo library and save processed images
- **Cross-platform**: Works on both iOS and Android devices

## Algorithm

Based on Kim Asendorf's original ASDF Pixel Sort algorithm from 2010, this implementation:
- Sorts pixels in both rows and columns
- Uses threshold values to determine sorting boundaries
- Supports four different sorting criteria:
  - **White**: Sort pixels whiter than threshold
  - **Black**: Sort pixels blacker than threshold  
  - **Bright**: Sort pixels brighter than threshold
  - **Dark**: Sort pixels darker than threshold

## Installation & Setup

### Prerequisites
- Node.js (v16 or later)
- Expo CLI: `npm install -g @expo/cli`
- For iOS: Xcode and iOS Simulator (macOS only)
- For Android: Android Studio and Android Emulator

### Getting Started

1. **Install Dependencies**
   ```bash
   cd ASDFPixelSort
   npm install
   ```

2. **Start Development Server**
   ```bash
   npx expo start
   ```

3. **Run on Device/Simulator**
   - **iOS**: Press `i` in terminal or scan QR code with Expo Go app
   - **Android**: Press `a` in terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in terminal (for testing only)

## Building for Production

### iOS (TestFlight/App Store)

1. **Configure Apple Developer Account**
   ```bash
   npx expo login
   npx expo build:ios
   ```

2. **Alternative: EAS Build** (Recommended)
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform ios
   ```

### Android (Google Play Store)

1. **Build APK/AAB**
   ```bash
   npx expo build:android
   ```

2. **Alternative: EAS Build** (Recommended)
   ```bash
   eas build --platform android
   ```

## Using on iPhone

### Method 1: Expo Go (Development)
1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from App Store
2. Run `npx expo start` in project directory
3. Scan QR code with iPhone camera
4. App opens in Expo Go

### Method 2: TestFlight (Production)
1. Build app using EAS Build or Expo Build
2. Upload to App Store Connect
3. Add to TestFlight
4. Install via TestFlight app

### Method 3: Development Build
1. Create development build: `eas build --profile development --platform ios`
2. Install .ipa file on device
3. Run `npx expo start --dev-client`

## App Structure

```
ASDFPixelSort/
├── App.js                 # Main app component
├── utils/
│   ├── pixelSort.js      # Original pixel sort algorithm
│   └── imageProcessor.js # React Native image processing
├── assets/               # App icons and splash screens
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## Key Components

- **Image Selection**: Uses Expo ImagePicker for photo library access
- **Pixel Sorting**: Custom JavaScript implementation of ASDF algorithm
- **Progress Tracking**: Real-time progress updates during processing
- **Threshold Controls**: Interactive sliders for algorithm parameters
- **Image Saving**: Expo MediaLibrary for saving to photo gallery

## Permissions

The app requires the following permissions:
- **Photo Library Access**: To load and save images
- **Camera Access**: To take new photos (optional)

## Performance Notes

- Images are automatically resized to max 800px width for performance
- Processing time varies based on image size and complexity
- Larger images may take 10-30 seconds to process
- Progress indicator shows real-time status

## Troubleshooting

### Common Issues

1. **"Module not found" errors**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **iOS build fails**
   - Ensure Xcode is updated
   - Check Apple Developer account status
   - Try: `npx expo install --fix`

3. **Android build fails**
   - Update Android SDK
   - Check Java version compatibility
   - Clear Gradle cache

4. **Image processing slow**
   - Reduce image size in ImageProcessor
   - Adjust processing parameters
   - Use smaller test images

### Getting Help

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Kim Asendorf's Original Code](https://github.com/00120212/ASDFPixelSort)

## Credits

- **Algorithm**: Kim Asendorf (2010) - Original ASDF Pixel Sort
- **Implementation**: React Native/Expo mobile adaptation
- **UI/UX**: Modern mobile interface design

## License

This project is for educational and artistic purposes. Please respect Kim Asendorf's original work and licensing.
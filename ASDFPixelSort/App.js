import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import Slider from '@react-native-community/slider';
import { ImageProcessor } from './utils/imageProcessor';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [sortMode, setSortMode] = useState(0);
  const [thresholds, setThresholds] = useState({
    white: -12345678,
    black: -3456789,
    bright: 127,
    dark: 223
  });

  const imageProcessor = useRef(new ImageProcessor()).current;

  const sortModes = [
    { id: 0, name: 'White', color: '#ffffff', description: 'Sort based on white threshold' },
    { id: 1, name: 'Black', color: '#000000', description: 'Sort based on black threshold' },
    { id: 2, name: 'Bright', color: '#ffeb3b', description: 'Sort based on brightness' },
    { id: 3, name: 'Dark', color: '#424242', description: 'Sort based on darkness' }
  ];

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
    const { status: imagePickerStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (mediaLibraryStatus !== 'granted' || imagePickerStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'This app needs access to your photo library to work properly.',
        [{ text: 'OK' }]
      );
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setProcessedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const processImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressText('Loading image...');

    try {
      const processedUri = await imageProcessor.processImage(
        selectedImage,
        sortMode,
        thresholds,
        (progress, text) => {
          setProgress(progress);
          setProgressText(text);
        }
      );
      
      setProcessedImage(processedUri);
      setIsProcessing(false);
      setProgressText('Complete!');
      
    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Error', 'Failed to process image: ' + error.message);
      setIsProcessing(false);
    }
  };

  const saveImage = async () => {
    if (!processedImage) {
      Alert.alert('No Processed Image', 'Please process an image first.');
      return;
    }

    try {
      const asset = await MediaLibrary.createAssetAsync(processedImage);
      Alert.alert('Success', 'Image saved to your photo library!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save image: ' + error.message);
    }
  };

  const resetImage = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setProgress(0);
    setProgressText('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ASDF Pixel Sort</Text>
          <Text style={styles.subtitle}>Kim Asendorf Algorithm</Text>
        </View>

        {/* Image Display */}
        <View style={styles.imageContainer}>
          {selectedImage ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: selectedImage }} style={styles.image} />
              {processedImage && (
                <View style={styles.processedImageWrapper}>
                  <Text style={styles.processedLabel}>Processed:</Text>
                  <Image source={{ uri: processedImage }} style={styles.image} />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Select an image to begin</Text>
            </View>
          )}
        </View>

        {/* Processing Progress */}
        {isProcessing && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.progressText}>{progressText}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* Sort Mode Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Sort Mode</Text>
          <View style={styles.modeContainer}>
            {sortModes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeButton,
                  sortMode === mode.id && styles.modeButtonActive,
                  { borderColor: mode.color }
                ]}
                onPress={() => setSortMode(mode.id)}
              >
                <View style={[styles.modeColor, { backgroundColor: mode.color }]} />
                <Text style={[
                  styles.modeText,
                  sortMode === mode.id && styles.modeTextActive
                ]}>
                  {mode.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.modeDescription}>
            {sortModes[sortMode].description}
          </Text>
        </View>

        {/* Threshold Controls */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Threshold Settings</Text>
          
          {sortMode <= 1 && (
            <>
              <Text style={styles.sliderLabel}>
                White Threshold: {thresholds.white}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-16581375}
                maximumValue={0}
                value={thresholds.white}
                onValueChange={(value) => 
                  setThresholds(prev => ({ ...prev, white: Math.round(value) }))
                }
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#e5e7eb"
                thumbStyle={styles.sliderThumb}
              />
              
              <Text style={styles.sliderLabel}>
                Black Threshold: {thresholds.black}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-16581375}
                maximumValue={0}
                value={thresholds.black}
                onValueChange={(value) => 
                  setThresholds(prev => ({ ...prev, black: Math.round(value) }))
                }
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#e5e7eb"
                thumbStyle={styles.sliderThumb}
              />
            </>
          )}
          
          {sortMode >= 2 && (
            <>
              <Text style={styles.sliderLabel}>
                Bright Threshold: {thresholds.bright}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={255}
                value={thresholds.bright}
                onValueChange={(value) => 
                  setThresholds(prev => ({ ...prev, bright: Math.round(value) }))
                }
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#e5e7eb"
                thumbStyle={styles.sliderThumb}
              />
              
              <Text style={styles.sliderLabel}>
                Dark Threshold: {thresholds.dark}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={255}
                value={thresholds.dark}
                onValueChange={(value) => 
                  setThresholds(prev => ({ ...prev, dark: Math.round(value) }))
                }
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#e5e7eb"
                thumbStyle={styles.sliderThumb}
              />
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={pickImage}>
            <Text style={styles.primaryButtonText}>Select Image</Text>
          </TouchableOpacity>
          
          {selectedImage && (
            <TouchableOpacity 
              style={[styles.primaryButton, isProcessing && styles.disabledButton]} 
              onPress={processImage}
              disabled={isProcessing}
            >
              <Text style={styles.primaryButtonText}>
                {isProcessing ? 'Processing...' : 'Apply Pixel Sort'}
              </Text>
            </TouchableOpacity>
          )}
          
          {processedImage && (
            <TouchableOpacity style={styles.secondaryButton} onPress={saveImage}>
              <Text style={styles.secondaryButtonText}>Save to Gallery</Text>
            </TouchableOpacity>
          )}
          
          {selectedImage && (
            <TouchableOpacity style={styles.tertiaryButton} onPress={resetImage}>
              <Text style={styles.tertiaryButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 5,
  },
  imageContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  imageWrapper: {
    alignItems: 'center',
  },
  image: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 0.75,
    borderRadius: 12,
    marginBottom: 20,
  },
  processedImageWrapper: {
    alignItems: 'center',
  },
  processedLabel: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 10,
  },
  placeholderContainer: {
    height: (screenWidth - 40) * 0.75,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 18,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  progressText: {
    color: '#ffffff',
    fontSize: 16,
    marginVertical: 10,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  progressPercent: {
    color: '#94a3b8',
    marginTop: 5,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
  },
  modeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 2,
    padding: 12,
    marginBottom: 10,
    width: '48%',
  },
  modeButtonActive: {
    backgroundColor: '#312e81',
  },
  modeColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  modeText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  modeTextActive: {
    color: '#ffffff',
  },
  modeDescription: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
  },
  sliderLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  sliderThumb: {
    backgroundColor: '#6366f1',
    width: 20,
    height: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#374151',
  },
});

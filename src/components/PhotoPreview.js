import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';

const PhotoPreview = ({
  imageUrl,
  placeholder = '🧾',
  label = 'Image',
  style,
  resizeMode = 'contain',
}) => {
  const [failedUrl, setFailedUrl] = useState(null);
  const [loadedUrl, setLoadedUrl] = useState(null);
  const failed = failedUrl === imageUrl;
  return (
    <View style={[styles.container, style]}>
      {imageUrl && !failed ? (
        <>
          <Image
            key={imageUrl}
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode={resizeMode}
            accessibilityLabel={label}
            onLoad={() => setLoadedUrl(imageUrl)}
            onError={() => setFailedUrl(imageUrl)}
          />
          {loadedUrl !== imageUrl ? (
            <ActivityIndicator style={styles.spinner} color={colors.primary} />
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.icon}>{placeholder}</Text>
          <Text style={styles.message}>
            {imageUrl ? 'Image could not be loaded' : 'No image attached'}
          </Text>
        </>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  spinner: { position: 'absolute' },
  icon: { fontSize: 30 },
  message: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 8,
  },
});
export default PhotoPreview;

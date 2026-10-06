import React from 'react';
import { View, Text } from 'react-native';
import PhotoPreview from './PhotoPreview';
// Native picker is intentionally excluded from the foundation bundle.
// Browser upload processing and iPhone photo validation belong to milestone 3.
export default function PhotoPicker({
  imageUrl,
  placeholder,
  label = 'Photo',
}) {
  return (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      <PhotoPreview
        imageUrl={imageUrl}
        placeholder={placeholder}
        label={label}
        style={{ width: 112, height: 112, borderRadius: 24 }}
      />
      <Text style={{ marginTop: 12, color: '#596D5C', textAlign: 'center' }}>
        Photo uploads will be available in the next web update.
      </Text>
    </View>
  );
}

import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Alert } from 'react-native';
import PhotoPreview from './PhotoPreview';
import colors from '../constants/colors';
import { uploadAnimalPhoto } from '../utils/uploadAnimalPhoto';

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const getImageSize = file =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error('Could not read this photo. Please choose another image.'),
      );
    };
    image.src = url;
  });

const resizeImage = async file => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const type =
    file.type ||
    {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    }[ext];
  if (!ACCEPTED_TYPES.has(type)) {
    throw new Error(
      'Please choose a JPG, PNG or WEBP photo. iPhone HEIC photos should be shared as JPEG.',
    );
  }

  const { image, width, height } = await getImageSize(file);
  if (!width || !height)
    throw new Error('Could not read this photo. Please choose another image.');

  const scale = Math.min(1, MAX_DIMENSION / width, MAX_DIMENSION / height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context)
    throw new Error('Photo processing is unavailable in this browser.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  );
  if (!blob)
    throw new Error('Could not prepare this photo. Please try another image.');
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      'The resized photo is larger than 3 MB. Please choose a smaller photo.',
    );
  }
  return new File([blob], 'photo.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
};

export default function PhotoPicker({
  imageUrl,
  placeholder = '📷',
  label = 'Photo',
  onChange,
  onBusyChange,
  disabled = false,
}) {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);

  const setBusyState = value => {
    setBusy(value);
    onBusyChange?.(value);
  };

  const choosePhoto = async event => {
    const file = event.target.files?.[0];
    // Allow reselecting the same file after cancellation or a failed upload.
    event.target.value = '';
    if (!file || disabled || inFlight.current) return;

    inFlight.current = true;
    setBusyState(true);
    try {
      const prepared = await resizeImage(file);
      const imageUrlResult = await uploadAnimalPhoto(prepared);
      onChange?.(imageUrlResult);
    } catch (error) {
      Alert.alert(
        'Could not upload photo',
        error?.message || 'Please try again.',
      );
    } finally {
      inFlight.current = false;
      setBusyState(false);
    }
  };

  return (
    <View style={styles.container}>
      <PhotoPreview
        imageUrl={imageUrl}
        placeholder={placeholder}
        label={label}
        style={styles.photo}
      />
      <View style={styles.pickArea}>
        <View
          pointerEvents="none"
          style={[styles.button, (disabled || busy) && styles.disabled]}
        >
          {busy ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.plus}>＋</Text>
          )}
          <Text style={styles.buttonText}>
            {busy
              ? 'Preparing photo…'
              : imageUrl
              ? `Change ${label}`
              : `Add ${label}`}
          </Text>
        </View>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          aria-label={`Choose ${label.toLowerCase()}`}
          tabIndex={0}
          disabled={disabled || busy}
          onChange={choosePhoto}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: disabled || busy ? 0.6 : 0.01,
            cursor: disabled || busy ? 'default' : 'pointer',
            margin: 0,
          }}
        />
      </View>
      <Text style={styles.note}>
        {busy
          ? 'Uploading securely…'
          : 'Optional · JPG, PNG or WEBP · up to 3 MB'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 24 },
  photo: { width: 112, height: 112, borderRadius: 24, marginBottom: 12 },
  pickArea: {
    position: 'relative',
    minWidth: 152,
    minHeight: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  button: {
    minHeight: 42,
    minWidth: 152,
    paddingHorizontal: 18,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.green200,
  },
  disabled: { opacity: 0.6 },
  plus: {
    fontSize: 19,
    lineHeight: 21,
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  buttonText: { color: colors.primaryDeep, fontSize: 13, fontWeight: '700' },
  note: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

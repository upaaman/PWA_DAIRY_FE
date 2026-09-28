import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import PhotoPreview from './PhotoPreview';
import AppButton from './AppButton';
import colors from '../constants/colors';
import { spacing } from '../constants/appConstants';
import { uploadImage } from '../utils/uploadImage';

const PhotoPicker = ({
  imageUrl,
  placeholder = '📷',
  label = 'Photo',
  onChange,
  onBusyChange,
  disabled,
}) => {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const choosePhoto = async () => {
    if (disabled || inFlight.current) {
      return;
    }
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        assetRepresentationMode: 'compatible',
      });
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        throw new Error(
          result.errorCode === 'permission'
            ? 'Please allow photo access in Settings and try again.'
            : 'Could not open your photos. Please try again.',
        );
      }
      const url = await uploadImage(result.assets?.[0]);
      onChange(url);
    } catch (error) {
      Alert.alert(
        'Could not upload photo',
        error.message || 'Please try again.',
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange(false);
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
      <AppButton
        title={imageUrl ? `Change ${label}` : `Add ${label}`}
        size="small"
        variant="secondary"
        onPress={choosePhoto}
        loading={busy}
        disabled={disabled}
      />
      <Text style={styles.note}>
        {busy ? 'Preparing photo…' : 'Optional · JPG, PNG or WEBP · up to 3 MB'}
      </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: spacing.xl },
  photo: {
    width: 112,
    height: 112,
    borderRadius: 24,
    marginBottom: spacing.md,
  },
  note: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.sm },
});
export default PhotoPicker;

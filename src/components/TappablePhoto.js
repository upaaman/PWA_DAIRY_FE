import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from './AppButton';
import PhotoPreview from './PhotoPreview';
import colors from '../constants/colors';
import { fontSize, spacing } from '../constants/appConstants';

/**
 * TappablePhoto
 *
 * A photo thumbnail that opens full screen when tapped. Both the
 * expense details screen and the animal details screen use this, so the
 * "tap to enlarge" affordance can never drift apart between them.
 *
 * It owns its own open/closed state — callers just render it:
 *   <TappablePhoto
 *     imageUrl={expense.imageUrl}
 *     label="Expense image"
 *     style={styles.preview}
 *   />
 *
 * The full screen view uses resizeMode="contain" (PhotoPreview's
 * default), so a tall photo is letterboxed rather than cropped — the
 * thumbnail passes whatever mode suits its own box.
 */
const TappablePhoto = ({
  imageUrl,
  label = 'Image',
  placeholder,
  style,
  hint = true,
  resizeMode = 'contain',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        disabled={!imageUrl}
        accessibilityRole="button"
        accessibilityLabel={`View ${label.toLowerCase()} full screen`}
        onPress={() => setOpen(true)}
      >
        <PhotoPreview
          imageUrl={imageUrl}
          placeholder={placeholder}
          label={label}
          style={style}
          resizeMode={resizeMode}
        />
      </Pressable>

      {/* {hint && imageUrl ? (
        <Text style={styles.hint}>Tap to view full screen</Text>
      ) : null} */}

      <Modal
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={styles.viewer}>
          <View style={styles.close}>
            <AppButton
              title="Close Image"
              variant="secondary"
              onPress={() => setOpen(false)}
            />
          </View>
          <PhotoPreview
            imageUrl={imageUrl}
            label={`${label} full screen`}
            style={styles.fullImage}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  hint: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
  },
  viewer: { flex: 1, backgroundColor: colors.background },
  close: { padding: spacing.lg, alignItems: 'flex-end' },
  fullImage: { flex: 1 },
});

export default TappablePhoto;

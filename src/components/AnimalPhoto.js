import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';
import { getAnimalIcon } from '../screens/Animals/animalMeta';

const AnimalPhoto = ({ imageUrl, type, style }) => {
  const [failedUrl, setFailedUrl] = useState(null);
  return (
    <View style={[styles.container, style]}>
      {imageUrl && failedUrl !== imageUrl ? (
        <Image
          key={imageUrl}
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel="Animal photo"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <Text style={styles.icon}>{getAnimalIcon(type)}</Text>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  icon: { fontSize: 30 },
});
export default AnimalPhoto;

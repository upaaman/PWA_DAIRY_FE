import React from 'react';
import PhotoPicker from './PhotoPicker';
import { getAnimalIcon } from '../screens/Animals/animalMeta';

const AnimalPhotoPicker = ({ type, ...props }) => (
  <PhotoPicker {...props} placeholder={getAnimalIcon(type)} />
);
export default AnimalPhotoPicker;

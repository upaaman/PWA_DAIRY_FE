import { postMultipart } from '../api/decentralizedWrapper';

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const uploadAnimalPhoto = async file => {
  if (!(file instanceof Blob) || !file.size) {
    throw new Error(
      'The selected photo could not be read. Please choose another.',
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Please choose a photo smaller than 3 MB.');
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error('Please choose a JPG, PNG or WEBP photo.');
  }

  const formData = new FormData();
  formData.append('file', file, file.name || 'photo.jpg');
  const response = await postMultipart('/upload', formData);
  if (
    typeof response?.url !== 'string' ||
    !/^https?:\/\//i.test(response.url.trim())
  ) {
    throw new Error(
      'The upload did not return a valid image URL. Please try again.',
    );
  }
  return response.url.trim();
};

export const uploadImage = uploadAnimalPhoto;

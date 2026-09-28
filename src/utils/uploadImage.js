import { postMultipart } from '../api/decentralizedWrapper';

export const uploadImage = async asset => {
  if (!asset?.uri) {
    throw new Error(
      'The selected photo could not be read. Please choose another.',
    );
  }
  if (asset.fileSize > 3 * 1024 * 1024) {
    throw new Error('Please choose a photo smaller than 3 MB.');
  }
  const types = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const extension = types[asset.type];
  if (!extension) {
    throw new Error('Please choose a JPG, PNG or WEBP photo.');
  }
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    type: asset.type,
    // Match the actual converted MIME type, even if the original was HEIC.
    name: `photo.${extension}`,
  });
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

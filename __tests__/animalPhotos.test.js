import React from 'react';
import { Alert, Image } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  get,
  post,
  patch,
  postMultipart,
} from '../src/api/decentralizedWrapper';
import { uploadAnimalPhoto } from '../src/utils/uploadAnimalPhoto';
import AnimalPhoto from '../src/components/AnimalPhoto';
import AnimalPhotoPicker from '../src/components/AnimalPhotoPicker';
import AppButton from '../src/components/AppButton';
import AppInput from '../src/components/AppInput';
import AppSelect from '../src/components/AppSelect';
import AddAnimalScreen from '../src/screens/Animals/AddAnimalScreen';
import EditAnimalScreen from '../src/screens/Animals/EditAnimalScreen';

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
jest.mock('../src/api/decentralizedWrapper', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  postMultipart: jest.fn(),
}));
const asset = { uri: 'file:///photo.jpg', type: 'image/jpeg', fileSize: 1000 };
const url = 'https://example.com/animal.jpg';
let tree;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  postMultipart.mockResolvedValue({ url });
});
afterEach(async () => {
  if (tree) {
    await act(() => tree.unmount());
    tree = null;
  }
});
const render = async element => {
  await act(() => {
    tree = Renderer.create(element);
  });
  return tree.root;
};

it('uploads a multipart file and uses the response URL', async () => {
  const append = jest.spyOn(FormData.prototype, 'append');
  expect(await uploadAnimalPhoto(asset)).toBe(url);
  const [endpoint, body] = postMultipart.mock.calls[0];
  expect(endpoint).toBe('/upload');
  expect(body).toBeInstanceOf(FormData);
  expect(append).toHaveBeenCalledWith('file', {
    uri: asset.uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  });
  append.mockRestore();
});
it('rejects unsupported/oversized images before uploading and invalid responses', async () => {
  await expect(
    uploadAnimalPhoto({ ...asset, fileSize: 4 * 1024 * 1024 }),
  ).rejects.toThrow('3 MB');
  await expect(
    uploadAnimalPhoto({ ...asset, type: 'image/heic' }),
  ).rejects.toThrow('JPG');
  expect(postMultipart).not.toHaveBeenCalled();
  postMultipart.mockResolvedValue({});
  await expect(uploadAnimalPhoto(asset)).rejects.toThrow('valid image URL');
});
it('keeps the current photo on picker cancellation or failed upload', async () => {
  const onChange = jest.fn();
  const onBusyChange = jest.fn();
  const root = await render(
    <AnimalPhotoPicker
      imageUrl={url}
      onChange={onChange}
      onBusyChange={onBusyChange}
    />,
  );
  launchImageLibrary.mockResolvedValue({ didCancel: true });
  await act(async () => root.findByType(AppButton).props.onPress());
  expect(postMultipart).not.toHaveBeenCalled();
  launchImageLibrary.mockResolvedValue({ assets: [asset] });
  postMultipart.mockRejectedValue(new Error('Upload failed'));
  await act(async () => root.findByType(AppButton).props.onPress());
  expect(onChange).not.toHaveBeenCalled();
  expect(onBusyChange).toHaveBeenLastCalledWith(false);
});
it('falls back when an image fails and renders a replacement URL', async () => {
  const root = await render(<AnimalPhoto imageUrl={url} type="COW" />);
  await act(() => root.findByType(Image).props.onError());
  expect(root.findAllByType(Image)).toHaveLength(0);
  await act(() =>
    tree.update(<AnimalPhoto imageUrl={`${url}?new`} type="COW" />),
  );
  expect(root.findByType(Image).props.source.uri).toBe(`${url}?new`);
});
it('includes the photo URL in animal creation', async () => {
  const root = await render(
    <AddAnimalScreen navigation={{ goBack: jest.fn() }} />,
  );
  await act(() => {
    root.findByType(AnimalPhotoPicker).props.onChange(url);
    for (const input of root.findAllByType(AppInput)) {
      input.props.onChangeText(
        input.props.label.includes('Price') ? '100' : 'Test',
      );
    }
    for (const select of root.findAllByType(AppSelect)) {
      select.props.onSelect(select.props.options[0].value);
    }
  });
  await act(async () =>
    root
      .findAllByType(AppButton)
      .find(b => b.props.title === 'Save')
      .props.onPress(),
  );
  expect(post).toHaveBeenCalledWith(
    '/animal/create',
    expect.objectContaining({ imageUrl: url }),
  );
});
it('preserves unchanged images and sends only imageUrl for a photo-only edit', async () => {
  const animal = {
    id: 1,
    name: 'Cow',
    status: 'PRODUCING',
    imageUrl: url,
    active: true,
  };
  const root = await render(
    <EditAnimalScreen
      navigation={{ goBack: jest.fn() }}
      route={{ params: { animalId: 1, animal } }}
    />,
  );
  const save = () =>
    root
      .findAllByType(AppButton)
      .find(b => b.props.title === 'Save Changes')
      .props.onPress();
  await act(async () => save());
  expect(patch).not.toHaveBeenCalled();
  await act(() =>
    root.findByType(AnimalPhotoPicker).props.onChange(`${url}?new`),
  );
  await act(async () => save());
  expect(patch).toHaveBeenCalledWith('/animal/update/1', {
    imageUrl: `${url}?new`,
  });
  expect(get).not.toHaveBeenCalled();
});

/* eslint-env node */
/**
 * AnimalDetails photo.
 *
 * The photo used to be a 160pt full-bleed strip rendered with
 * resizeMode="cover" — a 2.44:1 box against the ~4:3 photos the picker
 * produces, so `cover` cropped off roughly 45% of the image top and
 * bottom and the animal's head and legs fell out of frame.
 *
 * These tests pin the fix: a 4:3 card with "contain" (nothing cropped),
 * and a tap that opens the same full-screen viewer the expense screen
 * uses.
 */
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { get } from '../src/api/decentralizedWrapper';
import AnimalDetailsScreen from '../src/screens/Animals/AnimalDetailsScreen';

jest.mock('../src/api/decentralizedWrapper', () => ({ get: jest.fn() }));
jest.mock('@react-navigation/native', () => {
  const react = require('react');
  return {
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: effect => react.useEffect(effect, [effect]),
  };
});

const PHOTO = 'https://cdn.example.com/animals/gauri.jpg';

const animal = {
  id: 3,
  name: 'Gauri',
  type: 'COW',
  gender: 'FEMALE',
  status: 'PRODUCING',
  breed: 'Hf',
  dateOfBirth: '2024-01-01',
  active: true,
  imageUrl: null,
  mother: null,
  childAnimals: null,
  milkProductionList: [],
  expenseRecordOfAnimal: [],
};

const flatten = node => {
  if (node == null) {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flatten).join('|');
  }
  return (node.children || []).map(flatten).join('|');
};

const renderDetails = async overrides => {
  get.mockResolvedValue({ ...animal, ...overrides });

  const navigation = {
    setOptions: jest.fn(),
    navigate: jest.fn(),
    push: jest.fn(),
    goBack: jest.fn(),
  };

  let tree;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <AnimalDetailsScreen
        navigation={navigation}
        route={{ params: { animalId: 3 } }}
      />,
    );
  });

  return { tree, text: flatten(tree.toJSON()) };
};

const findPhotoImage = tree =>
  tree.root.find(node => node.props?.accessibilityLabel === 'Animal photo');

const findPhotoBox = tree =>
  tree.root.find(node => node.props?.style?.aspectRatio === 4 / 3);

const pressPhoto = tree => {
  const pressable = tree.root.find(
    node => node.props?.accessibilityLabel === 'View animal photo full screen',
  );
  act(() => {
    pressable.props.onPress();
  });
};

beforeEach(() => {
  get.mockReset();
});

describe('AnimalDetails photo', () => {
  it('shows the whole photo: 4:3 card, contained, not cropped', async () => {
    const { tree } = await renderDetails({ imageUrl: PHOTO });

    const box = findPhotoBox(tree);
    expect(box).toBeTruthy();
    expect(box.props.style.width).toBe('100%');

    // "contain" is the whole point — "cover" is what sliced the animal.
    expect(findPhotoImage(tree).props.resizeMode).toBe('contain');
  });

  it('opens the photo full screen on tap, and closes again', async () => {
    const { tree, text } = await renderDetails({ imageUrl: PHOTO });

    expect(text).not.toContain('Close Image');

    pressPhoto(tree);
    expect(flatten(tree.toJSON())).toContain('Close Image');

    act(() => {
      tree.root
        .find(node => node.props?.title === 'Close Image')
        .props.onPress();
    });
    expect(flatten(tree.toJSON())).not.toContain('Close Image');
  });

  it('offers no zoom affordance when the animal has no photo', async () => {
    const { tree, text } = await renderDetails({ imageUrl: null });

    expect(text).toContain('No image attached');
    expect(text).not.toContain('Tap to view full screen');

    // The thumbnail is still laid out (it shows the type emoji), but it
    // is inert — `disabled` is what stops a real tap from opening the
    // viewer, so assert on the flag rather than calling the handler.
    const pressable = tree.root.find(
      node =>
        node.props?.accessibilityLabel === 'View animal photo full screen' &&
        node.props?.disabled !== undefined,
    );
    expect(pressable.props.disabled).toBe(true);
  });
});

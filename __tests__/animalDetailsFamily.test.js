/* eslint-env node */
/**
 * AnimalDetails family (lineage) section.
 *
 * GET /animal/get/{id} returns `mother` and `childAnimals` alongside the
 * animal itself. These tests lock in that they are surfaced only when
 * present, and that tapping a relative pushes that animal's own details
 * page (push, not navigate — this screen is already the focused route).
 */
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { get } from '../src/api/decentralizedWrapper';
import AnimalDetailsScreen from '../src/screens/Animals/AnimalDetailsScreen';
import { ANIMALS_ROUTES } from '../src/navigation/routes';

jest.mock('../src/api/decentralizedWrapper', () => ({ get: jest.fn() }));
jest.mock('@react-navigation/native', () => {
  const react = require('react');
  return {
    ...jest.requireActual('@react-navigation/native'),
    // The screen loads on focus; run that effect on mount.
    useFocusEffect: effect => react.useEffect(effect, [effect]),
  };
});

const mother = {
  id: 2,
  name: 'Gauri',
  type: 'COW',
  gender: 'FEMALE',
  status: 'PRODUCING',
  breed: 'Hf',
  dateOfBirth: '2022-04-11',
  childAnimals: null,
  mother: null,
};

const childOne = {
  id: 4,
  name: 'Kala',
  type: 'BUFFALO',
  gender: 'FEMALE',
  status: 'CHILD',
  breed: 'Hf',
  dateOfBirth: '2026-05-02',
  mother: null,
  childAnimals: null,
};

const childTwo = {
  id: 5,
  name: 'Moti',
  type: 'COW',
  gender: 'MALE',
  status: 'CHILD',
  breed: 'Hf',
  dateOfBirth: '2026-06-18',
  mother: null,
  childAnimals: null,
};

const baseAnimal = {
  id: 3,
  name: 'hello',
  type: 'COW',
  gender: 'FEMALE',
  status: 'PRODUCING',
  breed: 'Hf',
  dateOfBirth: '2024-01-01',
  dateOfPurchase: '2024-02-01',
  purchasePrice: 98000,
  notes: 'this is notes2',
  active: true,
  mother: null,
  childAnimals: null,
  milkProductionList: [],
  expenseRecordOfAnimal: [],
  totalMilkProduced: 37,
  totalExpense: 0,
};

// Works for both a `toJSON()` tree and a ReactTestInstance (its `children`
// are instances/strings), so the same helper can read a whole render and a
// single pressable.
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
  get.mockResolvedValue({ ...baseAnimal, ...overrides });

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

  return { tree, navigation, text: flatten(tree.toJSON()) };
};

const pressRelated = (tree, name) => {
  const matches = tree.root.findAll(
    node => typeof node.props?.onPress === 'function' && flatten(node).includes(name),
    { deep: true },
  );
  expect(matches.length).toBeGreaterThan(0);
  act(() => {
    matches[0].props.onPress();
  });
};

beforeEach(() => {
  get.mockReset();
});

describe('AnimalDetails family section', () => {
  it('hides the section when the animal has no mother and no children', async () => {
    const { text } = await renderDetails({ mother: null, childAnimals: null });

    expect(text).not.toContain('Family');
    expect(text).not.toContain('Mother');
  });

  it('hides the section when the backend returns empty lists', async () => {
    const { text } = await renderDetails({ mother: null, childAnimals: [] });

    expect(text).not.toContain('Family');
  });

  it('shows only the mother when there are no children', async () => {
    const { text } = await renderDetails({ mother, childAnimals: [] });

    expect(text).toContain('Family');
    expect(text).toContain('Mother');
    expect(text).toContain('Gauri');
    expect(text).toContain('1 linked');
    expect(text).not.toContain('Children');
  });

  it('lists mother and every child with a running count', async () => {
    const { text } = await renderDetails({
      mother,
      childAnimals: [childOne, childTwo],
    });

    expect(text).toContain('Mother');
    expect(text).toContain('Gauri');
    expect(text).toContain('Children (2)');
    expect(text).toContain('Kala');
    expect(text).toContain('Moti');
    expect(text).toContain('3 linked');
  });

  it('opens a relative in its own details page via push', async () => {
    const { tree, navigation } = await renderDetails({
      mother,
      childAnimals: [childOne],
    });

    pressRelated(tree, 'Gauri');
    expect(navigation.push).toHaveBeenCalledWith(ANIMALS_ROUTES.DETAILS, {
      animalId: 2,
    });
    expect(navigation.navigate).not.toHaveBeenCalled();

    pressRelated(tree, 'Kala');
    expect(navigation.push).toHaveBeenLastCalledWith(ANIMALS_ROUTES.DETAILS, {
      animalId: 4,
    });
  });

  it('ignores an animal that is its own mother/child', async () => {
    const self = { ...baseAnimal, mother: null, childAnimals: null };
    const { text } = await renderDetails({
      mother: self,
      childAnimals: [self, mother],
    });

    // The self-reference is dropped from the mother slot, and the animal
    // that is a real child of this one is listed on its own.
    expect(text).not.toContain('Mother');
    expect(text).toContain('Child');
    expect(text).toContain('Gauri');
    expect(text).not.toContain('Children');
    expect(text).toContain('1 linked');
  });
});

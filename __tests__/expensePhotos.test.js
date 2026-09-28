import React from 'react';
import { Alert, Image, Modal } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { get, post } from '../src/api/decentralizedWrapper';
import AddExpenseScreen from '../src/screens/Expenses/AddExpenseScreen';
import ExpenseListScreen from '../src/screens/Expenses/ExpenseListScreen';
import ViewExpenseDetailsScreen from '../src/screens/Expenses/ViewExpenseDetailsScreen';
import PhotoPicker from '../src/components/PhotoPicker';
import PhotoPreview from '../src/components/PhotoPreview';
import AppButton from '../src/components/AppButton';
import AppInput from '../src/components/AppInput';
import AppSelect from '../src/components/AppSelect';
import EmptyState from '../src/components/EmptyState';
import { EXPENSE_ROUTES } from '../src/navigation/routes';
jest.mock('../src/api/decentralizedWrapper', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('@react-navigation/native', () => {
  const react = require('react');
  return { ...jest.requireActual('@react-navigation/native'), useFocusEffect: cb => react.useEffect(cb, [cb]) };
});
const expense = { id: 4, amount: 500, type: 'FEED', expenseDate: '2026-09-28', notes: 'Feed bill', imageUrl: 'https://example.com/receipt.jpg' };
let tree;
const render = async element => { await act(() => { tree = Renderer.create(element); }); return tree.root; };
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(() => {}); });
afterEach(async () => { if (tree) { await act(() => tree.unmount()); tree = null; } });
it.each([expense.imageUrl, null])('saves an expense with optional image %s', async imageUrl => {
  get.mockResolvedValue([]);
  const root = await render(<AddExpenseScreen navigation={{ goBack: jest.fn() }} />);
  await act(() => {
    root.findByType(PhotoPicker).props.onChange(imageUrl);
    root.findAllByType(AppSelect).find(n => n.props.label === 'Type *').props.onSelect('FEED');
    root.findAllByType(AppInput).find(n => n.props.label === 'Amount (₹) *').props.onChangeText('500');
    root.findByType(PhotoPicker).props.onBusyChange(true);
  });
  const save = () => root.findAllByType(AppButton).find(n => n.props.title === 'Save Expense');
  expect(save().props.disabled).toBe(true);
  await act(async () => save().props.onPress());
  expect(post).not.toHaveBeenCalled();
  await act(() => root.findByType(PhotoPicker).props.onBusyChange(false));
  await act(async () => save().props.onPress());
  expect(post).toHaveBeenCalledWith('/expense/create', expect.objectContaining({ imageUrl, amount: 500 }));
});
it('opens the details route when an expense is tapped', async () => {
  get.mockResolvedValue([expense]);
  const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
  const root = await render(<ExpenseListScreen navigation={navigation} />);
  await act(() => root.findAll(n => n.props?.accessibilityLabel?.endsWith('expense details') && typeof n.props.onPress === 'function')[0].props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith(EXPENSE_ROUTES.DETAILS, { expenseId: 4 });
});
it('loads the selected expense and opens/closes its complete image', async () => {
  get.mockResolvedValue([expense]);
  const root = await render(<ViewExpenseDetailsScreen route={{ params: { expenseId: 4 } }} />);
  expect(get).toHaveBeenCalledWith('/expense/getAll');
  expect(root.findAllByType(PhotoPreview)[0].props.imageUrl).toBe(expense.imageUrl);
  await act(() => root.findAll(n => n.props?.accessibilityLabel === 'View expense image full screen' && typeof n.props.onPress === 'function')[0].props.onPress());
  expect(root.findByType(Modal).props.visible).toBe(true);
  await act(() => root.findByType(Modal).props.onRequestClose());
  expect(root.findByType(Modal).props.visible).toBe(false);
});
it('reports missing expenses and retries failed requests', async () => {
  get.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce([]);
  const root = await render(<ViewExpenseDetailsScreen route={{ params: { expenseId: 4 } }} />);
  expect(root.findByType(EmptyState).props.message).toBe('Offline');
  await act(async () => root.findByType(EmptyState).props.onActionPress());
  expect(root.findByType(EmptyState).props.message).toContain('could not be found');
});
it('handles missing and broken receipt images', async () => {
  const root = await render(<PhotoPreview />);
  expect(root.findAllByType(Image)).toHaveLength(0);
  await act(() => tree.update(<PhotoPreview imageUrl={expense.imageUrl} />));
  await act(() => root.findByType(Image).props.onError());
  expect(root.findAllByType(Image)).toHaveLength(0);
});

import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableAddButton from '../src/components/DraggableAddButton';
let handlers;
let tree;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(PanResponder, 'create').mockImplementation(config => { handlers = config; return { panHandlers: {} }; });
});
afterEach(async () => { await act(() => tree?.unmount()); jest.restoreAllMocks(); });
const setup = async onPress => {
  await act(() => { tree = Renderer.create(<DraggableAddButton onPress={onPress} storageKey="vaccine-test" />); });
  await act(() => tree.root.findAll(n => typeof n.props.onLayout === 'function')[0].props.onLayout({ nativeEvent: { layout: { width: 400, height: 700 } } }));
};
it('opens the form on tap but not after dragging, and saves the snapped position', async () => {
  const onPress = jest.fn();
  await setup(onPress);
  await act(() => { handlers.onPanResponderGrant(); handlers.onPanResponderRelease(); });
  expect(onPress).toHaveBeenCalledTimes(1);
  await act(() => {
    handlers.onPanResponderGrant();
    handlers.onPanResponderMove({}, { dx: -200, dy: -100 });
    handlers.onPanResponderRelease();
  });
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('vaccine-test', expect.stringContaining('"side":"left"'));
});
it('does not open the form if a gesture is cancelled', async () => {
  const onPress = jest.fn();
  await setup(onPress);
  await act(() => { handlers.onPanResponderGrant(); handlers.onPanResponderTerminate(); });
  expect(onPress).not.toHaveBeenCalled();
});

import { constrainPosition, restorePosition, snapPosition } from '../src/utils/floatingButtonPosition';
const size = { width: 400, height: 700 };
it('starts at the bottom right above the tab bar', () => {
  expect(restorePosition(null, size)).toEqual({ x: 200, y: 626 });
});
it('keeps dragging inside the screen and snaps to the nearer side', () => {
  expect(constrainPosition({ x: -100, y: 1000 }, size)).toEqual({ x: 16, y: 626 });
  expect(snapPosition({ x: 50, y: 300 }, size).point).toEqual({ x: 16, y: 300 });
  expect(snapPosition({ x: 180, y: -50 }, size).point).toEqual({ x: 200, y: 16 });
});
it('restores a relative position within a resized screen', () => {
  const { saved } = snapPosition({ x: 20, y: 321 }, size);
  expect(restorePosition(saved, { width: 800, height: 400 })).toEqual({ x: 16, y: 171 });
  expect(restorePosition({ side: 'left', yRatio: 10 }, size)).toEqual({ x: 16, y: 626 });
});

import React, { useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native-web';
import colors from '../constants/colors';

const findScrollable = (target, wrapper) => {
  let element = target?.nodeType === 1 ? target : null;
  while (element && element !== wrapper) {
    const overflowY = window.getComputedStyle(element).overflowY;
    if (
      element.scrollHeight > element.clientHeight + 1 &&
      (overflowY === 'auto' || overflowY === 'scroll')
    ) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
};

const getTouch = event =>
  event.nativeEvent?.changedTouches?.[0] ||
  event.nativeEvent?.touches?.[0] ||
  event.changedTouches?.[0] ||
  event.touches?.[0];

export default function RefreshControl({
  children,
  style,
  refreshing = false,
  onRefresh,
  enabled = true,
  ...props
}) {
  const wrapper = useRef(null);
  const gesture = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = event => {
    if (!enabled || refreshing) return;
    const touch = getTouch(event);
    const scrollElement = findScrollable(event.target, wrapper.current);
    if (!touch || !scrollElement || scrollElement.scrollTop > 0) return;
    gesture.current = { y: touch.clientY, scrollElement };
  };

  const handleTouchMove = event => {
    const active = gesture.current;
    const touch = getTouch(event);
    if (!active || !touch) return;
    if (active.scrollElement.scrollTop > 0) {
      gesture.current = null;
      setPullDistance(0);
      return;
    }
    setPullDistance(Math.max(0, Math.min(72, touch.clientY - active.y)));
  };

  const handleTouchEnd = () => {
    const active = gesture.current;
    gesture.current = null;
    if (enabled && !refreshing && active && pullDistance >= 56) {
      onRefresh?.();
    }
    setPullDistance(0);
  };

  const handleTouchCancel = () => {
    gesture.current = null;
    setPullDistance(0);
  };

  const showProgress = refreshing || pullDistance > 8;
  return (
    <View
      {...props}
      ref={wrapper}
      style={[style, { position: 'relative' }]}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
      {showProgress ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 8,
            left: 0,
            right: 0,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            zIndex: 2,
          }}
        >
          <ActivityIndicator color={colors.primary} size="small" />
          {!refreshing ? (
            <Text style={{ color: colors.primaryDeep, fontSize: 12 }}>
              Release to refresh
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

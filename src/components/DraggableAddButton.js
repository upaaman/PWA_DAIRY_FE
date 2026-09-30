import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  PanResponder,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';
import {
  BUTTON_WIDTH,
  BUTTON_HEIGHT,
  constrainPosition,
  restorePosition,
  snapPosition,
} from '../utils/floatingButtonPosition';

const COMPACT_WIDTH = 112;
const COMPACT_HEIGHT = 48;

const DraggableAddButton = ({ onPress, storageKey, label = 'Add Vaccine', compact = false }) => {
  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const size = useRef({ width: 0, height: 0, buttonWidth: compact ? COMPACT_WIDTH : BUTTON_WIDTH, buttonHeight: compact ? COMPACT_HEIGHT : BUTTON_HEIGHT });
  const current = useRef({ x: 0, y: 0 });
  const origin = useRef(current.current);
  const saved = useRef(null);
  const dragging = useRef(false);
  const press = useRef(onPress);
  press.current = onPress;
  const [ready, setReady] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then(value => {
        if (!active) {
          return;
        }
        try {
          saved.current = value ? JSON.parse(value) : null;
        } catch {
          saved.current = null;
        }
        current.current = restorePosition(saved.current, size.current);
        position.setValue(current.current);
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [storageKey, position]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const animateScale = value =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: false,
      friction: 6,
    }).start();
  const finish = cancelled => {
    animateScale(1);
    const result = snapPosition(current.current, size.current);
    current.current = result.point;
    saved.current = result.saved;
    Animated.spring(position, {
      toValue: result.point,
      useNativeDriver: false,
      friction: 8,
      tension: 80,
    }).start();
    if (dragging.current) {
      AsyncStorage.setItem(storageKey, JSON.stringify(result.saved)).catch(
        () => {},
      );
    } else if (!cancelled) {
      Vibration.vibrate(8);
      press.current();
    }
    dragging.current = false;
  };
  // Keep callbacks current without recreating the responder during a gesture.
  const handlers = useRef({ finish, animateScale });
  handlers.current = { finish, animateScale };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragging.current = false;
        position.stopAnimation(value => {
          current.current = value;
          origin.current = value;
        });
        handlers.current.animateScale(1.06);
      },
      onPanResponderMove: (_, gesture) => {
        if (!dragging.current && Math.hypot(gesture.dx, gesture.dy) > 8) {
          dragging.current = true;
          Vibration.vibrate(12);
        }
        if (dragging.current) {
          current.current = constrainPosition(
            {
              x: origin.current.x + gesture.dx,
              y: origin.current.y + gesture.dy,
            },
            size.current,
          );
          position.setValue(current.current);
        }
      },
      onPanResponderRelease: () => handlers.current.finish(false),
      onPanResponderTerminate: () => handlers.current.finish(true),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      onLayout={({ nativeEvent }) => {
        size.current = { ...nativeEvent.layout, buttonWidth: compact ? COMPACT_WIDTH : BUTTON_WIDTH, buttonHeight: compact ? COMPACT_HEIGHT : BUTTON_HEIGHT };
        current.current = restorePosition(saved.current, size.current);
        position.setValue(current.current);
        setMeasured(true);
      }}
    >
      {ready && measured && !keyboardVisible ? (
        <Animated.View
          {...responder.panHandlers}
          accessible
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint="Tap to open the form. Drag to move this button."
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityTap={onPress}
          onAccessibilityAction={({ nativeEvent }) => {
            if (nativeEvent.actionName === 'activate') {
              onPress();
            }
          }}
          style={[
            styles.button,
            compact && styles.compactButton,
            { transform: [...position.getTranslateTransform(), { scale }] },
          ]}
        >
          {compact ? (
            <View style={styles.compactPlus} accessible={false}>
              <View style={styles.plusHorizontal} />
              <View style={styles.plusVertical} />
            </View>
          ) : (
            <View style={styles.plusCircle}>
              <Text style={styles.plus}>+</Text>
            </View>
          )}
          <Text
            style={[styles.label, compact && styles.compactLabel]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {compact ? 'Add' : label}
          </Text>
          {compact ? (
            <View style={styles.compactGrip} accessible={false}>
              <View style={styles.gripDot} />
              <View style={styles.gripDot} />
              <View style={styles.gripDot} />
            </View>
          ) : (
            <Text style={styles.grip}>⠿</Text>
          )}
        </Animated.View>
      ) : null}
    </View>
  );
};
const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: colors.primaryDeep,
    borderWidth: 1,
    borderColor: colors.green400,
    elevation: 7,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
  },
  compactButton: {
    width: COMPACT_WIDTH,
    height: COMPACT_HEIGHT,
    borderRadius: COMPACT_HEIGHT / 2,
    paddingLeft: 8,
    paddingRight: 12,
    justifyContent: 'center',
    backgroundColor: colors.primaryDeep,
    borderWidth: 1,
    borderColor: colors.primary,
    borderTopColor: colors.green600,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  compactLabel: {
    flex: 0,
    marginLeft: 8,
    fontSize: 15,
    letterSpacing: 0.2,
    fontWeight: '600',
    includeFontPadding: false,
  },
  compactPlus: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.green200,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactGrip: {
    marginLeft: 10,
    gap: 3,
    alignItems: 'center',
  },
  gripDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.green400,
    opacity: 0.65,
  },
  plusHorizontal: {
    position: 'absolute',
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primaryDeep,
  },
  plusVertical: {
    position: 'absolute',
    width: 2,
    height: 16,
    borderRadius: 1,
    backgroundColor: colors.primaryDeep,
  },
  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  plus: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '600',
    color: colors.primaryDeep,
  },
  label: {
    flex: 1,
    marginLeft: 8,
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  grip: { color: colors.green300, fontSize: 16, marginLeft: 3 },
});
export default DraggableAddButton;

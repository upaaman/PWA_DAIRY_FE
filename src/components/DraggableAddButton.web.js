import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import colors from '../constants/colors';
import {
  BUTTON_HEIGHT,
  BUTTON_WIDTH,
  constrainPosition,
  restorePosition,
  snapPosition,
} from '../utils/floatingButtonPosition';

const COMPACT_WIDTH = 112;
const COMPACT_HEIGHT = 48;
const DRAG_THRESHOLD = 8;

const isEditable = target =>
  target?.nodeType === 1 &&
  target.closest('input, textarea, select, [contenteditable="true"]');

export default function DraggableAddButton({
  onPress,
  storageKey,
  label = 'Add Vaccine',
  compact = false,
}) {
  const containerRef = useRef(null);
  const gesture = useRef(null);
  const wasDragged = useRef(false);
  const saved = useRef(null);
  const current = useRef(null);
  const size = useRef({
    width: 0,
    height: 0,
    buttonWidth: compact ? COMPACT_WIDTH : BUTTON_WIDTH,
    buttonHeight: compact ? COMPACT_HEIGHT : BUTTON_HEIGHT,
  });
  const [position, setPosition] = useState(null);
  const [hiddenForKeyboard, setHiddenForKeyboard] = useState(false);

  const updatePosition = point => {
    current.current = point;
    setPosition(point);
  };

  const restore = useCallback(() => {
    const point = restorePosition(saved.current, size.current);
    current.current = point;
    setPosition(point);
  }, []);

  useEffect(() => {
    try {
      saved.current = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
    } catch {
      saved.current = null;
    }
    if (size.current.width) restore();
  }, [storageKey, restore]);

  useEffect(() => {
    const updateFocus = event => {
      if (event.type === 'focusin') {
        if (isEditable(event.target)) setHiddenForKeyboard(true);
        return;
      }
      window.requestAnimationFrame(() => {
        setHiddenForKeyboard(isEditable(document.activeElement));
      });
    };
    const viewport = window.visualViewport;
    const baselineHeight = window.innerHeight;
    const updateViewport = () => {
      if (viewport && viewport.height < baselineHeight - 120) {
        setHiddenForKeyboard(true);
      } else if (!isEditable(document.activeElement)) {
        setHiddenForKeyboard(false);
      }
    };

    document.addEventListener('focusin', updateFocus);
    document.addEventListener('focusout', updateFocus);
    viewport?.addEventListener('resize', updateViewport);
    return () => {
      document.removeEventListener('focusin', updateFocus);
      document.removeEventListener('focusout', updateFocus);
      viewport?.removeEventListener('resize', updateViewport);
    };
  }, []);

  const onLayout = event => {
    const { width, height } = event.nativeEvent.layout;
    size.current = {
      width,
      height,
      buttonWidth: compact ? COMPACT_WIDTH : BUTTON_WIDTH,
      buttonHeight: compact ? COMPACT_HEIGHT : BUTTON_HEIGHT,
    };
    restore();
  };

  const pointerDown = event => {
    if (event.button !== 0) return;
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      containerX: bounds.left,
      containerY: bounds.top,
      origin: current.current || restorePosition(saved.current, size.current),
      dragging: false,
    };
  };

  const pointerMove = event => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    if (!active.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      active.dragging = true;
    }
    if (!active.dragging) return;
    event.preventDefault();
    updatePosition(
      constrainPosition(
        { x: active.origin.x + dx, y: active.origin.y + dy },
        size.current,
      ),
    );
  };

  const pointerUp = event => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (!active.dragging) return;

    wasDragged.current = true;
    const result = snapPosition(current.current || active.origin, size.current);
    saved.current = result.saved;
    updatePosition(result.point);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(result.saved));
    } catch {
      // Dragging remains available if Safari storage is disabled or full.
    }
  };

  const pointerCancel = event => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (active.dragging) updatePosition(active.origin);
  };

  const handleClick = event => {
    if (wasDragged.current) {
      wasDragged.current = false;
      event.preventDefault();
      return;
    }
    onPress?.();
  };

  const width = compact ? COMPACT_WIDTH : BUTTON_WIDTH;
  const height = compact ? COMPACT_HEIGHT : BUTTON_HEIGHT;
  const buttonStyle = {
    position: 'absolute',
    left: position?.x || 0,
    top: position?.y || 0,
    width,
    height,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: compact ? 'center' : 'flex-start',
    gap: compact ? 8 : 10,
    padding: compact ? '0 12px 0 8px' : '0 12px',
    borderRadius: height / 2,
    border: `1px solid ${colors.primary}`,
    background: colors.primaryDeep,
    color: colors.white,
    boxShadow: '0 5px 14px rgba(17, 61, 42, .25)',
    font: '600 15px system-ui, sans-serif',
    cursor: gesture.current?.dragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    transition: gesture.current?.dragging ? 'none' : 'left 150ms ease, top 150ms ease',
    zIndex: 20,
  };

  return (
    <View
      ref={containerRef}
      pointerEvents="box-none"
      onLayout={onLayout}
      style={StyleSheet.absoluteFill}
    >
      {position && !hiddenForKeyboard ? (
        <button
          type="button"
          aria-label={label}
          title="Tap to add. Drag to move this button."
          onClick={handleClick}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerCancel}
          style={buttonStyle}
        >
          <span
            aria-hidden="true"
            style={{
              width: compact ? 28 : 32,
              height: compact ? 28 : 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: compact ? 10 : 16,
              background: colors.primaryLight,
              color: colors.primaryDeep,
              fontSize: 25,
              lineHeight: 1,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            +
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>{compact ? 'Add' : label}</span>
          <span
            aria-hidden="true"
            style={{ marginLeft: 'auto', color: colors.green300, fontSize: 14 }}
          >
            ⠿
          </span>
        </button>
      ) : null}
    </View>
  );
}

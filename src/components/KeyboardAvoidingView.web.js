import React, { useEffect, useState } from 'react';
import { View } from 'react-native-web';

export default function KeyboardAvoidingView({
  children,
  style,
  keyboardVerticalOffset = 0,
  ...props
}) {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;
    const measure = () => {
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop - keyboardVerticalOffset,
      );
      setKeyboardInset(inset > 80 ? inset : 0);
    };
    measure();
    viewport.addEventListener('resize', measure);
    viewport.addEventListener('scroll', measure);
    return () => {
      viewport.removeEventListener('resize', measure);
      viewport.removeEventListener('scroll', measure);
    };
  }, [keyboardVerticalOffset]);

  return (
    <View
      {...props}
      style={[
        style,
        keyboardInset > 0 && { paddingBottom: keyboardInset },
      ]}
    >
      {children}
    </View>
  );
}

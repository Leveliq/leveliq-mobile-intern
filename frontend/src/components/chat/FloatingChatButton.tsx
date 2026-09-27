// src/components/chat/FloatingChatButton.tsx
import React, { useState, useRef } from 'react';
import { TouchableOpacity, Animated, PanResponder, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InvestIQChat from './InvestIQChat';

export default function FloatingChatButton({ portfolioContext }: { portfolioContext?: any }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <>
      {!open && (
        <Animated.View
          style={{
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
            position: 'absolute',
            bottom: insets.bottom + 30,
            right: 20,
            zIndex: 999,
          }}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setOpen(true)}
            className="w-12 h-12 rounded-full bg-[#1E293B] border border-slate-600 items-center justify-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 5,
              elevation: 5,
            }}
          >
            <MessageCircle size={22} color="#F8FAFC" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <InvestIQChat visible={open} onClose={() => setOpen(false)} portfolioContext={portfolioContext} />
    </>
  );
}
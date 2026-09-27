import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InvestIQChat from './InvestIQChat';

interface Props {
  portfolioContext?: any;
}

export default function FloatingChatButton({ portfolioContext }: Props = {}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  // Cute pulsing animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    if (!open) loop.start();
    return () => loop.stop();
  }, [pulseAnim, open]);

  return (
    <>
      {!open && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 20,
            right: 20,
            transform: [{ scale: pulseAnim }],
            zIndex: 999,
          }}
        >
          {/* Glow ring */}
          <View
            className="absolute inset-0 rounded-full bg-blue-500/30"
            style={{ transform: [{ scale: 1.3 }] }}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setOpen(true)}
            className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center border-2 border-sky-300/50"
            style={{
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.6,
              shadowRadius: 14,
              elevation: 10,
            }}
          >
            <MessageCircle size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <InvestIQChat
        visible={open}
        onClose={() => setOpen(false)}
        portfolioContext={portfolioContext}
      />
    </>
  );
}
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Bot } from 'lucide-react-native';

function Dot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#38BDF8',
        marginHorizontal: 2,
        transform: [{ translateY }],
        opacity,
      }}
    />
  );
}

export default function TypingIndicator() {
  return (
    <View className="flex-row items-end mb-3">
      <View className="w-8 h-8 rounded-lg bg-blue-600 items-center justify-center mr-2">
        <Bot size={14} color="#fff" />
      </View>
      <View className="bg-slate-800/70 border border-slate-700/50 rounded-[18px] rounded-bl-[4px] px-4 py-3 flex-row">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
}
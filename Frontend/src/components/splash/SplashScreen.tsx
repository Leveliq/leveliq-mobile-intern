import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, useWindowDimensions, Easing } from 'react-native';
import { SvgXml } from 'react-native-svg';

const svgLogoXML = `
<svg width="100%" height="100%" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M38 35V85C38 90.5228 42.4772 95 48 95H92" stroke="url(#l-gradient)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M46 73L63 54L77 66L102 37" stroke="#38BDF8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M88 37H102V51" stroke="#38BDF8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="97" cy="90" r="5.5" fill="#38BDF8" />
  <defs>
    <linearGradient id="l-gradient" x1="38" y1="35" x2="92" y2="95" gradientUnits="userSpaceOnUse">
      <stop stop-color="#60A5FA" />
      <stop offset="1" stop-color="#2563EB" />
    </linearGradient>
  </defs>
</svg>
`;

export default function SplashScreen({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const { width, height } = useWindowDimensions();

  // Responsive sizing
  const isSmallDevice = height < 700;
  const isLargeDevice = width > 420;
  const logoSize = isSmallDevice ? 118 : isLargeDevice ? 154 : 138;

  // Animation values
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.75)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslate = useRef(new Animated.Value(18)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(10)).current;
  const lineScale = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(glowScale, { toValue: 1, friction: 8, tension: 35, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(brandOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(brandTranslate, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(taglineTranslate, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(lineScale, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // Pulse loop
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    pulseAnimation.start();

    // Exit timeout
    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true })
        .start(({ finished }) => finished && onAnimationComplete());
    }, 2600);

    return () => { clearTimeout(timer); pulseAnimation.stop(); };
  }, []);

  const animatedGlowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const animatedGlowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0.65] });

  return (
    <Animated.View className="flex-1 bg-[#050816] items-center justify-center overflow-hidden" style={{ opacity: screenOpacity }}>
      
      {/* Background Ambient Effects */}
      <View pointerEvents="none" className="absolute inset-0">
        <View className="absolute self-center rounded-full bg-[#123D91] opacity-[0.13]" style={{ width: width * 1.15, height: width * 1.15, top: -width * 0.42 }} />
        <View className="absolute self-center rounded-full bg-[#0C4A6E] opacity-[0.08]" style={{ width: width * 0.8, height: width * 0.8, bottom: -width * 0.35 }} />
        <View className="absolute w-[1px] h-[70%] top-[15%] left-[50%] bg-blue-400/10" />
      </View>

      {/* Main Content */}
      <View className="items-center justify-center w-full px-7 -mt-5">
        
        {/* Logo Section */}
        <View className="items-center justify-center mb-6" style={{ width: logoSize * 1.65, height: logoSize * 1.65 }}>
          <Animated.View
            pointerEvents="none"
            className="absolute bg-blue-600"
            style={{
              width: logoSize * 1.35, height: logoSize * 1.35, borderRadius: logoSize,
              opacity: animatedGlowOpacity, transform: [{ scale: animatedGlowScale }],
              shadowColor: '#38BDF8', shadowOpacity: 0.7, shadowRadius: 45, elevation: 20
            }}
          />
          <Animated.View
            className="absolute border border-sky-400/20 bg-blue-600/5"
            style={{
              width: logoSize * 1.2, height: logoSize * 1.2, borderRadius: logoSize,
              opacity: glowOpacity, transform: [{ scale: glowScale }]
            }}
          />
          <Animated.View
            className="items-center justify-center bg-[#0f234e]/70 border border-blue-400/20"
            style={{
              width: logoSize, height: logoSize, borderRadius: logoSize * 0.27,
              opacity: logoOpacity, transform: [{ scale: logoScale }],
              shadowColor: '#2563EB', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.4, shadowRadius: 32, elevation: 16
            }}
          >
            <View className="w-[78%] h-[78%] items-center justify-center">
              <SvgXml xml={svgLogoXML} width="100%" height="100%" />
            </View>
          </Animated.View>
        </View>

        {/* Brand Text */}
        <Animated.View className="items-center" style={{ opacity: brandOpacity, transform: [{ translateY: brandTranslate }] }}>
          <Text className="text-[#F8FAFC] text-4xl font-extrabold tracking-[5px] text-center">
            LEVEL<Text className="text-[#38BDF8]">IQ</Text>
          </Text>
          <View className="flex-row h-[2px] w-12 mt-3 rounded-sm overflow-hidden">
            <View className="flex-1 bg-blue-600" />
            <View className="flex-1 bg-[#38BDF8]" />
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.View className="items-center mt-5" style={{ opacity: taglineOpacity, transform: [{ translateY: taglineTranslate }] }}>
          <Text className="text-slate-400 text-[10px] font-bold tracking-[3px] text-center">PORTFOLIO INTELLIGENCE</Text>
          <Text className="mt-3 text-slate-500 text-sm leading-[21px] text-center">See what your portfolio{'\n'}is really exposed to.</Text>
        </Animated.View>
      </View>

      {/* Bottom Status */}
      <View className="absolute bottom-10 left-7 right-7 items-center">
        <Animated.View className="flex-row items-center justify-center" style={{ opacity: dotOpacity }}>
          <View className="w-[5px] h-[5px] rounded-full bg-[#38BDF8] mr-2" style={{ shadowColor: '#38BDF8', shadowOpacity: 0.8, shadowRadius: 5 }} />
          <Text className="text-slate-600 text-[8px] font-semibold tracking-[1.5px]">DATA-DRIVEN · TRANSPARENT · NO HYPE</Text>
        </Animated.View>
        <Animated.View className="mt-[18px] w-[90px] h-[2px] rounded-sm overflow-hidden bg-slate-400/10" style={{ opacity: taglineOpacity }}>
          <Animated.View className="w-full h-full bg-[#38BDF8]" style={{ transform: [{ scaleX: lineScale }], transformOrigin: 'left' as any }} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, useWindowDimensions, Easing } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Inline SVG string — 5KB vector, no PNG overhead
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254">
  <defs>
    <linearGradient id="blueShine" x1="14%" y1="8%" x2="86%" y2="92%">
      <stop offset="0%" stop-color="#19B8FF"/>
      <stop offset="100%" stop-color="#0B5CFF"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#19B8FF" stop-opacity="0.48"/>
      <stop offset="100%" stop-color="#19B8FF" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="logoClip">
      <path d="M 277.00 376.00 L 263.00 401.00 L 257.00 426.00 L 257.00 853.00 L 263.00 883.00 L 278.00 917.00 L 298.00 944.00 L 327.00 970.00 L 350.00 984.00 L 373.00 994.00 L 405.00 1003.00 L 431.00 1006.00 L 764.00 1006.00 L 772.00 1001.00 L 774.00 989.00 L 717.00 919.00 L 717.00 912.00 L 752.00 917.00 L 792.00 917.00 L 820.00 913.00 L 859.00 903.00 L 883.00 927.00 L 912.00 939.00 L 1025.00 940.00 L 1033.00 934.00 L 1033.00 921.00 L 969.00 854.00 L 969.00 849.00 L 987.00 830.00 L 1009.00 800.00 L 1026.00 768.00 L 1038.00 735.00 L 1045.00 705.00 L 1048.00 677.00 L 1045.00 613.00 L 1028.00 553.00 L 1008.00 512.00 L 976.00 468.00 L 938.00 433.00 L 906.00 412.00 L 859.00 393.00 L 815.00 384.00 L 768.00 383.00 L 722.00 390.00 L 672.00 407.00 L 632.00 429.00 L 595.00 458.00 L 566.00 489.00 L 549.00 513.00 L 541.00 529.00 L 553.00 527.00 L 573.00 528.00 L 601.00 537.00 L 626.00 558.00 L 639.00 582.00 L 658.00 555.00 L 684.00 531.00 L 715.00 513.00 L 746.00 503.00 L 774.00 499.00 L 810.00 502.00 L 843.00 513.00 L 866.00 527.00 L 886.00 545.00 L 898.00 560.00 L 912.00 584.00 L 921.00 609.00 L 926.00 637.00 L 926.00 667.00 L 921.00 693.00 L 906.00 728.00 L 882.00 758.00 L 877.00 758.00 L 830.00 710.00 L 810.00 700.00 L 799.00 698.00 L 705.00 698.00 L 698.00 701.00 L 694.00 707.00 L 696.00 717.00 L 764.00 794.00 L 763.00 800.00 L 747.00 800.00 L 720.00 795.00 L 689.00 782.00 L 669.00 768.00 L 652.00 752.00 L 628.00 714.00 L 621.00 692.00 L 618.00 666.00 L 595.00 687.00 L 571.00 697.00 L 539.00 699.00 L 506.00 689.00 L 508.00 714.00 L 514.00 739.00 L 534.00 786.00 L 566.00 831.00 L 587.00 851.00 L 609.00 867.00 L 612.00 874.00 L 608.00 876.00 L 480.00 876.00 L 466.00 873.00 L 455.00 867.00 L 443.00 853.00 L 438.00 840.00 L 437.00 290.00 L 435.00 286.00 L 427.00 280.00 L 414.00 282.00 L 297.00 356.00 Z M 546.00 548.00 L 525.00 554.00 L 509.00 565.00 L 502.00 573.00 L 491.00 594.00 L 489.00 623.00 L 493.00 637.00 L 501.00 652.00 L 515.00 665.00 L 534.00 674.00 L 556.00 676.00 L 571.00 673.00 L 584.00 667.00 L 602.00 651.00 L 614.00 625.00 L 615.00 602.00 L 607.00 579.00 L 591.00 561.00 L 569.00 550.00 Z" fill-rule="evenodd"/>
    </clipPath>
  </defs>
  <path d="M 277.00 376.00 L 263.00 401.00 L 257.00 426.00 L 257.00 853.00 L 263.00 883.00 L 278.00 917.00 L 298.00 944.00 L 327.00 970.00 L 350.00 984.00 L 373.00 994.00 L 405.00 1003.00 L 431.00 1006.00 L 764.00 1006.00 L 772.00 1001.00 L 774.00 989.00 L 717.00 919.00 L 717.00 912.00 L 752.00 917.00 L 792.00 917.00 L 820.00 913.00 L 859.00 903.00 L 883.00 927.00 L 912.00 939.00 L 1025.00 940.00 L 1033.00 934.00 L 1033.00 921.00 L 969.00 854.00 L 969.00 849.00 L 987.00 830.00 L 1009.00 800.00 L 1026.00 768.00 L 1038.00 735.00 L 1045.00 705.00 L 1048.00 677.00 L 1045.00 613.00 L 1028.00 553.00 L 1008.00 512.00 L 976.00 468.00 L 938.00 433.00 L 906.00 412.00 L 859.00 393.00 L 815.00 384.00 L 768.00 383.00 L 722.00 390.00 L 672.00 407.00 L 632.00 429.00 L 595.00 458.00 L 566.00 489.00 L 549.00 513.00 L 541.00 529.00 L 553.00 527.00 L 573.00 528.00 L 601.00 537.00 L 626.00 558.00 L 639.00 582.00 L 658.00 555.00 L 684.00 531.00 L 715.00 513.00 L 746.00 503.00 L 774.00 499.00 L 810.00 502.00 L 843.00 513.00 L 866.00 527.00 L 886.00 545.00 L 898.00 560.00 L 912.00 584.00 L 921.00 609.00 L 926.00 637.00 L 926.00 667.00 L 921.00 693.00 L 906.00 728.00 L 882.00 758.00 L 877.00 758.00 L 830.00 710.00 L 810.00 700.00 L 799.00 698.00 L 705.00 698.00 L 698.00 701.00 L 694.00 707.00 L 696.00 717.00 L 764.00 794.00 L 763.00 800.00 L 747.00 800.00 L 720.00 795.00 L 689.00 782.00 L 669.00 768.00 L 652.00 752.00 L 628.00 714.00 L 621.00 692.00 L 618.00 666.00 L 595.00 687.00 L 571.00 697.00 L 539.00 699.00 L 506.00 689.00 L 508.00 714.00 L 514.00 739.00 L 534.00 786.00 L 566.00 831.00 L 587.00 851.00 L 609.00 867.00 L 612.00 874.00 L 608.00 876.00 L 480.00 876.00 L 466.00 873.00 L 455.00 867.00 L 443.00 853.00 L 438.00 840.00 L 437.00 290.00 L 435.00 286.00 L 427.00 280.00 L 414.00 282.00 L 297.00 356.00 Z M 546.00 548.00 L 525.00 554.00 L 509.00 565.00 L 502.00 573.00 L 491.00 594.00 L 489.00 623.00 L 493.00 637.00 L 501.00 652.00 L 515.00 665.00 L 534.00 674.00 L 556.00 676.00 L 571.00 673.00 L 584.00 667.00 L 602.00 651.00 L 614.00 625.00 L 615.00 602.00 L 607.00 579.00 L 591.00 561.00 L 569.00 550.00 Z" fill="url(#blueShine)" fill-rule="evenodd"/>
  <g clip-path="url(#logoClip)">
    <path d="M170 500 C270 330 430 250 610 270 C450 315 330 390 255 540 C220 610 195 650 160 680 Z" fill="url(#gloss)"/>
    <path d="M520 270 C690 210 875 300 1005 430 C890 350 760 330 640 380 C585 403 545 370 520 270 Z" fill="#19B8FF" opacity="0.10"/>
  </g>
</svg>`;

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
            <View className="w-[82%] h-[82%] items-center justify-center">
            <SvgXml xml={LOGO_SVG} width="100%" height="100%" />
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
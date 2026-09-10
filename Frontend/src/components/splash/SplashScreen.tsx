// src/components/splash/SplashScreen.tsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Easing,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const svgLogoXML = `
<svg
  width="100%"
  height="100%"
  viewBox="0 0 130 130"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M38 35V85C38 90.5228 42.4772 95 48 95H92"
    stroke="url(#l-gradient)"
    stroke-width="11"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <path
    d="M46 73L63 54L77 66L102 37"
    stroke="#38BDF8"
    stroke-width="8"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <path
    d="M88 37H102V51"
    stroke="#38BDF8"
    stroke-width="8"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <circle
    cx="97"
    cy="90"
    r="5.5"
    fill="#38BDF8"
  />

  <defs>
    <linearGradient
      id="l-gradient"
      x1="38"
      y1="35"
      x2="92"
      y2="95"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#60A5FA" />
      <stop offset="1" stop-color="#2563EB" />
    </linearGradient>
  </defs>
</svg>
`;

export default function SplashScreen({
  onAnimationComplete,
}: SplashScreenProps) {
  const { width, height } = useWindowDimensions();

  /*
   * ---------------------------------------------------------
   * RESPONSIVE SIZING
   * ---------------------------------------------------------
   */

  const isSmallDevice = height < 700;
  const isLargeDevice = width > 420;

  const logoSize = isSmallDevice
    ? 118
    : isLargeDevice
      ? 154
      : 138;

  /*
   * ---------------------------------------------------------
   * ANIMATION VALUES
   * ---------------------------------------------------------
   */

  const screenOpacity = useRef(new Animated.Value(1)).current;

  const logoScale = useRef(
    new Animated.Value(0.72)
  ).current;

  const logoOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const glowScale = useRef(
    new Animated.Value(0.75)
  ).current;

  const glowOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const brandOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const brandTranslate = useRef(
    new Animated.Value(18)
  ).current;

  const taglineOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const taglineTranslate = useRef(
    new Animated.Value(10)
  ).current;

  const lineScale = useRef(
    new Animated.Value(0)
  ).current;

  const pulse = useRef(
    new Animated.Value(0)
  ).current;

  const dotOpacity = useRef(
    new Animated.Value(0)
  ).current;

  /*
   * ---------------------------------------------------------
   * INTRO ANIMATION
   * ---------------------------------------------------------
   */

  useEffect(() => {
    Animated.sequence([
      /*
       * Logo reveal
       */
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 55,
          useNativeDriver: true,
        }),

        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.spring(glowScale, {
          toValue: 1,
          friction: 8,
          tension: 35,
          useNativeDriver: true,
        }),
      ]),

      /*
       * Brand reveal
       */
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(brandTranslate, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      /*
       * Tagline
       */
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(taglineTranslate, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(lineScale, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    /*
     * -------------------------------------------------------
     * SUBTLE CONTINUOUS GLOW
     * -------------------------------------------------------
     */

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    /*
     * -------------------------------------------------------
     * SPLASH EXIT
     * -------------------------------------------------------
     */

    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onAnimationComplete();
        }
      });
    }, 2600);

    return () => {
      clearTimeout(timer);
      pulseAnimation.stop();
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * DERIVED ANIMATION VALUES
   * ---------------------------------------------------------
   */

  const animatedGlowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const animatedGlowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 0.65],
  });

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenOpacity,
        },
      ]}
    >
      {/* ---------------------------------------------------
          BACKGROUND AMBIENCE
      --------------------------------------------------- */}

      <View pointerEvents="none" style={styles.background}>
        <View
          style={[
            styles.topGlow,
            {
              width: width * 1.15,
              height: width * 1.15,
              top: -width * 0.42,
            },
          ]}
        />

        <View
          style={[
            styles.bottomGlow,
            {
              width: width * 0.8,
              height: width * 0.8,
              bottom: -width * 0.35,
            },
          ]}
        />

        {/* Subtle vertical light beam */}
        <View style={styles.lightBeam} />
      </View>

      {/* ---------------------------------------------------
          MAIN CONTENT
      --------------------------------------------------- */}

      <View style={styles.content}>
        {/* Logo */}
        <View
          style={[
            styles.logoArea,
            {
              width: logoSize * 1.65,
              height: logoSize * 1.65,
            },
          ]}
        >
          {/* Animated ambient glow */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.logoGlow,
              {
                width: logoSize * 1.35,
                height: logoSize * 1.35,
                borderRadius: logoSize,
                opacity: animatedGlowOpacity,
                transform: [
                  {
                    scale: animatedGlowScale,
                  },
                ],
              },
            ]}
          />

          {/* Secondary ring */}
          <Animated.View
            style={[
              styles.logoRing,
              {
                width: logoSize * 1.2,
                height: logoSize * 1.2,
                borderRadius: logoSize,
                opacity: glowOpacity,
                transform: [
                  {
                    scale: glowScale,
                  },
                ],
              },
            ]}
          />

          {/* Actual logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                width: logoSize,
                height: logoSize,
                borderRadius: logoSize * 0.27,
                opacity: logoOpacity,
                transform: [
                  {
                    scale: logoScale,
                  },
                ],
              },
            ]}
          >
            <View style={styles.logoInner}>
              <SvgXml
                xml={svgLogoXML}
                width="100%"
                height="100%"
              />
            </View>
          </Animated.View>
        </View>

        {/* ------------------------------------------------
            BRAND
        ------------------------------------------------ */}

        <Animated.View
          style={[
            styles.brandBlock,
            {
              opacity: brandOpacity,
              transform: [
                {
                  translateY: brandTranslate,
                },
              ],
            },
          ]}
        >
          <Text style={styles.brand}>
            LEVEL
            <Text style={styles.brandAccent}>IQ</Text>
          </Text>

          <View style={styles.brandUnderline}>
            <View style={styles.underlineBlue} />
            <View style={styles.underlineCyan} />
          </View>
        </Animated.View>

        {/* ------------------------------------------------
            TAGLINE
        ------------------------------------------------ */}

        <Animated.View
          style={[
            styles.taglineBlock,
            {
              opacity: taglineOpacity,
              transform: [
                {
                  translateY: taglineTranslate,
                },
              ],
            },
          ]}
        >
          <Text style={styles.tagline}>
            PORTFOLIO INTELLIGENCE
          </Text>

          <Text style={styles.description}>
            See what your portfolio
            {'\n'}
            is really exposed to.
          </Text>
        </Animated.View>
      </View>

      {/* ---------------------------------------------------
          BOTTOM STATUS
      --------------------------------------------------- */}

      <View style={styles.bottomArea}>
        <Animated.View
          style={[
            styles.statusLine,
            {
              opacity: dotOpacity,
            },
          ]}
        >
          <View style={styles.statusDot} />

          <Text style={styles.statusText}>
            DATA-DRIVEN · TRANSPARENT · NO HYPE
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.progressTrack,
            {
              opacity: taglineOpacity,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                transform: [
                  {
                    scaleX: lineScale,
                  },
                ],
              },
            ]}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  /*
   * -------------------------------------------------------
   * BACKGROUND
   * -------------------------------------------------------
   */

  background: {
    ...StyleSheet.absoluteFillObject,
  },

  topGlow: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 9999,
    backgroundColor: '#123D91',
    opacity: 0.13,
  },

  bottomGlow: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 9999,
    backgroundColor: '#0C4A6E',
    opacity: 0.08,
  },

  lightBeam: {
    position: 'absolute',
    width: 1,
    height: '70%',
    top: '15%',
    left: '50%',
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
  },

  /*
   * -------------------------------------------------------
   * CONTENT
   * -------------------------------------------------------
   */

  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 28,
    marginTop: -20,
  },

  /*
   * -------------------------------------------------------
   * LOGO
   * -------------------------------------------------------
   */

  logoArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },

  logoGlow: {
    position: 'absolute',
    backgroundColor: '#2563EB',
    shadowColor: '#38BDF8',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.7,
    shadowRadius: 45,
    elevation: 20,
  },

  logoRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    backgroundColor: 'rgba(37, 99, 235, 0.035)',
  },

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 35, 78, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.22)',

    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 18,
    },
    shadowOpacity: 0.4,
    shadowRadius: 32,

    elevation: 16,
  },

  logoInner: {
    width: '78%',
    height: '78%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /*
   * -------------------------------------------------------
   * BRAND
   * -------------------------------------------------------
   */

  brandBlock: {
    alignItems: 'center',
  },

  brand: {
    color: '#F8FAFC',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 5,
    textAlign: 'center',
  },

  brandAccent: {
    color: '#38BDF8',
  },

  brandUnderline: {
    flexDirection: 'row',
    height: 2,
    width: 48,
    marginTop: 13,
    borderRadius: 2,
    overflow: 'hidden',
  },

  underlineBlue: {
    flex: 1,
    backgroundColor: '#2563EB',
  },

  underlineCyan: {
    flex: 1,
    backgroundColor: '#38BDF8',
  },

  /*
   * -------------------------------------------------------
   * TAGLINE
   * -------------------------------------------------------
   */

  taglineBlock: {
    alignItems: 'center',
    marginTop: 20,
  },

  tagline: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
  },

  description: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  /*
   * -------------------------------------------------------
   * BOTTOM
   * -------------------------------------------------------
   */

  bottomArea: {
    position: 'absolute',
    bottom: 38,
    left: 28,
    right: 28,
    alignItems: 'center',
  },

  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 8,
    shadowColor: '#38BDF8',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },

  statusText: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  progressTrack: {
    marginTop: 18,
    width: 90,
    height: 2,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },

  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#38BDF8',
    transformOrigin: 'left',
  },
});
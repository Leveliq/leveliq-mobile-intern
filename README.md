# LevelIQ

> Portfolio intelligence platform for Indian mutual fund investors — analyzes overlap, concentration, sector exposure, and overall portfolio health.

**Website:** https://leveliq.in/

---

## What It Does

LevelIQ analyzes a mutual fund portfolio **as a whole system**, not fund by fund. Core insight: owning 5 funds ≠ being diversified if they all hold the same underlying stocks.

### Feature Modules

| Module | What it does |
|---|---|
| **PortfolioIQ™** | Full portfolio breakdown — composition, allocation, fund relationships, underlying stock & sector exposure |
| **OverlapIQ™** | Finds stocks held across multiple funds. Flags when two "different" funds are actually buying the same companies |
| **RiskIQ™** | Portfolio-level risk signals — sector over-concentration, repeated stock exposure, category clustering |
| **InsightIQ™** | Converts raw analytics into plain observations: what's wrong, what's strong, what needs attention |
| **StarterIQ™** | Guides new investors on building a clean portfolio from scratch — avoid overlap before it starts |
| **Portfolio Health Score™** | Single score summarising overall portfolio health (diversification + overlap + concentration + risk) |
| **Pre-SIP Checker** | Before starting a new SIP, check if the new fund increases overlap or genuinely adds diversification |
| **Market Brief** | Market-context summaries relevant to portfolio decisions |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native (Expo) |
| Routing | Expo Router (file-based) |
| Styling | React Native StyleSheet |
| Animations | React Native Animated API |
| SVG | react-native-svg |
| Database | PostgreSQL (via Supabase) |
| Backend hosting | Railway |
| Frontend hosting | Vercel |
| Payments | Razorpay |

---

## Project Structure

```
LevelIq/
├── Frontend/               # React Native / Expo mobile app
│   ├── src/
│   │   ├── app/            # Expo Router screens (_layout, index)
│   │   ├── components/
│   │   │   └── splash/     # Custom SplashScreen
│   │   ├── constants/      # Theme tokens (colors, spacing, fonts)
│   │   ├── hooks/          # useTheme, useColorScheme
│   │   └── global.css      # Web font variables
│   ├── assets/
│   │   ├── images/         # App icon, splash, android adaptive icons
│   │   └── expo.icon/      # iOS icon config
│   ├── app.json            # Expo config (icons, splash, plugins)
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## Getting Started

```bash
cd Frontend
npm install
npx expo start
```

| Command | Platform |
|---|---|
| `npm run android` | Android |
| `npm run ios` | iOS |
| `npm run web` | Web |

Requires [Expo Go](https://expo.dev/go) on device or an Android/iOS simulator.

---

## Key Architecture Notes

- `src/app/_layout.tsx` — root layout; renders `SplashScreen` until animation completes, then mounts the app via `<Slot />`
- `src/components/splash/SplashScreen.tsx` — fully custom splash with `Animated` sequences (logo reveal → brand → tagline → fade out)
- `src/constants/theme.ts` — single source of truth for colors, spacing, and font tokens
- `src/hooks/use-theme.ts` — reads current color scheme and returns typed theme object

---

## Environment

- **Expo SDK:** ~57
- **React Native:** 0.86
- **React:** 19
- **TypeScript:** ~6.0
- **Node:** 18+

---

## License

Source code, branding, analytical models, and proprietary content remain the property of their respective owners.

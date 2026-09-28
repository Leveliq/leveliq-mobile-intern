const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Exclude web-only packages from native bundles to reduce APK size
config.resolver = {
  ...config.resolver,
  blockList: [
    // These are web-only and add ~3MB to the APK needlessly
    /node_modules\/react-dom\/.*/,
    /node_modules\/react-native-web\/.*/,
  ],
};

module.exports = withNativeWind(config, {
  input: './global.css', // root global.css
});
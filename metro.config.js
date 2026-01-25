const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure "react-native" export condition is preferred over "import" so that
// packages like Zustand resolve their CJS builds (which don't use import.meta)
// instead of ESM .mjs builds that break in non-module script contexts.
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];

module.exports = config;

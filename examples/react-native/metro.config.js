const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const path = require("path");

// extraNodeModules seems to require the path to be part of watchFolders in order to resolve
// the symlinked packages correctly - see https://github.com/facebook/metro/issues/1204
const performanceModuleDir = path.resolve(__dirname, "../../packages/platforms/react-native");
const coreModuleDir = path.resolve(__dirname, "../../packages/core");
const deliveryFetchModuleDir = path.resolve(__dirname, "../../packages/delivery-fetch");
const requestTrackerModuleDir = path.resolve(__dirname, "../../packages/request-tracker");

const extraNodeModules = {
  "@bugsnag/react-native-performance": path.resolve(__dirname, "../../packages/platforms/react-native"),
  "@bugsnag/core-performance": path.resolve(__dirname, "../../packages/core"),
  "@bugsnag/delivery-fetch-performance": path.resolve(__dirname, "../../packages/delivery-fetch"),
  "@bugsnag/request-tracker-performance": path.resolve(__dirname, "../../packages/request-tracker"),
  "@bugsnag/cuid": path.resolve(__dirname, "../../node_modules/@bugsnag/cuid"),
};

const watchFolders = [
  performanceModuleDir,
  coreModuleDir,
  deliveryFetchModuleDir,
  requestTrackerModuleDir,
  path.resolve(__dirname, "../../node_modules/@bugsnag/cuid")
];

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: watchFolders,
  resolver: {
    extraNodeModules: new Proxy(extraNodeModules, {
      get: (target, name) =>
        // redirect dependencies referenced from extra packages to local node_modules
        name in target ? target[name] : path.join(process.cwd(), `node_modules/${name}`),
    }),
  }
};


module.exports = mergeConfig(getDefaultConfig(__dirname), config);

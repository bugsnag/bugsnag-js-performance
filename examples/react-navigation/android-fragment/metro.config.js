const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    watchFolders: [path.join(__dirname, '..', '..', '..')],
    resolver: {
        unstable_enableSymlinks: true
    }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

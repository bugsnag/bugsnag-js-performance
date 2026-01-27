# Fixture Generation Scripts

This directory contains scripts and utilities for generating React Native and Expo test fixtures used in the test suite. These scripts create and configure test applications with the Bugsnag Performance SDK integrated.

## Available Scripts

The fixture generation is handled by the following scripts:

- **`generate-react-native-fixture`** - Creates React Native test fixtures
- **`generate-expo-fixture`** - Creates Expo test fixtures

## Utilities

This directory contains shared utilities that support the fixture generation process:

### Core Utilities

- **`constants.js`** - Package names, directories, and other constants
- **`env-validation.js`** - Environment variable validation helpers
- **`build-utils.js`** - Package building functionality
- **`file-utils.js`** - File system operations
- **`dependency-utils.js`** - Dependency management and version resolution

### Platform-Specific Utilities

- **`react-native-config.js`** - React Native project configuration
- **`rn-064-config.js`** - React Native 0.64 specific configuration
- **`platform-builds.js`** - Android and iOS build processes

The utilities in this directory are imported by the main generation scripts as needed:

```javascript
const { validateEnvironment, buildPackages } = require('./scripts/build-utils')
const { configureIOSProject } = require('./scripts/react-native-config')
```

## Usage

To generate a fixture, run the appropriate script from the repository root:

```bash
# Generate React Native fixture
node test/react-native/scripts/generate-react-native-fixture.js

# Generate Expo fixture  
node test/react-native/scripts/generate-expo-fixture.js
```

## Environment Variables

The fixture generation scripts support various environment variables to customize the build process. Check the individual scripts for specific options.

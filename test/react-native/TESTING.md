# React Native testing

## Building the test fixture

To generate a test fixture, from the root directory run the `generate-react-native-fixture.js` script, specifying the following environment variables:
-  `RN_VERSION` - React Native version, e.g. 0.77
-  `NOTIFIER_VERSION` - Notifier version, e.g. 8.0.0
-  `RCT_NEW_ARCH_ENABLED` - 1 (new architecture) or 0 (old architecture)

```sh
RN_VERSION=0.77 NOTIFIER_VERSION=8.0.0 RCT_NEW_ARCH_ENABLED=1 node test/react-native/scripts/generate-react-native-fixture.js
```

This will generate a React Native project in `test/react-native/features/fixtures/generated/<old-arch|new-arch>/<RN_VERSION>`, and will also package the performance libraries and scenarios and install them into the test fixture project

To generate an Android apk and/or iOS ipa, you will additionally need to set the `BUILD_ANDROID` and `BUILD_IOS` environment variables respectively.

### Scenarios

Scenarios are written as React Native components and are packaged as a separate module under `test/react-native/features/fixtures/scenario-launcher` - these are packaged and installed into the test fixture when it's generated.

When running tests using maze runner, scenarios are launched via maze runner commands (see `env.rb`). However it's also possible to launch the test fixture locally (e.g. via `npx react-native run-android`) and run specific scenarios outside of maze runner by hardcoding a command in ScenarioLauncher.js

## Local testing with BrowserStack

__Note: only SmartBear employees can run the end-to-end tests with BrowserStack.__ We have dedicated test infrastructure and private BrowserStack credentials which can't be shared outside of the organisation.

The following environment variables need to be set - credentials can be found in our shared password manager:

- `BROWSER_STACK_USERNAME`
- `BROWSER_STACK_ACCESS_KEY`
- `MAZE_BS_LOCAL`

To run all the tests, run the following in `test/react-native`:

```sh
bundle exec maze-runner --farm=bs --device=IOS_14 --a11y-locator --app=features/fixtures/generated/0.72/output/reactnative.ipa
```

Or to run a single feature file:

```sh
bundle exec maze-runner --farm=bs --device=IOS_14 --a11y-locator --app=features/fixtures/generated/0.72/output/reactnative.ipa features/manual-spans.feature
```

## CI test matrix

End-to-end tests in CI run on both Android and iOS, for both old and new architecture (where supported), across a range of React Native versions. When a new version of React Native is released, the CI test matrix should be updated to test against the following React Native versions from newest to oldest:

- The latest 3 versions of React Native
- Even versions of React Native going back to 0.72
- 0.64

## Expo testing

To generate an Expo test fixture, from the root directory run the `./bin/generate-expo-fixture` script. You will need to make sure the following environment variables are set:

__Note: only SmartBear employees can build the Expo test fixture.__ The build requires private credentials which can't be shared outside of the organisation.

-  `EXPO_VERSION` - Expo SDK version, e.g. 52
-  `EXPO_EAS_PROJECT_ID` - The EAS project ID for the test fixture project
-  `EXPO_TOKEN` - Authentication token for EAS build - or, alternatively make sure you're logged in to the eas CLI (`eas login`)
-  `EXPO_CREDENTIALS_DIR` - Path to a directory containing code signing credentials for the test fixture

This will generate an Expo project in `test/react-native/features/fixtures/generated/expo/<EXPO_VERSION>/test-fixture`, and will also package the performance libraries and scenarios and install them into the test fixture project.

To generate an Android apk and/or iOS ipa, you will additionally need to set the `BUILD_ANDROID` and `BUILD_IOS` environment variables respectively.

Note that in order to run the test fixture locally, you will need to [create a development build](https://docs.expo.dev/develop/development-builds/create-a-build/).
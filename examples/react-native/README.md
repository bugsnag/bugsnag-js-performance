# React Native Performance Example

This is an example project showing how to use `@bugsnag/react-native-performance` in a React Native project.

This project was bootstrapped with `@react-native-community/cli init`.

For instructions on how to install and configure BugSnag Performance in your own application please consult our React Native [documentation](https://docs.bugsnag.com/performance/integration-guides/react-native/).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

1. Clone the `bugsnag-js-performance` repo and build the packages:

  ```bash
  git clone git@github.com:bugsnag/bugsnag-js-performance.git
  cd bugsnag-js-performance
  npm install
  npm run build
  ```

1. `cd` into the directory of this example and install the project dependencies

  ```bash
  # using npm
  npm install

  # OR using Yarn
  yarn install
  ```

1. For iOS, install the CocoaPods dependencies from the `ios/` directory using:

  ```bash
  pod install 
  ```

1. In `index.js`, set `YOUR_API_KEY` to your BugSnag project's API Key.

## Build and run the app

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Generating Performance Data

Use the buttons in the example app to generate different types of spans and send them to BugSnag. To view Performance data from the example app, navigate to the Performance tab of your BugSnag project in the BugSnag Dashboard.

App Start spans will be generated automatically unless the `autoInstrumentAppStarts` configuration option has been set to `false`. For a full list of configuration options please see the [documentation](https://docs.bugsnag.com/performance/integration-guides/react-native/).

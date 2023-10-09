# React Native Performance Example

This is an example project showing how to use `@bugsnag/react-native-performance` with a React Native v0.72 project.

This project was bootstrapped with `react-native init`.

For instructions on how to install and configure BugSnag Performance in your own application please consult our React Native [documentation](https://docs.bugsnag.com/performance/integration-guides/react-native/).

## Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions up to "Creating a new application" step, before proceeding.

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
  npm install --install-links

  # OR using Yarn
  yarn install
  ```

1. For iOS only, install the native dependencies from the `ios/` directory using:

  ```bash
  pod install 
  ```

1. Open `App.tsx` in your text editor of choice and set `YOUR_API_KEY` to your BugSnag project's API Key.

## Start the Application

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following commands to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Generating Performance Data

Use the buttons in the example app to generate different types of spans and send them to BugSnag. To view Performance data from the example app, navigate to the Performance tab of your BugSnag project in the BugSnag Dashboard.

App Start spans will be generated automatically unless the `autoInstrumentAppStarts` configuration option has been set to `false`. For a full list of configuration options please see the [documentation](https://docs.bugsnag.com/performance/integration-guides/react-native/).


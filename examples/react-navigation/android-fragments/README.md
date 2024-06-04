# React Navigation Android Fragment Example

This is an example project showing how to use `@bugsnag/react-navigation-performance` in a React Native project using an [Android Fragment](https://reactnative.dev/docs/integration-with-android-fragment).

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
  
2. `cd` into the directory of this example and install the project dependencies

  ```bash
  # using npm
  npm install --install-links
  ```

3. Open `src/App.js` in your text editor of choice and set `YOUR_API_KEY` to your BugSnag project's API Key.

## Start the Application

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
npm start
```

Let Metro Bundler run in its _own_ terminal, Open the `android` directory of this example in Android Studio and start the app.

## Generating Performance Data

Use the buttons in the example app to generate different types of spans and send them to BugSnag. To view Performance data from the example app, navigate to the Performance tab of your BugSnag project in the BugSnag Dashboard.

For a full list of configuration options please see the [documentation](https://docs.bugsnag.com/performance/integration-guides/react-native/).

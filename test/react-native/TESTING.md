# React Native testing

## Building the test fixture

To generate a test fixture, from the root directory run the `./bin/generate-react-native-fixture` script, specifying a React Native version as `RN_VERSION`:

```sh
RN_VERSION=0.72 ./bin/generate-react-native-fixture
```

This will generate a React Native project in `test/react-native/features/fixtures/generated/<RN_VERSION>`, and will also package the performance libraries and scenarios and install them into the test fixture project

To generate an Android apk and/or iOS ipa, you will additionally need to set the `BUILD_ANDROID` and `BUILD_IOS` environment variables respectively.

### Scenarios

Scenarios are written as React Native components and are packaged as a separate module under `test/react-native/features/fixtures/performance-scenarios` - these are packaged and installed into the test fixture when it's generated.

When running tests using maze runner, scenarios are launched via maze runner commands (see `env.rb`). However it's also possible to launch the test fixture locally (e.g. via `npx react-native run-android`) and run scenarios outside of maze runner by setting the appropriate environment variables in the test fixture's `.env` file

## Running the end-to-end tests with BrowserStack

__Note: only Bugsnag employees can run the end-to-end tests with BrowserStack.__ We have dedicated test infrastructure and private BrowserStack credentials which can't be shared outside of the organisation.

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

# Browser testing

## Running the end-to-end tests locally

To run the tests locally, you'll need a copy of Chrome and ChromeDriver (available with Homebrew):

```sh
brew install chromedriver
```

To run all the tests, run the following in `test/browser`:

```sh
bundle exec maze-runner --https --farm=local --browser=chrome
```

Or to run a single feature file:

```sh
bundle exec maze-runner --https --farm=local --browser=chrome features/device.feature
```

## Running the end-to-end tests with BrowserStack

__Note: only Bugsnag employees can run the end-to-end tests with BrowserStack.__ We have dedicated test infrastructure and private BrowserStack credentials which can't be shared outside of the organisation.

The following environment variables need to be set using the credentials in our shared password manager:

- `BROWSER_STACK_USERNAME`
- `BROWSER_STACK_ACCESS_KEY`

The browsers available to test on are the keys in [`browsers.yml`](https://github.com/bugsnag/maze-runner/blob/main/lib/maze/client/selenium/bs_browsers.yml).

To run all the tests, run the following in `test/browser`:

```sh
bundle exec maze-runner --https --farm=bs --browser=chrome_latest
```

Or to run a single feature file:

```sh
bundle exec maze-runner --https --farm=bs --browser=chrome_latest features/manual-spans.feature
```

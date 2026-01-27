const { withAppBuildGradle, withSettingsGradle } = require("@expo/config-plugins");

const withNativeTestUtilsAndroid = (config) => {
  // Modify settings.gradle to include the native test utils module
  config = withSettingsGradle(config, (config) => {
    const settingsGradleContent = config.modResults.contents;
    const includeDependency = 'include("bugsnag-test-utils")';

    // assumes native-test-utils has been copied into the fixture directory
    const dependencyPath = 'project(":bugsnag-test-utils").projectDir = file("../native-test-utils/android")';

    // Check if the module is already included to avoid duplicates
    if (!settingsGradleContent.includes('bugsnag-test-utils')) {
      config.modResults.contents = `${settingsGradleContent}\n${includeDependency}\n${dependencyPath}`;
    }
    
    return config;
  });

  // Modify app-level build.gradle to add the test utils dependency
  config = withAppBuildGradle(config, (config) => {
    const buildGradleContent = config.modResults.contents;
    const testUtilsDependency = 'implementation project(":bugsnag-test-utils")';
    const dependenciesSection = 'dependencies {';
    
    // Check if the dependency is already added to avoid duplicates
    if (!buildGradleContent.includes(testUtilsDependency)) {
      config.modResults.contents = buildGradleContent.replace(
        dependenciesSection,
        `${dependenciesSection}\n    ${testUtilsDependency}`
      );
    }
    
    return config;
  });

  return config;
};

module.exports = withNativeTestUtilsAndroid;

const fs = require('fs')
const { resolve } = require('path')
const { ROOT_DIR } = require('./constants')
const { replaceInFile, appendToFileIfNotExists } = require('./file-utils')

/**
 * Configure iOS project settings
 */
function configureIOSProject (fixtureDir, reactNativeVersion) {
  // disable Flipper
  let podfileContents = fs.readFileSync(`${fixtureDir}/ios/Podfile`, 'utf8')
  if (podfileContents.includes('use_flipper!')) {
    podfileContents = podfileContents.replace(/use_flipper!/, '# use_flipper!')
  } else if (podfileContents.includes(':flipper_configuration')) {
    podfileContents = podfileContents.replace(/:flipper_configuration/, '# :flipper_configuration')
  }

  // for RN versions < 0.73, bump the minimum iOS version to 13 (required for Cocoa Performance)
  if (parseFloat(reactNativeVersion) < 0.73) {
    podfileContents = podfileContents.replace(/platform\s*:ios,\s*(?:'[\d.]+'|min_ios_version_supported)/, "platform :ios, '13.0'")
  }

  fs.writeFileSync(`${fixtureDir}/ios/Podfile`, podfileContents)

  // pin xcodeproj version to < 1.26.0
  const gemfilePath = resolve(fixtureDir, 'Gemfile')
  if (fs.existsSync(gemfilePath)) {
    appendToFileIfNotExists(gemfilePath, "gem 'xcodeproj', '< 1.26.0'", 'xcodeproj')
    appendToFileIfNotExists(gemfilePath, "gem 'concurrent-ruby', '<= 1.3.4'", 'concurrent-ruby')
  }

  // set NSAllowsArbitraryLoads to allow http traffic for all domains (bitbar public IP + bs-local.com)
  const plistpath = `${fixtureDir}/ios/reactnative/Info.plist`
  let plistContents = fs.readFileSync(plistpath, 'utf8')
  const allowArbitraryLoads = '<key>NSAllowsArbitraryLoads</key>\n\t\t<true/>'
  let searchPattern, replacement
  if (plistContents.includes('<key>NSAllowsArbitraryLoads</key>')) {
    searchPattern = '<key>NSAllowsArbitraryLoads</key>\n\t\t<false/>'
    replacement = allowArbitraryLoads
  } else {
    searchPattern = '<key>NSAppTransportSecurity</key>\n\t<dict>'
    replacement = `${searchPattern}\n\t\t${allowArbitraryLoads}`
  }

  // remove the NSAllowsLocalNetworking key if it exists as this causes NSAllowsArbitraryLoads to be ignored
  const allowLocalNetworking = '<key>NSAllowsLocalNetworking</key>\n\t\t<true/>'
  plistContents = plistContents.replace(allowLocalNetworking, '')

  fs.writeFileSync(plistpath, plistContents.replace(searchPattern, replacement))
}

function installNativeTestUtilsIOS(fixtureDir) {
  const podfilePath = resolve(fixtureDir, 'ios/Podfile')
  const testUtilsPod = `pod 'BugsnagTestUtils', :path => '${resolve(ROOT_DIR, 'test/react-native/native-test-utils/ios/BugsnagTestUtils.podspec')}'`
  const targetSection = 'target \'reactnative\' do'
  
  replaceInFile(podfilePath, targetSection, `${targetSection}\n  ${testUtilsPod}`)
}

/**
 * Install Cocoa Performance dependency
 */
function installCocoaPerformance (fixtureDir) {
  const podfilePath = resolve(fixtureDir, 'ios/Podfile')
  const performancePod = "pod 'BugsnagPerformance', :git => 'https://github.com/bugsnag/bugsnag-cocoa-performance.git', :branch => 'integration/v2'"
  const targetSection = 'target \'reactnative\' do'

  replaceInFile(podfilePath, targetSection, `${targetSection}\n  ${performancePod}`)
}

/**
 * Configure AppDelegate to import BugsnagTestUtils and call startNativePerformance
 */
function configureAppDelegateForTestUtils (fixtureDir, reactNativeVersion) {
  // Determine file type based on React Native version
  const isSwift = parseFloat(reactNativeVersion) >= 0.78
  const fileExtension = isSwift ? 'swift' : (parseFloat(reactNativeVersion) >= 0.72 ? 'mm' : 'm')
  const appDelegatePath = `${fixtureDir}/ios/reactnative/AppDelegate.${fileExtension}`
  
  if (!fs.existsSync(appDelegatePath)) {
    console.warn(`AppDelegate file not found at ${appDelegatePath}`)
    return
  }
  
  let fileContents = fs.readFileSync(appDelegatePath, 'utf8')
  
  if (isSwift) {
    // Add import for Swift files
    const importStatement = 'import BugsnagTestUtils'
    if (!fileContents.includes(importStatement)) {
      // Find the last import statement and add our import after it
      const lastImportMatch = fileContents.match(/import\s+[^\n]+/g)
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1]
        fileContents = fileContents.replace(lastImport, `${lastImport}\n${importStatement}`)
      }
    }
    
    // Add BugsnagTestUtils.startNativePerformanceIfConfigured() call in didFinishLaunchingWithOptions
    const methodCall = 'BugsnagTestUtils.startNativePerformanceIfConfigured()'
    if (!fileContents.includes(methodCall)) {
      // For 0.78 pattern: find after self.initialProps = [:]
      if (fileContents.includes('self.initialProps = [:]')) {
        const pattern = /self\.initialProps = \[:]/
        fileContents = fileContents.replace(pattern, `self.initialProps = [:]\n\n    ${methodCall}`)
      }
      // For 0.79+ pattern: find after delegate.dependencyProvider = RCTAppDependencyProvider()
      else if (fileContents.includes('delegate.dependencyProvider = RCTAppDependencyProvider()')) {
        const pattern = /delegate\.dependencyProvider = RCTAppDependencyProvider\(\)/
        fileContents = fileContents.replace(pattern, `delegate.dependencyProvider = RCTAppDependencyProvider()\n\n    ${methodCall}`)
      }
    }
  } else {
    // Add import for Objective-C files
    const importStatement = '#import <BugsnagTestUtils/BugsnagTestUtils.h>'
    if (!fileContents.includes(importStatement)) {
      // Add the import statement at the top of the file
      fileContents = `${importStatement}\n${fileContents}`
    }
    
    // Add [BugsnagTestUtils startNativePerformanceIfConfigured] call in didFinishLaunchingWithOptions
    const methodCall = '[BugsnagTestUtils startNativePerformanceIfConfigured];'
    if (!fileContents.includes(methodCall)) {
      // For .m files: find after #ifdef FB_SONARKIT_ENABLED block
      if (fileContents.includes('#ifdef FB_SONARKIT_ENABLED')) {
        const pattern = /(#ifdef FB_SONARKIT_ENABLED\s+InitializeFlipper\(application\);\s+#endif)/
        fileContents = fileContents.replace(pattern, `$1\n\n  ${methodCall}`)
      }
      // For .mm files: find after self.initialProps = @{};
      else if (fileContents.includes('self.initialProps = @{};')) {
        const pattern = /self\.initialProps = @\{\};/
        fileContents = fileContents.replace(pattern, `self.initialProps = @{};\n\n  ${methodCall}`)
      }
    }
  }
  
  fs.writeFileSync(appDelegatePath, fileContents)
}

/**
 * Apply view controller changes for view load instrumentation compatibility
 * This adds the necessary overrides to make React Native work with Cocoa Performance view load instrumentation
 */
function applyViewControllerChanges (fixtureDir, reactNativeVersion) {
  const version = parseFloat(reactNativeVersion)
  const isSwift = version >= 0.78
  const fileExtension = isSwift ? 'swift' : (version >= 0.72 ? 'mm' : 'm')
  const appDelegatePath = `${fixtureDir}/ios/reactnative/AppDelegate.${fileExtension}`
  
  if (!fs.existsSync(appDelegatePath)) {
    console.warn(`AppDelegate file not found at ${appDelegatePath}`)
    return
  }
  
  let fileContents = fs.readFileSync(appDelegatePath, 'utf8')
  
  if (isSwift) {
    // For Swift files (0.78+)
    applySwiftViewControllerChanges(fileContents, appDelegatePath, version)
  } else {
    // For Objective-C files (0.64-0.76)
    applyObjectiveCViewControllerChanges(fileContents, appDelegatePath, version)
  }
}

/**
 * Apply view controller changes for Swift AppDelegate files (0.78+)
 */
function applySwiftViewControllerChanges (fileContents, appDelegatePath, version) {
  // Add import for BugsnagTestUtils to access BSGViewController
  if (!fileContents.includes('import BugsnagTestUtils')) {
    // Find the last import statement and add our import after it
    const lastImportMatch = fileContents.match(/import\s+[^\n]+/g)
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1]
      fileContents = fileContents.replace(lastImport, `${lastImport}\nimport BugsnagTestUtils`)
    }
  }
  
  if (version >= 0.79) {
    // For 0.79+: ReactNativeDelegate pattern
    if (!fileContents.includes('override func createRootViewController()')) {
      const createRootViewControllerMethod = `
  override func createRootViewController() -> UIViewController {
    return BSGViewController() // Custom view controller for view load instrumentation
  }
  
  override func setRootView(_ rootView: UIView, toRootViewController rootViewController: UIViewController) {
    if let viewController = rootViewController as? BSGViewController {
      viewController.viewFactory = {
        return rootView
      }
    } else {
      super.setRootView(rootView, toRootViewController: rootViewController)
    }
  }`
      
      // Find the bundleURL method and add our methods before it
      if (fileContents.includes('override func bundleURL()')) {
        fileContents = fileContents.replace(
          /(\n\s*override func bundleURL\(\))/,
          `${createRootViewControllerMethod}$1`
        )
      } else if (fileContents.includes('override func sourceURL(for bridge: RCTBridge)')) {
        // Fallback: add before sourceURL method
        fileContents = fileContents.replace(
          /(\n\s*override func sourceURL\(for bridge: RCTBridge\))/,
          `${createRootViewControllerMethod}$1`
        )
      }
    }
  } else {
    // For 0.78: RCTAppDelegate pattern
    if (!fileContents.includes('override func createRootViewController()')) {
      const createRootViewControllerMethod = `
  override func createRootViewController() -> UIViewController {
    return BSGViewController() // Custom view controller for view load instrumentation
  }
  
  override func setRootView(_ rootView: UIView, toRootViewController rootViewController: UIViewController) {
    if let viewController = rootViewController as? BSGViewController {
      viewController.viewFactory = {
        return rootView
      }
    } else {
      super.setRootView(rootView, toRootViewController: rootViewController)
    }
  }`
      
      // Add methods after the application method
      if (fileContents.includes('return super.application(application, didFinishLaunchingWithOptions: launchOptions)')) {
        fileContents = fileContents.replace(
          /(return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)\s*\n\s*\})/,
          `$1${createRootViewControllerMethod}`
        )
      }
    }
  }
  
  fs.writeFileSync(appDelegatePath, fileContents)
}

/**
 * Apply view controller changes for Objective-C AppDelegate files (0.64-0.76)
 */
function applyObjectiveCViewControllerChanges (fileContents, appDelegatePath, version) {
  // Add BugsnagTestUtils import if not present
  if (!fileContents.includes('#import <BugsnagTestUtils/BSGViewController.h>')) {
    // Add import after AppDelegate.h import
    fileContents = fileContents.replace(
      /#import "AppDelegate\.h"/,
      '#import "AppDelegate.h"\n#import <BugsnagTestUtils/BSGViewController.h>'
    )
  }
  
  // Skip 0.72 as it doesn't expose a setRootView method for us to override.
  if (version >= 0.74) {
    // For 0.74-0.76: RCTAppDelegate pattern - add methods after existing methods
    if (!fileContents.includes('- (UIViewController *)createRootViewController')) {
      const viewControllerMethods = `
- (UIViewController *)createRootViewController
{
  return [BSGViewController new]; // Custom view controller for view load instrumentation
}

- (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController
{
    if ([rootViewController isKindOfClass:[BSGViewController class]]) {
        ((BSGViewController *)rootViewController).viewFactory = ^UIView *{
            return rootView;
        };
    } else {
        [super setRootView:rootView toRootViewController:rootViewController];
    }
}`
      
      // Add methods before the sourceURLForBridge method
      if (fileContents.includes('- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge')) {
        fileContents = fileContents.replace(
          /(\n- \(NSURL \*\)sourceURLForBridge:\(RCTBridge \*\)bridge)/,
          `${viewControllerMethods}\n$1`
        )
      } else {
        // Fallback: add at the end before @end
        fileContents = fileContents.replace(
          /(\n@end\s*)$/,
          `${viewControllerMethods}\n$1`
        )
      }
    }
  } else {
    // For 0.64: Old architecture - replace the root view controller creation
    if (!fileContents.includes('[BSGViewController new]')) {
      // Replace the generic UIViewController with our custom BSGViewController
      fileContents = fileContents.replace(
        /UIViewController \*rootViewController = \[UIViewController new\];/,
        'BSGViewController *rootViewController = [BSGViewController new];'
      )
      
      // Replace the direct view assignment with our viewFactory pattern
      fileContents = fileContents.replace(
        /rootViewController\.view = rootView;/,
        `rootViewController.viewFactory = ^UIView *{
    return rootView;
  };`
      )
    }
  }
  
  fs.writeFileSync(appDelegatePath, fileContents)
}

module.exports = {
  configureIOSProject,
  installNativeTestUtilsIOS,
  installCocoaPerformance,
  configureAppDelegateForTestUtils,
  applyViewControllerChanges
}
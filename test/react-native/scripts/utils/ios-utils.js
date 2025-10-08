const fs = require('fs')
const { resolve } = require('path')
const { ROOT_DIR } = require('./constants')
const { replaceInFile, appendToFileIfNotExists, prependToFileIfNotExists } = require('./file-utils')

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
  
  const fileContents = fs.readFileSync(appDelegatePath, 'utf8')
  const importStatement = isSwift ? 'import BugsnagTestUtils' : '#import <BugsnagTestUtils/BugsnagTestUtils.h>'
  const methodCall = isSwift ? 'BugsnagTestUtils.startNativePerformanceIfConfigured()' : '[BugsnagTestUtils startNativePerformanceIfConfigured];'
  const indentation = isSwift ? '    ' : '  '
  
  // Add import statement at the top
  prependToFileIfNotExists(appDelegatePath, `${importStatement}\n`)
  
  // Add method call at the start of didFinishLaunchingWithOptions
  if (!fileContents.includes(methodCall)) {
    const didFinishMatch = fileContents.match(/didFinishLaunchingWithOptions[^{]*{\n/)
    if (didFinishMatch) {
      replaceInFile(appDelegatePath, didFinishMatch[0], `${didFinishMatch[0]}${indentation}${methodCall}\n\n`)
    }
  }
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
  
  const fileContents = fs.readFileSync(appDelegatePath, 'utf8')
  
  // Add import for BSGViewController
  const importStatement = isSwift ? 'import BugsnagTestUtils' : '#import <BugsnagTestUtils/BSGViewController.h>'
  if (!fileContents.includes(importStatement)) {
    prependToFileIfNotExists(appDelegatePath, `${importStatement}\n`)
  }
  
  if (isSwift) {
    applySwiftViewControllerChanges(appDelegatePath, fileContents)
  } else if (version >= 0.74) {
    applyObjectiveCModernViewControllerChanges(appDelegatePath, fileContents)
  } else if (version < 0.72) {
    applyObjectiveCLegacyViewControllerChanges(appDelegatePath, fileContents)
  }
  // Skip 0.72-0.73 as they don't expose a setRootView method for us to override
}

/**
 * Apply view controller changes for Swift AppDelegate files (0.78+)
 */
function applySwiftViewControllerChanges (appDelegatePath, fileContents) {
  if (fileContents.includes('override func createRootViewController()')) {
    return // Already configured
  }
  
  const viewControllerMethods = `
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
  }
`
  
  // Find an anchor point to insert the methods - try multiple common patterns
  const anchors = [
    'override func sourceURL(for bridge: RCTBridge)',
    'override func bundleURL()',
    'func application(_ application: UIApplication, didFinishLaunchingWithOptions'
  ]
  
  for (const anchor of anchors) {
    if (fileContents.includes(anchor)) {
      const match = fileContents.match(new RegExp(`(\n\\s*${anchor.replace(/[()]/g, '\\$&')})`, 'm'))
      if (match) {
        replaceInFile(appDelegatePath, match[0], `${viewControllerMethods}${match[0]}`)
        return
      }
    }
  }
}

/**
 * Apply view controller changes for modern Objective-C AppDelegate files (0.74-0.76)
 */
function applyObjectiveCModernViewControllerChanges (appDelegatePath, fileContents) {
  if (fileContents.includes('- (UIViewController *)createRootViewController')) {
    return // Already configured
  }
  
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
}
`
  
  // Insert before sourceURLForBridge or at the end before @end
  if (fileContents.includes('- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge')) {
    const match = fileContents.match(/(\n- \(NSURL \*\)sourceURLForBridge:\(RCTBridge \*\)bridge)/)
    if (match) {
      replaceInFile(appDelegatePath, match[0], `${viewControllerMethods}${match[0]}`)
    }
  } else {
    const match = fileContents.match(/(\n@end\s*)$/)
    if (match) {
      replaceInFile(appDelegatePath, match[0], `${viewControllerMethods}${match[0]}`)
    }
  }
}

/**
 * Apply view controller changes for legacy Objective-C AppDelegate files (0.64-0.71)
 */
function applyObjectiveCLegacyViewControllerChanges (appDelegatePath, fileContents) {
  if (fileContents.includes('[BSGViewController new]')) {
    return // Already configured
  }
  
  // Replace UIViewController with BSGViewController
  replaceInFile(
    appDelegatePath,
    'UIViewController *rootViewController = [UIViewController new];',
    'BSGViewController *rootViewController = [BSGViewController new];'
  )
  
  // Replace direct view assignment with viewFactory pattern
  replaceInFile(
    appDelegatePath,
    'rootViewController.view = rootView;',
    `rootViewController.viewFactory = ^UIView *{
    return rootView;
  };`
  )
}

module.exports = {
  configureIOSProject,
  installNativeTestUtilsIOS,
  installCocoaPerformance,
  configureAppDelegateForTestUtils,
  applyViewControllerChanges
}
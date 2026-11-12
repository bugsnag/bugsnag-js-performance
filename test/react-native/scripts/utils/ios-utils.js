const fs = require('fs')
const { resolve } = require('path')
const { ROOT_DIR } = require('./constants')
const { replaceInFile, appendToFileIfNotExists, prependToFileIfNotExists } = require('./file-utils')

/**
 * Configure iOS project settings
 */
function configureIOSProject (fixtureDir, reactNativeVersion) {
  const podfilePath = `${fixtureDir}/ios/Podfile`
  if (!fs.existsSync(podfilePath)) return

  let podfileContents = fs.readFileSync(podfilePath, 'utf8')

  // Disable Flipper
  if (podfileContents.includes('use_flipper!')) {
    podfileContents = podfileContents.replace(/use_flipper!/, '# use_flipper!')
  } else if (podfileContents.includes(':flipper_configuration')) {
    podfileContents = podfileContents.replace(/:flipper_configuration/, '# :flipper_configuration')
  }

  const version = parseFloat(reactNativeVersion)

  // For RN versions < 0.73, bump the minimum iOS version to 13.0 (required for Cocoa Performance)
  if (version < 0.73) {
    podfileContents = podfileContents.replace(/platform\s*:ios,\s*(?:'[\d.]+'|min_ios_version_supported)/, "platform :ios, '13.0'")
  } else if (version >= 0.84) {
    // For RN 0.84+, ensure platform is at least 15.1
    podfileContents = podfileContents.replace(/platform\s*:ios,\s*(?:'[\d.]+'|min_ios_version_supported)/, "platform :ios, '15.1'")
  }

  fs.writeFileSync(podfilePath, podfileContents)

  // Pin gems to prevent breaking changes in pod install
  const gemfilePath = resolve(fixtureDir, 'Gemfile')
  if (fs.existsSync(gemfilePath)) {
    appendToFileIfNotExists(gemfilePath, "gem 'xcodeproj', '< 1.26.0'", 'xcodeproj')
    appendToFileIfNotExists(gemfilePath, "gem 'concurrent-ruby', '<= 1.3.4'", 'concurrent-ruby')
    appendToFileIfNotExists(gemfilePath, "gem 'json', '< 3.0.0'", 'json')
  }

  // Set NSAllowsArbitraryLoads to allow http traffic for all domains (bitbar public IP + bs-local.com)
  const plistpath = `${fixtureDir}/ios/reactnative/Info.plist`
  if (fs.existsSync(plistpath)) {
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

    // Remove NSAllowsLocalNetworking key if it exists
    const allowLocalNetworking = '<key>NSAllowsLocalNetworking</key>\n\t\t<true/>'
    plistContents = plistContents.replace(allowLocalNetworking, '')

    fs.writeFileSync(plistpath, plistContents.replace(searchPattern, replacement))
  }
}

/**
 * Install Native Test Utils CocoaPod dependency
 */
function installNativeTestUtilsIOS(fixtureDir) {
  const podfilePath = resolve(fixtureDir, 'ios/Podfile')
  if (!fs.existsSync(podfilePath)) return

  // Point :path to directory containing BugsnagTestUtils.podspec
  const testUtilsDir = resolve(ROOT_DIR, 'test/react-native/native-test-utils/ios')
  const testUtilsPod = `pod 'BugsnagTestUtils', :path => '${testUtilsDir}'`
  const targetSection = "target 'reactnative' do"

  let podfile = fs.readFileSync(podfilePath, 'utf8')
  if (!podfile.includes("'BugsnagTestUtils'")) {
    replaceInFile(podfilePath, targetSection, `${targetSection}\n  ${testUtilsPod}`)
  }
}

/**
 * Install Cocoa Performance dependency
 */
function installCocoaPerformance (fixtureDir) {
  const podfilePath = resolve(fixtureDir, 'ios/Podfile')
  if (!fs.existsSync(podfilePath)) return

  const performancePod = "pod 'BugsnagPerformance'"
  const targetSection = "target 'reactnative' do"

  let podfile = fs.readFileSync(podfilePath, 'utf8')
  if (!podfile.includes("'BugsnagPerformance'")) {
    replaceInFile(podfilePath, targetSection, `${targetSection}\n  ${performancePod}`)
  }
}

/**
 * Configure AppDelegate to import BugsnagTestUtils and call startNativePerformance
 */
function configureAppDelegateForTestUtils (fixtureDir, reactNativeVersion) {
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

  // Add import statement at the top if missing
  if (!fileContents.includes(importStatement)) {
    prependToFileIfNotExists(appDelegatePath, `${importStatement}\n`)
  }

  // Add method call at the start of didFinishLaunchingWithOptions
  if (!fileContents.includes(methodCall)) {
    const didFinishMatch = fileContents.match(/didFinishLaunchingWithOptions[\s\S]*?\{\n/)
    if (didFinishMatch) {
      replaceInFile(appDelegatePath, didFinishMatch[0], `${didFinishMatch[0]}${indentation}${methodCall}\n\n`)
    }
  }
}

/**
 * Apply view controller changes for view load instrumentation compatibility
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

  // In Swift, 'import BugsnagTestUtils' exposes BSGViewController directly
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

  // Anchors for inserting methods in Swift AppDelegate
  const anchors = [
    'override func sourceURL(for bridge: RCTBridge)',
    'override func bundleURL()',
    'override func application('
  ]

  for (const anchor of anchors) {
    if (fileContents.includes(anchor)) {
      const escapedAnchor = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const match = fileContents.match(new RegExp(`(\n\\s*${escapedAnchor})`, 'm'))
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

  replaceInFile(
    appDelegatePath,
    'UIViewController *rootViewController = [UIViewController new];',
    'BSGViewController *rootViewController = [BSGViewController new];'
  )

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
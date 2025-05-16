const fs = require('fs')
const path = require('path')

const COMMON_FILES = [
  '/android',
  '/ios',
  '/lib',
  '/scenarios/core',
  '/scenarios/index.js'
]

const packagePath = path.join(__dirname, '..', 'package.json')

// Read original package.json
const originalPackageJson = require(packagePath)

// Create a deep copy for modifications
const tempPkg = JSON.parse(JSON.stringify(originalPackageJson))

tempPkg.files = COMMON_FILES

// Get the scenario index file
const scenarioIndexPath = path.join(__dirname, '..', 'scenarios', 'index.js')
let tempScenarioIndex = fs.readFileSync(scenarioIndexPath, 'utf8')

// Make backups of files to modify so we can restore them later
fs.copyFileSync(packagePath, `${packagePath}.backup`)
fs.copyFileSync(scenarioIndexPath, `${scenarioIndexPath}.backup`)

if (process.env.EXPO_VERSION) {
  // Modify temporary package.json for expo-router only
  tempPkg.optionalDependencies = {
    'expo-router': '*'
  }

  tempPkg.files.push('/scenarios/expo')

  const expoRouterIndexPath = path.join(__dirname, '..', 'scenarios', 'index.expo.js')
  tempScenarioIndex = fs.readFileSync(expoRouterIndexPath, 'utf8')
} else if (process.env.REACT_NATIVE_NAVIGATION) {
  // Modify temporary package.json for react-navigation only
  tempPkg.optionalDependencies = {
    'react-native-navigation': '*'
  }

  tempPkg.files.push('/scenarios/react-native-navigation')

  const reactNavigationIndexPath = path.join(__dirname, '..', 'scenarios', 'index.react-native-navigation.js')
  tempScenarioIndex = fs.readFileSync(reactNavigationIndexPath, 'utf8')
}

// Update package.json
console.log(`Updating package.json at path: ${packagePath}`, JSON.stringify(tempPkg, null, 2))

fs.writeFileSync(packagePath, JSON.stringify(tempPkg, null, 2))

// Update scenarios index file
fs.writeFileSync(scenarioIndexPath, tempScenarioIndex)

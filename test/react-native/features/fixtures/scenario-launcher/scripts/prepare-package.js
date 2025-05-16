const fs = require('fs')
const path = require('path')

// Read package.json and scenarios index files
const packageJsonPath = path.join(__dirname, '..', 'package.json')
const pkg = require(packageJsonPath)

const scenarioIndexPath = path.join(__dirname, '..', 'scenarios', 'index.js')
let scenarioExports = fs.readFileSync(scenarioIndexPath, 'utf8')

// Make backups of files to modify so we can restore them later
fs.copyFileSync(packageJsonPath, `${packageJsonPath}.backup`)
fs.copyFileSync(scenarioIndexPath, `${scenarioIndexPath}.backup`)

if (process.env.EXPO_VERSION) {
  pkg.files.push('/scenarios/expo')
  scenarioExports += "\nexport * from './expo'"
} 

if (process.env.REACT_NATIVE_NAVIGATION) {
  pkg.files.push('/scenarios/react-native-navigation')
  scenarioExports += "\nexport * from './react-native-navigation'"
}

// Update package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2))

// Update scenarios index file
fs.writeFileSync(scenarioIndexPath, scenarioExports)

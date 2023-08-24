import { getMazeRunnerAddress } from './ConfigFileReader'

const getCurrentCommand = async () => {
  const mazeAddress = await getMazeRunnerAddress()
  const commandUrl = `http://${mazeAddress}/command`

  try {
    const response = await fetch(commandUrl)
    if (!response.ok) {
      throw new Error(`Received ${response.status} response from maze runner`)
    }

    const command = await response.json()
    console.log(`Received command from maze runner: ${JSON.stringify(command)}`)
    return command
  } catch (err) {
    console.error(`Error fetching command from maze runner: ${err.message}`, err)
    throw err
  }
}

module.exports.getCurrentCommand = getCurrentCommand

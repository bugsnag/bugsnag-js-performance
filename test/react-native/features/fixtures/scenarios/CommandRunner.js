import { getMazeRunnerAddress } from './ConfigFileReader'

const readCommand = async () => {
  const mazeAddress = await getMazeRunnerAddress()
  const commandUrl = `http://${mazeAddress}/command`

  try {
    const response = await fetch(commandUrl)
    if (!response.ok) {
      console.log(`Failed to read command: received a ${response.status} response from maze runner at url ${commandUrl}`)
      return { scenario_name: 'ERROR', endpoint: 'ERROR' }
    }

    const command = await response.json()
    console.log(`Received command from maze runner: ${JSON.stringify(command)}`)
    return command
  } catch (err) {
    console.error(`Error fetching command from maze runner: ${err.message}`, err)
    return { scenario_name: 'ERROR', endpoint: 'ERROR' }
  }
}

module.exports.readCommand = readCommand

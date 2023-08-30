import { getMazeRunnerAddress } from './ConfigFileReader'

const RETRY_COUNT = 3
const INTERVAL = 100

let mazeAddress

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const fetchCommand = (url) => new Promise(async (resolve, reject) => {
  let retries = 0
  let finalError

  while (retries < RETRY_COUNT) {
    try {
      await delay(INTERVAL)
      const response = await fetch(url)
  
      if (!response.ok) {
        throw new Error(`Received ${response.status} response from maze runner`)
      }
  
      const command = await response.json()
      console.error(`Received command from maze runner: ${JSON.stringify(command)}`)
  
      resolve(command)
    } catch (err) {
      console.error(`Error fetching command from maze runner: ${err.message}`, err)
      finalError = err
      retries++
    }
  }

  reject(finalError)
})

const getCurrentCommand = async () => {
  if (!mazeAddress) {
    mazeAddress = await getMazeRunnerAddress()
  }

  const commandUrl = `http://${mazeAddress}/command`
  console.error(`Fetching command from ${commandUrl}`)

  const command = await fetchCommand(commandUrl)
  return command
}

module.exports.getCurrentCommand = getCurrentCommand

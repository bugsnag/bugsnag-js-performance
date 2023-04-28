import { Settler } from './settler'

class TimeoutSettler extends Settler {
  constructor (timeoutMilliseconds: number) {
    super()

    setTimeout(() => { this.settle() }, timeoutMilliseconds)
  }
}

export default TimeoutSettler

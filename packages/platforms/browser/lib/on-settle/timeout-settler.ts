import { Settler } from './settler'

class TimeoutSettler extends Settler {
  private timeout: ReturnType<typeof setTimeout>

  constructor (timeoutMilliseconds: number) {
    super()

    this.timeout = setTimeout(() => { this.settle() }, timeoutMilliseconds)
  }

  cancel () {
    clearTimeout(this.timeout)
  }
}

export default TimeoutSettler

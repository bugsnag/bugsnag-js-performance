import { type Clock } from '@bugsnag/js-performance-core'
import { Settler } from './settler'

class DomMutationSettler extends Settler {
  private timeout: ReturnType<typeof setTimeout> | undefined = undefined

  constructor (clock: Clock, target: Node) {
    super(clock)

    const observer = new MutationObserver(() => { this.restart() })

    observer.observe(target, {
      subtree: true,
      childList: true,
      characterData: true
      // we don't track attribute changes as they may or may not be user visible
      // so we assume they won't affect the page appearing settled to the user
    })

    this.restart()
  }

  private restart (): void {
    clearTimeout(this.timeout)
    this.settled = false

    this.timeout = setTimeout(() => { this.settle() }, 100)
  }
}

export default DomMutationSettler

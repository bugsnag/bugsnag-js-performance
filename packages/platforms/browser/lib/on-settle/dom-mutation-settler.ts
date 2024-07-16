import type { Clock } from '@bugsnag/core-performance'
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

    // we wait 100ms to ensure that DOM mutations have actually stopped but
    // don't want the settled time to reflect that wait, so we record the time
    // here and use that when settling
    const settledTime = this.clock.now()

    this.timeout = setTimeout(() => { this.settle(settledTime) }, 100)
  }
}

export default DomMutationSettler

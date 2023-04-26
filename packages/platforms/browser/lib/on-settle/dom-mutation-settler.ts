import { type Settler } from './settler'

class DomMutationSettler implements Settler {
  private timeout: ReturnType<typeof setTimeout> | undefined = undefined
  private settled: boolean = false
  private callbacks: Array<() => void> = []

  constructor (target: Node) {
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

  subscribe (callback: () => void): void {
    this.callbacks.push(callback)

    // if the dom is already settled, call the callback immediately
    if (this.settled) {
      callback()
    }
  }

  private restart (): void {
    clearTimeout(this.timeout)
    this.settled = false

    this.timeout = setTimeout(() => {
      this.settled = true

      for (const callback of this.callbacks) {
        callback()
      }
    }, 100)
  }
}

export default DomMutationSettler

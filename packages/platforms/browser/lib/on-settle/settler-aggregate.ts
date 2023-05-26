import { type Clock } from '@bugsnag/core-performance'
import { Settler } from './settler'

/**
 * SettlerAggregate is a Settler that is settled when ALL Settlers it is
 * constructed with are settled themselves
 */
class SettlerAggregate extends Settler {
  private readonly settlers: Settler[]

  constructor (clock: Clock, settlers: Settler[]) {
    super(clock)
    this.settlers = settlers

    for (const settler of settlers) {
      settler.subscribe((settledTime: number) => {
        // we need to check if all of the settlers are settled here as a
        // previously settled settler could have unsettled in the meantime
        if (this.settlersAreSettled()) {
          this.settle(settledTime)
        } else {
          this.settled = false
        }
      })
    }
  }

  isSettled () {
    // ensure all child settlers are settled as well; it's possible for all of
    // them to have settled previously only for one to unsettle
    return super.isSettled() && this.settlersAreSettled()
  }

  private settlersAreSettled (): boolean {
    for (const settler of this.settlers) {
      if (!settler.isSettled()) {
        return false
      }
    }

    return true
  }
}

export default SettlerAggregate

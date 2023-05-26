/**
 * @jest-environment jsdom
 */

import SettlerAggregate from '../../lib/on-settle/settler-aggregate'
import { Settler } from '../../lib/on-settle/settler'
import { IncrementingClock } from '@bugsnag/js-performance-test-utilities'

class ControllableSettler extends Settler {
  constructor (settled: boolean) {
    super(new IncrementingClock())
    this.settled = settled
  }

  // make Settler#settle public
  settle (settledTime: number) {
    super.settle(settledTime)
  }

  unsettle () {
    this.settled = false
  }
}

describe('SettlerAggregate', () => {
  it('settles when all given Settlers have settled', () => {
    const settler1 = new ControllableSettler(false)
    const settler2 = new ControllableSettler(false)
    const settler3 = new ControllableSettler(false)

    const aggregate = new SettlerAggregate(new IncrementingClock(), [settler1, settler2, settler3])
    const settleCallback = jest.fn()

    aggregate.subscribe(settleCallback)

    expect(aggregate.isSettled()).toBe(false)
    expect(settleCallback).not.toHaveBeenCalled()

    settler1.settle(1)
    expect(aggregate.isSettled()).toBe(false)
    expect(settleCallback).not.toHaveBeenCalled()

    settler2.settle(2)
    expect(aggregate.isSettled()).toBe(false)
    expect(settleCallback).not.toHaveBeenCalled()

    settler3.settle(3)
    expect(aggregate.isSettled()).toBe(true)
    expect(settleCallback).toHaveBeenCalledWith(3)
  })

  it('is settled by default when all given Settlers are settled', () => {
    const settler1 = new ControllableSettler(true)
    const settler2 = new ControllableSettler(true)
    const settler3 = new ControllableSettler(true)

    const aggregate = new SettlerAggregate(new IncrementingClock(), [settler1, settler2, settler3])
    const settleCallback = jest.fn()

    aggregate.subscribe(settleCallback)

    expect(aggregate.isSettled()).toBe(true)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('unsettles when a Settler is unsettled', () => {
    const settler1 = new ControllableSettler(true)
    const settler2 = new ControllableSettler(true)
    const settler3 = new ControllableSettler(true)

    const aggregate = new SettlerAggregate(new IncrementingClock(), [settler1, settler2, settler3])
    const settleCallback = jest.fn()

    aggregate.subscribe(settleCallback)

    expect(aggregate.isSettled()).toBe(true)
    expect(settleCallback).toHaveBeenCalled()

    settler1.unsettle()
    expect(aggregate.isSettled()).toBe(false)

    settler1.settle(5)
    expect(aggregate.isSettled()).toBe(true)
    expect(settleCallback).toHaveBeenCalledWith(5)

    settler2.unsettle()
    expect(aggregate.isSettled()).toBe(false)
  })
})

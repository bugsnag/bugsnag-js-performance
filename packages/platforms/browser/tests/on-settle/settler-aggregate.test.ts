/**
 * @jest-environment jsdom
 */

import SettlerAggregate from '../../lib/on-settle/settler-aggregate'
import { Settler } from '../../lib/on-settle/settler'

class ControllableSettler extends Settler {
  constructor (settled: boolean) {
    super()
    this.settled = settled
  }

  // make Settler#settle public
  settle () {
    super.settle()
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

    const aggregate = new SettlerAggregate([settler1, settler2, settler3])

    expect(aggregate.isSettled()).toBe(false)

    settler1.settle()
    expect(aggregate.isSettled()).toBe(false)

    settler2.settle()
    expect(aggregate.isSettled()).toBe(false)

    settler3.settle()
    expect(aggregate.isSettled()).toBe(true)
  })

  it('is settled by default when all given Settlers are settled', () => {
    const settler1 = new ControllableSettler(true)
    const settler2 = new ControllableSettler(true)
    const settler3 = new ControllableSettler(true)

    const aggregate = new SettlerAggregate([settler1, settler2, settler3])

    expect(aggregate.isSettled()).toBe(true)
  })

  it('unsettles when a Settler is unsettled', () => {
    const settler1 = new ControllableSettler(true)
    const settler2 = new ControllableSettler(true)
    const settler3 = new ControllableSettler(true)

    const aggregate = new SettlerAggregate([settler1, settler2, settler3])

    expect(aggregate.isSettled()).toBe(true)

    settler1.unsettle()
    expect(aggregate.isSettled()).toBe(false)

    settler1.settle()
    expect(aggregate.isSettled()).toBe(true)

    settler2.unsettle()
    expect(aggregate.isSettled()).toBe(false)
  })
})

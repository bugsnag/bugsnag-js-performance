export type BackgroundingListenerState = 'in-foreground' | 'in-background'
export type BackgroundingListenerCallback = (state: BackgroundingListenerState) => void

/**
 * A BackgroundingListener allows core to register a callback to be called when
 * the app is "backgrounded" (or terminated) and when it is brought back to the
 * foreground (but not when relaunched)
 *
 * This allows each platform to define _what_ backgrounding/foregrounding is,
 * while core implements the logic _when_ the state changes
 */
export interface BackgroundingListener {
  /**
   * NOTE: the callback should be triggered immediately if the app is already in
   *       the background!
   */
  onStateChange: (callback: BackgroundingListenerCallback) => void
}

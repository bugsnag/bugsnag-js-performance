const NANOSECONDS_IN_MILLISECONDS = 1_000_000

export function millisecondsToNanoseconds (milliseconds: number): number {
  return milliseconds * NANOSECONDS_IN_MILLISECONDS
}

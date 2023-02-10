export type BitLength = 64 | 128

export interface IdGenerator {
  generate: (bits: BitLength) => string
}

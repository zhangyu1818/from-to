import { Color } from './color'

export type BaseValue = number | number[] | Color
export type AnimatedValue = AnimatedValueSingle[]
export type AnimatedValueSingle = number

export type RefValue = { current: AnimatedValue }

export type SingleProcess = (elapsed: number) => {
  value: AnimatedValueSingle
  done: boolean
}

export type Processor = (elapsed: number) => {
  value: AnimatedValue
  done: boolean
}
export type Animator<Options = unknown> = (
  refFrom: RefValue,
  refTo: RefValue,
  options: Options
) => Processor

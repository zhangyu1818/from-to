import {
  colorToAnimatedValue,
  animationValueToColor,
  type Color,
} from './color'

import type { AnimatedValue, BaseValue } from './interface'

export const secondsToMilliseconds = (seconds: number) => seconds * 1000

export const millisecondsToSeconds = (milliseconds: number) =>
  milliseconds / 1000

export const valueToAnimationValue = (value: unknown): AnimatedValue => {
  if (typeof value === 'number') {
    return [value]
  } else if (typeof value === 'string') {
    return colorToAnimatedValue(value as Color)
  } else if (Array.isArray(value)) {
    return value.flatMap(v => valueToAnimationValue(v))
  }
  if (import.meta.env.MODE === 'development') {
    throw new Error(`
      
    Unsupported value type. The value type should be a number or a color string.
    `)
  }
  return []
}

export const animationValueToValue = (
  animationValue: AnimatedValue,
  baseValue: unknown
): BaseValue => {
  if (typeof baseValue === 'string') {
    return animationValueToColor(animationValue, baseValue)
  }

  if (Array.isArray(baseValue)) {
    return animationValue
  }

  return animationValue[0]
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

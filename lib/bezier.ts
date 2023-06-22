import bezierEasing from 'bezier-easing'

import { secondsToMilliseconds } from './utils'

import type { AnimatedValue, Animator } from './interface'

type DefaultEase = 'ease' | 'liner' | 'easeIn' | 'easeOut' | 'easeInOut'

type EaseValue = [number, number, number, number]
export interface Bezier {
  type?: 'tween'
  ease?: EaseValue | DefaultEase
  duration?: number
}

const defaultEaseMap: Record<DefaultEase, EaseValue> = {
  ease: [0.25, 0.1, 0.25, 1],
  liner: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
}

const isDefaultEase = (ease: unknown): ease is DefaultEase => {
  return typeof ease === 'string' && ease in defaultEaseMap
}

export const bezier: Animator<Bezier> = (refFrom, refTo, options) => {
  const { ease, duration = 3 } = options

  let currentEase: EaseValue

  if (isDefaultEase(ease)) {
    currentEase = defaultEaseMap[ease]
  } else {
    currentEase = defaultEaseMap.ease
  }

  const [x1, y1, x2, y2] = currentEase
  const easing = bezierEasing(x1, y1, x2, y2)

  return function get(elapsed) {
    const from = refFrom.current
    const to = refTo.current

    const t = Math.min(1, elapsed / secondsToMilliseconds(duration))

    const value: AnimatedValue = from.map((fromValue, index) => {
      const toValue = to[index]
      return fromValue + (toValue - fromValue) * easing(t)
    })

    const done = t >= 1

    return {
      done,
      value: done ? to : value,
    }
  }
}

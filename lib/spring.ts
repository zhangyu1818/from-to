/**
 * The following Spring animation algorithms are derived from framer-motion.
 *
 * https://github.com/framer/motion/blob/main/packages/framer-motion/src/animation/generators/spring/index.ts
 */

import { millisecondsToSeconds } from './utils'

import type { Animator, SingleProcess, AnimatedValueSingle } from './interface'
export interface Spring {
  type?: 'spring'
  stiffness?: number
  damping?: number
  mass?: number
}

const velocitySampleDuration = 5 // ms

function calcGeneratorVelocity(
  resolveValue: (v: number) => number,
  t: number,
  current: number
) {
  const prevT = Math.max(t - velocitySampleDuration, 0)
  return t - prevT ? (current - resolveValue(prevT)) * (1000 / t - prevT) : 0
}

export const springSingleValue = (
  from: AnimatedValueSingle,
  to: AnimatedValueSingle,
  options: Spring
): SingleProcess => {
  const { stiffness = 100, damping = 10, mass = 1 } = options

  const initialVelocity = 0
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass))

  const undampedAngularFreq = millisecondsToSeconds(Math.sqrt(stiffness / mass))

  const initialDelta = to - from

  const isGranularScale = Math.abs(initialDelta) < 5
  const restSpeed = isGranularScale ? 0.01 : 2
  const restDelta = isGranularScale ? 0.005 : 0.5

  function resolveSpring(elapsed: number) {
    let value: number

    const envelope = Math.exp(-dampingRatio * undampedAngularFreq * elapsed)

    if (dampingRatio < 1) {
      const angularFreq =
        undampedAngularFreq * Math.sqrt(1 - dampingRatio * dampingRatio)

      value =
        to -
        envelope *
          (((initialVelocity +
            dampingRatio * undampedAngularFreq * initialDelta) /
            angularFreq) *
            Math.sin(angularFreq * elapsed) +
            initialDelta * Math.cos(angularFreq * elapsed))
    } else if (dampingRatio === 1) {
      value =
        to -
        Math.exp(-undampedAngularFreq * elapsed) *
          (initialDelta +
            (initialVelocity + undampedAngularFreq * initialDelta) * elapsed)
    } else {
      const dampedAngularFreq =
        undampedAngularFreq * Math.sqrt(dampingRatio * dampingRatio - 1)

      const freqForT = Math.min(dampedAngularFreq * elapsed, 300)

      value =
        to -
        (envelope *
          ((initialVelocity +
            dampingRatio * undampedAngularFreq * initialDelta) *
            Math.sinh(freqForT) +
            dampedAngularFreq * initialDelta * Math.cosh(freqForT))) /
          dampedAngularFreq
    }

    return value
  }

  return function next(elapsed) {
    const current = resolveSpring(elapsed)

    let done = false

    if (elapsed !== 0) {
      let currentVelocity: number
      if (dampingRatio < 1) {
        currentVelocity = calcGeneratorVelocity(resolveSpring, elapsed, current)
      } else {
        currentVelocity = 0
      }

      const isBelowVelocityThreshold = Math.abs(currentVelocity) <= restSpeed
      const isBelowDisplacementThreshold = Math.abs(to - current) <= restDelta

      done = isBelowVelocityThreshold && isBelowDisplacementThreshold
    }

    return {
      value: done ? to : current,
      done,
    }
  }
}

export const spring: Animator<Spring> = (refFrom, refTo, options) => {
  return function next(elapsed: number) {
    const from = refFrom.current
    const to = refTo.current

    const multipleValue = from.map((from, index) => {
      const process = springSingleValue(from, to[index], options)
      return process(elapsed)
    })

    const value = multipleValue.map(v => v.value)
    const done = multipleValue.every(v => v.done)

    return {
      done,
      value,
    }
  }
}

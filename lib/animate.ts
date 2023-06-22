import { bezier, type Bezier } from './bezier'
import { spring, type Spring } from './spring'
import {
  animationValueToValue,
  secondsToMilliseconds,
  valueToAnimationValue,
} from './utils'

import type { AnimatedValue, Animator, BaseValue, RefValue } from './interface'

export interface Loop {
  loopDelay?: number
  loop?: boolean
}
export interface AnimationLifecycles<Value> {
  onUpdate?: (latest: Value) => void
  onPlay?: () => void
  onComplete?: () => void
  onStop?: () => void
}

export type TransitionOptions = (Bezier | Spring) &
  Loop & {
    autoplay?: boolean
  }

export type Options<Value> = TransitionOptions & AnimationLifecycles<Value>

export interface Controls {
  then: (resolve: () => void, reject?: () => void) => Promise<void>
  stop: () => void
  pause: () => void
  play: () => void
  cancel: () => void
}

const refValue = (value: AnimatedValue): RefValue => ({ current: value })
export const animate = <Value>(
  from: Value,
  to: Value,
  options: Options<Value> = {}
): Controls => {
  if (import.meta.env.MODE === 'development') {
    if (typeof from !== typeof to) {
      throw new Error(
        `
        
        The type of from("${typeof from}") should be consistent with the type of to("${typeof to}").
        `
      )
    }
  }

  const startAnimationValue = valueToAnimationValue(from)
  const endAnimationValue = valueToAnimationValue(to)

  const refStartValue = refValue(startAnimationValue)
  const refEndValue = refValue(endAnimationValue)

  const {
    onPlay,
    onComplete,
    onUpdate,
    onStop,
    autoplay = true,
    loopDelay = 0,
    loop = false,
    type = 'tween',
    ...animationOptions
  } = options

  let cancelHandle = -1
  let startTime: number | null = null
  let pausedTime: number | null = null
  let currentTime = 0
  let delayTime: number | null = null

  let timeHasDelayed = 0

  let resolveCompletedPromise: VoidFunction
  let currentCompletedPromise: Promise<void>

  let next: ReturnType<Animator>

  if (type === 'tween') {
    next = bezier(refStartValue, refEndValue, animationOptions as Bezier)
  } else if (type === 'spring') {
    next = spring(refStartValue, refEndValue, animationOptions as Spring)
  } else {
    if (import.meta.env.MODE === 'development') {
      throw new Error(
        `
      
      Unsupported type("${type}"). The value of 'type' should be either 'tween' or 'spring'. 
      `
      )
    }
  }

  const tick: FrameRequestCallback = (timestamp: number) => {
    if (startTime === null) {
      return
    }

    if (pausedTime !== null) {
      currentTime = pausedTime
    } else if (delayTime !== null) {
      timeHasDelayed = timestamp - delayTime
      if (timeHasDelayed >= secondsToMilliseconds(loopDelay)) {
        delayTime = null
        timeHasDelayed = 0
        startTime = timestamp
      }
    } else {
      currentTime = Math.round(timestamp - startTime)
    }

    const elapsed = currentTime

    const { done, value } = next(elapsed)

    if (onUpdate) {
      const currentValue = animationValueToValue(value, to as BaseValue)
      onUpdate(currentValue as Value)
    }

    if (!done) {
      cancelHandle = requestAnimationFrame(tick)
    } else {
      complete()
      repeat()
    }
  }

  function updateCompletedPromise() {
    resolveCompletedPromise?.()
    currentCompletedPromise = new Promise(resolve => {
      resolveCompletedPromise = resolve
    })
  }

  function now() {
    return performance.now()
  }

  function internalReset() {
    startTime = null
    currentTime = 0
    pausedTime = null
    delayTime = null
    timeHasDelayed = 0
    updateCompletedPromise()
  }

  function internalResetRefValues() {
    refStartValue.current = startAnimationValue
    refEndValue.current = endAnimationValue
  }

  function start() {
    cancelAnimationFrame(cancelHandle)
    startTime = now()
    cancelHandle = requestAnimationFrame(tick)
  }

  function complete() {
    internalReset()
    onComplete?.()
  }

  function repeat() {
    if (!loop) {
      return
    }

    ;[refStartValue.current, refEndValue.current] = [
      refEndValue.current,
      refStartValue.current,
    ]

    internalReset()

    if (loopDelay) {
      delayTime = now()
    }

    start()
  }

  function stop() {
    internalReset()
    internalResetRefValues()
    onStop?.()
  }

  function cancel() {
    internalReset()
    internalResetRefValues()
    onUpdate?.(from)
  }

  function play() {
    if (pausedTime !== null) {
      startTime = now() - pausedTime
      pausedTime = null
      if (delayTime !== null) {
        delayTime = now() - timeHasDelayed
      }
    } else if (startTime === null) {
      internalReset()
      start()
      onPlay?.()
    }
  }

  function pause() {
    if (startTime !== null) {
      pausedTime = currentTime
    }
  }

  if (autoplay) {
    play()
  }

  return <Controls>{
    then(onFulfilled: VoidFunction, onRejected?: VoidFunction) {
      return currentCompletedPromise.then(onFulfilled, onRejected)
    },

    stop,
    pause,
    play,
    cancel,
  }
}

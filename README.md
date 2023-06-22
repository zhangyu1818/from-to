# From To

Transitioning **from** one value **to** another.

---

"Why reinvent the wheel?"

Sometimes, all you need is an extremely lightweight package to transition from one value to another. It requires no bindings to DOM elements or framework-specific code. In such cases, popular animation libraries may come with additional features that are not necessary.

## Install

```shell
pnpm install from-to.js
```

## Usage

```ts
animate(from: Value, to: Value, options?: Options<Value>) => Controls
```

It supports transition animations for both numerical values and colors.

For example, you can use `animate(0, 100)` or `animate([0, 0, 0], [100, 200, 300])` for transitioning numerical values or `animate('#000', '#fff')` for transitioning colors.

### Transition

The transition type can be either `tween` or `spring`. The default transition type is `tween`.

### tween

```js
animate('#FF0000ff', '#8B00FFff', {
  type: 'tween',
  ease: 'ease',
  duration: 3,
})
```

**ease**: `ease` | `liner` | `easeIn` | `easeOut` | `easeInOut`

It can also handle transition animations for arrays in the format [number, number, number, number], allowing you to customize the transition curve.

**duration**: number

The transition duration is specified in seconds.

### spring

```js
animate(0, 200, {
  type: 'spring',
  stiffness: 100,
  damping: 10,
  mass: 1,
})
```

**stiffness**: number

The stiffness parameter defines the rigidity or intensity of the spring effect. A higher stiffness value will produce a more pronounced and rapid transition.

The default value is set to 100.

**damping**: number

The damping parameter controls the resistance or smoothness of the spring's movement. A higher damping value will result in a slower and smoother transition, while a lower damping value will allow for more oscillations.

The default value is set to 10.

**mass**: number

The mass parameter affects the inertia of the animation. A higher mass value results in slower acceleration and deceleration, creating a smoother and more gradual transition.

The default value is set to 1.

## Lifecycles

The animation state will be updated through Lifecycles callbacks.

```js
animate([0, 0], [200, 500], {
  onPlay() {
    // when the animation starts playing for the first time.
  },
  onUpdate([x, y]) {
    // You can update DOM state or perform similar actions here
    // every time the animation updates.
    element.style.transform = `translate(${x}px,${y}px)`
  },
  onComplete() {
    // when the animation completes its execution.
    // If loop is set to true, it will be triggered after each iteration.
  },
  onStop() {
    // When the animation is stopped
  },
})
```

## Controls

```js
const animation = animate(0, 200)
```

**animation**: `thenable`

A thenable object can be invoked using the then method, just like a Promise, and can also be used with await.

```js
await animation

console.log('animation end')
```

**animation.play**: `function`

```js
animation.play()
```

If autoplay is set to false, you need to call animation.play() to start the animation. When the animation is paused, calling play() will resume it. If the animation has ended or been canceled, calling play() will restart the animation.

**animation.pause**: `funciton`

```js
animation.pause()
```

Pause the animation.

**animation.stop**: `funciton`

```js
animation.stop()
```

Stop the animation.

```js
animation.cancel()
```

Cancel the animation, Unlike the stop() method, canceling the animation will pass the initial values to the onUpdate callback.

## Special Note

The algorithm for the spring animation in this library is sourced from the renowned animation library, framer-motion. I have utilized its algorithm in the code for this library.

## License

[MIT License](https://github.com/zhangyu1818/from-to/blob/main/LICENSE)

---

Made with ❤️‍🩹 in Chengdu

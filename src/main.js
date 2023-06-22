import { observable, observe } from '@nx-js/observer-util'

import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'

import { animate } from '../lib'

import './style.css'

const controls = new Set()

const action = (type, clear = false) => {
  controls.forEach(control => control[type]())
  if (clear) {
    controls.clear()
  }
}

const paneContainer = document.querySelector('#pane-container')
const elementContainer = document.querySelector('#element-container')
const element = elementContainer.firstElementChild

const addElement = () => {
  const newEle = element.cloneNode()
  elementContainer.appendChild(newEle)
}

const onUpdate = value => {
  Array.from(elementContainer.children).forEach(node => {
    const element = node
    if (typeof value === 'number') {
      element.style.transform = `translateX(${value}px)`
    } else if (typeof value === 'string') {
      element.style.background = value
    }
  })
}
const createAnimate = debounce(
  (valueFrom, valueTo, colorFrom, colorTo, options) => {
    action('cancel', true)

    const valueControl = animate(valueFrom, valueTo, {
      ...options,
      onUpdate,
      onPlay() {
        console.log(`onPlay: ${valueFrom} => ${valueTo}`)
      },
      onStop() {
        console.log(`onStop: ${valueFrom} => ${valueTo}`)
      },
      onComplete() {
        console.log(`onComplete: ${valueFrom} => ${valueTo}`)
      },
    })
    controls.add(valueControl)

    const colorControl = animate(colorFrom, colorTo, {
      ...options,
      onUpdate,
      onPlay() {
        console.log(`onPlay: ${colorFrom} => ${colorTo}`)
      },
      onStop() {
        console.log(`onStop: ${colorFrom} => ${colorTo}`)
      },
      onComplete() {
        console.log(`onComplete: ${colorFrom} => ${colorTo}`)
      },
    })
    controls.add(colorControl)
  }
)

// Observable Values

const bezier = observable({
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1],
  duration: 2,
})

const spring = observable({
  type: 'spring',
  stiffness: 100,
  damping: 10,
  mass: 1,
})

const loop = observable({
  autoplay: true,
  loop: true,
  loopDelay: 0,
})

const targetValue = observable({
  from: 0,
  to: 0,
})

const targetColor = observable({
  from: '#FF0000ff',
  to: '#8B00FFff',
})

const type = observable({
  index: 0,
})

observe(() => {
  const { ...currentSpring } = spring
  const { ...currentBezier } = bezier

  const nextOptions = {
    ...loop,
    ...(type.index ? currentSpring : currentBezier),
  }

  createAnimate(
    targetValue.from,
    targetValue.to,
    targetColor.from,
    targetColor.to,
    nextOptions
  )
})

// Control Pane

const pane = new Pane({
  container: paneContainer,
})

pane.registerPlugin(EssentialsPlugin)

// List

const list = pane.addBlade({
  view: 'list',
  label: 'Type',
  options: [
    { text: 'Value', value: 'value' },
    { text: 'Color', value: 'color' },
  ],
  value: 'value',
})

list.on('change', event => {
  valueFolder.hidden = event.value !== 'value'
  colorFolder.hidden = event.value !== 'color'
})

const valueFolder = pane.addFolder({
  title: 'Value',
})

// From, To Input

valueFolder.addInput(targetValue, 'from', { step: 50 })
valueFolder.addInput(targetValue, 'to', { step: 50 })

const colorFolder = pane.addFolder({
  title: 'Color',
  hidden: true,
})

colorFolder.addInput(targetColor, 'from', { picker: 'inline', expanded: true })
colorFolder.addInput(targetColor, 'to', { picker: 'inline', expanded: true })

// Autoplay

pane.addInput(loop, 'autoplay')

// Loop

pane.addInput(loop, 'loop')
pane.addInput(loop, 'loopDelay', { min: 0, step: 1 })

// Animation Mode

const tab = pane.addTab({
  pages: [{ title: 'Tween' }, { title: 'Spring' }],
})

tab.on('select', event => {
  type.index = event.index
})

const [tweenTab, springTab] = tab.pages

// Bezier

const bezierApi = tweenTab.addBlade({
  view: 'cubicbezier',
  value: bezier.ease,
  expanded: true,
  picker: 'inline',
})

bezierApi.on('change', event => {
  bezier.ease = event.value.toObject()
})

tweenTab.addInput(bezier, 'duration')

// Spring

springTab.addInput(spring, 'stiffness', { min: 0, step: 1 })
springTab.addInput(spring, 'damping', { min: 0, step: 1 })
springTab.addInput(spring, 'mass', { min: 0, step: 1 })

pane.addSeparator()

// Control Buttons

pane
  .addButton({
    title: 'play',
    label: 'play',
  })
  .on('click', () => {
    action('play')
  })

pane
  .addButton({
    title: 'pause',
    label: 'pause',
  })
  .on('click', () => {
    action('pause')
  })

pane
  .addButton({
    title: 'cancel',
    label: 'cancel',
  })
  .on('click', () => {
    action('cancel')
  })

pane
  .addButton({
    title: 'stop',
    label: 'stop',
  })
  .on('click', () => {
    action('stop')
  })

// FPS

const fpsGraph = pane.addBlade({
  view: 'fpsgraph',

  label: 'FPS',
  lineCount: 2,
})

function renderFps() {
  fpsGraph.begin()

  fpsGraph.end()
  requestAnimationFrame(renderFps)
}

renderFps()

pane
  .addButton({ title: 'add element', label: 'add element' })
  .on('click', addElement)

// Initial

targetValue.to = elementContainer.clientWidth - element.clientWidth

pane.refresh()

function debounce(fn) {
  let timer = -1
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), 300)
  }
}

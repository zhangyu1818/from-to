import type { AnimatedValue } from './interface'
import { clamp } from './utils'

type HexColor = `#${string}`
type RGBColor = `rgb(${number},${number},${number})`
type RGBAColor = `rgba(${number},${number},${number},${number})`

export type Color = HexColor | RGBColor | RGBAColor

export const isHexColor = (color: unknown): color is HexColor =>
  typeof color === 'string' && color.startsWith('#')
export const isRGBColor = (color: unknown): color is RGBColor | RGBAColor =>
  typeof color === 'string' && color.startsWith('rgb')

const hexToAnimatedValue = (hex: HexColor): AnimatedValue => {
  const isShortHex = hex.length === 4
  if (isShortHex) {
    hex = hex.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3') as HexColor
  }

  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  if (hex.length === 9) {
    const a = parseInt(hex.slice(7, 9), 16) / 255
    return [r, g, b, a]
  }

  return [r, g, b]
}

const rgbToAnimatedValue = (
  input: RGBColor | RGBAColor
): AnimatedValue | null => {
  const regex = /\(([^)]+)\)/
  const matches = input.match(regex)
  if (matches && matches.length > 1) {
    return matches[1].split(',').map(Number)
  }
  return null
}

export const colorToAnimatedValue = (color: Color): AnimatedValue => {
  const isRGB = isRGBColor(color)
  const isHex = isHexColor(color)

  if (isRGB) {
    const value = rgbToAnimatedValue(color)
    if (value === null) {
      if (import.meta.env.MODE === 'development') {
        throw new Error(`
        
        The color("${color}") cannot be recognized correctly. Please ensure that the color format is in 'rgb(r,g,b)' or 'rgba(r,g,b,a)'.
        `)
      }
      return []
    }
    return value
  }

  if (isHex) {
    const value = hexToAnimatedValue(color)
    if (import.meta.env.MODE === 'development') {
      value.forEach(v => {
        if (isNaN(v)) {
          throw new Error(`
          
          The color("${color}") cannot be recognized correctly. Please ensure that the color format is either '#000', '#000000', or '#000000FF'.
          `)
        }
      })
    }
    return value
  }

  if (import.meta.env.MODE === 'development') {
    throw new Error(`
    
    "${color}" is an unknown type. Please provide a valid color type.
    `)
  }
  return []
}

function rgbToHex(r: number, g: number, b: number) {
  return ('#' +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)) as HexColor
}
function rgbaToHexA(r: number, g: number, b: number, a: number) {
  const hex = rgbToHex(r, g, b)
  let alpha = Math.round(a * 255).toString(16)
  if (alpha.length == 1) {
    alpha += alpha
  }
  return (hex + alpha) as HexColor
}

export const animationValueToColor = (
  animationValue: AnimatedValue,
  color: unknown
): Color => {
  const [r, g, b, a] = animationValue.map(v => clamp(Math.round(v), 0, 255))
  const hasAlpha = a !== undefined
  if (isRGBColor(color)) {
    if (hasAlpha) {
      return `rgba(${r},${g},${b},${a})`
    }
    return `rgb(${r},${g},${b})`
  }
  if (isHexColor(color)) {
    if (hasAlpha) {
      return rgbaToHexA(r, g, b, a)
    }
    return rgbToHex(r, g, b)
  }

  throw new Error(
    `The color("${color}") cannot be recognized correctly, It appears to be a bug.`
  )
}

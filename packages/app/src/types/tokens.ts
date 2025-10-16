export type TokenType = 
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'strokeStyle'
  | 'border'
  | 'transition'
  | 'shadow'
  | 'gradient'
  | 'typography'

export interface DTCGToken {
  $type: TokenType
  $value: any
  $description?: string
}

export interface ColorToken extends DTCGToken {
  $type: 'color'
  $value: string
}

export interface DimensionToken extends DTCGToken {
  $type: 'dimension'
  $value: string
}

export interface FontFamilyToken extends DTCGToken {
  $type: 'fontFamily'
  $value: string | string[]
}

export interface FontWeightToken extends DTCGToken {
  $type: 'fontWeight'
  $value: number | string
}

export interface DurationToken extends DTCGToken {
  $type: 'duration'
  $value: string
}

export interface CubicBezierToken extends DTCGToken {
  $type: 'cubicBezier'
  $value: [number, number, number, number]
}

export interface NumberToken extends DTCGToken {
  $type: 'number'
  $value: number
}

export interface StrokeStyleToken extends DTCGToken {
  $type: 'strokeStyle'
  $value: 'solid' | 'dashed' | 'dotted' | { dashArray: string[]; lineCap: string }
}

export interface BorderToken extends DTCGToken {
  $type: 'border'
  $value: {
    color: string
    width: string
    style: string
  }
}

export interface TransitionToken extends DTCGToken {
  $type: 'transition'
  $value: {
    duration: string
    delay: string
    timingFunction: string
  }
}

export interface ShadowToken extends DTCGToken {
  $type: 'shadow'
  $value: {
    color: string
    offsetX: string
    offsetY: string
    blur: string
    spread: string
  } | Array<{
    color: string
    offsetX: string
    offsetY: string
    blur: string
    spread: string
  }>
}

export interface GradientToken extends DTCGToken {
  $type: 'gradient'
  $value: Array<{
    color: string
    position: number
  }>
}

export interface TypographyToken extends DTCGToken {
  $type: 'typography'
  $value: {
    fontFamily: string
    fontSize: string
    fontWeight: number | string
    lineHeight: string
    letterSpacing?: string
  }
}

export type Token = 
  | ColorToken
  | DimensionToken
  | FontFamilyToken
  | FontWeightToken
  | DurationToken
  | CubicBezierToken
  | NumberToken
  | StrokeStyleToken
  | BorderToken
  | TransitionToken
  | ShadowToken
  | GradientToken
  | TypographyToken

export interface DesignTokensFile {
  [key: string]: Token
}

export interface TokenWithId {
  id: string
  name: string
  $type: TokenType
  $value: any
  $description?: string
}

export interface DesignToken {
  id: string
  name: string
  type: string
  value: any
  description?: string
}
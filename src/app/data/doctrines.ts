export interface Doctrines {
  doctrines: Doctrine[]
}

export interface Doctrine {
  doctrine: string
  stratagems: Stratagem[]
}

export interface Stratagem {
  name: string
  cp: number
  effect: string
}
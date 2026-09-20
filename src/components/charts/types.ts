export interface BarDatum {
  label: string
  value: number
  /** Optional second line under the label, e.g. "4 on leave". */
  meta?: string
}

export interface LinePoint {
  label: string
  value: number
}

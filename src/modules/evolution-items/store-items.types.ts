export type StoreItemBonus = {
  attr: string
  value: number
}

export type StoreItemCategory = 'v2_equipavel' | 'v2_estudo'

export type StoreItem = {
  id: string
  name: string
  price: number
  bonuses: StoreItemBonus[]
  category: StoreItemCategory
  sortOrder: number
}

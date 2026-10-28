export type Dish = {
  id: number
  user_id: string
  name: string
  category: string | null
  notes: string | null
  rating: number | null
  tags: string | null
  image_url: string | null
  ingredients: string | null  // 每行一个食材，如 "土豆 2个\n盐 适量"
  steps: string | null        // 每行一个步骤
  cooking_time: string | null
  difficulty: string | null
  created_at: string
}

export type DishImage = {
  id: number
  dish_id: number
  url: string
  path: string
  sort_order: number
  created_at: string
}

// AI 提取结果的格式
export type ExtractedRecipe = {
  name: string
  category: string
  cooking_time: string
  difficulty: string
  ingredients: string[]   // ["土豆 2个", "盐 适量", ...]
  steps: string[]         // ["第一步...", "第二步...", ...]
  tags: string[]
  notes: string
}
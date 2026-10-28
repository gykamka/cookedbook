'use client'

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'

export type Lang = 'zh' | 'en'

const STORAGE_KEY = 'cookedbook-lang'

const zh = {
  appName: '灶记',
  tagline: '做过的菜，都记在这里',
  landingIntro: '不是收藏夹，是你真的做成功、还想再做的菜谱本。',
  start: '开始记录',

  login: '登录',
  signUp: '注册',
  createAccount: '创建账号',
  email: '邮箱',
  password: '密码',
  pleaseWait: '请稍候…',
  toSignUp: '没有账号？去注册',
  toLogin: '已有账号？去登录',
  signUpFailed: '注册失败：',
  signUpOk: '注册成功！请去邮箱确认后再登录',
  loginFailed: '登录失败：',

  myMenu: '我的菜单',
  tapToRename: '点一下改名字',
  ok: '好',
  signOut: '退出',
  loading: '加载中…',
  emptyTitle: '还没有菜呢',
  emptyHint: '点右下角 ＋，记下第一道做成功的菜',
  searchPlaceholder: '搜菜名、食材、标签',
  all: '全部',
  noMatch: '没有找到这道菜',
  menuFooter: '想吃什么，随便点',
  uncategorized: '未分类',

  back: '返回',
  addDish: '添加一道菜',
  dishName: '菜名',
  dishNamePlaceholder: '比如：番茄炒蛋',
  photos: '菜的照片',
  photosHint: '可拍照或从相册选，第一张为封面，最多 9 张',
  addPhoto: '添加图片',
  uploading: '上传中…',
  cover: '封面',
  uploadedCount: (n: number, max: number) => `第一张为封面 · 已上传 ${n}/${max}`,
  rating: '评分',
  ratingWords: ['', '一般般', '还不错', '挺好吃', '非常好吃', '满分！必须再做！'],
  category: '分类',
  customCategory: '自定义',
  customCategoryPlaceholder: '输入分类名，比如：家常菜',
  confirm: '确认',
  tags: '标签',
  tagsHint: '比如：辣、快手菜、下饭、朋友来了必做',
  tagPlaceholder: '输入标签，回车添加',
  add: '添加',
  notes: '备注',
  notesPlaceholder: '比如：第一次做，少放了盐还不错；下次试试加点糖',
  nameRequired: '请输入菜名',
  saveFailed: '保存失败，请重试',
  saving: '保存中…',
  saveAndExtract: '保存，并用 AI 识别菜谱截图',
  saveOnly: '没有菜谱截图，直接保存',

  extractTitle: 'AI 识别菜谱',
  uploadScreenshots: '上传菜谱截图',
  uploadScreenshotsHint: '可以传好几张，比如一张食材、一张步骤，AI 会合在一起看。中文、英文菜谱都能认。',
  tapToUpload: '点这里上传菜谱截图',
  multiSelectHint: '可多选，可拍照或从相册选',
  addMore: '继续添加',
  startExtract: (n: number) => `开始识别${n > 1 ? `（${n} 张）` : ''}`,
  extracting: 'AI 正在认真看…',
  reviewTitle: '检查一下 AI 的结果',
  reviewHint: 'AI 可能会看错，改好了再保存',
  cookingTime: '烹饪时间',
  cookingTimePlaceholder: '如：30分钟',
  difficulty: '难度',
  unknown: '未知',
  ingredients: '食材',
  onePerLine: '（每行一个）',
  steps: '步骤',
  oneStepPerLine: '（每行一个步骤）',
  tips: '小贴士',
  reExtract: '效果不好？重新识别',
  reExtracting: '重新识别中…',
  saveRecipe: '保存菜谱',
  notJson: '接口返回的不是 JSON：',
  apiError: '接口错误：',
  networkError: '网络错误，请重试',

  edit: '编辑',
  editRecipe: '编辑菜谱',
  images: '图片',
  cancel: '取消',
  saveChanges: '保存修改',
  deleteDish: '删除这道菜',
  deleteConfirm: (name: string) => `确定要删除「${name}」吗？`,
  deleteWarning: '会同时删除所有图片，删除后无法恢复',
  confirmDelete: '确认删除',
  addedOn: (date: string) => `记于 ${date}`,
  ingredientsPlaceholder: '鸡蛋 2个\n盐 适量\n…',
  stepsPlaceholder: '第一步…\n第二步…\n…',
  noRecipeYet: '还没有菜谱内容',
  addRecipeWithAi: '用 AI 识别截图补上',
}

export type Dict = typeof zh

const en: Dict = {
  appName: 'CookedBook',
  tagline: 'Every dish you have cooked, in one book',
  landingIntro: 'Not a pile of saved posts — the recipes that actually worked in your kitchen.',
  start: 'Get started',

  login: 'Log in',
  signUp: 'Sign up',
  createAccount: 'Create account',
  email: 'Email',
  password: 'Password',
  pleaseWait: 'Please wait…',
  toSignUp: 'No account? Sign up',
  toLogin: 'Have an account? Log in',
  signUpFailed: 'Sign-up failed: ',
  signUpOk: 'Signed up! Confirm your email, then log in',
  loginFailed: 'Login failed: ',

  myMenu: 'My Menu',
  tapToRename: 'Tap to rename',
  ok: 'OK',
  signOut: 'Sign out',
  loading: 'Loading…',
  emptyTitle: 'No dishes yet',
  emptyHint: 'Tap ＋ to save the first dish that turned out well',
  searchPlaceholder: 'Search dishes, ingredients, tags',
  all: 'All',
  noMatch: 'No dish found',
  menuFooter: 'Pick whatever you like',
  uncategorized: 'Other',

  back: 'Back',
  addDish: 'Add a dish',
  dishName: 'Dish name',
  dishNamePlaceholder: 'e.g. Tomato & egg stir-fry',
  photos: 'Photos',
  photosHint: 'Take a photo or pick from your album. The first one is the cover, up to 9',
  addPhoto: 'Add photo',
  uploading: 'Uploading…',
  cover: 'Cover',
  uploadedCount: (n: number, max: number) => `First photo is the cover · ${n}/${max}`,
  rating: 'Rating',
  ratingWords: ['', 'So-so', 'Not bad', 'Pretty good', 'Delicious', 'Perfect! Must make again!'],
  category: 'Category',
  customCategory: 'Custom',
  customCategoryPlaceholder: 'Category name, e.g. Home-style',
  confirm: 'OK',
  tags: 'Tags',
  tagsHint: 'e.g. spicy, quick, great with rice, for guests',
  tagPlaceholder: 'Type a tag, press Enter',
  add: 'Add',
  notes: 'Notes',
  notesPlaceholder: 'e.g. Used less salt this time — good. Try a pinch of sugar next time',
  nameRequired: 'Please enter a dish name',
  saveFailed: 'Could not save, please try again',
  saving: 'Saving…',
  saveAndExtract: 'Save, then read a recipe screenshot with AI',
  saveOnly: 'No screenshot — just save',

  extractTitle: 'Read recipe with AI',
  uploadScreenshots: 'Upload recipe screenshots',
  uploadScreenshotsHint: 'Add several if you like (one for ingredients, one for steps). Chinese and English recipes both work.',
  tapToUpload: 'Tap to upload screenshots',
  multiSelectHint: 'Pick several, or take a photo',
  addMore: 'Add more',
  startExtract: (n: number) => `Read recipe${n > 1 ? ` (${n} images)` : ''}`,
  extracting: 'AI is reading carefully…',
  reviewTitle: 'Check what AI found',
  reviewHint: 'AI can make mistakes — fix anything before saving',
  cookingTime: 'Cooking time',
  cookingTimePlaceholder: 'e.g. 30 min',
  difficulty: 'Difficulty',
  unknown: 'Unknown',
  ingredients: 'Ingredients',
  onePerLine: '(one per line)',
  steps: 'Steps',
  oneStepPerLine: '(one step per line)',
  tips: 'Tips',
  reExtract: 'Not right? Read again',
  reExtracting: 'Reading again…',
  saveRecipe: 'Save recipe',
  notJson: 'The server did not return JSON: ',
  apiError: 'Server error: ',
  networkError: 'Network error, please try again',

  edit: 'Edit',
  editRecipe: 'Edit recipe',
  images: 'Photos',
  cancel: 'Cancel',
  saveChanges: 'Save changes',
  deleteDish: 'Delete this dish',
  deleteConfirm: (name: string) => `Delete “${name}”?`,
  deleteWarning: 'All its photos will be deleted too. This cannot be undone.',
  confirmDelete: 'Delete',
  addedOn: (date: string) => `Saved on ${date}`,
  ingredientsPlaceholder: 'Eggs 2\nSalt to taste\n…',
  stepsPlaceholder: 'Step one…\nStep two…\n…',
  noRecipeYet: 'No recipe written down yet',
  addRecipeWithAi: 'Fill it in from a screenshot',
}

const DICTS: Record<Lang, Dict> = { zh, en }

// 分类和难度在数据库里存中文，显示时按语言翻译
export const DEFAULT_CATEGORIES = ['凉菜', '热菜', '炖菜', '汤', '主食', '饮料', '甜品', '外卖']

const CATEGORY_EN: Record<string, string> = {
  '凉菜': 'Cold dishes', '热菜': 'Stir-fries', '炖菜': 'Braises & stews',
  '汤': 'Soups', '主食': 'Rice & noodles', '饮料': 'Drinks',
  '甜品': 'Desserts', '外卖': 'Takeout',
}

export const DIFFICULTIES = ['简单', '中等', '困难']

const DIFFICULTY_EN: Record<string, string> = {
  '简单': 'Easy', '中等': 'Medium', '困难': 'Hard',
}

type LangContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Dict
  categoryLabel: (category: string) => string
  difficultyLabel: (difficulty: string) => string
}

const LangContext = createContext<LangContextValue | null>(null)

// 语言选择存在 localStorage，服务端渲染时默认简体中文
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function readLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh'
  } catch {
    return 'zh'
  }
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, () => 'zh' as Lang)

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  function setLang(next: Lang) {
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}
    listeners.forEach(l => l())
  }

  const value: LangContextValue = {
    lang,
    setLang,
    t: DICTS[lang],
    categoryLabel: c => (lang === 'en' ? CATEGORY_EN[c] ?? c : c),
    difficultyLabel: d => (lang === 'en' ? DIFFICULTY_EN[d] ?? d : d),
  }

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}

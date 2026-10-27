import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type ImageItem = {
  imageBase64: string
  mimeType: string
}

type ExtractRecipeRequest = {
  images: ImageItem[]
}

function cleanJsonText(text: string): string {
  // 去掉 markdown 代码块标记
  let cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  // 只取第一个 { 到最后一个 } 之间的内容
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1)
  }

  // 删除 // 注释和 /* */ 注释
  cleaned = cleaned
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

  return cleaned
}

export async function POST(req: Request): Promise<Response> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: '缺少 Gemini API key，请检查 .env.local 并重启 dev server' },
        { status: 500 }
      )
    }

    const { images } = (await req.json()) as ExtractRecipeRequest

    if (!images || images.length === 0) {
      return NextResponse.json({ error: '没有收到图片' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    })

    const prompt = `请从这${images.length > 1 ? `${images.length}张` : '张'}菜谱图片中提取信息，如果有多张图片请综合所有图片的内容（比如一张是食材、一张是步骤），返回 JSON 格式，不要加任何多余文字。

格式如下：
{
  "name": "菜名",
  "category": "分类，从以下选一个：凉菜/热菜/炖菜/汤/主食/饮料/甜品/外卖，不确定就填空字符串",
  "cooking_time": "烹饪时间，比如 30分钟，不确定就填空字符串",
  "difficulty": "难度，从以下选一个：简单/中等/困难，不确定就填空字符串",
  "ingredients": ["食材1 用量", "食材2 用量"],
  "steps": ["步骤一的描述", "步骤二的描述"],
  "tags": ["标签1", "标签2"],
  "notes": "其他注意事项，没有就填空字符串"
}

要求：
- 如果图片不是菜谱，ingredients 和 steps 都返回空数组
- 食材和用量写在同一个字符串里，比如 "鸡蛋 2个"
- 步骤要完整，不要省略
- 数组元素只能是字符串，不能加任何注释或说明文字
- 只返回 JSON，不要加其他说明，不要在 JSON 内部写注释`



    // 把所有图片拼成一个 parts 数组传给 Gemini
    const imageParts = images.map(img => ({
      inlineData: {
        mimeType: img.mimeType || 'image/jpeg',
        data: img.imageBase64,
      },
    }))

    const result = await model.generateContent([...imageParts, prompt])

    const text = result.response.text()
    const cleaned = cleanJsonText(text)

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch (parseError) {
      console.error('Gemini JSON parse failed:', parseError)
      console.error('Gemini raw text:', text)
      return NextResponse.json(
        { error: 'AI 返回的内容不是合法 JSON，请重试或换一张更清晰的截图', raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json({ result: parsed })
  } catch (error) {
    console.error('提取失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '提取失败，请重试' },
      { status: 500 }
    )
  }
}
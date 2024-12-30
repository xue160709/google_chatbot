'use server'

import { Configuration, OpenAIApi } from 'openai'
import { chromium } from 'playwright'

const configuration = new Configuration({
  apiKey: "",
  basePath: 'https://api.siliconflow.cn/v1'
})

const openai = new OpenAIApi(configuration)

interface ChatResponse {
  message: string | null
  error: string | null
  status?: string
}

async function performGoogleSearch(query: string): Promise<string> {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    })
    const page = await context.newPage()
    
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
      waitUntil: 'networkidle'
    })
    
    // 等待搜索结果加载
    await page.waitForSelector('div#search', { timeout: 10000 })
    
    // 提取搜索结果
    const results = await page.evaluate(() => {
      const items = document.querySelectorAll('div.g')
      return Array.from(items).slice(0, 5).map(item => {
        const title = item.querySelector('h3')?.textContent || ''
        const link = item.querySelector('a')?.href || ''
        const snippet = item.querySelector('div.VwiC3b')?.textContent || ''
        return `标题: ${title}\n摘要: ${snippet}\n链接: ${link}\n\n`
      }).join('')
    })

    return results
  } catch (error) {
    console.error('Search error:', error)
    throw new Error('搜索失败')
  } finally {
    await browser.close()
  }
}

export async function chatAction(prevState: any, formData: FormData): Promise<ChatResponse> {
  const message = formData.get('message')?.toString().trim()
  const useSearch = formData.get('useSearch') === 'true'
  
  if (!message && prevState.status !== '') {
    return { message: null, error: '无效的消息内容', status: '' }
  }

  if (!message) {
    return { message: null, error: null, status: '' }
  }
  
  try {
    let searchContext = ''
    if (useSearch) {
      try {
        searchContext = await performGoogleSearch(message)
      } catch (error) {
        console.error('Search error:', error)
        return { message: null, error: '搜索失败，请稍后重试', status: '' }
      }
    }

    try {
      const completion = await openai.createChatCompletion({
        model: 'deepseek-ai/DeepSeek-V2.5',
        messages: [
          {
            role: 'system',
            content: '你是一个有帮助的AI助手。请使用Markdown格式回答问题，以确保更好的可读性。如果提供了搜索结果，请基于搜索结果提供答案。'
          },
          ...(searchContext ? [{
            role: 'system' as const,
            content: `以下是相关的搜索结果：\n\n${searchContext}`
          }] : []),
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })

      const text = completion.data.choices[0]?.message?.content
      if (!text) {
        return { message: null, error: '未收到有效的回复', status: '' }
      }

      return { message: text, error: null, status: '' }
      
    } catch (error: any) {
      console.error('OpenAI error:', error)
      const errorMessage = error.response?.data?.error?.message || '生成回复失败'
      return { message: null, error: errorMessage, status: '' }
    }
    
  } catch (error: any) {
    console.error('General error:', error)
    return { message: null, error: '发生未知错误', status: '' }
  }
}


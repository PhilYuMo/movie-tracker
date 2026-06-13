import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { url } = await request.json()

    if (!url || !/^https?:\/\/movie\.douban\.com\/subject\/\d+/.test(url)) {
      return NextResponse.json({ error: '无效的豆瓣链接' }, { status: 400 })
    }

    // 方案1: 尝试通过 CORS proxy 获取
    // 方案2: 如果服务端请求被屏蔽，告诉用户需要在浏览器端直接解析
    // 这里先尝试用多个代理尝试获取

    const proxies = [
      url, // 直接请求
    ]

    let html = null
    let lastError = null

    for (const target of proxies) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)

        const res = await fetch(target, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://movie.douban.com/',
          }
        })
        clearTimeout(timeout)

        if (res.ok) {
          html = await res.text()
          break
        }
      } catch (e) {
        lastError = e.message
      }
    }

    if (!html) {
      // 服务端解析失败，返回提示让前端自行解析
      return NextResponse.json({
        error: '豆瓣需要验证，请稍后重试',
        needClientParse: true
      }, { status: 503 })
    }

    // 检查是否是验证页面
    if (html.includes('检测到有异常请求') || html.includes('验证') || html.includes('captcha')) {
      return NextResponse.json({
        error: '豆瓣需要验证，请稍后重试',
        needClientParse: true
      }, { status: 503 })
    }

    // 解析 HTML
    const result = parseDoubanHtml(html, url)
    return NextResponse.json({ data: result })

  } catch (err) {
    console.error('Parse error:', err)
    return NextResponse.json({
      error: '解析失败，请稍后重试',
      needClientParse: true
    }, { status: 500 })
  }
}

function parseDoubanHtml(html, url) {
  const result = { title: null, year: null, poster: null, genres: [], director: null, cast: null, douban_rating: null, overview: null }

  // 从 meta 标签提取
  const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
  if (ogTitle) result.title = ogTitle[1].trim()

  const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
  if (ogImage) result.poster = ogImage[1].trim()

  const ogDescription = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
  if (ogDescription) result.overview = ogDescription[1].trim()

  // 年份
  const yearMatch = html.match(/<meta\s+property=["']og:video:release_date["']\s+content=["'](\d{4})/i)
  if (yearMatch) {
    result.year = parseInt(yearMatch[1])
  } else {
    const yearInText = html.match(/\((\d{4})\)/)
    if (yearInText) result.year = parseInt(yearInText[1])
  }

  // 评分
  const ratingMatch = html.match(/<strong\s+class="ll\s+rating_num"[^>]*>([^<]+)</i)
  if (ratingMatch) {
    result.douban_rating = parseFloat(ratingMatch[1].trim())
  }

  // 导演
  const directorMatch = html.match(/导演[^<]*<a[^>]*>([^<]+)</i)
  if (directorMatch) result.director = directorMatch[1].trim()

  // 类型
  const genreRegex = /<span\s+property="v:genre">([^<]+)<\/span>/gi
  let genreMatch
  while ((genreMatch = genreRegex.exec(html)) !== null) {
    result.genres.push(genreMatch[1].trim())
  }
  if (result.genres.length === 0) {
    const genreSection = html.match(/<span[^>]*>类型[^<]*<\/span>\s*([^<]+)/i)
    if (genreSection) {
      result.genres = genreSection[1].split('/').map(g => g.trim()).filter(Boolean)
    }
  }

  // cast 主演（简化提取）
  const castSection = html.match(/主演[^<]*(?:<a[^>]*>([^<]+)<\/a>\s*)/i)
  if (castSection) {
    const allCasts = html.match(/<a\s+(?:[^>]*\s+)?rel="v:starring"[^>]*>([^<]+)<\/a>/gi)
    if (allCasts) {
      const actors = allCasts.map(a => a.replace(/<[^>]+>/g, '').trim()).slice(0, 5)
      result.cast = actors.join(' / ')
    }
  }

  return result
}

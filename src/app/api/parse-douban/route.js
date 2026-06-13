// app/api/parse-douban/route.js — 豆瓣电影信息解析接口
import { NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function extractSubjectId(url) {
  const match = url.match(/subject\/(\d+)/)
  return match ? match[1] : null
}

function safeText($el) {
  const text = $el.first().text()?.trim()
  return text || null
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { url } = body || {}

    if (!url) {
      return NextResponse.json({ error: '请提供豆瓣电影链接' }, { status: 400 })
    }

    const subjectId = extractSubjectId(url)
    if (!subjectId) {
      return NextResponse.json(
        { error: '无效的豆瓣链接，格式应为 https://movie.douban.com/subject/XXXXXX/' },
        { status: 400 }
      )
    }

    let response
    try {
      response = await axios.get(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Cache-Control': 'no-cache',
        },
        timeout: 15000,
        responseType: 'text',
      })
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 418) {
        return NextResponse.json({ error: '豆瓣需要验证，请稍后重试' }, { status: 403 })
      }
      throw err
    }

    const html = response.data
    const $ = cheerio.load(html)

    const pageTitle = $('title').text().trim().toLowerCase()
    if (pageTitle.includes('验证') || pageTitle.includes('检测') || html.includes('noscript')) {
      const hasNormalContent = $('meta[property="og:title"]').attr('content')
      if (!hasNormalContent) {
        return NextResponse.json({ error: '豆瓣需要验证，请稍后重试' }, { status: 403 })
      }
    }

    // 1. 片名
    let title = $('meta[property="og:title"]').attr('content')
    if (!title) {
      const fullTitle = $('title').first().text().trim()
      const titleMatch = fullTitle.match(/^(.+?)\s*\(/)
      title = titleMatch ? titleMatch[1].trim() : fullTitle
    }

    // 2. 年份
    let year = null
    const releaseDate = $('meta[property="og:video:release_date"]').attr('content')
    if (releaseDate) {
      const y = new Date(releaseDate).getFullYear()
      if (!isNaN(y)) year = y
    }
    if (!year) {
      const fullTitle = $('title').first().text().trim()
      const yearMatch = fullTitle.match(/\((\d{4})\)/)
      if (yearMatch) year = parseInt(yearMatch[1], 10)
    }
    if (!year) {
      const bodyYearMatch = html.match(/\((\d{4})\)/)
      if (bodyYearMatch) year = parseInt(bodyYearMatch[1], 10)
    }

    // 3. 海报
    const poster = $('meta[property="og:image"]').attr('content') || null

    // 4. 导演
    let director = null
    const infoEl = $('#info')
    if (infoEl.length) {
      infoEl.find('span').each(function () {
        const span = $(this)
        const text = span.text().trim()
        if (text.includes('导演')) {
          const links = span.nextAll('a')
          if (links.length) {
            director = safeText(links.first())
          }
        }
      })
    }

    // 5. 主演
    let cast = null
    if (infoEl.length) {
      infoEl.find('span').each(function () {
        const span = $(this)
        const text = span.text().trim()
        if (text.includes('主演')) {
          const links = span.nextAll('a')
          const actors = []
          links.each(function () {
            const name = $(this).text().trim()
            if (name && name !== '更多...' && name !== '...') {
              actors.push(name)
            }
          })
          if (actors.length) {
            cast = actors.slice(0, 5).join(' / ')
          }
        }
      })
    }

    // 6. 类型
    let genres = []
    if (infoEl.length) {
      infoEl.find('span[property="v:genre"]').each(function () {
        const g = $(this).text().trim()
        if (g) genres.push(g)
      })
    }
    if (genres.length === 0 && infoEl.length) {
      infoEl.find('span').each(function () {
        const span = $(this)
        const text = span.text().trim()
        if (text.includes('类型')) {
          const siblings = span.nextAll('span')
          siblings.each(function () {
            const g = $(this).text().trim()
            if (g && g !== '/' && !g.includes('类型')) {
              g.split('/').forEach(function (item) {
                const trimmed = item.trim()
                if (trimmed) genres.push(trimmed)
              })
            }
          })
        }
      })
    }

    // 7. 豆瓣评分
    let doubanRating = null
    const ratingEl = $('strong.ll.rating_num')
    if (ratingEl.length) {
      const val = parseFloat(ratingEl.text().trim())
      if (!isNaN(val)) doubanRating = val
    }
    if (doubanRating === null) {
      const altRatingEl = $('.ll.rating_num')
      if (altRatingEl.length) {
        const val = parseFloat(altRatingEl.first().text().trim())
        if (!isNaN(val)) doubanRating = val
      }
    }

    // 8. 简介
    let overview = $('meta[property="og:description"]').attr('content') || null
    if (overview) {
      const cleaned = overview.replace(/^.+?的剧情简介\s*[·.]*\s*/, '').trim()
      if (cleaned) overview = cleaned
    }

    const result = {
      title,
      year,
      poster,
      genres,
      director,
      cast,
      douban_rating: doubanRating,
      overview,
      douban_url: url,
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Parse Douban error:', error)

    if (error.code === 'ECONNABORTED') {
      return NextResponse.json({ error: '请求豆瓣超时，请稍后重试' }, { status: 504 })
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: '无法连接到豆瓣，请检查网络' }, { status: 502 })
    }

    return NextResponse.json({ error: '解析失败，请稍后重试' }, { status: 500 })
  }
}


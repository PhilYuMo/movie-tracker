'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { getSupabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const GENRE_OPTIONS = [
  "剧情","喜剧","动作","爱情","科幻","动画","悬疑","惊悚",
  "恐怖","纪录片","短片","情色","同性","音乐","歌舞","家庭",
  "儿童","传记","历史","战争","犯罪","西部","奇幻","冒险",
  "灾难","武侠","古装","运动","黑色电影",
]

export default function EditMoviePage() {
  const router = useRouter()
  const params = useParams()
  const [form, setForm] = useState({
    title: '', year: '', poster: '', genres: [],
    director: '', cast: '', rating: '', douban_rating: '',
    watch_date: '', douban_url: '', overview: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await getSupabase().from('movies').select('*').eq('id', params.id).single()
        if (error || !data) {
          toast.error('电影不存在')
          router.push('/')
          return
        }
        setForm({
          title: data.title || '',
          year: data.year ? String(data.year) : '',
          poster: data.poster || '',
          genres: data.genres || [],
          director: data.director || '',
          cast: data.cast || '',
          rating: data.rating != null ? String(data.rating) : '',
          douban_rating: data.douban_rating != null ? String(data.douban_rating) : '',
          watch_date: data.watch_date || '',
          douban_url: data.douban_url || '',
          overview: data.overview || '',
        })
      } catch {
        toast.error('加载失败')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, router])

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const toggleGenre = (genre) => {
    setForm((prev) => {
      const exists = prev.genres.includes(genre)
      return { ...prev, genres: exists ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre] }
    })
  }

  const validate = () => {
    if (!form.title.trim()) { toast.error('请输入电影片名'); return false }
    const yearNum = parseInt(form.year, 10)
    if (form.year && (isNaN(yearNum) || yearNum < 1888 || yearNum > 2100)) { toast.error('年份格式不正确'); return false }
    const r = parseFloat(form.rating)
    if (form.rating && (isNaN(r) || r < 0 || r > 10)) { toast.error('个人评分应在 0-10 之间'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const toastId = toast.loading('正在保存...')
    try {
      const payload = {
        title: form.title.trim(),
        year: form.year ? parseInt(form.year, 10) : null,
        poster: form.poster?.trim() || null,
        genres: form.genres.length ? form.genres : null,
        director: form.director?.trim() || null,
        cast: form.cast?.trim() || null,
        rating: form.rating ? parseFloat(form.rating) : null,
        douban_rating: form.douban_rating ? parseFloat(form.douban_rating) : null,
        douban_url: form.douban_url?.trim() || null,
        overview: form.overview?.trim() || null,
        watch_date: form.watch_date || null,
      }
      const { error } = await getSupabase().from('movies').update(payload).eq('id', params.id)
      if (error) { toast.error('保存失败：' + error.message, { id: toastId }); setSaving(false); return }
      toast.success('保存成功！', { id: toastId })
      setTimeout(() => router.push('/movie/' + params.id), 800)
    } catch { toast.error('保存失败，请稍后重试', { id: toastId }); setSaving(false) }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#ff6b6b] border-t-transparent rounded-full" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href={'/movie/' + params.id} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-3xl font-bold text-gray-900">编辑电影</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">片名 <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年份</label>
              <input type="number" value={form.year} onChange={(e) => updateField('year', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">海报 URL</label>
              <input type="text" value={form.poster} onChange={(e) => updateField('poster', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((genre) => {
                const selected = form.genres.includes(genre)
                return (
                  <button key={genre} type="button" onClick={() => toggleGenre(genre)}
                    className={selected ? 'bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium' : 'bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-gray-200'}>
                    {genre}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">导演</label>
              <input type="text" value={form.director} onChange={(e) => updateField('director', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">主演</label>
              <input type="text" value={form.cast} onChange={(e) => updateField('cast', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">个人评分（0-10）</label>
              <input type="number" step="0.1" value={form.rating} onChange={(e) => updateField('rating', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">豆瓣评分（0-10）</label>
              <input type="number" step="0.1" value={form.douban_rating} onChange={(e) => updateField('douban_rating', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">观看日期</label>
            <input type="date" value={form.watch_date} onChange={(e) => updateField('watch_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
            <textarea rows={4} value={form.overview} onChange={(e) => updateField('overview', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-4 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
            <Link href={'/movie/' + params.id} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">取消</Link>
          </div>
        </form>
      </div>
    </main>
  )
}

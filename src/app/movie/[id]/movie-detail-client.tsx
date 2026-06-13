'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, Edit, Trash2, Star, ExternalLink, Calendar, User, Film, Clock } from 'lucide-react'
import type { Movie } from '@/types'

export default function MovieDetailClient({ movie }: { movie: Movie }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const toastId = toast.loading('正在删除...')
    try {
      const res = await fetch('/api/movies/' + movie.id, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || '删除失败', { id: toastId })
        setDeleting(false)
        return
      }
      toast.success('已删除', { id: toastId })
      setTimeout(() => router.push('/'), 600)
    } catch {
      toast.error('删除失败，请稍后重试', { id: toastId })
      setDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] pb-16">
      <Toaster position="top-center" />

      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={'/movie/' + movie.id + '/edit'}
              className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              编辑
            </Link>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={deleting}
              className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>
          </div>
        </div>
      </header>

      {/* 删除确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="text-4xl mb-3">{String.fromCodePoint(0x26A0, 0xFE0F)}</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 mb-6">
              确定要删除《{movie.title}》吗？此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 内容区 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* 头部区域：海报 + 基本信息 */}
          <div className="flex flex-col md:flex-row">
            {/* 海报 */}
            <div className="md:w-80 shrink-0 bg-gray-50">
              <div className="aspect-[2/3] relative">
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Film className="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>

            {/* 基本信息 */}
            <div className="flex-1 p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{movie.title}</h1>

              {movie.year && (
                <p className="text-sm text-gray-500 mb-4">{movie.year}</p>
              )}

              {/* 类型标签 */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {movie.genres.map((g) => (
                    <span key={g} className="bg-[#ff6b6b]/10 text-[#ff6b6b] text-xs px-3 py-1 rounded-full font-medium">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* 评分 */}
              <div className="flex flex-wrap gap-6 mb-6">
                <div>
                  <div className="text-xs text-gray-400 mb-1">{String.fromCodePoint(0x6211, 0x7684, 0x8BC4, 0x5206)}</div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#ff6b6b] fill-[#ff6b6b]" />
                    <span className="text-xl font-bold text-[#ff6b6b]">{movie.rating ?? '-'}</span>
                    {movie.rating != null && <span className="text-xs text-gray-400">/ 10</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">{String.fromCodePoint(0x8C46, 0x74E3, 0x8BC4, 0x5206)}</div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#ffb340] fill-[#ffb340]" />
                    <span className="text-xl font-bold text-gray-800">{movie.douban_rating ?? '-'}</span>
                    {movie.douban_rating != null && <span className="text-xs text-gray-400">/ 10</span>}
                  </div>
                </div>
              </div>

              {/* 观看日期 */}
              {movie.watch_date && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{String.fromCodePoint(0x89C2, 0x770B, 0x65E5, 0x671F, 0xFF1A)} {movie.watch_date}</span>
                </div>
              )}

              {/* 豆瓣链接 */}
              {movie.douban_url && (
                <a
                  href={movie.douban_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[#4a9eff] hover:underline mb-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {String.fromCodePoint(0x67E5, 0x770B, 0x8C46, 0x74E3, 0x9875, 0x9762)}
                </a>
              )}
            </div>
          </div>

          {/* 详细信息 */}
          <div className="border-t border-gray-100 px-6 md:px-8 py-6 space-y-5">
            {/* 导演 */}
            {movie.director && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-gray-400">{String.fromCodePoint(0x5BFC, 0x6F14)}</span>
                  <p className="text-sm text-gray-800">{movie.director}</p>
                </div>
              </div>
            )}

            {/* 主演 */}
            {movie.cast && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-gray-400">{String.fromCodePoint(0x4E3B, 0x6F14)}</span>
                  <p className="text-sm text-gray-800">{movie.cast}</p>
                </div>
              </div>
            )}

            {/* 简介 */}
            {movie.overview && (
              <div>
                <span className="text-xs text-gray-400">{String.fromCodePoint(0x7B80, 0x4ECB)}</span>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{movie.overview}</p>
              </div>
            )}

            {/* 创建时间 */}
            {movie.created_at && (
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-50">
                <Clock className="w-3 h-3" />
                <span>{String.fromCodePoint(0x8BB0, 0x5F55, 0x65F6, 0x95F4, 0xFF1A)} {new Date(movie.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}


'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'
import type { Movie } from '@/types'

const DECADES = ['2020年代', '2010年代', '2000年代', '1990年代', '1980年代及更早']

function getDecade(year: number | null) {
  if (!year) return null
  if (year >= 2020) return '2020年代'
  if (year >= 2010) return '2010年代'
  if (year >= 2000) return '2000年代'
  if (year >= 1990) return '1990年代'
  return '1980年代及更早'
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating == null) return null
  const full = Math.floor(rating / 2)
  const stars: string[] = []
  for (let i = 0; i < full; i++) stars.push('★')
  return <span className="text-yellow-400 text-sm tracking-tight">{stars.join('')}</span>
}

export default function HomeClient({ movies }: { movies: Movie[] }) {
  const [activeGenre, setActiveGenre] = useState('全部')
  const [activeDecade, setActiveDecade] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')

  const allGenres = useMemo(() => {
    const set = new Set<string>()
    movies.forEach((m) => {
      if (m.genres) m.genres.forEach((g) => set.add(g))
    })
    return ['全部', ...Array.from(set).sort()]
  }, [movies])

  const filtered = useMemo(() => {
    let list = [...movies]
    if (activeGenre !== '全部') {
      list = list.filter((m) => m.genres && m.genres.includes(activeGenre))
    }
    if (activeDecade !== '全部') {
      list = list.filter((m) => getDecade(m.year) === activeDecade)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((m) => m.title && m.title.toLowerCase().includes(q))
    }
    return list
  }, [movies, activeGenre, activeDecade, searchQuery])

  return (
    <>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索片名..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/30 focus:border-[#ff6b6b] bg-white"
          />
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-medium w-10">类型</span>
          <div className="flex flex-wrap gap-1.5">
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={
                  activeGenre === genre
                    ? 'bg-[#ff6b6b] text-white px-3 py-1 rounded-full text-xs font-medium transition-all'
                    : 'bg-white text-gray-500 px-3 py-1 rounded-full text-xs font-medium border border-gray-200 hover:border-[#ff6b6b] hover:text-[#ff6b6b] transition-all'
                }
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-medium w-10">年代</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveDecade('全部')}
              className={
                activeDecade === '全部'
                  ? 'bg-[#ff6b6b] text-white px-3 py-1 rounded-full text-xs font-medium transition-all'
                  : 'bg-white text-gray-500 px-3 py-1 rounded-full text-xs font-medium border border-gray-200 hover:border-[#ff6b6b] hover:text-[#ff6b6b] transition-all'
              }
            >
              全部
            </button>
            {DECADES.map((decade) => (
              <button
                key={decade}
                onClick={() => setActiveDecade(decade)}
                className={
                  activeDecade === decade
                    ? 'bg-[#ff6b6b] text-white px-3 py-1 rounded-full text-xs font-medium transition-all'
                    : 'bg-white text-gray-500 px-3 py-1 rounded-full text-xs font-medium border border-gray-200 hover:border-[#ff6b6b] hover:text-[#ff6b6b] transition-all'
                }
              >
                {decade}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-4">
        共 {filtered.length} 部
        {filtered.length !== movies.length && <>（全部 {movies.length} 部）</>}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">{String.fromCodePoint(0x1F3AC)}</div>
          <p className="text-gray-400 text-sm">
            {movies.length === 0
              ? '还没有电影，去添加一部吧'
              : '没有匹配的电影'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filtered.map((movie, index) => (
            <div key={movie.id}>
              <Link href={'/movie/' + movie.id} className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="absolute top-2 left-2 z-10 w-7 h-7 bg-[#ff6b6b] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                  #{index + 1}
                </div>
                <div className="aspect-[2/3] bg-gray-100 overflow-hidden">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-1 leading-tight">{movie.title}</h3>
                  {movie.year && <p className="text-xs text-gray-400 mt-1">{movie.year}</p>}
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {movie.genres.slice(0, 3).map((g) => (
                        <span key={g} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{g}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {movie.rating != null && (
                      <div className="flex items-center gap-1">
                        <span className="text-[#ff6b6b] font-bold">{movie.rating}</span>
                        <StarRating rating={movie.rating} />
                      </div>
                    )}
                    {movie.douban_rating != null && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <span className="text-[11px]">豆瓣</span>
                        <span>{movie.douban_rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

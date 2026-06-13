import { getAllMovies } from '@/lib/localDb'
import HomeClient from './home-client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  var movies = getAllMovies()

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#333] tracking-tight">我的电影收藏</h1>
          <Link
            href="/add"
            className="bg-[#ff6b6b] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#ff5252] transition-colors"
          >
            + 添加电影
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <HomeClient movies={movies} />
      </div>
    </main>
  )
}

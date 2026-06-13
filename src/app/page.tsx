import { createClient } from '@supabase/supabase-js'
import HomeClient from './home-client'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function hasValidEnv() {
  return supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10
}

async function getMovies() {
  if (!hasValidEnv()) return []
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('rating', { ascending: false })
    .order('watch_date', { ascending: false })
  if (error) {
    console.error('Supabase fetch error:', error)
    return []
  }
  return data || []
}

export default async function HomePage() {
  const movies = await getMovies()

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#333] tracking-tight">{String.fromCodePoint(0x6211, 0x7684, 0x7535, 0x5F71, 0x6536, 0x85CF)}</h1>
          <Link
            href="/add"
            className="bg-[#ff6b6b] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#ff5252] transition-colors"
          >
            {String.fromCodePoint(0x2795, 0x6DFB, 0x52A0, 0x7535, 0x5F71)}
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <HomeClient movies={movies} />
      </div>
    </main>
  )
}


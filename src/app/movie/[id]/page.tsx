import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import MovieDetailClient from './movie-detail-client'
import type { Metadata } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

async function getMovie(id: string) {
  if (!supabaseUrl.startsWith('http') || supabaseAnonKey.length <= 10) return null
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data } = await supabase.from('movies').select('*').eq('id', id).single()
  return data
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const movie = await getMovie(params.id)
  if (!movie) return { title: '电影未找到' }
  return {
    title: movie.title + ' - 电影收藏',
    description: movie.overview || movie.title,
    openGraph: movie.poster ? { images: [movie.poster] } : undefined,
  }
}

export default async function MovieDetailPage({ params }: { params: { id: string } }) {
  const movie = await getMovie(params.id)
  if (!movie) notFound()

  return <MovieDetailClient movie={movie} />
}

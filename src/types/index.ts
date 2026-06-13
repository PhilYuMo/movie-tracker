export interface Movie {
  id: number
  title: string
  year: number | null
  poster: string | null
  genres: string[] | null
  director: string | null
  cast: string | null
  rating: number | null
  douban_rating: number | null
  douban_url: string | null
  overview: string | null
  watch_date: string | null
  created_at: string | null
}

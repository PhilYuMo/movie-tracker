// 客户端 Supabase (用于浏览器端)
import { createClient } from '@supabase/supabase-js'

let _supabase = null

export const getSupabase = () => {
  if (_supabase) return _supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey)
  return _supabase
}

// 服务端 Supabase (用于 API 路由，使用 service_role_key 获得更高权限)
export const createSupabaseServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase server environment variables (SUPABASE_SERVICE_ROLE_KEY)')
  }

  return createClient(url, key)
}

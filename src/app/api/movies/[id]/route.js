import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: '无效的 ID' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const { error } = await supabase.from('movies').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

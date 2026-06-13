import { NextResponse } from 'next/server';
import { getAllMovies, createMovie } from '@/lib/localDb';

export async function GET() {
  try {
    var movies = getAllMovies();
    return NextResponse.json(movies);
  } catch (e) {
    console.error('GET movies error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    var data = await request.json();
    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: '片名不能为空' }, { status: 400 });
    }
    var movie = createMovie(data);
    return NextResponse.json(movie, { status: 201 });
  } catch (e) {
    console.error('POST movie error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { getSupabase } from "@/lib/supabaseClient";

const GENRE_OPTIONS = [
  "剧情","喜剧","动作","爱情","科幻","动画","悬疑","惊悚",
  "恐怖","纪录片","短片","情色","同性","音乐","歌舞","家庭",
  "儿童","传记","历史","战争","犯罪","西部","奇幻","冒险",
  "灾难","武侠","古装","运动","黑色电影",
];

const INITIAL_FORM = {
  title: "",
  year: "",
  poster: "",
  genres: [],
  director: "",
  cast: "",
  rating: "",
  douban_rating: "",
  watch_date: "",
  douban_url: "",
  overview: "",
};

export default function AddMoviePage() {
  const router = useRouter();
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (genre) => {
    setForm((prev) => {
      const exists = prev.genres.includes(genre);
      return {
        ...prev,
        genres: exists
          ? prev.genres.filter((g) => g !== genre)
          : [...prev.genres, genre],
      };
    });
  };


  // 浏览器端豆瓣解析（当服务端被屏蔽时的备用方案）
  const clientParseDouban = async (doubanUrl) => {
  try {
    var proxyUrl = 'https://api.allorigins.win/raw?url='+encodeURIComponent(doubanUrl);
    var res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if(!res.ok) return {};
    var html = await res.text();
    var r = {};
    var quotes = String.fromCharCode(0x22,0x27);
    var re = new RegExp("<meta\\s+property=["+quotes+"]og:title["+quotes+"]\\s+content=["+quotes+"]([^"+quotes+"]+)["+quotes+"]/i");
    var mt = html.match(re);
    if(mt) r.title = mt[1].trim();
    mt = html.match(/<meta\s+property=["']og:video:release_date["']\s+content=["'](\d{4})/i);
    if(mt) r.year = parseInt(mt[1]);
    mt = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if(mt) r.poster = mt[1].trim();
    mt = html.match(/<strong\s+class="ll\s+rating_num"[^>]*>([^<]+)</i);
    if(mt) r.douban_rating = parseFloat(mt[1].trim());
    mt = html.match(/\u5bfc\u6f14[^<]*<a[^>]*>([^<]+)</i);
    if(mt) r.director = mt[1].trim();
    var genres = [];
    var gRe = /<span\s+property="v:genre">([^<]+)<\/span>/gi;
    var g; while((g=gRe.exec(html))!==null) genres.push(g[1].trim());
    if(genres.length) r.genres = genres;
    var casts = [...html.matchAll(/<a\s+(?:[^>]*\s+)?rel="v:starring"[^>]*>([^<]+)<\/a>/gi)];
    if(casts.length) r.cast = casts.slice(0,5).map(function(mb){return mb[1].trim();}).join(' / ');
    mt = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if(mt) r.overview = mt[1].trim();
    return r;
  } catch(e) { return {}; }
}

  const handleAutoFill = async () => {
    const url = form.douban_url?.trim();
    if (!url) {
      toast.error("请先粘贴豆瓣链接");
      return;
    }
    setAutoFilling(true);
    const toastId = toast.loading("正在解析豆瓣页面...");
    try {
      const res = await axios.post("/api/parse-douban", { url });
      const data = res.data.data;
      if (!data.title) {
        toast.error("解析失败，请检查链接是否正确", { id: toastId });
        return;
      }
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        year: data.year ? String(data.year) : prev.year,
        poster: data.poster || prev.poster,
        genres: data.genres?.length ? data.genres : prev.genres,
        director: data.director || prev.director,
        cast: data.cast || prev.cast,
        douban_rating: data.douban_rating != null ? String(data.douban_rating) : prev.douban_rating,
        overview: data.overview || prev.overview,
        douban_url: url,
      }));
      toast.success("自动填充完成，请确认信息", { id: toastId });
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error || "解析失败，请稍后重试";
      if (data?.needClientParse) {
        try {
          const cr = await clientParseDouban(form.douban_url);
          if (cr && cr.title) {
            setForm((prev) => ({
              ...prev,
              title: cr.title || prev.title,
              year: cr.year ? String(cr.year) : prev.year,
              poster: cr.poster || prev.poster,
              genres: cr.genres?.length ? cr.genres : prev.genres,
              director: cr.director || prev.director,
              cast: cr.cast || prev.cast,
              douban_rating: cr.douban_rating != null ? String(cr.douban_rating) : prev.douban_rating,
              overview: cr.overview || prev.overview,
            }));
            toast.success("自动填充完成，请确认信息", { id: toastId });
            setAutoFilling(false);
            return;
          }
        } catch (e) {}
      }
      toast.error(msg, { id: toastId });
    } finally {
      setAutoFilling(false);
    }
  };

  const validate = () => {
    if (!form.title.trim()) {
      toast.error("请输入电影片名");
      return false;
    }
    const yearNum = parseInt(form.year, 10);
    if (form.year && (isNaN(yearNum) || yearNum < 1888 || yearNum > 2100)) {
      toast.error("年份格式不正确");
      return false;
    }
    if (form.poster && !/^https?:\/\//.test(form.poster)) {
      toast.error("海报链接格式不正确");
      return false;
    }
    const ratingNum = parseFloat(form.rating);
    if (form.rating && (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10)) {
      toast.error("个人评分应在 0-10 之间");
      return false;
    }
    const doubanNum = parseFloat(form.douban_rating);
    if (form.douban_rating && (isNaN(doubanNum) || doubanNum < 0 || doubanNum > 10)) {
      toast.error("豆瓣评分应在 0-10 之间");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const toastId = toast.loading("正在保存...");

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
      };

      const supabase = getSupabase();
      const { error } = await supabase.from("movies").insert([payload]);

      if (error) {
        if (error.code === "23505") {
          toast.error("该豆瓣电影已存在", { id: toastId });
        } else {
          toast.error("保存失败：" + error.message, { id: toastId });
        }
        setLoading(false);
        return;
      }

      toast.success("保存成功！", { id: toastId });
      setTimeout(() => router.push("/"), 800);
    } catch (e) {
      console.error("保存失败:", e);
      toast.error("保存失败，请稍后重试", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">添加电影</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 豆瓣链接 */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                豆瓣链接 <span className="text-gray-400">（粘贴后点自动填充）</span>
              </label>
              <input
                type="text"
                value={form.douban_url}
                onChange={(e) => updateField("douban_url", e.target.value)}
                placeholder="https://movie.douban.com/subject/XXXXXX/"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={autoFilling}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {autoFilling ? "解析中..." : "自动填充"}
            </button>
          </div>
          <hr className="border-gray-200" />

          {/* 片名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              片名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="请输入电影片名"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年份</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => updateField("year", e.target.value)}
                placeholder="2024"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">海报 URL</label>
              <input
                type="text"
                value={form.poster}
                onChange={(e) => updateField("poster", e.target.value)}
                placeholder="https://example.com/poster.jpg"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((genre) => {
                const selected = form.genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={
                      selected
                        ? "bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium"
                        : "bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-gray-200"
                    }
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">导演</label>
              <input
                type="text"
                value={form.director}
                onChange={(e) => updateField("director", e.target.value)}
                placeholder="导演姓名"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">主演</label>
              <input
                type="text"
                value={form.cast}
                onChange={(e) => updateField("cast", e.target.value)}
                placeholder="演员1 / 演员2 / 演员3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">个人评分（0-10）</label>
              <input
                type="number"
                step="0.1"
                value={form.rating}
                onChange={(e) => updateField("rating", e.target.value)}
                placeholder="8.5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">豆瓣评分（0-10）</label>
              <input
                type="number"
                step="0.1"
                value={form.douban_rating}
                onChange={(e) => updateField("douban_rating", e.target.value)}
                placeholder="9.2"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">观看日期</label>
            <input
              type="date"
              value={form.watch_date}
              onChange={(e) => updateField("watch_date", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
            <textarea
              rows={4}
              value={form.overview}
              onChange={(e) => updateField("overview", e.target.value)}
              placeholder="电影简介..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

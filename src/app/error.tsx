'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-6xl mb-4">{String.fromCodePoint(0x1F635)}</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">加载失败</h2>
        <p className="text-sm text-gray-400 mb-6">{error.message || '出现了一些问题'}</p>
        <button
          onClick={() => reset()}
          className="bg-[#ff6b6b] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#ff5252] transition-colors"
        >
          重试
        </button>
      </div>
    </main>
  )
}


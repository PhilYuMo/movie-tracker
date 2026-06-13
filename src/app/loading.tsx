export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="h-10 w-72 bg-gray-200 rounded-xl animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="aspect-[2/3] bg-gray-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}


'use client'

export function DecorativeCircles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Pastel Circles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-blue-300/20 rounded-full blur-xl" />
      <div className="absolute top-60 left-1/4 w-40 h-40 bg-yellow-300/20 rounded-full blur-2xl" />
      <div className="absolute top-80 right-1/3 w-28 h-28 bg-green-300/20 rounded-full blur-xl" />
      <div className="absolute bottom-40 left-20 w-36 h-36 bg-purple-300/20 rounded-full blur-2xl" />
      <div className="absolute bottom-60 right-10 w-32 h-32 bg-pink-300/20 rounded-full blur-xl" />
      <div className="absolute bottom-80 left-1/3 w-24 h-24 bg-blue-300/20 rounded-full blur-xl" />
      <div className="absolute top-1/3 right-1/4 w-44 h-44 bg-yellow-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-green-300/20 rounded-full blur-lg" />
      
      {/* Semi-circles */}
      <div className="absolute top-32 right-1/2 w-48 h-48 bg-pink-300/15 rounded-full blur-2xl" style={{ clipPath: 'circle(50% at 50% 0%)' }} />
      <div className="absolute bottom-32 left-1/4 w-56 h-56 bg-blue-300/15 rounded-full blur-2xl" style={{ clipPath: 'circle(50% at 50% 100%)' }} />
    </div>
  )
}



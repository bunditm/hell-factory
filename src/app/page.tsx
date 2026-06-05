'use client'

import dynamic from 'next/dynamic'

// Canvas rendering is client-only (uses window, requestAnimationFrame)
const OfficeCanvas = dynamic(() => import('./components/OfficeCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-400">
      <div className="text-center">
        <div className="text-2xl mb-2">Hell Factory</div>
        <div className="text-sm">Loading virtual office...</div>
      </div>
    </div>
  ),
})

export default function Home() {
  return (
    <main className="h-screen w-screen bg-slate-900 overflow-hidden">
      <OfficeCanvas />
    </main>
  )
}
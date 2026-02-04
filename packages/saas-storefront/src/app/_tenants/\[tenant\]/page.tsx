import React from 'react'

export default async function TenantPage({ params }: { params: { tenant: string } }) {
  const { tenant } = params

  // In a real app, we would fetch data from Medusa API
  const store = {
    name: tenant.charAt(0).toUpperCase() + tenant.slice(1) + " Store",
    primary_color: "#3b82f6",
    logo_url: "",
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f9fafb' }}>
      <header className="w-full p-4 flex justify-between items-center bg-white shadow-sm">
        <h1 className="text-2xl font-bold" style={{ color: store.primary_color }}>
          {store.logo_url ? <img src={store.logo_url} alt={store.name} className="h-8" /> : store.name}
        </h1>
        <div className="flex gap-4 items-center">
            <button className="text-sm border rounded px-2 py-1">EN / AR</button>
            <nav>
                <ul className="flex gap-4">
                    <li>Home</li>
                    <li>Products</li>
                </ul>
            </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-5xl font-extrabold mb-4">Welcome to {store.name}</h2>
        <p className="text-xl text-gray-600 mb-8">أهلاً بك في متجرك الجديد على منصتنا.</p>
        <div className="flex gap-4">
            <button
                className="px-8 py-3 rounded-md text-white font-semibold shadow-lg"
                style={{ backgroundColor: store.primary_color }}
            >
                Shop Now / تسوق الآن
            </button>
        </div>
      </main>
      <footer className="p-8 text-center border-t text-gray-400">
        &copy; 2024 {store.name}. Powered by Medusa Multi-tenant SaaS.
      </footer>
    </div>
  )
}

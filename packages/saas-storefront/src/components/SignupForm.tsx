"use client"

import React, { useState } from 'react'

export default function SignupForm() {
  const [formData, setFormData] = useState({
    store_name: '',
    subdomain: '',
    admin_email: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/auth/tenant/register', { // Proxied or direct to Medusa
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(`تم إنشاء متجرك بنجاح! يمكنك الآن الدخول عبر ${formData.subdomain}.saas.com`)
      } else {
        setMessage('حدث خطأ أثناء إنشاء المتجر. يرجى المحاولة مرة أخرى.')
      }
    } catch (error) {
      setMessage('فشل الاتصال بالخادم.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes('بنجاح') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">اسم المتجر</label>
        <input
          type="text"
          required
          className="w-full border rounded-lg p-2"
          placeholder="متجري المميز"
          value={formData.store_name}
          onChange={(e) => setFormData({...formData, store_name: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">الرابط المفضل (subdomain)</label>
        <div className="flex">
            <input
              type="text"
              required
              className="flex-1 border rounded-l-lg p-2"
              placeholder="my-store"
              value={formData.subdomain}
              onChange={(e) => setFormData({...formData, subdomain: e.target.value})}
            />
            <span className="bg-gray-100 border-y border-r rounded-r-lg p-2 text-gray-500">.saas.com</span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
        <input
          type="email"
          required
          className="w-full border rounded-lg p-2"
          placeholder="admin@example.com"
          value={formData.admin_email}
          onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
      >
        {loading ? 'جاري الإنشاء...' : 'أنشئ متجري الآن'}
      </button>
    </form>
  )
}

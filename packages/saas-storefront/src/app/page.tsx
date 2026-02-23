import React from 'react'
import SignupForm from '../components/SignupForm'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 text-white p-6">
      <h1 className="text-6xl font-black mb-6 text-center">بادر بإنشاء متجرك الإلكتروني اليوم</h1>
      <p className="text-2xl mb-12 text-center max-w-2xl">
        منصتنا تمنحك كل ما تحتاجه لبيع منتجاتك عالمياً وبكل سهولة. دعم كامل للغة العربية والإنجليزية.
      </p>

      <div className="bg-white text-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">ابدأ الآن مجاناً</h2>
        <SignupForm />
      </div>

      <footer className="mt-16 text-indigo-200">
        &copy; 2024 Medusa SaaS Platform. All rights reserved.
      </footer>
    </div>
  )
}

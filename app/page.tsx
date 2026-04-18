'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // 1. Validem el Codi d'Accés
    const CODI_CORRECTE = process.env.NEXT_PUBLIC_ACCESS_CODE || 'BIBLIO-CCC-2026'
    
    if (accessCode !== CODI_CORRECTE) {
      setMessage('❌ El codi d\'accés no és correcte.')
      setLoading(false)
      return
    }

    // 2. Si el codi és OK, enviem el Magic Link
    const redirectUrl = "https://biblioteca-ccc.vercel.app/auth/callback"
    
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    if (error) {
      setMessage("❌ Error: " + error.message)
    } else {
      setMessage("✅ Correu enviat! Revisa la teva bústia d'entrada.")
    }
    
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-indigo-700 mb-2">📚 Biblioteca Itinerant</h1>
        <p className="text-gray-500 mb-8">Benvingut al nostre club de lectura privat.</p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700">Codi d'Accés del Club</label>
            <input
              type="password"
              placeholder="Introdueix el codi secret"
              className="mt-1 block w-full p-3 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300 text-black"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">El teu Email</label>
            <input
              type="email"
              placeholder="exemple@email.com"
              className="mt-1 block w-full p-3 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300 text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-bold disabled:bg-gray-400"
          >
            {loading ? 'Enviant...' : 'Entrar a la Biblioteca'}
          </button>
        </form>

        {message && (
          <p className={`mt-6 text-sm font-medium ${message.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
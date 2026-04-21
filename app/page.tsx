'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInfo, setShowInfo] = useState<'none' | 'normes' | 'faq'>('none')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // 1. Validació del codi d'accés del club
    const CODI_CORRECTE = process.env.NEXT_PUBLIC_ACCESS_CODE || 'BIBLIO-CCC-2026'
    if (accessCode !== CODI_CORRECTE) {
      setMessage('❌ El codi d\'accés del club no és correcte.')
      setLoading(false)
      return
    }

    // 2. Enviament del Magic Link (OTP)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: 'https://biblioteca-ccc.vercel.app/auth/callback',
        },
      })

      if (error) {
        setMessage("❌ Error: " + error.message)
      } else {
        setMessage("✅ Enllaç enviat! Revisa el teu correu electrònic (mira també a Spam).")
      }
    } catch (err) {
      setMessage("❌ Hi ha hagut un error inesperat en connectar amb el servidor.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 font-sans">
      
      {/* CARD DE LOGIN */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 max-w-sm w-full text-center">
        <div className="mb-8">
          <span className="text-4xl mb-3 block">📩</span>
          <h1 className="text-2xl font-black text-indigo-700 tracking-tight">Biblioteca CCC</h1>
          
          {/* EXPLICACIÓ DEL FUNCIONAMENT */}
          <div className="mt-4 space-y-3">
            <p className="text-gray-600 text-sm leading-relaxed px-2">
              Introdueix el teu correu i el codi secret per accedir.
            </p>
            <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
              <p className="text-[11px] text-indigo-700 font-semibold leading-snug">
                T'enviarem un <b>enllaç d'accés directe</b> al teu email. No necessites contrasenya!
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Codi del Club</label>
            <input
              type="password"
              placeholder="Codi secret del club"
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-black"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">El teu Email</label>
            <input
              type="email"
              placeholder="nom@exemple.com"
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none mt-2"
          >
            {loading ? 'Enviant...' : 'Rebre enllaç d\'accés'}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-2xl text-[11px] font-bold leading-relaxed animate-in fade-in slide-in-from-top-1 ${message.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}
      </div>

      {/* SECCIÓ D'INFORMACIÓ (MIX NORMES I FAQ) */}
      <div className="w-full max-w-sm mt-8">
        <div className="flex justify-center gap-8 mb-4">
          <button 
            onClick={() => setShowInfo(showInfo === 'normes' ? 'none' : 'normes')}
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${showInfo === 'normes' ? 'text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
          >
            📜 Normes
          </button>
          <button 
            onClick={() => setShowInfo(showInfo === 'faq' ? 'none' : 'faq')}
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${showInfo === 'faq' ? 'text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
          >
            ❓ Preguntes
          </button>
        </div>

        {showInfo !== 'none' && (
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm animate-in fade-in zoom-in duration-200 mb-10">
            {showInfo === 'normes' ? (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-800 text-sm">Normes del Club</h3>
                <ul className="text-xs text-gray-500 space-y-2 leading-relaxed">
                  <li className="flex gap-2"><span>•</span> Màxim 2 llibres en préstec simultani per persona.</li>
                  <li className="flex gap-2"><span>•</span> El temps de lectura és flexible, però sigues considerat.</li>
                  <li className="flex gap-2"><span>•</span> Cuida el llibre; si es malmet, parla amb el propietari.</li>
                  <li className="flex gap-2"><span>•</span> En cas de cua, es demanarà retornar el llibre en 7 dies.</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-sm">Preguntes Freqüents</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-tighter">Per què necessiteu el meu correu?</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                      L'utilitzem per identificar-te i perquè els altres membres puguin <b>contactar amb tu</b> (per email) quan hagis de lliurar o recollir un llibre. No t'enviarem mai publicitat.
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-tighter">Com funciona el préstec?</p>
                    <p className="text-[10px] text-gray-500">Demanas el llibre i t'has de posar en contacte amb el posseïdor actual.</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-tighter">No m'arriba el correu?</p>
                    <p className="text-[10px] text-gray-500">Revisa la carpeta de Spam o correu brossa.</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-tighter">No puc entrar o tinc dubtes?</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                      Pots contactar amb nosaltres directament a: <br/>
                      <a href="mailto:bibliotecacccolonia@gmail.com" className="font-bold text-indigo-600 underline hover:text-indigo-800 transition-colors">
                        bibliotecacccolonia@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
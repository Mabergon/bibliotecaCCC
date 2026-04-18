'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminPanel() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminAndGetLogs = async () => {
      setLoading(true)
      
      // 1. Obtenim l'usuari actual
      const { data: { user } } = await supabase.auth.getUser()

      // 🛡️ SEGURETAT: Només tu pots entrar (canvia l'email si cal)
      if (!user || user.email !== 'darumba@gmail.com') {
        window.location.href = '/' // Expulsa si no ets l'admin
        return
      }

      setIsAdmin(true)

      // 2. Si ets admin, demanem els logs
      const { data, error } = await supabase
        .from('historial')
        .select('*')
        .order('creat_at', { ascending: false })

      if (error) {
        console.error("Error carregant logs:", error.message)
      } else {
        setLogs(data || [])
      }
      setLoading(false)
    }

    checkAdminAndGetLogs()
  }, [])

  // Si encara està carregant o no és admin, no mostrem res (evita flaixos de contingut)
  if (loading && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-indigo-600 font-bold animate-pulse text-xs uppercase tracking-widest">
          Verificant credencials... 🛡️
        </p>
      </div>
    )
  }

  return (
    <main className="max-w-5xl mx-auto p-6 md:p-10 bg-gray-50 min-h-screen font-sans">
      
      {/* HEADER DEL PANELL */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-indigo-900 flex items-center gap-2">
            Admin Panel 🛡️
          </h1>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-black mt-1">
            Historial d'activitat de la biblioteca
          </p>
        </div>

        {/* BOTÓ TORNAR (Força la navegació al Dashboard) */}
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
        >
          <span>←</span> DASHBOARD
        </button>
      </header>

      {/* TAULA DE REGISTRES */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-widest">
                <th className="p-6">Data i Hora</th>
                <th className="p-6">Acció</th>
                <th className="p-6">Usuari</th>
                <th className="p-6">Detall de l'activitat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-gray-400 italic">
                    No s'ha trobat cap registre d'activitat encara.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="p-6 text-[11px] text-gray-400 font-mono">
                      {new Date(log.creat_at).toLocaleDateString('ca-ES')} 
                      <span className="block opacity-60">
                        {new Date(log.creat_at).toLocaleTimeString('ca-ES', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                        log.accio === 'ESBORRAMENT' ? 'bg-red-100 text-red-600' : 
                        log.accio === 'CREACIÓ' ? 'bg-green-100 text-green-600' :
                        log.accio === 'DEVOLUCIÓ' ? 'bg-orange-100 text-orange-600' :
                        'bg-indigo-100 text-indigo-600'
                      }`}>
                        {log.accio}
                      </span>
                    </td>
                    <td className="p-6">
                      <p className="font-bold text-gray-800 text-sm">{log.usuari_nom}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[120px]">ID: {log.user_id?.slice(0,8)}...</p>
                    </td>
                    <td className="p-6">
                      <p className="text-gray-600 text-sm leading-relaxed font-medium">
                        {log.detall}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="mt-8 text-center">
        <p className="text-gray-300 text-[10px] uppercase font-bold tracking-widest">
          Sistema de logs automàtic • Supabase Database
        </p>
      </footer>
    </main>
  )
}
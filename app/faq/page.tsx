'use client'
import Link from 'next/link'

export default function FAQ() {
  return (
    <div className="max-w-2xl mx-auto p-10 font-sans min-h-screen bg-white">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-indigo-900 mb-2">Preguntes Freqüents</h1>
        <p className="text-gray-400 uppercase text-xs font-bold tracking-widest">Tot el que has de saber 📚</p>
      </header>

      <div className="space-y-8">
        <section>
          <h3 className="font-bold text-lg text-gray-800 mb-2">Com funciona el sistema de cua?</h3>
          <p className="text-gray-600 leading-relaxed">
            Si un llibre que t'interessa ja està prestat, pots clicar a <strong>"Posar-me en cua"</strong>. 
            Quan el posseïdor actual el retorni, el sistema et marcarà a tu automàticament com la persona que el té 
            <strong> "Demanat"</strong>.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-lg text-gray-800 mb-2">Què és l'estat "Demanat"?</h3>
          <p className="text-gray-600 leading-relaxed">
            És un pas intermedi. Significa que el llibre t'està esperant. Un cop el tinguis físicament a les mans, 
            has de clicar a <strong>"Confirmar Recollida"</strong> perquè tothom sàpiga que ja el tens tu.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-lg text-gray-800 mb-2">Puc eliminar llibres?</h3>
          <p className="text-gray-600 leading-relaxed">
            Només si ets el <strong>propietari</strong> (qui el va afegir originalment). 
            Veuràs una icona de paperera 🗑️ a la fitxa del llibre si és teu.
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-100">
        {/* Fem servir Link de Next.js per a una navegació instantània */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
        >
          <span>←</span> Tornar a la biblioteca
        </Link>
      </div>
    </div>
  )
}
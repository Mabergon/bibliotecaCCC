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
          <h3 className="font-bold text-lg text-gray-800 mb-2">Com funciona el préstec?</h3>
          <p className="text-gray-600 leading-relaxed">
            Has de demanar el llibre i tot seguit posar-te en contacte amb la persona que el té en prèstec.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-lg text-gray-800 mb-2">Com funciona "posar-me en cua" ?</h3>
          <p className="text-gray-600 leading-relaxed">
            Si un llibre que t'interessa ja està en prèstec, pots clicar a <strong>"Posar-me en cua"</strong>. 
            Quan la persona que el té ja l'ha llegit i el marca com a retornat, el sistema et marcarà a tu automàticament com la persona que el té 
            <strong> "Demanat"</strong>.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-lg text-gray-800 mb-2">Què vol dir l'estat "Demanat"?</h3>
          <p className="text-gray-600 leading-relaxed">
            És un pas intermedi. Vol dir que el llibre t'està esperant: un cop el tinguis físicament a les mans, 
            has de clicar a <strong>"Confirmar Recollida"</strong> perquè tothom sàpiga que ja el tens tu.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-lg text-gray-800 mb-2">Puc afegir llibres a la biblioteca?</h3>
          <p className="text-gray-600 leading-relaxed">
            Sí, tothom pot afegir llibres. Només has d'omplir el formulari.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-lg text-gray-800 mb-2">Puc eliminar llibres de la biblioteca?</h3>
          <p className="text-gray-600 leading-relaxed">
            Només si ets el <strong>propietari</strong> (qui el va afegir originalment). En aquest cas, t'apareixerà l'opció de <strong>"Eliminar"</strong> a la fitxa del llibre.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-lg text-gray-800 mb-2">No m'arriba cap correu, perquè?</h3>
          <p className="text-gray-600 leading-relaxed">
            Revisa la carpeta de Spam o correu brossa.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-lg text-gray-800 mb-2">No puc entrar o tinc dubtes?</h3>
          <p className="text-gray-600 leading-relaxed">
            Pots contactar amb nosaltres directament a:
          </p>
          <a href="mailto:bibliotecacccolonia@gmail.com" className="text-indigo-600 hover:underline">
            bibliotecacccolonia@gmail.com
          </a>
         
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
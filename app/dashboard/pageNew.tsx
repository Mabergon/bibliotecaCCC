'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import FormulariLlibre from './formulari-llibre'
import { useRouter } from 'next/navigation'

// --- INTERFÍCIE DE DADES ---
interface Llibre {
  id: string
  titol: string
  autor: string
  estat: string
  propietari_id: string
  posseidor_id?: string
  reserva_id?: string
  propietari?: { nom: string; email: string }
  posseidor?: { nom: string; email: string }
  reservat_per?: { nom: string; email: string }
}

export default function Biblioteca() {
  const router = useRouter()
  // --- ESTATS ---
  const [llibres, setLlibres] = useState<Llibre[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [nouNom, setNouNom] = useState('')
  const [busqueda, setBusqueda] = useState('') 
  const [filtres, setFiltres] = useState<string[]>(['meus', 'disponibles', 'altres'])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const colorsEstats: Record<string, string> = {
    disponible: "bg-green-100 text-green-700 border-green-200",
    demanat: "bg-blue-100 text-blue-700 border-blue-200",
    prestat: "bg-orange-100 text-orange-700 border-orange-200",
  };

  // --- CÀRREGA DE DADES ---
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setCurrentUser(user)
      getLlibres()
    }
    fetchInitialData()
  }, [router])

  async function getLlibres() {
    setLoading(true)
    const { data, error } = await supabase
      .from('llibres')
      .select(`
        *,
        propietari:perfils!propietari_id(nom, email),
        posseidor:perfils!posseidor_id(nom, email),
        reservat_per:perfils!reserva_id(nom, email)
      `)
    if (error) console.error("Error:", error.message)
    else setLlibres(data || [])
    setLoading(false)
  }

  // --- SISTEMA DE LOGS ---
  const registrarActivitat = async (accio: string, detall: string) => {
    try {
      await supabase.from('historial').insert([
        { 
          user_id: currentUser?.id, 
          usuari_nom: nouNom || currentUser?.email || 'Usuari', 
          accio: accio, 
          detall: detall 
        }
      ]);
    } catch (err) { console.error("Log error:", err); }
  };

  // --- ACCIONS DE LLIBRES ---
  const gestionarAccioLlibre = async (llibre: Llibre) => {
    if (!currentUser) return;
    const esMeuPosseidor = llibre.posseidor_id === currentUser.id;
    const quiHoFa = nouNom || currentUser?.email || 'Un usuari';

    try {
      let updateData = {};
      let accioNom = "";

      if (llibre.estat === 'disponible') {
        updateData = { estat: 'demanat', posseidor_id: currentUser.id };
        accioNom = "DEMANDA";
      } else if (llibre.estat === 'demanat' && esMeuPosseidor) {
        updateData = { estat: 'prestat' };
        accioNom = "CONFIRMACIÓ";
      } else if (llibre.estat === 'prestat' && esMeuPosseidor) {
        updateData = { estat: 'disponible', posseidor_id: null, reserva_id: null };
        accioNom = "DEVOLUCIÓ";
      } else if (llibre.estat === 'prestat' && !esMeuPosseidor && !llibre.reserva_id) {
        updateData = { reserva_id: currentUser.id };
        accioNom = "RESERVA";
      }

      if (accioNom) {
        const { error } = await supabase.from('llibres').update(updateData).eq('id', llibre.id);
        if (!error) {
          await registrarActivitat(accioNom, `${llibre.titol}`);
          await enviarEmail(llibre, accioNom, quiHoFa);
          getLlibres();
        }
      }
    } catch (err) { console.error(err); }
  };

  const enviarEmail = async (llibre: Llibre, tipus: string, nomSolicitant: string) => {
    const emailPropietari = llibre.propietari?.email;
    if (!emailPropietari) return;

    await supabase.functions.invoke('enviar-notificacio', {
        body: {
          email_propietari: emailPropietari,
          nom_propietari: llibre.propietari?.nom || 'Propietari',
          titol_llibre: llibre.titol,
          nom_solicitant: nomSolicitant,
          tipus: tipus,
        },
    });
  };

  const eliminarLlibre = async (llibre: Llibre) => {
    if (!window.confirm(`Segur que vols eliminar "${llibre.titol}"?`)) return;
    const { error } = await supabase.from('llibres').delete().eq('id', llibre.id);
    if (!error) {
      await registrarActivitat('ESBORRAMENT', llibre.titol);
      getLlibres();
    }
  };

  async function actualitzarNom() {
    if (!nouNom || !currentUser) return;
    const { error } = await supabase.from('perfils').update({ nom: nouNom }).eq('id', currentUser.id);
    if (!error) { alert("Nom actualitzat!"); getLlibres(); }
  }

  // --- FILTRATGE ---
  const counts = {
    TOTS: llibres.length,
    DISPONIBLES: llibres.filter(l => l.estat === 'disponible').length,
    PRESTATS: llibres.filter(l => l.estat === 'prestat' || l.estat === 'demanat').length,
    MEUS: llibres.filter(l => l.propietari_id === currentUser?.id).length,
  };

  const llibresFiltrats = llibres.filter(llibre => {
    const coincideixBusqueda = llibre.titol.toLowerCase().includes(busqueda.toLowerCase()) || 
                                llibre.autor.toLowerCase().includes(busqueda.toLowerCase());
    if (!coincideixBusqueda) return false;

    const esMeu = llibre.propietari_id === currentUser?.id;
    const esDisponible = llibre.estat === 'disponible';
    const esPrestatODemanat = llibre.estat === 'prestat' || llibre.estat === 'demanat';

    if (filtres.includes('meus') && esMeu) return true;
    if (filtres.includes('disponibles') && esDisponible) return true;
    if (filtres.includes('altres') && esPrestatODemanat) return true;
    return false;
  });

  const toggleFiltre = (id: string) => {
    setFiltres(prev => {
      if (prev.length === 3) return [id];
      const existeix = prev.includes(id);
      const nouEstat = existeix ? prev.filter(f => f !== id) : [...prev, id];
      return nouEstat.length === 0 ? ['meus', 'disponibles', 'altres'] : nouEstat;
    });
  };

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen pb-20 font-sans">
      
      {/* HEADER RESPONSIVE */}
      <header className="w-full mb-6 pt-4 flex flex-col items-center">
        <div className="flex flex-wrap items-center justify-center gap-3 bg-white p-3 px-4 rounded-2xl shadow-sm border border-gray-100 w-full max-w-2xl">
          <div className="flex items-center gap-2 border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0 md:pr-4 w-full md:w-auto justify-center">
            <input 
              type="text" placeholder="El teu nom..." 
              className="text-base md:text-xs p-2 outline-none w-32 bg-transparent"
              onChange={(e) => setNouNom(e.target.value)}
            />
            <button onClick={actualitzarNom} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95">Set ⚙️</button>
          </div>
          <div className="flex items-center gap-4">
            <details className="group relative">
              <summary className="list-none cursor-pointer text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-600">📜 Normes</summary>
              <div className="absolute z-50 mt-4 p-4 bg-white border border-gray-100 shadow-2xl rounded-2xl text-xs text-gray-600 w-56 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0">
                <ul className="space-y-2 list-disc pl-3">
                  <li>Retorna els llibres a temps.</li>
                  <li>Cuida el material.</li>
                  <li>Màxim 1 reserva activa.</li>
                </ul>
              </div>
            </details>
            <Link href="/faq" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">FAQ ❓</Link>
            {currentUser?.email === 'bibliotecacccolonia@gmail.com' && (
              <Link href="/admin" className="text-[10px] font-black text-indigo-600 pl-4 border-l border-gray-200">Admin 🛡️</Link>
            )}
          </div>
        </div>
      </header>

      <h1 className="text-4xl md:text-6xl font-black text-indigo-900 text-center mb-8 tracking-tight px-4">Biblioteca 📚</h1>

      {/* CERCADOR + BOTÓ NOU */}
      <div className="max-w-2xl mx-auto mb-8 px-2">
        <div className="flex flex-col md:flex-row gap-3 bg-transparent md:bg-white md:p-2 md:rounded-3xl md:shadow-xl border-gray-100">
          <div className="flex-grow flex items-center bg-white p-1 rounded-2xl shadow-md md:shadow-none border md:border-none px-4">
            <span className="text-gray-400">🔍</span>
            <input
              type="text" placeholder="Títol o autor..."
              className="w-full pl-3 py-4 md:py-3 outline-none bg-transparent text-base md:text-lg"
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold shadow-md active:scale-95 transition-all"
          >
            <span className="text-xl">+</span> <span>Nou Llibre</span>
          </button>
        </div>
      </div>

      <FormulariLlibre 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLlibreAfegit={() => { getLlibres(); setIsModalOpen(false); }}
        registrarActivitat={registrarActivitat}
      />

      {/* FILTRES RESPONSIVE (Scroll horitzontal en mòbil) */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0">
        <button
            onClick={() => setFiltres(['meus', 'disponibles', 'altres'])}
            className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${filtres.length === 3 ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'}`}
        >
            Tots ({counts.TOTS})
        </button>
        {/* Botons dinàmics per a "Els meus", "Disponibles", etc. igual que abans */}
        {['meus', 'disponibles', 'altres'].map((fId) => {
            const label = fId === 'meus' ? 'Els meus' : fId === 'disponibles' ? 'Disponibles' : 'Prestats';
            const count = fId === 'meus' ? counts.MEUS : fId === 'disponibles' ? counts.DISPONIBLES : counts.PRESTATS;
            const isActiu = filtres.includes(fId) && filtres.length < 3;
            return (
              <button
                key={fId}
                onClick={() => toggleFiltre(fId)}
                className={`px-5 py-2.5 rounded-full flex items-center gap-2 whitespace-nowrap transition-all border ${isActiu ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-500 border-gray-200'}`}
              >
                <span className="font-bold text-sm">{label}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-black/10">{count}</span>
              </button>
            )
        })}
      </div>

      {/* LLISTAT DE FITXES EN GRID (1 en mòbil, 2 en PC) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {loading ? (
          <p className="col-span-full text-center py-20 text-gray-400 animate-pulse">Llegint prestatgeries...</p>
        ) : llibresFiltrats.length === 0 ? (
          <p className="col-span-full text-center py-20 text-gray-400 italic">Cap llibre trobat.</p>
        ) : llibresFiltrats.map((llibre) => {
          const esMeuPos = llibre.posseidor_id === currentUser?.id;
          let tBoto = "Demanar llibre", cBoto = "bg-indigo-600", disabled = false;

          if (llibre.estat === 'demanat') {
            tBoto = esMeuPos ? "✅ Confirmar Recollida" : `⏳ Pendent de ${llibre.posseidor?.nom}`;
            cBoto = esMeuPos ? "bg-green-600" : "bg-gray-200 text-gray-400";
            disabled = !esMeuPos;
          } else if (llibre.estat === 'prestat') {
            tBoto = esMeuPos ? "📤 Retornar" : (llibre.reserva_id ? "🚫 Reservat" : "🕒 Cua de reserva");
            cBoto = esMeuPos ? "bg-orange-500" : (llibre.reserva_id ? "bg-gray-200 text-gray-400" : "bg-amber-500");
            disabled = !esMeuPos && !!llibre.reserva_id;
          }

          return (
            <div key={llibre.id} className={`p-5 md:p-6 rounded-[2rem] shadow-sm border transition-all ${llibre.propietari_id === currentUser?.id ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${colorsEstats[llibre.estat] || "bg-gray-100"}`}>{llibre.estat}</span>
                {llibre.posseidor_id === currentUser?.id && llibre.propietari_id !== currentUser?.id && (
                  <span className="text-[9px] font-black uppercase px-2 py-1 bg-red-600 text-white rounded-lg animate-pulse">TU EL TENS 📖</span>
                )}
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 leading-tight">{llibre.titol}</h3>
                <p className="text-gray-400 italic text-sm">{llibre.autor}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl text-[11px] space-y-2 mb-6 border border-black/5">
                <p className="flex justify-between"><span>🏠 Propietari</span><span className="font-bold">{llibre.propietari?.nom || 'Anònim'}</span></p>
                {llibre.posseidor?.nom && <p className="flex justify-between text-indigo-600"><span>👤 El té</span><span className="font-bold">{llibre.posseidor?.nom}</span></p>}
              </div>

              <div className="flex gap-2">
                <button disabled={disabled} onClick={() => gestionarAccioLlibre(llibre)} className={`flex-grow py-4 rounded-2xl font-bold text-white shadow-sm active:scale-95 transition-all ${cBoto} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>{tBoto}</button>
                {currentUser?.id === llibre.propietari_id && (
                  <button onClick={() => eliminarLlibre(llibre)} className="px-4 py-4 bg-white text-red-500 rounded-2xl border border-red-100 active:scale-95">🗑️</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
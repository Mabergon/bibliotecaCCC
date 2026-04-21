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
  sollicitant_email?: string | null
}

export default function Biblioteca() {
  // --- ESTATS ---
  const [llibres, setLlibres] = useState<Llibre[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [nouNom, setNouNom] = useState('')
  const [busqueda, setBusqueda] = useState('') 
  const [filtres, setFiltres] = useState<string[]>(['meus', 'disponibles', 'altres'])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // --- LÒGICA DE FILTRES (MULTISELECCIÓ) ---
  const toggleFiltre = (id: string) => {
    setFiltres(prev => {
      // Si el botó clicat ja està actiu i n'hi ha més d'un, el treiem.
      // Si és l'últim que queda o si venim de "Tots", aïllem el clicat.
      if (prev.length === 3) return [id];
      const existeix = prev.includes(id);
      const nouEstat = existeix ? prev.filter(f => f !== id) : [...prev, id];
      return nouEstat.length === 0 ? ['meus', 'disponibles', 'altres'] : nouEstat;
    });
  };

  const seleccionarTots = () => setFiltres(['meus', 'disponibles', 'altres']);
  const colorsEstats: Record<string, string> = {
    disponible: "bg-green-100 text-green-700 border-green-200",
    demanat: "bg-blue-100 text-blue-700 border-blue-200",
    prestat: "bg-orange-100 text-orange-700 border-orange-200",
    // Pots afegir més estats si en tens (ex: reserva, perdut, etc.)
    };
  // --- CÀRREGA DE DADES ---
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      getLlibres()
    }
    fetchInitialData()
  }, [])

  async function getLlibres() {
    setLoading(true)
    const { data, error } = await supabase
      .from('llibres')
      .select(`
        *,
        propietari:perfils!propietari_id(nom, email),
        sollicitant_email,
        posseidor:perfils!posseidor_id(nom, email),
        reservat_per:perfils!reserva_id(nom, email)
      `)
    if (error) console.error("Error:", error.message)
    else setLlibres(data || [])
    setLoading(false)
  }
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // 1. Agafem la sessió actual al carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
      if (session?.user) setCurrentUser(session.user);
    });

    // 2. Escoltem si la sessió canvia (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      if (session?.user) setCurrentUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- SISTEMA DE LOGS ---
  const registrarActivitat = async (accio: string, detall: string) => {
    try {
      const { error } = await supabase.from('historial').insert([
        { 
          user_id: currentUser?.id, 
          usuari_nom: nouNom || currentUser?.email || 'Usuari', 
          accio: accio, 
          detall: detall 
        }
      ]);
      if (error) console.error("Error Log:", error.message);
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
        updateData = { estat: 'demanat', posseidor_id: currentUser.id, sollicitant_email: userEmail};
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

  const cancelarPeticio = async (llibreId: string) => {
    try {
      const { error } = await supabase
        .from('llibres')
        .update({ 
          estat: 'disponible', 
          sollicitant_email: null // Esborrem qui l'havia demanat
        })
        .eq('id', llibreId);

      if (error) throw error;
      
      // Actualitzem l'estat local perquè la interfície canviï a l'instant
      setLlibres(llibres.map(llibre => 
        llibre.id === llibreId 
          ? { ...llibre, estat: 'disponible', sollicitant_email: null } 
          : llibre
      ));
      
      alert('Peticion cancel·lada correctament.');
    } catch (error) {
        console.error('Error al cancel·lar:', error);
        alert('No s\'ha pogut cancel·lar la petició.');
    }
  }; 

  const eliminarLlibre = async (llibre: Llibre) => {
    if (!window.confirm(`Segur que vols eliminar "${llibre.titol}"?`)) return;
    const { error } = await supabase.from('llibres').delete().eq('id', llibre.id);
    if (!error) {
      await registrarActivitat('ESBORRAMENT', llibre.titol);
      getLlibres();
    }
  };

    const enviarEmail = async (llibre: Llibre, tipus: string, nomSolicitant: string) => {
    // Verifiquem si tenim l'email del propietari
    const emailPropietari = llibre.propietari?.email;

    if (!emailPropietari) {
        console.warn("No s'ha pogut enviar el mail: falta l'email del propietari.");
        return;
    }

    const { data, error } = await supabase.functions.invoke('enviar-notificacio', {
        body: {
        email_propietari: emailPropietari, // Sempre enviem el correu de l'amo
        nom_propietari: llibre.propietari?.nom || 'Propietari',
        titol_llibre: llibre.titol,
        nom_solicitant: nomSolicitant,
        tipus: tipus,
        // Si vols enviar còpia a qui té el llibre actualment (opcional):
        email_posseidor: llibre.posseidor?.email 
        },
    });

    if (error) console.error("Error Edge Function:", error.message);
    };

  async function actualitzarNom() {
    if (!nouNom || !currentUser) return;
    const { error } = await supabase.from('perfils').update({ nom: nouNom }).eq('id', currentUser.id);
    if (!error) { alert("Nom actualitzat!"); getLlibres(); }
  }

  // --- CÀLCUL DE COMPTADORS I FILTRATGE ---
  const counts = {
    TOTS: llibres.length,
    DISPONIBLES: llibres.filter(l => l.estat === 'disponible').length,
    PRESTATS: llibres.filter(l => l.estat === 'prestat' || l.estat === 'demanat').length,
    MEUS: llibres.filter(l => l.propietari_id === currentUser?.id).length,
  };

    const llibresFiltrats = llibres.filter(llibre => {
    // 1. Filtre de cerca per text
    const coincideixBusqueda = llibre.titol.toLowerCase().includes(busqueda.toLowerCase()) || 
                                llibre.autor.toLowerCase().includes(busqueda.toLowerCase());
    if (!coincideixBusqueda) return false;

    // 2. Definició de categories per als botons
    const esMeu = llibre.propietari_id === currentUser?.id;
    const esDisponible = llibre.estat === 'disponible';
    // ARA: "Altres" inclou qualsevol que no estigui disponible (estigui prestat o demanat)
    const esPrestatODemanat = llibre.estat === 'prestat' || llibre.estat === 'demanat';

    if (filtres.includes('meus') && esMeu) return true;
    if (filtres.includes('disponibles') && esDisponible) return true;
    if (filtres.includes('altres') && esPrestatODemanat) return true;

    return false;
    });

  return (
    <main className="w-full max-w-4xl mx-auto p-3 md:p-6 bg-gray-50 min-h-screen pb-20 font-sans">
      
      {/* HEADER */}
      <header className="w-full mb-6 pt-4 flex flex-col items-center">
        <div className="flex flex-wrap items-center justify-center gap-3 bg-white p-3 px-4 rounded-2xl shadow-sm border border-gray-100 w-full max-w-2xl">
          <div className="flex items-center gap-2 border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0 md:pr-4 w-full md:w-auto justify-center">
            <input 
              type="text" placeholder="El teu nom..." 
              className="text-base md:text-xs p-2 outline-none w-32 bg-transparent"
              onChange={(e) => setNouNom(e.target.value)}
            />
            <button onClick={actualitzarNom} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all active:scale-95">Set ⚙️</button>
          </div>
          <details className="group relative border-r border-gray-100 pr-4">
            <summary className="list-none cursor-pointer text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-600 flex items-center gap-1">
              <span>📜 Normes</span>
            </summary>
            <div className="absolute z-50 mt-4 p-4 bg-white border border-gray-100 shadow-2xl rounded-2xl text-xs text-gray-600 w-56 left-0 animate-in fade-in zoom-in duration-200">
              <ul className="space-y-2 list-disc pl-3">
                <li>Retorna els llibres a temps.</li>
                <li>Cuida el material.</li>
                <li>Màxim 1 reserva activa.</li>
              </ul>
            </div>
          </details>
          <Link href="/faq" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-600">FAQ ❓</Link>
          {currentUser?.email === 'bibliotecacccolonia@gmail.com' && (
            <Link href="/admin" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 border-l border-gray-200 pl-4">Admin 🛡️</Link>
          )}
        </div>
      </header>

      <div className="flex flex-col items-center justify-center py-6">
        {/* LOGO SVG ELABORAT */}
        <svg 
          width="120" 
          height="80" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Ombra/Cos del llibre */}
          <path 
            d="M12 21C12 21 10 19 4 19H2V5C2 5 4 5 10 7C11.3333 7.4 12 8 12 8C12 8 12.6667 7.4 14 7C20 5 22 5 22 5V19H20C14 19 12 21 12 21Z" 
            fill="#4F46E5" 
            fillOpacity="0.1" 
            stroke="#4338CA" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Detalls de les pàgines (línies internes) */}
          <path d="M12 8V21" stroke="#4338CA" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5 10H9" stroke="#4338CA" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
          <path d="M5 13H9" stroke="#4338CA" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
          <path d="M15 10H19" stroke="#4338CA" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
          <path d="M15 13H19" stroke="#4338CA" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
          {/* Coberta exterior */}
          <path 
            d="M12 8C12 8 12.6667 7.4 14 7C20 5 22 5 22 5V17C22 17 20 17 14 19C12.6667 19.4 12 20 12 20" 
            stroke="#4338CA" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M12 8C12 8 11.3333 7.4 10 7C4 5 2 5 2 5V17C2 17 4 17 10 19C11.3333 19.4 12 20 12 20" 
            stroke="#4338CA" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>

        {/* TEXT DEL LOGO */}
        <h1 className="text-3xl font-black text-indigo-700 tracking-[0.15em] uppercase mt-4">
          Biblioteca
        </h1>
        <div className="h-1 w-12 bg-indigo-600 rounded-full mt-1 opacity-20"></div>
      </div>

      {/* CERCADOR + BOTÓ NOU (MODAL) */}
      <div className="w-full mb-8">
        <div className="flex flex-col md:flex-row gap-3 bg-white p-2 rounded-2xl shadow-md border border-gray-100 mx-1">
          <div className="flex-grow relative flex items-center pl-4">
            <span className="text-gray-400">🔍</span>
            <input
              type="text" placeholder="Busca títol o autor..."
              className="w-full pl-3 pr-4 py-3 outline-none bg-transparent text-lg"
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white flex items-center gap-2 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95"
          >
            <span className="text-xl">+</span> <span className="hidden md:inline">Nou Llibre</span>
          </button>
        </div>
      </div>

      <FormulariLlibre 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLlibreAfegit={() => { getLlibres(); setIsModalOpen(false); }}
        registrarActivitat={registrarActivitat}
      />

      <div className="flex gap-2 mb-6 px-1">
        <button 
          onClick={() => setViewMode('grid')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm
            ${viewMode === 'grid' 
              ? 'bg-blue-600 text-white ring-2 ring-blue-100' 
              : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'}`}
        >
          <span>🔳</span> Format Fitxa
        </button>
        
        <button 
          onClick={() => setViewMode('list')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm
            ${viewMode === 'list' 
              ? 'bg-blue-600 text-white ring-2 ring-blue-100' 
              : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'}`}
        >
          <span>≡</span> Format Llista
        </button>
      </div>
      {/* FILTRES AMB COLORS ESPECÍFICS PER A CADA CATEGORIA */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
        {/* Botó TOTS */}
        <button
            onClick={seleccionarTots}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
            filtres.length === 3 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'bg-white text-gray-400 border border-gray-200'
            }`}
        >
            Tots ({counts.TOTS})
        </button>

        {[
            { 
            id: 'meus', 
            label: 'Els meus', 
            count: counts.MEUS, 
            activeClass: 'bg-red-500 text-white shadow-red-200', 
            badgeClass: 'bg-red-100 text-red-600' 
            },
            { 
            id: 'disponibles', 
            label: 'Disponibles', 
            count: counts.DISPONIBLES, 
            activeClass: 'bg-green-600 text-white shadow-green-200', 
            badgeClass: 'bg-green-100 text-green-700' 
            },
            { 
            id: 'altres', 
            label: 'Prestats', 
            count: counts.PRESTATS, 
            activeClass: 'bg-orange-500 text-white shadow-orange-200', 
            badgeClass: 'bg-orange-100 text-orange-600' 
            },
        ].map((f) => {
            const isActiu = filtres.includes(f.id) && filtres.length < 3;
            return (
            <button
                key={f.id}
                onClick={() => toggleFiltre(f.id)}
                className={`px-5 py-2.5 rounded-full flex items-center gap-3 whitespace-nowrap transition-all duration-300 border ${
                isActiu 
                ? `${f.activeClass} border-transparent shadow-lg scale-105` 
                : `bg-white text-gray-500 border-gray-200 hover:border-gray-300`
                }`}
            >
                <span className="font-bold text-sm">{f.label}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md transition-colors ${
                isActiu 
                ? 'bg-white/25 text-white' 
                : f.badgeClass
                }`}>
                {f.count}
                </span>
            </button>
            )
        })}
        </div>

      {/* LLISTAT DE FITXES */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4 w-full" : "flex flex-col gap-2 w-full"}>
        {loading ? (
          <p className="col-span-full text-center py-20 text-gray-400 font-medium">Actualitzant prestatgeria...</p>
        ) : llibresFiltrats.length === 0 ? (
          <p className="col-span-full text-center py-20 text-gray-400 italic">No s'han trobat llibres amb aquesta selecció.</p>
        ) : llibresFiltrats.map((llibre) => {
          const esMeuPos = llibre.posseidor_id === currentUser?.id;
          let tBoto = "Demanar llibre", cBoto = "bg-indigo-600", desc = false;
          let disabled = false;

          if (llibre.estat === 'demanat') {
            tBoto = esMeuPos ? "✅ Confirmar Recollida" : `⏳ Pendent de ${llibre.posseidor?.nom}`;
            cBoto = esMeuPos ? "bg-green-600 hover:bg-green-700" : "bg-gray-200 text-gray-500";
            desc = !esMeuPos;
          } else if (llibre.estat === 'prestat') {
            tBoto = esMeuPos ? "📤 Retornar llibre" : (llibre.reserva_id ? "🚫 Cua Plena" : "🕒 Posar-me en cua");
            cBoto = esMeuPos ? "bg-orange-500 hover:bg-orange-600" : (llibre.reserva_id ? "bg-gray-200 text-gray-500" : "bg-amber-500 hover:bg-amber-600");
            desc = !esMeuPos && !!llibre.reserva_id;
          }

          return (
            viewMode === 'grid' ? (
            // --- MODE FITXA (El que ja tens) ---
            <div key={llibre.id} className={`w-full p-4 md:p-6 rounded-[1.5rem] shadow-sm border transition-all ${llibre.propietari_id === currentUser?.id ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between gap-2 mb-4 w-full">
                {/* Contenidor esquerre per a l'etiqueta blava */}
                <div>
                    {llibre.posseidor_id === currentUser?.id && llibre.propietari_id !== currentUser?.id && (
                    <span className="text-[9px] font-black uppercase px-2 py-1 bg-red-600 text-white rounded-lg shadow-sm animate-pulse">
                        L'ESTÀS LLEGINT TU 📖
                    </span>
                    )}
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
                    colorsEstats[llibre.estat] || "bg-gray-100 text-gray-500 border-gray-200"
                }`}>
                    {llibre.estat}
                </span>
              </div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{llibre.titol}</h3>
                  <p className="text-gray-400 italic text-sm">{llibre.autor}</p>
                </div>

              </div>

              <div className="bg-white/50 p-4 rounded-2xl text-[11px] space-y-2 mb-6 border border-black/5">
                <p className="flex justify-between"><span>🏠 Propietari</span><span className="font-bold">{llibre.propietari?.nom || 'Anònim'}</span></p>
                {llibre.posseidor?.nom && <p className="flex justify-between text-indigo-600"><span>👤 El té</span><span className="font-bold">{llibre.posseidor?.nom}</span></p>}
                {llibre.reservat_per?.nom && <p className="flex justify-between text-amber-600 border-t pt-2"><span>🕒 En cua</span><span className="font-bold">{llibre.reservat_per?.nom}</span></p>}
              </div>
              {/* BOTÓN DE CANCELAR (Solo aparece si tú lo has pedido y está pendiente) */}
              {llibre.estat === 'demanat' && llibre.sollicitant_email?.toLowerCase() === userEmail?.toLowerCase() && (
                <button 
                  onClick={() => cancelarPeticio(llibre.id)} 
                  className="w-full py-2 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-xl border border-red-100 hover:bg-red-100 transition-all"
                >
                  Anul·lar la meva petició
                </button>
              )}
              <div className="flex gap-2">
                <button disabled={desc} onClick={() => gestionarAccioLlibre(llibre)} className={`flex-grow py-3 rounded-2xl font-bold text-white transition-all active:scale-95 ${cBoto} ${desc ? 'opacity-50 cursor-not-allowed' : ''}`}>{tBoto}</button>
                {currentUser?.id === llibre.propietari_id && (
                  <button onClick={() => eliminarLlibre(llibre)} className="px-4 py-3 bg-white text-red-500 rounded-2xl border border-red-100 hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                )}
              </div>
            </div>
            ) : (
              // --- MODE LLISTA (Compacte per a iPhone) ---
              <div key={llibre.id} className="flex items-center justify-between p-3 bg-white border-b border-gray-100 hover:bg-indigo-50 transition-colors">
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-sm truncate">{llibre.titol}</h3>
                  <p className="text-xs text-gray-400 truncate">{llibre.autor}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-[8px] font-bold px-2 py-1 rounded-full border ${colorsEstats[llibre.estat]}`}>
                    {llibre.estat}
                  </span>
                  <div className="flex items-center gap-2">

                    {llibre.estat === 'demanat' && llibre.sollicitant_email === userEmail && (
                      <button
                        onClick={() => cancelarPeticio(llibre.id)}
                        className="ml-2 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                      >
                        Anul·lar petició
                      </button>
                    )}

                    <button 
                      disabled={disabled}
                      onClick={() => gestionarAccioLlibre(llibre)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-[10px] text-white shadow-sm whitespace-nowrap transition-all active:scale-95 ${cBoto} ${disabled ? 'opacity-50' : ''}`}
                    >
                      {/* LÒGICA ADAPTADA PER A TOTS ELS ESTATS */}
                      {llibre.estat === 'disponible' && "Demanar llibre"}
                      
                      {llibre.estat === 'demanat' && (
                        esMeuPos ? "Confirmar recollida" : "Pendent de confirmació"
                      )}
                      
                      {llibre.estat === 'prestat' && (
                        esMeuPos 
                          ? "Retornar llibre" 
                          : (llibre.reserva_id ? "Llibre reservat" : "Posar-me en cua")
                      )}
                    </button>

                    
                    {/* Botó d'eliminar opcional si ets el propietari en mode llista */}
                    {currentUser?.id === llibre.propietari_id && (
                      <button 
                        onClick={() => eliminarLlibre(llibre)}
                        className="p-2.5 bg-red-50 text-red-500 rounded-xl border border-red-100"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          )
        })}
      </div>
    </main>
  )
}
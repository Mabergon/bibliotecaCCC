'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLlibreAfegit: () => void;
}

export default function FormulariLlibre({ isOpen, onClose, onLlibreAfegit }: any) {
  const [titol, setTitol] = useState('')
  const [autor, setAutor] = useState('')
  const [enviant, setEnviant] = useState(false)
  const registrarActivitat = async (accio: string, detall: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('historial').insert([
    { 
      usuari_nom: user?.user_metadata?.nom || user?.email || 'Usuari',
      accio: accio,
      detall: detall 
    }
  ]);
};

// EXEMPLE D'ÚS quan crees un llibre:
// await registrarActivitat('CREACIÓ', `Ha afegit el llibre: ${titol}`);

// EXEMPLE D'ÚS quan algú agafa un llibre:
// await registrarActivitat('PRÉSTEC', `S'ha endut: ${llibre.titol}`);

  if (!isOpen) return null; // Si no està obert, no renderitzem res

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviant(true);
  
    // 0. Obtenemos l'usuari autenticat
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("Error: Debes estar autenticado");
      setEnviant(false);
      return;
    }
  
    // 1. Inserim el llibre a la taula 'llibres'
    const { data, error } = await supabase
      .from('llibres')
      .insert([
        { 
          titol: titol, 
          autor: autor, 
          estat: 'disponible',
          propietari_id: user.id,
          posseidor_id: user.id 
        }
      ])
      .select(); // Fem el .select() per recuperar les dades del llibre acabat de crear

    if (!error) {
      // 1. REINICIEM ELS CAMPS (Perquè no surtin rellenats el pròxim cop)
      setTitol('');
      setAutor('');
      // 2. AVISSEM AL PARE QUE ACTUALITZI (La funció que arriba per props)
      onLlibreAfegit(); 
      // 3. TANQUEM EL MODAL
      onClose();

      // 4. (Opcional) Registrem l'activitat
      await registrarActivitat(
        'CREACIÓ', 
        `Nou llibre afegit a la biblioteca: "${titol}" de l'autor ${autor}`
      );
      alert("Llibre afegit correctament!");
      setEnviant(false);
      onLlibreAfegit(); // Funció per tancar el modal i refrescar la llista
    } else {
      alert("Error creant llibre: " + error.message);
      setEnviant(false);
    }
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* FONTS FOSC (Overlay) */}
      <div 
        className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose} // Tanca si cliques fora
      ></div>

      {/* FINESTRA FLOTANT */}
      <div className="relative bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border border-indigo-50 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-indigo-900">Nou Llibre 📚</h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase text-indigo-300 mb-1 ml-2">Títol</label>
            <input
              type="text"
              placeholder="Ex: El vigilant en el camp de sègol"
              value={titol}
              onChange={(e) => setTitol(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-indigo-300 mb-1 ml-2">Autor/a</label>
            <input
              type="text"
              placeholder="Ex: J.D. Salinger"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              disabled={enviant}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all active:scale-95 text-lg"
            >
              {enviant ? 'Publicant...' : 'Afegir a la biblioteca'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 text-sm"
            >
              Cancel·lar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
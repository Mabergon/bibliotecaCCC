import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Canviem el nom de la constant per claredat, tot i que pots seguir usant el secret que vulguis
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Gestió de CORS (Pre-flight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      email_propietari, 
      email_posseidor, 
      nom_propietari, 
      titol_llibre, 
      nom_solicitant, 
      tipus 
    } = await req.json()

    // 2. Adaptació per a Brevo: Array d'objectes [{email: "..."}]
    const destinataris = [email_propietari, email_posseidor]
          .filter(email => email && typeof email === 'string' && email.includes('@'))
          .map(email => ({ email: email }));

    console.log("Enviant notificació a:", destinataris);

    if (destinataris.length === 0) {
      throw new Error("No s'han trobat emails vàlids");
    }

    let subject = ""
    let missatgePersonalitzat = ""

    switch (tipus) {
      case 'DEMANDA':
        subject = `📖 Sol·licitud de préstec: ${titol_llibre}`
        missatgePersonalitzat = `<p>L'usuari <strong>${nom_solicitant}</strong> vol llegir el teu llibre <strong>"${titol_llibre}"</strong>.</p>`
        break
      case 'DEVOLUCIÓ':
        subject = `✅ Llibre retornat: ${titol_llibre}`
        missatgePersonalitzat = `<p><strong>${nom_solicitant}</strong> ja ha retornat <strong>"${titol_llibre}"</strong>.</p>`
        break
      case 'CONFIRMACIÓ':
        subject = `✅ Préstec confirmat: ${titol_llibre}`
        missatgePersonalitzat = `<p><strong>${nom_solicitant}</strong> ha confirmat que ja té <strong>"${titol_llibre}"</strong>.</p>`
        break
      default:
        subject = `Notificació Biblioteca: ${titol_llibre}`
        missatgePersonalitzat = `<p>Actualització al llibre "${titol_llibre}".</p>`
    }

    // 3. Crida a l'API de Brevo (Corregida)
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        // A Brevo és 'sender', no 'from'
        sender: { 
          name: "Biblioteca Comunitària", 
          email: "bibliotecacccolonia@gmail.com" // EL TEU NOU GMAIL AQUÍ
        },
        to: destinataris,
        subject: subject,
        // A Brevo és 'htmlContent', no 'html'
        htmlContent: `
          <div style="font-family: sans-serif; padding: 25px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; color: #333;">
            <h2 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">Hola ${nom_propietari || ''}!</h2>
            <div style="font-size: 16px; line-height: 1.5; margin: 20px 0;">
              ${missatgePersonalitzat}
            </div>
            <p style="font-size: 13px; color: #777; border-top: 1px solid #eee; padding-top: 15px;">
              Aquesta és una notificació automàtica de la teva Biblioteca.
            </p>
          </div>
        `,
      }),
    })

    const resData = await res.json()

    if (!res.ok) {
      throw new Error(`Error Brevo: ${JSON.stringify(resData)}`)
    }

    return new Response(JSON.stringify({ sent: true, data: resData }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    })

  } catch (error) {
    console.error("Error en la funció:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const resendApiKey = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const body = await req.json()
    const { type, record } = body

    // Ha az ügyfél beküldte az űrlapot (új INSERT) -> visszaigazoló email az ügyfélnek, és egy az adminnak is
    if (type === 'INSERT') {
      
      // 1. Ügyfélnek visszaigazoló
      const clientEmailBody = {
        from: 'SoulMind Konzultáció <info@berbaflow.hu>', // Ezt a verified domainedre kell cserélni a Resendben
        to: [record.email],
        subject: 'Sikeresen jelentkeztél az ingyenes vezetői konzultációra!',
        html: `
          <h3>Kedves ${record.first_name}!</h3>
          <p>Köszönjük a jelentkezésedet a díjmentes vezetői konzultációra!</p>
          <p>A megadott időpontod jelenleg elbírálás alatt áll: <b>${new Date(record.booking_datetime).toLocaleString('hu-HU')}</b></p>
          <p>Hamarosan jelentkezem a részletekkel, és ha elfogadásra kerül az időpontod, küldeni fogom a beszélgetéshez szükséges Zoom linket.</p>
          <br/>
          <p>Üdvözlettel,</p>
          <p>Dr. Polonyi Tünde</p>
        `
      }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(clientEmailBody)
      })

      // 2. Adminnak értesítő email, hogy új foglalás érkezett
      const adminEmailBody = {
        from: 'SoulMind Rendszer <noreply@berbaflow.hu>',
        to: ['info@berbaflow.hu'], // Cseréld ki a te címedre!
        subject: `Új konzultációs foglalás: ${record.first_name} ${record.last_name}`,
        html: `
          <h3>Új jelentkezés érkezett az admin felületre!</h3>
          <p><b>Név:</b> ${record.first_name} ${record.last_name}</p>
          <p><b>Email:</b> ${record.email}</p>
          <p><b>Időpont:</b> ${new Date(record.booking_datetime).toLocaleString('hu-HU')}</p>
          <p><b>Cégtípus:</b> ${record.company_type}</p>
          <p><b>Kihívás:</b> ${record.biggest_challenge}</p>
          <br/>
          <p>Lépj be az Admin felületre az elfogadáshoz vagy elutasításhoz!</p>
        `
      }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(adminEmailBody)
      })
    }

    // Ha az admin ELFOGADTA a jelentkezést (UPDATE status -> 'approved')
    if (type === 'UPDATE' && record.status === 'approved') {
      const approvedEmailBody = {
        from: 'SoulMind Konzultáció <info@berbaflow.hu>',
        to: [record.email],
        subject: 'Időpont visszaigazolás - Vezetői Konzultáció',
        html: `
          <h3>Kedves ${record.first_name}!</h3>
          <p>Örömmel értesítelek, hogy a jelentkezésedet <b>elfogadtam</b> az ingyenes vezetői konzultációra.</p>
          <p><b>A megbeszélés időpontja:</b> ${new Date(record.booking_datetime).toLocaleString('hu-HU')}</p>
          <p><i>Kérlek, az alábbi Zoom linken csatlakozz majd a megbeszéléshez:</i></p>
          <p><a href="https://zoom.us/ide-jon-a-te-sajat-allando-linket">https://zoom.us/ide-jon-a-te-sajat-allando-linket</a></p>
          <br/>
          <p>Várom a beszélgetést!</p>
          <p>Üdvözlettel,</p>
          <p>Dr. Polonyi Tünde</p>
        `
      }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(approvedEmailBody)
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
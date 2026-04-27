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

    if (!resendApiKey) {
      console.error("Hiba: Nincs beállítva a RESEND_API_KEY környezeti változó!");
      throw new Error('RESEND_API_KEY is missing');
    }

    console.log(`Feldolgozás megkezdése. Típus: ${type}, Foglalás ID: ${record?.id}, Státusz: ${record?.status}`);

    // Frissítve PNG formátumra, a jobb kompatibilitás érdekében az email kliensekkel (pl. Gmail)
    const logoUrl = 'https://soulmindacademy.eu/logo.png'; 

    const createEmailHtml = (title: string, contentHtml: string) => `
      <!DOCTYPE html>
      <html lang="hu">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #faf8f5;
            color: #333333;
            margin: 0;
            padding: 0;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border: 1px solid rgba(238, 191, 99, 0.2);
          }
          .header {
            background-color: #faf8f5;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 2px solid #eebf63;
          }
          .header img {
            max-height: 60px;
            width: auto;
          }
          .content {
            padding: 40px 30px;
          }
          .content h3 {
            color: #991b1b; /* red-800 */
            font-size: 22px;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .content p {
            margin-bottom: 15px;
            font-size: 16px;
          }
          .highlight-box {
            background-color: #fffdf0;
            border-left: 4px solid #eebf63;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
          }
          .footer {
            background-color: #1f2937; /* gray-800 */
            color: #9ca3af; /* gray-400 */
            text-align: center;
            padding: 20px;
            font-size: 13px;
          }
          .footer p {
            margin: 5px 0;
          }
          .footer a {
            color: #eebf63;
            text-decoration: none;
          }
          .footer .auto-reply {
            margin-top: 15px;
            font-style: italic;
            color: #6b7280; /* gray-500 */
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <!-- Ideiglenes logó szöveg, ha az SVG nem töltődne be -->
            <img src="${logoUrl}" alt="SoulMind Academy Logo" style="display:block; margin: 0 auto; font-size: 24px; font-weight: bold; color: #991b1b;">
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p>SoulMind Academy</p>
            <p><a href="https://soulmindacademy.eu">www.soulmindacademy.eu</a> | <a href="mailto:soulmindacademy@gmail.com">soulmindacademy@gmail.com</a></p>
            <p class="auto-reply">Ez egy automatikusan generált üzenet. Kérjük, ne válaszoljon erre az emailre.<br>Kérdés esetén írjon a fenti email címre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Ha az ügyfél beküldte az űrlapot (új INSERT) -> visszaigazoló email az ügyfélnek, és egy az adminnak is
    if (type === 'INSERT') {
      console.log("Új foglalás beérkezett, email küldése az ügyfélnek...");
      
      const clientHtmlContent = `
        <h3>Kedves ${record.first_name}!</h3>
        <p>Köszönjük a jelentkezésedet a díjmentes vezetői konzultációra!</p>
        
        <div class="highlight-box">
          <p style="margin:0;">A megadott időpontod jelenleg jóváhagyásra vár:<br>
          <strong style="font-size: 18px; color: #111827;">${new Date(record.booking_datetime).toLocaleString('hu-HU')}</strong></p>
        </div>

        <p>Hamarosan jelentkezem a részletekkel.</p>
        <br/>
        <p>Üdvözlettel,<br><strong>Dr. Polonyi Tünde</strong></p>
      `;

      // 1. Ügyfélnek visszaigazoló
      const clientEmailBody = {
        from: 'SoulMind Konzultáció <info@soulmindacademy.eu>', // Hitelesített domain
        to: [record.email],
        subject: 'Sikeresen jelentkeztél az ingyenes vezetői konzultációra!',
        html: createEmailHtml('Sikeres jelentkezés - SoulMind Academy', clientHtmlContent)
      }

      const clientRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(clientEmailBody)
      });
      
      const clientData = await clientRes.json();
      console.log("Ügyfél email válasz:", clientRes.status, clientData);
      
      if (!clientRes.ok) {
        console.error("Hiba az ügyfél email küldésekor:", clientData);
      }

      console.log("Értesítő email küldése az adminnak...");
      
      const adminHtmlContent = `
        <h3>Új jelentkezés érkezett az admin felületre!</h3>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin-top:0;"><strong>Név:</strong> ${record.first_name} ${record.last_name}</p>
          <p><strong>Email:</strong> <a href="mailto:${record.email}" style="color: #2563eb;">${record.email}</a></p>
          <p><strong>Telefonszám:</strong> ${record.phone}</p>
          <p><strong>Időpont:</strong> <span style="color: #991b1b; font-weight: bold;">${new Date(record.booking_datetime).toLocaleString('hu-HU')}</span></p>
          <p><strong>Cégtípus:</strong> ${record.company_type}</p>
          <p style="margin-bottom:0;"><strong>Kihívás:</strong><br><em>${record.biggest_challenge}</em></p>
        </div>
        <p>Lépj be az Admin felületre a foglalás elfogadásához vagy elutasításához!</p>
        <p style="text-align: center; margin-top: 30px;">
          <a href="https://www.soulmindacademy.eu/soulmind-control-2025" target="_blank" rel="noopener noreferrer" style="background-color: #991b1b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Tovább az Admin felületre</a>
        </p>
        <p style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 15px;">
          Ha a fenti gomb nem működik megfelelően, másold be ezt a linket a böngésződbe:<br>
          <a href="https://www.soulmindacademy.eu/soulmind-control-2025" style="color: #2563eb;">https://www.soulmindacademy.eu/soulmind-control-2025</a>
        </p>
      `;

      // 2. Adminnak értesítő email, hogy új foglalás érkezett
      const adminEmailBody = {
        from: 'SoulMind Rendszer <info@soulmindacademy.eu>',
        to: ['nagydomind@gmail.com', 'soulmindacademy@gmail.com'],  // Admin e-mail cím
        subject: `Új konzultációs foglalás: ${record.first_name} ${record.last_name}`,
        html: createEmailHtml('Új foglalás - Admin Értesítés', adminHtmlContent)
      }

      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(adminEmailBody)
      });
      
      const adminData = await adminRes.json();
      console.log("Admin email válasz:", adminRes.status, adminData);

      if (!adminRes.ok) {
        console.error("Hiba az admin email küldésekor:", adminData);
      }
    }

    // Ha az admin ELFOGADTA a jelentkezést (UPDATE status -> 'approved')
    if (type === 'UPDATE' && record.status === 'approved') {
      console.log("Foglalás elfogadva, visszaigazoló email küldése az ügyfélnek...");
      
      const approvedHtmlContent = `
        <h3>Kedves ${record.first_name}!</h3>
        <p>Örömmel értesítelek, hogy a jelentkezésedet <b>elfogadtuk</b> az ingyenes vezetői konzultációra.</p>
        
        <div class="highlight-box">
          <p style="margin:0;">A megbeszélés időpontja:<br>
          <strong style="font-size: 18px; color: #111827;">${new Date(record.booking_datetime).toLocaleString('hu-HU')}</strong></p>
        </div>

        <p>A fenti időpontig küldöm neked a Google Meet linket, ahol majd csatlakozni tudsz a megbeszéléshez.</p>

        <br/>
        <p>Üdvözlettel,<br><strong>Dr. Polonyi Tünde</strong></p>
      `;

      const approvedEmailBody = {
        from: 'SoulMind Konzultáció <info@soulmindacademy.eu>',
        to: [record.email],
        subject: 'Időpont visszaigazolás - Vezetői Konzultáció',
        html: createEmailHtml('Foglalás jóváhagyva - SoulMind Academy', approvedHtmlContent)
      }

      const approvedRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(approvedEmailBody)
      });
      
      const approvedData = await approvedRes.json();
      console.log("Elfogadott email válasz:", approvedRes.status, approvedData);

      if (!approvedRes.ok) {
        console.error("Hiba az elfogadott email küldésekor:", approvedData);
      }
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
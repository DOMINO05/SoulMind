# SoulMind Academy Platform - Architecturális Dokumentáció

Ez a dokumentum a **SoulMind Academy** webes platformjának technikai felépítését, biztonsági megoldásait és fejlesztési irányelveit foglalja össze. A rendszer célja egy **magas rendelkezésre állású, biztonságos és skálázható** megoldás biztosítása, amely megfelel a legmodernebb iparági szabványoknak.

---

## Executive Summary
A projekt egy **"State-of-the-Art"** technológiai alapokon nyugvó, egyedi fejlesztésű Single Page Application (SPA). A fejlesztés során kiemelt figyelmet fordítottunk a **biztonságra**, a **teljesítményre** és a **fenntarthatóságra**. Nem sablonmegoldás: minden komponens és logika a specifikus üzleti igényekre lett optimalizálva, biztosítva a GDPR megfelelést és a kibervédelmet.

---

## Technológiai Stack & Architektúra

A rendszer egy **szervermentes (Serverless / Jamstack)** architektúrát követ, amely maximális sebességet és biztonságot garantál.

*   **Frontend Core:** [React 18](https://react.dev/) – Komponens-alapú, deklaratív UI építés.
*   **Build & Tooling:** [Vite](https://vitejs.dev/) – Villámgyors build folyamatok és optimalizált kódcsomagolás (tree-shaking).
*   **Design System:** [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS keretrendszer a konzisztens és reszponzív megjelenésért.
*   **Backend as a Service (BaaS):** [Supabase](https://supabase.com/) – PostgreSQL alapú, valós idejű adatbázis és hitelesítés.
    *   *Adatbiztonság:* Row Level Security (RLS) szabályok védik az adatokat az illetéktelen hozzáféréstől.
*   **Edge Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/) – A tartalmak kiszolgálása a felhasználóhoz legközelebbi szerverről történik (CDN), DDoS védelemmel kiegészítve.

---

## Vállalati Szintű Biztonság (Enterprise Security)

A fejlesztés során a **Security-by-Design** elvet követtük. A rendszer több védelmi réteggel rendelkezik:

1.  **Fejlett Adminisztrátori Védelem:**
    *   **Device Fingerprinting:** Az admin regisztráció és bejelentkezés egyedi, eszközhöz kötött azonosítót (`Device ID`) használ. Ez megakadályozza a brute-force és dictionary támadásokat, valamint a jogosulatlan hozzáférési kísérleteket.
    *   **Rate Limiting:** A rendszer automatikusan blokkolja a gyanúsan sokszori próbálkozásokat.
    *   **Admin Secret Verification:** Többlépcsős hitelesítés a regisztráció során.

2.  **Adatvédelem és GDPR:**
    *   **Adatszuverenitás:** Minden adat az Európai Unió területén (Írország, West EU régió) kerül tárolásra.
    *   **Minimal Data Collection:** Kizárólag a működéshez szükséges adatokat gyűjtjük.
    *   **No-Tracking Policy:** Nem használunk invazív, harmadik féltől származó követőkódokat (pl. Google Analytics, Facebook Pixel), tiszteletben tartva a felhasználók magánszféráját.

3.  **Kódminőség és Stabilitás:**
    *   **Szigorú Típusellenőrzés és Linting:** Az `ESLint` és a modern JavaScript szabványok betartása minimalizálja a futásidejű hibákat.
    *   **Bemeneti Validáció:** A [Zod](https://zod.dev/) könyvtár segítségével minden felhasználói adat szigorú ellenőrzésen esik át a kliens oldalon, mielőtt az adatbázisba kerülne (Defense in Depth).
    *   **Automatizált Tesztelés:** `Vitest` alapú egységtesztek garantálják a kritikus komponensek (pl. Navigáció, Űrlapok) helyes működését.

---

## DevOps és CI/CD Folyamatok

A fejlesztési ciklus teljesen automatizált, biztosítva a gyors és hibamentes publikálást.

*   **Verziókezelés:** Git alapú, strukturált commit history-val.
*   **CI (Continuous Integration):** Minden kódbeküldés (push) esetén automatikusan lefutnak a minőségellenőrző szkriptek (Lint, Test).
*   **CD (Continuous Deployment):** A `main` ágra kerülő kód automatikusan buildelődik és kikerül az éles környezetbe a Cloudflare infrastruktúráján keresztül.

---

## Projekt Felépítés

A kódbázis tiszta, moduláris szerkezetet követ a könnyű karbantarthatóság érdekében:

```
/
├── public/              # Statikus fájlok (képek, PDF-ek, _redirects)
│   ├── adatkezelesi...  # Jogi dokumentumok
│   └── logo.svg         # Logo
├── src/
│   ├── components/      # Újrafelhasználható UI elemek (Navbar, Footer, stb.)
│   ├── context/         # React Context (pl. AuthContext a beléptetéshez)
│   ├── lib/             # Segédfüggvények, Supabase kliens, sémák
│   ├── pages/           # Az oldal fő nézetei (Home, Admin, Login, stb.)
│   ├── App.jsx          # Fő alkalmazás komponens és Routing
│   └── main.jsx         # Belépési pont
├── .github/workflows/   # CI/CD konfiguráció (GitHub Actions)
└── vite.config.js       # Vite és teszt beállítások
```

---

## Funkciók

### Publikus Felület
*   **Főoldal:** Bemutatkozás, Tréningek listázása.
*   **Szolgáltatások:** Részletes leírások.
*   **Kötetek:** Kiadványok megjelenítése.
*   **Jelentkezés:** Űrlap, amely közvetlenül a Supabase adatbázisba menti az érdeklődőket. Validációval (Zod) és GDPR checkbox-szal ellátva.
*   **Reszponzivitás:** Teljes körű mobil és desktop támogatás.

### Adminisztrációs Felület
*   **Védett útvonal:** Csak bejelentkezett felhasználók érhetik el.
*   **Funkciók:**
    *   Szekciók és tartalmak szerkesztése.
    *   Árak, Kötetek, Munkatársak kezelése (CRUD: Létrehozás, Olvasás, Frissítés, Törlés).
    *   Képek feltöltése a Galériába.
    *   Jelentkezők listázása és kezelése.

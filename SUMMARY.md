# Projekt Összefoglaló és Dokumentáció

Ez a dokumentum bemutatja a **SoulMind** projekt technológiai hátterét és a megvalósított funkciókat, különös tekintettel a követelményrendszerben megfogalmazott pontokra.

## 🛠 Felhasznált Technológiák

A projekt modern webfejlesztési eszközöket és "Serverless" architektúrát használ:

*   **Frontend:** React.js (Vite build tool-lal), JavaScript (ES6+).
*   **Stílus:** Tailwind CSS (utility-first CSS keretrendszer) a reszponzív és gyors formázáshoz.
*   **Backend / Adatbázis:** Supabase (Backend-as-a-Service).
    *   **PostgreSQL:** Relációs adatbázis az adatok tárolására.
    *   **Supabase Auth:** Felhasználókezelés és autentikáció (JWT alapú).
    *   **Supabase Storage:** Képek tárolása (pl. kötetek borítóképei).
*   **Ikonok:** Lucide React.

---

## 💡 Megvalósítás Részletei (Követelmények szerint)

### 2. & 3. Adattípusok kezelése és CRUD műveletek

Az alkalmazás több mint két típust kezel relációs adatbázisban (PostgreSQL). A két legfontosabb példa a **Kötetek (Volumes)** és a **Tartalom szekciók (Sections/Items)**.

*   **Adatbázis:** A Supabase-ben létrehozott `volumes` és `section_items` táblák tárolják az adatokat.
*   **Frontend (Admin):** Az adminisztrációs felületen (`/admin`) mindkét típushoz teljes körű **CRUD** (Create, Read, Update, Delete) művelet biztosított.
*   **Frontend (Publikus):** A látogatók számára az adatok listázása történik (Read).

**Kód példa - Admin felület adatbetöltés (Read):**
Az összes típus lekérése egyszerre történik a hatékonyság érdekében.
*Fájl: `src/pages/Admin.jsx` (kb. 26-38. sor)*
```javascript
useEffect(() => {
  const load = async () => {
    const [s, i, t, r, v] = await Promise.all([
      supabase.from('sections').select('*').order('id'),
      supabase.from('section_items').select('*').order('id'),
      supabase.from('trainings').select('*').order('created_at', { ascending: false }),
      supabase.from('questionnaire').select('*').order('created_at', { ascending: false }),
      supabase.from('volumes').select('*').order('id') // Kötetek lekérése
    ]);
    setData({ 
      sections: s.data || [], 
      items: i.data || [], 
      // ...
      volumes: v.data || [] 
    });
  };
  load();
}, [refresh]);
```

**Kód példa - Új kötet hozzáadása (Create):**
*Fájl: `src/pages/Admin.jsx` (kb. 113-138. sor)*
```javascript
const addVolume = async () => {
  // ... validáció ...
  const { error } = await supabase.from('volumes').insert({
    title: newVolume.title,
    link: newVolume.link,
    image_path: imageUrl
  });
  // ... hibakezelés és frissítés ...
};
```

---

### 4. Autentikáció

Az alkalmazás a **Supabase Auth** szolgáltatását használja, amely iparági szabványokat követ (JWT - JSON Web Tokens). A rendszer biztonságos munkamenet-kezelést tesz lehetővé.

*   **Megvalósítás:** Létrehoztunk egy `AuthContext`-et, ami az egész alkalmazást körbeöleli, és globálisan elérhetővé teszi a felhasználó állapotát (`user`, `session`).
*   **Védelem:** A védett útvonalak (`ProtectedRoute`) ellenőrzik, hogy van-e aktív felhasználó. Ha nincs, visszairányítanak a bejelentkezéshez.

**Kód példa - Auth Context:**
*Fájl: `src/context/AuthContext.jsx` (kb. 10-24. sor)*
```javascript
useEffect(() => {
  // Aktív munkamenet lekérése
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
    setLoading(false);
  });

  // Változások figyelése (pl. kijelentkezés, token frissítés)
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
    setLoading(false);
  });
  // ...
}, []);
```

**Kód példa - Védett útvonal komponens:**
*Fájl: `src/components/ProtectedRoute.jsx` (kb. 11-13. sor)*
```javascript
if (!user) {
  return <Navigate to="/login" replace />;
}
return children;
```

---

### 5. Extra funkciók és Üzleti logika

A projekt számos egyedi megoldást tartalmaz, amelyek javítják a felhasználói élményt (UX) és a konverziót.

#### A. Intelligens Lebegő Gomb (Floating CTA)
Egy "Jelentkezz most" gomb, amely **csak akkor jelenik meg a főoldalon, ha a felhasználó már lejjebb görgetett** (túljutott a fejlécen). Mobilon helytakarékosságból csak egy ikont mutat, asztali gépen szöveget is. Ezen kívül automatikusan elrejtőzik a bejelentkezési és admin oldalakon.

*Fájl: `src/components/FloatingCTA.jsx` (kb. 9-18. sor)*
```javascript
useEffect(() => {
  const handleScroll = () => {
    // Csak a főoldalon legyen görgetéshez kötve
    if (location.pathname === '/') {
      setVisible(window.scrollY > 300); // 300px után jelenik meg
    } else {
      setVisible(true);
    }
  };
  // ... eseményfigyelők ...
}, [location.pathname]);
```

#### B. Interaktív Kontakt Linkek (Okos vágólap kezelés)
A láblécben és az admin felületen található email és telefonszám linkek **környezettől függően máshogy viselkednek**:
*   **Asztali gépen (Desktop):** Kattintásra nem nyitja meg a levelezőt/tárcsázót, hanem **automatikusan a vágólapra másolja** az adatot, és egy kis buborékban visszajelez ("Másolva!").
*   **Mobilon:** Megmarad a hagyományos `mailto:` és `tel:` viselkedés a közvetlen híváshoz.

*Fájl: `src/components/ContactLink.jsx` (kb. 6-19. sor)*
```javascript
const handleClick = (e) => {
  // Képernyőméret alapján detektáljuk a desktop környezetet
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

  if (isDesktop) {
    e.preventDefault(); // Megakadályozzuk a link megnyitását
    navigator.clipboard.writeText(value); // Másolás vágólapra
    setCopied(true);
    // ...
  }
};
```

#### C. Biztonságos Admin Regisztráció (Backend Trigger)
A regisztrációs űrlap kliens oldalon nem tartalmazza a titkos kódot (`55555`). Ehelyett a kód `metadata`-ként kerül elküldésre a Supabase-nek. A biztonságot egy **PostgreSQL Trigger** garantálja a szerver oldalon, ami minden új felhasználó létrehozása előtt ellenőrzi a kódot, és elutasítja a regisztrációt, ha az nem egyezik. Ez megakadályozza, hogy a forráskód elemzésével bárki megszerezze a hozzáférést.

*(A logika a `src/pages/Register.jsx` fájlban hívódik meg, a validáció pedig az adatbázisban történik.)*

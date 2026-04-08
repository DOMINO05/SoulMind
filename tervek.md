# Tervek: Vezetői Konzultáció Időpontfoglaló Rendszer (Új /jelentkezes oldal)

## 1. Áttekintés
A jelenlegi `/jelentkezes` oldalt felváltja egy új, konverzió-optimalizált landing oldal, amely kimondottan vezetőknek szóló konzultációra fókuszál. A legfontosabb technikai újítás az integrált időpontfoglaló és űrlapkezelő rendszer, amely összeköti a frontendet a Supabase backenddel, és egy teljes körű Admin felületet biztosít a foglalások kezelésére.

## 2. Időpontfoglaló rendszer működése és Admin felületi megjelenése

### Frontend (Ügyfél oldal)
* **Kétlépcsős űrlap:** 
  1. lépés: Alapadatok és kvalifikációs kérdések (Név, Email, Telefon, Cégtípus, Legnagyobb kihívás).
  2. lépés: Dátum és időpont választó (Naptár nézet).
* **Elérhető időpontok:** A rendszer dinamikusan számolja az elérhető időpontokat a megadott szabályok alapján:
  * Hétfő és Kedd: délelőtt (pl. 08:00 - 12:00)
  * Csütörtök: 17:00 - 20:00
  * Péntek: (pl. 08:00 - 16:00)
  * **Kivételek kezelése:** A naptárban a hétvégék (szombat, vasárnap) egyáltalán nem jelennek meg foglalható napként. A lefoglalt, valamint az admin által letiltott időpontok és napok (pl. személyes megkeresések vagy egyéb elfoglaltságok miatt) szürkén, inaktívként jelennek meg a felületen. Hardkódolt dátumok (pl. április 10.) nincsenek, mindent az admin vezérel a felületről.
* **Sikeres foglalás:** Sikeres jelentkezés után átirányítás egy dedikált "Sikeresen jelentkeztél" köszönőoldalra (pl. `/jelentkezes/sikeres`).

### Admin felület
* **Naptár és Lista nézet:** Az admin egy átlátható dashboardon látja a beérkezett foglalásokat.
* **Foglalások státuszkezelése:** Minden foglalás rendelkezik egy státusszal (Függőben, Elfogadva, Elutasítva).
* **Részletek megtekintése:** Kattintásra megnyílik a jelentkező összes megadott adata (cégtípus, kihívások), így az admin előre felkészülhet, vagy ez alapján dönthet a szűrésről.
* **Időpont menedzsment (Kizárások):** Külön felület az egyedi napok/idősávok letiltására (pl. szabadság, ünnepnap).

## 3. Supabase Backend Követelmények

A következő táblákat és beállításokat kell létrehozni a Supabase-ben:

### Új táblák:
1. `consultation_bookings`:
   * `id` (UUID, Primary Key)
   * `first_name` (Text)
   * `last_name` (Text)
   * `email` (Text)
   * `phone` (Text)
   * `company_type` (Text)
   * `biggest_challenge` (Text)
   * `booking_datetime` (Timestamp with time zone)
   * `status` (Text: 'pending', 'approved', 'rejected' - default: 'pending')
   * `created_at` (Timestamp)

2. `blocked_times`: (Az admin által letiltott időpontok/napok)
   * `id` (UUID, Primary Key)
   * `block_date` (Date)
   * `start_time` (Time - opcionális, ha csak egy sáv van letiltva)
   * `end_time` (Time - opcionális)
   * `is_full_day` (Boolean)
   * `reason` (Text - csak belső használatra)

### Row Level Security (RLS) beállítások:
* `consultation_bookings`: 
  * *Insert:* Bárki (anonim felhasználók is) tudjon új sort beszúrni.
  * *Select/Update/Delete:* Csak az autentikált Admin felhasználók láthatják és módosíthatják a foglalásokat.
* `blocked_times`:
  * *Select:* Bárki (anonim) olvashatja, hogy a naptár frontend ki tudja szűrni a letiltott időpontokat.
  * *Insert/Update/Delete:* Csak az autentikált Admin felhasználók módosíthatják.

## 4. Admin felületi funkciók (Időpontok tiltása, Elfogadás/Elutasítás)

* **Elfogadás / Elutasítás:** A beérkező "Függőben" lévő kéréseknél két gomb jelenik meg: "Elfogad" és "Elutasít". A gombra kattintva a Supabase adatbázisban frissül a státusz.
* **Email küldése elutasítás után:** Elutasítás esetén megjelenik egy "Értesítés küldése" gomb, amely megnyitja az admin alapértelmezett levelezőkliensét (mailto: linkkel), automatikusan kitöltve a címzettet, a tárgyat és egy udvarias sablonszöveget az elutasításról, így az admin a saját emailjéből küldheti el a választ.
* **Szabadság/Letiltás modul:** Egy egyszerű naptár az admin felületen, ahol ki lehet jelölni napokat, vagy adott napokon belüli órákat, amiket a rendszer azonnal beír a `blocked_times` táblába.

## 5. További funkciók a jobb felhasználói élményhez (UX/Admin)

### Ügyfelek részére:
* **Automatikus Visszaigazoló Email (Resend + Supabase Edge Functions):** Ahogy lefoglalta az időpontot, a Supabase automatikusan elindít egy háttérfolyamatot (Edge Function), amely az ingyenes Resend API segítségével kiküld egy professzionális visszaigazoló emailt az ügyfélnek, arról hogy a kérése beérkezett és elbírálás alatt van.
* **Naptárba mentés:** Az elfogadó emailben (amit a Resend küld majd ki státuszváltáskor) helyet kaphat egy Google Calendar link, amivel az ügyfél egy kattintással beírhatja a saját naptárába a találkozót.

### Admin részére:
* **Email értesítés új foglaláskor:** A fenti Supabase Edge Function nem csak az ügyfélnek, hanem az adminnak is küld egy automatikus emailt a Resend API-n keresztül, ha új "Függőben lévő" jelentkezés érkezett, nehogy elsikkadjon.
* **Exportálás:** Lehetőség a jelentkezők listájának CSV/Excel formátumban történő letöltésére.
* **Jegyzetek:** A foglalás mellé az admin tudjon belső megjegyzéseket fűzni (pl. a konzultáció utáni tapasztalatokhoz).

## 6. Biztonsági intézkedések

A funkció biztonságos működéséhez a következőket kell implementálni:

1. **Adatbázis védelem (RLS):** Ahogy a Supabase részben említve lett, szigorú RLS (Row Level Security) házirendek, hogy az ügyfelek véletlenül se férjenek hozzá egymás személyes adataihoz (csak Insert jog).
2. **Adatvédelem és GDPR:** Mivel szenzitív adatokat gyűjtünk (név, telefon, egyéni kihívások), az űrlaphoz kötelező egy GDPR / Adatvédelmi tájékoztató elfogadó checkbox.
3. **Spam védelem (Rate Limiting / Captcha):** A publikus űrlapokat könnyen megtalálják a botok. Érdemes egy láthatatlan reCAPTCHA-t vagy Cloudflare Turnstile-t integrálni, illetve IP alapú korlátozást (Rate Limiting) beállítani a Supabase-ben a tömeges spammelés elkerülése végett.
4. **Bemeneti adatok validálása (Sanitization):** A frontend-en (pl. Zod vagy Yup segítségével) és a backend-en is szigorúan validálni kell a beírt adatokat, megelőzve az XSS vagy SQL Injection jellegű (bár utóbbi Supabase-nél kevésbé releváns) támadásokat.
5. **Autentikáció:** Az admin felületet kizárólag a Supabase Auth-on keresztül, erős jelszóval, esetleg 2FA (kétfaktoros hitelesítés) bevonásával szabad védeni.

## 7. Implementációs lépések (Következő fázis)
A jóváhagyás után Act Mode-ban az alábbi lépéseket hajtjuk végre:
1. Új Supabase táblák és RLS policy-k létrehozása SQL editoron keresztül.
2. `Landing.jsx` / Új `/jelentkezes` oldal UI kialakítása a DOCX fájl alapján (Tailwind).
3. Űrlap és Naptár (pl. `react-calendar`) komponensek lefejlesztése és összekötése a Supabase API-val.
4. Admin felület (`/admin`) kibővítése a foglaláskezelő és letiltó modulokkal.
5. Sikeres foglalás oldal és átirányítások beállítása.
6. Supabase Edge Function és Resend API integrálása az automatikus emailek (visszaigazolás, admin értesítő) küldéséhez.

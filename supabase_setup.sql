-- ==============================================================================
-- 1. TÁBLÁK LÉTREHOZÁSA
-- ==============================================================================

-- Foglalások tábla
CREATE TABLE consultation_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company_type TEXT NOT NULL,
    biggest_challenge TEXT NOT NULL,
    booking_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Letiltott időpontok/napok tábla
CREATE TABLE blocked_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_full_day BOOLEAN DEFAULT false,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 2. ROW LEVEL SECURITY (RLS) BEÁLLÍTÁSOK
-- ==============================================================================

-- Engedélyezzük az RLS-t mindkét táblán
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;


-- POLICIES a consultation_bookings táblához
-- 1. Bárki (anonim is) szúrhat be új foglalást
CREATE POLICY "Allow public insert to consultation_bookings" 
ON consultation_bookings FOR INSERT 
TO public 
WITH CHECK (true);

-- 2. Csak az autentikált felhasználók (Admin) olvashatják az összes foglalást
CREATE POLICY "Allow authenticated to select consultation_bookings" 
ON consultation_bookings FOR SELECT 
TO authenticated 
USING (true);

-- 3. Csak az autentikált felhasználók (Admin) módosíthatják a foglalásokat
CREATE POLICY "Allow authenticated to update consultation_bookings" 
ON consultation_bookings FOR UPDATE 
TO authenticated 
USING (true);

-- 4. Csak az autentikált felhasználók (Admin) törölhetik a foglalásokat
CREATE POLICY "Allow authenticated to delete consultation_bookings" 
ON consultation_bookings FOR DELETE 
TO authenticated 
USING (true);


-- POLICIES a blocked_times táblához
-- 1. Bárki olvashatja a letiltott időpontokat (frontend naptárhoz kell)
CREATE POLICY "Allow public select on blocked_times" 
ON blocked_times FOR SELECT 
TO public 
USING (true);

-- 2. Csak adminok (autentikált userek) adhatnak hozzá újat
CREATE POLICY "Allow authenticated to insert blocked_times" 
ON blocked_times FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Csak adminok módosíthatják
CREATE POLICY "Allow authenticated to update blocked_times" 
ON blocked_times FOR UPDATE 
TO authenticated 
USING (true);

-- 4. Csak adminok törölhetik
CREATE POLICY "Allow authenticated to delete blocked_times" 
ON blocked_times FOR DELETE 
TO authenticated 
USING (true);

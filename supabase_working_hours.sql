-- ==============================================================================
-- 3. BEOSZTÁS (WORKING HOURS) TÁBLA LÉTREHOZÁSA ÉS FELTÖLTÉSE
-- ==============================================================================

CREATE TABLE working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Vasárnap, 1=Hétfő, stb.
    is_active BOOLEAN DEFAULT false,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Egyedi napok biztosítása (egy naphoz csak egy bejegyzés legyen)
ALTER TABLE working_hours ADD CONSTRAINT unique_day_of_week UNIQUE (day_of_week);

-- RLS BEÁLLÍTÁSOK A working_hours TÁBLÁHOZ
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

-- Bárki (anonim is) olvashatja (frontendnek kell)
CREATE POLICY "Allow public select on working_hours" 
ON working_hours FOR SELECT 
TO public 
USING (true);

-- Csak adminok (autentikált userek) módosíthatják
CREATE POLICY "Allow authenticated to manage working_hours" 
ON working_hours FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- ALAPÉRTELMEZETT BEOSZTÁS FELTÖLTÉSE (Hétfő=1, Vasárnap=0)
INSERT INTO working_hours (day_of_week, is_active, start_time, end_time) VALUES
(1, true, '08:00', '12:00'), -- Hétfő
(2, true, '08:00', '12:00'), -- Kedd
(3, false, null, null),      -- Szerda (zárva)
(4, true, '17:00', '20:00'), -- Csütörtök
(5, true, '08:00', '16:00'), -- Péntek
(6, false, null, null),      -- Szombat (zárva)
(0, false, null, null)       -- Vasárnap (zárva)
ON CONFLICT (day_of_week) DO UPDATE 
SET is_active = EXCLUDED.is_active, 
    start_time = EXCLUDED.start_time, 
    end_time = EXCLUDED.end_time;
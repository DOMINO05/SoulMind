-- ==============================================================================
-- 4. ÜGYFÉLVÉLEMÉNYEK (REVIEWS) TÁBLA LÉTREHOZÁSA (A JELENTKEZÉS OLDALHOZ)
-- ==============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_path TEXT NOT NULL,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS BEÁLLÍTÁSOK A reviews TÁBLÁHOZ
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Bárki (anonim is) olvashatja (frontendnek kell a megjelenítéshez)
CREATE POLICY "Allow public select on reviews" 
ON reviews FOR SELECT 
TO public 
USING (true);

-- Csak adminok (autentikált userek) módosíthatják (feltöltés, törlés)
CREATE POLICY "Allow authenticated to manage reviews" 
ON reviews FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
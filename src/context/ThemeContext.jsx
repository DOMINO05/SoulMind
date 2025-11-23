import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = [
  {
    id: 1,
    name: "Harmónia (Eredeti)",
    type: 'nature', 
    heroImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop",
    colors: {
      primary: "212 163 115", 
      secondary: "233 237 201", 
      dark: "53 53 53", 
      light: "254 250 224", 
    },
    fonts: { sans: "Inter", serif: "Playfair Display" },
    radii: { btn: "9999px", card: "1rem" }
  },
  {
    id: 2,
    name: "Üzleti (Földszínekkel)", // Név frissítve
    type: 'corporate', 
    heroImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
    colors: {
      // *** MÁSOLVA AZ 1-ESBŐL ***
      primary: "212 163 115", 
      secondary: "233 237 201", 
      dark: "53 53 53", 
      light: "254 250 224", 
    },
    fonts: { sans: "Inter", serif: "Inter" }, 
    radii: { btn: "4px", card: "4px" }
  },
  {
    id: 3,
    name: "Stabilitás (Mélykék/Ezüst)", 
    type: 'creative', 
    heroImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop", 
    colors: {
      primary: "30 58 138",
      secondary: "100 116 139",
      dark: "15 23 42",
      light: "248 250 252",
    },
    fonts: { sans: "Roboto", serif: "Merriweather" }, 
    radii: { btn: "8px", card: "12px" } 
  }
];

export const ThemeProvider = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState(themes[0]);

  const switchTheme = (themeId) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    setActiveTheme(theme);

    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-dark', theme.colors.dark);
    root.style.setProperty('--color-light', theme.colors.light);
    root.style.setProperty('--font-sans', theme.fonts.sans);
    root.style.setProperty('--font-serif', theme.fonts.serif);
    root.style.setProperty('--radius-btn', theme.radii.btn);
    root.style.setProperty('--radius-card', theme.radii.card);
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
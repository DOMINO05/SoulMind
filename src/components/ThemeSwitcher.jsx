import { Palette } from 'lucide-react';
import { useTheme, themes } from '../context/ThemeContext';

const ThemeSwitcher = () => {
  const { activeTheme, switchTheme } = useTheme();

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-2xl border border-gray-200 animate-fade-in-up transition-all hover:scale-105">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 pl-1">
        <Palette size={14} /> Stílus Váltó
      </div>
      <div className="flex gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => switchTheme(theme.id)}
            className={`
              w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center shadow-md relative
              ${activeTheme.id === theme.id 
                ? 'scale-110 ring-2 ring-offset-2 ring-gray-800 text-white' 
                : 'hover:scale-105 hover:shadow-lg text-white/90'
              }
            `}
            style={{ 
              backgroundColor: `rgb(${theme.colors.primary})`,
            }}
            title={theme.name}
          >
            {theme.id}
            {activeTheme.id === theme.id && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
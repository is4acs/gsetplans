import { Menu, X, RefreshCw, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts';
import { themes } from '../../utils/theme';
import { VisibilityToggle, LoadingSpinner } from '../ui';

function Header({
  title,
  sidebarOpen,
  onToggleSidebar,
  loading,
  isPending,
  onRefresh
}) {
  const { theme, setTheme } = useTheme();
  const t = themes[theme];

  return (
    <header className={`${t.bgSecondary} border-b ${t.border} px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10`}>
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-xl ${t.bgHover}`}
        >
          {sidebarOpen
            ? <X className={`w-5 h-5 ${t.textSecondary}`} />
            : <Menu className={`w-5 h-5 ${t.textSecondary}`} />
          }
        </button>
        <h2 className={`text-lg sm:text-xl font-semibold ${t.text} truncate`}>
          {title}
        </h2>
        {isPending && <LoadingSpinner size="sm" />}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <VisibilityToggle />
        <button
          onClick={onRefresh}
          disabled={loading || isPending}
          className={`p-2 rounded-xl ${t.bgTertiary} ${t.bgHover} ${(loading || isPending) ? 'opacity-50' : ''}`}
        >
          <RefreshCw className={`w-5 h-5 ${t.textSecondary} ${(loading || isPending) ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className={`p-2 rounded-xl ${t.bgTertiary} ${t.bgHover}`}
        >
          {theme === 'light'
            ? <Moon className={`w-5 h-5 ${t.textSecondary}`} />
            : <Sun className="w-5 h-5 text-yellow-400" />
          }
        </button>
      </div>
    </header>
  );
}

export default Header;

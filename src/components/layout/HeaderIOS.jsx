import { RefreshCw, Moon, Sun, User } from 'lucide-react';
import { useTheme, useAuth } from '../../contexts';
import { themes } from '../../utils/theme';
import { VisibilityToggle, LoadingSpinner } from '../ui';
import { useNativeFeatures } from '../../hooks';

function HeaderIOS({
  title,
  loading,
  isPending,
  onRefresh,
  safeAreaTop = 47,
  safeAreaLeft = 0,
  safeAreaRight = 0
}) {
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();
  const { haptic } = useNativeFeatures();
  const t = themes[theme];

  const isSuperAdmin = profile?.role === 'superadmin';
  const isDirection = profile?.role === 'dir' || isSuperAdmin;

  const handleRefresh = async () => {
    await haptic('light');
    onRefresh?.();
  };

  const handleThemeToggle = async () => {
    await haptic('light');
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header 
      className={`${t.bgSecondary} border-b ${t.border} sticky top-0 z-10`}
      style={{ 
        paddingTop: `calc(${safeAreaTop}px + 12px)`,
        paddingBottom: '12px',
        paddingLeft: `calc(${safeAreaLeft}px + 16px)`,
        paddingRight: `calc(${safeAreaRight}px + 16px)`,
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Titre et badge utilisateur */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h2 className={`text-lg font-bold ${t.text} truncate`}>
            {title}
          </h2>
          {isPending && <LoadingSpinner size="sm" />}
        </div>
        
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <VisibilityToggle />
          
          <button
            onClick={handleRefresh}
            disabled={loading || isPending}
            className={`w-11 h-11 inline-flex items-center justify-center rounded-xl ${t.bgTertiary} active:scale-95 transition-transform ${
              (loading || isPending) ? 'opacity-50' : ''
            }`}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <RefreshCw 
              className={`w-5 h-5 ${t.textSecondary} ${(loading || isPending) ? 'animate-spin' : ''}`} 
            />
          </button>
          
          <button
            onClick={handleThemeToggle}
            className={`w-11 h-11 inline-flex items-center justify-center rounded-xl ${t.bgTertiary} active:scale-95 transition-transform`}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            {theme === 'light'
              ? <Moon className={`w-5 h-5 ${t.textSecondary}`} />
              : <Sun className="w-5 h-5 text-yellow-400" />
            }
          </button>
        </div>
      </div>

      {/* Info utilisateur compacte */}
      <div className="flex items-center gap-2 mt-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${t.bgTertiary}`}>
          <User className={`w-3.5 h-3.5 ${t.textMuted}`} />
          <span className={`text-xs font-medium ${t.text}`}>{profile?.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            isSuperAdmin ? 'bg-amber-500/20 text-amber-500' :
            isDirection ? 'bg-purple-500/20 text-purple-500' : 
            'bg-emerald-500/20 text-emerald-500'
          }`}>
            {isSuperAdmin ? 'Admin' : isDirection ? 'Dir.' : 'Tech'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default HeaderIOS;

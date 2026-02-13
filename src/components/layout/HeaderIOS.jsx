import { RefreshCw, Settings, User } from 'lucide-react';
import { useTheme, useAuth } from '../../contexts';
import { themes } from '../../utils/theme';
import { LoadingSpinner } from '../ui';
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
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { haptic } = useNativeFeatures();
  const t = themes[theme];

  const isSuperAdmin = profile?.role === 'superadmin';
  const isDirection = profile?.role === 'dir' || isSuperAdmin;

  const handleRefresh = async () => {
    await haptic('light');
    onRefresh?.();
  };

  return (
    <header 
      className={`${t.bgSecondary} border-b ${t.border} sticky top-0 z-10`}
      style={{ 
        paddingTop: `calc(${safeAreaTop}px + 8px)`,
        paddingBottom: '8px',
        paddingLeft: `calc(${safeAreaLeft}px + 12px)`,
        paddingRight: `calc(${safeAreaRight}px + 12px)`,
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className={`text-base font-bold ${t.text} truncate`}>
            {title}
          </h2>
          {isPending && <LoadingSpinner size="sm" />}
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading || isPending}
          className={`p-2 rounded-lg ${t.bgTertiary} active:scale-95 transition-transform ${
            (loading || isPending) ? 'opacity-50' : ''
          }`}
        >
          <RefreshCw 
            className={`w-5 h-5 ${t.textSecondary} ${(loading || isPending) ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>
    </header>
  );
}

export default HeaderIOS;

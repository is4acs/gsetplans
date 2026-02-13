import { useEffect, useMemo, useState, useCallback } from 'react';
import { LogOut, MoreHorizontal, ChevronUp } from 'lucide-react';
import { useTheme, useAuth } from '../../contexts';
import { themes } from '../../utils/theme';
import { useNativeFeatures } from '../../hooks';

function BottomNavigation({
  navItems,
  currentView,
  onViewChange,
  safeAreaBottom = 34,
  safeAreaLeft = 0,
  safeAreaRight = 0
}) {
  const { theme } = useTheme();
  const { signOut } = useAuth();
  const { haptic } = useNativeFeatures();
  const t = themes[theme];
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

  const MAX_PRIMARY_ITEMS = 4;
  const hasOverflow = navItems.length > MAX_PRIMARY_ITEMS;

  const primaryItems = useMemo(
    () => (hasOverflow ? navItems.slice(0, MAX_PRIMARY_ITEMS - 1) : navItems),
    [hasOverflow, navItems]
  );

  const overflowItems = useMemo(
    () => (hasOverflow ? navItems.slice(MAX_PRIMARY_ITEMS - 1) : []),
    [hasOverflow, navItems]
  );

  const overflowActive = overflowItems.some(item => item.id === currentView);

  const handleViewChange = useCallback(async (viewId) => {
    await haptic('light');
    onViewChange(viewId);
  }, [haptic, onViewChange]);

  const handleSignOut = useCallback(async () => {
    await haptic('medium');
    signOut();
  }, [haptic, signOut]);

  const toggleOverflow = useCallback(async () => {
    await haptic('light');
    setShowOverflowMenu(prev => !prev);
  }, [haptic]);

  useEffect(() => {
    setShowOverflowMenu(false);
  }, [currentView]);

  return (
    <>
      {hasOverflow && showOverflowMenu && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setShowOverflowMenu(false)}
            className="fixed inset-0 z-[60] bg-black/30"
          />
          <div
            className={`fixed left-4 right-4 z-[70] rounded-2xl border ${t.border} ${t.bgSecondary} shadow-2xl p-2`}
            style={{
              left: `calc(${safeAreaLeft}px + 16px)`,
              right: `calc(${safeAreaRight}px + 16px)`,
              bottom: `calc(80px + ${safeAreaBottom}px)`
            }}
          >
            <p className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${t.textMuted}`}>
              Plus
            </p>
            <div className="space-y-1">
              {overflowItems.map(item => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                      isActive ? 'bg-teal-500/15 text-teal-500' : `${t.text} ${t.bgHover}`
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <nav
        className={`fixed bottom-0 left-0 right-0 ${t.sidebar} border-t ${t.border} z-50`}
        style={{
          paddingBottom: `${safeAreaBottom}px`,
          paddingLeft: `${safeAreaLeft}px`,
          paddingRight: `${safeAreaRight}px`,
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex justify-around items-stretch h-16">
          {primaryItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
                  isActive ? 'text-teal-500' : t.textSecondary
                }`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <div className="w-6 h-6 flex items-center justify-center mb-1">
                  <item.icon
                    className="w-6 h-6"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className="text-[10px] font-medium truncate">
                  {item.label}
                </span>
              </button>
            );
          })}

          {hasOverflow && (
            <button
              onClick={toggleOverflow}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
                overflowActive || showOverflowMenu ? 'text-teal-500' : t.textSecondary
              }`}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              <div className="w-6 h-6 flex items-center justify-center mb-1">
                {showOverflowMenu ? <ChevronUp className="w-6 h-6" /> : <MoreHorizontal className="w-6 h-6" />}
              </div>
              <span className="text-[10px] font-medium">Plus</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 text-red-500"
            style={{
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <div className="w-6 h-6 flex items-center justify-center mb-1">
              <LogOut className="w-6 h-6" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium">Sortir</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default BottomNavigation;

// BottomNavigation - Navigation iOS native style
import { LogOut } from 'lucide-react';
import { useTheme, useAuth } from '../../contexts';
import { themes } from '../../utils/theme';

function BottomNavigation({ navItems, currentView, onViewChange, safeAreaBottom = 34 }) {
  const { theme } = useTheme();
  const { signOut } = useAuth();
  const t = themes[theme];

  // Limiter à 4 items max pour laisser place au logout
  const displayItems = navItems.slice(0, 4);

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 ${t.sidebar} border-t ${t.border} z-50`}
      style={{ 
        paddingBottom: `${safeAreaBottom}px`,
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="flex justify-around items-center h-16">
        {displayItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 px-1 transition-all active:scale-95 ${
                isActive ? 'text-teal-500' : t.textSecondary
              }`}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              <item.icon 
                className={`w-6 h-6 mb-1 ${isActive ? 'text-teal-500' : ''}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span 
                className={`text-[10px] font-medium truncate max-w-full ${
                  isActive ? 'text-teal-500' : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Bouton Déconnexion */}
        <button
          onClick={signOut}
          className="flex flex-col items-center justify-center flex-1 h-full py-2 px-1 transition-all active:scale-95 text-red-500"
          style={{
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        >
          <LogOut className="w-6 h-6 mb-1" strokeWidth={2} />
          <span className="text-[10px] font-medium">Sortir</span>
        </button>
      </div>
    </nav>
  );
}

export default BottomNavigation;

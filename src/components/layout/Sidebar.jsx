import { LogOut } from 'lucide-react';
import { useTheme, useAuth } from '../../contexts';
import { themes } from '../../utils/theme';
import Logo from '../ui/Logo';

function SidebarContent({ navItems, currentView, onViewChange, onItemClick, showLabels, profile, isSuperAdmin, isDirection, signOut, t }) {
  return (
    <>
      <div className="p-4 flex items-center gap-3">
        <Logo size="md" />
        {showLabels && (
          <div>
            <h1 className="font-bold text-white">GSET PLANS</h1>
            <p className="text-xs text-gray-500">FTTH D3 Guyane</p>
          </div>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              onViewChange(item.id);
              onItemClick?.();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentView === item.id
                ? t.sidebarActive
                : `${t.sidebarText} ${t.sidebarHover}`
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {showLabels && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-800">
        {showLabels && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-gray-800/50">
            <p className="text-xs text-gray-500">Connecté</p>
            <p className="font-medium text-white truncate text-sm">{profile?.name}</p>
            <span className={`text-xs ${
              isSuperAdmin ? 'text-amber-400' :
              isDirection ? 'text-purple-400' : 'text-emerald-400'
            }`}>
              {isSuperAdmin ? 'Super Admin' : isDirection ? 'Direction' : 'Technicien'}
            </span>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl"
        >
          <LogOut className="w-5 h-5" />
          {showLabels && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>
    </>
  );
}

function Sidebar({ navItems, currentView, onViewChange, isOpen, onToggle }) {
  const { theme } = useTheme();
  const { profile, signOut } = useAuth();
  const t = themes[theme];

  const isSuperAdmin = profile?.role === 'superadmin';
  const isDirection = profile?.role === 'dir' || isSuperAdmin;

  const sharedProps = { navItems, currentView, onViewChange, profile, isSuperAdmin, isDirection, signOut, t };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col ${t.sidebar} ${isOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
        <SidebarContent {...sharedProps} showLabels={isOpen} />
      </aside>

      {/* Mobile Sidebar (Overlay) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div onClick={onToggle} className="absolute inset-0 bg-black/50" />
          <aside className={`absolute inset-y-0 left-0 w-64 ${t.sidebar} flex flex-col shadow-2xl`}>
            <SidebarContent {...sharedProps} showLabels onItemClick={onToggle} />
          </aside>
        </div>
      )}
    </>
  );
}

export default Sidebar;

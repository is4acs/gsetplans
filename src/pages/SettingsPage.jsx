import { useState, useCallback } from 'react';
import { 
  User, Bell, Moon, Sun, Smartphone, Shield, LogOut, 
  ChevronRight, Check, Eye, EyeOff, Vibrate, RefreshCw,
  Info
} from 'lucide-react';
import { useTheme, useAuth, useAmountVisibility } from '../contexts';
import { themes } from '../utils/theme';
import { useNativeFeatures } from '../hooks/useNativeFeatures';
import { useLocalStorage } from '../hooks/useUtils';

function SettingsPage({ onBack }) {
  const { theme, setTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const { showAmounts, toggleAmounts } = useAmountVisibility();
  const { haptic, isNative } = useNativeFeatures();
  const t = themes[theme];

  const [hapticEnabled, setHapticEnabled] = useLocalStorage('gset_haptic', true);

  const isDirection = profile?.role === 'dir' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin';

  const handleToggle = useCallback(async () => {
    if (isNative && hapticEnabled) await haptic('light');
  }, [isNative, hapticEnabled, haptic]);

  const handleHapticToggle = useCallback(async () => {
    if (isNative) await haptic('medium');
    setHapticEnabled(prev => !prev);
  }, [isNative, haptic, setHapticEnabled]);

  const handleThemeChange = useCallback(async (newTheme) => {
    if (isNative && hapticEnabled) await haptic('light');
    setTheme(newTheme);
  }, [isNative, hapticEnabled, haptic, setTheme]);

  const handleSignOut = useCallback(async () => {
    if (isNative) await haptic('medium');
    signOut();
  }, [isNative, haptic, signOut]);

  const Toggle = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`
        relative w-12 h-7 rounded-full transition-colors duration-200
        ${enabled ? 'bg-teal-500' : theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}
      `}
    >
      <span
        className={`
          absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm
          transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  const SettingItem = ({ icon: Icon, label, description, children, onClick, destructive }) => (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-4 p-4 transition-colors
        ${onClick ? 'cursor-pointer active:bg-gray-100 dark:active:bg-slate-700' : ''}
        ${destructive ? 'text-red-500' : ''}
      `}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        destructive 
          ? 'bg-red-500/10' 
          : theme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'
      }`}>
        <Icon className={`w-5 h-5 ${destructive ? '' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${destructive ? '' : t.text}`}>{label}</p>
        {description && <p className={`text-sm ${destructive ? 'text-red-400' : t.textMuted}`}>{description}</p>}
      </div>
      {children}
      {onClick && !children && <ChevronRight className={`w-5 h-5 ${t.textMuted}`} />}
    </div>
  );

  return (
    <div 
      className={`min-h-screen ${t.bg}`}
      style={{ 
        paddingBottom: isNative ? 'calc(80px + env(safe-area-inset-bottom))' : 0 
      }}
    >
      <div className={`${t.bgSecondary} border-b ${t.border} sticky top-0 z-10`} 
        style={{ paddingTop: 'env(safe-area-inset-top, 16px)' }}
      >
        <div className="p-4">
          <h1 className={`text-xl font-bold ${t.text}`}>Paramètres</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className={`rounded-2xl overflow-hidden ${t.card} border ${t.border}`}>
          <SettingItem
            icon={User}
            label={profile?.name || 'Utilisateur'}
            description={profile?.email}
          />
          <div className={`h-px ${t.border} mx-4`} />
          <SettingItem
            icon={Shield}
            label="Rôle"
            description={isSuperAdmin ? 'Super Administrateur' : isDirection ? 'Direction' : 'Technicien'}
          />
        </div>

        <div className={`rounded-2xl overflow-hidden ${t.card} border ${t.border}`}>
          <div className={`px-4 py-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${t.textMuted}`}>
              Apparence
            </p>
          </div>
          
          <div className="p-4">
            <p className={`font-medium ${t.text} mb-3`}>Thème</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: 'Clair', icon: Sun },
                { value: 'dark', label: 'Sombre', icon: Moon },
                { value: 'system', label: 'Auto', icon: Smartphone }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleThemeChange(opt.value)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                    ${theme === opt.value 
                      ? 'border-teal-500 bg-teal-500/10' 
                      : theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
                    }
                  `}
                >
                  <opt.icon className={`w-5 h-5 ${theme === opt.value ? 'text-teal-500' : t.textSecondary}`} />
                  <span className={`text-xs font-medium ${theme === opt.value ? 'text-teal-500' : t.text}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`rounded-2xl overflow-hidden ${t.card} border ${t.border}`}>
          <div className={`px-4 py-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${t.textMuted}`}>
              Confidentialité
            </p>
          </div>
          
          <SettingItem
            icon={showAmounts ? Eye : EyeOff}
            label="Afficher les montants"
            description={showAmounts ? 'Les montants sont visibles' : 'Les montants sont masqués'}
          >
            <Toggle enabled={showAmounts} onToggle={toggleAmounts} />
          </SettingItem>
        </div>

        {isNative && (
          <div className={`rounded-2xl overflow-hidden ${t.card} border ${t.border}`}>
            <div className={`px-4 py-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${t.textMuted}`}>
                Mobile
              </p>
            </div>
            
            <SettingItem
              icon={Vibrate}
              label="Retour haptique"
              description="Vibrations sur les actions"
            >
              <Toggle enabled={hapticEnabled} onToggle={handleHapticToggle} />
            </SettingItem>
          </div>
        )}

        <div className={`rounded-2xl overflow-hidden ${t.card} border ${t.border}`}>
          <SettingItem
            icon={LogOut}
            label="Déconnexion"
            description="Se déconnecter de l'application"
            onClick={handleSignOut}
            destructive
          />
        </div>

        <div className={`rounded-2xl overflow-hidden ${t.card} border ${t.border}`}>
          <SettingItem
            icon={Info}
            label="GSET PLANS"
            description="Version 1.1.0 • FTTH D3 Guyane"
          />
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

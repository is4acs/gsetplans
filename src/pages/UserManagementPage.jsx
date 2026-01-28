import { useState, useEffect, useMemo } from 'react';
import {
  Users, Plus, Trash2, X, Crown, User, ShieldCheck, ShieldAlert, UserCog, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useTheme } from '../contexts';
import { themes } from '../utils/theme';
import { supabase, updateProfile, getAvailableTechNames } from '../lib/supabase';

function UserManagementPage({ profiles, onRefresh, currentUserProfile }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [newUser, setNewUser] = useState({ email: '', name: '', username: '', role: 'tech' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedAlias, setSelectedAlias] = useState({});
  const [saving, setSaving] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [customAlias, setCustomAlias] = useState({});
  const [showDirSection, setShowDirSection] = useState(true);
  const [showTechSection, setShowTechSection] = useState(true);
  const [confirmRoleChange, setConfirmRoleChange] = useState(null);
  const [changingRole, setChangingRole] = useState(null);

  const isSuperAdmin = currentUserProfile?.role === 'superadmin';
  const isDir = currentUserProfile?.role === 'dir' || isSuperAdmin;
  const inputClass = `px-4 py-2.5 rounded-xl border ${t.input} ${t.text} outline-none transition-all`;

  useEffect(() => {
    const loadNames = async () => {
      const rccNames = await getAvailableTechNames();
      const dailyTechs = JSON.parse(localStorage.getItem('gsetplans_daily_techs') || '[]');
      const allNames = new Set([...rccNames, ...dailyTechs]);
      setAvailableNames(Array.from(allNames).sort());
    };
    loadNames();
  }, []);

  const usedAliases = useMemo(() => {
    const used = new Set();
    profiles.forEach(p => (p.aliases || []).forEach(a => used.add(a.toLowerCase())));
    return used;
  }, [profiles]);

  const superAdminProfiles = profiles.filter(p => p.role === 'superadmin');
  const dirProfiles = profiles.filter(p => p.role === 'dir');
  const techProfiles = profiles.filter(p => p.role === 'tech');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const roleToCreate = (newUser.role === 'dir' && !isSuperAdmin) ? 'tech' : newUser.role;
      const { error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: Math.random().toString(36).slice(-12),
        options: {
          data: { username: newUser.username.toLowerCase(), name: newUser.name, role: roleToCreate },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (signUpError) throw signUpError;
      setNewUser({ email: '', name: '', username: '', role: 'tech' });
      onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (profile) => {
    if (profile.role === 'superadmin') return;
    if (profile.role === 'dir' && !isSuperAdmin) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (error) throw error;
      onRefresh?.();
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleRoleChange = async (profile, newRole) => {
    if (!isSuperAdmin) return;
    if (profile.role === 'superadmin') return;
    setChangingRole(profile.id);
    try {
      await updateProfile(profile.id, { role: newRole });
      onRefresh?.();
    } catch (err) {
      console.error('Error changing role:', err);
    } finally {
      setChangingRole(null);
      setConfirmRoleChange(null);
    }
  };

  const handleAddAlias = async (profile) => {
    const aliasToAdd = profile._customAlias || selectedAlias[profile.id] || customAlias[profile.id];
    if (!aliasToAdd) return;
    setSaving(profile.id);
    try {
      const currentAliases = profile.aliases || [];
      await updateProfile(profile.id, { aliases: [...currentAliases, aliasToAdd] });
      setSelectedAlias(prev => ({ ...prev, [profile.id]: '' }));
      setCustomAlias(prev => ({ ...prev, [profile.id]: '' }));
      onRefresh?.();
    } catch (err) {
      console.error('Error adding alias:', err);
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveAlias = async (profile, alias) => {
    setSaving(profile.id);
    try {
      const newAliases = (profile.aliases || []).filter(a => a !== alias);
      await updateProfile(profile.id, { aliases: newAliases });
      onRefresh?.();
    } catch (err) {
      console.error('Error removing alias:', err);
    } finally {
      setSaving(null);
    }
  };

  const UserCard = ({ profile, canChangeRole = false, canDelete = false }) => {
    const isOwnProfile = profile.id === currentUserProfile?.id;
    const available = availableNames.filter(name =>
      !usedAliases.has(name.toLowerCase()) ||
      (profile.aliases || []).some(a => a.toLowerCase() === name.toLowerCase())
    );

    return (
      <div className={`p-4 ${t.bgHover} transition-colors`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              profile.role === 'superadmin' ? 'bg-amber-100 dark:bg-amber-500/20' :
              profile.role === 'dir' ? 'bg-purple-100 dark:bg-purple-500/20' :
              'bg-emerald-100 dark:bg-emerald-500/20'
            }`}>
              {profile.role === 'superadmin' ? <Crown className="w-5 h-5 text-amber-500" /> :
               profile.role === 'dir' ? <ShieldCheck className="w-5 h-5 text-purple-500" /> :
               <User className="w-5 h-5 text-emerald-500" />}
            </div>
            <div>
              <p className={`font-medium ${t.text}`}>
                {profile.name || profile.username}
                {isOwnProfile && <span className="ml-2 text-xs text-emerald-500">(vous)</span>}
              </p>
              <p className={`text-xs ${t.textMuted}`}>{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canChangeRole && !isOwnProfile && profile.role !== 'superadmin' && (
              confirmRoleChange === profile.id ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => handleRoleChange(profile, profile.role === 'tech' ? 'dir' : 'tech')} disabled={changingRole === profile.id}
                    className={`px-3 py-1.5 ${profile.role === 'tech' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-orange-500 hover:bg-orange-600'} text-white text-xs font-medium rounded-lg disabled:opacity-50 flex items-center gap-1`}>
                    {changingRole === profile.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (profile.role === 'tech' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />)}
                    {profile.role === 'tech' ? 'Promouvoir Dir' : 'Rétrograder Tech'}
                  </button>
                  <button onClick={() => setConfirmRoleChange(null)} className={`px-3 py-1.5 ${t.bgTertiary} ${t.textSecondary} text-xs font-medium rounded-lg`}>Annuler</button>
                </div>
              ) : <button onClick={() => setConfirmRoleChange(profile.id)} className={`p-2 ${t.textMuted} hover:text-purple-500 rounded-lg`} title="Changer le rôle"><UserCog className="w-4 h-4" /></button>
            )}
            {canDelete && !isOwnProfile && profile.role !== 'superadmin' && (
              confirmDelete === profile.id ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDeleteUser(profile)} disabled={deleting} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-1">{deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Supprimer</button>
                  <button onClick={() => setConfirmDelete(null)} className={`px-3 py-1.5 ${t.bgTertiary} ${t.textSecondary} text-xs font-medium rounded-lg`}>Annuler</button>
                </div>
              ) : <button onClick={() => setConfirmDelete(profile.id)} className={`p-2 ${t.textMuted} hover:text-red-500 rounded-lg`}><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        </div>
        {profile.role !== 'superadmin' && (
          <div>
            <label className={`text-xs ${t.textMuted} mb-2 block`}>Aliases (noms dans RCC & Daily)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(profile.aliases || []).map((alias, i) => (
                <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm ${t.bgTertiary} ${t.text}`}>
                  <span className={alias.startsWith('GSE') ? 'font-mono text-purple-500' : ''}>{alias}</span>
                  <button onClick={() => handleRemoveAlias(profile, alias)} disabled={saving === profile.id} className={`${t.textMuted} hover:text-red-500`}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {(profile.aliases || []).length === 0 && <span className={`text-xs ${t.textMuted} italic`}>Aucun alias</span>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={selectedAlias[profile.id] || ''} onChange={(e) => setSelectedAlias(prev => ({ ...prev, [profile.id]: e.target.value }))} className={`flex-1 ${inputClass}`}>
                <option value="">Sélectionner...</option>
                {available.length > 0 && <optgroup label="📊 Disponibles">{available.map(name => <option key={name} value={name}>{name}</option>)}</optgroup>}
              </select>
              <input type="text" placeholder="Ou saisir..." value={customAlias[profile.id] || ''} onChange={(e) => setCustomAlias(prev => ({ ...prev, [profile.id]: e.target.value }))} className={`flex-1 ${inputClass}`} />
              <button onClick={() => { const a = selectedAlias[profile.id] || customAlias[profile.id]; if (a) handleAddAlias({ ...profile, _customAlias: a }); }} disabled={(!selectedAlias[profile.id] && !customAlias[profile.id]) || saving === profile.id} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2">
                {saving === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}<span className="hidden sm:inline">Ajouter</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
        <h4 className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'} mb-2 flex items-center gap-2`}><Users className="w-4 h-4" /> Gestion des comptes</h4>
        <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
          {isSuperAdmin ? "Super Admin : vous pouvez gérer tous les comptes et promouvoir/rétrograder la Direction." : "Créez des comptes techniciens. Ils recevront un email pour définir leur mot de passe."}
        </p>
      </div>

      <div className={`rounded-2xl border ${t.card} p-4`}>
        <h3 className={`font-semibold ${t.text} mb-4`}>Créer un compte</h3>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="text" placeholder="Identifiant" value={newUser.username} onChange={(e) => setNewUser(u => ({ ...u, username: e.target.value }))} className={inputClass} required />
            <input type="text" placeholder="Nom complet" value={newUser.name} onChange={(e) => setNewUser(u => ({ ...u, name: e.target.value }))} className={inputClass} required />
            <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser(u => ({ ...u, email: e.target.value }))} className={inputClass} required />
            {isSuperAdmin ? (
              <select value={newUser.role} onChange={(e) => setNewUser(u => ({ ...u, role: e.target.value }))} className={inputClass}>
                <option value="tech">Technicien</option>
                <option value="dir">Direction</option>
              </select>
            ) : (
              <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer
              </button>
            )}
          </div>
          {isSuperAdmin && (
            <button type="submit" disabled={creating} className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer le compte
            </button>
          )}
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {isSuperAdmin && superAdminProfiles.length > 0 && (
        <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
          <div className={`p-4 border-b ${t.border} flex items-center gap-2`}><Crown className="w-5 h-5 text-amber-500" /><h3 className={`font-semibold ${t.text}`}>Super Admin ({superAdminProfiles.length})</h3></div>
          <div className={`divide-y ${t.borderLight}`}>{superAdminProfiles.map(p => <UserCard key={p.id} profile={p} canChangeRole={false} canDelete={false} />)}</div>
        </div>
      )}

      {isSuperAdmin && (
        <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
          <button onClick={() => setShowDirSection(!showDirSection)} className={`w-full p-4 border-b ${t.border} flex items-center justify-between ${t.bgHover}`}>
            <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-purple-500" /><h3 className={`font-semibold ${t.text}`}>Direction ({dirProfiles.length})</h3></div>
            {showDirSection ? <ChevronUp className={`w-5 h-5 ${t.textMuted}`} /> : <ChevronDown className={`w-5 h-5 ${t.textMuted}`} />}
          </button>
          {showDirSection && (
            <div className={`divide-y ${t.borderLight}`}>
              {dirProfiles.length > 0 ? dirProfiles.map(p => <UserCard key={p.id} profile={p} canChangeRole={isSuperAdmin} canDelete={isSuperAdmin} />) : (
                <div className={`p-8 text-center ${t.textMuted}`}><ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Aucun membre Direction</p><p className="text-xs mt-1">Promouvez un technicien</p></div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
        <button onClick={() => setShowTechSection(!showTechSection)} className={`w-full p-4 border-b ${t.border} flex items-center justify-between ${t.bgHover}`}>
          <div className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /><h3 className={`font-semibold ${t.text}`}>Techniciens ({techProfiles.length})</h3></div>
          {showTechSection ? <ChevronUp className={`w-5 h-5 ${t.textMuted}`} /> : <ChevronDown className={`w-5 h-5 ${t.textMuted}`} />}
        </button>
        {showTechSection && (
          <div className={`divide-y ${t.borderLight} max-h-[600px] overflow-y-auto`}>
            {techProfiles.length > 0 ? techProfiles.map(p => <UserCard key={p.id} profile={p} canChangeRole={isSuperAdmin} canDelete={isDir} />) : (
              <div className={`p-12 text-center ${t.textMuted}`}><User className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Aucun technicien</p></div>
            )}
          </div>
        )}
      </div>

      <div className={`rounded-2xl p-4 border ${t.card}`}>
        <h4 className={`text-sm font-medium ${t.text} mb-3`}>Légende des rôles</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`flex items-start gap-3 p-3 rounded-xl ${t.bgTertiary}`}><Crown className="w-5 h-5 text-amber-500 flex-shrink-0" /><div><p className={`font-medium text-sm ${t.text}`}>Super Admin</p><p className={`text-xs ${t.textMuted}`}>Accès total + gestion Direction</p></div></div>
          <div className={`flex items-start gap-3 p-3 rounded-xl ${t.bgTertiary}`}><ShieldCheck className="w-5 h-5 text-purple-500 flex-shrink-0" /><div><p className={`font-medium text-sm ${t.text}`}>Direction</p><p className={`text-xs ${t.textMuted}`}>Import, équipe, gestion techs</p></div></div>
          <div className={`flex items-start gap-3 p-3 rounded-xl ${t.bgTertiary}`}><User className="w-5 h-5 text-emerald-500 flex-shrink-0" /><div><p className={`font-medium text-sm ${t.text}`}>Technicien</p><p className={`text-xs ${t.textMuted}`}>Dashboard personnel</p></div></div>
        </div>
      </div>
    </div>
  );
}

export default UserManagementPage;

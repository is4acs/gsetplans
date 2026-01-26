// =====================================================
// GSET PLANS - Modifications App.jsx pour Super Admin
// =====================================================
// Appliquer ces modifications dans l'ordre
// =====================================================

// ========== MODIFICATION 1 ==========
// Ligne ~1907 - Ajouter isSuperAdmin après isDirection
// AVANT:
const isDirection = profile?.role === 'dir';

// APRÈS:
const isDirection = profile?.role === 'dir' || profile?.role === 'superadmin';
const isSuperAdmin = profile?.role === 'superadmin';


// ========== MODIFICATION 2 ==========
// Ligne ~2029-2030 - Modifier l'affichage du rôle dans la sidebar
// AVANT:
<span className={`text-xs ${isDirection ? 'text-purple-400' : 'text-emerald-400'}`}>
  {isDirection ? 'Direction' : 'Technicien'}
</span>

// APRÈS:
<span className={`text-xs ${isSuperAdmin ? 'text-amber-400' : isDirection ? 'text-purple-400' : 'text-emerald-400'}`}>
  {isSuperAdmin ? 'Super Admin' : isDirection ? 'Direction' : 'Technicien'}
</span>


// ========== MODIFICATION 3 ==========
// Ligne ~2052 - Même modification dans la sidebar mobile
// AVANT:
<span className={`text-xs ${isDirection ? 'text-purple-400' : 'text-emerald-400'}`}>
  {isDirection ? 'Direction' : 'Technicien'}
</span>

// APRÈS:
<span className={`text-xs ${isSuperAdmin ? 'text-amber-400' : isDirection ? 'text-purple-400' : 'text-emerald-400'}`}>
  {isSuperAdmin ? 'Super Admin' : isDirection ? 'Direction' : 'Technicien'}
</span>


// ========== MODIFICATION 4 ==========
// Ligne ~2127 - Passer currentUserProfile au composant UserManagementPage
// AVANT:
{isDirection && view === 'users' && <UserManagementPage profiles={profiles} onRefresh={loadData} />}

// APRÈS:
{isDirection && view === 'users' && <UserManagementPage profiles={profiles} onRefresh={loadData} currentUserProfile={profile} />}


// ========== MODIFICATION 5 ==========
// Remplacer entièrement la fonction UserManagementPage (lignes ~941-1095)
// par la nouvelle version dans UserManagementPage-v2.jsx
// IMPORTANT: Ajouter les imports nécessaires en haut du fichier:
import { Crown, ShieldCheck, ShieldAlert, UserCog, ChevronUp } from 'lucide-react';


// ========== MODIFICATION 6 ==========
// Dans les imports lucide-react (ligne ~3-8), ajouter:
Crown, ShieldCheck, ShieldAlert, UserCog, ChevronUp
// (certains peuvent déjà être présents)


// =====================================================
// NOUVELLE FONCTION UserManagementPage COMPLÈTE
// À copier/coller pour remplacer l'ancienne (lignes 941-1095)
// =====================================================

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
    } catch (err) { setError(err.message); } finally { setCreating(false); }
  };

  const handleDeleteUser = async (profile) => {
    if (profile.role === 'superadmin') return;
    if (profile.role === 'dir' && !isSuperAdmin) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (error) throw error;
      onRefresh?.();
    } catch (err) { console.error('Error deleting user:', err); } finally { setDeleting(false); setConfirmDelete(null); }
  };

  const handleRoleChange = async (profile, newRole) => {
    if (!isSuperAdmin) return;
    if (profile.role === 'superadmin') return;
    setChangingRole(profile.id);
    try {
      await updateProfile(profile.id, { role: newRole });
      onRefresh?.();
    } catch (err) { console.error('Error changing role:', err); } finally { setChangingRole(null); setConfirmRoleChange(null); }
  };

  const handleAddAlias = async (profile) => {
    const alias = profile._customAlias || selectedAlias[profile.id];
    if (!alias) return;
    setSaving(profile.id);
    try { 
      await updateProfile(profile.id, { aliases: [...(profile.aliases || []), alias] }); 
      setSelectedAlias(prev => ({ ...prev, [profile.id]: '' })); 
      setCustomAlias(prev => ({ ...prev, [profile.id]: '' }));
      onRefresh?.(); 
    } catch (err) { console.error(err); } finally { setSaving(null); }
  };

  const handleRemoveAlias = async (profile, aliasToRemove) => {
    setSaving(profile.id);
    try { await updateProfile(profile.id, { aliases: (profile.aliases || []).filter(a => a !== aliasToRemove) }); onRefresh?.(); } catch (err) { console.error(err); } finally { setSaving(null); }
  };

  const getAvailableForUser = (profile) => {
    const userAliases = new Set((profile.aliases || []).map(a => a.toLowerCase()));
    return availableNames.filter(name => !usedAliases.has(name.toLowerCase()) || userAliases.has(name.toLowerCase())).filter(name => !userAliases.has(name.toLowerCase()));
  };

  const superAdminProfiles = profiles.filter(p => p.role === 'superadmin');
  const dirProfiles = profiles.filter(p => p.role === 'dir');
  const techProfiles = profiles.filter(p => p.role === 'tech');
  const inputClass = `px-3 py-2 rounded-xl border outline-none ${t.input}`;

  const RoleBadge = ({ role }) => {
    const cfg = {
      superadmin: { bg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white', icon: Crown, label: 'Super Admin' },
      dir: { bg: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white', icon: ShieldCheck, label: 'Direction' },
      tech: { bg: `${t.bgTertiary} ${t.textSecondary}`, icon: User, label: 'Technicien' }
    }[role] || { bg: t.bgTertiary, icon: User, label: role };
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg}`}><cfg.icon className="w-3 h-3" />{cfg.label}</span>;
  };

  const UserCard = ({ profile, canChangeRole, canDelete }) => {
    const available = getAvailableForUser(profile);
    const isOwnProfile = profile.id === currentUserProfile?.id;
    const iconBg = profile.role === 'superadmin' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : profile.role === 'dir' ? 'bg-gradient-to-br from-purple-400 to-indigo-500' : t.accentLight;
    const IconComp = profile.role === 'superadmin' ? Crown : profile.role === 'dir' ? ShieldCheck : User;
    
    return (
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}><IconComp className={`w-6 h-6 ${profile.role !== 'tech' ? 'text-white' : ''}`} /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-medium ${t.text}`}>{profile.name}</p>
                <RoleBadge role={profile.role} />
                {isOwnProfile && <span className="text-xs text-emerald-500 font-medium">(Vous)</span>}
              </div>
              <p className={`text-xs ${t.textMuted}`}>@{profile.username} • {profile.email}</p>
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

      {/* Super Admins */}
      {isSuperAdmin && superAdminProfiles.length > 0 && (
        <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
          <div className={`p-4 border-b ${t.border} flex items-center gap-2`}><Crown className="w-5 h-5 text-amber-500" /><h3 className={`font-semibold ${t.text}`}>Super Admin ({superAdminProfiles.length})</h3></div>
          <div className={`divide-y ${t.borderLight}`}>{superAdminProfiles.map(p => <UserCard key={p.id} profile={p} canChangeRole={false} canDelete={false} />)}</div>
        </div>
      )}

      {/* Direction */}
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

      {/* Techniciens */}
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

      {/* Légende */}
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

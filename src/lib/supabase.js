import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwaflcfflbzfuqmxstbz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3YWZsY2ZmbGJ6ZnVxbXhzdGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjk1NjcsImV4cCI6MjA4NDYwNTU2N30.NFBfqMdATmOt8YnDg0JcXkV8Y4AwN87dlX8wtN70V2Y';

// Create Supabase client with robust config
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-client-info': 'gsetplans' }
  },
  db: {
    schema: 'public'
  }
});

// Helper: Check if error is an abort error (should be ignored)
const isAbortError = (err) => {
  if (!err) return false;
  const msg = err.message || err.toString();
  return msg.includes('abort') || msg.includes('AbortError') || msg.includes('signal') || err.name === 'AbortError';
};

export const isSupabaseConfigured = () => supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co');

// ========== AUTH FUNCTIONS ==========

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error && !isAbortError(error)) throw error;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  } catch (err) {
    if (isAbortError(err)) return null;
    throw err;
  }
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    if (isAbortError(err)) return null;
    throw err;
  }
}

export async function getSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (err) {
    if (isAbortError(err)) return null;
    throw err;
  }
}

// ========== PROFILES ==========

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error && error.code !== 'PGRST116' && !isAbortError(error)) throw error;
    return data;
  } catch (err) {
    if (isAbortError(err)) return null;
    throw err;
  }
}

export async function getAllProfiles() {
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (error && !isAbortError(error)) throw error;
    return data || [];
  } catch (err) {
    if (isAbortError(err)) return [];
    throw err;
  }
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase.from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

// ========== PRICES ==========

export async function getOrangePrices() {
  try {
    const { data, error } = await supabase.from('orange_prices').select('*').order('code');
    if (error && !isAbortError(error)) {
      console.error('Error fetching orange prices:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    if (isAbortError(err)) return [];
    console.error('Error fetching orange prices:', err);
    return [];
  }
}

export async function updateOrangePrice(code, gsetPrice, techPrice) {
  const { data, error } = await supabase.from('orange_prices')
    .upsert({ code, gset_price: gsetPrice, tech_price: techPrice, updated_at: new Date().toISOString() }, { onConflict: 'code' })
    .select().single();
  if (error) throw error;
  return data;
}

export async function getCanalPrices() {
  try {
    const { data, error } = await supabase.from('canal_prices').select('*').order('code');
    if (error && !isAbortError(error)) {
      console.error('Error fetching canal prices:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    if (isAbortError(err)) return [];
    console.error('Error fetching canal prices:', err);
    return [];
  }
}

export async function updateCanalPrice(code, gsetPrice, techPrice) {
  const { data, error } = await supabase.from('canal_prices')
    .upsert({ code, gset_price: gsetPrice, tech_price: techPrice, updated_at: new Date().toISOString() }, { onConflict: 'code' })
    .select().single();
  if (error) throw error;
  return data;
}

// ========== INTERVENTIONS ==========

export async function getOrangeInterventions(filters = {}) {
  try {
    let query = supabase.from('orange_interventions').select('*');
    if (filters.periode) query = query.eq('periode', filters.periode);
    if (filters.tech) query = query.eq('tech', filters.tech);
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.month) query = query.eq('month', filters.month);
    if (filters.week) query = query.eq('week_number', filters.week);
    const { data, error } = await query.order('intervention_date', { ascending: false });
    if (error && !isAbortError(error)) {
      console.error('Error fetching orange interventions:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    if (isAbortError(err)) return [];
    console.error('Error fetching orange interventions:', err);
    return [];
  }
}

export async function insertOrangeInterventions(interventions) {
  const { data, error } = await supabase.from('orange_interventions').insert(interventions).select();
  if (error) throw error;
  return data;
}

export async function deleteOrangeInterventionsByPeriode(periode) {
  const { error } = await supabase.from('orange_interventions').delete().eq('periode', periode);
  if (error) throw error;
}

export async function getCanalInterventions(filters = {}) {
  try {
    let query = supabase.from('canal_interventions').select('*');
    if (filters.periode) query = query.eq('periode', filters.periode);
    if (filters.tech) query = query.eq('tech', filters.tech);
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.month) query = query.eq('month', filters.month);
    if (filters.week) query = query.eq('week_number', filters.week);
    const { data, error } = await query.order('intervention_date', { ascending: false });
    if (error && !isAbortError(error)) {
      console.error('Error fetching canal interventions:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    if (isAbortError(err)) return [];
    console.error('Error fetching canal interventions:', err);
    return [];
  }
}

export async function insertCanalInterventions(interventions) {
  const { data, error } = await supabase.from('canal_interventions').insert(interventions).select();
  if (error) throw error;
  return data;
}

export async function deleteCanalInterventionsByPeriode(periode) {
  const { error } = await supabase.from('canal_interventions').delete().eq('periode', periode);
  if (error) throw error;
}

// ========== IMPORTS ==========

export async function getImports() {
  try {
    const { data, error } = await supabase.from('imports').select('*').order('created_at', { ascending: false });
    if (error && !isAbortError(error)) {
      console.error('Error fetching imports:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    if (isAbortError(err)) return [];
    console.error('Error fetching imports:', err);
    return [];
  }
}

export async function createImport(importData) {
  const { data, error } = await supabase.from('imports').insert(importData).select().single();
  if (error) throw error;
  return data;
}

export async function deleteImport(id, type, periode) {
  if (type === 'orange') {
    await deleteOrangeInterventionsByPeriode(periode);
  } else {
    await deleteCanalInterventionsByPeriode(periode);
  }
  const { error } = await supabase.from('imports').delete().eq('id', id);
  if (error) throw error;
}

// ========== STATS ==========

export async function getAvailablePeriods() {
  try {
    const [orangeResult, canalResult] = await Promise.all([
      supabase.from('orange_interventions').select('year, month, week_number'),
      supabase.from('canal_interventions').select('year, month, week_number'),
    ]);
    const allRecords = [...(orangeResult.data || []), ...(canalResult.data || [])];
    const years = new Set();
    const monthsByYear = {};
    const weeksByYearMonth = {};
    allRecords.forEach(r => {
      if (r.year && r.month) {
        years.add(r.year);
        if (!monthsByYear[r.year]) monthsByYear[r.year] = new Set();
        monthsByYear[r.year].add(r.month);
        if (r.week_number) {
          const key = `${r.year}_${r.month}`;
          if (!weeksByYearMonth[key]) weeksByYearMonth[key] = new Set();
          weeksByYearMonth[key].add(r.week_number);
        }
      }
    });
    return {
      years: Array.from(years).sort((a, b) => b - a),
      monthsByYear: Object.fromEntries(Object.entries(monthsByYear).map(([y, m]) => [y, Array.from(m).sort((a, b) => a - b)])),
      weeksByYearMonth: Object.fromEntries(Object.entries(weeksByYearMonth).map(([k, w]) => [k, Array.from(w).sort((a, b) => a - b)])),
    };
  } catch (err) {
    if (isAbortError(err)) return { years: [], monthsByYear: {}, weeksByYearMonth: {} };
    console.error('Error fetching periods:', err);
    return { years: [], monthsByYear: {}, weeksByYearMonth: {} };
  }
}

export async function getAvailableTechNames() {
  try {
    const [orangeResult, canalResult] = await Promise.all([
      supabase.from('orange_interventions').select('tech'),
      supabase.from('canal_interventions').select('tech'),
    ]);
    const names = new Set();
    (orangeResult.data || []).forEach(r => names.add(r.tech));
    (canalResult.data || []).forEach(r => names.add(r.tech));
    return Array.from(names).sort();
  } catch (err) {
    if (isAbortError(err)) return [];
    console.error('Error fetching tech names:', err);
    return [];
  }
}

// ========== DAILY TRACKING (SUIVI JOURNALIER) ==========

export async function getDailyTracking(filters = {}) {
  try {
    let query = supabase.from('daily_tracking').select('*');
    
    if (filters.technicien) query = query.eq('technicien', filters.technicien);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('date', filters.dateTo);
    if (filters.periode) query = query.eq('periode', filters.periode);
    
    const { data, error } = await query.order('date', { ascending: false });
    if (error && !isAbortError(error)) {
      console.error('Error fetching daily tracking:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    if (isAbortError(err)) return [];
    console.error('Error fetching daily tracking:', err);
    return [];
  }
}

export async function insertDailyTracking(records) {
  // Utilise upsert pour éviter les doublons
  const { data, error } = await supabase
    .from('daily_tracking')
    .upsert(records, { 
      onConflict: 'technicien,date,type',
      ignoreDuplicates: false 
    })
    .select();
  if (error) throw error;
  return data;
}

export async function deleteDailyTrackingByPeriode(periode) {
  const { error } = await supabase
    .from('daily_tracking')
    .delete()
    .eq('periode', periode);
  if (error) throw error;
}

export async function getDailyImports() {
  try {
    const { data, error } = await supabase
      .from('daily_imports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error && !isAbortError(error)) {
      console.error('Error fetching daily imports:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    if (isAbortError(err)) return [];
    console.error('Error fetching daily imports:', err);
    return [];
  }
}

export async function createDailyImport(importData) {
  const { data, error } = await supabase
    .from('daily_imports')
    .insert(importData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDailyImport(id, periode) {
  // Supprimer d'abord les données associées
  await deleteDailyTrackingByPeriode(periode);
  // Puis supprimer l'import
  const { error } = await supabase
    .from('daily_imports')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getDailyTrackingTechniciens() {
  try {
    const { data, error } = await supabase
      .from('daily_tracking')
      .select('technicien')
      .order('technicien');
    if (error && !isAbortError(error)) return [];
    const unique = [...new Set((data || []).map(d => d.technicien))];
    return unique.sort();
  } catch (err) {
    if (isAbortError(err)) return [];
    return [];
  }
}

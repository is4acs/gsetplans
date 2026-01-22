import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ========== AUTH FUNCTIONS ==========

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function createUser(email, password, metadata) {
  // Admin creates user with Supabase Admin API (requires service role key)
  // For now, we use signUp which sends confirmation email
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata, // { username, name, role }
    }
  });
  if (error) throw error;
  return data;
}

export async function inviteUser(email, metadata) {
  // Use Supabase invite (sends magic link)
  const { data, error } = await supabase.auth.admin?.inviteUserByEmail(email, {
    data: metadata,
  });
  // If admin API not available, fall back to regular signup with random password
  if (error) {
    const tempPassword = Math.random().toString(36).slice(-12);
    return createUser(email, tempPassword, metadata);
  }
  return data;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ========== PROFILES ==========

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getProfileByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getProfileByUsername(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(userId) {
  // This will cascade delete the auth user too
  const { error } = await supabase.auth.admin?.deleteUser(userId);
  if (error) {
    // Fallback: just delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw profileError;
  }
}

// ========== PRICES ==========

export async function getOrangePrices() {
  const { data, error } = await supabase
    .from('orange_prices')
    .select('*')
    .order('code');
  if (error) throw error;
  return data || [];
}

export async function updateOrangePrice(code, gsetPrice, techPrice) {
  const { data, error } = await supabase
    .from('orange_prices')
    .upsert({ 
      code, 
      gset_price: gsetPrice, 
      tech_price: techPrice,
      updated_at: new Date().toISOString()
    }, { onConflict: 'code' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCanalPrices() {
  const { data, error } = await supabase
    .from('canal_prices')
    .select('*')
    .order('code');
  if (error) throw error;
  return data || [];
}

export async function updateCanalPrice(code, gsetPrice, techPrice) {
  const { data, error } = await supabase
    .from('canal_prices')
    .upsert({ 
      code, 
      gset_price: gsetPrice, 
      tech_price: techPrice,
      updated_at: new Date().toISOString()
    }, { onConflict: 'code' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ========== INTERVENTIONS ==========

export async function getOrangeInterventions(filters = {}) {
  let query = supabase.from('orange_interventions').select('*');
  
  if (filters.periode) query = query.eq('periode', filters.periode);
  if (filters.tech) query = query.eq('tech', filters.tech);
  if (filters.year) query = query.eq('year', filters.year);
  if (filters.month) query = query.eq('month', filters.month);
  if (filters.week) query = query.eq('week_number', filters.week);
  
  const { data, error } = await query.order('intervention_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertOrangeInterventions(interventions) {
  const { data, error } = await supabase
    .from('orange_interventions')
    .insert(interventions)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteOrangeInterventionsByPeriode(periode) {
  const { error } = await supabase
    .from('orange_interventions')
    .delete()
    .eq('periode', periode);
  if (error) throw error;
}

export async function getCanalInterventions(filters = {}) {
  let query = supabase.from('canal_interventions').select('*');
  
  if (filters.periode) query = query.eq('periode', filters.periode);
  if (filters.tech) query = query.eq('tech', filters.tech);
  if (filters.year) query = query.eq('year', filters.year);
  if (filters.month) query = query.eq('month', filters.month);
  if (filters.week) query = query.eq('week_number', filters.week);
  
  const { data, error } = await query.order('intervention_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertCanalInterventions(interventions) {
  const { data, error } = await supabase
    .from('canal_interventions')
    .insert(interventions)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteCanalInterventionsByPeriode(periode) {
  const { error } = await supabase
    .from('canal_interventions')
    .delete()
    .eq('periode', periode);
  if (error) throw error;
}

// ========== IMPORTS ==========

export async function getImports() {
  const { data, error } = await supabase
    .from('imports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createImport(importData) {
  const { data, error } = await supabase
    .from('imports')
    .insert(importData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteImport(id, type, periode) {
  // Delete interventions first
  if (type === 'orange') {
    await deleteOrangeInterventionsByPeriode(periode);
  } else {
    await deleteCanalInterventionsByPeriode(periode);
  }
  
  // Delete import record
  const { error } = await supabase
    .from('imports')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ========== STATS ==========

export async function getAvailablePeriods() {
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
    monthsByYear: Object.fromEntries(
      Object.entries(monthsByYear).map(([y, m]) => [y, Array.from(m).sort((a, b) => a - b)])
    ),
    weeksByYearMonth: Object.fromEntries(
      Object.entries(weeksByYearMonth).map(([k, w]) => [k, Array.from(w).sort((a, b) => a - b)])
    ),
  };
}

export async function getAvailableTechNames() {
  const [orangeResult, canalResult] = await Promise.all([
    supabase.from('orange_interventions').select('tech'),
    supabase.from('canal_interventions').select('tech'),
  ]);
  
  const names = new Set();
  (orangeResult.data || []).forEach(r => names.add(r.tech));
  (canalResult.data || []).forEach(r => names.add(r.tech));
  
  return Array.from(names).sort();
}

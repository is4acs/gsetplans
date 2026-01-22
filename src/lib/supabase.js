import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CORRECTION FORCEE : On commente la lecture du .env pour l'instant
// ------------------------------------------------------------------
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '...';
const supabaseUrl = 'https://wwaflcfflbzfuqmxstbz.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3YWZsY2ZmbGJ6ZnVxbXhzdGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjk1NjcsImV4cCI6MjA4NDYwNTU2N30.NFBfqMdATmOt8YnDg0JcXkV8Y4AwN87dlX8wtN70V2Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co');
};

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
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
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

// ========== PRICES ==========

export async function getOrangePrices() {
  const { data, error } = await supabase
    .from('orange_prices')
    .select('*')
    .order('code');
  if (error) {
    console.error('Error fetching orange prices:', error);
    return [];
  }
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
  if (error) {
    console.error('Error fetching canal prices:', error);
    return [];
  }
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
  if (error) {
    console.error('Error fetching orange interventions:', error);
    return [];
  }
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
  if (error) {
    console.error('Error fetching canal interventions:', error);
    return [];
  }
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
  if (error) {
    console.error('Error fetching imports:', error);
    return [];
  }
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
  if (type === 'orange') {
    await deleteOrangeInterventionsByPeriode(periode);
  } else {
    await deleteCanalInterventionsByPeriode(periode);
  }
  
  const { error } = await supabase
    .from('imports')
    .delete()
    .eq('id', id);
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
      monthsByYear: Object.fromEntries(
        Object.entries(monthsByYear).map(([y, m]) => [y, Array.from(m).sort((a, b) => a - b)])
      ),
      weeksByYearMonth: Object.fromEntries(
        Object.entries(weeksByYearMonth).map(([k, w]) => [k, Array.from(w).sort((a, b) => a - b)])
      ),
    };
  } catch (error) {
    console.error('Error fetching periods:', error);
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
  } catch (error) {
    console.error('Error fetching tech names:', error);
    return [];
  }
}

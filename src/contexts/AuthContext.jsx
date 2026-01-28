import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  supabase,
  signIn as supabaseSignIn,
  signOut as supabaseSignOut,
  getSession,
  getProfile,
  onAuthStateChange
} from '../lib/supabase';
import { isAbortError } from '../utils/helpers';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbConfigured, setDbConfigured] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Check URL for recovery token
  const checkRecoveryUrl = useCallback(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    return hash.includes('type=recovery') ||
      hash.includes('access_token') ||
      search.includes('type=recovery') ||
      hash.includes('error_code=');
  }, []);

  // Initialize authentication
  useEffect(() => {
    let isMounted = true;
    let initialCheckDone = false;

    const initAuth = async () => {
      try {
        const isRecovery = checkRecoveryUrl();

        if (isRecovery) {
          await new Promise(r => setTimeout(r, 500));
          if (!isMounted) return;

          const sess = await getSession();
          if (sess) {
            setSession(sess);
            setShowResetPassword(true);
            setLoading(false);
            return;
          } else {
            setError('Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.');
            setLoading(false);
            return;
          }
        }

        await new Promise(r => setTimeout(r, 100));
        if (!isMounted) return;

        // Check DB first
        const { error: testError } = await supabase.from('profiles').select('id').limit(1);
        if (!isMounted) return;

        if (testError && (testError.code === '42P01' || testError.message?.includes('relation'))) {
          setDbConfigured(false);
          setLoading(false);
          return;
        }

        const sess = await getSession();
        if (!isMounted) return;
        setSession(sess);

        if (sess?.user) {
          try {
            const prof = await getProfile(sess.user.id);
            if (isMounted) setProfile(prof);
          } catch (err) {
            if (!isAbortError(err)) console.error('Error fetching profile:', err);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        if (isAbortError(err)) {
          console.log('Init aborted, retrying...');
          setTimeout(() => { if (isMounted) initAuth(); }, 500);
          return;
        }
        console.error('Auth init error:', err);
        if (err.message?.includes('relation') || err.code === '42P01') {
          setDbConfigured(false);
        } else {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          initialCheckDone = true;
        }
      }
    };

    initAuth();

    const { data: { subscription } } = onAuthStateChange(async (event, sess) => {
      console.log('Auth event:', event);
      if (event === 'INITIAL_SESSION' || !isMounted || !initialCheckDone) return;
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetPassword(true);
        return;
      }
      setSession(prev => prev?.user?.id === sess?.user?.id ? prev : sess);
      if (sess?.user && event === 'SIGNED_IN') {
        try {
          const prof = await getProfile(sess.user.id);
          if (isMounted) setProfile(prof);
        } catch (err) {
          if (!isAbortError(err)) console.error(err);
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkRecoveryUrl]);

  const signIn = async (email, password) => {
    const data = await supabaseSignIn(email, password);
    return data;
  };

  const signOut = async () => {
    try {
      await supabaseSignOut();
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetComplete = async () => {
    setShowResetPassword(false);
    window.history.replaceState(null, '', window.location.pathname);
    await new Promise(r => setTimeout(r, 500));
    try {
      const sess = await getSession();
      if (sess) {
        setSession(sess);
        if (sess.user) {
          const prof = await getProfile(sess.user.id);
          setProfile(prof);
        }
      }
    } catch (e) {
      console.error('Error after password reset:', e);
    }
  };

  const clearError = () => {
    setError(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const value = {
    session,
    user: session?.user,
    profile,
    loading,
    error,
    dbConfigured,
    showResetPassword,
    signIn,
    signOut,
    handleResetComplete,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

import { AlertCircle } from 'lucide-react';
import { ThemeProvider, AuthProvider, AmountVisibilityProvider, useAuth } from './contexts';
import { LoadingSpinner } from './components/ui';
import { LoginPage, ResetPasswordPage, MainDashboard } from './pages';

// Error display component
function ErrorDisplay({ error, onRetry, onClear }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Erreur</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onClear}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600"
          >
            Retour à la connexion
          </button>
          <button
            onClick={onRetry}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
          >
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}

// DB Configuration Required display
function DbConfigRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Configuration requise</h2>
        <p className="text-gray-500 mb-4">Exécutez le script SQL dans Supabase.</p>
      </div>
    </div>
  );
}

// Loading display
function LoadingDisplay() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
    </div>
  );
}

// App content component that uses auth context
function AppContent() {
  const {
    session,
    loading,
    error,
    dbConfigured,
    showResetPassword,
    handleResetComplete,
    clearError
  } = useAuth();

  if (loading) {
    return <LoadingDisplay />;
  }

  if (!dbConfigured) {
    return <DbConfigRequired />;
  }

  if (showResetPassword) {
    return <ResetPasswordPage onComplete={handleResetComplete} />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => window.location.reload()}
        onClear={clearError}
      />
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return <MainDashboard />;
}

// Main App component with all providers
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AmountVisibilityProvider>
          <AppContent />
        </AmountVisibilityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AmountVisibilityContext = createContext();

export function AmountVisibilityProvider({ children }) {
  const [showAmounts, setShowAmounts] = useState(() => {
    const stored = localStorage.getItem('gsetplans-show-amounts');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('gsetplans-show-amounts', String(showAmounts));
  }, [showAmounts]);

  const toggleAmounts = useCallback(() => {
    setShowAmounts(prev => !prev);
  }, []);

  const value = useMemo(() => ({ showAmounts, toggleAmounts }), [showAmounts, toggleAmounts]);

  return (
    <AmountVisibilityContext.Provider value={value}>
      {children}
    </AmountVisibilityContext.Provider>
  );
}

export function useAmountVisibility() {
  const context = useContext(AmountVisibilityContext);
  if (!context) {
    throw new Error('useAmountVisibility must be used within an AmountVisibilityProvider');
  }
  return context;
}

export default AmountVisibilityContext;

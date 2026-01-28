import { createContext, useContext, useState } from 'react';

const AmountVisibilityContext = createContext();

export function AmountVisibilityProvider({ children }) {
  const [showAmounts, setShowAmounts] = useState(true);

  const toggleAmounts = () => {
    setShowAmounts(prev => !prev);
  };

  return (
    <AmountVisibilityContext.Provider value={{ showAmounts, toggleAmounts }}>
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

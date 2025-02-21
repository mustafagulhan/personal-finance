import React, { createContext, useContext, useState } from 'react';

const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
  const [balances, setBalances] = useState({
    netBalance: 0,
    vaultBalance: 0
  });

  const updateBalances = (newBalances) => {
    setBalances(newBalances);
  };

  return (
    <BalanceContext.Provider value={{ balances, updateBalances }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext); 
import React, { createContext, useState, useContext } from 'react';

// Create the context
const SharedDataContext = createContext();

// Create a provider component
export const SharedDataProvider = ({ children }) => {
  const [sharedData, setSharedData] = useState({});

  return (
    <SharedDataContext.Provider value={{ sharedData, setSharedData }}>
      {children}
    </SharedDataContext.Provider>
  );
};

// Custom hook to use the shared data easily
export const useSharedData = () => useContext(SharedDataContext);
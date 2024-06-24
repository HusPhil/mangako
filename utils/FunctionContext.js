import React, { createContext, useState } from 'react';

const FunctionContext = createContext();

export const FunctionProvider = ({ children }) => {
  const [mainChildFunction, setMainChildFunction] = useState(null);

  return (
    <FunctionContext.Provider value={{ mainChildFunction, setMainChildFunction }}>
      {children}
    </FunctionContext.Provider>
  );
};

export default FunctionContext;

// src/context/ThemeContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { lightTheme, darkTheme } from '../themes/themeConfig';

// 1. Criação do Contexto
const ThemeContext = createContext();

// 2. Criação do Provedor (Provider)
export const ThemeProvider = ({ children }) => {
  // Estado que armazena o tema atual
  const [theme, setTheme] = useState(lightTheme); 
  
  // Função para alternar o tema
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === lightTheme ? darkTheme : lightTheme);
  };
  
  // Valor que será exposto aos consumidores
  const contextValue = {
    currentTheme: theme,
    toggleTheme,
    themeName: theme === lightTheme ? 'light' : 'dark',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Hook Customizado para Consumo Fácil
export const useTheme = () => useContext(ThemeContext);
import React, { createContext, useContext, useReducer } from 'react';

// Theme Context
const ThemeContext = createContext();

const themeReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_THEME':
      const newTheme = state === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    case 'SET_THEME':
      localStorage.setItem('theme', action.payload);
      return action.payload;
    default:
      return state;
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, dispatch] = useReducer(themeReducer, () => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  const setTheme = (newTheme) => {
    dispatch({ type: 'SET_THEME', payload: newTheme });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};



import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Auth Context
const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetch(`${process.env.REACT_APP_API_URL}/auth/check`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: data.data.user,
                token: token,
              },
            });
          } else {
            localStorage.removeItem('token');
            dispatch({ type: 'LOGOUT' });
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = (user, token) => {
    localStorage.setItem('token', token);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, token },
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        setLoading,
        clearError,
      }}
    >
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



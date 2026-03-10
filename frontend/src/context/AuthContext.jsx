import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import api, { setTokens, setOnAuthError } from '../api/client';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'LOGOUT':
      return { ...state, user: null, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const logoutRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        dispatch({ type: 'SET_USER', payload: JSON.parse(stored) });
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }

    setOnAuthError(() => {
      if (logoutRef.current) logoutRef.current();
    });
  }, []);

  async function login(email, password) {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await api.post('/auth/login', { email, password });
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch({ type: 'SET_USER', payload: data.user });
      return data.user;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }

  async function register(email, password, full_name, affiliation) {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await api.post('/auth/register', { email, password, full_name, affiliation });
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch({ type: 'SET_USER', payload: data.user });
      return data.user;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }

  function logout() {
    setTokens(null, null);
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }

  logoutRef.current = logout;

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

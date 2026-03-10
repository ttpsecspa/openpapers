import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'activeConferenceId';

const ConferenceContext = createContext(null);

export function ConferenceProvider({ children }) {
  const [activeConferenceId, setActiveConferenceId] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });

  useEffect(() => {
    if (activeConferenceId) {
      localStorage.setItem(STORAGE_KEY, String(activeConferenceId));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeConferenceId]);

  return (
    <ConferenceContext.Provider value={{ activeConferenceId, setActiveConferenceId }}>
      {children}
    </ConferenceContext.Provider>
  );
}

export function useConferenceContext() {
  const ctx = useContext(ConferenceContext);
  if (!ctx) throw new Error('useConferenceContext must be used within ConferenceProvider');
  return ctx;
}

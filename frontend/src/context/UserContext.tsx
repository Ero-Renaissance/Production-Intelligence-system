import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

export type UserRole = 'pmc-engineer' | 'performance-lead' | 'production-programmer' | 'production-technologist';

interface UserState {
  username: string;
  role: UserRole;
  setUsername: (name: string) => void;
  setRole: (role: UserRole) => void;
}

const UserContext = createContext<UserState | null>(null);

const USERNAME_KEY = 'pi.username';
const ROLE_KEY = 'pi.role';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsernameState] = useState<string>('Operator');
  const [role, setRoleState] = useState<UserRole>('pmc-engineer');

  useEffect(() => {
    const storedName = localStorage.getItem(USERNAME_KEY);
    const storedRole = localStorage.getItem(ROLE_KEY) as UserRole | null;
    if (storedName) setUsernameState(storedName);
    if (storedRole === 'pmc-engineer' || storedRole === 'performance-lead' || storedRole === 'production-programmer' || storedRole === 'production-technologist') {
      setRoleState(storedRole);
    }
  }, []);

  const setUsername = (name: string) => {
    setUsernameState(name);
    try { localStorage.setItem(USERNAME_KEY, name); } catch { /* ignore */ }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    try { localStorage.setItem(ROLE_KEY, newRole); } catch { /* ignore */ }
  };

  const value = useMemo(() => ({ username, role, setUsername, setRole }), [username, role]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserState => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}; 
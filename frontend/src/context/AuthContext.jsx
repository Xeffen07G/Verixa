import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial load from localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('verixa_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/api/auth/login', { email, password });
            const data = res.data;
            setUser(data);
            localStorage.setItem('verixa_user', JSON.stringify(data));
            return { success: true, user: data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    };

    const register = async (email, password, name, organization, role, designation) => {
        try {
            const res = await api.post('/api/auth/register', { 
              email, password, name, organization, role, designation 
            });
            const data = res.data;
            setUser(data);
            localStorage.setItem('verixa_user', JSON.stringify(data));
            return { success: true, user: data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    };

    const logout = async () => {
        localStorage.removeItem('verixa_user');
        localStorage.removeItem('verixa_history');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
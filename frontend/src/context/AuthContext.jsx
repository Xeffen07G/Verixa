import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('verixa_token'));
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.REACT_APP_API_URL || '/api';

    useEffect(() => {
        if (token) {
            // Restore user from token/localStorage
            const savedUser = localStorage.getItem('verixa_user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });
            const data = res.data;
            setToken(data.token);
            setUser(data);
            localStorage.setItem('verixa_token', data.token);
            localStorage.setItem('verixa_user', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register`, { email, password });
            const data = res.data;
            setToken(data.token);
            setUser(data);
            localStorage.setItem('verixa_token', data.token);
            localStorage.setItem('verixa_user', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Registration failed' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('verixa_token');
        localStorage.removeItem('verixa_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

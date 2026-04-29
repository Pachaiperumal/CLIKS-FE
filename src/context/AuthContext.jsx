import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('books_auth_token'));
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    const logout = React.useCallback(() => {
        localStorage.removeItem('books_auth_token');
        setToken(null);
        setUser(null);
        // Clear query cache to prevent User B from seeing User A's cached data
        queryClient.clear();
    }, [queryClient]);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const userData = await authService.getProfile();
                    // authService.getProfile now returns the unwrapped user object
                    setUser(userData);
                } catch (error) {
                    console.error('[AuthContext] Failed to fetch profile:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        if (token) {
            initAuth();
        } else {
            setLoading(false);
        }
    }, [token, logout]);

    const login = async (username, password) => {
        const data = await authService.login(username, password);
        // authService.login now returns response.data: { accessToken, refreshToken, user }
        const { accessToken, user: newUser } = data;

        localStorage.setItem('books_auth_token', accessToken);
        setToken(accessToken);
        setUser(newUser);

        // Invalidate and refetch all queries to ensure new user data is loaded
        queryClient.invalidateQueries();

        return data;
    };

    const register = async (userData) => {
        const data = await authService.register(userData);
        // authService.register now returns response.data: { accessToken, refreshToken, user }
        const { accessToken, user: newUser } = data;

        localStorage.setItem('books_auth_token', accessToken);
        setToken(accessToken);
        setUser(newUser);

        // Invalidate and refetch
        queryClient.invalidateQueries();

        return data;
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
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

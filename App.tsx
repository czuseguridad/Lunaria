import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import type { Session } from '@supabase/supabase-js';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
        });

        return () => subscription.unsubscribe();
    }, []);

    const GlobalStyles = () => (
        <style>{`
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                background-color: #0f172a;
                color: #f1f5f9;
            }
            @keyframes float { 
                0%, 100% { transform: translateY(0px) rotate(0deg); } 
                50% { transform: translateY(-20px) rotate(180deg); } 
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .loading-spinner {
                display: inline-block;
                width: 1rem;
                height: 1rem;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s linear infinite;
            }
        `}</style>
    );

    if (loading) {
        return (
            <>
                <GlobalStyles />
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="loading-spinner !w-12 !h-12 !border-4"></div>
                </div>
            </>
        )
    }

    return (
        <>
            <GlobalStyles />
            {!session ? <AuthScreen /> : <Dashboard session={session} />}
        </>
    );
};

export default App;

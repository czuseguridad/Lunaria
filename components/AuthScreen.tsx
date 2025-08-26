import React, { useState } from 'react';
import { supabase } from '../services/supabase';

type ViewType = 'login' | 'register';
type MessageType = {
  type: 'error' | 'success' | 'info';
  text: string;
};

const PasswordInput = ({ id, value, onChange, placeholder }: { id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input
                type={visible ? "text" : "password"}
                id={id}
                value={value}
                onChange={onChange}
                className="w-full p-4 pr-12 border-2 border-slate-600 rounded-xl bg-slate-900 text-slate-100 text-lg transition-all duration-300 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:scale-[1.02]"
                placeholder={placeholder}
                required
                minLength={6}
            />
            <i
                className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 text-xl fas ${visible ? 'fa-eye-slash' : 'fa-eye'}`}
                onClick={() => setVisible(!visible)}
            ></i>
        </div>
    );
};

const AuthScreen: React.FC = () => {
    const [view, setView] = useState<ViewType>('login');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<MessageType | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            let userMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
            if (error.message.includes('Email not confirmed')) {
                 userMessage = 'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
            }
            setMessage({ type: 'error', text: userMessage });
        } else {
             setMessage({ type: 'info', text: 'Inicio de sesión exitoso. Redirigiendo...' });
        }
        setLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
            return;
        }
        setLoading(true);
        setMessage(null);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`,
                },
            },
        });

        if (error) {
            let userMessage = 'Error al registrar el usuario.';
            if (error.message.includes('User already registered')) {
                userMessage = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
            } else if (error.message.includes('Password should be at least 6 characters')) {
                userMessage = 'La contraseña debe tener al menos 6 caracteres.';
            }
            setMessage({ type: 'error', text: userMessage });
        } else if (data.user && !data.user.email_confirmed_at) {
            setMessage({ type: 'success', text: '¡Registro exitoso! Por favor, verifica tu correo para confirmar tu cuenta.' });
        } else {
            setMessage({ type: 'success', text: '¡Registro exitoso! Ya puedes iniciar sesión.' });
        }
        setLoading(false);
    };
    
    const messageStyles = {
        error: 'bg-red-500/10 text-red-400 border-red-500',
        success: 'bg-green-500/10 text-green-400 border-green-500',
        info: 'bg-sky-500/10 text-sky-400 border-sky-500'
    };
    
    const messageIcons = {
        error: 'fas fa-exclamation-circle',
        success: 'fas fa-check-circle',
        info: 'fas fa-info-circle'
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute bg-sky-500/10 rounded-full w-24 h-24 top-[20%] left-[10%] animate-[float_6s_ease-in-out_infinite_0s]"></div>
                <div className="absolute bg-sky-500/10 rounded-full w-36 h-36 top-[60%] right-[15%] animate-[float_6s_ease-in-out_infinite_2s]"></div>
                <div className="absolute bg-sky-500/10 rounded-full w-20 h-20 bottom-[30%] left-[15%] animate-[float_6s_ease-in-out_infinite_4s]"></div>
            </div>

            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700 shadow-2xl p-8 sm:p-12 z-10">
                <div className="text-center mb-8">
                    <img src="https://i.postimg.cc/GpPsSmmX/4491470.png" alt="Lunaria Mining" className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-sky-500 p-2 bg-sky-900/50" />
                    <h1 className="text-3xl font-bold text-slate-50">Lunaria Mining Premium</h1>
                    <p className="text-slate-400">Sistema de Acceso</p>
                </div>
                
                {message && (
                    <div className={`p-4 mb-6 rounded-lg border flex items-center gap-3 text-sm font-medium animate-[slideIn_0.3s_ease] ${messageStyles[message.type]}`}>
                       <i className={messageIcons[message.type]}></i>
                        <span>{message.text}</span>
                    </div>
                )}
                
                <div className="flex space-x-2 mb-6">
                    <button onClick={() => { setView('login'); setMessage(null); }} className={`flex-grow p-3 rounded-lg font-semibold transition-all duration-300 border ${view === 'login' ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}>
                        Iniciar Sesión
                    </button>
                    <button onClick={() => { setView('register'); setMessage(null); }} className={`flex-grow p-3 rounded-lg font-semibold transition-all duration-300 border ${view === 'register' ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}>
                        Registrarse
                    </button>
                </div>

                {view === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                         <div>
                            <label htmlFor="loginEmail" className="block text-sm font-semibold text-slate-400 mb-2"><i className="fas fa-envelope mr-2"></i>Correo Electrónico</label>
                            <input type="email" id="loginEmail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 border-2 border-slate-600 rounded-xl bg-slate-900 text-slate-100 text-lg transition-all duration-300 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:scale-[1.02]" placeholder="tu_correo@ejemplo.com" required />
                        </div>
                        <div>
                            <label htmlFor="loginPassword" className="block text-sm font-semibold text-slate-400 mb-2"><i className="fas fa-lock mr-2"></i>Contraseña</label>
                            <PasswordInput id="loginPassword" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="***********" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full mt-2 p-4 text-base font-semibold text-white bg-sky-500 rounded-xl hover:bg-sky-600 transition-all duration-300 disabled:bg-sky-500/50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-105 disabled:hover:scale-100">
                             {loading ? <span className="loading-spinner"></span> : <i className="fas fa-sign-in-alt"></i>}
                             {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                                <label htmlFor="registerFirstName" className="block text-sm font-semibold text-slate-400 mb-2"><i className="fas fa-user mr-2"></i>Nombre</label>
                                <input type="text" id="registerFirstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-4 border-2 border-slate-600 rounded-xl bg-slate-900 text-slate-100 text-lg transition-all duration-300 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:scale-[1.02]" placeholder="Tu nombre" required />
                            </div>
                           <div>
                                <label htmlFor="registerLastName" className="block text-sm font-semibold text-slate-400 mb-2"><i className="fas fa-user-tag mr-2"></i>Apellido</label>
                                <input type="text" id="registerLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-4 border-2 border-slate-600 rounded-xl bg-slate-900 text-slate-100 text-lg transition-all duration-300 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:scale-[1.02]" placeholder="Tu apellido" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="registerEmail" className="block text-sm font-semibold text-slate-400 mb-2"><i className="fas fa-envelope mr-2"></i>Correo Electrónico</label>
                            <input type="email" id="registerEmail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 border-2 border-slate-600 rounded-xl bg-slate-900 text-slate-100 text-lg transition-all duration-300 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:scale-[1.02]" placeholder="tu_correo@ejemplo.com" required />
                        </div>
                         <div>
                            <label htmlFor="registerPassword" className="block text-sm font-semibold text-slate-400 mb-2"><i className="fas fa-lock mr-2"></i>Contraseña</label>
                            <PasswordInput id="registerPassword" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="***********" />
                        </div>
                        <div>
                            <label htmlFor="registerConfirmPassword" className="block text-sm font-semibold text-slate-400 mb-2"><i className="fas fa-lock mr-2"></i>Repetir Contraseña</label>
                            <PasswordInput id="registerConfirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="***********" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full mt-2 p-4 text-base font-semibold text-white bg-sky-500 rounded-xl hover:bg-sky-600 transition-all duration-300 disabled:bg-sky-500/50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-105 disabled:hover:scale-100">
                           {loading ? <span className="loading-spinner"></span> : <i className="fas fa-user-plus"></i>}
                           {loading ? 'Registrando...' : 'Registrarse'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthScreen;

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { RippleButton } from '@/components/ui/ripple-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToastNotification } from '@/components/ui/toast-notification';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import logger from '@/utils/logger';

const LoginPage = () => {
    const { register, handleSubmit, formState: { errors }, getValues, setValue } = useForm({
        defaultValues: {
            email: localStorage.getItem('rememberMeEmail') || '',
            remember: !!localStorage.getItem('rememberMeEmail')
        }
    });
    const { signIn, session } = useSupabaseAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToastNotification();
    const from = location.state?.from?.pathname || "/dashboard";

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
      if (session) {
        navigate(from, { replace: true });
      }
    }, [session, navigate, from]);

    const onSubmit = async (formData) => {
        setIsLoading(true);
        setAuthError('');

        try {
            const { error } = await signIn({ email: formData.email, password: formData.password });

            if (!error) {
                handleRememberChange(formData.remember);
                await new Promise(resolve => setTimeout(resolve, 100));

                toast.success('¡Bienvenido de vuelta!', 'Has iniciado sesión correctamente.');
            } else {
                const errorMessage = error.message?.includes('Invalid login credentials')
                  ? 'Email o contraseña incorrectos.'
                  : 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
                setAuthError(errorMessage);
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 500);
                toast.error('Error al iniciar sesión', errorMessage);
            }
        } catch (err) {
            logger.error('Error during login:', err);
            setAuthError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRememberChange = (checked) => {
        setValue('remember', checked);
        const email = getValues('email');
        if (checked && email) {
            localStorage.setItem('rememberMeEmail', email);
        } else {
            localStorage.removeItem('rememberMeEmail');
        }
    };

    const handleForgotPassword = () => {
        const currentEmail = getValues('email');
        setResetEmail(currentEmail || '');
        setShowResetDialog(true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!resetEmail || !resetEmail.trim()) {
            toast.error('Email requerido', 'Por favor ingresa tu email');
            return;
        }

        if (!resetEmail.match(/^\S+@\S+$/i)) {
            toast.error('Email inválido', 'Por favor ingresa un email válido');
            return;
        }

        setIsResetting(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                throw error;
            }

            toast.success(
                'Email enviado',
                'Revisa tu bandeja de entrada para restablecer tu contraseña'
            );
            setShowResetDialog(false);
            setResetEmail('');
        } catch (error) {
            logger.error('Error sending reset email:', error);
            toast.error(
                'Error al enviar email',
                error.message || 'No se pudo enviar el email de recuperación'
            );
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <>
            <Helmet><title>Iniciar Sesión - ComerECO</title></Helmet>

            {/* Background with gradient */}
            <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
                {/* Decorative gradient orbs */}
                <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/40 to-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gradient-to-br from-blue-300/30 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />

                <div className="w-full max-w-md relative z-10">
                    {/* Logo - Sin contenedor, limpio */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-center mb-10"
                    >
                        <img
                            src="https://i.ibb.co/XZW8Nh3v/solver-logo-1.png"
                            alt="ComerECO Logo"
                            className="w-24 h-24 object-contain mx-auto drop-shadow-xl"
                        />
                    </motion.div>

                    {/* Login Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className={`bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-slate-200 p-6 sm:p-10 ${isShaking ? 'animate-shake' : ''}`}
                    >
                        {/* Title inside card */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">
                                <span className="text-slate-900">Comer</span>
                                <span className="bg-gradient-primary bg-clip-text text-transparent">ECO</span>
                            </h1>
                            <p className="text-slate-600 text-base sm:text-lg mb-2">Bienvenido de vuelta</p>
                            <p className="text-sm font-medium text-slate-500">
                                Sistema de Requisiciones · <span className="text-blue-600">ComerECO</span>
                            </p>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Email Input */}
                            <div>
                                <FloatingInput
                                    id="email"
                                    type="email"
                                    label="Email"
                                    icon={<Mail />}
                                    error={errors.email?.message}
                                    {...register('email', {
                                        required: 'El email es requerido',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Formato de email inválido' }
                                    })}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="relative">
                                    <FloatingInput
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        label="Contraseña"
                                        icon={<Lock />}
                                        error={errors.password?.message}
                                        className="pr-14"
                                        {...register('password', {
                                            required: 'La contraseña es requerida'
                                        })}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors duration-200 z-20 p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        disabled={isLoading}
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Auth Error */}
                            {authError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-xl bg-red-50 border-2 border-red-200"
                                >
                                    <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5"/>
                                        {authError}
                                    </p>
                                </motion.div>
                            )}

                            {/* Remember & Forgot Password */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        checked={getValues('remember')}
                                        onCheckedChange={handleRememberChange}
                                        disabled={isLoading}
                                        className="rounded-md"
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="font-medium text-slate-600 cursor-pointer text-sm hover:text-slate-900 transition-colors"
                                    >
                                        Recordarme
                                    </Label>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200 font-semibold"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <RippleButton
                                type="submit"
                                size="lg"
                                className="w-full shadow-lg hover:shadow-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </RippleButton>
                        </form>
                    </motion.div>

                    {/* Footer Text */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-10 text-center text-sm font-medium text-slate-500"
                    >
                        Sistema de Requisiciones · <span className="text-blue-600">ComerECO</span>
                    </motion.p>
                </div>

                {/* Reset Password Dialog */}
                <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Recuperar contraseña</DialogTitle>
                            <DialogDescription>
                                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        id="reset-email"
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={isResetting}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowResetDialog(false)}
                                    disabled={isResetting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isResetting}
                                    className="min-w-[120px]"
                                >
                                    {isResetting ? 'Enviando...' : 'Enviar email'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};

export default LoginPage;

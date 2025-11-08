import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const LoginPage = () => {
    const { register, handleSubmit, formState: { errors }, getValues, setValue, watch } = useForm({
        defaultValues: {
            email: localStorage.getItem('rememberMeEmail') || '',
            remember: !!localStorage.getItem('rememberMeEmail')
        }
    });
    const rememberValue = watch('remember');
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
    const [hasPreloadedEmail] = useState(() => !!localStorage.getItem('rememberMeEmail'));

    // Remover animación de shake después de 500ms
    useEffect(() => {
        if (isShaking) {
            const timer = setTimeout(() => setIsShaking(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isShaking]);

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
                toast.error('Error al iniciar sesión', errorMessage);
            }
        } catch (err) {
            logger.error('Error during login:', err);
            setAuthError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
            setIsShaking(true);
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
	<div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background/97 to-background p-4 font-sans dark:from-[#131f33] dark:via-[#101a2e] dark:to-[#0d1729]">
                {/* Decorative gradient orbs */}
                <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-gradient-to-br from-primary-200/40 to-primary-300/20 rounded-full blur-3xl animate-pulse dark:from-primary-500/15 dark:to-primary-600/10" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gradient-to-br from-primary-300/30 to-primary-400/10 rounded-full blur-3xl animate-pulse dark:from-primary-500/10 dark:to-primary-600/10" style={{ animationDuration: '6s', animationDelay: '1s' }} />

                <div className="w-full max-w-md relative z-10">
                    {/* Logo - Sin contenedor, limpio */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-center mb-10"
                    >
                        <img
                            src="/logo.png"
                            alt="ComerECO Logo"
                            className="w-32 h-32 object-contain mx-auto drop-shadow-2xl"
                            loading="eager"
                        />
                    </motion.div>

                    {/* Login Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className={cn(
                            "rounded-3xl border-2 border-border bg-background/95 p-5 shadow-soft-xl backdrop-blur-md sm:p-8 md:p-10 dark:border-border/50 dark:bg-card/95",
                            isShaking && 'animate-shake'
                        )}
                    >
                        {/* Title inside card */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">
                                <span className="text-foreground">Comer</span>
                                <span className="bg-gradient-primary bg-clip-text text-transparent">ECO</span>
                            </h1>
                            <p className="text-base sm:text-lg mb-2 text-muted-foreground">Bienvenido de vuelta</p>
                            <p className="text-sm font-medium text-muted-foreground">
                                Sistema de Requisiciones · <span className="text-primary-500">ComerECO</span>
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
                                    autoComplete="email"
                                    {...register('email', {
                                        required: 'El email es requerido',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Formato de email inválido' }
                                    })}
                                    disabled={isLoading}
                                />
                                {hasPreloadedEmail && !errors.email && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.2 }}
                                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-300"
                                    >
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        <span>Email recordado</span>
                                    </motion.div>
                                )}
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
                                        autoComplete="current-password"
                                        {...register('password', {
                                            required: 'La contraseña es requerida'
                                        })}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted/70 hover:text-foreground active:bg-muted/60 dark:hover:bg-muted/40"
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
                                    className="rounded-xl border-2 border-error bg-error-light/80 p-4 dark:border-error dark:bg-error/15"
                                >
                                    <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5"/>
                                        {authError}
                                    </p>
                                </motion.div>
                            )}

                            {/* Remember & Forgot Password */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2 min-h-[44px]">
                                    <Checkbox
                                        id="remember"
                                        checked={rememberValue}
                                        onCheckedChange={(checked) => {
                                            setValue('remember', checked);
                                            handleRememberChange(checked);
                                        }}
                                        disabled={isLoading}
                                        className="rounded-md"
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="cursor-pointer select-none text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 py-2"
                                    >
                                        Recordarme
                                    </Label>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-sm font-semibold text-blue-600 underline underline-offset-2 transition-all duration-200 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 min-h-[44px] flex items-center justify-end"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <RippleButton
                                type="submit"
                                size="lg"
                                className="w-full shadow-soft-md hover:shadow-soft-lg"
                                isLoading={isLoading}
                                disabled={isLoading}
                            >
                                {!isLoading && 'Iniciar Sesión'}
                            </RippleButton>
                        </form>
                    </motion.div>
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
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        id="reset-email"
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-300 dark:border-border dark:bg-card dark:focus:ring-primary-500/40"
                                        autoComplete="email"
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
                                    isLoading={isResetting}
                                    disabled={isResetting}
                                    className="min-w-[120px]"
                                >
                                    {!isResetting && 'Enviar email'}
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

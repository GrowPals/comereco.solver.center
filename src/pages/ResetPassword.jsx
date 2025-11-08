import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { RippleButton } from '@/components/ui/ripple-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { useToastNotification } from '@/components/ui/toast-notification';
import logger from '@/utils/logger';
import { cn } from '@/lib/utils';

const ResetPassword = () => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const navigate = useNavigate();
    const toast = useToastNotification();
    const [searchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetError, setResetError] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const password = watch('password');

    // Verificar si hay un token de recuperación válido
    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (!accessToken || type !== 'recovery') {
            toast.error(
                'Enlace inválido',
                'El enlace de recuperación no es válido o ha expirado'
            );
            setTimeout(() => navigate('/login'), 3000);
        }
    }, [navigate, toast]);

    const onSubmit = async (formData) => {
        setIsLoading(true);
        setResetError('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: formData.password,
            });

            if (error) {
                throw error;
            }

            setIsSuccess(true);
            toast.success(
                'Contraseña actualizada',
                'Tu contraseña ha sido cambiada exitosamente'
            );

            // Redirigir al inicio después de 2 segundos
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (err) {
            logger.error('Error updating password:', err);
            const errorMessage = err.message?.includes('same password')
                ? 'La nueva contraseña debe ser diferente a la anterior.'
                : 'No se pudo actualizar la contraseña. Por favor, inténtalo de nuevo.';

            setResetError(errorMessage);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            toast.error('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <>
                <Helmet><title>Contraseña Actualizada - ComerECO</title></Helmet>
				<div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background/97 to-background p-4 dark:from-[#131f33] dark:via-[#101a2e] dark:to-[#0d1729]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md rounded-3xl border-2 border-border bg-background/90 p-10 text-center shadow-soft-xl backdrop-blur-sm dark:border-border dark:bg-card/85"
                    >
                        <CheckCircle2 className="mx-auto mb-6 h-20 w-20 text-green-500" />
                        <h2 className="mb-3 text-3xl font-bold text-foreground">
                            ¡Contraseña Actualizada!
                        </h2>
                        <p className="mb-6 text-muted-foreground">
                            Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio...
                        </p>
                    </motion.div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet><title>Restablecer Contraseña - ComerECO</title></Helmet>

	<div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background/97 to-background p-4 font-sans dark:from-[#1b2d4d] dark:via-[#152441] dark:to-[#1b2d4d]">
                {/* Decorative gradient orbs */}
                <div className="absolute left-10 top-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary-200/40 to-primary-300/20 blur-3xl animate-pulse dark:from-primary-500/15 dark:to-primary-600/10" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-primary-300/30 to-primary-400/10 blur-3xl animate-pulse dark:from-primary-500/10 dark:to-primary-600/10" style={{ animationDuration: '6s', animationDelay: '1s' }} />

                <div className="w-full max-w-md relative z-10">
                    {/* Logo */}
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

                    {/* Reset Password Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className={cn(
                            "rounded-3xl border-2 border-border bg-background/90 p-5 shadow-soft-xl backdrop-blur-sm sm:p-8 md:p-10 dark:border-border dark:bg-card/85",
                            isShaking && 'animate-shake'
                        )}
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-3 tracking-tight">
                                <span className="text-foreground">Restablecer </span>
                                <span className="bg-gradient-primary bg-clip-text text-transparent">Contraseña</span>
                            </h1>
                            <p className="text-base text-muted-foreground">
                                Ingresa tu nueva contraseña
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Password Input */}
                            <div>
                                <div className="relative">
                                    <FloatingInput
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        label="Nueva Contraseña"
                                        icon={<Lock />}
                                        error={errors.password?.message}
                                        className="pr-14"
                                        autoComplete="new-password"
                                        {...register('password', {
                                            required: 'La contraseña es requerida',
                                            minLength: {
                                                value: 6,
                                                message: 'La contraseña debe tener al menos 6 caracteres'
                                            }
                                        })}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 z-20 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted/70 hover:text-foreground active:bg-muted/60 dark:hover:bg-muted/40"
                                        disabled={isLoading}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Input */}
                            <div>
                                <div className="relative">
                                    <FloatingInput
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        label="Confirmar Contraseña"
                                        icon={<Lock />}
                                        error={errors.confirmPassword?.message}
                                        className="pr-14"
                                        autoComplete="new-password"
                                        {...register('confirmPassword', {
                                            required: 'Debes confirmar tu contraseña',
                                            validate: value =>
                                                value === password || 'Las contraseñas no coinciden'
                                        })}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-2 top-1/2 z-20 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted/70 hover:text-foreground active:bg-muted/60 dark:hover:bg-muted/40"
                                        disabled={isLoading}
                                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            <div className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground space-y-1 dark:bg-card/40">
                                <p className="mb-2 font-semibold text-foreground">Tu contraseña debe tener:</p>
                                <p className={password?.length >= 6 ? 'text-green-600 dark:text-green-400' : ''}>
                                    • Al menos 6 caracteres
                                </p>
                            </div>

                            {/* Reset Error */}
                            {resetError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-xl bg-red-50 border-2 border-red-200"
                                >
                                    <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5"/>
                                        {resetError}
                                    </p>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <RippleButton
                                type="submit"
                                size="lg"
                                className="w-full shadow-soft-md hover:shadow-soft-lg"
                                isLoading={isLoading}
                                disabled={isLoading}
                            >
                                {!isLoading && 'Actualizar Contraseña'}
                            </RippleButton>

                            {/* Back to Login */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-sm text-muted-foreground transition-colors hover:text-foreground min-h-[44px] inline-flex items-center justify-center px-4"
                                    disabled={isLoading}
                                >
                                    Volver al inicio de sesión
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default ResetPassword;

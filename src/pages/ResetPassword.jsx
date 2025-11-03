import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { RippleButton } from '@/components/ui/ripple-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { useToastNotification } from '@/components/ui/toast-notification';
import logger from '@/utils/logger';

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

            // Redirigir al dashboard después de 2 segundos
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
                <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-slate-200 p-10 max-w-md w-full text-center"
                    >
                        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-slate-900 mb-3">
                            ¡Contraseña Actualizada!
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Tu contraseña ha sido cambiada exitosamente. Serás redirigido al dashboard...
                        </p>
                    </motion.div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet><title>Restablecer Contraseña - ComerECO</title></Helmet>

            <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
                {/* Decorative gradient orbs */}
                <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/40 to-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gradient-to-br from-blue-300/30 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />

                <div className="w-full max-w-md relative z-10">
                    {/* Logo */}
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

                    {/* Reset Password Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className={`bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-slate-200 p-6 sm:p-10 ${isShaking ? 'animate-shake' : ''}`}
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-3 tracking-tight">
                                <span className="text-slate-900">Restablecer </span>
                                <span className="bg-gradient-primary bg-clip-text text-transparent">Contraseña</span>
                            </h1>
                            <p className="text-slate-600 text-base">
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
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors duration-200 z-20 p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        disabled={isLoading}
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors duration-200 z-20 p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        disabled={isLoading}
                                        aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            <div className="text-sm text-slate-600 space-y-1 bg-slate-50 p-4 rounded-lg">
                                <p className="font-semibold mb-2">Tu contraseña debe tener:</p>
                                <p className={password?.length >= 6 ? 'text-green-600' : ''}>
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
                                className="w-full shadow-lg hover:shadow-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                            </RippleButton>

                            {/* Back to Login */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
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

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { RippleButton } from '@/components/ui/ripple-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToastNotification } from '@/components/ui/toast-notification';
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

    return (
        <>
            <Helmet><title>Iniciar Sesión - ComerECO</title></Helmet>

            {/* Background with gradient */}
            <div className="min-h-screen w-full bg-gradient-to-br from-neutral-50 via-white to-primary-50/20 flex items-center justify-center p-4 font-sans relative overflow-hidden">
                {/* Decorative gradient orbs */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />

                <div className="w-full max-w-md relative z-10">
                    {/* Logo and Title */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="text-center mb-8"
                    >
                        <div className="mx-auto w-24 h-24 mb-6 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                            <img
                                src="https://i.ibb.co/XZW8Nh3v/solver-logo-1.png"
                                alt="ComerECO Logo"
                                className="w-16 h-16 object-contain"
                            />
                        </div>
                        <h1 className="text-4xl font-bold mb-2">
                            <span className="text-neutral-900">Comer</span>
                            <span className="bg-gradient-primary bg-clip-text text-transparent">ECO</span>
                        </h1>
                        <p className="text-neutral-500 text-base">Bienvenido de vuelta</p>
                    </motion.div>

                    {/* Login Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                        className={`bg-white rounded-2xl shadow-xl border border-neutral-200 p-8 ${isShaking ? 'animate-shake' : ''}`}
                    >
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
                                        className="pr-12"
                                        {...register('password', {
                                            required: 'La contraseña es requerida'
                                        })}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 transition-colors duration-200 z-10"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Auth Error */}
                            {authError && (
                                <div className="p-3 rounded-lg bg-error-light border border-error/20">
                                    <p className="text-sm text-error flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4"/>
                                        {authError}
                                    </p>
                                </div>
                            )}

                            {/* Remember & Forgot Password */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        checked={getValues('remember')}
                                        onCheckedChange={handleRememberChange}
                                        disabled={isLoading}
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="font-normal text-neutral-600 cursor-pointer text-sm hover:text-neutral-900 transition-colors"
                                    >
                                        Recordarme
                                    </Label>
                                </div>
                                <Link
                                    to="#"
                                    onClick={() => toast.info("Función no implementada", "La recuperación de contraseña estará disponible pronto.")}
                                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-all duration-200 font-medium"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <RippleButton
                                type="submit"
                                size="lg"
                                className="w-full"
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
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="mt-8 text-center text-sm text-neutral-500"
                    >
                        Sistema de Requisiciones · ComerECO
                    </motion.p>
                </div>
            </div>
        </>
    );
};

export default LoginPage;

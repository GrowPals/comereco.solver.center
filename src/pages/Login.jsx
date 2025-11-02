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
                        <div className="mx-auto w-28 h-28 bg-white rounded-3xl shadow-2xl flex items-center justify-center ring-2 ring-blue-100">
                            <img
                                src="https://i.ibb.co/XZW8Nh3v/solver-logo-1.png"
                                alt="ComerECO Logo"
                                className="w-16 h-16 object-contain"
                            />
                        </div>
                    </motion.div>

                    {/* Login Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className={`bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-slate-200 p-10 ${isShaking ? 'animate-shake' : ''}`}
                    >
                        {/* Title inside card */}
                        <div className="text-center mb-8">
                            <h1 className="text-5xl font-bold mb-3 tracking-tight">
                                <span className="text-slate-900">Comer</span>
                                <span className="bg-gradient-primary bg-clip-text text-transparent">ECO</span>
                            </h1>
                            <p className="text-slate-600 text-lg">Bienvenido de vuelta</p>
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
                                        className="absolute right-3 top-[28px] text-neutral-500 hover:text-neutral-900 transition-colors duration-200 z-20"
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
                                <Link
                                    to="#"
                                    onClick={() => toast.info("Función no implementada", "La recuperación de contraseña estará disponible pronto.")}
                                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200 font-semibold"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
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
            </div>
        </>
    );
};

export default LoginPage;

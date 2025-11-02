
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast.js';

const LoginPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            email: localStorage.getItem('rememberMeEmail') || '',
            remember: !!localStorage.getItem('rememberMeEmail')
        }
    });
    const { signIn, session } = useSupabaseAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const from = location.state?.from?.pathname || "/dashboard";

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
      if (session) {
        navigate(from, { replace: true });
      }
    }, [session, navigate, from]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        setAuthError('');

        const { error } = await signIn(data.email, data.password);

        if (!error) {
            if (data.remember) {
                localStorage.setItem('rememberMeEmail', data.email);
            } else {
                localStorage.removeItem('rememberMeEmail');
            }
            toast({
              title: '¡Bienvenido de vuelta!',
              description: `Has iniciado sesión correctamente.`,
            });
            navigate(from, { replace: true });
        } else {
            setAuthError(error.message || 'Email o contraseña incorrectos.');
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        }
        setIsLoading(false);
    };

    return (
        <>
            <Helmet><title>Iniciar Sesión - ComerECO</title></Helmet>
            <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 font-sans">
                <div className="w-full max-w-sm text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-8"
                    >
                        <div className="mx-auto h-24 w-24 rounded-2xl bg-white shadow-lg flex items-center justify-center p-4 mb-6">
                            <img
                                src="https://i.ibb.co/XZW8Nh3v/solver-logo-1.png"
                                alt="ComerECO Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mt-4">Sistema de Requisiciones</h1>
                        <p className="text-muted-foreground text-sm mt-1">Comer<span className="text-primary font-semibold">ECO</span></p>
                    </motion.div>

                    <motion.div
                        className={`w-full rounded-2xl bg-card border p-8 text-left shadow-lg ${isShaking ? 'animate-shake' : ''}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="tu@email.com"
                                        className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                                        {...register('email', {
                                            required: 'El email es requerido',
                                            pattern: { value: /^\S+@\S+$/i, message: 'Formato de email inválido' }
                                        })}
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-sm text-destructive flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/>{errors.email.message}</p>}
                            </div>

                            <div>
                                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className={`pl-10 pr-12 ${errors.password ? 'border-destructive' : ''}`}
                                        {...register('password', {
                                            required: 'La contraseña es requerida'
                                        })}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-300">
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-destructive flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/>{errors.password.message}</p>}
                            </div>

                            {authError && <p className="text-sm text-destructive flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/>{authError}</p>}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="remember" {...register('remember')} />
                                    <Label htmlFor="remember" className="font-normal text-foreground cursor-pointer">Recordarme</Label>
                                </div>
                                <Link to="#" onClick={() => toast({ title: "Función no implementada", description: "La recuperación de contraseña estará disponible pronto." })} className="text-sm text-primary hover:underline transition-all duration-300">¿Olvidaste tu contraseña?</Link>
                            </div>

                            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;

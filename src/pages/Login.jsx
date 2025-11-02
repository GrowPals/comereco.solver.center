
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/useToast';

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
    const { toast } = useToast();
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
        const { error } = await signIn({ email: formData.email, password: formData.password });
        setIsLoading(false);

        if (!error) {
            handleRememberChange(formData.remember);
            toast({
              title: '¡Bienvenido de vuelta!',
              description: `Has iniciado sesión correctamente.`,
              variant: 'success'
            });
            // El useEffect se encarga de la redirección
        } else {
            const errorMessage = error.message.includes('Invalid login credentials') 
              ? 'Email o contraseña incorrectos.'
              : 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
            setAuthError(errorMessage);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            toast({
              title: 'Error al iniciar sesión',
              description: errorMessage,
              variant: 'destructive'
            });
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
            <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 font-sans">
                <motion.div 
                  className="w-full max-w-md text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="mb-8"
                    >
                        <img
                            src="https://i.ibb.co/XZW8Nh3v/solver-logo-1.png"
                            alt="ComerECO Logo"
                            className="w-24 h-24 object-contain mx-auto"
                        />
                         <h1 className="text-3xl font-bold text-foreground mt-4">Comer<span className="text-primary">ECO</span></h1>
                         <p className="text-muted-foreground">Bienvenido de nuevo</p>
                    </motion.div>

                    <motion.div
                        className={`w-full rounded-2xl bg-card border p-8 text-left ${isShaking ? 'animate-shake' : ''}`}
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    icon={<Mail />}
                                    className={`mt-1.5 ${errors.email ? 'border-destructive' : ''}`}
                                    {...register('email', {
                                        required: 'El email es requerido',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Formato de email inválido' }
                                    })}
                                    disabled={isLoading}
                                />
                                {errors.email && <p className="mt-1.5 text-sm text-destructive flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/>{errors.email.message}</p>}
                            </div>

                            <div>
                                <Label htmlFor="password" className="text-sm font-semibold">Contraseña</Label>
                                <div className="relative mt-1.5">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        icon={<Lock />}
                                        className={`pr-12 ${errors.password ? 'border-destructive' : ''}`}
                                        {...register('password', {
                                            required: 'La contraseña es requerida'
                                        })}
                                        disabled={isLoading}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-300" disabled={isLoading}>
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-sm text-destructive flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/>{errors.password.message}</p>}
                            </div>

                            {authError && <p className="text-sm text-destructive flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/>{authError}</p>}

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="remember"
                                        checked={getValues('remember')}
                                        onCheckedChange={handleRememberChange}
                                        disabled={isLoading}
                                    />
                                    <Label htmlFor="remember" className="font-normal text-muted-foreground cursor-pointer text-sm">Recordarme</Label>
                                </div>
                                <Link to="#" onClick={() => toast({ title: "Función no implementada", description: "La recuperación de contraseña estará disponible pronto." })} className="text-sm text-primary hover:underline transition-all duration-300">¿Olvidaste tu contraseña?</Link>
                            </div>

                            <Button type="submit" size="lg" className="w-full mt-6" isLoading={isLoading}>
                                Iniciar Sesión
                            </Button>
                        </form>
                    </motion.div>
                </motion.div>
            </div>
        </>
    );
};

export default LoginPage;

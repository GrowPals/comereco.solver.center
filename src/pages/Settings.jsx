
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Settings, Bell, Lock, Palette, Eye, Monitor, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToastNotification } from '@/components/ui/toast-notification';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PageContainer from '@/components/layout/PageContainer';
import { useTheme } from '@/context/ThemeContext';

const TABS = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'privacy', name: 'Privacidad', icon: Eye },
    { id: 'security', name: 'Seguridad', icon: Lock },
    { id: 'appearance', name: 'Apariencia', icon: Palette },
];

const SettingsCard = ({ title, description, children, onSave, isSaving }) => (
    <Card className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border surface-overlay shadow-lg">
        <CardHeader className="space-y-3 pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
            {description && <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6 pb-24 pt-0">
            {children}
        </CardContent>
        {onSave && (
            <div className="surface-sticky sticky bottom-0 left-0 right-0 z-10 mt-auto rounded-b-2xl px-6 py-6 border-t border-neutral-200 dark:border-neutral-700">
                <Button
                    onClick={onSave}
                    disabled={isSaving}
                    className="w-full rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 px-8 shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                >
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Guardar Cambios
                </Button>
            </div>
        )}
    </Card>
);

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToastNotification();

    const handleSave = (section) => {
        setIsSaving(true);
        setTimeout(() => {
            toast.success('Configuración Guardada', `Tus preferencias de ${section} han sido actualizadas.`);
            setIsSaving(false);
        }, 1000);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralSettings onSave={() => handleSave('General')} isSaving={isSaving} />;
            case 'notifications': return <NotificationSettings onSave={() => handleSave('Notificaciones')} isSaving={isSaving} />;
            case 'privacy': return <PrivacySettings onSave={() => handleSave('Privacidad')} isSaving={isSaving} />;
            case 'security': return <SecuritySettings onSave={() => handleSave('Seguridad')} isSaving={isSaving} />;
            case 'appearance': return <AppearanceSettings />;
            default: return null;
        }
    };

    return (
        <>
            <Helmet><title>Configuración - ComerECO</title></Helmet>
            <PageContainer>
                <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row gap-6 pb-6 pt-2 lg:gap-10">
                    <aside className="w-full lg:w-64 bg-white dark:bg-neutral-900 border-b lg:border-r lg:border-b-0 border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-lg lg:sticky lg:top-24 lg:h-fit overflow-hidden">
                    <div className="hidden border-b border-neutral-200 dark:border-neutral-700 p-6 lg:block">
                        <div className="flex items-center gap-3">
                            <div className="icon-badge flex h-12 w-12 items-center justify-center">
                                <Settings className="h-6 w-6 text-primary-600 dark:text-primary-100" aria-hidden="true" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Configuración</h2>
                        </div>
                    </div>
                    {/* Mobile Dropdown */}
                    <div className="p-4 lg:hidden">
                        <Select value={activeTab} onValueChange={setActiveTab}>
                            <SelectTrigger className="rounded-xl h-12 shadow-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600">
                                <SelectValue placeholder="Seleccionar sección" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {TABS.map(tab => (
                                    <SelectItem key={tab.id} value={tab.id} className="rounded-lg">{tab.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Desktop Sidebar */}
                    <nav className="hidden lg:block space-y-2 p-4">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg border-l-4 transition-all duration-200',
                                    activeTab === tab.id
                                        ? 'bg-blue-50 dark:bg-neutral-800 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 font-medium'
                                )}
                            >
                                <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400')} aria-hidden="true" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                    </aside>
                    <main className="flex-1 w-full max-w-3xl space-y-6">
                        {renderContent()}
                    </main>
                </div>
            </PageContainer>
        </>
    );
};

// Sub-components for each tab
const GeneralSettings = ({ onSave, isSaving }) => (
    <SettingsCard title="General" description="Preferencias de idioma y región." onSave={onSave} isSaving={isSaving}>
        <div className="space-y-8">
            <div>
                <Label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Idioma</Label>
                <Select defaultValue="es">
                    <SelectTrigger className="w-full py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-colors">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Zona Horaria</Label>
                <Select defaultValue="gmt-6">
                    <SelectTrigger className="w-full py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-colors">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gmt-6">(GMT-6) Ciudad de México</SelectItem>
                        <SelectItem value="gmt-5">(GMT-5) Ciudad de Nueva York</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Formato de Fecha</Label>
                <RadioGroup defaultValue="dmy" className="space-y-3">
                    <div className="flex items-center gap-3">
                        <RadioGroupItem value="dmy" id="dmy" className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500/20"/>
                        <Label htmlFor="dmy" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">DD/MM/YYYY (ej. 25/11/2024)</Label>
                    </div>
                    <div className="flex items-center gap-3">
                        <RadioGroupItem value="mdy" id="mdy" className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500/20"/>
                        <Label htmlFor="mdy" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">MM/DD/YYYY (ej. 11/25/2024)</Label>
                    </div>
                    <div className="flex items-center gap-3">
                        <RadioGroupItem value="ymd" id="ymd" className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500/20"/>
                        <Label htmlFor="ymd" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">YYYY-MM-DD (ej. 2024-11-25)</Label>
                    </div>
                </RadioGroup>
            </div>
        </div>
    </SettingsCard>
);

const NotificationSettings = ({ onSave, isSaving }) => (
     <SettingsCard title="Notificaciones" description="Controla cómo y cuándo recibes notificaciones." onSave={onSave} isSaving={isSaving}>
        <div className="space-y-8">
            <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Notificaciones en la App</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><Label className="text-sm text-neutral-700 dark:text-neutral-300">Requisiciones aprobadas</Label><Switch defaultChecked /></div>
                    <div className="flex items-center justify-between"><Label className="text-sm text-neutral-700 dark:text-neutral-300">Requisiciones rechazadas</Label><Switch defaultChecked /></div>
                    <div className="flex items-center justify-between"><Label className="text-sm text-neutral-700 dark:text-neutral-300">Nuevos comentarios</Label><Switch defaultChecked /></div>
                </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Notificaciones por Email</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><Label className="text-sm text-neutral-700 dark:text-neutral-300">Enviar resumen semanal</Label><Switch /></div>
                </div>
            </div>
        </div>
    </SettingsCard>
);

const PrivacySettings = ({ onSave, isSaving }) => (
    <SettingsCard title="Privacidad" description="Controla la visibilidad de tu información." onSave={onSave} isSaving={isSaving}>
        <div className="space-y-8">
            <div>
                <Label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Visibilidad del Perfil</Label>
                <RadioGroup defaultValue="team" className="space-y-3">
                    <div className="flex items-center gap-3">
                        <RadioGroupItem value="team" id="team" className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500/20"/>
                        <Label htmlFor="team" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">Visible para todo mi equipo</Label>
                    </div>
                    <div className="flex items-center gap-3">
                        <RadioGroupItem value="admins" id="admins" className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500/20"/>
                        <Label htmlFor="admins" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">Visible solo para administradores</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex items-center justify-between">
                <Label className="text-sm text-neutral-700 dark:text-neutral-300">Mostrar mi estado de conexión</Label>
                <Switch defaultChecked />
            </div>
        </div>
    </SettingsCard>
);

const SecuritySettings = () => (
    <SettingsCard title="Seguridad" description="Gestiona la seguridad de tu cuenta.">
        <div className="space-y-8">
            <div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" className="rounded-xl shadow-sm hover:shadow-md">Cambiar Contraseña</Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-xl">
                            <p>Actualiza tu contraseña de acceso</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg mb-2">Sesiones Activas</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Estas son las sesiones activas en tu cuenta.</p>
                <div className="flex items-center justify-between rounded-xl border-2 border-border bg-muted/40 p-4 dark:border-[#264675] dark:bg-[#10203c]/70">
                    <div className="flex items-center gap-3">
                        <div className="icon-badge flex h-10 w-10 items-center justify-center">
                            <Monitor className="h-5 w-5 text-primary-600 dark:text-primary-100" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground">Chrome en Windows</p>
                            <p className="text-xs text-muted-foreground">Este dispositivo</p>
                        </div>
                    </div>
                    <Badge variant="success" className="shadow-sm">Activa</Badge>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="destructive" className="w-full mt-4 rounded-xl shadow-sm hover:shadow-md">Cerrar todas las demás sesiones</Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-xl">
                            <p>Cierra sesión en todos los dispositivos excepto este</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    </SettingsCard>
);

const AppearanceSettings = () => {
    const { theme, setTheme, isDark } = useTheme();
    const currentTheme = isDark ? 'dark' : (theme || 'light');

    const handleThemeChange = (value) => {
        setTheme(value);
    };

    return (
        <SettingsCard title="Apariencia" description="Personaliza la apariencia de la aplicación.">
            <div className="space-y-4">
                <Label className="text-sm font-semibold">Tema</Label>
                <RadioGroup value={currentTheme} onValueChange={handleThemeChange} className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 transition-colors hover:border-primary/60">
                        <RadioGroupItem value="light" id="theme-light" />
                        <Label htmlFor="theme-light" className="font-medium">Claro</Label>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 transition-colors hover:border-primary/60">
                        <RadioGroupItem value="dark" id="theme-dark" />
                        <Label htmlFor="theme-dark" className="font-medium">Oscuro</Label>
                    </div>
                </RadioGroup>
            </div>
        </SettingsCard>
    );
};

export default SettingsPage;

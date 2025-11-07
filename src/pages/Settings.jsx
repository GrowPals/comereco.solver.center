
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
    <Card className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <CardHeader className="space-y-3 pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
            {description && <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6 pb-24 pt-0">
            {children}
        </CardContent>
        {onSave && (
            <div className="surface-sticky sticky bottom-0 left-0 right-0 z-10 mt-auto rounded-b-2xl px-6 py-4">
                <Button onClick={onSave} disabled={isSaving} className="w-full rounded-xl shadow-lg hover:shadow-xl" size="lg">
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
                <div className="mx-auto flex w-full max-w-7xl flex-col-reverse gap-6 pb-6 pt-2 lg:grid lg:grid-cols-[22rem,minmax(0,1fr)] lg:items-start lg:gap-10">
                    <aside className="order-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg lg:order-1 lg:sticky lg:top-24 lg:h-fit">
                    <div className="hidden border-b border-border p-6 lg:block">
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
                            <SelectTrigger className="rounded-xl h-12 shadow-sm">
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
                                    'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 font-bold shadow-md border-2 border-primary-200'
                                        : 'hover:bg-muted text-foreground/90 hover:shadow-sm'
                                )}
                            >
                                <div className={cn(
                                    "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200",
                                    activeTab === tab.id ? 'bg-gradient-to-br from-primary-100 to-primary-200' : 'bg-muted'
                                )}>
                                    <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? 'text-primary-600' : 'text-muted-foreground')} aria-hidden="true" />
                                </div>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                    </aside>
                    <main className="order-1 w-full max-w-3xl space-y-6 lg:order-2">
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
        <div className="space-y-4">
            <Label>Idioma</Label>
            <Select defaultValue="es"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="es">Español</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-4">
            <Label>Zona Horaria</Label>
            <Select defaultValue="gmt-6"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="gmt-6">(GMT-6) Ciudad de México</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-4">
            <Label>Formato de Fecha</Label>
            <RadioGroup defaultValue="dmy"><div className="flex gap-4"><RadioGroupItem value="dmy" id="dmy"/><Label htmlFor="dmy">DD/MM/YYYY</Label></div></RadioGroup>
        </div>
    </SettingsCard>
);

const NotificationSettings = ({ onSave, isSaving }) => (
     <SettingsCard title="Notificaciones" description="Controla cómo y cuándo recibes notificaciones." onSave={onSave} isSaving={isSaving}>
        <h3 className="font-semibold">Notificaciones en la App</h3>
        <div className="flex items-center justify-between"><Label>Requisiciones aprobadas</Label><Switch defaultChecked /></div>
        <div className="flex items-center justify-between"><Label>Requisiciones rechazadas</Label><Switch defaultChecked /></div>
        <div className="flex items-center justify-between"><Label>Nuevos comentarios</Label><Switch defaultChecked /></div>
        
        <h3 className="font-semibold pt-4 border-t">Notificaciones por Email</h3>
        <div className="flex items-center justify-between"><Label>Enviar resumen semanal</Label><Switch /></div>
    </SettingsCard>
);

const PrivacySettings = ({ onSave, isSaving }) => (
    <SettingsCard title="Privacidad" description="Controla la visibilidad de tu información." onSave={onSave} isSaving={isSaving}>
        <RadioGroup defaultValue="team">
            <Label>Visibilidad del Perfil</Label>
            <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2"><RadioGroupItem value="team" id="team"/><Label htmlFor="team">Visible para todo mi equipo</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="admins" id="admins"/><Label htmlFor="admins">Visible solo para administradores</Label></div>
            </div>
        </RadioGroup>
        <div className="flex items-center justify-between"><Label>Mostrar mi estado de conexión</Label><Switch defaultChecked /></div>
    </SettingsCard>
);

const SecuritySettings = () => (
    <SettingsCard title="Seguridad" description="Gestiona la seguridad de tu cuenta.">
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
        <div className="pt-6 border-t-2 border-border">
            <h3 className="font-bold text-foreground text-lg mb-2">Sesiones Activas</h3>
            <p className="text-sm text-muted-foreground mb-4">Estas son las sesiones activas en tu cuenta.</p>
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

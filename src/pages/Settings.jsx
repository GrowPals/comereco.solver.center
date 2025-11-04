
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

const TABS = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'privacy', name: 'Privacidad', icon: Eye },
    { id: 'security', name: 'Seguridad', icon: Lock },
    { id: 'appearance', name: 'Preferencias', icon: Palette },
];

const SettingsCard = ({ title, description, children, onSave, isSaving }) => (
    <Card className="border-2 border-slate-200 shadow-lg rounded-2xl">
        <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-slate-900">{title}</CardTitle>
            {description && <CardDescription className="text-base text-slate-600 mt-2">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
            {children}
        </CardContent>
        {onSave && (
            <div className="p-6 pt-0">
                <Button onClick={onSave} disabled={isSaving} className="rounded-xl shadow-lg hover:shadow-xl" size="lg">
                    {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null} Guardar Cambios
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
            case 'appearance': return <AppearanceSettings onSave={() => handleSave('Preferencias')} isSaving={isSaving} />;
            default: return null;
        }
    };

    return (
        <>
            <Helmet><title>Configuración - ComerECO</title></Helmet>
            <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    <aside className="w-full lg:w-80 bg-white lg:border-r-2 border-b-2 lg:border-b-0 border-slate-200 lg:shadow-lg">
                    <div className="p-6 hidden lg:block border-b-2 border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm">
                                <Settings className="h-6 w-6 text-blue-600" aria-hidden="true" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Configuración</h2>
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
                                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-bold shadow-md border-2 border-blue-200'
                                        : 'hover:bg-slate-100 text-slate-700 hover:shadow-sm'
                                )}
                            >
                                <div className={cn(
                                    "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200",
                                    activeTab === tab.id ? 'bg-gradient-to-br from-blue-100 to-blue-200' : 'bg-slate-100'
                                )}>
                                    <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? 'text-blue-600' : 'text-slate-600')} aria-hidden="true" />
                                </div>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                    </aside>
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        {renderContent()}
                    </main>
                </div>
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
        <div className="pt-6 border-t-2 border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Sesiones Activas</h3>
            <p className="text-sm text-slate-600 mb-4">Estas son las sesiones activas en tu cuenta.</p>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        <Monitor className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">Chrome en Windows</p>
                        <p className="text-xs text-slate-600">Este dispositivo</p>
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

const AppearanceSettings = ({ onSave, isSaving }) => (
     <SettingsCard title="Apariencia" description="Personaliza la apariencia de la aplicación." onSave={onSave} isSaving={isSaving}>
        <div><Label>Tema</Label><RadioGroup defaultValue="light"><div className="flex gap-4 pt-2"><RadioGroupItem value="light" id="light"/><Label htmlFor="light">Claro</Label><RadioGroupItem value="dark" id="dark" disabled /><Label htmlFor="dark" className="text-muted-foreground">Oscuro (próximamente)</Label></div></RadioGroup></div>
    </SettingsCard>
);

export default SettingsPage;

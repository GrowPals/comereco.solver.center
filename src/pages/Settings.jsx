
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Bell, Lock, Palette, Eye, User, Briefcase, Trash2, Smartphone, Monitor, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/useToast';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const TABS = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'privacy', name: 'Privacidad', icon: Eye },
    { id: 'security', name: 'Seguridad', icon: Lock },
    { id: 'appearance', name: 'Preferencias', icon: Palette },
];

const SettingsCard = ({ title, description, children, onSave, isSaving }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
            {children}
        </CardContent>
        {onSave && (
            <div className="p-6 pt-0">
                <Button onClick={onSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Guardar Cambios
                </Button>
            </div>
        )}
    </Card>
);

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = (section) => {
        setIsSaving(true);
        setTimeout(() => {
            toast({
                title: 'Configuración Guardada',
                description: `Tus preferencias de ${section} han sido actualizadas.`,
            });
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
            <div className="flex flex-col lg:flex-row min-h-screen bg-muted">
                <aside className="w-full lg:w-64 bg-background lg:border-r border-b lg:border-b-0">
                    <div className="p-4 hidden lg:block border-b">
                        <h2 className="text-lg font-semibold">Configuración</h2>
                    </div>
                    {/* Mobile Dropdown */}
                    <div className="p-4 lg:hidden">
                        <Select value={activeTab} onValueChange={setActiveTab}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar sección" />
                            </SelectTrigger>
                            <SelectContent>
                                {TABS.map(tab => (
                                    <SelectItem key={tab.id} value={tab.id}>{tab.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Desktop Sidebar */}
                    <nav className="hidden lg:block space-y-1 p-2">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                                    activeTab === tab.id ? 'bg-muted text-primary font-semibold' : 'hover:bg-muted/50'
                                )}
                            >
                                <tab.icon className="h-5 w-5" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
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
        <Button variant="outline">Cambiar Contraseña</Button>
        <div className="pt-4 border-t">
            <h3 className="font-semibold">Sesiones Activas</h3>
            <p className="text-sm text-muted-foreground mb-4">Estas son las sesiones activas en tu cuenta.</p>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                <div className="flex items-center gap-3"><Monitor className="h-5 w-5"/><div><p className="font-medium">Chrome en Windows</p><p className="text-xs text-muted-foreground">Este dispositivo</p></div></div>
                <Badge variant="default" className="bg-green-500">Activa</Badge>
            </div>
            <Button variant="destructive" className="w-full mt-4">Cerrar todas las demás sesiones</Button>
        </div>
    </SettingsCard>
);

const AppearanceSettings = ({ onSave, isSaving }) => (
     <SettingsCard title="Apariencia" description="Personaliza la apariencia de la aplicación." onSave={onSave} isSaving={isSaving}>
        <div><Label>Tema</Label><RadioGroup defaultValue="light"><div className="flex gap-4 pt-2"><RadioGroupItem value="light" id="light"/><Label htmlFor="light">Claro</Label><RadioGroupItem value="dark" id="dark" disabled /><Label htmlFor="dark" className="text-muted-foreground">Oscuro (próximamente)</Label></div></RadioGroup></div>
    </SettingsCard>
);

export default SettingsPage;

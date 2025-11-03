
import React from 'react';
import { Helmet } from 'react-helmet';
import { HelpCircle, Mail, Book, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const HelpPage = () => {
    return (
        <>
            <Helmet><title>Centro de Ayuda - ComerECO</title></Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-md">
                                <HelpCircle className="h-7 w-7 text-blue-600" aria-hidden="true" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-1">
                                    Centro de <span className="bg-gradient-primary bg-clip-text text-transparent">Ayuda</span>
                                </h1>
                                <p className="text-base sm:text-lg text-slate-600">
                                    Encuentra respuestas y soporte para usar ComerECO
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Sección de Contacto Rápido */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                    Contacto por Email
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 mb-4">
                                    ¿Tienes una pregunta específica o necesitas asistencia técnica?
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => window.location.href = 'mailto:soporte@comereco.com'}
                                >
                                    soporte@comereco.com
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5 text-green-600" />
                                    Chat en Vivo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 mb-4">
                                    Habla directamente con nuestro equipo de soporte en tiempo real.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    disabled
                                >
                                    Próximamente
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preguntas Frecuentes */}
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Book className="h-5 w-5 text-amber-600" />
                                Preguntas Frecuentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-slate-900">¿Cómo crear una requisición?</h3>
                                <p className="text-sm text-slate-600">
                                    1. Ve al Catálogo y agrega productos al carrito<br />
                                    2. Haz clic en "Finalizar Compra" en el carrito<br />
                                    3. Selecciona un proyecto y agrega comentarios si lo deseas<br />
                                    4. Crea la requisición - quedará en estado "draft" hasta que la envíes
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-slate-900">¿Cómo aprobar una requisición?</h3>
                                <p className="text-sm text-slate-600">
                                    Solo los administradores y supervisores pueden aprobar requisiciones. Ve a la sección de "Aprobaciones" desde el menú lateral, revisa los detalles y usa los botones de "Aprobar" o "Rechazar".
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-slate-900">¿Qué son las plantillas?</h3>
                                <p className="text-sm text-slate-600">
                                    Las plantillas te permiten guardar configuraciones de carrito que usas frecuentemente. Puedes crear una plantilla desde el carrito o al hacer checkout, y luego reutilizarla para crear requisiciones más rápido.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-slate-900">¿Cómo funcionan los favoritos?</h3>
                                <p className="text-sm text-slate-600">
                                    Marca productos como favoritos haciendo clic en el ícono de corazón. Todos tus favoritos estarán disponibles en la sección "Favoritos" del menú para acceso rápido.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-slate-900">¿Quién puede ver mis requisiciones?</h3>
                                <p className="text-sm text-slate-600">
                                    Todas las requisiciones son privadas de tu empresa gracias a nuestro sistema de seguridad RLS (Row Level Security). Solo los miembros de tu organización pueden verlas.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Info adicional */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <HelpCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">¿No encuentras lo que buscas?</h3>
                                <p className="text-sm text-slate-600">
                                    Nuestro equipo de soporte está disponible para ayudarte. Envíanos un correo a{' '}
                                    <a href="mailto:soporte@comereco.com" className="text-blue-600 hover:underline font-medium">
                                        soporte@comereco.com
                                    </a>
                                    {' '}y te responderemos lo antes posible.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HelpPage;


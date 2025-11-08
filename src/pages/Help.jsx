
import React from 'react';
import { Helmet } from 'react-helmet';
import { HelpCircle, Mail, MessageCircle, ExternalLink, User, UserCheck, UserCog, ShoppingCart, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from '@/components/layout/PageContainer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { IconToken } from '@/components/ui/icon-token';

const faqData = [
  {
    role: 'Para Todos',
    icon: User,
    color: 'text-sky-600',
    questions: [
      {
        q: '¿Cómo crear una requisición?',
        a: '1. Ve al <strong>Catálogo</strong> y agrega productos al carrito.<br>2. Haz clic en <strong>"Finalizar Compra"</strong> en el carrito.<br>3. Selecciona un proyecto, centro de costos y agrega comentarios si lo deseas.<br>4. La requisición quedará en estado <strong>"Borrador"</strong> hasta que la envíes para aprobación.'
      },
      {
        q: '¿Qué son las plantillas?',
        a: 'Las plantillas te permiten guardar configuraciones de carrito que usas frecuentemente. Puedes crear una plantilla desde el carrito o al hacer checkout, y luego reutilizarla para crear requisiciones más rápido.'
      },
      {
        q: '¿Cómo funcionan los favoritos?',
        a: 'Marca productos como favoritos haciendo clic en el ícono de corazón. Todos tus favoritos estarán disponibles en la sección <strong>"Favoritos"</strong> del menú para acceso rápido.'
      }
    ]
  },
  {
    role: 'Supervisores',
    icon: UserCheck,
    color: 'text-emerald-600',
    questions: [
      {
        q: '¿Cómo aprobar o rechazar una requisición?',
        a: 'Ve a la sección de <strong>"Aprobaciones"</strong> desde el menú lateral. Ahí verás todas las requisiciones pendientes. Revisa los detalles y usa los botones de <strong>"Aprobar"</strong> o <strong>"Rechazar"</strong>. Si rechazas, deberás proporcionar un motivo.'
      },
      {
        q: '¿Puedo editar una requisición antes de aprobarla?',
        a: 'No directamente. Si una requisición necesita cambios, debes rechazarla indicando las correcciones necesarias para que el solicitante la edite y la envíe de nuevo.'
      }
    ]
  },
  {
    role: 'Administradores',
    icon: UserCog,
    color: 'text-indigo-600',
    questions: [
      {
        q: '¿Cómo gestiono usuarios y proyectos?',
        a: 'En la sección de <strong>Administración</strong>, encontrarás opciones para <strong>"Gestión de Usuarios"</strong> y <strong>"Gestión de Proyectos"</strong>. Desde ahí puedes invitar nuevos miembros, asignar roles y crear o archivar proyectos.'
      },
      {
        q: '¿Dónde veo los reportes y analíticas?',
        a: 'La sección de <strong>"Reportes y Analíticas"</strong> te ofrece una vista detallada de los gastos por proyecto, usuario y categoría. Puedes exportar estos datos para un análisis más profundo.'
      }
    ]
  }
];

const HelpPage = () => {
    return (
        <>
            <Helmet><title>Centro de Ayuda - ComerECO</title></Helmet>
            <PageContainer>
                <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
                    {/* Header */}
                    <header className="flex flex-col items-start gap-6 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between dark:border-border">
                        <div className="flex items-center gap-4">
                            <IconToken icon={HelpCircle} size="lg" aria-hidden="true" />
                            <div>
                                <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                    Centro de <span className="bg-gradient-primary bg-clip-text text-transparent">Ayuda</span>
                                </h1>
                                <p className="text-base text-muted-foreground sm:text-lg">
                                    Encuentra respuestas y soporte para usar ComerECO
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Sección de Contacto Rápido */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Card className="border border-border transition-shadow duration-300 hover:shadow-lg dark:border-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IconToken icon={Mail} size="sm" className="text-primary-600" aria-hidden="true" />
                                    Contacto por Email
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    ¿Tienes una pregunta específica o necesitas asistencia técnica?
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => window.location.href = 'mailto:team@growpals.mx'}
                                >
                                    team@growpals.mx
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border border-border transition-shadow duration-300 hover:shadow-lg dark:border-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IconToken icon={MessageCircle} size="sm" className="text-emerald-600" aria-hidden="true" />
                                    Chat en Vivo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 text-sm text-muted-foreground">
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
                    <Card className="border border-border dark:border-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <IconToken icon={HelpCircle} size="sm" className="text-muted-foreground" aria-hidden="true" />
                                Guía de Usuario y Preguntas Frecuentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full">
                                {faqData.map((section, index) => (
                                    <div key={index} className="mb-4 last:mb-0">
                                        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground">
                                            <IconToken icon={section.icon} size="sm" className={section.color} aria-hidden="true" />
                                            {section.role}
                                        </h3>
                                        {section.questions.map((faq, qIndex) => (
                                            <AccordionItem key={qIndex} value={`item-${index}-${qIndex}`}>
                                                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                                                    {faq.q}
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: faq.a }} />
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </div>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Info adicional */}
                    <div className="rounded-2xl border border-border bg-muted/40 p-6 shadow-lg transition-colors dark:border-border dark:bg-card/60">
                        <div className="flex items-start gap-4">
                            <div className="icon-badge flex h-10 w-10 flex-shrink-0 items-center justify-center">
                                <HelpCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="mb-1 font-bold text-foreground">¿No encuentras lo que buscas?</h3>
                                <p className="text-sm text-muted-foreground">
                                    Nuestro equipo de soporte está disponible para ayudarte. Envíanos un correo a{' '}
                                    <a href="mailto:team@growpals.mx" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
                                        team@growpals.mx
                                    </a>
                                    {' '}y te responderemos lo antes posible.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </>
    );
};

export default HelpPage;

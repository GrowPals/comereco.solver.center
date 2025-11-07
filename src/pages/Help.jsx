
import React from 'react';
import { Helmet } from 'react-helmet';
import { HelpCircle, Mail, MessageCircle, ExternalLink, User, UserCheck, UserCog, ShoppingCart, CheckCircle, Package, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from '@/components/layout/PageContainer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
                    <header className="mb-12">
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                            Centro de Ayuda
                        </h1>
                        <p className="text-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
                            Estamos aquí para ayudarte. Elige el método de contacto que prefieras o consulta nuestras guías y preguntas frecuentes
                        </p>
                    </header>

                    {/* Sección de Contacto Rápido */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {/* Card 1: Email */}
                        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-lg border border-neutral-200 dark:border-neutral-800 p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow duration-200">
                            {/* Icono */}
                            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            {/* Título */}
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                                Contacto por Email
                            </h3>
                            {/* Descripción */}
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                Envíanos un correo y te responderemos en menos de 24 horas
                            </p>
                            {/* Link de acción */}
                            <a
                                href="mailto:team@growpals.mx"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm flex items-center gap-2 group"
                            >
                                team@growpals.mx
                                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                        </div>

                        {/* Card 2: Chat en Vivo */}
                        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-lg border border-neutral-200 dark:border-neutral-800 p-6 opacity-75">
                            {/* Icono */}
                            <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                <MessageCircle className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
                            </div>
                            {/* Título */}
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                                Chat en Vivo
                            </h3>
                            {/* Descripción */}
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                Chatea en tiempo real con nuestro equipo de soporte
                            </p>
                            {/* Botón deshabilitado */}
                            <button
                                disabled
                                className="text-neutral-500 dark:text-neutral-500 font-semibold text-sm flex items-center gap-2 cursor-not-allowed"
                            >
                                Próximamente
                                <span className="text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
                                    Beta
                                </span>
                            </button>
                        </div>

                        {/* Card 3: Guía de Usuario */}
                        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-lg border border-neutral-200 dark:border-neutral-800 p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow duration-200">
                            {/* Icono */}
                            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            {/* Título */}
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                                Guía de Usuario
                            </h3>
                            {/* Descripción */}
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                Consulta tutoriales y documentación detallada
                            </p>
                            {/* Link de acción */}
                            <a
                                href="#guia"
                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold text-sm flex items-center gap-2 group"
                            >
                                Ver guía
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                        </div>
                    </div>

                    {/* Preguntas Frecuentes */}
                    <section id="guia" className="mb-12">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                            Preguntas Frecuentes
                        </h2>
                        <Card className="border border-border dark:border-border">
                            <CardContent className="pt-6">
                                <Accordion type="multiple" className="w-full">
                                    {faqData.map((section, index) => (
                                        <div key={index} className="mb-4 last:mb-0">
                                            <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground">
                                                <section.icon className={`h-5 w-5 ${section.color}`} />
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
                    </section>

                    {/* Info adicional */}
                    <div className="rounded-2xl border border-[rgba(66,84,112,0.55)] bg-[rgba(18,25,41,0.9)] p-6 shadow-[0_20px_45px_rgba(5,10,24,0.35)]">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(66,165,255,0.15)]">
                                <HelpCircle className="h-5 w-5 text-info" />
                            </div>
                            <div>
                                <h3 className="mb-1 font-bold text-foreground">¿No encuentras lo que buscas?</h3>
                                <p className="text-sm text-muted-foreground">
                                    Nuestro equipo de soporte está disponible para ayudarte. Envíanos un correo a{' '}
                                    <a href="mailto:team@growpals.mx" className="font-medium text-primary-600 hover:underline">
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

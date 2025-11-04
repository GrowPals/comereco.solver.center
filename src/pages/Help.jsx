
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
                                    onClick={() => window.location.href = 'mailto:team@growpals.mx'}
                                >
                                    team@growpals.mx
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
                                    Esta funcionalidad estará disponible próximamente
                                </Button>
                                <p className="text-xs text-slate-500 italic mt-2 text-center">
                                    Por ahora, contáctanos por email para soporte inmediato.
                                </p>
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
                        <CardContent className="space-y-8">
                            {/* REQUISICIONES */}
                            <div className="border-l-4 border-blue-500 pl-4 space-y-4">
                                <h2 className="text-lg font-bold text-blue-900">Requisiciones</h2>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Cómo crear una requisición completa?</h3>
                                    <p className="text-sm text-slate-600 mb-2">
                                        Las requisiciones son solicitudes formales de compra que deben ser aprobadas antes de convertirse en órdenes. Sigue estos pasos:
                                    </p>
                                    <ol className="text-sm text-slate-600 list-decimal ml-4 space-y-1">
                                        <li>Ve a la sección "Catálogo" desde el menú lateral</li>
                                        <li>Busca y agrega los productos necesarios al carrito usando el botón "Agregar al carrito"</li>
                                        <li>Revisa las cantidades en el carrito (puedes ajustarlas ahí mismo)</li>
                                        <li>Haz clic en "Finalizar Compra" cuando tengas todos los productos</li>
                                        <li>Selecciona el proyecto al que pertenecerá la requisición</li>
                                        <li>Agrega comentarios o instrucciones especiales (opcional)</li>
                                        <li>Crea la requisición - quedará en estado "Borrador"</li>
                                        <li>Revisa todo y haz clic en "Enviar" para enviarla a aprobación</li>
                                    </ol>
                                    <p className="text-sm text-slate-500 italic mt-2">
                                        💡 Consejo: Puedes guardar tu configuración como plantilla para futuras requisiciones similares.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Cómo usar el permiso especial de envío directo?</h3>
                                    <p className="text-sm text-slate-600">
                                        Si tienes el rol de "Administrador" o se te ha otorgado el permiso especial, puedes enviar requisiciones directamente sin pasar por el proceso de aprobación:
                                    </p>
                                    <ol className="text-sm text-slate-600 list-decimal ml-4 space-y-1">
                                        <li>Crea tu requisición siguiendo el proceso normal</li>
                                        <li>En la página de detalles, verás un botón adicional "Enviar Directo"</li>
                                        <li>Al hacer clic, la requisición pasará directamente a estado "Ordenada"</li>
                                        <li>El pedido se procesará inmediatamente sin necesitar aprobación</li>
                                    </ol>
                                    <p className="text-sm text-slate-500 italic mt-2">
                                        ⚠️ Importante: Este permiso se otorga solo a usuarios de confianza y para casos urgentes.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">Estados de las requisiciones: ¿Qué significa cada uno?</h3>
                                    <div className="text-sm text-slate-600 space-y-1">
                                        <p><span className="font-medium">• Borrador:</span> La requisición está guardada pero no enviada. Puedes editarla o eliminarla.</p>
                                        <p><span className="font-medium">• Enviada:</span> Esperando aprobación de un supervisor o administrador.</p>
                                        <p><span className="font-medium">• Aprobada:</span> Ha sido aprobada y está lista para ser ordenada.</p>
                                        <p><span className="font-medium">• Rechazada:</span> No fue aprobada. Revisa los comentarios del rechazo.</p>
                                        <p><span className="font-medium">• Ordenada:</span> La orden de compra ha sido generada y enviada al proveedor.</p>
                                        <p><span className="font-medium">• Cancelada:</span> La requisición fue cancelada y no se procesará.</p>
                                    </div>
                                </div>
                            </div>

                            {/* PROYECTOS Y ROLES */}
                            <div className="border-l-4 border-green-500 pl-4 space-y-4">
                                <h2 className="text-lg font-bold text-green-900">Proyectos y Roles</h2>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Cómo aprobar una requisición?</h3>
                                    <p className="text-sm text-slate-600">
                                        Solo los usuarios con rol de Administrador o Supervisor pueden aprobar requisiciones:
                                    </p>
                                    <ol className="text-sm text-slate-600 list-decimal ml-4 space-y-1">
                                        <li>Ve a la sección "Aprobaciones" desde el menú lateral</li>
                                        <li>Verás todas las requisiciones pendientes de tu proyecto</li>
                                        <li>Haz clic en "Ver Detalle" para revisar cada requisición</li>
                                        <li>Revisa los productos, cantidades y el presupuesto total</li>
                                        <li>Usa el botón "Aprobar" para autorizar o "Rechazar" con un comentario</li>
                                        <li>Si rechazas, debes proporcionar una razón clara para el solicitante</li>
                                    </ol>
                                    <p className="text-sm text-slate-500 italic mt-2">
                                        💡 Consejo: Puedes ver el historial de aprobaciones en la sección de Reportes.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Cómo un supervisor puede agregar usuarios a su proyecto?</h3>
                                    <p className="text-sm text-slate-600">
                                        Los supervisores tienen permisos para gestionar su equipo de proyecto:
                                    </p>
                                    <ol className="text-sm text-slate-600 list-decimal ml-4 space-y-1">
                                        <li>Ve a la sección "Proyectos" desde el menú lateral</li>
                                        <li>Selecciona el proyecto que supervisas</li>
                                        <li>En la pestaña "Miembros", haz clic en "Agregar Usuario"</li>
                                        <li>Busca al usuario por nombre o email</li>
                                        <li>Asigna el rol apropiado (Usuario, Comprador, etc.)</li>
                                        <li>Confirma la adición - el usuario recibirá una notificación</li>
                                    </ol>
                                    <p className="text-sm text-slate-500 italic mt-2">
                                        ⚠️ Nota: Solo puedes agregar usuarios que ya estén registrados en tu empresa.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Cómo funcionan las estadísticas por proyecto?</h3>
                                    <p className="text-sm text-slate-600">
                                        Cada proyecto tiene su propio dashboard con métricas clave:
                                    </p>
                                    <ul className="text-sm text-slate-600 list-disc ml-4 space-y-1">
                                        <li><span className="font-medium">Presupuesto:</span> Monto asignado vs. gastado del periodo</li>
                                        <li><span className="font-medium">Requisiciones:</span> Total, pendientes, aprobadas y rechazadas</li>
                                        <li><span className="font-medium">Tiempo promedio:</span> Desde creación hasta aprobación</li>
                                        <li><span className="font-medium">Top productos:</span> Los más solicitados en el proyecto</li>
                                        <li><span className="font-medium">Usuarios activos:</span> Miembros que han creado requisiciones</li>
                                    </ul>
                                    <p className="text-sm text-slate-500 italic mt-2">
                                        💡 Los administradores pueden ver estadísticas de todos los proyectos.
                                    </p>
                                </div>
                            </div>

                            {/* USUARIOS Y PERMISOS */}
                            <div className="border-l-4 border-purple-500 pl-4 space-y-4">
                                <h2 className="text-lg font-bold text-purple-900">Usuarios y Permisos</h2>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Qué hacer si no puedo ver un proyecto o producto?</h3>
                                    <p className="text-sm text-slate-600">
                                        Si no puedes acceder a ciertos recursos, verifica lo siguiente:
                                    </p>
                                    <ol className="text-sm text-slate-600 list-decimal ml-4 space-y-1">
                                        <li>Confirma que estés asignado al proyecto (ve a "Proyectos" → "Mis Proyectos")</li>
                                        <li>Verifica tu rol en el proyecto (algunos recursos requieren permisos especiales)</li>
                                        <li>Asegúrate de que el producto esté activo y disponible para tu empresa</li>
                                        <li>Si el problema persiste, contacta a tu supervisor o administrador</li>
                                        <li>Como último recurso, envía un correo a team@growpals.mx con los detalles</li>
                                    </ol>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">Roles y permisos: ¿Qué puede hacer cada rol?</h3>
                                    <div className="text-sm text-slate-600 space-y-2">
                                        <p className="font-medium">Administrador:</p>
                                        <ul className="list-disc ml-4 space-y-1">
                                            <li>Acceso completo a todos los módulos</li>
                                            <li>Gestionar usuarios y proyectos</li>
                                            <li>Aprobar/rechazar cualquier requisición</li>
                                            <li>Ver reportes globales</li>
                                            <li>Configurar parámetros del sistema</li>
                                        </ul>

                                        <p className="font-medium mt-2">Supervisor:</p>
                                        <ul className="list-disc ml-4 space-y-1">
                                            <li>Aprobar requisiciones de su proyecto</li>
                                            <li>Agregar usuarios a su proyecto</li>
                                            <li>Ver reportes de su proyecto</li>
                                            <li>Crear y gestionar plantillas</li>
                                        </ul>

                                        <p className="font-medium mt-2">Usuario/Comprador:</p>
                                        <ul className="list-disc ml-4 space-y-1">
                                            <li>Crear y enviar requisiciones</li>
                                            <li>Ver catálogo de productos</li>
                                            <li>Gestionar favoritos y plantillas personales</li>
                                            <li>Ver sus propias requisiciones</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* PEDIDOS Y CATÁLOGO */}
                            <div className="border-l-4 border-amber-500 pl-4 space-y-4">
                                <h2 className="text-lg font-bold text-amber-900">Pedidos y Catálogo</h2>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Qué son las plantillas y cómo usarlas?</h3>
                                    <p className="text-sm text-slate-600">
                                        Las plantillas son configuraciones guardadas de productos que usas frecuentemente:
                                    </p>
                                    <ol className="text-sm text-slate-600 list-decimal ml-4 space-y-1">
                                        <li>Crea una plantilla desde el carrito con productos seleccionados</li>
                                        <li>Dale un nombre descriptivo (ej: "Material Oficina Mensual")</li>
                                        <li>Para usarla, ve a "Plantillas" desde el menú</li>
                                        <li>Haz clic en "Usar plantilla" y todos los productos se agregarán al carrito</li>
                                        <li>Puedes ajustar cantidades antes de crear la requisición</li>
                                        <li>Las plantillas pueden ser personales o compartidas con el equipo</li>
                                    </ol>
                                    <p className="text-sm text-slate-500 italic mt-2">
                                        💡 Ideal para pedidos recurrentes como material de oficina o limpieza.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Cómo funcionan los favoritos?</h3>
                                    <p className="text-sm text-slate-600">
                                        Los favoritos te permiten acceso rápido a productos frecuentes:
                                    </p>
                                    <ul className="text-sm text-slate-600 list-disc ml-4 space-y-1">
                                        <li>Marca cualquier producto como favorito con el ícono ❤️</li>
                                        <li>Accede a todos tus favoritos desde el menú lateral</li>
                                        <li>Los favoritos son personales, cada usuario tiene los suyos</li>
                                        <li>Puedes filtrar el catálogo para ver solo favoritos</li>
                                        <li>Organiza favoritos por categorías para mejor navegación</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Cómo buscar productos eficientemente?</h3>
                                    <p className="text-sm text-slate-600">
                                        Utiliza estas técnicas para encontrar productos rápidamente:
                                    </p>
                                    <ul className="text-sm text-slate-600 list-disc ml-4 space-y-1">
                                        <li>Usa la barra de búsqueda con palabras clave específicas</li>
                                        <li>Filtra por categorías para reducir resultados</li>
                                        <li>Ordena por precio, nombre o disponibilidad</li>
                                        <li>Usa el código SKU si lo conoces para búsqueda exacta</li>
                                        <li>Los productos usados recientemente aparecen primero</li>
                                    </ul>
                                </div>
                            </div>

                            {/* CUENTA Y CONFIGURACIÓN */}
                            <div className="border-l-4 border-red-500 pl-4 space-y-4">
                                <h2 className="text-lg font-bold text-red-900">Cuenta y Configuración</h2>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Cómo reportar un problema o error?</h3>
                                    <p className="text-sm text-slate-600">
                                        Si encuentras un problema, sigue estos pasos para reportarlo:
                                    </p>
                                    <ol className="text-sm text-slate-600 list-decimal ml-4 space-y-1">
                                        <li>Toma una captura de pantalla del error (si es posible)</li>
                                        <li>Anota la fecha, hora y qué acción estabas realizando</li>
                                        <li>Envía un correo a team@growpals.mx con:
                                            <ul className="list-disc ml-4 mt-1">
                                                <li>Asunto claro (ej: "Error al crear requisición")</li>
                                                <li>Descripción detallada del problema</li>
                                                <li>Pasos para reproducir el error</li>
                                                <li>Capturas de pantalla adjuntas</li>
                                                <li>Tu nombre de usuario y empresa</li>
                                            </ul>
                                        </li>
                                        <li>Recibirás confirmación de recepción en 24 horas</li>
                                        <li>El equipo técnico te contactará con la solución</li>
                                    </ol>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Quién puede ver mis requisiciones y datos?</h3>
                                    <p className="text-sm text-slate-600">
                                        Tu privacidad y seguridad son nuestra prioridad:
                                    </p>
                                    <ul className="text-sm text-slate-600 list-disc ml-4 space-y-1">
                                        <li>Solo usuarios de tu empresa pueden ver tus requisiciones</li>
                                        <li>Usamos RLS (Row Level Security) para aislar datos por empresa</li>
                                        <li>Los administradores de tu empresa pueden ver todas las requisiciones</li>
                                        <li>Los supervisores solo ven requisiciones de sus proyectos</li>
                                        <li>Los usuarios regulares solo ven sus propias requisiciones</li>
                                        <li>Toda la comunicación está encriptada con SSL/TLS</li>
                                        <li>Cumplimos con estándares de protección de datos empresariales</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900">¿Cómo cambiar mi contraseña o información?</h3>
                                    <p className="text-sm text-slate-600">
                                        Para actualizar tu información personal:
                                    </p>
                                    <ol className="text-sm text-slate-600 list-decimal ml-4 space-y-1">
                                        <li>Ve a "Configuración" desde el menú lateral</li>
                                        <li>Selecciona la pestaña "Mi Perfil"</li>
                                        <li>Actualiza tu nombre, teléfono o foto de perfil</li>
                                        <li>Para cambiar contraseña, haz clic en "Cambiar Contraseña"</li>
                                        <li>Si olvidaste tu contraseña, usa "Recuperar Contraseña" en el login</li>
                                        <li>Los cambios de email deben ser aprobados por un administrador</li>
                                    </ol>
                                </div>
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
                                    <a href="mailto:team@growpals.mx" className="text-blue-600 hover:underline font-medium">
                                        team@growpals.mx
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


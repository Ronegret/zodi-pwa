export default function PrivacidadPage() {
  return (
    <>
      <h1 className="text-3xl font-black text-lime-300">Política de Privacidad</h1>
      <p className="text-sm text-white/50">Última actualización: Mayo 2026</p>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">1. ¿Qué datos recogemos?</h2>
      <p>
        Para que ZODI funcione y no te lance lecturas genéricas que le servirían a tu gato, necesitamos conocer ciertos datos. Si decides crearte una cuenta, guardaremos:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-2 text-white/80">
        <li><strong>Datos de cuenta:</strong> Tu nombre, correo electrónico y contraseña encriptada (o token de sesión si usas proveedores externos).</li>
        <li><strong>Datos astrales:</strong> Fecha, hora y lugar de nacimiento. Sin esto, la astrología no pasa del horóscopo de revista de los 90.</li>
        <li><strong>Datos de uso:</strong> Tus preferencias, lecturas guardadas, favoritos, historial y rachas para que tu experiencia en la plataforma sea progresiva y no tengas que empezar de cero cada día.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">2. ¿Para qué usamos tus datos?</h2>
      <p>Básicamente, para darte el servicio que has venido a buscar:</p>
      <ul className="list-disc pl-5 mt-2 space-y-2 text-white/80">
        <li>Calcular tu carta natal, horóscopos diarios, biorritmos y otras lecturas místicas.</li>
        <li>Mantener tu sesión abierta y gestionar tus logros o gemas en el ecosistema ZODI.</li>
        <li>Mejorar el tono y sarcasmo de nuestras respuestas para que se adapten a tus preferencias (suave, directo, brutal o sarcástico).</li>
      </ul>
      <p className="mt-4">
        <strong>Lo que NO hacemos:</strong> No vendemos tu carta natal ni tus preguntas del oráculo a agencias de publicidad. Tu crisis existencial de las 3 AM es tuya y solo tuya.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">3. Cookies y Almacenamiento Local</h2>
      <p>
        Usamos "cookies" (y localStorage/sessionStorage) estrictamente necesarias para el funcionamiento técnico de la plataforma:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-2 text-white/80">
        <li>Mantenerte logueado.</li>
        <li>Guardar tus preferencias de UI (modo oscuro, tono de voz).</li>
        <li>Recordar si ya cerraste ese banner molesto de cookies.</li>
      </ul>
      <p className="mt-4">
        No usamos cookies de rastreo de terceros para perseguirte con anuncios de cuarzos por todo internet.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">4. Seguridad</h2>
      <p>
        Tus datos están protegidos bajo estándares de seguridad estándar (https, contraseñas hasheadas, base de datos asegurada). Hacemos lo posible para mantener tus secretos a salvo, pero recuerda que nada en internet es 100% impenetrable. Sentido común, por favor: no pongas tu número de tarjeta de crédito en una pregunta de tarot.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">5. Retención y Eliminación de Datos</h2>
      <p>
        Guardamos tu perfil mientras tengas cuenta activa. Si te cansas del universo y decides borrar tu cuenta, eliminaremos tus datos personales de nuestra base de datos.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">6. Cambios en esta política</h2>
      <p>
        Si cambiamos cómo tratamos tus datos de forma significativa, te avisaremos mediante una notificación en la app o un correo electrónico. No haremos cambios ocultos en letra pequeña.
      </p>
    </>
  );
}

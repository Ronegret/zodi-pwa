export default function TerminosPage() {
  return (
    <>
      <h1 className="text-3xl font-black text-lime-300">Términos de Servicio</h1>
      <p className="text-sm text-white/50">Última actualización: Mayo 2026</p>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">1. Aceptación</h2>
      <p>
        Al usar ZODI, crear una cuenta o interactuar con el Oráculo, aceptas estos términos. Si no estás de acuerdo, el botón de cerrar pestaña está arriba a la derecha (o izquierda, dependiendo de tu sistema).
      </p>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">2. Naturaleza del Servicio (Importante)</h2>
      <p className="font-bold text-orange-300">
        ZODI ES UNA PLATAFORMA DE ENTRETENIMIENTO.
      </p>
      <p className="mt-2">
        La astrología, el tarot, la numerología y demás mancias son herramientas simbólicas e introspectivas. Ninguna lectura de ZODI debe interpretarse como asesoramiento profesional, médico, psicológico, legal o financiero.
      </p>
      <ul className="list-disc pl-5 mt-4 space-y-2 text-white/80">
        <li>Si tienes un problema de salud, ve al médico. ZODI no puede diagnosticarte.</li>
        <li>Si tienes deudas, ve a un asesor financiero. ZODI no pagará tu alquiler si inviertes tus ahorros basándote en una carta del tarot.</li>
        <li>Tú eres el único responsable de las decisiones que tomes tras consultar el oráculo. El cosmos no se hace responsable civil subsidiario.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">3. Uso de la Comunidad</h2>
      <p>
        ZODI incluye funciones sociales (foros, comentarios, confesionarios). Te pedimos que te comportes como un adulto funcional:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-2 text-white/80">
        <li>No insultes, no acoses, no hagas spam.</li>
        <li>No compartas información privada (doxxing).</li>
        <li>Nos reservamos el derecho de banear a cualquier usuario que rompa la armonía del servidor (y con "armonía" nos referimos a respeto básico).</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">4. Pagos y Suscripciones (Planes Premium)</h2>
      <p>
        Algunas funciones avanzadas de ZODI están disponibles bajo modelos de suscripción o pago por uso (comprando gemas).
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-2 text-white/80">
        <li>Las compras son definitivas. Dado que los servicios digitales se consumen instantáneamente, no ofrecemos reembolsos por gemas gastadas o suscripciones ya iniciadas, salvo que la ley local indique lo contrario.</li>
        <li>Puedes cancelar tu suscripción en cualquier momento y mantendrás el acceso hasta el final del periodo facturado.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">5. Propiedad Intelectual</h2>
      <p>
        El código, el diseño, la marca "ZODI", el personaje, el arte y el tono característico son propiedad nuestra. Puedes hacer capturas de tus lecturas y compartirlas en redes sociales (¡por favor hazlo!), pero no puedes copiar ni clonar la app para venderla como tuya.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-4 text-lime-100">6. Limitación de Responsabilidad</h2>
      <p>
        Proporcionamos ZODI "tal cual". A veces el servidor se caerá, a veces el oráculo tardará en responder, o una actualización podría borrar tu racha por accidente. Trabajamos para que esto no pase, pero no podemos ofrecer garantías absolutas ni compensaciones económicas por tiempos de inactividad.
      </p>
    </>
  );
}

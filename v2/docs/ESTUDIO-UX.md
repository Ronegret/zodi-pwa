# Estudio de usabilidad — primera vez en ZODI (12/10/2026)

**Método.** Recorrido completo de una persona nueva en móvil (Pixel 7): portada → registro → 5 pasos del alta → panel → lecturas → horóscopo → carta → oráculo → comunidad → progreso → ajustes. Capturas automáticas (`tests/e2e/journey.spec.ts`, con `PREVIEW=1`) y revisión heurística (claridad, jerga, carga inicial, coherencia, accesibilidad, honestidad).

**La pregunta guía:** ¿entiende alguien que nunca ha usado una app de astrología qué es ZODI, qué tiene que hacer y qué significa lo que ve?

## Hallazgos y qué se ha hecho

| #   | Hallazgo                                                                                            | Gravedad | Cambio                                                                                                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | El oráculo gastaba una lectura por mensaje: con 5 al día no se puede conversar.                     | Alta     | Cuota propia del oráculo (15 al día; 60 durante los 30 días gratis). "Te quedan N mensajes. No gastan tus lecturas."                                                                                                                           |
| 2   | Oráculo en móvil: una imagen enorme ocupaba la primera pantalla y las sugerencias quedaban tapadas. | Alta     | Cabecera compacta con ZODI y los "tres pilares" con los que lee, "cómo funciona" en 3 pasos, 6 sugerencias por tema y preguntas de seguimiento tras cada respuesta.                                                                            |
| 3   | Jerga sin explicar en el panel: "trígono", "orbe 0.0°", "Big three", porcentajes negativos.         | Alta     | Cada tránsito en palabras normales ("El Sol da viento a favor a tu imagen") con fuerza "Exacto hoy / Se nota / Suave"; "Tus tres pilares" con qué es cada uno; "¿Qué es esto?" desplegable en tránsitos, biorritmo, carta del día y elementos. |
| 4   | Nadie guía al llegar: el panel enseña 8 tarjetas sin orden.                                         | Alta     | "Tus primeros pasos con ZODI": 5 pasos con el porqué y el siguiente destacado; desaparece al completarlo.                                                                                                                                      |
| 5   | El alta pide datos sin decir para qué (hora, lugar).                                                | Media    | En cada paso ZODI explica por qué lo pide, en una frase. Nombre de usuario propuesto automáticamente.                                                                                                                                          |
| 6   | El último paso del alta eran avisos que todavía no existen.                                         | Media    | Sustituido por "Sobre ti" (opcional): situación sentimental y unas líneas, que sí mejoran las lecturas. Avisos en Ajustes, marcados "muy pronto".                                                                                              |
| 7   | Elegir tono sin saber cómo suena.                                                                   | Media    | Cada tono con una frase de ejemplo (alta, Ajustes y demo de la portada).                                                                                                                                                                       |
| 8   | Ajustes sin "Sobre ti", sin contraseña ni borrar cuenta; fecha "1990-04-15" y "Europe/Madrid".      | Media    | "Sobre ti" (pareja, hijos, quién eres), cuenta con plan y días gratis, cambiar contraseña, borrar cuenta con confirmación (RGPD); fechas legibles.                                                                                             |
| 9   | La carta habla de "Casas Placidus" y no explica cómo leerla.                                        | Media    | "Tus tres pilares, en palabras normales" con botón para que ZODI la interprete y "¿Cómo se lee la rueda?".                                                                                                                                     |
| 10  | Rangos y saludos solo en femenino ("Recién aterrizada", "Bienvenida").                              | Media    | Rangos sin género (Polvo de estrellas, Aprendiz del cosmos, Radar de señales, Ojo del cosmos, Oráculo sin filtro) y saludo neutro.                                                                                                             |
| 11  | La portada no explica en segundos qué es ZODI.                                                      | Alta     | "Qué es ZODI, en 20 segundos" (3 ideas) y demo interactiva: cambia el tono y mira cómo te habla, pregunta al oráculo (ejemplos) y dale la vuelta a una carta del Tarot ZODI.                                                                   |
| 12  | Avisos (toasts) tapando la barra inferior y el botón del oráculo en el móvil.                       | Baja     | Los avisos suben por encima de ambos.                                                                                                                                                                                                          |
| 13  | Con más secciones, "Cerrar sesión" quedaba fuera de pantalla en portátiles bajos.                   | Alta     | Menú lateral desplazable.                                                                                                                                                                                                                      |

## Modelo de acceso (decisión de Rodrigo)

30 días con todo gratis para cada cuenta (las que ya existían, desde el 12/10/2026): 40 lecturas y 60 mensajes al oráculo al día. Después, cuenta gratis con 5 lecturas y 15 mensajes. Sin tarjeta. Se comunica en la portada, el panel y Ajustes.

## Pendiente (siguiente ronda)

- Comprobar el recorrido con personas reales (5 sesiones de 15 minutos bastan para ver el 80 % de los problemas).
- Avisos de verdad (correo diario con el horóscopo) cuando Resend tenga el dominio verificado.
- Compartir una lectura como imagen (lo que más trae gente nueva en apps de horóscopo).
- Medir: cuántas personas completan el alta, cuántas hacen su primera lectura el primer día y cuántas vuelven al día siguiente.

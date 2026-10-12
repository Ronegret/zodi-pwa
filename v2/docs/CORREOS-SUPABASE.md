# Correos de acceso en español (Supabase)

Supabase envía por defecto los correos de acceso en inglés y sin marca. Estas plantillas los dejan en español y con el estilo de ZODI. Se pegan una vez en el panel de Supabase.

**Dónde:** Supabase → proyecto `zodi` → Authentication → Emails → Templates.

| Plantilla de Supabase | Asunto | Archivo |
|---|---|---|
| Confirm signup | Confirma tu correo y entra en ZODI | `supabase/templates/confirmar-cuenta.html` |
| Reset password | Tu nueva contraseña de ZODI | `supabase/templates/recuperar-clave.html` |
| Change email address | Confirma tu nuevo correo de ZODI | `supabase/templates/cambiar-correo.html` |

**Pasos para cada una:**
1. Elige la plantilla en la lista.
2. Pega el asunto de la tabla en **Subject**.
3. Abre el archivo, copia todo y pégalo en **Message body**, sustituyendo lo que haya.
4. Pulsa **Save changes**.

**Notas**
- `{{ .ConfirmationURL }}`, `{{ .Email }}` y `{{ .NewEmail }}` son variables de Supabase: se dejan tal cual.
- El logo se carga desde `https://zodi.aibueno.es/brand/logo-email-240.png` (PNG, para que se vea también en Outlook).
- Mientras no esté configurado Resend como servidor de correo (SMTP), Supabase solo envía 2 correos por hora y la confirmación de registro sigue desactivada. Con Resend verificado: Authentication → Emails → SMTP Settings, activar la confirmación por correo y probar un registro.

# Auditor de Citas Médicas

Aplicación web para auditoría de calidad médica: coteja la **Transcripción** de una videoconsulta contra la **Nota Médica** registrada, detecta la especialidad de la cita y genera un informe de cumplimiento/incumplimiento (🚩) siguiendo los criterios institucionales de auditoría de telemedicina.

## Estado de los módulos por especialidad

| Especialidad | Estado |
| --- | --- |
| Medicina General | ✅ Configurado |
| Ginecología | ✅ Configurado |
| Pediatría | ✅ Configurado |
| Medicina Interna | ✅ Configurado |
| Psicología | ✅ Configurado |
| Nutrición | ⏳ Pendiente (falta su prompt y documentos) |
| Medicina Metabólica | ⏳ Pendiente (falta su prompt y documentos) |

Medicina General, Ginecología, Pediatría y Medicina Interna comparten el mismo prompt de auditoría (`src/lib/prompts/generalEspecialidadesPrompt.ts`), con matices propios de cada una cargados desde `data/reference/`. Psicología tiene su propio prompt (`src/lib/prompts/psicologiaPrompt.ts`) y su propia base de referencia (`data/reference/psicologia/`), ya que evalúa criterios distintos (áreas emocional/cognitiva/conductual/social, instrumentos psicométricos, Guía de Consulta de Psicología, etc.). `src/lib/promptRouter.ts` decide qué módulo usar según la especialidad detectada/seleccionada.

## Cómo funciona

1. El usuario pega o sube (`.txt`, `.docx`, `.pdf`) la **Nota Médica** y la **Transcripción** de la consulta.
2. La app intenta detectar automáticamente la especialidad a partir del campo `Especialidad:` de la nota (o el usuario la selecciona manualmente).
3. Si la nota tiene el formato de encabezado `Cita Médica del AAAA-MM-DD a las HH:MM / Diagnóstico: / Médico: / Especialidad:` y cambia de una cita a otra, la app exige subir una nueva transcripción antes de analizar.
4. Al enviar, el backend arma el prompt de auditoría completo (instrucciones + anexos de referencia institucionales) y lo envía al proveedor de IA elegido (Claude o Gemini) usando la API key configurada por el usuario.
5. El informe se muestra en pantalla en el formato tabular estricto definido por el prompt.

## Configuración de IA

Desde "⚙️ Ajustes del proveedor de IA" en la propia app se elige el proveedor (Anthropic Claude o Google Gemini) y se ingresa la API key correspondiente. La key se guarda **solo en el navegador** (`localStorage`) y se reenvía en cada solicitud vía encabezado; el servidor nunca la persiste.

## Base de conocimiento (`data/reference/`)

JSON generados a partir de los documentos institucionales subidos (reglas de auditoría 2.0, criterios de referencia interna por especialidad, patologías de seguimiento obligatorio, problemas activos/ECNT, scripts de telemedicina, listado de medicamentos/estudios activos, ponderación de calidad, clasificación No Conformidad vs. Evento de Riesgo). `src/lib/referenceContext.ts` los combina en los "ANEXOS" que se añaden al prompt en lugar de los enlaces de Google Sheets/Docs originales (no accesibles en tiempo de ejecución).

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # build de producción
npm run lint    # eslint
```

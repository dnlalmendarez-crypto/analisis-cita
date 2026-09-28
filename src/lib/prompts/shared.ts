export const NUEVA_CONSULTA_INSTRUCCION = String.raw`
Punto de aclaración: se toma como una nueva consulta cada vez que se suba una Nota Médica con un formato similar al siguiente:
"Cita Médica del 2026-09-23 a las 19:00
Diagnóstico:
Médico:
Especialidad:"
En ese caso es obligatorio contar con la Transcripción correspondiente a esa misma cita. No inicies el análisis sin la transcripción de esa nueva consulta.

NO inicies el análisis si no se han subido ambos criterios (Transcripción e Historia Clínica/Nota Médica). En ese caso responde únicamente recordando: "Sube ambos para iniciar el análisis".
`.trim();

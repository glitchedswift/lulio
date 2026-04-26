// UI strings only. Lesson content is bilingual by design and not translated here.
import { getLang } from "./state.js";

const STRINGS = {
  es: {
    "home.tagline": "Aprende catalán desde el español, jugando.",
    "home.start": "Empezar",
    "home.continue": "Continuar",
    "home.disclaimer": "Sin cuenta · Tu progreso se guarda en este navegador.",

    "roadmap.title": "Tu camino",
    "roadmap.lessons_done": "lecciones completadas",
    "roadmap.tap_lesson": "Toca una lección para empezar",

    "lesson.goal": "Objetivo",
    "lesson.topic": "Tema",
    "lesson.extra": "Extra",
    "lesson.check": "Comprobar",
    "lesson.continue": "Continuar",
    "lesson.skip": "Saltar tema",
    "lesson.next_topic": "Siguiente tema",
    "lesson.finish": "Finalizar",
    "lesson.back": "Volver al mapa",
    "lesson.translate_es_ca": "Traduce al catalán",
    "lesson.translate_ca_es": "Traduce al español",
    "lesson.choose_correct": "Elige la traducción correcta",
    "lesson.listen_pick": "Escucha y elige lo que oyes",
    "lesson.fill_blank": "Completa la frase",
    "lesson.flashcard": "Aprende esta palabra",
    "lesson.compare": "Compara español y catalán",
    "lesson.tap_to_hear": "Toca para escuchar",
    "lesson.correct": "¡Correcto!",
    "lesson.incorrect": "Casi… la respuesta es:",
    "lesson.placeholder.title": "Próximamente",
    "lesson.placeholder.body": "Esta lección aún no está disponible. ¡Vuelve pronto!",

    "completion.title": "¡Lección completada!",
    "completion.subtitle": "Vas genial. Continúa con el camino.",
    "completion.back_to_map": "Volver al mapa",

    "tts.no_voice": "Tu navegador no tiene voz catalana instalada; usaremos español como aproximación.",
  },
  ca: {
    "home.tagline": "Aprèn català des de l'espanyol, jugant.",
    "home.start": "Comença",
    "home.continue": "Continua",
    "home.disclaimer": "Sense compte · El teu progrés es desa en aquest navegador.",

    "roadmap.title": "El teu camí",
    "roadmap.lessons_done": "lliçons completades",
    "roadmap.tap_lesson": "Toca una lliçó per començar",

    "lesson.goal": "Objectiu",
    "lesson.topic": "Tema",
    "lesson.extra": "Extra",
    "lesson.check": "Comprova",
    "lesson.continue": "Continua",
    "lesson.skip": "Salta el tema",
    "lesson.next_topic": "Següent tema",
    "lesson.finish": "Finalitza",
    "lesson.back": "Torna al mapa",
    "lesson.translate_es_ca": "Tradueix al català",
    "lesson.translate_ca_es": "Tradueix a l'espanyol",
    "lesson.choose_correct": "Tria la traducció correcta",
    "lesson.listen_pick": "Escolta i tria el que sents",
    "lesson.fill_blank": "Completa la frase",
    "lesson.flashcard": "Aprèn aquesta paraula",
    "lesson.compare": "Compara espanyol i català",
    "lesson.tap_to_hear": "Toca per escoltar",
    "lesson.correct": "Correcte!",
    "lesson.incorrect": "Gairebé… la resposta és:",
    "lesson.placeholder.title": "Properament",
    "lesson.placeholder.body": "Aquesta lliçó encara no està disponible. Torna aviat!",

    "completion.title": "Lliçó completada!",
    "completion.subtitle": "Vas molt bé. Segueix el camí.",
    "completion.back_to_map": "Torna al mapa",

    "tts.no_voice": "El teu navegador no té veu catalana instal·lada; farem servir l'espanyol com a aproximació.",
  },
};

export function t(key) {
  const lang = getLang();
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.es[key] || key;
}

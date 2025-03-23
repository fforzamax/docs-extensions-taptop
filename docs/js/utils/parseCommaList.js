/**
 * Простейший хелпер для парсинга строк по запятой.
 * - Разбивает по запятой
 * - Тримит
 * - Удаляет пустые
 */
export function parseCommaList(str) {
  if (!str) return [];
  return str
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

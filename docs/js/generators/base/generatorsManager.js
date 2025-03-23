/**
 * Класс для централизованного управления генераторами кода.
 * Позволяет регистрировать, инициализировать и уничтожать генераторы на основе их доступности на странице.
 */
export class GeneratorsManager {
  constructor(debug = false) {
    /** @type {Map<string, Object>} Зарегистрированные генераторы (ключ: имя, значение: данные) */
    this.generators = new Map();

    /** @type {Array<Object>} Массив активных экземпляров генераторов для групповых операций */
    this.instances = [];

    /** @type {boolean} Инициализирован ли менеджер */
    this.initialized = false;

    /** @type {boolean} Включен ли режим отладки с выводом подробных логов */
    this.debug = debug;
  }

  /**
   * Выводит отладочные сообщения в консоль, если включен режим отладки.
   * @param {...any} args - Аргументы для вывода в консоль
   * @private
   */
  log(...args) {
    if (this.debug) {
      console.log(...args);
    }
  }

  /**
   * Регистрирует новый генератор в системе.
   * @param {string} name - Уникальное имя генератора для дальнейшего обращения
   * @param {Class} GeneratorClass - Класс генератора, который будет инстанцирован
   * @param {string} selector - CSS-селектор, определяющий целевой элемент на странице
   * @returns {GeneratorsManager} - Текущий экземпляр для цепочки вызовов
   */
  register(name, GeneratorClass, selector) {
    this.generators.set(name, { GeneratorClass, selector, instance: null });
    return this;
  }

  /**
   * Инициализирует все зарегистрированные генераторы.
   * Предварительно уничтожает существующие экземпляры, чтобы избежать дублирования.
   * @returns {GeneratorsManager} - Текущий экземпляр для цепочки вызовов
   */
  initAll() {
    if (this.initialized) {
      this.destroyAll();
    }

    this.log("GeneratorsManager: Инициализация всех генераторов");

    this.generators.forEach((_, name) => {
      this.initGenerator(name);
    });

    this.initialized = true;
    this.log("GeneratorsManager: Все генераторы инициализированы");

    return this;
  }

  /**
   * Инициализирует отдельный генератор по его имени.
   * Если генератор уже существует, он будет уничтожен и создан заново.
   * @param {string} name - Имя генератора для инициализации
   * @returns {boolean} - true, если генератор был успешно инициализирован, иначе false
   */
  initGenerator(name) {
    const generator = this.generators.get(name);
    if (!generator) {
      console.warn(`GeneratorsManager: Генератор "${name}" не найден`);
      return false;
    }

    const element = document.querySelector(generator.selector);
    if (!element) {
      this.log(
        `GeneratorsManager: Селектор для генератора "${name}" не найден на странице`
      );
      return false;
    }

    // Уничтожаем предыдущий экземпляр, если он существует
    if (generator.instance) {
      this.destroyGenerator(name);
    }

    try {
      generator.instance = new generator.GeneratorClass();
      generator.instance.init();
      this.instances.push(generator.instance);

      this.log(`GeneratorsManager: Генератор "${name}" инициализирован`);
      return true;
    } catch (error) {
      console.error(
        `GeneratorsManager: Ошибка при инициализации генератора "${name}":`,
        error
      );
      return false;
    }
  }

  /**
   * Уничтожает отдельный генератор по его имени.
   * Вызывает метод destroy у экземпляра генератора, если такой метод существует.
   * @param {string} name - Имя генератора для уничтожения
   */
  destroyGenerator(name) {
    const generator = this.generators.get(name);
    if (!generator || !generator.instance) return;

    try {
      if (typeof generator.instance.destroy === "function") {
        generator.instance.destroy();
      }

      const index = this.instances.indexOf(generator.instance);
      if (index !== -1) {
        this.instances.splice(index, 1);
      }

      generator.instance = null;
      this.log(`GeneratorsManager: Генератор "${name}" уничтожен`);
    } catch (error) {
      console.error(
        `GeneratorsManager: Ошибка при уничтожении генератора "${name}":`,
        error
      );
    }
  }

  /**
   * Уничтожает все активные генераторы.
   * Вызывает метод destroy у каждого экземпляра, если такой метод существует.
   */
  destroyAll() {
    this.log("GeneratorsManager: Уничтожение всех генераторов");

    for (const instance of this.instances) {
      try {
        if (typeof instance.destroy === "function") {
          instance.destroy();
        }
      } catch (error) {
        console.error(
          "GeneratorsManager: Ошибка при уничтожении экземпляра:",
          error
        );
      }
    }

    this.instances = [];
    this.generators.forEach((generator) => {
      generator.instance = null;
    });

    this.initialized = false;
  }

  /**
   * Сбрасывает состояние менеджера, уничтожая все генераторы.
   */
  reset() {
    this.destroyAll();
    this.log("GeneratorsManager: Состояние менеджера сброшено");
  }
}

// Глобальный экземпляр с отключенным режимом отладки
const generatorsManager = new GeneratorsManager(false);

/**
 * Функция для инициализации всех генераторов.
 * Асинхронно загружает модули генераторов, регистрирует их и инициализирует.
 * @async
 */
export async function initAllGenerators() {
  try {
    // Асинхронно импортируем все модули генераторов
    const [cookieModule, smoothScrollModule, multilandingModule] =
      await Promise.all([
        import("../cookieGenerator.js"),
        import("../smoothScrollGenerator.js"),
        import("../multilandingGenerator.js"),
      ]);

    // Извлекаем классы из модулей
    const { CookieGenerator } = cookieModule;
    const { SmoothScrollGenerator } = smoothScrollModule;
    const { MultilandingGenerator } = multilandingModule;

    // Регистрируем генераторы с соответствующими селекторами
    generatorsManager
      .register("cookie", CookieGenerator, "#cookie-generator")
      .register(
        "smoothScroll",
        SmoothScrollGenerator,
        "#smooth-scroll-generator"
      )
      .register("dynamicContent", MultilandingGenerator, ".dcm-container");

    // Инициализируем все генераторы
    generatorsManager.initAll();
  } catch (error) {
    console.error("Ошибка при инициализации генераторов:", error);
  }
}

export default generatorsManager;

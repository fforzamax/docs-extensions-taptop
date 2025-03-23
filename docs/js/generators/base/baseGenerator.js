import { minifyCode } from "../../utils/minifyCode.js";

/**
 * Базовый класс для всех генераторов кода
 */
export class BaseGenerator {
  constructor(options = {}) {
    this.options = {
      ...options,
    };

    this.elements = {};
    this.initialized = false;
    this.eventsInitialized = false;

    // Сохраняем ссылки на обработчики событий
    this._eventHandlers = {
      modalClose: null,
      modalOverlayClick: null,
      escKeyPress: null,
      generateButtonClick: null,
    };
  }

  /**
   * Инициализирует генератор:
   * 1. Находит необходимые DOM-элементы
   * 2. Привязывает обработчики событий
   * 3. Устанавливает начальное состояние
   *
   * @returns {BaseGenerator} Текущий экземпляр для цепочки вызовов
   */
  init() {
    if (this.initialized) {
      console.log(`${this.constructor.name}: Уже инициализирован, пропускаем`);
      return this;
    }

    console.log(`${this.constructor.name}: Инициализация`);

    this.findElements();
    this.bindEvents();
    this.setInitialState();

    this.initialized = true;
    return this;
  }

  /**
   * Находит необходимые DOM-элементы и сохраняет их в this.elements
   * Дочерние классы должны расширять этот метод для поиска специфичных элементов
   */
  findElements() {
    // Универсальные элементы, которые часто нужны
    this.elements.generateButton = document.getElementById("generate-btn");
    this.elements.modal = document.getElementById("success-modal");
    this.elements.closeModal = document.querySelectorAll(
      ".close-modal, .close-button"
    );
    this.elements.jsCode = document.getElementById("js-code");
  }

  /**
   * Привязывает основные обработчики событий.
   * Дочерние классы могут расширять этот метод для добавления
   * специфичных обработчиков событий.
   */
  bindEvents() {
    if (this.eventsInitialized) {
      console.log(`${this.constructor.name}: События уже инициализированы`);
      return;
    }

    // Для кнопки генерации, если она используется в базовом классе
    if (this.elements.generateButton) {
      this._eventHandlers.generateButtonClick = () =>
        this.generateAndCopyCode();
      this.elements.generateButton.addEventListener(
        "click",
        this._eventHandlers.generateButtonClick
      );
    }

    // Привязываем общие события для модального окна
    this.bindDefaultModalCloseEvents();
    this.eventsInitialized = true;
  }

  /**
   * Привязывает обработчики событий для закрытия модального окна:
   * - Клик по кнопкам закрытия
   * - Клик по оверлею модального окна
   * - Нажатие клавиши Escape
   *
   * @private
   */
  bindDefaultModalCloseEvents() {
    const { modal, closeModal } = this.elements;
    if (!modal) return;

    // Сохраняем ссылки на обработчики
    this._eventHandlers.modalClose = () => this.closeModal();
    this._eventHandlers.modalOverlayClick = (event) => {
      if (event.target === modal) this.closeModal();
    };
    this._eventHandlers.escKeyPress = (event) => {
      if (event.key === "Escape" && modal.style.display !== "none") {
        this.closeModal();
      }
    };

    // Назначаем обработчики
    closeModal?.forEach((btn) =>
      btn.addEventListener("click", this._eventHandlers.modalClose)
    );

    modal.addEventListener("click", this._eventHandlers.modalOverlayClick);
    document.addEventListener("keydown", this._eventHandlers.escKeyPress);
  }

  /**
   * Удаляет все обработчики событий, назначенные в bindEvents()
   * Должен вызываться при уничтожении генератора для предотвращения
   * утечек памяти.
   */
  unbindEvents() {
    if (!this.eventsInitialized) return;

    console.log(`${this.constructor.name}: Удаление обработчиков событий`);

    // Удаляем обработчики закрытия модалки
    const { modal, closeModal } = this.elements;

    // Удаляем обработчики закрытия модалки по кнопкам
    if (closeModal && this._eventHandlers.modalClose) {
      closeModal.forEach((btn) =>
        btn.removeEventListener("click", this._eventHandlers.modalClose)
      );
    }

    // Удаляем обработчик закрытия модалки по оверлею
    if (modal && this._eventHandlers.modalOverlayClick) {
      modal.removeEventListener("click", this._eventHandlers.modalOverlayClick);
    }

    // Удаляем обработчик закрытия модалки по ESC
    if (this._eventHandlers.escKeyPress) {
      document.removeEventListener("keydown", this._eventHandlers.escKeyPress);
    }

    // Удаляем обработчик с кнопки генерации кода
    if (
      this.elements.generateButton &&
      this._eventHandlers.generateButtonClick
    ) {
      this.elements.generateButton.removeEventListener(
        "click",
        this._eventHandlers.generateButtonClick
      );
    }

    // Очищаем ссылки на обработчики
    Object.keys(this._eventHandlers).forEach((key) => {
      this._eventHandlers[key] = null;
    });

    // Сбрасываем флаг
    this.eventsInitialized = false;
  }

  /**
   * Устанавливает начальное состояние генератора.
   * Должен быть переопределен в дочерних классах для установки
   * начальных значений в элементы формы и т.п.
   */
  setInitialState() {
    // Реализация в дочерних классах
  }

  /**
   * Шаблонный метод, реализующий общий алгоритм:
   * 1. Собирает данные из формы (collectData)
   * 2. Генерирует код на основе данных (generateCode)
   * 3. Выводит код в элемент jsCode, если он существует
   * 4. Копирует код в буфер обмена и уведомляет пользователя
   */
  generateAndCopyCode() {
    const settings = this.collectData(); // Сами дочерние классы решают, что здесь собирать
    const code = this.generateCode(settings);

    if (this.elements.jsCode) {
      this.elements.jsCode.textContent = code;
    }
    this.copyAndNotify(code);
  }

  /**
   * Собирает данные из формы или других источников.
   * Должен быть переопределен в дочерних классах.
   *
   * @returns {Object} Объект с настройками для генерации кода
   */
  collectData() {
    // Пустая базовая реализация
    return {};
  }

  /**
   * Генерирует код на основе предоставленных настроек.
   * Абстрактный метод, должен быть переопределен в дочерних классах.
   *
   * @param {Object} settings - Настройки для генерации кода
   * @returns {string} Сгенерированный код
   * @throws {Error} Если метод не переопределен в дочернем классе
   */
  generateCode() {
    throw new Error(
      "Метод generateCode должен быть переопределён в дочернем классе"
    );
  }

  /**
   * Копирует сгенерированный код в буфер обмена и отображает уведомление.
   * Использует Clipboard API с fallback на execCommand для старых браузеров.
   *
   * @param {string} code - Код для копирования
   * @returns {string} Минифицированный код
   * @async
   */
  async copyAndNotify(code) {
    const minified = minifyCode(code);

    try {
      await navigator.clipboard.writeText(minified);
      this.showSuccessModal();
    } catch (err) {
      console.error("Ошибка при копировании через Clipboard API:", err);
      this.fallbackCopy(minified);
    }

    return minified;
  }

  /**
   * Резервный метод копирования в буфер обмена через устаревший API.
   * Используется, если современный Clipboard API недоступен.
   *
   * @param {string} text - Текст для копирования
   * @private
   */
  fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);

    try {
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (success) {
        this.showSuccessModal();
      } else {
        this.showErrorModal("Не удалось скопировать код");
      }
    } catch (err) {
      document.body.removeChild(textarea);
      this.showErrorModal("Возникла ошибка при копировании кода");
    }
  }

  /**
   * Закрывает модальное окно с результатом операции
   */
  closeModal() {
    if (this.elements.modal) {
      this.elements.modal.style.display = "none";
    }
  }

  /**
   * Отображает модальное окно с сообщением об успешном копировании.
   * Если модальное окно не найдено, выводит alert.
   */
  showSuccessModal() {
    if (this.elements.modal) {
      this.elements.modal.style.display = "flex";
    } else {
      alert("Код успешно скопирован в буфер обмена!");
    }
  }

  /**
   * Отображает сообщение об ошибке.
   *
   * @param {string} message - Текст сообщения об ошибке
   */
  showErrorModal(message) {
    alert(message || "Произошла ошибка. Попробуйте ещё раз.");
  }

  /**
   * Уничтожает экземпляр генератора:
   * 1. Удаляет все обработчики событий
   * 2. Сбрасывает флаг инициализации
   */
  destroy() {
    this.unbindEvents();
    console.log(`${this.constructor.name}: Уничтожен`);
    this.initialized = false;
  }
}

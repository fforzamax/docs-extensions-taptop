import { minifyCode } from "../../utils/minifyCode.js";

/**
 * Базовый класс для всех генераторов кода
 */
export class BaseGenerator {
  constructor(options = {}) {
    this.options = {
      modalId: "success-modal",
      ...options,
    };

    this.elements = {};
    this.initialized = false;
    this.eventsInitialized = false;
  }

  /**
   * Инициализация генератора
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
   * Поиск основных элементов в DOM.
   * Дочерние классы дополняют/переопределяют при необходимости.
   */
  findElements() {
    // Универсальные элементы, которые часто нужны
    this.elements.generateButton = document.getElementById("generate-btn");
    this.elements.modal = document.getElementById(this.options.modalId);
    this.elements.closeModal = document.querySelectorAll(
      ".close-modal, .close-button"
    );
    this.elements.jsCode = document.getElementById("js-code");
  }

  /**
   * Привязка основных обработчиков событий.
   * Дочерние классы дополняют/переопределяют при необходимости.
   */
  bindEvents() {
    if (this.eventsInitialized) {
      console.log(`${this.constructor.name}: События уже инициализированы`);
      return;
    }
    // Привязываем общие события для модального окна:
    this.bindDefaultModalCloseEvents();
    // Отметим, что всё инициализировано
    this.eventsInitialized = true;
  }

  /**
   * Привязываем универсальные события на закрытие модалки
   */
  bindDefaultModalCloseEvents() {
    const { modal, closeModal } = this.elements;
    if (!modal) return;

    closeModal?.forEach((btn) =>
      btn.addEventListener("click", () => this.closeModal())
    );

    modal.addEventListener("click", (event) => {
      if (event.target === modal) this.closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.style.display !== "none") {
        this.closeModal();
      }
    });
  }

  /**
   * Удаление обработчиков событий
   */
  unbindEvents() {
    if (!this.eventsInitialized) return;

    console.log(`${this.constructor.name}: Удаление обработчиков событий`);
    // Тут при необходимости мы можем отцеплять слушатели
    // (если нужно вручную хранить ссылки на функции, как в SmoothScroll).
    // Сейчас у нас общий case – делаем минимальное.

    this.eventsInitialized = false;
  }

  /**
   * Установка начального состояния генератора
   * Дочерние классы переопределяют при необходимости
   */
  setInitialState() {
    // Реализация в дочерних классах
  }

  /**
   * Шаблонный метод: "Собери → Сгенерируй → Скопируй → Покажи результат"
   */
  generateAndCopyCode() {
    const settings = this.collectData(); // Сами дочерние классы решают, что здесь собирать
    const code = this.generateCode(settings);
    // Если нужно вывести в <pre id="js-code">:
    if (this.elements.jsCode) {
      this.elements.jsCode.textContent = code;
    }
    this.copyAndNotify(code);
  }

  /**
   * Сбор данных (дочерний класс переопределяет).
   */
  collectData() {
    // Пустая базовая реализация
    return {};
  }

  /**
   * Генерация кода (дочерний класс переопределяет).
   */
  generateCode() {
    throw new Error(
      "Метод generateCode должен быть переопределён в дочернем классе"
    );
  }

  /**
   * Копирование кода в буфер обмена и отображение уведомления
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
   * Резервный метод копирования в буфер обмена
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
   * Закрыть модалку
   */
  closeModal() {
    if (this.elements.modal) {
      this.elements.modal.style.display = "none";
    }
  }

  /**
   * Показать сообщение об успехе
   */
  showSuccessModal() {
    if (this.elements.modal) {
      this.elements.modal.style.display = "flex";
    } else {
      alert("Код успешно скопирован в буфер обмена!");
    }
  }

  /**
   * Показать сообщение об ошибке
   */
  showErrorModal(message) {
    alert(message || "Произошла ошибка. Попробуйте ещё раз.");
  }

  /**
   * Уничтожает экземпляр генератора
   */
  destroy() {
    this.unbindEvents();
    console.log(`${this.constructor.name}: Уничтожен`);
    this.initialized = false;
  }
}

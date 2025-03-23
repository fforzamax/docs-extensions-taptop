import { BaseGenerator } from "./base/baseGenerator.js";

export class CookieGenerator extends BaseGenerator {
  constructor() {
    super();

    // Конфигурация по умолчанию
    this.config = {
      cookieName: "cookieAgreement",
      expiryDays: 30,
      popupClass: "popup-cookie",
      consentBtnClass: "button-cookie",
      rejectBtnClass: "button-no-cookie",
      closeBtnClass: "pop-up__inside-close-button",
      overlayClass: "pop-up__overlay",
    };
  }

  /**
   * @override
   * Находит все необходимые DOM-элементы
   */
  findElements() {
    super.findElements();

    this.elements.inputs = {
      expiryDays: document.getElementById("expiry-days"),
      popupClass: document.getElementById("popup-class"),
      consentBtnClass: document.getElementById("consent-btn-class"),
      rejectBtnClass: document.getElementById("reject-btn-class"),
    };
  }

  /**
   * @override
   * Устанавливает начальные значения в форму на основе конфигурации
   */
  setInitialState() {
    const { inputs } = this.elements;

    if (inputs) {
      if (inputs.expiryDays) inputs.expiryDays.value = this.config.expiryDays;
      if (inputs.popupClass) inputs.popupClass.value = this.config.popupClass;
      if (inputs.consentBtnClass)
        inputs.consentBtnClass.value = this.config.consentBtnClass;
      if (inputs.rejectBtnClass)
        inputs.rejectBtnClass.value = this.config.rejectBtnClass;
    }
  }

  /**
   * @override
   * Собирает данные из формы для генерации кода
   * @returns {Object} Настройки для генерации
   */
  collectData() {
    const { inputs } = this.elements;
    const { cookieName, closeBtnClass, overlayClass } = this.config;

    // Возвращаем настройки, используя значения из формы или значения по умолчанию
    return {
      cookieName,
      expiryDays: inputs.expiryDays?.value || this.config.expiryDays,
      popupClass: inputs.popupClass?.value || this.config.popupClass,
      consentBtnClass:
        inputs.consentBtnClass?.value || this.config.consentBtnClass,
      rejectBtnClass:
        inputs.rejectBtnClass?.value || this.config.rejectBtnClass,
      closeBtnClass,
      overlayClass,
    };
  }

  /**
   * @override
   * Генерирует JavaScript код для работы с cookie-уведомлениями
   * @param {Object} settings - Настройки для генерации кода
   * @returns {string} Сгенерированный код
   */
  generateCode(settings = {}) {
    return `<!-- Расширение - Cookie  -->
    <script>
    document.addEventListener("DOMContentLoaded", () => {
    // Функции для работы с cookie
    const cookies = {
      get: (name) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : undefined;
      },
      set: (name, value, options = {}) => {
        options = { path: '/', ...options };
        if (options.expires) {
          const date = new Date();
          date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
          options.expires = date.toUTCString();
        }
        let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
        for (const [key, val] of Object.entries(options)) {
          updatedCookie += '; ' + key + (val !== true ? '=' + val : '');
        }
        document.cookie = updatedCookie;
      }
    };

    const ui = {
      banner: document.querySelector(".${settings.popupClass}"),
      consentBtn: document.querySelector(".${settings.consentBtnClass}"),
      rejectBtn: document.querySelector(".${settings.rejectBtnClass}"),
      closeBtn: document.querySelector(".${settings.closeBtnClass}"),
      overlay: document.querySelector(".${settings.overlayClass}")
    };

    const hideBanner = () => {
      if (ui.banner) ui.banner.style.display = "none";
    };

    // Если cookie отсутствует и баннер найден – показываем баннер и назначаем обработчики
    if (cookies.get("${settings.cookieName}") === undefined && ui.banner) {
      ui.banner.style.display = "flex";
      ui.closeBtn?.addEventListener("click", hideBanner);
      ui.overlay?.addEventListener("click", hideBanner);
      ui.consentBtn?.addEventListener("click", () => {
        cookies.set("${settings.cookieName}", "true", { expires: ${settings.expiryDays} });
        hideBanner();
      });
      ui.rejectBtn?.addEventListener("click", () => {
        cookies.set("${settings.cookieName}", "false", { expires: ${settings.expiryDays} });
        hideBanner();
      });
    }
  });
</script>`;
  }
}

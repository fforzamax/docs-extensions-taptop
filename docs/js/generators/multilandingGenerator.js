import { BaseGenerator } from "./base/baseGenerator.js";
import { parseCommaList } from "../utils/parseCommaList.js";

/**
 * Генератор динамического контента для мультилендингов на основе UTM-параметров и геоданных.
 * Позволяет настраивать замену текста и отображение блоков на основе:
 * - UTM-параметров в URL
 * - Геолокации посетителя (через GeoJS API)
 *
 * @extends BaseGenerator
 */
export class MultilandingGenerator extends BaseGenerator {
  constructor() {
    super();

    /**
     * Конфигурация по умолчанию
     * @type {Object}
     * @property {Array} textReplacements - Правила замены текста
     * @property {Array} blockVisibility - Правила отображения блоков
     * @property {Object} defaultBlockVisibility - Настройки отображения блоков по умолчанию
     * @property {Array} ipRules - Правила на основе геолокации
     */
    this.config = {
      textReplacements: [
        {
          keyword: "service",
          defaultValue: "наши услуги",
          utmRules: [
            {
              paramName: "utm_content",
              paramValue: "design",
              replacementValue: "услуги дизайна",
            },
          ],
        },
      ],
      blockVisibility: [
        {
          paramName: "utm_campaign",
          paramValue: "sale",
          showBlocks: ["block1"],
          hideBlocks: ["block2"],
        },
      ],
      defaultBlockVisibility: {
        showBlocks: [],
        hideBlocks: [],
      },
      ipRules: [
        {
          country: "Russia",
          city: "*",
          region: "*",
          textReplacements: [
            {
              keyword: "region",
              defaultValue: "в вашем регионе",
              replacementValue: "в России",
            },
          ],
          showBlocks: [],
          hideBlocks: [],
        },
      ],
    };

    /**
     * Активная вкладка в интерфейсе
     * @type {string}
     */
    this.activeTab = "text";

    /**
     * Шаблоны для рендеринга UI
     * @type {Object}
     */
    this.templates = {};

    /**
     * Хранилище для обработчиков событий модального окна со списком стран
     * @type {Object}
     * @private
     */
    this._countriesModalHandlers = {
      escKeyPress: null,
    };
  }

  /**
   * @override
   * Находит все необходимые DOM-элементы
   */
  findElements() {
    super.findElements();

    this.elements = {
      ...this.elements,
      textReplacementsContainer: document.getElementById(
        "text-replacements-container"
      ),
      blockVisibilityContainer: document.getElementById(
        "block-visibility-container"
      ),
      ipRulesContainer: document.getElementById("ip-rules-container"),
      defaultShowBlocks: document.getElementById("default-show-blocks"),
      defaultHideBlocks: document.getElementById("default-hide-blocks"),
      tabButtons: document.querySelectorAll(".tab-button"),
      tabContents: document.querySelectorAll(".tab-content"),
      addTextReplacementBtn: document.getElementById("add-text-replacement"),
      addBlockRuleBtn: document.getElementById("add-block-rule"),
      addIpRuleBtn: document.getElementById("add-ip-rule"),
      // Шаблоны
      templates: {
        textReplacement: document.getElementById("text-replacement-template"),
        utmRule: document.getElementById("utm-rule-template"),
        blockRule: document.getElementById("block-rule-template"),
        ipRule: document.getElementById("ip-rule-template"),
        ipTextReplacement: document.getElementById(
          "ip-text-replacement-template"
        ),
      },
    };

    this.templates = this.elements.templates;
  }

  /**
   * @override
   * Привязывает обработчики событий к интерактивным элементам формы
   */
  bindEvents() {
    super.bindEvents();

    const {
      tabButtons,
      addTextReplacementBtn,
      addBlockRuleBtn,
      addIpRuleBtn,
      defaultShowBlocks,
      defaultHideBlocks,
    } = this.elements;

    // Обработчики для вкладок
    tabButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        this.switchTab(button.getAttribute("data-tab"));
      });
    });

    // Обработчики для кнопок добавления правил
    addTextReplacementBtn?.addEventListener("click", () =>
      this.addTextReplacement()
    );
    addBlockRuleBtn?.addEventListener("click", () => this.addBlockRule());
    addIpRuleBtn?.addEventListener("click", () => this.addIpRule());

    // Обработчики для полей настроек по умолчанию
    defaultShowBlocks?.addEventListener("change", (e) => {
      this.config.defaultBlockVisibility.showBlocks = parseCommaList(
        e.target.value
      );
    });
    defaultHideBlocks?.addEventListener("change", (e) => {
      this.config.defaultBlockVisibility.hideBlocks = parseCommaList(
        e.target.value
      );
    });
  }

  /**
   * @override
   * Удаляет все обработчики событий, в том числе специфичные для мультилендинга
   */
  unbindEvents() {
    super.unbindEvents();

    // Удаляем обработчики для модального окна со странами, если они существуют
    this.closeCountriesModal();
  }

  /**
   * @override
   * Устанавливает начальное состояние формы
   */
  setInitialState() {
    const { defaultShowBlocks, defaultHideBlocks } = this.elements;
    const { showBlocks, hideBlocks } = this.config.defaultBlockVisibility;

    // Подставляем значения в поля для блоков по умолчанию
    if (defaultShowBlocks) {
      defaultShowBlocks.value = showBlocks.join(", ");
    }
    if (defaultHideBlocks) {
      defaultHideBlocks.value = hideBlocks.join(", ");
    }

    // Рендерим все секции интерфейса
    this.renderAll();

    // Переключаемся на активную вкладку
    this.switchTab(this.activeTab);
  }

  /**
   * Отрисовывает все секции пользовательского интерфейса:
   * - Текстовые замены
   * - Настройки видимости блоков
   * - Правила IP-геолокации
   */
  renderAll() {
    this.renderTextReplacements();
    this.renderBlockVisibility();
    this.renderIpRules();
  }

  /**
   * Переключает активную вкладку в интерфейсе
   *
   * @param {string} tabId - Идентификатор вкладки для активации
   */
  switchTab(tabId) {
    const { tabContents, tabButtons } = this.elements;
    this.activeTab = tabId;

    // Скрываем все вкладки и снимаем активное состояние с кнопок
    if (tabContents) {
      tabContents.forEach((tab) => tab.classList.remove("active"));
    }

    if (tabButtons) {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
    }

    // Активируем нужную вкладку и кнопку
    const tabContent = document.getElementById(`${tabId}-tab`);
    const tabButton = document.querySelector(
      `.tab-button[data-tab="${tabId}"]`
    );

    if (tabContent) {
      tabContent.classList.add("active");
    }

    if (tabButton) {
      tabButton.classList.add("active");
    }
  }

  //
  // УПРАВЛЕНИЕ ПРАВИЛАМИ
  //

  /**
   * Добавляет новое правило текстовой замены
   */
  addTextReplacement() {
    this.config.textReplacements.push({
      keyword: "",
      defaultValue: "",
      utmRules: [],
    });
    this.renderTextReplacements();
  }

  /**
   * Добавляет новое правило для видимости блоков
   */
  addBlockRule() {
    this.config.blockVisibility.push({
      paramName: "utm_content",
      paramValue: "",
      showBlocks: [],
      hideBlocks: [],
    });
    this.renderBlockVisibility();
  }

  /**
   * Добавляет новое правило для геолокации
   */
  addIpRule() {
    this.config.ipRules.push({
      country: "",
      city: "*",
      region: "*",
      textReplacements: [],
      showBlocks: [],
      hideBlocks: [],
    });
    this.renderIpRules();
  }

  //
  // РЕНДЕРИНГ UI
  //

  /**
   * Отрисовывает секцию с настройками текстовых замен
   */
  renderTextReplacements() {
    const container = this.elements.textReplacementsContainer;
    const tpl = this.templates.textReplacement;
    if (!container || !tpl) return;
    container.innerHTML = "";

    this.config.textReplacements.forEach((item, index) => {
      const clone = tpl.content.cloneNode(true);
      clone.querySelector(".rule-index").textContent = index + 1;

      // Кнопка удаления
      clone
        .querySelector(".remove-text-replacement")
        .addEventListener("click", () => {
          this.config.textReplacements.splice(index, 1);
          this.renderTextReplacements();
        });

      // Поле keyword (ключ)
      const keywordInput = clone.querySelector(".keyword-input");
      keywordInput.value = item.keyword;
      keywordInput.addEventListener("change", (e) => {
        item.keyword = e.target.value;
      });

      // Поле defaultValue
      const defaultValueInput = clone.querySelector(".default-value-input");
      defaultValueInput.value = item.defaultValue;
      defaultValueInput.addEventListener("change", (e) => {
        item.defaultValue = e.target.value;
      });

      // Контейнер для UTM-правил
      const utmContainer = clone.querySelector(".utm-rules-container");
      item.utmRules.forEach((utmRule, ruleIndex) => {
        this.addUtmRuleToContainer(utmContainer, item, utmRule, ruleIndex);
      });

      // Кнопка добавления UTM-правила
      const addUtmButton = clone.querySelector(".add-utm-rule");
      addUtmButton.addEventListener("click", () => {
        item.utmRules.push({
          paramName: "utm_content",
          paramValue: "",
          replacementValue: "",
        });
        this.renderTextReplacements();
      });

      // Заголовок UTM скрываем, если нет правил
      const utmHeader = clone.querySelector(".section-divider");
      if (utmHeader) {
        utmHeader.style.display = item.utmRules.length ? "flex" : "none";
      }

      container.append(clone);
    });
  }

  /**
   * Добавляет UTM-правило в контейнер
   *
   * @param {HTMLElement} container - Контейнер для добавления правила
   * @param {Object} parentItem - Родительское правило текстовой замены
   * @param {Object} utmRule - Данные UTM-правила
   * @param {number} ruleIndex - Индекс правила в массиве
   * @private
   */
  addUtmRuleToContainer(container, parentItem, utmRule, ruleIndex) {
    const tpl = this.templates.utmRule;
    if (!container || !tpl) return;
    const clone = tpl.content.cloneNode(true);

    // Индекс правила
    const indexElement = clone.querySelector(".utm-rule-index");
    if (indexElement) {
      indexElement.textContent = ruleIndex + 1;
    }

    // Кнопка удаления
    const removeButton = clone.querySelector(".remove-utm-rule");
    if (removeButton) {
      removeButton.addEventListener("click", () => {
        parentItem.utmRules.splice(ruleIndex, 1);
        this.renderTextReplacements();
      });
    }

    // Селектор имени параметра
    const paramNameSelect = clone.querySelector(".param-name-select");
    const customContainer = clone.querySelector(".dcm-custom-param-container");
    const customInput = customContainer.querySelector(".custom-param-input");

    /**
     * Переключает видимость поля для кастомного параметра
     * @param {string} value - Значение параметра
     * @private
     */
    const toggleCustom = (value) => {
      const standardParams = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
      ];
      const isCustom = !standardParams.includes(value);

      if (customContainer) {
        customContainer.style.display = isCustom ? "block" : "none";
      }

      if (isCustom && customInput && customInput.value === "") {
        customInput.value = value;
      }
    };

    // Устанавливаем начальное значение и состояние
    if (paramNameSelect) {
      const standardParams = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
      ];
      const isCustom = !standardParams.includes(utmRule.paramName);

      paramNameSelect.value = isCustom ? "custom" : utmRule.paramName;
      toggleCustom(utmRule.paramName);

      if (isCustom && customInput) {
        customInput.value = utmRule.paramName;
      }

      paramNameSelect.addEventListener("change", (e) => {
        if (e.target.value === "custom") {
          if (customContainer) {
            customContainer.style.display = "block";
          }
          utmRule.paramName = (customInput && customInput.value) || "my_param";
        } else {
          if (customContainer) {
            customContainer.style.display = "none";
          }
          utmRule.paramName = e.target.value;
        }
      });
    }

    // Обработчик для кастомного поля
    if (customInput) {
      customInput.addEventListener("change", (e) => {
        utmRule.paramName = e.target.value;
      });
    }

    // Поле значения параметра
    const paramValueInput = clone.querySelector(".param-value-input");
    if (paramValueInput) {
      paramValueInput.value = utmRule.paramValue || "";
      paramValueInput.addEventListener("change", (e) => {
        utmRule.paramValue = e.target.value;
      });
    }

    // Поле для замены значения
    const replacementValueInput = clone.querySelector(
      ".replacement-value-input"
    );
    if (replacementValueInput) {
      replacementValueInput.value = utmRule.replacementValue || "";
      replacementValueInput.addEventListener("change", (e) => {
        utmRule.replacementValue = e.target.value;
      });
    }

    container.append(clone);
  }

  /**
   * Отрисовывает секцию с настройками видимости блоков
   */
  renderBlockVisibility() {
    const container = this.elements.blockVisibilityContainer;
    const tpl = this.templates.blockRule;
    if (!container || !tpl) return;
    container.innerHTML = "";

    this.config.blockVisibility.forEach((rule, index) => {
      const clone = tpl.content.cloneNode(true);

      // Индекс правила
      const indexElement = clone.querySelector(".rule-index");
      if (indexElement) {
        indexElement.textContent = index + 1;
      }

      // Кнопка удаления
      const removeButton = clone.querySelector(".remove-block-rule");
      if (removeButton) {
        removeButton.addEventListener("click", () => {
          this.config.blockVisibility.splice(index, 1);
          this.renderBlockVisibility();
        });
      }

      // Селектор имени параметра и кастомное поле
      const paramNameSelect = clone.querySelector(".param-name-select");
      const customContainer = clone.querySelector(
        ".dcm-custom-param-container"
      );
      const customInput = customContainer
        ? customContainer.querySelector(".custom-param-input")
        : null;

      /**
       * Переключает видимость поля для кастомного параметра
       * @param {string} value - Значение параметра
       * @private
       */
      const toggleCustom = (value) => {
        const standardParams = [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_content",
          "utm_term",
        ];
        const isCustom = !standardParams.includes(value);

        if (customContainer) {
          customContainer.style.display = isCustom ? "block" : "none";
        }

        if (isCustom && customInput && customInput.value === "") {
          customInput.value = value;
        }
      };

      // Устанавливаем начальное значение и состояние
      if (paramNameSelect) {
        const standardParams = [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_content",
          "utm_term",
        ];
        const isCustom = !standardParams.includes(rule.paramName);

        paramNameSelect.value = isCustom ? "custom" : rule.paramName;
        toggleCustom(rule.paramName);

        if (isCustom && customInput) {
          customInput.value = rule.paramName;
        }

        paramNameSelect.addEventListener("change", (e) => {
          if (e.target.value === "custom") {
            if (customContainer) {
              customContainer.style.display = "block";
            }
            rule.paramName = (customInput && customInput.value) || "my_param";
          } else {
            if (customContainer) {
              customContainer.style.display = "none";
            }
            rule.paramName = e.target.value;
          }
        });
      }

      // Обработчик для кастомного поля
      if (customInput) {
        customInput.addEventListener("change", (e) => {
          rule.paramName = e.target.value;
        });
      }

      // Поле значения параметра
      const paramValueInput = clone.querySelector(".param-value-input");
      if (paramValueInput) {
        paramValueInput.value = rule.paramValue || "";
        paramValueInput.addEventListener("change", (e) => {
          rule.paramValue = e.target.value;
        });
      }

      // Поле для отображаемых блоков
      const showBlocksInput = clone.querySelector(".show-blocks-input");
      if (showBlocksInput) {
        showBlocksInput.value = (rule.showBlocks || []).join(", ");
        showBlocksInput.addEventListener("change", (e) => {
          rule.showBlocks = parseCommaList(e.target.value);
        });
      }

      // Поле для скрываемых блоков
      const hideBlocksInput = clone.querySelector(".hide-blocks-input");
      if (hideBlocksInput) {
        hideBlocksInput.value = (rule.hideBlocks || []).join(", ");
        hideBlocksInput.addEventListener("change", (e) => {
          rule.hideBlocks = parseCommaList(e.target.value);
        });
      }
      container.append(clone);
    });
  }

  /**
   * Отрисовывает секцию с правилами на основе геолокации
   */
  renderIpRules() {
    const container = this.elements.ipRulesContainer;
    const tpl = this.templates.ipRule;
    if (!container || !tpl) return;
    container.innerHTML = "";

    this.config.ipRules.forEach((rule, index) => {
      const clone = tpl.content.cloneNode(true);
      // Индекс правила
      const indexElement = clone.querySelector(".rule-index");
      if (indexElement) {
        indexElement.textContent = index + 1;
      }

      // Кнопка удаления
      const removeButton = clone.querySelector(".remove-ip-rule");
      if (removeButton) {
        removeButton.addEventListener("click", () => {
          this.config.ipRules.splice(index, 1);
          this.renderIpRules();
        });
      }

      // Поле страны
      const countryInput = clone.querySelector(".country-input");
      if (countryInput) {
        countryInput.value = rule.country || "";
        countryInput.addEventListener("change", (e) => {
          rule.country = e.target.value;
        });
      }

      // Поле города
      const cityInput = clone.querySelector(".city-input");
      if (cityInput) {
        cityInput.value = rule.city || "*";
        cityInput.addEventListener("change", (e) => {
          rule.city = e.target.value;
        });
      }

      // Поле региона
      const regionInput = clone.querySelector(".region-input");
      if (regionInput) {
        regionInput.value = rule.region || "*";
        regionInput.addEventListener("change", (e) => {
          rule.region = e.target.value;
        });
      }

      // Контейнер для текстовых замен по IP
      const textContainer = clone.querySelector(
        ".ip-text-replacements-container"
      );

      if (textContainer && rule.textReplacements) {
        rule.textReplacements.forEach((rep, repIndex) => {
          this.addIpTextReplacement(textContainer, rule, rep, repIndex);
        });
      }

      // Кнопка добавления текстовой замены по IP
      const addTextReplacementButton = clone.querySelector(
        ".add-ip-text-replacement"
      );
      if (addTextReplacementButton) {
        addTextReplacementButton.addEventListener("click", () => {
          if (!rule.textReplacements) {
            rule.textReplacements = [];
          }

          rule.textReplacements.push({
            keyword: "",
            defaultValue: "",
            replacementValue: "",
          });
          this.renderIpRules();
        });
      }
      // Поля для отображаемых/скрываемых блоков
      const showBlocksInput = clone.querySelector(".show-blocks-input");
      if (showBlocksInput) {
        showBlocksInput.value = (rule.showBlocks || []).join(", ");
        showBlocksInput.addEventListener("change", (e) => {
          rule.showBlocks = parseCommaList(e.target.value);
        });
      }

      const hideBlocksInput = clone.querySelector(".hide-blocks-input");
      if (hideBlocksInput) {
        hideBlocksInput.value = (rule.hideBlocks || []).join(", ");
        hideBlocksInput.addEventListener("change", (e) => {
          rule.hideBlocks = parseCommaList(e.target.value);
        });
      }

      // Кнопки "показать список стран"
      const countryListButtons = clone.querySelectorAll(".show-countries-list");
      if (countryListButtons) {
        countryListButtons.forEach((btn) => {
          btn.addEventListener("click", (evt) => {
            evt.preventDefault();
            this.showCountriesList(btn); // Передаем кнопку в функцию
          });
        });
      }

      container.append(clone);
    });
  }

  /**
   * Добавляет правило текстовой замены для IP
   *
   * @param {HTMLElement} container - Контейнер для добавления правила
   * @param {Object} rule - Родительское IP-правило
   * @param {Object} rep - Данные правила текстовой замены
   * @param {number} repIndex - Индекс правила в массиве
   * @private
   */
  addIpTextReplacement(container, rule, rep, repIndex) {
    const tpl = this.templates.ipTextReplacement;
    if (!tpl || !container) return;
    const clone = tpl.content.cloneNode(true);

    // Индекс правила
    const indexElement = clone.querySelector(".ip-replacement-index");
    if (indexElement) {
      indexElement.textContent = repIndex + 1;
    }

    // Кнопка удаления
    const removeButton = clone.querySelector(".remove-ip-text-replacement");
    if (removeButton) {
      removeButton.addEventListener("click", () => {
        rule.textReplacements.splice(repIndex, 1);
        this.renderIpRules();
      });
    }

    // Поле ключевого слова
    const keywordInput = clone.querySelector(".keyword-input");
    if (keywordInput) {
      keywordInput.value = rep.keyword || "";
      keywordInput.addEventListener("change", (e) => {
        rep.keyword = e.target.value;
      });
    }

    // Поле значения по умолчанию
    const defaultValueInput = clone.querySelector(".default-value-input");
    if (defaultValueInput) {
      defaultValueInput.value = rep.defaultValue || "";
      defaultValueInput.addEventListener("change", (e) => {
        rep.defaultValue = e.target.value;
      });
    }

    // Поле заменяемого значения
    const replacementValueInput = clone.querySelector(
      ".replacement-value-input"
    );
    if (replacementValueInput) {
      replacementValueInput.value = rep.replacementValue || "";
      replacementValueInput.addEventListener("change", (e) => {
        rep.replacementValue = e.target.value;
      });
    }

    container.append(clone);
  }

  /**
   * Отображает модальное окно со списком стран для GeoJS API
   * @param {HTMLElement} sourceButton - Кнопка, которая вызвала окно
   */
  showCountriesList(sourceButton) {
    // Создаем модальное окно
    const modal = document.createElement("div");
    modal.id = "countries-modal";
    modal.className = "modal";
    modal.style.display = "flex";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    Object.assign(modalContent.style, {
      maxWidth: "700px",
      maxHeight: "80vh",
      overflow: "auto",
    });

    const closeButton = document.createElement("button");
    closeButton.className = "close-modal";
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", () => this.closeCountriesModal());

    const header = document.createElement("h3");
    header.textContent = "Список стран для GeoJS API";

    const description = document.createElement("p");
    description.textContent =
      "Используйте полное название страны на английском языке. Ниже приведены примеры наиболее распространенных стран:";

    const table = document.createElement("table");
    Object.assign(table.style, {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "15px",
    });

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const thCountry = document.createElement("th");
    thCountry.textContent = "Полное название (использовать)";
    Object.assign(thCountry.style, {
      padding: "8px",
      textAlign: "left",
      borderBottom: "2px solid #ddd",
    });

    const thCode = document.createElement("th");
    thCode.textContent = "Код ISO (НЕ использовать)";
    Object.assign(thCode.style, {
      padding: "8px",
      textAlign: "left",
      borderBottom: "2px solid #ddd",
    });

    headerRow.append(thCountry, thCode);
    thead.append(headerRow);
    table.append(thead);

    const tbody = document.createElement("tbody");

    // Расширенная таблица стран
    const countries = [
      { name: "Russia", code: "RU" },
      { name: "Belarus", code: "BY" },
      { name: "Kazakhstan", code: "KZ" },
      { name: "Ukraine", code: "UA" },
      { name: "Armenia", code: "AM" },
      { name: "Azerbaijan", code: "AZ" },
      { name: "Moldova", code: "MD" },
      { name: "Uzbekistan", code: "UZ" },
      { name: "Tajikistan", code: "TJ" },
      { name: "Kyrgyzstan", code: "KG" },
      { name: "Turkmenistan", code: "TM" },
      { name: "Georgia", code: "GE" },
      { name: "Estonia", code: "EE" },
      { name: "Latvia", code: "LV" },
      { name: "Lithuania", code: "LT" },
      { name: "United States", code: "US" },
      { name: "Germany", code: "DE" },
      { name: "France", code: "FR" },
      { name: "United Kingdom", code: "GB" },
      { name: "China", code: "CN" },
      { name: "Japan", code: "JP" },
      { name: "Canada", code: "CA" },
      { name: "Australia", code: "AU" },
      { name: "Brazil", code: "BR" },
      { name: "India", code: "IN" },
      { name: "Spain", code: "ES" },
      { name: "Italy", code: "IT" },
      { name: "Mexico", code: "MX" },
      { name: "South Korea", code: "KR" },
    ];

    countries.forEach((c, idx) => {
      const { name, code } = c;
      const row = document.createElement("tr");
      row.style.backgroundColor = idx % 2 === 0 ? "#f9f9f9" : "#fff";

      const tdCountry = document.createElement("td");
      tdCountry.textContent = name;
      Object.assign(tdCountry.style, {
        padding: "8px",
        borderBottom: "1px solid #ddd",
        cursor: "pointer",
      });
      tdCountry.title = "Нажмите, чтобы использовать это название";
      tdCountry.addEventListener("click", () => {
        // Если есть кнопка-источник, находим родительский контейнер IP-правила
        if (sourceButton) {
          const ruleContainer = sourceButton.closest(".ip-rule");
          if (ruleContainer) {
            // Находим инпут страны внутри этого контейнера
            const countryInput = ruleContainer.querySelector(".country-input");
            if (countryInput) {
              countryInput.value = name;
              countryInput.dispatchEvent(
                new Event("change", { bubbles: true })
              );
              this.closeCountriesModal();
              return;
            }
          }
        }

        // Запасной вариант, если что-то пошло не так
        const activeInput = document.querySelector(".country-input");
        if (activeInput) {
          activeInput.value = name;
          activeInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
        this.closeCountriesModal();
      });

      const tdCode = document.createElement("td");
      tdCode.textContent = code;
      Object.assign(tdCode.style, {
        padding: "8px",
        borderBottom: "1px solid #ddd",
      });

      row.append(tdCountry, tdCode);
      tbody.append(row);
    });
    table.append(tbody);

    const note = document.createElement("p");
    note.textContent =
      'Примечание: Для обозначения любой страны используйте символ "*". Нажмите на название страны, чтобы использовать его.';
    Object.assign(note.style, {
      marginTop: "15px",
      fontStyle: "italic",
    });

    const closeBtnBottom = document.createElement("button");
    closeBtnBottom.className = "btn btn-primary";
    closeBtnBottom.textContent = "Закрыть";
    Object.assign(closeBtnBottom.style, {
      display: "block",
      margin: "15px auto 0",
    });
    closeBtnBottom.addEventListener("click", () => this.closeCountriesModal());

    modalContent.append(
      closeButton,
      header,
      description,
      table,
      note,
      closeBtnBottom
    );

    modal.append(modalContent);
    document.body.append(modal);

    // Добавляем обработчики событий
    modal.addEventListener("click", (e) => {
      if (e.target === modal) this.closeCountriesModal();
    });

    this._countriesModalHandlers.escKeyPress = (event) => {
      if (event.key === "Escape") this.closeCountriesModal();
    };

    document.addEventListener(
      "keydown",
      this._countriesModalHandlers.escKeyPress
    );
  }

  /**
   * Закрывает модальное окно со списком стран
   * @private
   */
  closeCountriesModal() {
    const modal = document.getElementById("countries-modal");

    if (modal) {
      modal.remove();
    }

    if (this._countriesModalHandlers.escKeyPress) {
      document.removeEventListener(
        "keydown",
        this._countriesModalHandlers.escKeyPress
      );
      this._countriesModalHandlers.escKeyPress = null;
    }
  }

  /**
   * Закрывает модальное окно со списком стран
   * @private
   */
  closeCountriesModal() {
    const modal = document.getElementById("countries-modal");

    if (modal) {
      modal.remove();
    }

    if (this._countriesModalHandlers.escKeyPress) {
      document.removeEventListener(
        "keydown",
        this._countriesModalHandlers.escKeyPress
      );
      this._countriesModalHandlers.escKeyPress = null;
    }
  }

  //
  // ГЕНЕРАЦИЯ КОДА
  //

  /**
   * @override
   * Собирает данные из формы для генерации кода
   * @returns {Object} Настройки для генерации
   */
  collectData() {
    // Делаем глубокую копию текущей конфигурации
    return structuredClone(this.config);
  }

  /**
   * Собирает кастомные параметры из текущей конфигурации
   *
   * @returns {Array<string>} Массив имен кастомных параметров
   * @private
   */
  collectCustomParameters() {
    const customParams = new Set();

    // Собираем кастомные параметры из правил текстовых замен
    if (this.config.textReplacements) {
      this.config.textReplacements
        .flatMap((r) => r.utmRules || [])
        .filter((rule) => rule.paramName && !rule.paramName.startsWith("utm_"))
        .forEach((rule) => customParams.add(rule.paramName));
    }

    // Собираем кастомные параметры из правил видимости блоков
    if (this.config.blockVisibility) {
      this.config.blockVisibility
        .filter((rule) => rule.paramName && !rule.paramName.startsWith("utm_"))
        .forEach((rule) => customParams.add(rule.paramName));
    }

    return [...customParams];
  }

  /**
   * @override
   * Генерирует JS-код для работы с UTM/IP
   *
   * @param {Object} settings - Настройки для генерации кода
   * @returns {string} Сгенерированный код
   */
  generateCode(settings = {}) {
    // Собираем JSON
    const cleanConfig = structuredClone(settings);

    // Подстрахуемся, если paramName не указаны
    cleanConfig.textReplacements?.forEach((r) =>
      r.utmRules?.forEach((u) => {
        if (!u.paramName) {
          u.paramName = "my_param";
        }
      })
    );
    cleanConfig.blockVisibility?.forEach((b) => {
      if (!b.paramName) {
        b.paramName = "my_param";
      }
    });

    // Собираем кастомные параметры
    cleanConfig.additionalParams = this.collectCustomParameters(cleanConfig);

    // Превращаем в JSON
    const configJson = JSON.stringify(cleanConfig, null, 2);

    return `<!-- Расширение - UTM/IP  -->
<script>
document.documentElement.style.visibility = 'hidden';

class TaptopContentChanger {
  constructor(config) {
    this.config = config || { textReplacements: [], blockVisibility: [], ipRules: [] };
    this.utmParams = this.getUTMParams();
    this.ipInfo = null;

    this.replaceText();
    this.toggleBlocksVisibility();

    if (this.config.ipRules?.length) {
      this.detectLocation().finally(() => {
        this.applyIPRules();
        document.documentElement.style.visibility = '';
      });
    } else {
      document.documentElement.style.visibility = '';
    }
  }

  getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const utm = {};
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(p => {
      if (urlParams.has(p)) utm[p] = urlParams.get(p);
    });
    if (this.config.additionalParams?.length) {
      this.config.additionalParams.forEach((p) => {
        if (urlParams.has(p)) utm[p] = urlParams.get(p);
      });
    }
    return utm;
  }

  async detectLocation() {
    try {
      const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
      const data = await res.json();
      if (data?.country) {
        this.ipInfo = {
          country_name: data.country,
          country_code: data.country_code,
          country_code3: data.country_code3,
          region: data.region,
          city: data.city
        };
      }
    } catch(e){
      console.error("Geo detect error:", e);
    }
  }

  applyIPRules() {
    if (!this.ipInfo || !this.config.ipRules?.length) return;
    const { country_name, country_code, country_code3, region, city } = this.ipInfo;
    
    const norm = {
      country: (country_name || '').toLowerCase().trim(),
      code: (country_code || '').toLowerCase().trim(),
      code3: (country_code3 || '').toLowerCase().trim(),
      region: (region || '').toLowerCase().trim(),
      city: (city || '').toLowerCase().trim(),
    };
    
    const matched = this.config.ipRules.find(rule => {
      const c = (rule.country || '').toLowerCase().trim();
      const ci = (rule.city || '').toLowerCase().trim();
      const r = (rule.region || '').toLowerCase().trim();
      const countryOk = c === "*" || c === norm.country || c === norm.code || c === norm.code3;
      const cityOk = ci === "*" || ci === norm.city;
      const regionOk = r === "*" || r === norm.region;
      return countryOk && cityOk && regionOk;
    });
    
    if (matched) {
      // Заменяем все IP-ключи
      matched.textReplacements?.forEach(rep => {
        this.replaceAll(rep.keyword, rep.replacementValue);
      });
      this.applyVisibilityRules(matched.showBlocks, matched.hideBlocks);
    } else {
      // Иначе для всех ipRules подставляем defaultValue
      this.config.ipRules.forEach(rule => {
        rule.textReplacements?.forEach(rep => {
          this.replaceAll(rep.keyword, rep.defaultValue);
        });
      });
      if (this.config.defaultBlockVisibility) {
        const { showBlocks, hideBlocks } = this.config.defaultBlockVisibility;
        this.applyVisibilityRules(showBlocks, hideBlocks);
      }
    }
  }

  replaceText() {
    this.config.textReplacements?.forEach((rule) => {
      let replacementValue = rule.defaultValue;
      const matched = rule.utmRules?.find((utmRule) => {
        const val = this.utmParams[utmRule.paramName];
        return val && (val === utmRule.paramValue || utmRule.paramValue === "*");
      });
      if (matched) replacementValue = matched.replacementValue;
      this.replaceAll(rule.keyword, replacementValue);
    });
  }

  replaceAll(keyword, newValue) {
    if (!keyword) return;
    const pattern = new RegExp(\`%%\${keyword}%%\`, "g");
    const elements = [];
    const search = (node) => {
      if (!node) return;
      if (node.nodeType === Node.TEXT_NODE) {
        if (pattern.test(node.textContent)) {
          const p = node.parentElement;
          if (p && !elements.includes(p)) elements.push(p);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (pattern.test(node.innerHTML) && !elements.includes(node)) {
          elements.push(node);
        }
        node.childNodes.forEach(search);
      }
    };
    search(document.body);
    elements.forEach((el) => {
      el.innerHTML = el.innerHTML.replace(pattern, newValue);
    });
  }

  toggleBlocksVisibility() {
    if (!this.config.blockVisibility?.length) return;
    let matched = null;
    for (const rule of this.config.blockVisibility) {
      const val = this.utmParams[rule.paramName];
      if (val && (val === rule.paramValue || rule.paramValue === "*")) {
        matched = rule;
        break;
      }
    }
    if (matched) {
      this.applyVisibilityRules(matched.showBlocks, matched.hideBlocks);
    } else if (this.config.defaultBlockVisibility) {
      const { showBlocks, hideBlocks } = this.config.defaultBlockVisibility;
      this.applyVisibilityRules(showBlocks, hideBlocks);
    }
  }

  applyVisibilityRules(showBlocks, hideBlocks) {
    (hideBlocks||[]).forEach((id) => {
      document.querySelectorAll(\`#\${id},.\${id},[data-block-id="\${id}"]\`)
        .forEach(el => el.style.display = "none");
    });
    (showBlocks||[]).forEach((id) => {
      document.querySelectorAll(\`#\${id},.\${id},[data-block-id="\${id}"]\`)
        .forEach(el => el.style.display = "");
    });
  }

  collectCustomParameters() {
    const customParams = new Set();
    this.config.textReplacements
      .flatMap((r) => r.utmRules || [])
      .filter((rule) => rule.paramName && !rule.paramName.startsWith("utm_"))
      .forEach((rule) => customParams.add(rule.paramName));

    this.config.blockVisibility
      .filter((rule) => rule.paramName && !rule.paramName.startsWith("utm_"))
      .forEach((rule) => customParams.add(rule.paramName));

    return [...customParams];
  }
}

// Инициализируем скрипт при загрузке DOM
document.addEventListener("DOMContentLoaded", () => {
  const contentChanger = new TaptopContentChanger(${configJson});
});
</script>`;
  }
}

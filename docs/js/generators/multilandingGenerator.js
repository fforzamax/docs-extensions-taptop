import { BaseGenerator } from "./baseGenerator.js";

/**
 * Генератор динамического контента для мульти-лендинга (UTM + IP).
 */
export class DynamicContentGenerator extends BaseGenerator {
  constructor() {
    super();
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

    this.activeTab = "text";
    this.templates = {};

    // Простейший парсер списков с улучшенной производительностью
    this.parseCommaList = (str) =>
      !str
        ? []
        : str
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

    // Стрелочная функция не требует привязки контекста
  }

  /* ------------------------------------------
   * 1) Поиск элементов и шаблонов
   * ------------------------------------------ */
  findElements() {
    super.findElements();

    // Находим все элементы за один проход - более эффективно
    const elements = {
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
      generateButton: document.getElementById("generate-btn"),
    };

    // Используем spread для слияния с существующими элементами
    this.elements = { ...this.elements, ...elements };

    // Шаблоны также находим за один проход
    this.templates = {
      textReplacement: document.getElementById("text-replacement-template"),
      utmRule: document.getElementById("utm-rule-template"),
      blockRule: document.getElementById("block-rule-template"),
      ipRule: document.getElementById("ip-rule-template"),
      ipTextReplacement: document.getElementById(
        "ip-text-replacement-template"
      ),
    };
  }

  /* ------------------------------------------
   * 2) Привязка событий
   * ------------------------------------------ */
  bindEvents() {
    super.bindEvents();

    const {
      tabButtons,
      addTextReplacementBtn,
      addBlockRuleBtn,
      addIpRuleBtn,
      defaultShowBlocks,
      defaultHideBlocks,
      generateButton,
      closeModal,
      modal,
    } = this.elements;

    // Tabs
    tabButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        this.switchTab(button.getAttribute("data-tab"));
      });
    });

    // Добавить правила
    addTextReplacementBtn?.addEventListener("click", () => {
      this.addTextReplacement();
    });
    addBlockRuleBtn?.addEventListener("click", () => {
      this.addBlockRule();
    });
    addIpRuleBtn?.addEventListener("click", () => {
      this.addIpRule();
    });

    // Default block visibility
    defaultShowBlocks?.addEventListener("change", (e) => {
      this.config.defaultBlockVisibility.showBlocks = this.parseCommaList(
        e.target.value
      );
    });
    defaultHideBlocks?.addEventListener("change", (e) => {
      this.config.defaultBlockVisibility.hideBlocks = this.parseCommaList(
        e.target.value
      );
    });

    // Кнопка генерации кода
    generateButton?.addEventListener("click", () => {
      this.generateAndCopyCode();
    });

    // Закрытие общего модального окна
    closeModal?.forEach((btn) =>
      btn.addEventListener("click", () => this.closeModal())
    );
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) this.closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal?.style.display !== "none") {
        this.closeModal();
      }
    });
  }

  /* ------------------------------------------
   * 3) Начальное состояние
   * ------------------------------------------ */
  setInitialState() {
    const { defaultShowBlocks, defaultHideBlocks } = this.elements;
    const { showBlocks, hideBlocks } = this.config.defaultBlockVisibility;

    // Подставляем значения в поля "defaultShowBlocks"/"defaultHideBlocks"
    if (defaultShowBlocks) {
      defaultShowBlocks.value = showBlocks.join(", ");
    }
    if (defaultHideBlocks) {
      defaultHideBlocks.value = hideBlocks.join(", ");
    }
    // Рендер UI
    this.renderTextReplacements();
    this.renderBlockVisibility();
    this.renderIpRules();
    this.switchTab(this.activeTab);
  }

  /* ------------------------------------------
   * Переключение вкладок
   * ------------------------------------------ */
  switchTab(tabId) {
    const { tabContents, tabButtons } = this.elements;

    this.activeTab = tabId;
    tabContents?.forEach((tab) => tab.classList.remove("active"));
    tabButtons?.forEach((btn) => btn.classList.remove("active"));

    const tabContent = document.getElementById(`${tabId}-tab`);
    const tabButton = document.querySelector(
      `.tab-button[data-tab="${tabId}"]`
    );
    if (tabContent) tabContent.classList.add("active");
    if (tabButton) tabButton.classList.add("active");
  }

  /* ------------------------------------------
   * Добавление правил в config
   * ------------------------------------------ */
  addTextReplacement() {
    this.config.textReplacements.push({
      keyword: "",
      defaultValue: "",
      utmRules: [],
    });
    this.renderTextReplacements();
  }

  addBlockRule() {
    this.config.blockVisibility.push({
      paramName: "utm_content",
      paramValue: "",
      showBlocks: [],
      hideBlocks: [],
    });
    this.renderBlockVisibility();
  }

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

  /* ------------------------------------------
   * Рендер Text Replacements
   * ------------------------------------------ */
  renderTextReplacements() {
    const { textReplacementsContainer: container } = this.elements;
    const { textReplacement } = this.templates;

    if (!container) return;
    container.innerHTML = "";

    this.config.textReplacements.forEach((item, index) => {
      if (!textReplacement) return;
      const clone = textReplacement.content.cloneNode(true);

      // Индекс
      clone.querySelector(".rule-index").textContent = index + 1;

      // Удалить
      clone
        .querySelector(".remove-text-replacement")
        .addEventListener("click", () => {
          this.config.textReplacements.splice(index, 1);
          this.renderTextReplacements();
        });

      // keyword
      const keywordInput = clone.querySelector(".keyword-input");
      keywordInput.value = item.keyword;
      keywordInput.addEventListener("change", (e) => {
        item.keyword = e.target.value;
      });

      // defaultValue
      const defaultValueInput = clone.querySelector(".default-value-input");
      defaultValueInput.value = item.defaultValue;
      defaultValueInput.addEventListener("change", (e) => {
        item.defaultValue = e.target.value;
      });

      // UTM rules
      const utmContainer = clone.querySelector(".utm-rules-container");
      item.utmRules.forEach((utmRule, ruleIndex) => {
        this.addUtmRuleToContainer(utmContainer, item, utmRule, ruleIndex);
      });

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

  addUtmRuleToContainer(container, parentItem, utmRule, ruleIndex) {
    const { utmRule: utmRuleTemplate } = this.templates;

    if (!container || !utmRuleTemplate) return;
    const clone = utmRuleTemplate.content.cloneNode(true);

    clone.querySelector(".utm-rule-index").textContent = ruleIndex + 1;

    // Удаление
    clone.querySelector(".remove-utm-rule").addEventListener("click", () => {
      parentItem.utmRules.splice(ruleIndex, 1);
      this.renderTextReplacements();
    });

    // paramName
    const paramNameSelect = clone.querySelector(".param-name-select");
    const customContainer = clone.querySelector(".dcm-custom-param-container");
    const customInput = customContainer.querySelector(".custom-param-input");

    const toggleCustom = (value) => {
      const isCustom = ![
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
      ].includes(value);
      customContainer.style.display = isCustom ? "block" : "none";
      if (isCustom && customInput.value) {
        utmRule.paramName = customInput.value;
      }
    };

    paramNameSelect.value = utmRule.paramName;
    toggleCustom(utmRule.paramName);

    paramNameSelect.addEventListener("change", (e) => {
      if (e.target.value === "custom") {
        customContainer.style.display = "block";
        utmRule.paramName = customInput.value || "my_param";
      } else {
        customContainer.style.display = "none";
        utmRule.paramName = e.target.value;
      }
    });

    customInput.addEventListener("change", (e) => {
      utmRule.paramName = e.target.value;
    });

    // paramValue
    const paramValueInput = clone.querySelector(".param-value-input");
    paramValueInput.value = utmRule.paramValue;
    paramValueInput.addEventListener("change", (e) => {
      utmRule.paramValue = e.target.value;
    });

    // replacementValue
    const replacementValueInput = clone.querySelector(
      ".replacement-value-input"
    );
    replacementValueInput.value = utmRule.replacementValue;
    replacementValueInput.addEventListener("change", (e) => {
      utmRule.replacementValue = e.target.value;
    });

    container.append(clone);
  }

  /* ------------------------------------------
   * Рендер Block Visibility
   * ------------------------------------------ */
  renderBlockVisibility() {
    const { blockVisibilityContainer: container } = this.elements;
    const { blockRule } = this.templates;

    if (!container || !blockRule) return;
    container.innerHTML = "";

    this.config.blockVisibility.forEach((rule, index) => {
      const clone = blockRule.content.cloneNode(true);
      clone.querySelector(".rule-index").textContent = index + 1;

      // Удалить
      clone
        .querySelector(".remove-block-rule")
        .addEventListener("click", () => {
          this.config.blockVisibility.splice(index, 1);
          this.renderBlockVisibility();
        });

      // paramName + custom
      const paramNameSelect = clone.querySelector(".param-name-select");
      const customContainer = clone.querySelector(
        ".dcm-custom-param-container"
      );
      const customInput = customContainer.querySelector(".custom-param-input");

      const toggleCustom = (value) => {
        const isCustom = ![
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_content",
          "utm_term",
        ].includes(value);
        customContainer.style.display = isCustom ? "block" : "none";
        if (isCustom && customInput.value) {
          rule.paramName = customInput.value;
        }
      };

      paramNameSelect.value = rule.paramName;
      toggleCustom(rule.paramName);

      paramNameSelect.addEventListener("change", (e) => {
        if (e.target.value === "custom") {
          customContainer.style.display = "block";
          rule.paramName = customInput.value || "my_param";
        } else {
          customContainer.style.display = "none";
          rule.paramName = e.target.value;
        }
      });

      customInput.addEventListener("change", (e) => {
        rule.paramName = e.target.value;
      });

      // paramValue
      const paramValueInput = clone.querySelector(".param-value-input");
      paramValueInput.value = rule.paramValue;
      paramValueInput.addEventListener("change", (e) => {
        rule.paramValue = e.target.value;
      });

      // showBlocks
      const showBlocksInput = clone.querySelector(".show-blocks-input");
      showBlocksInput.value = rule.showBlocks.join(", ");
      showBlocksInput.addEventListener("change", (e) => {
        rule.showBlocks = this.parseCommaList(e.target.value);
      });

      // hideBlocks
      const hideBlocksInput = clone.querySelector(".hide-blocks-input");
      hideBlocksInput.value = rule.hideBlocks.join(", ");
      hideBlocksInput.addEventListener("change", (e) => {
        rule.hideBlocks = this.parseCommaList(e.target.value);
      });

      container.append(clone);
    });
  }

  /* ------------------------------------------
   * Рендер IP Rules
   * ------------------------------------------ */
  renderIpRules() {
    const { ipRulesContainer: container } = this.elements;
    const { ipRule } = this.templates;

    if (!container || !ipRule) return;
    container.innerHTML = "";

    this.config.ipRules.forEach((rule, index) => {
      const clone = ipRule.content.cloneNode(true);
      clone.querySelector(".rule-index").textContent = index + 1;

      // Удалить
      clone.querySelector(".remove-ip-rule").addEventListener("click", () => {
        this.config.ipRules.splice(index, 1);
        this.renderIpRules();
      });

      // Страна/Город/Регион
      const countryInput = clone.querySelector(".country-input");
      countryInput.value = rule.country;
      countryInput.addEventListener("change", (e) => {
        rule.country = e.target.value;
      });

      const cityInput = clone.querySelector(".city-input");
      cityInput.value = rule.city;
      cityInput.addEventListener("change", (e) => {
        rule.city = e.target.value;
      });

      const regionInput = clone.querySelector(".region-input");
      regionInput.value = rule.region;
      regionInput.addEventListener("change", (e) => {
        rule.region = e.target.value;
      });

      // IP text replacements
      const textContainer = clone.querySelector(
        ".ip-text-replacements-container"
      );
      rule.textReplacements?.forEach((rep, repIndex) => {
        this.addIpTextReplacement(textContainer, rule, rep, repIndex);
      });

      // Добавить IP Text Replacement
      clone
        .querySelector(".add-ip-text-replacement")
        .addEventListener("click", () => {
          rule.textReplacements.push({
            keyword: "",
            defaultValue: "",
            replacementValue: "",
          });
          this.renderIpRules();
        });

      // show/hide blocks
      const showBlocksInput = clone.querySelector(".show-blocks-input");
      showBlocksInput.value = (rule.showBlocks || []).join(", ");
      showBlocksInput.addEventListener("change", (e) => {
        rule.showBlocks = this.parseCommaList(e.target.value);
      });

      const hideBlocksInput = clone.querySelector(".hide-blocks-input");
      hideBlocksInput.value = (rule.hideBlocks || []).join(", ");
      hideBlocksInput.addEventListener("change", (e) => {
        rule.hideBlocks = this.parseCommaList(e.target.value);
      });

      // Кнопка "показать страны"
      clone.querySelectorAll(".show-countries-list").forEach((btn) => {
        btn.addEventListener("click", (evt) => {
          evt.preventDefault();
          this.showCountriesList();
        });
      });

      container.append(clone);
    });
  }

  addIpTextReplacement(container, rule, rep, repIndex) {
    const { ipTextReplacement } = this.templates;

    if (!ipTextReplacement || !container) return;
    const clone = ipTextReplacement.content.cloneNode(true);

    clone.querySelector(".ip-replacement-index").textContent = repIndex + 1;

    // Удалить
    clone
      .querySelector(".remove-ip-text-replacement")
      .addEventListener("click", () => {
        rule.textReplacements.splice(repIndex, 1);
        this.renderIpRules();
      });

    // keyword
    const keywordInput = clone.querySelector(".keyword-input");
    keywordInput.value = rep.keyword;
    keywordInput.addEventListener("change", (e) => {
      rep.keyword = e.target.value;
    });

    // defaultValue
    const defaultValueInput = clone.querySelector(".default-value-input");
    defaultValueInput.value = rep.defaultValue;
    defaultValueInput.addEventListener("change", (e) => {
      rep.defaultValue = e.target.value;
    });

    // replacementValue
    const replacementValueInput = clone.querySelector(
      ".replacement-value-input"
    );
    replacementValueInput.value = rep.replacementValue;
    replacementValueInput.addEventListener("change", (e) => {
      rep.replacementValue = e.target.value;
    });

    container.append(clone);
  }

  /* ------------------------------------------
   * Модальное окно со странами
   * ------------------------------------------ */
  showCountriesList() {
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
        const activeInput = Array.from(
          document.querySelectorAll(".country-input")
        ).find((input) => document.activeElement === input);
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

    modal.addEventListener("click", (e) => {
      if (e.target === modal) this.closeCountriesModal();
    });
    document.addEventListener("keydown", this.handleCountriesModalEscape);
  }

  closeCountriesModal() {
    const modal = document.getElementById("countries-modal");
    if (modal) {
      modal.remove();
      document.removeEventListener("keydown", this.handleCountriesModalEscape);
    }
  }

  handleCountriesModalEscape = (event) => {
    if (event.key === "Escape") this.closeCountriesModal();
  };

  /* ------------------------------------------
   * Генерация кода + копирование
   * ------------------------------------------ */
  generateAndCopyCode() {
    const code = this.generateCode();
    this.copyAndNotify(code);
  }

  generateCode() {
    // 1) Копируем config, чтобы не мутировать оригинал
    const cleanConfig = structuredClone(this.config);

    // 2) Устанавливаем "my_param" если paramName пуст
    cleanConfig.textReplacements.forEach((r) =>
      r.utmRules?.forEach((u) => {
        u.paramName ||= "my_param";
      })
    );
    cleanConfig.blockVisibility.forEach((b) => {
      b.paramName ||= "my_param";
    });

    // 3) Собираем кастомные UTM
    cleanConfig.additionalParams = this.collectCustomParameters();

    // 4) Превращаем в JSON
    const configJson = JSON.stringify(cleanConfig, null, 2);

    // 5) Возвращаем готовый "боевой" скрипт,
    //    который прячет страницу, ждёт IP, затем подставляет нужные значения
    return `<!-- UTM/IP расширение -->
<script>
document.documentElement.style.visibility = 'hidden';

class TaptopContentChanger {
  constructor(config) {
    this.config = config || { textReplacements: [], blockVisibility: [], ipRules: [] };
    this.utmParams = this.getUTMParams();
    this.ipInfo = null;

    // Сразу делаем замену по UTM
    this.replaceText();
    // И блоки по UTM
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
      country: country_name?.toLowerCase().trim() || '',
      code: country_code?.toLowerCase().trim() || '',
      code3: country_code3?.toLowerCase().trim() || '',
      region: region?.toLowerCase().trim() || '',
      city: city?.toLowerCase().trim() || '',
    };
    
    // Поиск подходящего правила
    const matched = this.config.ipRules.find(rule => {
      const c = rule.country?.toLowerCase().trim() || '';
      const ci = rule.city?.toLowerCase().trim() || '';
      const r = rule.region?.toLowerCase().trim() || '';
      
      const countryOk = c === "*" || c === norm.country || c === norm.code || c === norm.code3;
      const cityOk = ci === "*" || ci === norm.city;
      const regionOk = r === "*" || r === norm.region;
      
      return countryOk && cityOk && regionOk;
    });
    
    if (matched) {
      // Заменяем все IP-ключи на replacementValue
      matched.textReplacements?.forEach(rep => {
        this.replaceAll(rep.keyword, rep.replacementValue);
      });
      this.applyVisibilityRules(matched.showBlocks, matched.hideBlocks);
    } else {
      // Иначе для всех ipRules подставляем defaultValue 
      // (чтобы %%ключ%% не оставался)
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
      // Ищем UTM-совпадение
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
      const { showBlocks, hideBlocks } = matched;
      this.applyVisibilityRules(showBlocks, hideBlocks);
    } else if (this.config.defaultBlockVisibility) {
      const { showBlocks, hideBlocks } = this.config.defaultBlockVisibility;
      this.applyVisibilityRules(showBlocks, hideBlocks);
    }
  }

  applyVisibilityRules(showBlocks, hideBlocks) {
    (hideBlocks||[]).forEach((id) => {
      document.querySelectorAll(\`#\${id},.\${id},[data-block-id="\${id}"]\`)
        .forEach(el => el.style.display="none");
    });
    (showBlocks||[]).forEach((id) => {
      document.querySelectorAll(\`#\${id},.\${id},[data-block-id="\${id}"]\`)
        .forEach(el => el.style.display="");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const changer = new TaptopContentChanger(${configJson});
});
</script>`;
  }

  collectCustomParameters() {
    const customParams = new Set();

    // Собираем все не-UTM параметры из всех правил
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

/* Инициализация генератора (UI) на странице конструктора */

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".dcm-container")) {
    const generator = new DynamicContentGenerator();
    generator.init();
  }
});

window.initDynamicContentGenerator = function () {
  if (document.querySelector(".dcm-container")) {
    const generator = new DynamicContentGenerator();
    generator.init();
  }
};

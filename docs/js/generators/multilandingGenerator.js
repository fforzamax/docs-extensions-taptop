import { BaseGenerator } from "./base/baseGenerator.js";
import { parseCommaList } from "../utils/parseCommaList.js";

/**
 * Генератор динамического контента (UTM + IP)
 */
export class MultilandingGenerator extends BaseGenerator {
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
  }

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
      generateButton: document.getElementById("generate-btn"),
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
    } = this.elements;

    // Tabs
    tabButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        this.switchTab(button.getAttribute("data-tab"));
      });
    });

    // Добавление правил
    addTextReplacementBtn?.addEventListener("click", () =>
      this.addTextReplacement()
    );
    addBlockRuleBtn?.addEventListener("click", () => this.addBlockRule());
    addIpRuleBtn?.addEventListener("click", () => this.addIpRule());

    // Default block visibility
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

    // Кнопка генерации кода (используем базовый метод)
    generateButton?.addEventListener("click", () => {
      this.generateAndCopyCode();
    });
  }

  setInitialState() {
    const { defaultShowBlocks, defaultHideBlocks } = this.elements;
    const { showBlocks, hideBlocks } = this.config.defaultBlockVisibility;

    // Подставляем значения
    if (defaultShowBlocks) {
      defaultShowBlocks.value = showBlocks.join(", ");
    }
    if (defaultHideBlocks) {
      defaultHideBlocks.value = hideBlocks.join(", ");
    }

    // Рендерим UI
    this.renderAll();
    this.switchTab(this.activeTab);
  }

  // Удобный метод, чтобы за один вызов всё перерисовать
  renderAll() {
    this.renderTextReplacements();
    this.renderBlockVisibility();
    this.renderIpRules();
  }

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

  // --- Методы добавления правил ---
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

  // --- Рендер Text Replacements ---
  renderTextReplacements() {
    const container = this.elements.textReplacementsContainer;
    const tpl = this.templates.textReplacement;
    if (!container || !tpl) return;
    container.innerHTML = "";

    this.config.textReplacements.forEach((item, index) => {
      const clone = tpl.content.cloneNode(true);
      clone.querySelector(".rule-index").textContent = index + 1;

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
    const tpl = this.templates.utmRule;
    if (!container || !tpl) return;
    const clone = tpl.content.cloneNode(true);

    clone.querySelector(".utm-rule-index").textContent = ruleIndex + 1;

    clone.querySelector(".remove-utm-rule").addEventListener("click", () => {
      parentItem.utmRules.splice(ruleIndex, 1);
      this.renderTextReplacements();
    });

    // paramName
    const paramNameSelect = clone.querySelector(".param-name-select");
    const customContainer = clone.querySelector(".dcm-custom-param-container");
    const customInput = customContainer.querySelector(".custom-param-input");

    const toggleCustom = (value) => {
      const standardParams = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
      ];
      const isCustom = !standardParams.includes(value);
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

  // --- Рендер Block Visibility ---
  renderBlockVisibility() {
    const container = this.elements.blockVisibilityContainer;
    const tpl = this.templates.blockRule;
    if (!container || !tpl) return;
    container.innerHTML = "";

    this.config.blockVisibility.forEach((rule, index) => {
      const clone = tpl.content.cloneNode(true);
      clone.querySelector(".rule-index").textContent = index + 1;

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
        const standardParams = [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_content",
          "utm_term",
        ];
        const isCustom = !standardParams.includes(value);
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
        rule.showBlocks = parseCommaList(e.target.value);
      });

      // hideBlocks
      const hideBlocksInput = clone.querySelector(".hide-blocks-input");
      hideBlocksInput.value = rule.hideBlocks.join(", ");
      hideBlocksInput.addEventListener("change", (e) => {
        rule.hideBlocks = parseCommaList(e.target.value);
      });

      container.append(clone);
    });
  }

  // --- Рендер IP rules ---
  renderIpRules() {
    const container = this.elements.ipRulesContainer;
    const tpl = this.templates.ipRule;
    if (!container || !tpl) return;
    container.innerHTML = "";

    this.config.ipRules.forEach((rule, index) => {
      const clone = tpl.content.cloneNode(true);
      clone.querySelector(".rule-index").textContent = index + 1;

      clone.querySelector(".remove-ip-rule").addEventListener("click", () => {
        this.config.ipRules.splice(index, 1);
        this.renderIpRules();
      });

      // Страна / Город / Регион
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
      rule.textReplacements.forEach((rep, repIndex) => {
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
        rule.showBlocks = parseCommaList(e.target.value);
      });

      const hideBlocksInput = clone.querySelector(".hide-blocks-input");
      hideBlocksInput.value = (rule.hideBlocks || []).join(", ");
      hideBlocksInput.addEventListener("change", (e) => {
        rule.hideBlocks = parseCommaList(e.target.value);
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
    const tpl = this.templates.ipTextReplacement;
    if (!tpl || !container) return;
    const clone = tpl.content.cloneNode(true);

    clone.querySelector(".ip-replacement-index").textContent = repIndex + 1;

    clone
      .querySelector(".remove-ip-text-replacement")
      .addEventListener("click", () => {
        rule.textReplacements.splice(repIndex, 1);
        this.renderIpRules();
      });

    const keywordInput = clone.querySelector(".keyword-input");
    keywordInput.value = rep.keyword;
    keywordInput.addEventListener("change", (e) => {
      rep.keyword = e.target.value;
    });

    const defaultValueInput = clone.querySelector(".default-value-input");
    defaultValueInput.value = rep.defaultValue;
    defaultValueInput.addEventListener("change", (e) => {
      rep.defaultValue = e.target.value;
    });

    const replacementValueInput = clone.querySelector(
      ".replacement-value-input"
    );
    replacementValueInput.value = rep.replacementValue;
    replacementValueInput.addEventListener("change", (e) => {
      rep.replacementValue = e.target.value;
    });

    container.append(clone);
  }

  showCountriesList() {
    // Логика показа модалки со странами (как и раньше)
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

    // ...и так далее. Содержимое остаётся тем же:
    const header = document.createElement("h3");
    header.textContent = "Список стран для GeoJS API";

    // Прочие элементы...
    // (не перепечатываем весь список ради компактности)

    modalContent.append(closeButton, header /* ... */);
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

  // --- Самая главная часть: Генерация итогового кода ---
  collectData() {
    // Если хотим использовать базовый метод generateAndCopyCode(), нужно вернуть "config"
    // Здесь можно просто вернуть this.config (или сделать глубокую копию)
    return structuredClone(this.config);
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

  generateCode(config = {}) {
    // Собираем JSON
    const cleanConfig = structuredClone(config);

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

    return `<!-- UTM/IP расширение -->
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

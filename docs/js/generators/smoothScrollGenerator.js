import { BaseGenerator } from "./base/baseGenerator.js";

export class SmoothScrollGenerator extends BaseGenerator {
  constructor() {
    super();

    // Связываем методы, чтобы их можно было убрать в unbindEvents
    this._handleGenerate = this.generateAndCopyCode.bind(this);
    this._handleSwitchToBasic = () => this.switchTab("basic");
    this._handleSwitchToAdvanced = () => this.switchTab("advanced");
    this._handlePresetChange = (e) => this.applyPreset(e.target.value);
    this._handleSpeedInput = () => this.updateSpeedUI();
    this._handleSmoothnessInput = () => this.updateSmoothnessUI();
    this._handleKeyboardChange = () => this.updateKeyboardOptionsVisibility();

    this.presets = {
      universal: {
        description: "Универсальный — средний баланс скорости и плавности",
        speedLevel: 60,
        smoothnessLevel: 70,
        step: 120,
        keyboard: true,
        keyboardStep: 200,
        mobile: true,
        excludeSelectors: "",
        easingType: "standard",
      },
      premium: {
        description: "Премиальный — медленный с эффектом инерции",
        speedLevel: 40,
        smoothnessLevel: 85,
        step: 80,
        keyboard: true,
        keyboardStep: 180,
        mobile: true,
        excludeSelectors: "",
        easingType: "precise",
      },
      fast: {
        description: "Быстрый — мгновенная реакция, минимум инерции",
        speedLevel: 80,
        smoothnessLevel: 55,
        step: 150,
        keyboard: true,
        keyboardStep: 250,
        mobile: true,
        excludeSelectors: "",
        easingType: "minimal",
      },
      slow: {
        description: "Медленный — кинематографичный с долгим движением",
        speedLevel: 30,
        smoothnessLevel: 90,
        step: 100,
        keyboard: true,
        keyboardStep: 150,
        mobile: true,
        excludeSelectors: "",
        easingType: "precise",
      },
      reading: {
        description: "Для чтения — быстрый, с мягким торможением",
        speedLevel: 70,
        smoothnessLevel: 60,
        step: 180,
        keyboard: true,
        keyboardStep: 300,
        mobile: true,
        excludeSelectors: "",
        easingType: "standard",
      },
    };
  }

  findElements() {
    super.findElements();
    this.elements = {
      ...this.elements,
      basicTabBtn: document.getElementById("basic-tab-btn"),
      advancedTabBtn: document.getElementById("advanced-tab-btn"),
      basicTab: document.getElementById("basic-tab"),
      advancedTab: document.getElementById("advanced-tab"),
      presetSelect: document.getElementById("preset-select"),
      presetDescription: document.getElementById("preset-description"),
      speedSelect: document.getElementById("speed-select"),
      speedValueDisplay: document.getElementById("speed-value-display"),
      speedTimeDisplay: document.getElementById("speed-time-display"),
      smoothnessSelect: document.getElementById("smoothness-select"),
      smoothnessValueDisplay: document.getElementById(
        "smoothness-value-display"
      ),
      easingTypeDisplay: document.getElementById("easing-type-display"),
      keyboardSupport: document.getElementById("keyboard-support"),
      mobileSupport: document.getElementById("mobile-support"),
      durationInput: document.getElementById("duration-input"),
      stepInput: document.getElementById("step-input"),
      easingSelect: document.getElementById("easing-select"),
      keyboardStep: document.getElementById("keyboard-step"),
      excludeSelectors: document.getElementById("exclude-selectors"),
    };
  }

  bindEvents() {
    super.bindEvents(); // базовые события, включая закрытие модалки

    const {
      generateButton,
      basicTabBtn,
      advancedTabBtn,
      presetSelect,
      speedSelect,
      smoothnessSelect,
      keyboardSupport,
    } = this.elements;

    generateButton?.addEventListener("click", this._handleGenerate);
    basicTabBtn?.addEventListener("click", this._handleSwitchToBasic);
    advancedTabBtn?.addEventListener("click", this._handleSwitchToAdvanced);
    presetSelect?.addEventListener("change", this._handlePresetChange);
    speedSelect?.addEventListener("input", this._handleSpeedInput);
    smoothnessSelect?.addEventListener("input", this._handleSmoothnessInput);
    keyboardSupport?.addEventListener("change", this._handleKeyboardChange);
  }

  unbindEvents() {
    // Снимаем наши события
    const {
      generateButton,
      basicTabBtn,
      advancedTabBtn,
      presetSelect,
      speedSelect,
      smoothnessSelect,
      keyboardSupport,
    } = this.elements;

    generateButton?.removeEventListener("click", this._handleGenerate);
    basicTabBtn?.removeEventListener("click", this._handleSwitchToBasic);
    advancedTabBtn?.removeEventListener("click", this._handleSwitchToAdvanced);
    presetSelect?.removeEventListener("change", this._handlePresetChange);
    speedSelect?.removeEventListener("input", this._handleSpeedInput);
    smoothnessSelect?.removeEventListener("input", this._handleSmoothnessInput);
    keyboardSupport?.removeEventListener("change", this._handleKeyboardChange);

    // Вызываем базовый unbind
    super.unbindEvents();
  }

  destroy() {
    this.unbindEvents();
    console.log("SmoothScrollGenerator: Генератор уничтожен");
    super.destroy();
  }

  setInitialState() {
    // Применяем изначально выбранный пресет
    const { presetSelect } = this.elements;
    if (presetSelect) {
      this.applyPreset(presetSelect.value);
    }
    this.updateSpeedUI();
    this.updateSmoothnessUI();
    this.updateKeyboardOptionsVisibility();
  }

  switchTab(tab) {
    const { basicTab, advancedTab, basicTabBtn, advancedTabBtn } =
      this.elements;
    if (tab === "basic") {
      basicTab.classList.add("active");
      advancedTab.classList.remove("active");
      basicTabBtn.classList.add("active");
      advancedTabBtn.classList.remove("active");
    } else {
      basicTab.classList.remove("active");
      advancedTab.classList.add("active");
      basicTabBtn.classList.remove("active");
      advancedTabBtn.classList.add("active");
    }
  }

  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset) return;

    const {
      presetDescription,
      speedSelect,
      smoothnessSelect,
      keyboardSupport,
      mobileSupport,
      stepInput,
      easingSelect,
      keyboardStep,
      excludeSelectors,
    } = this.elements;

    if (presetDescription) presetDescription.textContent = preset.description;
    if (speedSelect) speedSelect.value = preset.speedLevel;
    if (smoothnessSelect) smoothnessSelect.value = preset.smoothnessLevel;
    if (keyboardSupport) keyboardSupport.checked = preset.keyboard;
    if (mobileSupport) mobileSupport.checked = preset.mobile;
    if (stepInput) stepInput.value = preset.step;
    if (easingSelect) easingSelect.value = preset.easingType;
    if (keyboardStep) keyboardStep.value = preset.keyboardStep;
    if (excludeSelectors) excludeSelectors.value = preset.excludeSelectors;

    this.updateSpeedUI();
    this.updateSmoothnessUI();
    this.updateKeyboardOptionsVisibility();
  }

  updateSpeedUI() {
    const { speedSelect, speedValueDisplay, speedTimeDisplay } = this.elements;
    if (!speedSelect || !speedValueDisplay) return;

    let val = Math.max(parseInt(speedSelect.value, 10) || 1, 1);
    speedValueDisplay.textContent = `${val}%`;

    if (speedTimeDisplay) {
      const approxMs =
        val >= 100 ? 300 : val <= 1 ? 1000 : 1000 - (val / 100) * 700;
      speedTimeDisplay.textContent = `~${Math.round(approxMs)}мс`;
    }
  }

  updateSmoothnessUI() {
    const { smoothnessSelect, smoothnessValueDisplay, easingTypeDisplay } =
      this.elements;
    if (!smoothnessSelect || !smoothnessValueDisplay) return;

    let val = Math.max(parseInt(smoothnessSelect.value, 10) || 1, 1);
    smoothnessValueDisplay.textContent = `${val}%`;

    if (easingTypeDisplay) {
      const easingLabel =
        val <= 1
          ? "Резкая"
          : val < 25
          ? "Слабая"
          : val < 50
          ? "Средняя"
          : val < 75
          ? "Плавная"
          : val < 90
          ? "Очень плавная"
          : "Максимальная";
      easingTypeDisplay.textContent = easingLabel;
    }
  }

  updateKeyboardOptionsVisibility() {
    const keyboardOption = document.querySelector(".keyboard-option");
    if (keyboardOption && this.elements.keyboardSupport) {
      keyboardOption.style.display = this.elements.keyboardSupport.checked
        ? "block"
        : "none";
    }
  }

  // Используем базовый generateAndCopyCode() => оно вызывает collectData + generateCode
  collectData() {
    // Собираем нужные настройки из UI:
    return {
      speedLevel: parseInt(this.elements.speedSelect?.value, 10) || 60,
      smoothnessLevel:
        parseInt(this.elements.smoothnessSelect?.value, 10) || 70,
      step: parseInt(this.elements.stepInput?.value, 10) || 120,
      keyboard: this.elements.keyboardSupport?.checked,
      keyboardStep: parseInt(this.elements.keyboardStep?.value, 10) || 200,
      mobile: this.elements.mobileSupport?.checked,
      excludeSelectors: (this.elements.excludeSelectors?.value || "").trim(),
      easingType: this.elements.easingSelect?.value || "standard",
    };
  }

  generateCode(settings = {}) {
    // Логика генерации
    // ...
    // Вызываем вспомогательные методы для формирования "сложного" скрипта
    const { easeFactor, dampingCode, extendedGlideCode } =
      this._getEasingSettings(settings);
    const excludeSelectorsCode = this._getExcludeSelectorsCode(
      settings.excludeSelectors
    );
    const keyboardCode = settings.keyboard
      ? this._getKeyboardCode(settings)
      : "";
    const mobileCode = settings.mobile ? this._getMobileCode() : "";

    return `<script>
/**
 * Расширение для Taptop - плавный скролл.
 * Настройки: шаг ${settings.step}px, плавность ${Math.round(
      settings.smoothnessLevel
    )}%, эффект ${settings.easingType}
 */
(function() {
  if (window.superSmoothScrollInitialized) return;
  window.superSmoothScrollInitialized = true;
  const smoothScroll = {
    currentScroll: window.pageYOffset,
    targetScroll: window.pageYOffset,
    easeFactor: ${easeFactor.toFixed(3)},
    running: false,
    rAF: null
  };${dampingCode}
  ${excludeSelectorsCode}
  function startSmooth() {
    if (!smoothScroll.running) {
      smoothScroll.running = true;
      smoothScroll.rAF = requestAnimationFrame(updateSmoothScroll);
    }
  }
  function updateSmoothScroll() {
    let diff = smoothScroll.targetScroll - smoothScroll.currentScroll;
    let step = diff * smoothScroll.easeFactor;
    smoothScroll.currentScroll += step;
    if (Math.abs(diff) < 0.5) {
      smoothScroll.currentScroll = smoothScroll.targetScroll;
      smoothScroll.running = false;
      cancelAnimationFrame(smoothScroll.rAF);
    } else {
      window.scrollTo(0, Math.round(smoothScroll.currentScroll));
      smoothScroll.rAF = requestAnimationFrame(updateSmoothScroll);
    }
  }
  ${extendedGlideCode}
  function onWheel(e) {
    if (shouldExclude(e.target)) return;
    e.preventDefault();
    let delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    let direction = delta > 0 ? 1 : -1;
    smoothScroll.targetScroll += direction * ${settings.step};
    let maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    smoothScroll.targetScroll = Math.max(0, Math.min(smoothScroll.targetScroll, maxScroll));
    startSmooth();
  }
  const wheelEvent = 'onwheel' in document ? 'wheel' :
                     'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll';
  document.addEventListener(wheelEvent, onWheel, { passive: false });
  ${keyboardCode}
  ${mobileCode}
})();
</script>`;
  }

  // --- Приватные вспомогательные методы ---
  _getEasingSettings(settings) {
    let easeFactorBase = 0.14 - (settings.smoothnessLevel / 100) * 0.1;
    let easeFactor = easeFactorBase;
    let dampingCode = "";
    let extendedGlideCode = "";

    if (settings.easingType === "minimal") {
      easeFactor = Math.min(0.4, easeFactorBase * 2.5);
    } else if (settings.easingType === "precise") {
      dampingCode = `
    let lastDiff = 0, dampingFactor = 0.9;`;
      extendedGlideCode = `
    function updateWithExtendedGlide() {
      let diff = smoothScroll.targetScroll - smoothScroll.currentScroll;
      if (Math.sign(diff) !== Math.sign(lastDiff) && lastDiff !== 0) {
        diff *= 0.3;
      }
      let adjustedFactor = smoothScroll.easeFactor;
      if (Math.abs(diff) < 100) {
        adjustedFactor *= 0.4;
      }
      let step = diff * adjustedFactor;
      smoothScroll.currentScroll += step;
      lastDiff = diff;
      if (Math.abs(diff) < 0.2) {
        smoothScroll.currentScroll = smoothScroll.targetScroll;
        smoothScroll.running = false;
        cancelAnimationFrame(smoothScroll.rAF);
      } else {
        window.scrollTo(0, Math.round(smoothScroll.currentScroll));
        smoothScroll.rAF = requestAnimationFrame(updateWithExtendedGlide);
      }
    }
    updateSmoothScroll = updateWithExtendedGlide;`;
    }

    return { easeFactor, dampingCode, extendedGlideCode };
  }

  _getExcludeSelectorsCode(excludeSelectors) {
    if (!excludeSelectors) {
      return "function shouldExclude(element) { return false; }";
    }
    const selectors = excludeSelectors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `"\${s}"`)
      .join(", ");
    if (!selectors) {
      return "function shouldExclude(element) { return false; }";
    }
    return `
  let excludeSelectors = [${selectors}];
  function shouldExclude(element) {
    while (element && element !== document.body) {
      if (excludeSelectors.some(selector => element.matches(selector))) return true;
      element = element.parentElement;
    }
    return false;
  }`;
  }

  _getKeyboardCode(settings) {
    return `
  document.addEventListener('keydown', function(e) {
    if (e.target && shouldExclude(e.target)) return;
    switch(e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        smoothScroll.targetScroll += ${settings.keyboardStep};
        startSmooth();
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        smoothScroll.targetScroll -= ${settings.keyboardStep};
        startSmooth();
        break;
      case 'Home':
        e.preventDefault();
        smoothScroll.targetScroll = 0;
        startSmooth();
        break;
      case 'End':
        e.preventDefault();
        smoothScroll.targetScroll = document.documentElement.scrollHeight - window.innerHeight;
        startSmooth();
        break;
    }
  });`;
  }

  _getMobileCode() {
    return `
  (function() {
    let startY = 0, isTouching = false;
    document.addEventListener('touchstart', function(e) {
      if (shouldExclude(e.target)) return;
      startY = e.touches[0].clientY;
      isTouching = true;
    }, { passive: true });
    document.addEventListener('touchmove', function(e) {
      if (!isTouching || shouldExclude(e.target)) return;
      let currentY = e.touches[0].clientY;
      let delta = startY - currentY;
      if (Math.abs(delta) > 5) {
        e.preventDefault();
        smoothScroll.targetScroll += delta * 0.5;
        startSmooth();
        startY = currentY;
      }
    }, { passive: false });
    document.addEventListener('touchend', () => isTouching = false, { passive: true });
  })();`;
  }
}

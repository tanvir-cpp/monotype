/**
 * LUMEN // Tactile Typewriter
 * UI Controls, Animation Loop, Event Listeners & Application Bootstrap
 */
window.Lumen = window.Lumen || {};

(function (Lumen) {
  'use strict';

  let lastKeyHandledTimestamp = 0;
  let toastTimeout = null;
  let touchStartY = null;
  let touchMoved = false;

  // -------------------------------------------------------------------------
  // Animation Loop (Smooth Damped Lerp for Carriage & Paper)
  // -------------------------------------------------------------------------
  function animateLoop() {
    const state = Lumen.state;
    const dom = Lumen.dom;

    const dx = state.targetCarriageX - state.currentCarriageX;
    if (Math.abs(dx) > 0.1) {
      state.currentCarriageX += dx * 0.25;
    } else {
      state.currentCarriageX = state.targetCarriageX;
    }

    const dy = state.targetPaperY - state.currentPaperY;
    if (Math.abs(dy) > 0.1) {
      state.currentPaperY += dy * 0.24;
    } else {
      state.currentPaperY = state.targetPaperY;
    }

    if (dom.pillCarriage) {
      dom.pillCarriage.style.transform = `translate3d(${state.currentCarriageX.toFixed(2)}px, 0, 0)`;
    }
    if (dom.paperSheet) {
      dom.paperSheet.style.transform = `translate3d(0, ${state.currentPaperY.toFixed(2)}px, 0)`;
    }

    if (Lumen.renderVolumetricSpotlight) {
      Lumen.renderVolumetricSpotlight();
    }

    requestAnimationFrame(animateLoop);
  }

  // -------------------------------------------------------------------------
  // UI Helpers (Popovers, Themes, Audio, Toast)
  // -------------------------------------------------------------------------
  function closeAllPopovers() {
    if (Lumen.dom.popoverSettings) {
      Lumen.dom.popoverSettings.classList.add('hidden');
    }
  }

  function dismissTouchPrompt() {
    const prompt = Lumen.dom.touchPrompt;
    if (prompt && !prompt.classList.contains('hidden')) {
      prompt.classList.add('opacity-0');
      setTimeout(() => {
        prompt.classList.add('hidden');
      }, 500);
    }
  }

  function showToast(msg) {
    const toast = Lumen.dom.toastBox;
    if (!toast) return;

    toast.textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      toast.classList.remove('opacity-100', 'translate-y-0');
    }, 2000);
  }

  function applyTheme(themeKey) {
    if (!Lumen.THEMES[themeKey]) themeKey = 'standard';
    Lumen.state.themeKey = themeKey;
    const t = Lumen.THEMES[themeKey];

    document.documentElement.style.setProperty('--paper-base', t.paperBase);
    document.documentElement.style.setProperty('--ink-color', t.inkColor);
    if (Lumen.dom.paperBackdrop) {
      Lumen.dom.paperBackdrop.style.backgroundColor = t.paperBase;
    }

    document.querySelectorAll('.theme-btn').forEach((btn) => {
      const active = btn.getAttribute('data-theme') === themeKey;
      btn.className = active
        ? 'theme-btn min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] bg-white/15 text-white font-medium text-left flex items-center gap-1.5'
        : 'theme-btn min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-slate-300 text-left flex items-center gap-1.5';
    });

    if (Lumen.saveToStorage) Lumen.saveToStorage();
  }

  function updateAudioUI() {
    const btn = Lumen.dom.quickAudioBtn;
    if (!btn) return;
    const isEnabled = Lumen.state.mechSoundEnabled;
    btn.textContent = isEnabled ? 'Keys: On' : 'Keys: Off';
    btn.classList.toggle('text-slate-200', isEnabled);
    btn.classList.toggle('text-slate-500', !isEnabled);
  }

  function setRainState(enabled) {
    Lumen.state.rainEnabled = enabled;
    if (Lumen.audio) Lumen.audio.toggleRain(enabled);

    const btn = Lumen.dom.quickRainBtn;
    if (btn) {
      btn.textContent = enabled ? 'Rain: On' : 'Rain: Off';
      btn.classList.toggle('text-sky-300', enabled);
      btn.classList.toggle('text-slate-300', !enabled);
    }
  }

  function updateCorrectionModeUI() {
    const isRibbon = Lumen.state.correctionMode === 'ribbon';
    if (Lumen.dom.modeRibbon) {
      Lumen.dom.modeRibbon.className = isRibbon
        ? 'min-h-[36px] px-2 py-1 rounded-lg text-[11px] bg-white/15 text-white font-medium'
        : 'min-h-[36px] px-2 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-slate-300';
    }
    if (Lumen.dom.modeOverstrike) {
      Lumen.dom.modeOverstrike.className = !isRibbon
        ? 'min-h-[36px] px-2 py-1 rounded-lg text-[11px] bg-white/15 text-white font-medium'
        : 'min-h-[36px] px-2 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-slate-300';
    }
  }

  // -------------------------------------------------------------------------
  // Event Bindings
  // -------------------------------------------------------------------------
  function setupEventListeners() {
    const dom = Lumen.dom;
    const state = Lumen.state;

    // Physical Keyboard Input
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'range') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        lastKeyHandledTimestamp = Date.now();
        if (Lumen.performCarriageReturn) Lumen.performCarriageReturn();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        lastKeyHandledTimestamp = Date.now();
        if (Lumen.performBackspace) Lumen.performBackspace();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        lastKeyHandledTimestamp = Date.now();
        for (let i = 0; i < 4; i++) {
          if (Lumen.stampCharacter) Lumen.stampCharacter(' ');
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (Lumen.scrollPaperHistory) Lumen.scrollPaperHistory(1);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (Lumen.scrollPaperHistory) Lumen.scrollPaperHistory(-1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (state.cursorCol > 0) {
          state.cursorCol--;
          if (Lumen.audio) Lumen.audio.playBackspaceTick();
          if (Lumen.updateTargetCoordinates) Lumen.updateTargetCoordinates(false);
          if (Lumen.renderPaperDOM) Lumen.renderPaperDOM();
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (state.cursorCol < state.maxCols - 1) {
          state.cursorCol++;
          if (Lumen.audio) Lumen.audio.playBackspaceTick();
          if (Lumen.updateTargetCoordinates) Lumen.updateTargetCoordinates(false);
          if (Lumen.renderPaperDOM) Lumen.renderPaperDOM();
        }
        return;
      }

      if (e.key.length === 1) {
        e.preventDefault();
        lastKeyHandledTimestamp = Date.now();
        if (Lumen.stampCharacter) Lumen.stampCharacter(e.key);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ') {
        if (Lumen.audio) Lumen.audio.playKeyRelease();
      }
    });

    // Mobile / IME Hidden Input Bridge
    if (dom.hiddenInput) {
      dom.hiddenInput.addEventListener('input', () => {
        if (Date.now() - lastKeyHandledTimestamp < 60) {
          dom.hiddenInput.value = '';
          return;
        }
        const val = dom.hiddenInput.value;
        if (val && val.length > 0) {
          const char = val[val.length - 1];
          if (char === '\n') {
            if (Lumen.performCarriageReturn) Lumen.performCarriageReturn();
          } else {
            if (Lumen.stampCharacter) Lumen.stampCharacter(char);
          }
        }
        dom.hiddenInput.value = '';
      });
    }

    // Stage Click to Focus
    if (dom.stage) {
      dom.stage.addEventListener('click', () => {
        closeAllPopovers();
        dismissTouchPrompt();
        if (dom.hiddenInput) dom.hiddenInput.focus({ preventScroll: true });
      });

      // Touch Drag Gestures for Paper History Scrolling
      dom.stage.addEventListener('touchstart', (e) => {
        if (e.target.closest('#minimal-hud')) return;
        if (e.touches && e.touches.length === 1) {
          touchStartY = e.touches[0].clientY;
          touchMoved = false;
        }
      }, { passive: true });

      dom.stage.addEventListener('touchmove', (e) => {
        if (touchStartY === null || !e.touches || e.touches.length !== 1) return;
        const deltaY = e.touches[0].clientY - touchStartY;
        if (Math.abs(deltaY) > 16) {
          touchMoved = true;
          if (Lumen.scrollPaperHistory) {
            Lumen.scrollPaperHistory(deltaY / state.lineHeight);
          }
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      dom.stage.addEventListener('touchend', (e) => {
        if (e.target.closest('#minimal-hud')) return;
        if (!touchMoved) {
          closeAllPopovers();
          dismissTouchPrompt();
          if (dom.hiddenInput) dom.hiddenInput.focus({ preventScroll: true });
        }
        touchStartY = null;
      }, { passive: true });
    }

    // Mobile Soft Keyboard Button
    if (dom.quickKbdBtn) {
      dom.quickKbdBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissTouchPrompt();
        if (document.activeElement === dom.hiddenInput) {
          if (dom.hiddenInput) dom.hiddenInput.blur();
          showToast('Keyboard hidden');
        } else {
          if (dom.hiddenInput) dom.hiddenInput.focus({ preventScroll: true });
        }
      });
    }

    // Mouse Wheel Scrolling for Paper History
    window.addEventListener('wheel', (e) => {
      if (e.target.closest('#minimal-hud')) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      if (Lumen.scrollPaperHistory) {
        Lumen.scrollPaperHistory(dir * 0.65);
      }
    }, { passive: false });

    // Window Resize
    window.addEventListener('resize', () => {
      if (Lumen.measureLayoutMetrics) Lumen.measureLayoutMetrics();
    });

    // Visual Viewport Resize & Scroll (Mobile Keyboard Support)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (Lumen.measureLayoutMetrics) Lumen.measureLayoutMetrics();
      });
      window.visualViewport.addEventListener('scroll', () => {
        if (Lumen.measureLayoutMetrics) Lumen.measureLayoutMetrics();
      });
    }

    // Settings Button & Popover
    if (dom.btnSettings) {
      dom.btnSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dom.popoverSettings) dom.popoverSettings.classList.toggle('hidden');
      });
    }

    if (dom.popoverSettings) {
      dom.popoverSettings.addEventListener('click', (e) => e.stopPropagation());
    }

    // Theme Buttons
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyTheme(btn.getAttribute('data-theme'));
      });
    });

    // Lamp Brightness Slider
    if (dom.sliderIntensity) {
      dom.sliderIntensity.addEventListener('input', (e) => {
        state.lampIntensity = parseFloat(e.target.value);
        if (dom.valIntensity) {
          dom.valIntensity.textContent = `${Math.round(state.lampIntensity * 100)}%`;
        }
        if (Lumen.saveToStorage) Lumen.saveToStorage();
      });
    }

    // Typeface Buttons
    document.querySelectorAll('.font-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.fontFamily = btn.getAttribute('data-font');
        document.documentElement.style.setProperty('--font-typewriter', state.fontFamily);
        document.querySelectorAll('.font-btn').forEach((b) => {
          b.className = b === btn
            ? 'font-btn min-h-[36px] px-2 py-1 rounded bg-white/15 text-white text-[11px]'
            : 'font-btn min-h-[36px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]';
        });
        if (Lumen.measureLayoutMetrics) Lumen.measureLayoutMetrics();
        if (Lumen.saveToStorage) Lumen.saveToStorage();
      });
    });

    // Key Click Audio Quick Toggle
    if (dom.quickAudioBtn) {
      dom.quickAudioBtn.addEventListener('click', () => {
        state.mechSoundEnabled = !state.mechSoundEnabled;
        updateAudioUI();
        showToast(state.mechSoundEnabled ? 'Mechanical key audio enabled' : 'Key audio muted');
      });
    }

    // Rain Ambience Quick Toggle
    if (dom.quickRainBtn) {
      dom.quickRainBtn.addEventListener('click', () => {
        setRainState(!state.rainEnabled);
        showToast(state.rainEnabled ? 'Rain ambience active' : 'Rain ambience off');
      });
    }

    // Backspace Mode Buttons
    if (dom.modeRibbon) {
      dom.modeRibbon.addEventListener('click', () => {
        state.correctionMode = 'ribbon';
        updateCorrectionModeUI();
        if (Lumen.saveToStorage) Lumen.saveToStorage();
      });
    }

    if (dom.modeOverstrike) {
      dom.modeOverstrike.addEventListener('click', () => {
        state.correctionMode = 'overstrike';
        updateCorrectionModeUI();
        if (Lumen.saveToStorage) Lumen.saveToStorage();
      });
    }

    // Reset Reference Text Button
    if (dom.actionResetScene) {
      dom.actionResetScene.addEventListener('click', () => {
        if (Lumen.animatePaperChange) {
          Lumen.animatePaperChange(() => {
            if (Lumen.initDefaultScene) Lumen.initDefaultScene();
            applyTheme('standard');
          });
        }
        showToast('Restored reference text');
      });
    }

    // Clear / New Sheet Button
    if (dom.actionNewSheet) {
      dom.actionNewSheet.addEventListener('click', () => {
        if (Lumen.animatePaperChange) {
          Lumen.animatePaperChange(() => {
            state.lines = [Lumen.createEmptyLine ? Lumen.createEmptyLine() : { cells: [] }];
            state.currentLineIndex = 0;
            state.cursorCol = 0;
            state.paperScrollOffsetLines = 0;
          });
        }
        showToast('Fresh sheet loaded');
      });
    }

    // Export .txt Button
    if (dom.actionExportTxt) {
      dom.actionExportTxt.addEventListener('click', () => {
        closeAllPopovers();
        const text = Lumen.getPlainTextManuscript ? Lumen.getPlainTextManuscript() : '';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `typewriter-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Exported .txt');
      });
    }

    // Copy Text Button
    if (dom.actionCopyText) {
      dom.actionCopyText.addEventListener('click', () => {
        closeAllPopovers();
        const text = Lumen.getPlainTextManuscript ? Lumen.getPlainTextManuscript() : '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard');
          }).catch(() => {
            legacyCopyFallback(text);
          });
        } else {
          legacyCopyFallback(text);
        }
      });
    }
  }

  function legacyCopyFallback(text) {
    const tempArea = document.createElement('textarea');
    tempArea.value = text;
    tempArea.style.position = 'fixed';
    tempArea.style.left = '-9999px';
    document.body.appendChild(tempArea);
    tempArea.select();
    try {
      document.execCommand('copy');
      showToast('Copied to clipboard');
    } catch (err) {
      showToast('Copy failed');
    }
    document.body.removeChild(tempArea);
  }

  // -------------------------------------------------------------------------
  // Application Bootstrap
  // -------------------------------------------------------------------------
  function init() {
    Lumen.initDom();

    if (Lumen.loadFromStorage) Lumen.loadFromStorage();
    applyTheme(Lumen.state.themeKey);
    document.documentElement.style.setProperty('--font-typewriter', Lumen.state.fontFamily);

    if (Lumen.dom.sliderIntensity) {
      Lumen.dom.sliderIntensity.value = Lumen.state.lampIntensity;
    }
    if (Lumen.dom.valIntensity) {
      Lumen.dom.valIntensity.textContent = `${Math.round(Lumen.state.lampIntensity * 100)}%`;
    }

    updateCorrectionModeUI();
    updateAudioUI();

    // Configure touch-friendly HUD & auto-fading mobile prompt on touch devices
    Lumen.state.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (Lumen.state.isTouchDevice) {
      if (Lumen.dom.hud) {
        Lumen.dom.hud.classList.remove('opacity-25');
        Lumen.dom.hud.classList.add('opacity-65');
      }
      if (Lumen.dom.quickKbdBtn) {
        Lumen.dom.quickKbdBtn.classList.remove('hidden');
        Lumen.dom.quickKbdBtn.classList.add('flex');
      }
      if (Lumen.dom.touchPrompt) {
        Lumen.dom.touchPrompt.classList.remove('hidden');
        setTimeout(dismissTouchPrompt, 4500);
      }
    }

    setupEventListeners();

    if (Lumen.measureLayoutMetrics) Lumen.measureLayoutMetrics();
    if (Lumen.updateTargetCoordinates) Lumen.updateTargetCoordinates(true);

    animateLoop();

    if (!Lumen.state.isTouchDevice && Lumen.dom.hiddenInput) {
      Lumen.dom.hiddenInput.focus({ preventScroll: true });
    }
  }

  window.addEventListener('load', init);

  // Export methods
  Lumen.animateLoop = animateLoop;
  Lumen.closeAllPopovers = closeAllPopovers;
  Lumen.dismissTouchPrompt = dismissTouchPrompt;
  Lumen.showToast = showToast;
  Lumen.applyTheme = applyTheme;
  Lumen.updateAudioUI = updateAudioUI;
  Lumen.setRainState = setRainState;
  Lumen.updateCorrectionModeUI = updateCorrectionModeUI;
  Lumen.init = init;
})(window.Lumen);


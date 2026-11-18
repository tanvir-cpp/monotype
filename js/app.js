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
    if (Lumen.dom.btnSettings) {
      Lumen.dom.btnSettings.setAttribute('aria-expanded', 'false');
    }
  }

  function isHudControl(target) {
    return !!(target && target.closest && target.closest('#minimal-hud'));
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
    Lumen.spotlightDirty = true;

    document.querySelectorAll('.theme-btn').forEach((btn) => {
      const active = btn.getAttribute('data-theme') === themeKey;
      btn.setAttribute('aria-pressed', String(active));
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
    btn.setAttribute('aria-pressed', String(isEnabled));
    btn.classList.toggle('text-slate-200', isEnabled);
    btn.classList.toggle('text-slate-500', !isEnabled);
  }

  function setRainState(enabled) {
    Lumen.state.rainEnabled = enabled;
    if (Lumen.audio) Lumen.audio.toggleRain(enabled);

    const btn = Lumen.dom.quickRainBtn;
    if (btn) {
      btn.textContent = enabled ? 'Rain: On' : 'Rain: Off';
      btn.setAttribute('aria-pressed', String(enabled));
      btn.classList.toggle('text-sky-300', enabled);
      btn.classList.toggle('text-slate-300', !enabled);
    }
  }

  function applyFont(fontFamily) {
    Lumen.state.fontFamily = fontFamily;
    document.documentElement.style.setProperty('--font-typewriter', fontFamily);
    document.querySelectorAll('.font-btn').forEach((b) => {
      const active = b.getAttribute('data-font') === fontFamily;
      b.setAttribute('aria-pressed', String(active));
      b.className = active
        ? 'font-btn min-h-[36px] px-2 py-1 rounded bg-white/15 text-white text-[11px]'
        : 'font-btn min-h-[36px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]';
    });
    // Re-measure now, and again once the web font has really loaded
    if (Lumen.measureLayoutMetrics) Lumen.measureLayoutMetrics();
    if (document.fonts && document.fonts.load) {
      document.fonts.load(`20px ${fontFamily}`).then(() => {
        if (Lumen.state.fontFamily === fontFamily && Lumen.measureLayoutMetrics) {
          Lumen.measureLayoutMetrics();
        }
      }).catch(() => {});
    }
  }

  function updateCorrectionModeUI() {
    const isRibbon = Lumen.state.correctionMode === 'ribbon';
    if (Lumen.dom.modeRibbon) Lumen.dom.modeRibbon.setAttribute('aria-pressed', String(isRibbon));
    if (Lumen.dom.modeOverstrike) Lumen.dom.modeOverstrike.setAttribute('aria-pressed', String(!isRibbon));
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
      if (e.key === 'Escape') {
        closeAllPopovers();
        if (dom.hiddenInput) dom.hiddenInput.focus({ preventScroll: true });
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      // Let focused HUD controls (buttons, slider) keep Enter/Space/Tab/arrows
      if (isHudControl(e.target)) return;

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
      if (isHudControl(e.target)) return;
      if (e.key.length === 1 || e.key === 'Backspace') {
        if (Lumen.audio) Lumen.audio.playKeyRelease();
      }
    });

    // Mobile / IME Hidden Input Bridge.
    // A zero-width sentinel keeps the textarea non-empty so soft-keyboard
    // Backspace (which reports key "Unidentified") still produces an event.
    const SENTINEL = '\u200b';
    if (dom.hiddenInput) {
      const resetHidden = () => { dom.hiddenInput.value = SENTINEL; };
      resetHidden();
      dom.hiddenInput.addEventListener('focus', resetHidden);

      dom.hiddenInput.addEventListener('beforeinput', (e) => {
        if (e.isComposing) return;
        if (Date.now() - lastKeyHandledTimestamp < 60) return;
        if (e.inputType === 'deleteContentBackward') {
          e.preventDefault();
          if (Lumen.performBackspace) Lumen.performBackspace();
        } else if (e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph') {
          e.preventDefault();
          if (Lumen.performCarriageReturn) Lumen.performCarriageReturn();
        }
      });

      dom.hiddenInput.addEventListener('input', (e) => {
        if (e.isComposing) return;
        if (Date.now() - lastKeyHandledTimestamp < 60) {
          resetHidden();
          return;
        }
        const val = dom.hiddenInput.value.split(SENTINEL).join('');
        if (val && Lumen.stampText) Lumen.stampText(val);
        resetHidden();
      });

      dom.hiddenInput.addEventListener('compositionend', (e) => {
        if (e.data && Lumen.stampText) Lumen.stampText(e.data);
        resetHidden();
      });

      // Paste text onto the page, one strike at a time
      window.addEventListener('paste', (e) => {
        const text = e.clipboardData && e.clipboardData.getData('text');
        if (!text) return;
        e.preventDefault();
        if (Lumen.stampText) Lumen.stampText(text.slice(0, 5000));
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
        if (isHudControl(e.target)) return;
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
        if (isHudControl(e.target)) return;
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
      if (isHudControl(e.target)) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      if (Lumen.scrollPaperHistory) {
        Lumen.scrollPaperHistory(dir * 0.65);
      }
    }, { passive: false });

    window.addEventListener('beforeunload', () => { if (Lumen.flushSave) Lumen.flushSave(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && Lumen.flushSave) Lumen.flushSave();
    });

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
        if (dom.popoverSettings) {
          const nowHidden = dom.popoverSettings.classList.toggle('hidden');
          dom.btnSettings.setAttribute('aria-expanded', String(!nowHidden));
        }
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
        applyFont(btn.getAttribute('data-font'));
        if (Lumen.saveToStorage) Lumen.saveToStorage();
      });
    });

    // Key Click Audio Quick Toggle
    if (dom.quickAudioBtn) {
      dom.quickAudioBtn.addEventListener('click', () => {
        state.mechSoundEnabled = !state.mechSoundEnabled;
        updateAudioUI();
        if (Lumen.saveToStorage) Lumen.saveToStorage();
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
        if (hasContent() && !window.confirm('Replace the current page with the reference text?')) return;
        if (Lumen.animatePaperChange) {
          Lumen.animatePaperChange(() => {
            if (Lumen.initDefaultScene) Lumen.initDefaultScene();
          });
        }
        showToast('Restored reference text');
      });
    }

    // Clear / New Sheet Button
    if (dom.actionNewSheet) {
      dom.actionNewSheet.addEventListener('click', () => {
        if (hasContent() && !window.confirm('Clear this page? Export or copy it first if you want to keep it.')) return;
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
        if (!text.trim()) { showToast('Nothing to export'); return; }
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

  function hasContent() {
    return Lumen.state.lines.some((l) => l.cells.some((c) => c && c.char && c.char.trim()));
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
    applyFont(Lumen.state.fontFamily);

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
        Lumen.dom.hud.classList.add('opacity-70');
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


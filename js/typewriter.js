/**
 * LUMEN // Tactile Typewriter
 * Core Typewriter Mechanics, Ink Physics & State Persistence
 */
window.Lumen = window.Lumen || {};

(function (Lumen) {
  'use strict';

  let ledPulseTimer = null;
  let marginBellFlashTimer = null;

  // -------------------------------------------------------------------------
  // Data Model & Organic Ink Physics
  // -------------------------------------------------------------------------
  function createInkCell(char, isFresh = false) {
    return {
      char: char,
      overstrikes: [],
      // Crisp deep carbon-black ink density (0.88 to 0.98) for effortless legibility
      opacity: +(0.88 + Math.random() * 0.10).toFixed(2),
      // Micro mechanical jitter (±0.3px vertical & subtle organic angle)
      dy: +((Math.random() - 0.5) * 0.6).toFixed(2),
      dx: +((Math.random() - 0.5) * 0.24).toFixed(2),
      rot: +((Math.random() - 0.5) * 0.4).toFixed(2),
      fresh: isFresh
    };
  }

  function createEmptyLine() {
    return { cells: [] };
  }

  function stringToLine(str) {
    const line = createEmptyLine();
    for (let i = 0; i < str.length; i++) {
      line.cells.push(createInkCell(str[i], false));
    }
    return line;
  }

  function initDefaultScene() {
    const state = Lumen.state;
    state.lines = [stringToLine(Lumen.INITIAL_REFERENCE_TEXT)];
    state.currentLineIndex = 0;
    state.cursorCol = Lumen.INITIAL_REFERENCE_TEXT.length;
    state.paperScrollOffsetLines = 0;
  }

  function loadFromStorage() {
    const state = Lumen.state;
    try {
      const raw = localStorage.getItem(Lumen.STORAGE_KEY);
      if (!raw) {
        initDefaultScene();
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.lines) && parsed.lines.length > 0) {
        state.lines = parsed.lines;
        state.currentLineIndex = Math.min(parsed.currentLineIndex || 0, state.lines.length - 1);
        state.cursorCol = parsed.cursorCol || 0;
        if (parsed.themeKey && Lumen.THEMES[parsed.themeKey]) state.themeKey = parsed.themeKey;
        if (typeof parsed.lampIntensity === 'number') state.lampIntensity = parsed.lampIntensity;
        if (parsed.fontFamily) state.fontFamily = parsed.fontFamily;
        if (parsed.correctionMode) state.correctionMode = parsed.correctionMode;
      } else {
        initDefaultScene();
      }
    } catch (err) {
      initDefaultScene();
    }
  }

  function saveToStorage() {
    const state = Lumen.state;
    try {
      const payload = {
        lines: state.lines,
        currentLineIndex: state.currentLineIndex,
        cursorCol: state.cursorCol,
        themeKey: state.themeKey,
        lampIntensity: state.lampIntensity,
        fontFamily: state.fontFamily,
        correctionMode: state.correctionMode
      };
      localStorage.setItem(Lumen.STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      // Ignore storage quota/security errors
    }
  }

  // -------------------------------------------------------------------------
  // Flat 2D Layout Metrics, Margin Collars & Coordinate Tracking
  // -------------------------------------------------------------------------
  function getActiveViewportMetrics() {
    const vv = window.visualViewport;
    return {
      vw: vv ? vv.width : window.innerWidth,
      vh: vv ? vv.height : window.innerHeight,
      offsetTop: vv ? vv.offsetTop : 0
    };
  }

  function measureLayoutMetrics() {
    const state = Lumen.state;
    const dom = Lumen.dom;
    const { vw, vh, offsetTop } = getActiveViewportMetrics();
    const isMobile = vw < 640;

    // Horizontal cylindrical rail fixed at 76% of active visual viewport height
    state.railY = Math.round(offsetTop + vh * state.railYRatio);
    document.documentElement.style.setProperty('--rail-Y', `${state.railY}px`);

    // Measure monospace character width accurately (20px desktop, 16px mobile)
    const probe = document.createElement('span');
    probe.className = 'typewriter-text';
    probe.style.fontSize = isMobile ? '16px' : '20px';
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.textContent = 'MMMMMMMMMM';
    document.body.appendChild(probe);
    const measuredCharW = probe.getBoundingClientRect().width / 10;
    document.body.removeChild(probe);

    state.charWidth = measuredCharW || (isMobile ? 9.6 : 12.0);
    state.lineHeight = isMobile ? 28 : 34;

    // Responsive margins leaving room for the cylindrical margin clamp collars
    const collarWidth = isMobile ? 13 : 16;
    const minSidePadding = isMobile ? 24 : Math.max(Math.round(vw * 0.06), 54);
    const availableWidth = Math.max(210, vw - minSidePadding * 2);
    const targetColumnWidth = isMobile ? availableWidth : Math.min(720, availableWidth);
    state.maxCols = Math.max(18, Math.floor(targetColumnWidth / state.charWidth));

    const actualColumnWidth = state.maxCols * state.charWidth;
    const centeredLeft = (vw - actualColumnWidth) / 2;

    if (isMobile) {
      state.leftMarginPx = Math.max(minSidePadding, Math.round(centeredLeft));
    } else {
      // Position so column 22 ("The rain was heavy, he") places the pill carriage near center
      const refLeft = vw * 0.495 - 22 * state.charWidth;
      state.leftMarginPx = Math.round(Math.max(minSidePadding, Math.min(centeredLeft, refLeft)));
    }

    // Position the left and right cylindrical margin clamp collars onto the thick rod
    const rightMarginPx = state.leftMarginPx + state.maxCols * state.charWidth;
    if (dom.collarLeft) dom.collarLeft.style.left = `${Math.max(4, state.leftMarginPx - collarWidth - 4)}px`;
    if (dom.collarRight) dom.collarRight.style.left = `${Math.min(vw - collarWidth - 4, rightMarginPx + 4)}px`;

    // Resize background lighting canvas to match full window
    if (dom.spotlightCanvas) {
      const canvasW = window.innerWidth;
      const canvasH = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dom.spotlightCanvas.width = canvasW * dpr;
      dom.spotlightCanvas.height = canvasH * dpr;
      if (Lumen.ctx) {
        Lumen.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    if (!Lumen.paperFiberPattern && Lumen.buildFibrousPaperPattern) {
      Lumen.buildFibrousPaperPattern();
    }

    updateTargetCoordinates(false);
    if (Lumen.renderPaperDOM) {
      Lumen.renderPaperDOM();
    }
  }

  function updateTargetCoordinates(immediate = false) {
    const state = Lumen.state;
    const dom = Lumen.dom;
    const activeCol = Math.min(state.cursorCol, state.maxCols);

    // Pill carriage slides horizontally to align the T-striker with the active cursor X
    state.targetCarriageX = state.leftMarginPx + activeCol * state.charWidth + state.charWidth * 0.5;
    state.targetPaperY = state.paperScrollOffsetLines * state.lineHeight;

    if (immediate) {
      state.currentCarriageX = state.targetCarriageX;
      state.currentPaperY = state.targetPaperY;
    }

    // Illuminate the 3rd margin/bell LED warm orange-red within 5 characters of the right collar
    if (dom.led3) {
      const remainingCols = state.maxCols - state.cursorCol;
      if (remainingCols <= 5 && remainingCols >= 0) {
        dom.led3.classList.add('margin-warning');
      } else {
        dom.led3.classList.remove('margin-warning');
      }
    }
  }

  // -------------------------------------------------------------------------
  // Mechanical Animations (Hammer Strike & Bell Warning)
  // -------------------------------------------------------------------------
  function triggerPhysicalStrikeAnimation() {
    const dom = Lumen.dom;
    if (!dom.strikerPin || !dom.pillBody || !dom.strikeSpark || !dom.led2) return;

    dom.strikerPin.classList.remove('striking');
    dom.pillBody.classList.remove('jolting');
    dom.strikeSpark.classList.remove('active');
    dom.led2.classList.add('pulsing');

    void dom.strikerPin.offsetWidth;

    dom.strikerPin.classList.add('striking');
    dom.pillBody.classList.add('jolting');
    dom.strikeSpark.classList.add('active');

    if (ledPulseTimer) clearTimeout(ledPulseTimer);
    ledPulseTimer = setTimeout(() => {
      dom.led2.classList.remove('pulsing');
    }, 120);
  }

  function flashMarginBellLED() {
    const dom = Lumen.dom;
    if (!dom.led3) return;

    dom.led3.classList.add('margin-warning');
    if (marginBellFlashTimer) clearTimeout(marginBellFlashTimer);
    marginBellFlashTimer = setTimeout(() => {
      const state = Lumen.state;
      const remainingCols = state.maxCols - state.cursorCol;
      if (remainingCols > 5) {
        dom.led3.classList.remove('margin-warning');
      }
    }, 320);
  }

  // -------------------------------------------------------------------------
  // Core Typewriter Mechanical Actions
  // -------------------------------------------------------------------------
  function stampCharacter(char) {
    if (Lumen.closeAllPopovers) Lumen.closeAllPopovers();

    const state = Lumen.state;
    state.paperScrollOffsetLines = 0;

    const currentLine = state.lines[state.currentLineIndex];

    while (currentLine.cells.length < state.cursorCol) {
      currentLine.cells.push(createInkCell(' ', false));
    }

    if (state.cursorCol < currentLine.cells.length) {
      const existingCell = currentLine.cells[state.cursorCol];
      if (existingCell && existingCell.char !== ' ' && state.correctionMode === 'overstrike') {
        existingCell.overstrikes = existingCell.overstrikes || [];
        existingCell.overstrikes.push({
          char: char,
          opacity: +(0.88 + Math.random() * 0.1).toFixed(2),
          dx: +((Math.random() - 0.5) * 0.35).toFixed(2),
          dy: +((Math.random() - 0.5) * 0.35).toFixed(2),
          rot: +((Math.random() - 0.5) * 0.5).toFixed(2)
        });
        existingCell.fresh = true;
      } else {
        currentLine.cells[state.cursorCol] = createInkCell(char, true);
      }
    } else {
      currentLine.cells.push(createInkCell(char, true));
    }

    triggerPhysicalStrikeAnimation();
    if (Lumen.audio) Lumen.audio.playKeyStrike(char === ' ');

    state.cursorCol++;

    // Classic brass margin bell 5 characters before the right margin collar
    if (state.maxCols - state.cursorCol === 5) {
      if (Lumen.audio) Lumen.audio.playMarginBell();
    }

    if (state.cursorCol >= state.maxCols) {
      handleAutoWordWrap();
    } else {
      updateTargetCoordinates(false);
      if (Lumen.renderPaperDOM) Lumen.renderPaperDOM();
      saveToStorage();
    }
  }

  function handleAutoWordWrap() {
    const state = Lumen.state;
    const currentLine = state.lines[state.currentLineIndex];
    let splitIdx = -1;
    const lookbackLimit = Math.min(14, Math.floor(state.maxCols * 0.45));
    for (let i = currentLine.cells.length - 1; i >= Math.max(0, currentLine.cells.length - lookbackLimit); i--) {
      if (currentLine.cells[i] && currentLine.cells[i].char === ' ') {
        splitIdx = i;
        break;
      }
    }

    let carriedCells = [];
    if (splitIdx !== -1 && splitIdx < currentLine.cells.length - 1) {
      carriedCells = currentLine.cells.slice(splitIdx + 1);
      currentLine.cells = currentLine.cells.slice(0, splitIdx);
    }

    state.currentLineIndex++;
    if (state.currentLineIndex >= state.lines.length) {
      state.lines.push({ cells: carriedCells });
    } else {
      state.lines.splice(state.currentLineIndex, 0, { cells: carriedCells });
    }

    const prevCol = state.cursorCol;
    state.cursorCol = carriedCells.length;

    if (Lumen.audio) Lumen.audio.playCarriageReturn(prevCol);
    flashMarginBellLED();
    updateTargetCoordinates(false);
    if (Lumen.renderPaperDOM) Lumen.renderPaperDOM();
    saveToStorage();
  }

  function performCarriageReturn() {
    if (Lumen.closeAllPopovers) Lumen.closeAllPopovers();

    const state = Lumen.state;
    state.paperScrollOffsetLines = 0;

    const prevCol = state.cursorCol;
    state.currentLineIndex++;

    if (state.currentLineIndex >= state.lines.length) {
      state.lines.push(createEmptyLine());
    } else {
      state.lines.splice(state.currentLineIndex, 0, createEmptyLine());
    }

    state.cursorCol = 0;
    if (Lumen.audio) Lumen.audio.playCarriageReturn(Math.max(8, prevCol));
    flashMarginBellLED();

    updateTargetCoordinates(false);
    if (Lumen.renderPaperDOM) Lumen.renderPaperDOM();
    saveToStorage();
  }

  function performBackspace() {
    if (Lumen.closeAllPopovers) Lumen.closeAllPopovers();

    const state = Lumen.state;
    state.paperScrollOffsetLines = 0;

    const currentLine = state.lines[state.currentLineIndex];

    if (state.cursorCol > 0) {
      state.cursorCol--;
      if (Lumen.audio) Lumen.audio.playBackspaceTick();

      if (state.correctionMode === 'ribbon') {
        if (state.cursorCol === currentLine.cells.length - 1) {
          currentLine.cells.pop();
        } else if (currentLine.cells[state.cursorCol]) {
          currentLine.cells[state.cursorCol] = createInkCell(' ', false);
        }
      }

      updateTargetCoordinates(false);
      if (Lumen.renderPaperDOM) Lumen.renderPaperDOM();
      saveToStorage();
    } else if (state.currentLineIndex > 0 && state.correctionMode === 'ribbon') {
      if (currentLine.cells.length === 0) {
        state.lines.splice(state.currentLineIndex, 1);
      }
      state.currentLineIndex--;
      state.cursorCol = state.lines[state.currentLineIndex].cells.length;
      if (Lumen.audio) Lumen.audio.playBackspaceTick();
      updateTargetCoordinates(false);
      if (Lumen.renderPaperDOM) Lumen.renderPaperDOM();
      saveToStorage();
    }
  }

  function scrollPaperHistory(deltaLines) {
    const state = Lumen.state;
    const maxScrollBack = Math.max(0, state.currentLineIndex);
    const nextOffset = Math.max(
      -2,
      Math.min(maxScrollBack, state.paperScrollOffsetLines + deltaLines)
    );
    if (Math.abs(nextOffset - state.paperScrollOffsetLines) > 0.05) {
      state.paperScrollOffsetLines = nextOffset;
      if (Lumen.audio) Lumen.audio.playPaperScrollRustle();
      updateTargetCoordinates(false);
    }
  }

  function animatePaperChange(callback) {
    if (Lumen.closeAllPopovers) Lumen.closeAllPopovers();
    if (Lumen.audio) Lumen.audio.playCarriageReturn(26);
    flashMarginBellLED();

    const dom = Lumen.dom;
    if (dom.paperSheet) dom.paperSheet.classList.add('paper-ejecting');

    setTimeout(() => {
      callback();
      updateTargetCoordinates(false);
      if (Lumen.renderPaperDOM) Lumen.renderPaperDOM();
      saveToStorage();
    }, 250);

    setTimeout(() => {
      if (dom.paperSheet) dom.paperSheet.classList.remove('paper-ejecting');
    }, 560);
  }

  function getPlainTextManuscript() {
    const state = Lumen.state;
    return state.lines
      .map((l) => l.cells.map((c) => (c ? c.char : ' ')).join('').replace(/\s+$/, ''))
      .join('\n');
  }

  // Export methods
  Lumen.createInkCell = createInkCell;
  Lumen.createEmptyLine = createEmptyLine;
  Lumen.stringToLine = stringToLine;
  Lumen.initDefaultScene = initDefaultScene;
  Lumen.loadFromStorage = loadFromStorage;
  Lumen.saveToStorage = saveToStorage;
  Lumen.getActiveViewportMetrics = getActiveViewportMetrics;
  Lumen.measureLayoutMetrics = measureLayoutMetrics;
  Lumen.updateTargetCoordinates = updateTargetCoordinates;
  Lumen.triggerPhysicalStrikeAnimation = triggerPhysicalStrikeAnimation;
  Lumen.flashMarginBellLED = flashMarginBellLED;
  Lumen.stampCharacter = stampCharacter;
  Lumen.handleAutoWordWrap = handleAutoWordWrap;
  Lumen.performCarriageReturn = performCarriageReturn;
  Lumen.performBackspace = performBackspace;
  Lumen.scrollPaperHistory = scrollPaperHistory;
  Lumen.animatePaperChange = animatePaperChange;
  Lumen.getPlainTextManuscript = getPlainTextManuscript;
})(window.Lumen);


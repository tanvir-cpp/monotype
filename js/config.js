/**
 * LUMEN // Tactile Typewriter
 * Configuration, Themes & Application State
 */
window.Lumen = window.Lumen || {};

(function (Lumen) {
  'use strict';

  Lumen.STORAGE_KEY = 'lumen_tactile_typewriter_state_v3';
  Lumen.INITIAL_REFERENCE_TEXT = 'The rain was heavy, he';

  Lumen.FONTS = [
    "'Courier Prime', monospace",
    "'Special Elite', monospace",
    "'IBM Plex Mono', monospace"
  ];

  Lumen.THEMES = {
    // Light papers: the lamp adds a warm glow that fades INTO the paper colour
    // (no grey smudge), and a gentle edge shade makes the lit area read.
    white: {
      name: 'Bright White',
      light: true,
      paperBase: '#f6f4ee',
      vignetteEdge: 'rgba(125, 112, 90, 0.34)',
      inkColor: '#1b1a18',
      coneCore: [255, 245, 214],
      coneMid: [253, 242, 210],
      coneOuter: [247, 240, 224]
    },
    cream: {
      name: 'Warm Cream',
      light: true,
      paperBase: '#efe7d3',
      vignetteEdge: 'rgba(120, 100, 70, 0.36)',
      inkColor: '#1f1a14',
      coneCore: [255, 246, 218],
      coneMid: [251, 238, 202],
      coneOuter: [242, 232, 208]
    },
    // Dark papers: raised base brightness so ink stays legible outside the cone
    standard: {
      name: 'Fibrous Taupe',
      paperBase: '#847f75',
      vignetteEdge: 'rgba(52, 48, 43, 0.50)',
      inkColor: '#161513',
      coneCore: [250, 232, 192],
      coneMid: [226, 205, 160],
      coneOuter: [170, 158, 135]
    },
    dark: {
      name: 'Dim Study',
      paperBase: '#4a453d',
      vignetteEdge: 'rgba(14, 13, 11, 0.58)',
      inkColor: '#12110f',
      coneCore: [248, 226, 182],
      coneMid: [206, 184, 142],
      coneOuter: [130, 118, 98]
    }
  };

  Lumen.state = {
    lines: [],
    currentLineIndex: 0,
    cursorCol: 0,

    // Flat 2D layout metrics (20px desktop, 16px mobile, rail at 76vh)
    maxCols: 54,
    charWidth: 12.0,
    lineHeight: 34,
    railYRatio: 0.76,
    railY: window.innerHeight * 0.76,
    leftMarginPx: 0,

    // Smooth damped lerp for sliding pill carriage & vertical paper feed
    targetCarriageX: window.innerWidth * 0.5,
    currentCarriageX: window.innerWidth * 0.5,
    paperScrollOffsetLines: 0,
    targetPaperY: 0,
    currentPaperY: 0,
    strikeKick: 0,

    // Calibrated ~112-degree V-cone lamp settings (25% to 120%)
    themeKey: 'white',
    lampIntensity: 0.85,
    coneSpreadDeg: 112,
    fontScale: 1,
    lineSpacing: 1,
    fontPx: 20,
    fontFamily: "'Courier Prime', monospace",

    // Audio & Mechanics settings
    mechSoundEnabled: true,
    mechVolume: 0.8,
    rainEnabled: false,
    rainVolume: 0.4,
    correctionMode: 'ribbon',
    isTouchDevice: false
  };

  Lumen.dom = {};

  Lumen.initDom = function () {
    Lumen.dom = {
      stage: document.getElementById('viewport-stage'),
      paperBackdrop: document.getElementById('paper-backdrop'),
      spotlightCanvas: document.getElementById('spotlight-canvas'),
      paperClipRegion: document.getElementById('paper-clip-region'),
      paperSheet: document.getElementById('paper-sheet'),
      linesContainer: document.getElementById('lines-container'),
      collarLeft: document.getElementById('collar-left'),
      collarRight: document.getElementById('collar-right'),
      pillCarriage: document.getElementById('pill-carriage'),
      pillBody: document.getElementById('pill-body'),
      amberSlot: document.getElementById('amber-slot'),
      strikerPin: document.getElementById('striker-pin'),
      strikeSpark: document.getElementById('strike-spark'),
      led1: document.getElementById('led-1'),
      led2: document.getElementById('led-2'),
      led3: document.getElementById('led-3'),
      hiddenInput: document.getElementById('hidden-typewriter-input'),
      hud: document.getElementById('minimal-hud'),
      touchPrompt: document.getElementById('touch-prompt'),
      statsCounter: document.getElementById('stats-counter'),
      toastBox: document.getElementById('toast-box'),

      // Top-right discreet controls
      quickKbdBtn: document.getElementById('quick-kbd-btn'),
      btnSettings: document.getElementById('btn-settings'),
      popoverSettings: document.getElementById('popover-settings'),
      sliderIntensity: document.getElementById('slider-intensity'),
      valIntensity: document.getElementById('val-intensity'),
      quickAudioBtn: document.getElementById('quick-audio-btn'),
      quickRainBtn: document.getElementById('quick-rain-btn'),
      modeRibbon: document.getElementById('mode-ribbon'),
      modeOverstrike: document.getElementById('mode-overstrike'),
      actionResetScene: document.getElementById('action-reset-scene'),
      actionNewSheet: document.getElementById('action-new-sheet'),
      actionExportPngPage: document.getElementById('action-export-png-page'),
      actionExportPng: document.getElementById('action-export-png'),
      actionExportTxt: document.getElementById('action-export-txt'),
      sliderKeyVol: document.getElementById('slider-keyvol'),
      valKeyVol: document.getElementById('val-keyvol'),
      sliderRainVol: document.getElementById('slider-rainvol'),
      valRainVol: document.getElementById('val-rainvol'),
      metaThemeColor: document.getElementById('meta-theme-color'),
      actionCopyText: document.getElementById('action-copy-text')
    };

    if (Lumen.dom.spotlightCanvas) {
      Lumen.ctx = Lumen.dom.spotlightCanvas.getContext('2d');
    }
  };
})(window.Lumen);


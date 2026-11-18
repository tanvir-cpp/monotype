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
    white: {
      name: 'Bright White',
      paperBase: '#f6f4ee',
      vignetteEdge: 'rgba(120, 112, 98, 0.30)',
      inkColor: '#1b1a18',
      // Soft warm lamp glow that brightens (not muddies) white paper
      coneCore: [255, 250, 232],
      coneMid: [250, 240, 212],
      coneOuter: [232, 222, 198]
    },
    standard: {
      name: 'Fibrous Taupe',
      paperBase: '#5c5852',
      vignetteEdge: 'rgba(54, 51, 47, 0.58)',
      inkColor: '#161513',
      // Warm cream-parchment (#f4dfb6) -> warm sand (#ccb790) -> muted taupe (#8a7f6d)
      coneCore: [244, 223, 182],
      coneMid: [204, 183, 144],
      coneOuter: [138, 127, 109]
    },
    dark: {
      name: 'Dim Study',
      paperBase: '#2b2926',
      vignetteEdge: 'rgba(18, 17, 15, 0.72)',
      inkColor: '#141311',
      coneCore: [240, 216, 172],
      coneMid: [188, 166, 128],
      coneOuter: [108, 98, 84]
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
      actionExportTxt: document.getElementById('action-export-txt'),
      actionCopyText: document.getElementById('action-copy-text')
    };

    if (Lumen.dom.spotlightCanvas) {
      Lumen.ctx = Lumen.dom.spotlightCanvas.getContext('2d');
    }
  };
})(window.Lumen);


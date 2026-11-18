/**
 * LUMEN // Tactile Typewriter
 * Procedural Paper Texture, Volumetric Lighting Shader & DOM Ink Rendering
 */
window.Lumen = window.Lumen || {};

(function (Lumen) {
  'use strict';

  let paperFiberPattern = null;

  // -------------------------------------------------------------------------
  // High-DPI Tileable Fibrous Cotton Paper Pattern Generator
  // -------------------------------------------------------------------------
  function buildFibrousPaperPattern() {
    const ctx = Lumen.ctx;
    if (!ctx) return;

    const tileSize = 320;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = tileSize;
    offCanvas.height = tileSize;
    const octx = offCanvas.getContext('2d');

    // 1. Fine tactile paper tooth (subtle light & dark mineral micro-grain)
    const imgData = octx.createImageData(tileSize, tileSize);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = Math.random();
      if (n > 0.56) {
        data[i] = 255;
        data[i + 1] = 248;
        data[i + 2] = 235;
        data[i + 3] = Math.floor((n - 0.56) * 28);
      } else if (n < 0.44) {
        data[i] = 20;
        data[i + 1] = 18;
        data[i + 2] = 15;
        data[i + 3] = Math.floor((0.44 - n) * 32);
      }
    }
    octx.putImageData(imgData, 0, 0);

    // 2. Organic cotton fibers (curved micro-filaments wrapped seamlessly across tile edges)
    octx.lineCap = 'round';
    for (let i = 0; i < 165; i++) {
      const x = Math.random() * tileSize;
      const y = Math.random() * tileSize;
      const len = 6 + Math.random() * 18;
      const angle = Math.random() * Math.PI * 2;
      const bend = (Math.random() - 0.5) * 8;
      const isDarkFiber = Math.random() < 0.68;

      const cx = x + Math.cos(angle) * (len * 0.5) - Math.sin(angle) * bend;
      const cy = y + Math.sin(angle) * (len * 0.5) + Math.cos(angle) * bend;
      const ex = x + Math.cos(angle) * len;
      const ey = y + Math.sin(angle) * len;

      octx.strokeStyle = isDarkFiber
        ? `rgba(26, 23, 19, ${(0.07 + Math.random() * 0.11).toFixed(2)})`
        : `rgba(255, 248, 232, ${(0.06 + Math.random() * 0.08).toFixed(2)})`;
      octx.lineWidth = 0.45 + Math.random() * 0.65;

      // Draw wrapped across edges so tiling is completely seamless
      for (let ox = -tileSize; ox <= tileSize; ox += tileSize) {
        for (let oy = -tileSize; oy <= tileSize; oy += tileSize) {
          octx.beginPath();
          octx.moveTo(x + ox, y + oy);
          octx.quadraticCurveTo(cx + ox, cy + oy, ex + ox, ey + oy);
          octx.stroke();
        }
      }
    }

    // 3. Tiny natural dark flecks & organic botanical specks (matching reference paper)
    for (let i = 0; i < 85; i++) {
      const fx = Math.random() * tileSize;
      const fy = Math.random() * tileSize;
      const r = 0.45 + Math.random() * 1.15;
      octx.fillStyle = `rgba(24, 21, 17, ${(0.14 + Math.random() * 0.22).toFixed(2)})`;
      octx.beginPath();
      octx.ellipse(fx, fy, r, r * (0.6 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
      octx.fill();
    }

    paperFiberPattern = ctx.createPattern(offCanvas, 'repeat');
    Lumen.paperFiberPattern = paperFiberPattern;
  }

  // -------------------------------------------------------------------------
  // Crisp Carbon-Black Ink Layer Rendering (Above Spotlight Canvas)
  // -------------------------------------------------------------------------
  function renderPaperDOM() {
    const dom = Lumen.dom;
    const state = Lumen.state;
    const vw = window.innerWidth;
    const isMobile = vw < 640;
    const fontSize = `${state.fontPx || (isMobile ? 16 : 20)}px`;

    if (!dom.linesContainer) return;
    dom.linesContainer.innerHTML = '';
    dom.linesContainer.style.paddingLeft = `${state.leftMarginPx}px`;
    // Position active typing baseline directly above the T-striker hammer head
    dom.linesContainer.style.bottom = isMobile ? '48px' : '60px';

    // Only render lines that can possibly be on screen (keeps long documents fast)
    const visibleRows = Math.ceil(state.railY / state.lineHeight) + 3;
    const scrolledBack = Math.max(0, Math.ceil(state.paperScrollOffsetLines));
    const firstLine = Math.max(0, state.currentLineIndex - visibleRows - scrolledBack);
    const frag = document.createDocumentFragment();

    state.lines.forEach((lineObj, lineIdx) => {
      if (lineIdx > state.currentLineIndex || lineIdx < firstLine) return;

      const rowEl = document.createElement('div');
      rowEl.className = 'typewriter-text whitespace-pre relative';
      rowEl.style.height = `${state.lineHeight}px`;
      rowEl.style.lineHeight = `${state.lineHeight}px`;
      rowEl.style.fontSize = fontSize;

      lineObj.cells.forEach((cell) => {
        if (!cell) return;
        const span = document.createElement('span');
        span.className = 'char-cell';
        if (cell.fresh) {
          span.classList.add('char-fresh');
          cell.fresh = false;
        }
        span.style.width = `${state.charWidth}px`;
        span.style.opacity = cell.opacity;
        span.style.transform = `translate(${cell.dx}px, ${cell.dy}px) rotate(${cell.rot}deg)`;
        if (cell.bleed) {
          span.style.textShadow = `0 0 ${cell.bleed}px rgba(27, 26, 24, ${Math.min(0.6, cell.bleed * 0.6).toFixed(2)})`;
        }
        span.textContent = cell.char || ' ';

        if (cell.overstrikes && cell.overstrikes.length > 0) {
          cell.overstrikes.forEach((over) => {
            const overSpan = document.createElement('span');
            overSpan.className = 'overstrike-layer';
            overSpan.style.opacity = over.opacity || 0.92;
            overSpan.style.transform = `translate(${over.dx || 0}px, ${over.dy || 0}px) rotate(${over.rot || 0}deg)`;
            overSpan.textContent = over.char;
            span.appendChild(overSpan);
          });
        }

        rowEl.appendChild(span);
      });

      frag.appendChild(rowEl);
    });
    dom.linesContainer.appendChild(frag);

    updateStatsHUD();
  }

  function updateStatsHUD() {
    const dom = Lumen.dom;
    const state = Lumen.state;
    const fullText = state.lines
      .map((l) => l.cells.map((c) => (c ? c.char : ' ')).join(''))
      .join('\n')
      .trim();

    const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;
    if (dom.statsCounter) {
      dom.statsCounter.textContent = `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`;
    }
  }

  // -------------------------------------------------------------------------
  // Calibrated ~112-Degree Warm V-Cone Lighting & Fibrous Paper Texture
  // -------------------------------------------------------------------------
  // Paints vignette + warm lamp cone. Shared by the live canvas and the PNG export.
  // o: { vw, vh, railY, originX, vigX, theme, intensity, isMobile, coneSpreadDeg }
  function paintSpotlight(ctx, o) {
    const { vw, vh, railY, originX, vigX, theme, intensity, isMobile, coneSpreadDeg } = o;

    // 1. Peripheral shade pooled around the lamp so lit/unlit areas stay balanced
    const edgeGrad = ctx.createRadialGradient(vigX, vh * 0.45, vh * 0.22, vigX, vh * 0.45, Math.max(vw, vh) * 0.8);
    edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    edgeGrad.addColorStop(1, theme.vignetteEdge);
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, vw, vh);

    // Light originates strictly from the top amber light slot of the pill carriage
    const emitterY = railY - (isMobile ? 16 : 20);

    if (intensity > 0.02) {
      const [cr, cg, cb] = theme.coneCore;
      const [mr, mg, mb] = theme.coneMid;
      const [or, og, ob] = theme.coneOuter;

      // 2. Broad warm V-shaped spotlight cone projecting upward
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, vw, emitterY + 4);
      ctx.clip();

      const radiusScale = 0.72 + intensity * 0.36;
      const coneHeight = Math.max(vh * 0.72, 360) * radiusScale;
      const halfAngleRad = ((coneSpreadDeg / 2) * Math.PI) / 180;
      const topHalfWidth = Math.tan(halfAngleRad) * coneHeight;
      const slotHalfW = isMobile ? 9 : 11;

      ctx.beginPath();
      ctx.moveTo(originX - slotHalfW, emitterY + 2);
      ctx.lineTo(originX - topHalfWidth, emitterY - coneHeight);
      ctx.lineTo(originX + topHalfWidth, emitterY - coneHeight);
      ctx.lineTo(originX + slotHalfW, emitterY + 2);
      ctx.closePath();

      ctx.filter = 'blur(16px)';

      const coneGrad = ctx.createRadialGradient(
        originX, emitterY - 4, 4,
        originX, emitterY - coneHeight * 0.25, coneHeight * 0.88
      );

      const coreAlpha = Math.min(0.96, 0.24 + intensity * 0.74);
      const midAlpha = Math.min(0.84, 0.16 + intensity * 0.64);
      const outerAlpha = Math.min(0.52, intensity * 0.44);

      coneGrad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${coreAlpha})`);
      coneGrad.addColorStop(0.28, `rgba(${mr}, ${mg}, ${mb}, ${midAlpha})`);
      coneGrad.addColorStop(0.62, `rgba(${or}, ${og}, ${ob}, ${outerAlpha})`);
      coneGrad.addColorStop(1, `rgba(${or}, ${og}, ${ob}, 0)`);

      ctx.fillStyle = coneGrad;
      ctx.fill();
      ctx.restore();

      // 3. Soft shadow cast by the T-striker stem onto the lit paper
      ctx.save();
      ctx.filter = 'blur(3.5px)';
      const sh = isMobile ? 26 : 32;
      const stemShadowGrad = ctx.createLinearGradient(0, emitterY, 0, emitterY - sh);
      stemShadowGrad.addColorStop(0, `rgba(38, 34, 28, ${0.26 * Math.min(1, intensity)})`);
      stemShadowGrad.addColorStop(1, 'rgba(38, 34, 28, 0)');
      ctx.fillStyle = stemShadowGrad;
      ctx.fillRect(originX - 2.5, emitterY - sh, 5, sh);
      ctx.restore();
    }
  }

  function renderVolumetricSpotlight() {
    const ctx = Lumen.ctx;
    if (!ctx) return;

    const state = Lumen.state;
    const dom = Lumen.dom;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640;
    const theme = Lumen.THEMES[state.themeKey] || Lumen.THEMES.white;

    // Scale top amber slot bloom subtly with Lamp Brightness
    if (dom.amberSlot) {
      dom.amberSlot.style.opacity = Math.max(0.35, Math.min(1, 0.35 + state.lampIntensity * 0.65)).toFixed(2);
    }

    // Skip the expensive repaint when nothing visible has changed
    const sig = [vw, vh, state.railY, state.currentCarriageX.toFixed(1), state.lampIntensity,
      state.themeKey, state.coneSpreadDeg, !!paperFiberPattern].join('|');
    if (sig === Lumen.lastSpotlightSig && !Lumen.spotlightDirty) return;
    Lumen.lastSpotlightSig = sig;
    Lumen.spotlightDirty = false;

    ctx.clearRect(0, 0, vw, vh);
    paintSpotlight(ctx, {
      vw, vh, railY: state.railY, originX: state.currentCarriageX,
      vigX: state.currentCarriageX * 0.6 + vw * 0.2,
      theme, intensity: state.lampIntensity, isMobile, coneSpreadDeg: state.coneSpreadDeg
    });

    // Composite organic cotton fibers, tiny natural flecks & paper tooth across the sheet
    if (paperFiberPattern) {
      ctx.save();
      ctx.globalAlpha = theme.light ? 0.55 : 0.88;
      ctx.fillStyle = paperFiberPattern;
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();
    }
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Draws the rail, margin collars and the pill carriage with striker for PNG export
  function drawTypewriterMachine(ctx, o) {
    const { width, height, railY, originX, padX, cw, state } = o;

    // Platen shade below the rail
    const below = ctx.createLinearGradient(0, railY, 0, height);
    below.addColorStop(0, 'rgba(10,10,12,0.22)');
    below.addColorStop(0.2, 'rgba(10,10,12,0.05)');
    below.addColorStop(1, 'rgba(8,8,10,0.08)');
    ctx.fillStyle = below;
    ctx.fillRect(0, railY, width, height - railY);

    // Rail
    ctx.save();
    ctx.shadowColor = 'rgba(10,10,12,0.45)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 5;
    const rail = ctx.createLinearGradient(0, railY - 11, 0, railY + 11);
    [[0, '#111215'], [0.14, '#222429'], [0.32, '#3f434a'], [0.46, '#35383f'],
     [0.64, '#292c31'], [0.86, '#18191d'], [1, '#0c0d0f']].forEach(([p, c]) => rail.addColorStop(p, c));
    ctx.fillStyle = rail;
    ctx.fillRect(0, railY - 11, width, 22);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, railY - 11, width, 1);

    // Margin collars
    const collar = (x) => {
      const g = ctx.createLinearGradient(0, railY - 14, 0, railY + 14);
      g.addColorStop(0, '#141518'); g.addColorStop(0.28, '#2b2d32');
      g.addColorStop(0.62, '#1e2024'); g.addColorStop(1, '#101114');
      ctx.save();
      ctx.shadowColor = 'rgba(8,8,10,0.55)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = g;
      roundRectPath(ctx, x, railY - 14, 16, 28, 4);
      ctx.fill();
      ctx.restore();
    };
    collar(padX - 20);
    collar(padX + state.maxCols * cw + 4);

    // T-striker (shaft + head) above the pill
    ctx.fillStyle = '#2a2c31';
    ctx.fillRect(originX - 1.5, railY - 46, 3, 26);
    ctx.fillStyle = '#383b42';
    roundRectPath(ctx, originX - 11, railY - 50, 22, 6, 2);
    ctx.fill();

    // Pill body
    ctx.save();
    ctx.shadowColor = 'rgba(8,8,10,0.58)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    const pill = ctx.createLinearGradient(0, railY - 22, 0, railY + 22);
    pill.addColorStop(0, '#484744'); pill.addColorStop(0.5, '#3a3937'); pill.addColorStop(1, '#2d2c2a');
    ctx.fillStyle = pill;
    roundRectPath(ctx, originX - 57, railY - 22, 114, 44, 22);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(22,21,20,0.85)';
    ctx.lineWidth = 1;
    roundRectPath(ctx, originX - 57, railY - 22, 114, 44, 22);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(originX - 40, railY - 21, 80, 1);

    // Amber lamp slot with glow
    ctx.save();
    ctx.shadowColor = 'rgba(255,184,64,0.9)';
    ctx.shadowBlur = 8;
    const amber = ctx.createLinearGradient(0, railY - 20, 0, railY - 15);
    amber.addColorStop(0, '#ffd27a'); amber.addColorStop(1, '#f59e0b');
    ctx.fillStyle = amber;
    roundRectPath(ctx, originX - 12, railY - 20, 24, 5, 2.5);
    ctx.fill();
    ctx.restore();

    // Status LEDs
    [[-27, '#5ee06a'], [-13, '#f5a524'], [1, '#17181a']].forEach(([dx, c], i) => {
      ctx.save();
      if (i < 2) { ctx.shadowColor = c; ctx.shadowBlur = 5; }
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(originX + dx, railY + 1, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // -------------------------------------------------------------------------
  // PNG Export: draws the full page (not just the visible part) onto a canvas
  // -------------------------------------------------------------------------
  function exportPagePNG(opts) {
    const machine = !opts || opts.machine !== false;
    const state = Lumen.state;
    const theme = Lumen.THEMES[state.themeKey] || Lumen.THEMES.white;

    // Drop trailing blank lines
    const lines = state.lines.slice();
    const isBlank = (l) => l.cells.every((c) => !c || !c.char || !c.char.trim());
    while (lines.length > 1 && isBlank(lines[lines.length - 1])) lines.pop();
    if (lines.length === 1 && isBlank(lines[0])) return Promise.resolve(null);

    const scale = 2;
    const fontPx = state.fontPx || 20;
    const cw = state.charWidth;
    const lh = state.lineHeight;
    const padX = Math.round(cw * 6);
    const padY = machine ? Math.round(lh * 2) : Math.round(lh * 2.5);
    const widest = Math.max(state.maxCols, ...lines.map((l) => l.cells.length));
    const width = Math.max(machine ? 640 : 0, Math.round(widest * cw + padX * 2));
    const railY = padY + lines.length * lh + 56;      // typing baseline sits just above the rail
    const height = machine ? railY + 110 : Math.round(lines.length * lh + padY * 2);

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    ctx.fillStyle = theme.paperBase;
    ctx.fillRect(0, 0, width, height);

    const col = Math.min(state.cursorCol, state.maxCols);
    const originX = Math.max(30, Math.min(width - 30, padX + col * cw + cw / 2));
    if (machine) {
      paintSpotlight(ctx, {
        vw: width, vh: height, railY, originX,
        vigX: originX * 0.6 + width * 0.2,
        theme, intensity: state.lampIntensity, isMobile: false, coneSpreadDeg: state.coneSpreadDeg
      });
    }
    if (Lumen.paperFiberPattern) {
      ctx.save();
      ctx.globalAlpha = theme.light ? 0.55 : 0.88;
      ctx.fillStyle = Lumen.paperFiberPattern;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    const draw = () => {
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.font = `${fontPx}px ${state.fontFamily}`;
      const ink = theme.inkColor;

      const drawGlyph = (ch, x, y, c) => {
        ctx.save();
        ctx.translate(x + cw / 2, y);
        ctx.rotate(((c.rot || 0) * Math.PI) / 180);
        ctx.globalAlpha = c.opacity == null ? 0.92 : c.opacity;
        ctx.fillStyle = ink;
        if (c.bleed) {
          ctx.shadowColor = ink;
          ctx.shadowBlur = c.bleed * scale;
        }
        ctx.textAlign = 'center';
        ctx.fillText(ch, c.dx || 0, c.dy || 0);
        ctx.restore();
      };

      lines.forEach((line, row) => {
        const baseY = padY + row * lh + lh * 0.72;
        line.cells.forEach((cell, col) => {
          if (!cell || !cell.char || cell.char === ' ') return;
          const x = padX + col * cw;
          drawGlyph(cell.char, x, baseY, cell);
          (cell.overstrikes || []).forEach((o) => drawGlyph(o.char, x, baseY, o));
        });
      });

      if (machine) drawTypewriterMachine(ctx, { width, height, railY, originX, padX, cw, state });

      return new Promise((resolve) => {
        const fallback = () => {
          try {
            const bin = atob(canvas.toDataURL('image/png').split(',')[1]);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            resolve(new Blob([bytes], { type: 'image/png' }));
          } catch (e) { resolve(null); }
        };
        try {
          canvas.toBlob((b) => (b ? resolve(b) : fallback()), 'image/png');
        } catch (e) { fallback(); }
      });
    };

    // Wait for the web font, but never hang the export if it is slow or blocked
    const fontReady = document.fonts && document.fonts.load
      ? document.fonts.load(`${fontPx}px ${state.fontFamily}`).catch(() => {})
      : Promise.resolve();
    const timeout = new Promise((resolve) => setTimeout(resolve, 1200));
    return Promise.race([fontReady, timeout]).then(draw);
  }

  Lumen.exportPagePNG = exportPagePNG;
  Lumen.buildFibrousPaperPattern = buildFibrousPaperPattern;
  Lumen.renderPaperDOM = renderPaperDOM;
  Lumen.updateStatsHUD = updateStatsHUD;
  Lumen.renderVolumetricSpotlight = renderVolumetricSpotlight;
})(window.Lumen);

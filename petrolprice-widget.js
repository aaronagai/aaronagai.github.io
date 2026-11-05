(function () {
  var widget = document.getElementById('pp-widget');
  var panel = document.getElementById('pp-panel');
  var pill = document.querySelector('.pp-tabs-pill');
  var tabs = document.querySelectorAll('.pp-tab');
  var detailStage = document.getElementById('pp-detail-stage');
  var detailSheet = document.getElementById('pp-home-detail-sheet');
  if (!widget || !panel || !tabs.length) return;

  var DATA = {
    petrol: [
      { iso: 'SG', name: 'Singapore', sub: 'Caltex · Regular', price: '3.37 SGD', pct: 0 },
      { iso: 'US', name: 'United States', sub: 'California · Regular', price: '1.10 USD', pct: 2.1 },
      { iso: 'GB', name: 'United Kingdom', sub: 'National · Regular', price: '1.62 GBP', pct: 0 },
      { iso: 'DE', name: 'Germany', sub: 'National · Regular', price: '2.24 EUR', pct: -0.4 },
      { iso: 'JP', name: 'Japan', sub: 'National · Premium', price: '169.90 JPY', pct: null },
      { iso: 'IN', name: 'India', sub: 'Delhi · Premium', price: '107.73 INR', pct: null },
      { iso: 'AU', name: 'Australia', sub: 'NSW · Regular', price: '2.02 AUD', pct: 0.3 }
    ],
    diesel: [
      { iso: 'SG', name: 'Singapore', sub: 'Caltex · Diesel', price: '3.95 SGD', pct: 0.5 },
      { iso: 'US', name: 'United States', sub: 'California · Diesel', price: '1.25 USD', pct: 1.8 },
      { iso: 'GB', name: 'United Kingdom', sub: 'National · Diesel', price: '1.78 GBP', pct: 0 },
      { iso: 'DE', name: 'Germany', sub: 'National · Diesel', price: '2.05 EUR', pct: -0.2 },
      { iso: 'JP', name: 'Japan', sub: 'National · Diesel', price: '155.20 JPY', pct: null },
      { iso: 'IN', name: 'India', sub: 'Delhi · Diesel', price: '96.50 INR', pct: null },
      { iso: 'AU', name: 'Australia', sub: 'NSW · Diesel', price: '2.18 AUD', pct: 0.1 }
    ],
    electricity: [
      { iso: 'SG', name: 'Singapore', sub: 'SP Group · Household', price: '0.2912 SGD', pct: 0 },
      { iso: 'US', name: 'United States', sub: 'EIA · Household', price: '0.1689 USD', pct: 0.6 },
      { iso: 'GB', name: 'United Kingdom', sub: 'Ofgem · Household', price: '0.2776 GBP', pct: -0.3 },
      { iso: 'DE', name: 'Germany', sub: 'Bundesnetzagentur · Household', price: '0.3715 EUR', pct: 0 },
      { iso: 'JP', name: 'Japan', sub: 'EGC · Household', price: '36.65 JPY', pct: null },
      { iso: 'IN', name: 'India', sub: 'CERC · Household', price: '7.50 INR', pct: null },
      { iso: 'AU', name: 'Australia', sub: 'AER · Household', price: '0.3245 AUD', pct: 0.2 }
    ]
  };

  var tab = 'petrol';
  var selectedIso = '';
  var hasPainted = false;
  var rowCacheByTab = Object.create(null);
  var DIGIT_DUR_MS = 340;

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function formatPct(pct) {
    if (pct == null || !Number.isFinite(pct)) return null;
    var abs = Math.abs(pct);
    if (abs < 0.05) return { text: '0.0%', cls: 'is-flat' };
    var sign = pct > 0 ? '+' : '−';
    return { text: sign + abs.toFixed(1) + '%', cls: pct < 0 ? 'is-down' : 'is-up' };
  }

  function parseQuoteNum(str) {
    var s = String(str == null ? '' : str).replace(/[−–]/g, '-').replace(/[^0-9.-]/g, '');
    var n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  function digitGroup(str, animate) {
    var group = document.createElement('span');
    group.className = 't-digit-group';
    applyDigits(group, str, animate);
    return group;
  }

  function applyDigits(el, nextText, animate) {
    if (!el) return;
    var text = String(nextText == null ? '' : nextText);
    var prev = el._ppxDigitTargetText != null ? String(el._ppxDigitTargetText) : String(el.textContent || '');
    var render = window.ppxRenderDigitSpans;
    var cancel = window.ppxCancelDigitFinalize;
    if (typeof cancel === 'function') cancel(el);
    if (!animate || reduceMotion() || prev === text || typeof render !== 'function') {
      el.classList.remove('is-animating');
      el.classList.add('t-digit-group');
      el.style.removeProperty('--digit-dur');
      el.textContent = text;
      el._ppxDigitTargetText = text;
      return;
    }
    var prevNum = parseQuoteNum(prev);
    var curNum = parseQuoteNum(text);
    var dirY = Number.isFinite(prevNum) && Number.isFinite(curNum) && curNum < prevNum ? -1 : 1;
    el.classList.add('t-digit-group', 'is-animating');
    el.style.setProperty('--digit-dur', DIGIT_DUR_MS + 'ms');
    render(el, prev, text, { dirY: dirY, blurPx: 2, durationMs: DIGIT_DUR_MS });
  }

  function applyPct(el, pctVal, animate) {
    var pct = formatPct(pctVal);
    var group = el.querySelector('.t-digit-group');
    el.hidden = false;
    if (!pct) {
      el.className = 'pp-pct is-empty is-flat';
      el.setAttribute('aria-hidden', 'true');
      applyDigits(group, '0.0%', false);
      return;
    }
    el.removeAttribute('aria-hidden');
    el.className = 'pp-pct ' + pct.cls;
    applyDigits(group, pct.text, animate);
  }

  function rowEl(item, animate) {
    var a = document.createElement('a');
    a.className = 'pp-row';
    a.setAttribute('data-iso', item.iso);
    a.href = '#';
    var flag = document.createElement('span');
    flag.className = 'pp-flag';
    flag.setAttribute('aria-hidden', 'true');
    var fi = document.createElement('span');
    fi.className = 'fi fi-' + item.iso.toLowerCase() + ' fis';
    flag.appendChild(fi);
    var meta = document.createElement('span');
    meta.className = 'pp-meta';
    var name = document.createElement('strong');
    name.textContent = item.name;
    var sub = document.createElement('small');
    sub.textContent = item.sub;
    meta.appendChild(name);
    meta.appendChild(sub);
    var quote = document.createElement('span');
    quote.className = 'pp-quote';
    var px = document.createElement('strong');
    px.className = 'pp-price';
    px.appendChild(digitGroup(item.price, animate));
    quote.appendChild(px);
    var ch = document.createElement('span');
    ch.className = 'pp-pct';
    ch.appendChild(digitGroup('', false));
    quote.appendChild(ch);
    applyPct(ch, item.pct, animate);
    a.appendChild(flag);
    a.appendChild(meta);
    a.appendChild(quote);
    return a;
  }

  function applyRow(a, item, animate) {
    a.setAttribute('data-iso', item.iso);
    var name = a.querySelector('.pp-meta strong');
    var sub = a.querySelector('.pp-meta small');
    if (name && name.textContent !== item.name) name.textContent = item.name;
    if (sub) sub.textContent = item.sub;
    applyDigits(a.querySelector('.pp-price .t-digit-group'), item.price, animate);
    applyPct(a.querySelector('.pp-pct'), item.pct, animate);
  }

  function movePill(tabEl, animate) {
    if (!pill || !tabEl) return;
    if (!animate || reduceMotion()) {
      var prev = pill.style.transition;
      pill.style.transition = 'none';
      pill.style.transform = 'translateX(' + tabEl.offsetLeft + 'px)';
      pill.style.width = tabEl.offsetWidth + 'px';
      void pill.offsetWidth;
      pill.style.transition = prev;
      return;
    }
    pill.style.transform = 'translateX(' + tabEl.offsetLeft + 'px)';
    pill.style.width = tabEl.offsetWidth + 'px';
  }

  function rowsFor(kind) {
    return DATA[kind] || [];
  }

  function paint() {
    var rows = rowsFor(tab);
    var cache = Object.create(null);
    for (var c = 0; c < rows.length; c++) cache[rows[c].iso] = rows[c];
    rowCacheByTab[tab] = cache;
    window.__ltHowRowsByTab = window.__ltHowRowsByTab || Object.create(null);
    window.__ltHowRowsByTab[tab] = cache;
    var animate = hasPainted && !reduceMotion();
    var existing = panel.querySelectorAll('.pp-row[data-iso]');
    if (existing.length === rows.length) {
      for (var i = 0; i < rows.length; i++) {
        var row = panel.querySelector('.pp-row[data-iso="' + rows[i].iso + '"]');
        if (row) applyRow(row, rows[i], animate);
      }
    } else {
      var frag = document.createDocumentFragment();
      for (var j = 0; j < rows.length; j++) frag.appendChild(rowEl(rows[j], false));
      panel.replaceChildren(frag);
    }
    applyFixedWidgetHeight();
    hasPainted = true;
    if (selectedIso && cache[selectedIso]) {
      setRowSelection(selectedIso);
      if (isDetailView()) emitActiveMarket(selectedIso, 'how-widget-refresh');
    }
  }

  function selectTab(next, animatePill) {
    tab = next;
    var active = null;
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].getAttribute('data-tab') === next;
      tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) active = tabs[i];
    }
    if (active) movePill(active, animatePill !== false);
    paint();
  }

  function setRowSelection(iso) {
    var rows = panel.querySelectorAll('.pp-row[data-iso]');
    for (var i = 0; i < rows.length; i++) {
      var isActive = rows[i].getAttribute('data-iso') === iso;
      rows[i].classList.toggle('is-active', isActive);
      if (isActive) rows[i].setAttribute('aria-current', 'true');
      else rows[i].removeAttribute('aria-current');
    }
  }

  function isDetailView() {
    return widget.classList.contains('is-detail');
  }

  var morphBusy = false;
  var morphTimers = [];
  var flipLayer = null;
  var morphGen = 0;

  function clearMorphTimers() {
    for (var i = 0; i < morphTimers.length; i++) clearTimeout(morphTimers[i]);
    morphTimers = [];
  }

  function later(ms, fn) {
    var id = setTimeout(fn, ms);
    morphTimers.push(id);
    return id;
  }

  function bumpMorphGen() {
    morphGen += 1;
    return morphGen;
  }

  function rectOf(el) {
    return el ? el.getBoundingClientRect() : null;
  }

  function clearFlipLayer() {
    if (flipLayer && flipLayer.parentNode) flipLayer.parentNode.removeChild(flipLayer);
    flipLayer = null;
  }

  function clearMorphClasses() {
    widget.classList.remove('is-morphing', 'is-morphing-close', 'is-list-in');
    widget.style.transition = '';
  }

  function applyFixedWidgetHeight() {
    if (!widget || widget.dataset.fixedH) return;
    var wasDetail = widget.classList.contains('is-detail');
    var wasHidden = detailStage ? detailStage.hidden : true;
    if (wasDetail) {
      widget.classList.remove('is-detail');
      widget.classList.add('is-list');
      if (detailStage) detailStage.hidden = true;
    }
    widget.style.height = '';
    var listH = Math.ceil(widget.offsetHeight);
    if (wasDetail) {
      widget.classList.remove('is-list');
      widget.classList.add('is-detail');
      if (detailStage) {
        detailStage.hidden = wasHidden;
        if (!wasHidden) detailStage.style.display = '';
      }
    }
    if (listH > 0) {
      widget.style.height = listH + 'px';
      widget.dataset.fixedH = '1';
    }
  }

  function detailParts() {
    if (!detailSheet) return null;
    return {
      flag: detailSheet.querySelector('.app-home-flag'),
      title: detailSheet.querySelector('.app-home-detail-chart-title'),
      price: detailSheet.querySelector('.app-home-detail-chart-price'),
      sub: detailSheet.querySelector('.app-home-detail-chart-sub'),
      delta: detailSheet.querySelector('.app-home-detail-chart-delta'),
      chart: detailSheet.querySelector('.chart-wrap'),
      tabs: detailSheet.querySelector('.app-home-detail-chart-tabs'),
      forecast: detailSheet.querySelector('.app-home-detail-forecast-toggle'),
      close: detailSheet.querySelector('.app-home-detail-sheet-close')
    };
  }

  function setHeaderHidden(parts, hidden) {
    if (!parts) return;
    [parts.flag, parts.title, parts.price].forEach(function (el) {
      if (!el) return;
      el.classList.toggle('pp-morph-hide', !!hidden);
    });
  }

  function resetStagger(parts) {
    if (!parts) return;
    [parts.sub, parts.delta, parts.chart, parts.tabs, parts.forecast, parts.flag, parts.title, parts.price].forEach(function (el) {
      if (!el) return;
      el.classList.remove('pp-stagger', 'is-in', 'pp-stagger--interactive', 'pp-morph-hide');
      el.style.transitionDelay = '';
    });
  }

  function prepStaggerOut(parts) {
    if (!parts) return;
    [parts.sub, parts.delta, parts.chart, parts.tabs, parts.forecast].forEach(function (el) {
      if (!el) return;
      el.classList.add('pp-stagger', 'is-in');
      el.classList.remove('pp-stagger--interactive');
      el.style.transitionDelay = '';
    });
  }

  function runOpenStagger(parts, gen, done) {
    if (!parts) {
      if (done) done();
      return;
    }
    var groups = [
      { els: [parts.sub, parts.delta], interactive: false },
      { els: [parts.chart], interactive: false },
      { els: [parts.tabs], interactive: true },
      { els: [parts.forecast], interactive: true }
    ];
    groups.forEach(function (g, i) {
      g.els.forEach(function (el) {
        if (!el) return;
        el.classList.add('pp-stagger');
        el.classList.remove('is-in', 'pp-stagger--interactive');
        el.style.transitionDelay = (i * 45) + 'ms';
      });
    });
    void widget.offsetHeight;
    groups.forEach(function (g, i) {
      later(i * 45, function () {
        if (gen !== morphGen) return;
        g.els.forEach(function (el) {
          if (!el) return;
          el.classList.add('is-in');
          if (g.interactive) el.classList.add('pp-stagger--interactive');
        });
      });
    });
    later(45 * 3 + 190, function () {
      if (gen !== morphGen) return;
      groups.forEach(function (g) {
        g.els.forEach(function (el) {
          if (!el) return;
          el.classList.remove('pp-stagger', 'is-in', 'pp-stagger--interactive');
          el.style.transitionDelay = '';
        });
      });
      if (done) done();
    });
  }

  function runCloseStagger(parts, gen, done) {
    if (!parts) {
      if (done) done();
      return;
    }
    prepStaggerOut(parts);
    void widget.offsetHeight;
    var steps = [
      { els: [parts.forecast, parts.tabs], at: 0 },
      { els: [parts.chart], at: 40 },
      { els: [parts.sub, parts.delta, parts.flag, parts.title, parts.price], at: 80 }
    ];
    steps.forEach(function (step) {
      later(step.at, function () {
        if (gen !== morphGen) return;
        step.els.forEach(function (el) {
          if (!el) return;
          el.classList.add('pp-stagger');
          el.classList.remove('is-in', 'pp-stagger--interactive');
        });
      });
    });
    later(200, function () {
      if (gen !== morphGen) return;
      if (done) done();
    });
  }

  function captureRowFirst(row) {
    if (!row) return null;
    var flag = row.querySelector('.pp-flag');
    var name = row.querySelector('.pp-meta strong');
    var price = row.querySelector('.pp-price');
    return {
      flag: rectOf(flag),
      name: rectOf(name),
      price: rectOf(price),
      flagHtml: flag ? flag.innerHTML : '',
      nameText: name ? name.textContent : '',
      priceText: price ? price.textContent : ''
    };
  }

  function captureDetailLast(parts) {
    if (!parts) return null;
    return {
      flag: rectOf(parts.flag),
      name: rectOf(parts.title),
      price: rectOf(parts.price)
    };
  }

  function placeFlipItem(layer, className, html, text, first, last, widgetRect) {
    if (!first || !last || !first.width || !last.width) return null;
    var el = document.createElement('div');
    el.className = 'pp-flip-item ' + className;
    if (html != null) el.innerHTML = html;
    else el.textContent = text || '';
    el.style.left = (last.left - widgetRect.left) + 'px';
    el.style.top = (last.top - widgetRect.top) + 'px';
    el.style.width = last.width + 'px';
    el.style.height = Math.max(last.height, 1) + 'px';
    var dx = first.left - last.left;
    var dy = first.top - last.top;
    var sx = first.width / last.width;
    var sy = first.height / Math.max(last.height, 1);
    if (className.indexOf('flip-flag') === -1) {
      var uni = Math.min(Math.max((sx + sy) / 2, 0.72), 1.35);
      sx = uni;
      sy = uni;
    }
    el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
    layer.appendChild(el);
    return el;
  }

  function runFlip(first, last, gen, onDone) {
    clearFlipLayer();
    if (!first || !last || !widget) {
      if (onDone) onDone();
      return;
    }
    var widgetRect = widget.getBoundingClientRect();
    flipLayer = document.createElement('div');
    flipLayer.className = 'pp-flip-layer';
    flipLayer.setAttribute('aria-hidden', 'true');
    var items = [
      placeFlipItem(flipLayer, 'pp-flip-flag', first.flagHtml, null, first.flag, last.flag, widgetRect),
      placeFlipItem(flipLayer, 'pp-flip-name', null, first.nameText, first.name, last.name, widgetRect),
      placeFlipItem(flipLayer, 'pp-flip-price', null, first.priceText, first.price, last.price, widgetRect)
    ].filter(Boolean);
    widget.appendChild(flipLayer);
    void flipLayer.offsetWidth;
    var dur = 320;
    items.forEach(function (el) {
      el.style.transition = 'transform ' + dur + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.transform = 'translate(0,0) scale(1,1)';
    });
    later(dur, function () {
      if (gen !== morphGen) return;
      clearFlipLayer();
      if (onDone) onDone();
    });
  }

  function emitActiveMarket(iso, source) {
    var byIso = rowCacheByTab[tab] || {};
    var row = byIso && byIso[iso] ? byIso[iso] : null;
    window.dispatchEvent(new CustomEvent('lt:set-active-market', {
      detail: {
        iso: iso,
        source: source || 'how-widget',
        tab: tab,
        row: row
      }
    }));
  }

  function snapDetail(iso) {
    clearMorphTimers();
    clearFlipLayer();
    clearMorphClasses();
    var parts = detailParts();
    resetStagger(parts);
    widget.classList.remove('is-list');
    widget.classList.add('is-detail');
    detailStage.hidden = false;
    if (detailSheet) detailSheet.setAttribute('aria-hidden', 'false');
    emitActiveMarket(iso, 'how-widget-row');
    window.dispatchEvent(new CustomEvent('lt:how-detail-open'));
    morphBusy = false;
  }

  function snapList() {
    clearMorphTimers();
    clearFlipLayer();
    clearMorphClasses();
    var parts = detailParts();
    resetStagger(parts);
    widget.classList.remove('is-detail');
    widget.classList.add('is-list');
    detailStage.hidden = true;
    detailStage.style.display = '';
    if (detailSheet) detailSheet.setAttribute('aria-hidden', 'true');
    morphBusy = false;
  }

  function showDetail(iso, row) {
    if (!detailStage) return;
    if (morphBusy) return;
    if (reduceMotion()) {
      snapDetail(iso);
      return;
    }
    morphBusy = true;
    var gen = bumpMorphGen();
    clearMorphTimers();
    clearFlipLayer();

    var first = captureRowFirst(row);
    emitActiveMarket(iso, 'how-widget-row');

    detailStage.hidden = false;
    detailStage.style.display = '';
    widget.classList.remove('is-list');
    widget.classList.add('is-detail', 'is-morphing');
    if (detailSheet) detailSheet.setAttribute('aria-hidden', 'false');

    var parts = detailParts();
    resetStagger(parts);
    setHeaderHidden(parts, true);
    [parts && parts.sub, parts && parts.delta, parts && parts.chart, parts && parts.tabs, parts && parts.forecast].forEach(function (el) {
      if (!el) return;
      el.classList.add('pp-stagger');
      el.classList.remove('is-in', 'pp-stagger--interactive');
    });

    var last = captureDetailLast(parts);
    window.dispatchEvent(new CustomEvent('lt:how-detail-open'));

    runFlip(first, last, gen, function () {
      if (gen !== morphGen) return;
      setHeaderHidden(parts, false);
      runOpenStagger(parts, gen, function () {
        if (gen !== morphGen) return;
        clearMorphClasses();
        morphBusy = false;
      });
    });
  }

  function showList() {
    if (!detailStage) return;
    if (!isDetailView() && detailStage.hidden) return;
    if (reduceMotion()) {
      snapList();
      return;
    }
    morphBusy = true;
    var gen = bumpMorphGen();
    clearMorphTimers();
    clearFlipLayer();

    var parts = detailParts();
    var closeBtn = parts && parts.close;
    if (closeBtn) {
      closeBtn.classList.add('is-press');
      later(100, function () {
        if (closeBtn) closeBtn.classList.remove('is-press');
      });
    }

    widget.classList.add('is-morphing', 'is-morphing-close');
    widget.classList.remove('is-list-in');
    setHeaderHidden(parts, false);

    runCloseStagger(parts, gen, function () {
      if (gen !== morphGen) return;
      widget.classList.remove('is-detail');
      widget.classList.add('is-list', 'is-list-in');

      later(180, function () {
        if (gen !== morphGen) return;
        detailStage.hidden = true;
        detailStage.style.display = '';
        if (detailSheet) detailSheet.setAttribute('aria-hidden', 'true');
        resetStagger(parts);
        clearMorphClasses();
        morphBusy = false;
      });
    });
  }

  window.addEventListener('lt:how-detail-close', showList);

  for (var t = 0; t < tabs.length; t++) {
    tabs[t].addEventListener('click', function (ev) {
      var next = ev.currentTarget.getAttribute('data-tab');
      if (!next || next === tab) return;
      selectTab(next, true);
      if (selectedIso && isDetailView()) emitActiveMarket(selectedIso, 'how-widget-tab');
    });
  }

  panel.addEventListener('click', function (ev) {
    var row = ev.target && ev.target.closest ? ev.target.closest('a.pp-row[data-iso]') : null;
    if (!row || !panel.contains(row)) return;
    ev.preventDefault();
    if (morphBusy) return;
    var iso = row.getAttribute('data-iso');
    if (!iso) return;
    selectedIso = iso;
    setRowSelection(selectedIso);
    showDetail(selectedIso, row);
  });

  requestAnimationFrame(function () {
    movePill(tabs[0], false);
  });
  window.addEventListener('resize', function () {
    var active = document.querySelector('.pp-tab[aria-selected="true"]') || tabs[0];
    movePill(active, false);
    delete widget.dataset.fixedH;
    applyFixedWidgetHeight();
  });

  selectTab('petrol', false);
})();

(function () {
  var canvas = document.getElementById('pp-home-detail-chart');
  var tabs = document.getElementById('pp-home-detail-chart-tabs');
  var deltaEl = document.getElementById('pp-home-detail-delta');
  var toggleBtn = document.getElementById('pp-home-detail-forecast-toggle');
  var noteEl = document.getElementById('pp-home-detail-forecast-note');
  var sheet = document.getElementById('pp-home-detail-sheet');
  if (!canvas || !tabs || !sheet) return;
  var titleEl = sheet.querySelector('.app-home-detail-chart-title');
  var subEl = sheet.querySelector('.app-home-detail-chart-sub');
  var priceEl = sheet.querySelector('.app-home-detail-chart-price');
  var flagEl = sheet.querySelector('.app-home-flag');
  var closeBtn = sheet.querySelector('.app-home-detail-sheet-close');

  var STROKE_UP = '#f87171';
  var STROKE_DOWN = '#4ade80';
  var STROKE_FLAT = '#9ca3af';
  var FC_STROKE = '#8c8c8c';
  var FC_RGB = [140, 140, 140];
  var range = '1y';
  var forecastVisible = false;
  var forecastReveal = 1;
  var forecastRaf = 0;
  var activeIso = 'SG';
  var activeSeries = null;
  var activeDeltas = null;
  var reducedMotion = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function flagIso(code) {
    var iso = String(code || '').toUpperCase();
    if (iso === 'UK') iso = 'GB';
    return /^[A-Z]{2}$/.test(iso) ? iso : '';
  }

  function numberFromPriceText(text) {
    var m = String(text || '').match(/-?\d[\d,]*(?:\.\d+)?/);
    if (!m) return null;
    var n = parseFloat(m[0].replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  var lastPriceText = '';
  var priceTemplate = '3.37 SGD';
  var priceDecimals = 2;
  var plotLayout = { padL: 4, padT: 14, padB: 24, plotW: 100, plotH: 100, gutter: 96, cssW: 0, cssH: 0 };
  var scrubIndex = null;
  var scrubActive = false;
  var scrubPointerId = null;
  var scrubPointerType = null;
  var geo = null;
  var curX = 0;
  var goalX = 0;
  var hoverT = 0;
  var strokeNow = [156, 163, 175];
  var strokeGoal = [156, 163, 175];
  var glideRaf = 0;
  var reelCols = [];
  var reelShape = '';
  var priceSettle = 0;
  var followHalf = 0;
  var lastMousePt = null;
  var hoverOrigin = null;
  var lastHapticAt = 0;
  var xFollowEl = sheet.querySelector('.app-home-detail-chart-xfollow');
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function buildSeries(basePrice, pct, iso) {
    var p = Number.isFinite(basePrice) ? basePrice : 3;
    var net = Number.isFinite(pct) ? pct / 100 : 0;
    var counts = { '1w': 14, '1m': 16, '1y': 22, '5y': 20 };
    var spanDays = { '1w': 7, '1m': 30, '1y': 365, '5y': 365 * 5 };
    var volMul = { '1w': 0.018, '1m': 0.028, '1y': 0.048, '5y': 0.07 };
    var byRange = {};
    var keys = ['1w', '1m', '1y', '5y'];
    var now = Date.now();
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var n = counts[key];
      var rng = mulberry32(hashStr(String(iso) + ':' + key + ':' + p.toFixed(4)));
      var first = p * (1 - net);
      if (!(first > 0.02)) first = Math.max(0.05, p * 0.84);
      var vol = Math.max(p * volMul[key], key === '1w' ? p * 0.008 : p * 0.01);
      var w1 = 0.55 + rng() * 0.25;
      var w2 = 1.15 + rng() * 0.35;
      var ph = rng() * Math.PI * 2;
      var ph2 = rng() * Math.PI * 2;
      var values = [];
      var dates = [];
      var spanMs = spanDays[key] * 86400000;
      for (var i = 0; i < n; i++) {
        var t = n === 1 ? 1 : i / (n - 1);
        var drift = first + (p - first) * t;
        var wave =
          Math.sin(t * Math.PI * 2 * w1 + ph) * vol * 1.15 +
          Math.sin(t * Math.PI * 2 * w2 + ph2) * vol * 0.5;
        var v = drift + wave;
        if (i === 0) v = first;
        if (i === n - 1) v = p;
        values.push(Math.max(0.04, Number(v.toFixed(5))));
        dates.push(new Date(now - spanMs * (1 - t)));
      }
      byRange[key] = { values: values, dates: dates };
    }
    return byRange;
  }

  function deltaFor(values) {
    if (!values || values.length < 2) return { text: '—', cls: 'is-flat' };
    var first = values[0];
    var last = values[values.length - 1];
    var diff = last - first;
    var pct = first ? (diff / first) * 100 : 0;
    var arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    var cls = diff > 0 ? 'is-up' : diff < 0 ? 'is-down' : 'is-flat';
    return {
      text: arrow + ' ' + Math.abs(diff).toFixed(2) + ' (' + (diff >= 0 ? '+' : '−') + Math.abs(pct).toFixed(2) + '%)',
      cls: cls
    };
  }

  function strokeForDelta(cls) {
    if (cls === 'is-up') return STROKE_UP;
    if (cls === 'is-down') return STROKE_DOWN;
    return STROKE_FLAT;
  }

  function rgbOf(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length !== 6) return [156, 163, 175];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function rgba(c, a) {
    return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')';
  }

  function fallbackRow() {
    return {
      iso: activeIso,
      name: titleEl ? titleEl.textContent : 'Singapore',
      sub: subEl ? subEl.textContent : 'SPC · PREMIUM · SGD',
      price: priceEl ? priceEl.textContent : 'SGD 3.88',
      pct: null
    };
  }

  function resolveRow(iso, detail) {
    if (detail && detail.row) return detail.row;
    var tabKey = detail && detail.tab ? detail.tab : 'petrol';
    var byTab = window.__ltHowRowsByTab || {};
    if (byTab[tabKey] && byTab[tabKey][iso]) return byTab[tabKey][iso];
    if (byTab.petrol && byTab.petrol[iso]) return byTab.petrol[iso];
    if (byTab.diesel && byTab.diesel[iso]) return byTab.diesel[iso];
    if (byTab.electricity && byTab.electricity[iso]) return byTab.electricity[iso];
    return null;
  }

  function setActiveMarket(iso, detail) {
    var nextIso = String(iso || '').toUpperCase() || activeIso;
    var row = resolveRow(nextIso, detail) || fallbackRow();
    activeIso = nextIso;
    if (titleEl) titleEl.textContent = row.name || nextIso;
    if (subEl) subEl.textContent = row.sub || '';
    if (priceEl) {
      priceTemplate = row.price || '—';
      var decMatch = String(priceTemplate).match(/\.(\d+)/);
      priceDecimals = decMatch ? decMatch[1].length : (Math.abs(numberFromPriceText(priceTemplate) || 1) < 1 ? 4 : 2);
      lastPriceText = '';
      applyPrice(priceTemplate, false);
    }
    if (flagEl) {
      var fiIso = flagIso(nextIso);
      flagEl.className = fiIso ? ('app-home-flag fi fi-' + fiIso.toLowerCase()) : 'app-home-flag';
    }
    var basePrice = numberFromPriceText(row.price);
    activeSeries = buildSeries(basePrice, row.pct, nextIso);
    activeDeltas = {
      '1w': deltaFor(activeSeries['1w'].values),
      '1m': deltaFor(activeSeries['1m'].values),
      '1y': deltaFor(activeSeries['1y'].values),
      '5y': deltaFor(activeSeries['5y'].values)
    };
    endScrub(true);
    setRange(range, true);
  }

  function histPack() {
    if (!activeSeries) return null;
    return activeSeries[range] || activeSeries['1y'] || null;
  }

  function histValues() {
    var pack = histPack();
    return pack && pack.values ? pack.values : [];
  }

  function histDates() {
    var pack = histPack();
    return pack && pack.dates ? pack.dates : [];
  }

  function formatPrice(n) {
    var t = String(priceTemplate || '');
    var m = t.match(/^([^\d-]*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
    var body = Number(n).toFixed(priceDecimals);
    if (!m) return body;
    return m[1] + body + m[3];
  }

  function shapeOf(text) {
    return text.replace(/\d/g, '0');
  }

  // One persistent 0-9 reel per digit, so a new value only moves a transform
  // and a change mid-roll simply redirects it
  function buildReel(text) {
    var frag = document.createDocumentFragment();
    reelCols = [];
    text.split('').forEach(function (ch) {
      if (!/\d/.test(ch)) {
        frag.appendChild(document.createTextNode(ch));
        return;
      }
      var col = document.createElement('span');
      col.className = 'pp-reel-col';
      col.setAttribute('aria-hidden', 'true');
      var reel = document.createElement('span');
      reel.className = 'pp-reel';
      for (var d = 0; d < 10; d++) {
        var cell = document.createElement('span');
        cell.textContent = d;
        reel.appendChild(cell);
      }
      col.appendChild(reel);
      frag.appendChild(col);
      reelCols.push(reel);
    });
    priceEl.replaceChildren(frag);
    reelShape = shapeOf(text);
  }

  function spinReel(text) {
    var digits = text.replace(/\D/g, '');
    for (var i = 0; i < reelCols.length; i++) {
      reelCols[i].style.transform = 'translateY(' + (-digits[i] * 10) + '%)';
    }
  }

  function applyPrice(text, rolling) {
    if (!priceEl) return;
    clearTimeout(priceSettle);
    var next = String(text || '—');
    var prev = lastPriceText;
    if (next === prev) return;
    lastPriceText = next;
    if (!rolling || reducedMotion || !prev) {
      reelShape = '';
      priceEl.textContent = next;
      return;
    }
    if (reelShape !== shapeOf(next)) {
      var from = shapeOf(prev) === shapeOf(next) ? prev : next;
      buildReel(from);
      spinReel(from);
      void priceEl.offsetWidth;
    }
    spinReel(next);
  }

  // Back to plain text once the reels have rolled home
  function settlePrice() {
    clearTimeout(priceSettle);
    if (!reelShape) return;
    priceSettle = setTimeout(function () {
      reelShape = '';
      priceEl.textContent = lastPriceText;
    }, 300);
  }

  function applyDelta(values, index) {
    if (!deltaEl) return;
    var i = index == null ? values.length - 1 : index;
    var slice = values.slice(0, i + 1);
    var delta = deltaFor(slice.length >= 2 ? [values[0], values[i]] : slice);
    if (deltaEl.textContent !== delta.text) deltaEl.textContent = delta.text;
    if (!deltaEl.classList.contains(delta.cls)) {
      deltaEl.classList.remove('is-up', 'is-down', 'is-flat');
      deltaEl.classList.add(delta.cls);
    }
  }

  function fmtFollowDate(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return '';
    if (range === '5y') return String(d.getFullYear());
    if (range === '1y') return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    return d.getDate() + ' ' + MONTHS[d.getMonth()];
  }

  function setFollowText(text) {
    if (!xFollowEl) return;
    if (!text) {
      xFollowEl.classList.remove('is-on');
      return;
    }
    if (xFollowEl.textContent !== text) {
      xFollowEl.textContent = text;
      followHalf = xFollowEl.offsetWidth / 2;
    }
    xFollowEl.classList.add('is-on');
  }

  function placeFollow() {
    if (!xFollowEl || !geo) return;
    var xc = Math.max(followHalf + 2, Math.min(geo.cssW - followHalf - 2, curX)) + geo.left;
    xFollowEl.style.transform = 'translateX(' + xc + 'px) translateX(-50%)';
  }

  function forecastValues(hist) {
    var n = hist.length;
    var last = hist[n - 1];
    var base = n >= 4 ? hist[n - 4] : hist[0];
    var step = (last - base) / 3;
    if (!isFinite(step) || Math.abs(step) < 0.02) step = 0.05;
    return [last + step * 0.55, last + step * 0.95, last + step * 1.2];
  }

  function syncForecastUi() {
    if (toggleBtn) toggleBtn.hidden = !!forecastVisible;
    if (noteEl) noteEl.hidden = !forecastVisible;
  }

  function placePill(instant) {
    var pill = tabs.querySelector('.app-home-detail-chart-tabs-pill');
    var active = tabs.querySelector('.app-home-detail-chart-tab[aria-selected="true"]');
    if (!pill || !active || !active.offsetWidth) return;
    if (instant) pill.style.transition = 'none';
    pill.style.width = active.offsetWidth + 'px';
    pill.style.height = active.offsetHeight + 'px';
    pill.style.top = active.offsetTop + 'px';
    pill.style.transform = 'translateX(' + active.offsetLeft + 'px)';
    if (instant) {
      void pill.offsetWidth;
      pill.style.transition = '';
    }
  }

  // Everything that only changes with the data or the size. Runs on a range,
  // market or resize change, never per frame.
  function layout() {
    var values = histValues();
    if (!values.length) {
      geo = null;
      return;
    }
    var fc = forecastValues(values);
    var cssW = canvas.clientWidth || 400;
    var cssH = canvas.clientHeight || 300;
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var bitmapW = Math.round(cssW * dpr);
    var bitmapH = Math.round(cssH * dpr);
    if (canvas.width !== bitmapW) canvas.width = bitmapW;
    if (canvas.height !== bitmapH) canvas.height = bitmapH;

    var gutter = 96;
    var padT = 14;
    var padB = 24;
    var padL = 8;
    var plotW = Math.max(8, cssW - gutter - padL);
    var plotH = Math.max(8, cssH - padT - padB);
    plotLayout.padL = padL;
    plotLayout.padT = padT;
    plotLayout.padB = padB;
    plotLayout.plotW = plotW;
    plotLayout.plotH = plotH;
    plotLayout.gutter = gutter;
    plotLayout.cssW = cssW;
    plotLayout.cssH = cssH;

    var n = values.length;
    var extent = values.concat(forecastVisible ? fc : []);
    var min = Math.min.apply(null, extent);
    var max = Math.max.apply(null, extent);
    var span = max - min || 0.08;
    min -= span * 0.1;
    max += span * 0.14;
    span = max - min;

    function yAt(v) {
      return padT + plotH * (1 - (v - min) / span);
    }

    var pts = values.map(function (v, i) {
      return { x: n <= 1 ? padL : padL + (plotW * i) / (n - 1), y: yAt(v) };
    });

    // The line as quadratic segments, sampled too so the dot can ride it
    var line = new Path2D();
    var samples = [pts[0]];
    function segment(from, ctrl, to) {
      line.quadraticCurveTo(ctrl.x, ctrl.y, to.x, to.y);
      for (var s = 1; s <= 12; s++) {
        var t = s / 12;
        var u = 1 - t;
        samples.push({
          x: u * u * from.x + 2 * u * t * ctrl.x + t * t * to.x,
          y: u * u * from.y + 2 * u * t * ctrl.y + t * t * to.y
        });
      }
    }
    line.moveTo(pts[0].x, pts[0].y);
    var at = pts[0];
    for (var i = 1; i < n - 1; i++) {
      var mid = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      segment(at, pts[i], mid);
      at = mid;
    }
    if (n > 1) segment(at, pts[Math.max(0, n - 2)], pts[n - 1]);

    // The forecast is part of the same track once it is showing
    var out = [];
    var fcLine = null;
    var fcBand = null;
    if (forecastVisible) {
      var xStart = pts[n - 1].x + 2;
      var xFinal = cssW - 11.5;
      fc.forEach(function (v, k) {
        out.push({
          x: xStart + ((xFinal - xStart) * (k + 1)) / fc.length,
          y: Math.max(padT + 4, Math.min(padT + plotH - 4, yAt(v)))
        });
      });
      fcBand = new Path2D();
      fcBand.moveTo(xStart, pts[n - 1].y);
      out.forEach(function (o, k) { fcBand.lineTo(o.x, yAt(fc[k] * 1.035)); });
      for (var bj = out.length - 1; bj >= 0; bj--) fcBand.lineTo(out[bj].x, yAt(fc[bj] * 0.965));
      fcBand.closePath();

      fcLine = new Path2D();
      fcLine.moveTo(xStart, pts[n - 1].y);
      var cx = xStart;
      var cy = pts[n - 1].y;
      var prev = pts[n - 2] || pts[n - 1];
      var exitSlope = pts[n - 1].x - prev.x > 0 ? (pts[n - 1].y - prev.y) / (pts[n - 1].x - prev.x) : 0;
      samples.push({ x: cx, y: cy });
      out.forEach(function (seg, k) {
        var dx = seg.x - cx;
        var c1x = cx + dx * 0.35;
        var c1y = cy;
        var c2x = seg.x - dx * 0.35;
        if (k === 0) {
          var maxBow = Math.max(8, Math.abs(seg.y - cy));
          c1y = cy + Math.max(-maxBow, Math.min(maxBow, exitSlope * dx * 0.35));
        }
        fcLine.bezierCurveTo(c1x, c1y, c2x, seg.y, seg.x, seg.y);
        for (var q = 1; q <= 12; q++) {
          var t = q / 12;
          var u = 1 - t;
          samples.push({
            x: u * u * u * cx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * seg.x,
            y: u * u * u * cy + 3 * u * u * t * c1y + 3 * u * t * t * seg.y + t * t * t * seg.y
          });
        }
        cx = seg.x;
        cy = seg.y;
      });
    }

    var area = new Path2D(line);
    area.lineTo(pts[n - 1].x, padT + plotH);
    area.lineTo(pts[0].x, padT + plotH);
    area.closePath();

    geo = {
      cssW: cssW,
      cssH: cssH,
      dpr: dpr,
      left: canvas.offsetLeft,
      top: padT,
      bottom: padT + plotH,
      pts: pts,
      out: out,
      stops: pts.concat(out),
      series: forecastVisible ? values.concat(fc) : values,
      scrubRight: out.length ? out[out.length - 1].x : padL + plotW,
      fcLine: fcLine,
      fcBand: fcBand,
      line: line,
      area: area,
      samples: samples,
      yAt: yAt,
      lastX: pts[n - 1].x,
      lastY: pts[n - 1].y
    };

    if (scrubIndex == null) {
      strokeGoal = strokeAt(n - 1);
      if (hoverT === 0) strokeNow = strokeGoal.slice();
    } else {
      curX = goalX = Math.min(goalX, geo.scrubRight);
    }
  }

  function strokeAt(index) {
    return rgbOf(strokeForDelta(deltaFor([geo.series[0], geo.series[index]]).cls));
  }

  function curveY(x) {
    var list = geo.samples;
    for (var i = 1; i < list.length; i++) {
      if (list[i].x >= x) {
        var a = list[i - 1];
        var b = list[i];
        return a.y + (b.y - a.y) * (b.x === a.x ? 0 : (x - a.x) / (b.x - a.x));
      }
    }
    return list[list.length - 1].y;
  }

  // Per frame: fills and strokes from the cached paths, nothing else
  function paint() {
    if (!geo) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var g = geo;
    var top = g.top;
    var bottom = g.bottom;
    var t = hoverT;
    var splitX = t > 0 ? curX : g.cssW;

    ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
    ctx.clearRect(0, 0, g.cssW, g.cssH);
    ctx.lineWidth = 2.25;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    var grad = ctx.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0, rgba(strokeNow, 0.35 - 0.13 * t));
    grad.addColorStop(1, rgba(strokeNow, 0));

    if (t > 0) {
      ctx.fillStyle = rgba(strokeNow, 0.08 * t);
      ctx.fill(g.area);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, g.cssH);
    ctx.clip();
    ctx.fillStyle = grad;
    ctx.fill(g.area);
    ctx.strokeStyle = rgba(strokeNow, 1);
    ctx.stroke(g.line);
    ctx.restore();

    if (t > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, g.cssW - splitX, g.cssH);
      ctx.clip();
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = grad;
      ctx.fill(g.area);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = rgba(strokeNow, 1 - 0.72 * t);
      ctx.stroke(g.line);
      ctx.restore();
    }

    if (forecastVisible) paintForecast(ctx, g, splitX, t);

    if (t > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,' + 0.45 * t + ')';
      ctx.moveTo(curX, top);
      ctx.lineTo(curX, bottom);
      ctx.stroke();
      ctx.restore();

      // The dot turns forecast grey as it crosses onto the estimate
      var mix = Math.max(0, Math.min(1, (curX - g.lastX) / 12));
      var dotY = curveY(curX);
      ctx.save();
      ctx.globalAlpha = t;
      ctx.beginPath();
      ctx.fillStyle = rgba(strokeNow.map(function (v, c) { return v + (FC_RGB[c] - v) * mix; }), 1);
      ctx.arc(curX, dotY, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.arc(curX, dotY, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (!forecastVisible && t < 1) {
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(128,128,128,' + 0.35 * (1 - t) + ')';
      ctx.moveTo(g.lastX, top);
      ctx.lineTo(g.lastX, bottom);
      ctx.stroke();
      ctx.restore();
    }
  }

  function strokeForecast(ctx, g, alpha) {
    ctx.fillStyle = FC_STROKE;
    ctx.globalAlpha = 0.1 * alpha;
    ctx.fill(g.fcBand);
    ctx.globalAlpha = alpha;
    ctx.setLineDash([4, 4]);
    ctx.lineCap = 'butt';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = FC_STROKE;
    ctx.stroke(g.fcLine);
    ctx.setLineDash([]);
    for (var d = 0; d < g.out.length; d++) {
      ctx.beginPath();
      ctx.arc(g.out[d].x, g.out[d].y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function paintForecast(ctx, g, splitX, t) {
    var clipT = Math.max(0, Math.min(1, forecastReveal));
    ctx.save();
    if (clipT < 1) {
      ctx.beginPath();
      ctx.rect(g.lastX, g.top, Math.max(0, (g.cssW - g.lastX) * clipT), g.bottom - g.top);
      ctx.clip();
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, g.cssH);
    ctx.clip();
    strokeForecast(ctx, g, 1);
    ctx.restore();
    if (t > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, g.cssW - splitX, g.cssH);
      ctx.clip();
      strokeForecast(ctx, g, 1 - 0.6 * t);
      ctx.restore();
    }
    ctx.restore();
  }

  function draw() {
    layout();
    paint();
  }

  // One eased chase for the cursor, the hover fade and the line colour, so a
  // new target simply redirects whatever is already moving
  function chase(now, goal, snap) {
    return Math.abs(goal - now) < snap ? goal : now + (goal - now) * 0.24;
  }

  function settleGlide() {
    curX = goalX;
    hoverT = scrubIndex != null ? 1 : 0;
    strokeNow = strokeGoal.slice();
  }

  function glide() {
    glideRaf = 0;
    curX = chase(curX, goalX, 0.4);
    hoverT = chase(hoverT, scrubIndex != null ? 1 : 0, 0.01);
    var still = curX === goalX && hoverT === (scrubIndex != null ? 1 : 0);
    for (var c = 0; c < 3; c++) {
      strokeNow[c] = chase(strokeNow[c], strokeGoal[c], 1);
      if (strokeNow[c] !== strokeGoal[c]) still = false;
    }
    placeFollow();
    paint();
    if (!still) glideRaf = requestAnimationFrame(glide);
  }

  function kickGlide() {
    if (reducedMotion) {
      settleGlide();
      placeFollow();
      paint();
      return;
    }
    if (!glideRaf) glideRaf = requestAnimationFrame(glide);
  }

  function startForecastReveal() {
    if (forecastRaf) cancelAnimationFrame(forecastRaf);
    if (reducedMotion) {
      forecastReveal = 1;
      draw();
      return;
    }
    forecastReveal = 0;
    layout();
    var t0 = performance.now();
    function tick(now) {
      forecastReveal = Math.min(1, (now - t0) / 480);
      paint();
      if (forecastReveal < 1) forecastRaf = requestAnimationFrame(tick);
      else forecastRaf = 0;
    }
    forecastRaf = requestAnimationFrame(tick);
  }

  function setRange(next, instantPill) {
    range = next;
    forecastVisible = false;
    forecastReveal = 1;
    if (forecastRaf) {
      cancelAnimationFrame(forecastRaf);
      forecastRaf = 0;
    }
    endScrub(true);
    var buttons = tabs.querySelectorAll('.app-home-detail-chart-tab');
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute('data-range') === range;
      buttons[i].classList.toggle('is-active', on);
      buttons[i].setAttribute('aria-selected', on ? 'true' : 'false');
    }
    applyDelta(histValues());
    syncForecastUi();
    draw();
    placePill(instantPill);
  }

  function eventCanvasX(ev) {
    var rect = canvas.getBoundingClientRect();
    return ev.clientX - rect.left;
  }

  function indexFromX(x) {
    var stops = geo.stops;
    var near = 0;
    for (var i = 1; i < stops.length; i++) {
      if (Math.abs(stops[i].x - x) < Math.abs(stops[near].x - x)) near = i;
    }
    return near;
  }

  function followText(index) {
    var dates = histDates();
    var n = dates.length;
    if (index < n) return fmtFollowDate(dates[index]);
    var step = (dates[n - 1] - dates[0]) / (n - 1);
    return 'Est. ' + fmtFollowDate(new Date(dates[n - 1].getTime() + step * (index - n + 1)));
  }

  function maybeHaptic() {
    if (!scrubActive || scrubPointerType === 'mouse') return;
    try {
      if (typeof navigator.vibrate !== 'function') return;
    } catch (_) {
      return;
    }
    var now = Date.now();
    if (now - lastHapticAt < 90) return;
    lastHapticAt = now;
    try { navigator.vibrate(8); } catch (_) {}
  }

  function applyScrubFromEvent(ev) {
    if (!ev || !geo) return;
    var values = geo.series;
    var x = Math.max(plotLayout.padL, Math.min(geo.scrubRight, eventCanvasX(ev)));
    var idx = indexFromX(x);
    var changed = scrubIndex !== idx;
    // Appearing from nothing: start at the target rather than sliding in
    var appearing = scrubIndex == null && hoverT < 0.02;
    scrubIndex = idx;
    goalX = x;
    if (appearing) curX = x;
    if (changed) {
      maybeHaptic();
      strokeGoal = strokeAt(idx);
      applyPrice(formatPrice(values[idx]), true);
      applyDelta(values, idx);
      setFollowText(followText(idx));
    }
    if (appearing) placeFollow();
    kickGlide();
  }

  function endScrub(silent) {
    var wasOn = scrubIndex != null || scrubActive;
    scrubActive = false;
    scrubPointerId = null;
    scrubPointerType = null;
    scrubIndex = null;
    setFollowText('');
    if (silent) {
      if (glideRaf) {
        cancelAnimationFrame(glideRaf);
        glideRaf = 0;
      }
      hoverT = 0;
      return;
    }
    if (wasOn) {
      strokeGoal = strokeAt(histValues().length - 1);
      applyPrice(priceTemplate, true);
      settlePrice();
      applyDelta(histValues());
      kickGlide();
    }
  }

  window.addEventListener('pointermove', function (ev) {
    if (ev && ev.pointerType === 'mouse') lastMousePt = { x: ev.clientX, y: ev.clientY };
  }, { passive: true, capture: true });

  canvas.addEventListener('pointerdown', function (ev) {
    if (!ev || (ev.button != null && ev.button !== 0)) return;
    ev.stopPropagation();
    if (ev.pointerType !== 'mouse' && ev.cancelable) ev.preventDefault();
    scrubActive = true;
    scrubPointerId = ev.pointerId;
    scrubPointerType = ev.pointerType || null;
    try { canvas.setPointerCapture(ev.pointerId); } catch (_) {}
    hoverOrigin = null;
    applyScrubFromEvent(ev);
  });

  canvas.addEventListener('pointermove', function (ev) {
    if (!scrubActive) {
      if (ev && ev.pointerType === 'mouse') {
        if (hoverOrigin) {
          if (
            Math.abs(ev.clientX - hoverOrigin.x) < 3 &&
            Math.abs(ev.clientY - hoverOrigin.y) < 3
          ) {
            return;
          }
          hoverOrigin = null;
        }
        applyScrubFromEvent(ev);
      }
      return;
    }
    if (scrubPointerId != null && ev.pointerId !== scrubPointerId) return;
    applyScrubFromEvent(ev);
  });

  function onScrubEnd(ev) {
    if (!scrubActive) return;
    if (scrubPointerId != null && ev && ev.pointerId !== scrubPointerId) return;
    try { if (ev) canvas.releasePointerCapture(ev.pointerId); } catch (_) {}
    endScrub(false);
  }

  canvas.addEventListener('pointerup', onScrubEnd);
  canvas.addEventListener('pointercancel', onScrubEnd);
  canvas.addEventListener('pointerleave', function (ev) {
    if (scrubActive) endScrub(false);
    else if (ev && ev.pointerType === 'mouse') endScrub(false);
  });

  tabs.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.app-home-detail-chart-tab');
    if (!btn) return;
    setRange(btn.getAttribute('data-range') || '1y', false);
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (forecastVisible) return;
      forecastVisible = true;
      syncForecastUi();
      startForecastReveal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      window.dispatchEvent(new CustomEvent('lt:how-detail-close'));
    });
  }

  window.addEventListener('resize', function () {
    if (sheet.getAttribute('aria-hidden') === 'true') return;
    draw();
    placePill(true);
  });

  window.addEventListener('lt:how-detail-open', function () {
    hoverOrigin = lastMousePt ? { x: lastMousePt.x, y: lastMousePt.y } : null;
    requestAnimationFrame(function () {
      draw();
      placePill(true);
    });
  });

  window.addEventListener('lt:set-active-market', function (ev) {
    var detail = ev && ev.detail ? ev.detail : {};
    setActiveMarket(detail.iso, detail);
  });
})();

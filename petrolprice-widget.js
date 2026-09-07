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
    if (!widget || !detailStage || widget.dataset.fixedH) return;
    var wasList = widget.classList.contains('is-list');
    var wasHidden = detailStage.hidden;
    var note = document.getElementById('pp-home-detail-forecast-note');
    var noteWasHidden = note ? note.hidden : false;
    var listH = widget.offsetHeight;
    detailStage.hidden = false;
    detailStage.style.display = '';
    widget.classList.remove('is-list');
    widget.classList.add('is-detail');
    if (note) note.hidden = false;
    var detailH = widget.offsetHeight;
    if (note) note.hidden = noteWasHidden;
    widget.classList.toggle('is-list', wasList);
    widget.classList.toggle('is-detail', !wasList);
    detailStage.hidden = wasHidden;
    if (wasHidden) detailStage.style.display = '';
    var fixed = Math.ceil(Math.max(listH, detailH, 1));
    widget.style.height = fixed + 'px';
    widget.dataset.fixedH = '1';
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
    if (widget.dataset.fixedH) {
      delete widget.dataset.fixedH;
      widget.style.height = '';
      applyFixedWidgetHeight();
    }
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

  var STROKE = '#dc2626';
  var FC_STROKE = '#8c8c8c';
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

  function isoSeed(iso) {
    var s = String(iso || '');
    var acc = 0;
    for (var i = 0; i < s.length; i++) acc = (acc * 33 + s.charCodeAt(i)) % 997;
    return (acc % 7) - 3;
  }

  function buildSeries(basePrice, pct, iso) {
    var p = Number.isFinite(basePrice) ? basePrice : 3;
    var resolvedPct = Number.isFinite(pct) ? pct : (isoSeed(iso) * 1.15);
    var byRange = {};

    function stepped(points, start) {
      var out = [];
      var level = start;
      for (var i = 0; i < points.length; i++) {
        level = level + (points[i] * p);
        out.push(level);
        out.push(level);
      }
      return out;
    }

    var weekMove = (resolvedPct / 100) * 0.32;
    var monthMove = (resolvedPct / 100) * 0.58;
    var yearMove = resolvedPct / 100;
    var fiveMove = (resolvedPct / 100) * 2.4;

    byRange['1w'] = stepped([weekMove * 0.2, weekMove * 0.3, weekMove * 0.5], p * (1 - weekMove));
    byRange['1m'] = stepped([monthMove * 0.18, monthMove * 0.24, monthMove * 0.21, monthMove * 0.37], p * (1 - monthMove));
    byRange['1y'] = stepped([yearMove * 0.08, yearMove * 0.09, yearMove * 0.12, yearMove * 0.1, yearMove * 0.13, yearMove * 0.14, yearMove * 0.16, yearMove * 0.18], p * (1 - yearMove));
    byRange['5y'] = stepped([fiveMove * 0.09, fiveMove * 0.11, fiveMove * 0.12, fiveMove * 0.14, fiveMove * 0.12, fiveMove * 0.13, fiveMove * 0.15, fiveMove * 0.14], p * (1 - fiveMove));

    for (var key in byRange) {
      if (!byRange[key] || !byRange[key].length) continue;
      byRange[key][byRange[key].length - 1] = p;
      byRange[key] = byRange[key].map(function (v) {
        return Math.max(0.05, Number(v.toFixed(4)));
      });
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
    if (priceEl) priceEl.textContent = row.price || '—';
    if (flagEl) {
      var fiIso = flagIso(nextIso);
      flagEl.className = fiIso ? ('app-home-flag fi fi-' + fiIso.toLowerCase()) : 'app-home-flag';
    }
    var basePrice = numberFromPriceText(row.price);
    activeSeries = buildSeries(basePrice, row.pct, nextIso);
    activeDeltas = {
      '1w': deltaFor(activeSeries['1w']),
      '1m': deltaFor(activeSeries['1m']),
      '1y': deltaFor(activeSeries['1y']),
      '5y': deltaFor(activeSeries['5y'])
    };
    setRange(range, true);
  }

  function histValues() {
    if (!activeSeries) return [];
    return activeSeries[range] || activeSeries['1y'] || [];
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

  function draw() {
    var values = histValues();
    if (!values.length) return;
    var fc = forecastValues(values);
    var wrap = canvas.parentElement;
    var cssW = wrap.clientWidth || 400;
    var cssH = wrap.clientHeight || 300;
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var gutter = 96;
    var padT = 14;
    var padB = 24;
    var padL = 4;
    var plotW = Math.max(8, cssW - gutter - padL);
    var plotH = Math.max(8, cssH - padT - padB);
    var n = values.length;
    var extent = values.concat(fc);
    var min = Math.min.apply(null, extent);
    var max = Math.max.apply(null, extent);
    var span = max - min || 0.08;
    min -= span * 0.08;
    max += span * 0.12;
    span = max - min;

    function xAt(i) {
      if (n <= 1) return padL;
      return padL + (plotW * i) / (n - 1);
    }
    function yAt(v) {
      return padT + plotH * (1 - (v - min) / span);
    }

    ctx.beginPath();
    ctx.moveTo(xAt(0), yAt(values[0]));
    for (var i = 1; i < n; i++) {
      ctx.lineTo(xAt(i), yAt(values[i - 1]));
      ctx.lineTo(xAt(i), yAt(values[i]));
    }
    ctx.lineTo(xAt(n - 1), padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    var fill = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    fill.addColorStop(0, 'rgba(220, 38, 38, 0.35)');
    fill.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(xAt(0), yAt(values[0]));
    for (var j = 1; j < n; j++) {
      ctx.lineTo(xAt(j), yAt(values[j - 1]));
      ctx.lineTo(xAt(j), yAt(values[j]));
    }
    ctx.strokeStyle = STROKE;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    var lastX = xAt(n - 1);
    var lastY = yAt(values[n - 1]);
    if (!forecastVisible) {
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(128,128,128,0.35)';
      ctx.moveTo(lastX, padT);
      ctx.lineTo(lastX, padT + plotH);
      ctx.stroke();
      ctx.restore();
      return;
    }

    var dotR = 3.5;
    var xStart = lastX + 2;
    var xFinal = cssW - dotR - 8;
    var out = [];
    for (var k = 0; k < fc.length; k++) {
      out.push({
        x: xStart + ((xFinal - xStart) * (k + 1)) / fc.length,
        y: Math.max(padT + 4, Math.min(padT + plotH - 4, yAt(fc[k])))
      });
    }
    var clipT = Math.max(0, Math.min(1, forecastReveal));
    ctx.save();
    if (clipT < 1) {
      ctx.beginPath();
      ctx.rect(lastX, padT, Math.max(0, (xFinal + dotR + 3 - lastX) * clipT), plotH);
      ctx.clip();
    }
    ctx.beginPath();
    ctx.moveTo(xStart, lastY);
    for (var bi = 0; bi < out.length; bi++) ctx.lineTo(out[bi].x, yAt(fc[bi] * 1.035));
    for (var bj = out.length - 1; bj >= 0; bj--) ctx.lineTo(out[bj].x, yAt(fc[bj] * 0.965));
    ctx.closePath();
    ctx.fillStyle = FC_STROKE;
    ctx.globalAlpha = 0.1;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.lineCap = 'butt';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = FC_STROKE;
    ctx.moveTo(xStart, lastY);
    var cx = xStart;
    var cy = lastY;
    var prevY = n > 1 ? yAt(values[n - 2]) : lastY;
    var prevX = n > 1 ? xAt(n - 2) : lastX;
    var exitSlope = lastX - prevX > 0 ? (lastY - prevY) / (lastX - prevX) : 0;
    for (var s = 0; s < out.length; s++) {
      var seg = out[s];
      var dx = seg.x - cx;
      var cp1y = cy;
      if (s === 0) {
        var maxBow = Math.max(8, Math.abs(seg.y - cy));
        cp1y = cy + Math.max(-maxBow, Math.min(maxBow, exitSlope * dx * 0.35));
      }
      ctx.bezierCurveTo(cx + dx * 0.35, cp1y, seg.x - dx * 0.35, seg.y, seg.x, seg.y);
      cx = seg.x;
      cy = seg.y;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    for (var d = 0; d < out.length; d++) {
      ctx.beginPath();
      ctx.fillStyle = FC_STROKE;
      ctx.arc(out[d].x, out[d].y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function startForecastReveal() {
    if (forecastRaf) cancelAnimationFrame(forecastRaf);
    if (reducedMotion) {
      forecastReveal = 1;
      draw();
      return;
    }
    forecastReveal = 0;
    var t0 = performance.now();
    function tick(now) {
      forecastReveal = Math.min(1, (now - t0) / 480);
      draw();
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
    var buttons = tabs.querySelectorAll('.app-home-detail-chart-tab');
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute('data-range') === range;
      buttons[i].classList.toggle('is-active', on);
      buttons[i].setAttribute('aria-selected', on ? 'true' : 'false');
    }
    if (deltaEl) {
      var delta = activeDeltas ? (activeDeltas[range] || activeDeltas['1y']) : null;
      deltaEl.textContent = delta ? delta.text : '—';
      deltaEl.className = 'app-home-detail-chart-delta ' + (delta ? delta.cls : 'is-flat');
    }
    syncForecastUi();
    draw();
    placePill(instantPill);
  }

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

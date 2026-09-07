/**
 * Per-digit odometer roll used by the home table, detail-sheet big price,
 * chart hover-scrub, and landingtest How-it-works quotes.
 *
 * Same contract as homeRenderDigitSpans in assets/app-home-core.js: a straight
 * 0-9→0-9 swap at the same string length gets the two-layer ticker; currency,
 * decimal, or length changes fall back to the single-span blur pop-in.
 */
(function (root) {
  var DIGIT_RE = /[0-9]/;

  function cancelDigitFinalize(el) {
    if (!el) return;
    if (el._ppxDigitFinalizeTimer) {
      clearTimeout(el._ppxDigitFinalizeTimer);
      el._ppxDigitFinalizeTimer = null;
    }
    el._ppxDigitTargetText = null;
  }

  function renderDigitSpans(el, prevText, newText, opts) {
    var chars = newText.split('');
    var aligned = prevText.length === chars.length;
    var scrubbing = !!(opts && opts.scrubbing);
    var dirY = opts && opts.dirY === -1 ? -1 : 1;
    var blurPx = opts && Number.isFinite(opts.blurPx) ? opts.blurPx : 2;
    var frag = document.createDocumentFragment();
    for (var ci = 0; ci < chars.length; ci++) {
      var ch = chars[ci];
      var prevCh = aligned ? prevText[ci] : null;
      var changed = !aligned || prevCh !== ch;
      if (changed && aligned && DIGIT_RE.test(ch) && prevCh != null && DIGIT_RE.test(prevCh)) {
        var wrap = document.createElement('span');
        wrap.className = 't-digit-roll';
        var sizeSpan = document.createElement('span');
        sizeSpan.className = 't-digit-roll-size';
        sizeSpan.setAttribute('aria-hidden', 'true');
        sizeSpan.textContent = ch;
        var oldSpan = document.createElement('span');
        oldSpan.className = 't-digit-roll-old';
        oldSpan.textContent = prevCh;
        oldSpan.style.setProperty('--digit-roll-exit-y', (dirY >= 0 ? -100 : 100) + '%');
        oldSpan.style.setProperty('--digit-roll-blur', (blurPx * 1.5).toFixed(1) + 'px');
        var newSpan = document.createElement('span');
        newSpan.className = 't-digit-roll-new';
        newSpan.textContent = ch;
        newSpan.style.setProperty('--digit-roll-enter-y', (dirY >= 0 ? 100 : -100) + '%');
        newSpan.style.setProperty('--digit-roll-blur', (blurPx * 1.5).toFixed(1) + 'px');
        wrap.appendChild(sizeSpan);
        wrap.appendChild(oldSpan);
        wrap.appendChild(newSpan);
        frag.appendChild(wrap);
      } else {
        var spanEl = document.createElement('span');
        spanEl.className = changed ? 't-digit' : 't-digit-static';
        spanEl.textContent = ch;
        if (changed) {
          spanEl.style.setProperty('--digit-pop-y', (8 * dirY) + 'px');
          spanEl.style.setProperty('--digit-pop-blur', blurPx.toFixed(1) + 'px');
        }
        if (changed && !scrubbing) {
          if (opts && opts.staggerAll) {
            var step = Number.isFinite(opts.staggerMs) ? opts.staggerMs : 28;
            spanEl.style.animationDelay = (ci * step) + 'ms';
          } else if (ci === chars.length - 2) spanEl.dataset.stagger = '1';
          else if (ci === chars.length - 1) spanEl.dataset.stagger = '2';
        }
        frag.appendChild(spanEl);
      }
    }
    el.replaceChildren(frag);
    el._ppxDigitTargetText = newText;
    if (el._ppxDigitFinalizeTimer) clearTimeout(el._ppxDigitFinalizeTimer);
    var finalizeDur = opts && Number.isFinite(opts.durationMs) ? opts.durationMs : 500;
    var staggerTail = 260;
    if (opts && opts.staggerAll) {
      var stepMs = Number.isFinite(opts.staggerMs) ? opts.staggerMs : 28;
      staggerTail = chars.length * stepMs + 80;
    }
    el._ppxDigitFinalizeTimer = setTimeout(function () {
      el._ppxDigitFinalizeTimer = null;
      if (el._ppxDigitTargetText !== newText) return;
      el.classList.remove('is-animating');
      el.textContent = newText;
    }, finalizeDur + staggerTail);
  }

  root.ppxCancelDigitFinalize = cancelDigitFinalize;
  root.ppxRenderDigitSpans = renderDigitSpans;
})(typeof window !== 'undefined' ? window : this);

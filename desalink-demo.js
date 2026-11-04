/* Desalink terminal. One day of speed at Long Lama, data from
   aaronagai/desalink-xyz demos/src/storm-demo.tsx. Plain JS, no dependencies.
   Which hour shows: hover beats pinned beats the one-time attract sweep. */
(function () {
    var host = document.getElementById('stormDemo');
    if (!host) return;

    var MBPS = [184, 190, 195, 191, 194, 197, 193, 190, 141, 118, 152, 188, 191];
    var HOURS = ['6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'];
    var RAIN = [8, 10];
    var TROUGH = 9;
    var TOP = 220;
    var LAST = MBPS.length - 1;
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var svg = function (body, extra) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + body + '</svg>';
    };
    var CLOUD = '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M16 14v6M8 14v6M12 16v6"/>';
    var digit = '<span class="dl-digit">' + '0123456789'.split('').map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</span>';

    host.innerHTML =
        '<div class="dl">' +
            '<div class="dl-screen">' +
                '<div class="dl-rain" aria-hidden="true"></div>' +
                '<div class="dl-status" aria-hidden="true">' +
                    '<span>6:02</span>' +
                    '<span class="dl-status-icons">' +
                        '<svg viewBox="0 0 18 12" fill="currentColor"><rect y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" width="3" height="12" rx="1"/></svg>' +
                        '<svg viewBox="0 0 26 12" fill="none"><rect x=".5" y=".5" width="22" height="11" rx="3.2" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="8" rx="2" fill="currentColor"/><path d="M24 4v4c.9-.3 1.5-1.1 1.5-2S24.900 4.300 24 4z" fill="currentColor" opacity=".5"/></svg>' +
                    '</span>' +
                '</div>' +
                '<div class="dl-main">' +
                    '<div class="dl-head">' +
                        '<div><div class="dl-title">Long Lama</div><div class="dl-sub">100% uptime today &middot; 0 dropouts</div></div>' +
                        '<span class="dl-pill"><i aria-hidden="true"></i>Online</span>' +
                    '</div>' +
                    '<div>' +
                        '<div class="dl-label">Now</div>' +
                        '<div class="dl-value"><span class="dl-digits" aria-hidden="true">' + digit + digit + digit + '</span><span class="dl-unit">Mbps</span></div>' +
                    '</div>' +
                    '<div class="dl-plot" role="slider" tabindex="0" aria-label="Hour of the day" aria-valuemin="0" aria-valuemax="' + LAST + '">' +
                        '<span class="dl-band"><button type="button" class="dl-chip">' + svg(CLOUD) + 'Heavy rain</button></span>' +
                        '<svg class="dl-chart" aria-hidden="true"><path class="dl-area"/><path class="dl-curve" pathLength="1"/></svg>' +
                        '<span class="dl-hair"></span><span class="dl-dot"></span><span class="dl-now"></span>' +
                    '</div>' +
                    '<div class="dl-axis" aria-hidden="true"><span>6 AM</span><span>12 PM</span><span>6 PM</span></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    var root = host.firstChild;
    var $ = function (s) { return root.querySelector(s); };
    var plot = $('.dl-plot'), curve = $('.dl-curve'), area = $('.dl-area'), band = $('.dl-band');
    var hair = $('.dl-hair'), dot = $('.dl-dot'), now = $('.dl-now'), label = $('.dl-label');
    var digits = root.querySelectorAll('.dl-digit'), chip = $('.dl-chip');

    var hover = null, pinned = null, attract = null;
    var pts = [], lookup = [], W = 0, H = 0;
    var curX = 0, goalX = 0, raf = 0, shownLabel = 'Now', timers = [];

    var flag = function (name, on) {
        if (on) root.setAttribute(name, ''); else root.removeAttribute(name);
    };
    var shown = function () {
        return hover !== null ? hover : pinned !== null ? pinned : attract;
    };

    // The same smooth line as the Stageshow chart (Catmull-Rom as cubic Beziers)
    function draw() {
        W = plot.clientWidth; H = plot.clientHeight;
        if (!W || !H) return;
        pts = MBPS.map(function (v, i) {
            return { x: 1 + (i / LAST) * (W - 2), y: H - 1 - (v / TOP) * (H - 2) };
        });
        var d = 'M' + pts[0].x + ' ' + pts[0].y;
        for (var i = 0; i < LAST; i++) {
            var a = pts[i - 1] || pts[i], b = pts[i], c = pts[i + 1], e = pts[i + 2] || c;
            d += 'C' + (b.x + (c.x - a.x) / 6) + ' ' + (b.y + (c.y - a.y) / 6) + ' ' + (c.x - (e.x - b.x) / 6) + ' ' + (c.y - (e.y - b.y) / 6) + ' ' + c.x + ' ' + c.y;
        }
        curve.setAttribute('d', d);
        area.setAttribute('d', d + 'L' + pts[LAST].x + ' ' + H + 'L' + pts[0].x + ' ' + H + 'Z');

        lookup = [];
        var len = curve.getTotalLength();
        for (var s = 0; s <= 240; s++) lookup.push(curve.getPointAtLength((s / 240) * len));

        var step = pts[1].x - pts[0].x;
        band.style.left = pts[RAIN[0]].x - step / 2 + 'px';
        band.style.width = pts[RAIN[1]].x - pts[RAIN[0]].x + step + 'px';
        now.style.transform = 'translate(' + pts[LAST].x + 'px,' + pts[LAST].y + 'px)';

        var i2 = shown();
        curX = goalX = pts[i2 === null ? LAST : i2].x;
        place();
    }

    function yAt(x) {
        for (var i = 1; i < lookup.length; i++) {
            if (lookup[i].x >= x) {
                var a = lookup[i - 1], b = lookup[i];
                return a.y + (b.y - a.y) * (b.x === a.x ? 0 : (x - a.x) / (b.x - a.x));
            }
        }
        return lookup[lookup.length - 1].y;
    }

    function place() {
        hair.style.transform = 'translateX(' + curX + 'px)';
        dot.style.transform = 'translate(' + curX + 'px,' + yAt(curX) + 'px)';
    }

    // One eased chase along the curve, so the dot stays on the line and a new
    // target simply redirects it mid-move
    function glide() {
        var gap = goalX - curX;
        if (calm || Math.abs(gap) < 0.4) { curX = goalX; place(); raf = 0; return; }
        curX += gap * 0.24;
        place();
        raf = requestAnimationFrame(glide);
    }

    function update(x) {
        var i = shown();
        var active = i !== null;
        var wasActive = root.hasAttribute('data-active');
        flag('data-active', active);
        flag('data-pinned', pinned !== null);
        flag('data-pinned-rain', pinned === TROUGH);
        flag('data-rain', active && i >= RAIN[0] && i <= RAIN[1]);

        var value = String(MBPS[active ? i : LAST]);
        for (var d = 0; d < 3; d++) digits[d].style.transform = 'translateY(' + (-value[d] * 10) + '%)';

        var text = active ? HOURS[i] : 'Now';
        if (text !== shownLabel) {
            shownLabel = text;
            label.textContent = text;
        }

        if (pts.length) {
            goalX = x !== undefined ? x : pts[active ? i : LAST].x;
            // Appearing from nothing: start at the target rather than sliding in
            if (active && !wasActive) { curX = goalX; place(); }
            if (active && !raf) raf = requestAnimationFrame(glide);
        }

        var at = active ? i : LAST;
        plot.setAttribute('aria-valuenow', at);
        plot.setAttribute('aria-valuetext', (active ? HOURS[i] : 'Now') + ', ' + value + ' Mbps' + (root.hasAttribute('data-rain') ? ', heavy rain, still online' : ', online'));
        chip.setAttribute('aria-pressed', String(pinned === TROUGH));
    }

    function stopAttract() {
        timers.forEach(clearTimeout);
        timers = [];
        if (attract !== null) { attract = null; update(); }
    }

    function step(by) {
        var i = shown();
        var at = i === null ? LAST + 1 : i;
        hover = null;
        var to = at + by;
        if (to < 0) return;
        pinned = to > LAST ? null : to;
        update();
    }

    // Pointer: hover previews, a click or a drag pins, clicking the pin frees it
    var downX = null, moved = false;
    function track(e) {
        if (!pts.length) return;
        var r = plot.getBoundingClientRect();
        var x = Math.max(pts[0].x, Math.min(pts[LAST].x, e.clientX - r.left));
        var near = 0;
        for (var i = 1; i < pts.length; i++) {
            if (Math.abs(pts[i].x - x) < Math.abs(pts[near].x - x)) near = i;
        }
        hover = near;
        update(x);
    }

    plot.addEventListener('pointermove', function (e) {
        if (downX !== null && Math.abs(e.clientX - downX) > 6) moved = true;
        if (e.pointerType === 'mouse' || downX !== null) track(e);
    });
    plot.addEventListener('pointerdown', function (e) {
        downX = e.clientX;
        moved = false;
        track(e);
    });
    plot.addEventListener('pointerup', function (e) {
        if (downX === null) return;
        downX = null;
        pinned = pinned === hover && !moved ? null : hover;
        if (e.pointerType !== 'mouse') hover = null;
        update();
    });
    plot.addEventListener('pointercancel', function () {
        downX = null;
        hover = null;
        update();
    });
    plot.addEventListener('pointerleave', function () {
        downX = null;
        hover = null;
        update();
    });

    plot.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowLeft' || k === 'ArrowDown') step(-1);
        else if (k === 'ArrowRight' || k === 'ArrowUp') step(1);
        else if (k === 'Home') { pinned = 0; update(); }
        else if (k === 'End' || k === 'Escape') { pinned = null; update(); }
        else return;
        e.preventDefault();
    });

    // The chip sits on the chart, so it must not also scrub or pin
    ['pointerdown', 'pointerup', 'pointermove'].forEach(function (t) {
        chip.addEventListener(t, function (e) { e.stopPropagation(); });
    });
    chip.addEventListener('pointerenter', function () {
        downX = null;
        hover = null;
        update();
    });

    chip.addEventListener('click', function () {
        hover = null;
        pinned = pinned === TROUGH ? null : TROUGH;
        update();
    });

    root.addEventListener('pointerenter', stopAttract);
    root.addEventListener('pointerdown', stopAttract);
    root.addEventListener('keydown', stopAttract);

    new ResizeObserver(draw).observe(plot);
    draw();
    update();
    host.classList.add('is-ready');

    // First time on screen: the line draws in, then one sweep through the storm
    // shows that the thing is alive. Any touch cancels it.
    var seen = new IntersectionObserver(function (entries) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        seen.disconnect();
        root.classList.add('is-drawn');
        if (calm) return;
        timers.push(setTimeout(function () { attract = TROUGH; update(); }, 1500));
        timers.push(setTimeout(function () { attract = null; update(); }, 3600));
    }, { threshold: 0.5 });
    seen.observe(root);
})();

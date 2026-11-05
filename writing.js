// Writing pages: builds the contents rail from the article's h2s and tracks the
// section being read.
(function () {
    var prose = document.querySelector('.prose');
    if (!prose) return;

    function slug(text) {
        return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function initContents() {
        var nav = document.querySelector('.toc');
        var title = document.querySelector('.article-head h1');
        var headings = Array.prototype.slice.call(prose.querySelectorAll('h2'));
        if (!nav || !title || headings.length < 2) return;

        var list = document.createElement('ul');
        var marker = document.createElement('span');
        marker.className = 'toc-marker';
        marker.setAttribute('aria-hidden', 'true');
        list.appendChild(marker);

        var links = headings.map(function (heading) {
            if (!heading.id) heading.id = slug(heading.textContent);
            var item = document.createElement('li');
            var link = document.createElement('a');
            link.href = '#' + heading.id;
            link.textContent = heading.textContent;
            item.appendChild(link);
            list.appendChild(item);
            return link;
        });
        nav.appendChild(list);

        var current = -1;
        var queued = false;

        function moveMarker(index) {
            if (index < 0) {
                marker.classList.remove('is-live');
                return;
            }
            var item = links[index].parentNode;
            marker.style.transform = 'translateY(' + item.offsetTop + 'px) scaleY(' + item.offsetHeight + ')';
            // First appearance fades in place; only later moves travel the rail
            if (!marker.classList.contains('is-live')) {
                marker.getBoundingClientRect();
                marker.classList.add('is-live');
            }
        }

        function update() {
            queued = false;
            var line = 120;
            var atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
            var active = -1;
            headings.forEach(function (heading, index) {
                if (heading.getBoundingClientRect().top <= line) active = index;
            });
            if (atEnd) {
                // Short last sections can't reach the line, so the page end claims
                // the last heading, unless a contents link just went somewhere else
                var target = headings.filter(function (heading) {
                    return '#' + heading.id === location.hash;
                })[0];
                active = target && target.getBoundingClientRect().top < window.innerHeight
                    ? headings.indexOf(target)
                    : headings.length - 1;
            }

            nav.classList.toggle('is-scrolled', title.getBoundingClientRect().bottom < 48);

            if (active === current) return;
            if (current >= 0) links[current].removeAttribute('aria-current');
            if (active >= 0) links[active].setAttribute('aria-current', 'true');
            current = active;
            moveMarker(active);
        }

        function queue() {
            if (queued) return;
            queued = true;
            requestAnimationFrame(update);
        }

        window.addEventListener('scroll', queue, { passive: true });
        window.addEventListener('resize', function () {
            moveMarker(current);
            queue();
        });
        update();
    }

    initContents();
})();

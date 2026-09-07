(function () {
  var widget = document.getElementById('pp-widget');
  var panel = document.getElementById('pp-panel');
  var pill = document.querySelector('.pp-tabs-pill');
  var tabs = document.querySelectorAll('.pp-tab');
  if (!widget || !panel || !tabs.length) return;

  var DATA = {
    petrol: [
      { iso: 'sg', name: 'Singapore', sub: 'Caltex · Regular', price: '3.37 SGD', pct: 0, href: 'https://petrolprice.xyz/fuel-prices/singapore' },
      { iso: 'us', name: 'United States', sub: 'California · Regular', price: '1.10 USD', pct: 2.1, href: 'https://petrolprice.xyz/fuel-prices/united-states' },
      { iso: 'gb', name: 'United Kingdom', sub: 'National · Regular', price: '1.62 GBP', pct: 0, href: 'https://petrolprice.xyz/fuel-prices/united-kingdom' },
      { iso: 'de', name: 'Germany', sub: 'National · Regular', price: '2.24 EUR', pct: -0.4, href: 'https://petrolprice.xyz/fuel-prices/germany' },
      { iso: 'jp', name: 'Japan', sub: 'National · Premium', price: '169.90 JPY', pct: null, href: 'https://petrolprice.xyz/fuel-prices/japan' },
      { iso: 'in', name: 'India', sub: 'Delhi · Premium', price: '107.73 INR', pct: null, href: 'https://petrolprice.xyz/fuel-prices/india' },
      { iso: 'au', name: 'Australia', sub: 'NSW · Regular', price: '2.02 AUD', pct: 0.3, href: 'https://petrolprice.xyz/fuel-prices/australia' }
    ],
    diesel: [
      { iso: 'sg', name: 'Singapore', sub: 'Caltex · Diesel', price: '3.95 SGD', pct: 0.5, href: 'https://petrolprice.xyz/fuel-prices/singapore' },
      { iso: 'us', name: 'United States', sub: 'California · Diesel', price: '1.25 USD', pct: 1.8, href: 'https://petrolprice.xyz/fuel-prices/united-states' },
      { iso: 'gb', name: 'United Kingdom', sub: 'National · Diesel', price: '1.78 GBP', pct: 0, href: 'https://petrolprice.xyz/fuel-prices/united-kingdom' },
      { iso: 'de', name: 'Germany', sub: 'National · Diesel', price: '2.05 EUR', pct: -0.2, href: 'https://petrolprice.xyz/fuel-prices/germany' },
      { iso: 'jp', name: 'Japan', sub: 'National · Diesel', price: '155.20 JPY', pct: null, href: 'https://petrolprice.xyz/fuel-prices/japan' },
      { iso: 'in', name: 'India', sub: 'Delhi · Diesel', price: '96.50 INR', pct: null, href: 'https://petrolprice.xyz/fuel-prices/india' },
      { iso: 'au', name: 'Australia', sub: 'NSW · Diesel', price: '2.18 AUD', pct: 0.1, href: 'https://petrolprice.xyz/fuel-prices/australia' }
    ],
    electricity: [
      { iso: 'sg', name: 'Singapore', sub: 'SP Group · Household', price: '0.2912 SGD', pct: 0, href: 'https://petrolprice.xyz/electricity/singapore' },
      { iso: 'us', name: 'United States', sub: 'EIA · Household', price: '0.1689 USD', pct: 0.6, href: 'https://petrolprice.xyz/electricity/usa' },
      { iso: 'gb', name: 'United Kingdom', sub: 'Ofgem · Household', price: '0.2776 GBP', pct: -0.3, href: 'https://petrolprice.xyz/electricity/uk' },
      { iso: 'de', name: 'Germany', sub: 'Bundesnetzagentur · Household', price: '0.3715 EUR', pct: 0, href: 'https://petrolprice.xyz/electricity/germany' },
      { iso: 'jp', name: 'Japan', sub: 'EGC · Household', price: '36.65 JPY', pct: null, href: 'https://petrolprice.xyz/electricity/japan' },
      { iso: 'in', name: 'India', sub: 'CERC · Household', price: '7.50 INR', pct: null, href: 'https://petrolprice.xyz/electricity/india' },
      { iso: 'au', name: 'Australia', sub: 'AER · Household', price: '0.3245 AUD', pct: 0.2, href: 'https://petrolprice.xyz/electricity/australia' }
    ]
  };

  var activeTab = 'petrol';

  function formatPct(pct) {
    if (pct == null || !Number.isFinite(pct)) return null;
    var abs = Math.abs(pct);
    if (abs < 0.05) return { text: '0.0%', cls: 'is-flat' };
    var sign = pct > 0 ? '+' : '−';
    return { text: sign + abs.toFixed(1) + '%', cls: pct < 0 ? 'is-down' : 'is-up' };
  }

  function movePill(tabEl, animate) {
    if (!pill || !tabEl) return;
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

  function renderRow(item) {
    var row = document.createElement('a');
    row.className = 'pp-row';
    row.href = item.href;
    row.target = '_blank';
    row.rel = 'noopener noreferrer';

    var flag = document.createElement('span');
    flag.className = 'pp-flag';
    flag.setAttribute('aria-hidden', 'true');
    var fi = document.createElement('span');
    fi.className = 'fi fi-' + item.iso + ' fis';
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
    var price = document.createElement('span');
    price.className = 'pp-price';
    price.textContent = item.price;
    quote.appendChild(price);

    var pct = document.createElement('span');
    var formatted = formatPct(item.pct);
    if (!formatted) {
      pct.className = 'pp-pct is-empty is-flat';
      pct.textContent = '0.0%';
      pct.setAttribute('aria-hidden', 'true');
    } else {
      pct.className = 'pp-pct ' + formatted.cls;
      pct.textContent = formatted.text;
    }
    quote.appendChild(pct);

    row.appendChild(flag);
    row.appendChild(meta);
    row.appendChild(quote);
    return row;
  }

  function paint(tab, animatePill) {
    activeTab = tab;
    var rows = DATA[tab] || [];
    panel.replaceChildren();
    for (var i = 0; i < rows.length; i++) {
      panel.appendChild(renderRow(rows[i]));
    }

    for (var j = 0; j < tabs.length; j++) {
      var selected = tabs[j].dataset.tab === tab;
      tabs[j].setAttribute('aria-selected', selected ? 'true' : 'false');
      if (selected) movePill(tabs[j], animatePill);
    }
  }

  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      var next = this.dataset.tab;
      if (!next || next === activeTab) return;
      paint(next, true);
    });
  }

  paint('petrol', false);
  window.addEventListener('resize', function () {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('aria-selected') === 'true') {
        movePill(tabs[i], false);
        break;
      }
    }
  });
})();

(function () {
  const Home = window.IoriHome = window.IoriHome || {};

  Home.createCardController = function () {
    const initialCards = document.querySelectorAll('.site-card.card-anim-enter');
    const sitesGrid = document.getElementById('sitesGrid');
    const defaultCardConfig = {
      hideDesc: false,
      hideLinks: false,
      hideCategory: false,
      hideCopyText: false,
      enableFrostedGlass: false,
      cardStyle: 'style1',
      cardAnimation: 'radial',
      gridCols: '4',
      aboveFoldImageCount: 8,
      baseCardClass: 'site-card group h-full flex flex-col bg-white border border-primary-100/60 shadow-sm overflow-hidden dark:bg-gray-800 dark:border-gray-700',
      frostedClass: '',
      cardStyleClass: '',
      titleClass: 'site-title text-base font-medium text-gray-900 dark:text-gray-100 truncate transition-all duration-300 origin-left',
      descClass: 'mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2',
      categoryClass: 'site-category inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-secondary-100 text-primary-700 dark:bg-secondary-800 dark:text-primary-300',
      linkRowClass: 'mt-3 flex items-center justify-between',
      urlTextClass: 'text-xs text-primary-600 dark:text-primary-400 truncate flex-1 min-w-0 mr-2',
      copyButtonBaseClass: 'copy-btn relative flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors',
      copyButtonEnabledClass: 'bg-accent-100 text-accent-700 hover:bg-accent-200 dark:bg-accent-900/30 dark:text-accent-300 dark:hover:bg-accent-900/50',
      copyButtonDisabledClass: 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500',
      logoClass: 'w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-700',
      siteIconClass: 'site-icon flex-shrink-0 mr-4 transition-all duration-300',
    };
    const cardConfigSets = window.IORI_CARD_CONFIGS || {
      desktop: window.IORI_CARD_CONFIG || defaultCardConfig,
      mobile: window.IORI_CARD_CONFIG || defaultCardConfig,
    };
    const cardAnimationTypes = ['slideUp', 'radial', 'fadeIn', 'slideLeft', 'slideRight', 'convergeIn', 'flipIn'];
    const cardAnimationClasses = cardAnimationTypes.map(type => `card-anim-${type}`);
    const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const mobileCardQuery = window.matchMedia?.('(max-width: 767px)');
    let activeCardDevice = '';
    let cardConfig = getActiveCardConfig();
    let activeRenderedCatalogId = window.IORI_LAYOUT_CONFIG?.ssrCatalogId && window.IORI_LAYOUT_CONFIG.ssrCatalogId !== 'all'
      ? String(window.IORI_LAYOUT_CONFIG.ssrCatalogId)
      : null;

    function getCardDevice() {
      return mobileCardQuery?.matches ? 'mobile' : 'desktop';
    }

    function buildCategoryLookup() {
      const cats = window.IORI_CATEGORIES || [];
      const byId = new Map();
      const childrenMap = new Map();
      cats.forEach(c => {
        byId.set(c.id, c);
        const pid = c.parent_id || 0;
        if (!childrenMap.has(pid)) childrenMap.set(pid, []);
        childrenMap.get(pid).push(c.id);
      });
      return { byId, childrenMap };
    }

    function getDescendantIds(catalogId) {
      const { childrenMap } = buildCategoryLookup();
      const ids = [catalogId];
      const stack = [catalogId];
      while (stack.length > 0) {
        const current = stack.pop();
        (childrenMap.get(current) || []).forEach(childId => { ids.push(childId); stack.push(childId); });
      }
      return ids;
    }

    function buildClientGroupedData(sites) {
      const { byId } = buildCategoryLookup();
      const cats = window.IORI_CATEGORIES || [];
      const siteMap = new Map();
      sites.forEach(site => {
        const cid = Number(site.catelog_id);
        if (!siteMap.has(cid)) siteMap.set(cid, []);
        siteMap.get(cid).push(site);
      });
      const groups = [];
      const visited = new Set();
      function collectGroups(parentId) {
        cats.filter(c => (c.parent_id || 0) === parentId)
          .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999) || a.id - b.id)
          .forEach(cat => {
            if (siteMap.has(cat.id) && !visited.has(cat.id)) {
              visited.add(cat.id);
              groups.push({ categoryName: cat.name, categoryId: cat.id, sites: siteMap.get(cat.id) });
            }
            collectGroups(cat.id);
          });
      }
      collectGroups(0);
      siteMap.forEach((catSites, cid) => {
        if (!visited.has(cid)) {
          const cat = byId.get(cid);
          groups.push({ categoryName: cat ? cat.name : '未分类', categoryId: cid, sites: catSites });
        }
      });
      return groups;
    }

    function isGroupedData(data) {
      return Array.isArray(data) && data.length > 0 && data[0].categoryName !== undefined;
    }

    function getActiveCardConfig() {
      const device = getCardDevice();
      activeCardDevice = device;
      return cardConfigSets[device] || cardConfigSets.desktop || window.IORI_CARD_CONFIG || defaultCardConfig;
    }

    function getSitesForCatalog(catalogId) {
      const allSites = window.IORI_SITES || [];
      if (!catalogId) return buildClientGroupedData(allSites);
      const { childrenMap } = buildCategoryLookup();
      const catId = Number(catalogId);
      if ((childrenMap.get(catId) || []).length === 0) {
        return allSites.filter(site => String(site.catelog_id) === String(catalogId));
      }
      const descendantIds = getDescendantIds(catId);
      const filteredSites = allSites.filter(site => descendantIds.includes(Number(site.catelog_id)));
      return buildClientGroupedData(filteredSites);
    }

    function applyCardGridColumns() {
      if (!sitesGrid || getCardDevice() !== 'mobile') return;
      const cols = String(cardConfig.gridCols || '2');
      const mobileGridClass = cols === '1' ? 'grid-cols-1' : (cols === '3' ? 'grid-cols-3' : 'grid-cols-2');
      const mobileCardStyleClass = cardConfig.cardStyle === 'style3'
        ? 'mobile-card-style3'
        : (cardConfig.cardStyle === 'style2' || cardConfig.cardStyle === 'style4' || cardConfig.cardStyle === 'style5' ? 'mobile-card-style2' : 'mobile-card-style1');
      sitesGrid.classList.remove('grid-cols-1', 'grid-cols-2', 'grid-cols-3');
      sitesGrid.classList.remove('mobile-card-style1', 'mobile-card-style2', 'mobile-card-style3');
      sitesGrid.classList.add(mobileGridClass);
      sitesGrid.classList.add(mobileCardStyleClass);
    }

    function syncCardConfigForViewport(options = {}) {
      const device = getCardDevice();
      const nextConfig = cardConfigSets[device] || cardConfigSets.desktop || defaultCardConfig;
      if (!options.force && device === activeCardDevice && nextConfig === cardConfig) return;

      activeCardDevice = device;
      cardConfig = nextConfig;
      applyCardGridColumns();
      renderSites(getSitesForCatalog(activeRenderedCatalogId));
      Home.reapplyLocalSearchFilter?.();
    }

    function prefersReducedCardMotion() {
      return reducedMotionQuery?.matches === true;
    }

    function resolveCardAnimationName() {
      const configured = cardConfig.cardAnimation || window.IORI_LAYOUT_CONFIG?.cardAnimation || 'radial';
      if (configured === 'random') {
        return cardAnimationTypes[Math.floor(Math.random() * cardAnimationTypes.length)];
      }
      return cardAnimationTypes.includes(configured) ? configured : 'radial';
    }

    function getAnimationColumnCount() {
      const templateColumns = sitesGrid ? window.getComputedStyle(sitesGrid).gridTemplateColumns : '';
      if (templateColumns && templateColumns !== 'none') {
        const renderedCols = templateColumns.trim().split(/\s+/).filter(Boolean).length;
        if (renderedCols > 0) return renderedCols;
      }

      const configuredCols = String(cardConfig.gridCols || window.IORI_LAYOUT_CONFIG?.gridCols || (getCardDevice() === 'mobile' ? '2' : '4'));
      const width = window.innerWidth;
      if (width < 768) {
        const mobileCols = Number(configuredCols);
        return Number.isFinite(mobileCols) && mobileCols > 0 ? mobileCols : 2;
      }
      if (width < 1024) return 3;

      if (getCardDevice() === 'mobile') {
        const mobileCols = Number(configuredCols);
        return Number.isFinite(mobileCols) && mobileCols > 0 ? mobileCols : 2;
      }
      if (configuredCols === '6') return width >= 1200 ? 6 : 5;
      if (configuredCols === '7') return width >= 1280 ? 7 : 5;

      const cols = Number(configuredCols);
      return Number.isFinite(cols) && cols > 0 ? cols : 4;
    }

    function getCardAnimationDelay(index, animationType) {
      const cols = getAnimationColumnCount();
      const row = Math.floor(index / cols);
      const col = index % cols;
      const centerCol = (cols - 1) / 2;
      let delay = 0;

      if (animationType === 'radial') {
        delay = (Math.abs(col - centerCol) + row) * 80;
      } else if (animationType === 'fadeIn') {
        delay = Math.random() * 500;
      } else if (animationType === 'slideLeft') {
        delay = row * 100;
      } else if (animationType === 'slideRight') {
        delay = (row + (cols - col - 1) * 0.02) * 80;
      } else if (animationType === 'convergeIn') {
        const maxDistance = Math.max(centerCol, cols - centerCol - 1);
        delay = (maxDistance - Math.abs(col - centerCol)) * 80;
      } else if (animationType === 'flipIn') {
        delay = (row + col) * 60;
      } else {
        delay = index * 50;
      }

      return Math.min(delay, 1000);
    }

    function prepareCardAnimation(card, index, animationType) {
      const cols = getAnimationColumnCount();
      const col = index % cols;
      const centerCol = (cols - 1) / 2;

      cardAnimationClasses.forEach(className => card.classList.remove(className));
      card.classList.remove('card-anim-flip-settle', 'card-anim-flip-settle-fade');
      card.style.removeProperty('--card-anim-x');
      card.style.removeProperty('--card-anim-y');

      if (animationType === 'convergeIn') {
        const offset = col - centerCol;
        const distance = Math.abs(offset);
        const isCenter = distance <= 0.5;
        const x = isCenter ? 0 : Math.sign(offset) * Math.min(80, 28 + distance * 22);
        const y = isCenter ? -30 : 0;
        card.style.setProperty('--card-anim-x', `${x}px`);
        card.style.setProperty('--card-anim-y', `${y}px`);
      }

      card.classList.add(`card-anim-${animationType}`);

      const delay = getCardAnimationDelay(index, animationType);
      if (delay > 0) {
        card.style.animationDelay = `${delay}ms`;
      } else {
        card.style.removeProperty('animation-delay');
      }
    }

    function cleanupCardAnimation(card) {
      const wasFlipIn = card.classList.contains('card-anim-flipIn');
      card.classList.add('card-anim-cleanup');
      if (wasFlipIn) {
        card.classList.add('card-anim-flip-settle');
      }
      card.classList.remove('card-anim-enter');
      cardAnimationClasses.forEach(className => card.classList.remove(className));
      card.style.removeProperty('--card-anim-x');
      card.style.removeProperty('--card-anim-y');
      card.style.removeProperty('animation-delay');
      window.requestAnimationFrame(() => {
        card.classList.remove('card-anim-cleanup');
        if (!wasFlipIn) return;
        card.classList.add('card-anim-flip-settle-fade');
        window.setTimeout(() => {
          card.classList.remove('card-anim-flip-settle', 'card-anim-flip-settle-fade');
        }, 160);
      });
    }

    function bindCardAnimationCleanup(card) {
      if (prefersReducedCardMotion()) {
        cleanupCardAnimation(card);
        return;
      }

      let isCleaned = false;
      let fallbackTimer = null;

      const cleanup = () => {
        if (isCleaned) return;
        isCleaned = true;
        cleanupCardAnimation(card);
        card.removeEventListener('animationend', handleAnimationEnd);
        if (fallbackTimer) window.clearTimeout(fallbackTimer);
      };

      const handleAnimationEnd = (event) => {
        if (event.target !== card) return;
        cleanup();
      };

      const delayMs = Number.parseFloat(card.style.animationDelay) || 0;
      fallbackTimer = window.setTimeout(cleanup, delayMs + 900);
      card.addEventListener('animationend', handleAnimationEnd);
    }

    function animateCardBatch(cards) {
      const animationType = resolveCardAnimationName();
      cards.forEach((card, index) => prepareCardAnimation(card, index, animationType));
    }

    function createSingleCard(site, index, animationType, isStyle5, logoSize) {
      const isAboveFold = index < (cardConfig.aboveFoldImageCount || 8);
      const imgLoadingAttrs = isAboveFold ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';

      if (isStyle5) {
        const accentIdx = (site.id || index) % 6;
        const logoHtml5 = site.logoUrlHtml
          ? `<img src="${site.logoUrlHtml}" alt="${site.nameHtml}" class="card-logo-img" ${imgLoadingAttrs}>`
          : `<div class="card-logo-img rounded-xl bg-primary-600 flex items-center justify-center text-white font-semibold text-2xl shadow-inner">${site.cardInitialHtml}</div>`;
        const descHtml5 = cardConfig.hideDesc ? '' : `<p class="${cardConfig.descClass}" title="${site.descHtml}">${site.descHtml}</p>`;
        const categoryHtml5 = cardConfig.hideCategory ? '' : `<span class="${cardConfig.categoryClass}">${site.catalogHtml}</span>`;
        const card5 = document.createElement('div');
        card5.className = `${cardConfig.baseCardClass} ${cardConfig.frostedClass} style-5 card-accent-${accentIdx} card-anim-enter`;
        prepareCardAnimation(card5, index, animationType);
        bindCardAnimationCleanup(card5);
        card5.setAttribute('data-id', site.id);
        card5.innerHTML = `<div class="card-accent-bar"></div><div class="card-logo-wrap">${logoHtml5}</div><div class="site-card-content"><div class="card-body-area"><h3 class="${cardConfig.titleClass}">${site.nameHtml}</h3><div class="card-meta">${categoryHtml5}</div>${descHtml5}</div><a href="${site.urlHtml || '#'}" ${site.hasValidUrl ? 'target="_blank" rel="noopener noreferrer"' : ''} class="card-visit-btn">访问网站</a></div>`;
        return card5;
      }

      const logoHtml = site.logoUrlHtml
        ? `<img src="${site.logoUrlHtml}" alt="${site.nameHtml}" width="${logoSize}" height="${logoSize}" class="${cardConfig.logoClass}" ${imgLoadingAttrs}>`
        : `<div class="${cardConfig.logoClass} bg-primary-600 flex items-center justify-center text-white font-semibold ${logoSize === '104' ? 'text-2xl' : 'text-lg'} shadow-inner">${site.cardInitialHtml}</div>`;
      const descHtml = cardConfig.hideDesc ? '' : `<p class="${cardConfig.descClass}" title="${site.descHtml}">${site.descHtml}</p>`;
      const linksHtml = cardConfig.hideLinks ? '' : `<div class="${cardConfig.linkRowClass}"><span class="${cardConfig.urlTextClass}" title="${site.displayUrlHtml}">${site.displayUrlHtml}</span><button class="${cardConfig.copyButtonBaseClass} ${site.hasValidUrl ? cardConfig.copyButtonEnabledClass : cardConfig.copyButtonDisabledClass}" data-url="${site.urlHtml}" ${site.hasValidUrl ? '' : 'disabled'}><svg class="h-3 w-3 ${cardConfig.hideCopyText ? '' : 'mr-1'}"><use href="#icon-copy"/></svg>${cardConfig.hideCopyText ? '' : '<span class="copy-text">复制</span>'}<span class="copy-success hidden absolute -top-8 right-0 bg-accent-500 text-white text-xs px-2 py-1 rounded shadow-md">已复制!</span></button></div>`;
      const categoryHtml = cardConfig.hideCategory ? '' : `<span class="${cardConfig.categoryClass}">${site.catalogHtml}</span>`;
      const card = document.createElement('div');
      card.className = `${cardConfig.baseCardClass} ${cardConfig.frostedClass} ${cardConfig.cardStyleClass} card-anim-enter`;
      prepareCardAnimation(card, index, animationType);
      bindCardAnimationCleanup(card);
      card.setAttribute('data-id', site.id);
      card.innerHTML = `<div class="site-card-content"><a href="${site.urlHtml || '#'}" ${site.hasValidUrl ? 'target="_blank" rel="noopener noreferrer"' : ''} class="block"><div class="flex items-start"><div class="${cardConfig.siteIconClass}">${logoHtml}</div><div class="flex-1 min-w-0"><h3 class="${cardConfig.titleClass}" title="${site.nameHtml}">${site.nameHtml}</h3>${categoryHtml}</div></div>${descHtml}</a>${linksHtml}</div>`;
      return card;
    }

    function renderGroupedSites(groups) {
      if (!sitesGrid) return;
      applyCardGridColumns();
      Home.clearSearchCardCache?.();
      sitesGrid.innerHTML = '';
      if (!groups || groups.length === 0) {
        sitesGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">本分类下暂无书签</div>';
        return;
      }
      const animationType = resolveCardAnimationName();
      const isStyle5 = cardConfig.cardStyle === 'style5';
      const logoSize = (cardConfig.cardStyle === 'style4' || isStyle5) ? '104' : '40';
      let globalIndex = 0;
      groups.forEach((group, groupIndex) => {
        if (!group.sites || group.sites.length === 0) return;
        const heading = document.createElement('div');
        heading.className = 'category-section-heading col-span-full' + (groupIndex > 0 ? ' mt-6' : '');
        heading.innerHTML = '<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">' + group.categoryName + '<span class="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">' + group.sites.length + ' 个</span></h3>';
        sitesGrid.appendChild(heading);
        group.sites.forEach(site => {
          sitesGrid.appendChild(createSingleCard(site, globalIndex, animationType, isStyle5, logoSize));
          globalIndex++;
        });
      });
    }

    function renderSites(sites) {
      if (!sitesGrid) return;

      applyCardGridColumns();
      Home.clearSearchCardCache?.();

      sitesGrid.innerHTML = '';

      if (isGroupedData(sites)) {
        renderGroupedSites(sites);
        return;
      }

      if (sites.length === 0) {
        sitesGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">本分类下暂无书签</div>';
        return;
      }

      const animationType = resolveCardAnimationName();

      const isStyle5 = cardConfig.cardStyle === 'style5';
      const logoSize = (cardConfig.cardStyle === 'style4' || isStyle5) ? '104' : '40';

      sites.forEach((site, index) => {
        const isAboveFold = index < (cardConfig.aboveFoldImageCount || 8);
        const imgLoadingAttrs = isAboveFold ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';

        // 风格五：pcdd.in 风格 — 上色块 + 大Logo + 访问按钮
        if (isStyle5) {
          const accentIdx = (site.id || index) % 6;
          const logoHtml5 = site.logoUrlHtml
            ? `<img src="${site.logoUrlHtml}" alt="${site.nameHtml}" class="card-logo-img" ${imgLoadingAttrs}>`
            : `<div class="card-logo-img rounded-xl bg-primary-600 flex items-center justify-center text-white font-semibold text-2xl shadow-inner">${site.cardInitialHtml}</div>`;
          const descHtml5 = cardConfig.hideDesc ? '' : `<p class="${cardConfig.descClass}" title="${site.descHtml}">${site.descHtml}</p>`;
          const categoryHtml5 = cardConfig.hideCategory ? '' : `<span class="${cardConfig.categoryClass}">${site.catalogHtml}</span>`;
          const card5 = document.createElement('div');
          card5.className = `${cardConfig.baseCardClass} ${cardConfig.frostedClass} style-5 card-accent-${accentIdx} card-anim-enter`;
          prepareCardAnimation(card5, index, animationType);
          bindCardAnimationCleanup(card5);
          card5.setAttribute('data-id', site.id);
          card5.innerHTML = `
          <div class="card-accent-bar"></div>
          <div class="card-logo-wrap">${logoHtml5}</div>
          <div class="site-card-content">
            <div class="card-body-area">
              <h3 class="${cardConfig.titleClass}">${site.nameHtml}</h3>
              <div class="card-meta">${categoryHtml5}</div>
              ${descHtml5}
            </div>
            <a href="${site.urlHtml || '#'}" ${site.hasValidUrl ? 'target="_blank" rel="noopener noreferrer"' : ''} class="card-visit-btn">访问网站</a>
          </div>`;
          sitesGrid.appendChild(card5);
          return;
        }

        const logoHtml = site.logoUrlHtml
          ? `<img src="${site.logoUrlHtml}" alt="${site.nameHtml}" width="${logoSize}" height="${logoSize}" class="${cardConfig.logoClass}" ${imgLoadingAttrs}>`
          : `<div class="${cardConfig.logoClass} bg-primary-600 flex items-center justify-center text-white font-semibold ${logoSize === '104' ? 'text-2xl' : 'text-lg'} shadow-inner">${site.cardInitialHtml}</div>`;

        const descHtml = cardConfig.hideDesc ? '' : `<p class="${cardConfig.descClass}" title="${site.descHtml}">${site.descHtml}</p>`;

        const linksHtml = cardConfig.hideLinks ? '' : `
          <div class="${cardConfig.linkRowClass}">
            <span class="${cardConfig.urlTextClass}" title="${site.displayUrlHtml}">${site.displayUrlHtml}</span>
            <button class="${cardConfig.copyButtonBaseClass} ${site.hasValidUrl ? cardConfig.copyButtonEnabledClass : cardConfig.copyButtonDisabledClass}" data-url="${site.urlHtml}" ${site.hasValidUrl ? '' : 'disabled'}>
              <svg class="h-3 w-3 ${cardConfig.hideCopyText ? '' : 'mr-1'}"><use href="#icon-copy"/></svg>
              ${cardConfig.hideCopyText ? '' : '<span class="copy-text">复制</span>'}
              <span class="copy-success hidden absolute -top-8 right-0 bg-accent-500 text-white text-xs px-2 py-1 rounded shadow-md">已复制!</span>
            </button>
          </div>`;

        const categoryHtml = cardConfig.hideCategory ? '' : `
                <span class="${cardConfig.categoryClass}">
                  ${site.catalogHtml}
                </span>`;

        const card = document.createElement('div');
        card.className = `${cardConfig.baseCardClass} ${cardConfig.frostedClass} ${cardConfig.cardStyleClass} card-anim-enter`;
        prepareCardAnimation(card, index, animationType);
        bindCardAnimationCleanup(card);

        card.setAttribute('data-id', site.id);

        card.innerHTML = `
        <div class="site-card-content">
          <a href="${site.urlHtml || '#'}" ${site.hasValidUrl ? 'target="_blank" rel="noopener noreferrer"' : ''} class="block">
            <div class="flex items-start">
              <div class="${cardConfig.siteIconClass}">
                ${logoHtml}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="${cardConfig.titleClass}" title="${site.nameHtml}">${site.nameHtml}</h3>
                ${categoryHtml}
              </div>
            </div>
            ${descHtml}
          </a>
          ${linksHtml}
        </div>
        `;

        sitesGrid.appendChild(card);
      });
    }

    function init() {
      animateCardBatch(initialCards);
      initialCards.forEach((card) => {
        bindCardAnimationCleanup(card);
      });

      mobileCardQuery?.addEventListener('change', () => {
        syncCardConfigForViewport();
      });

      if (getCardDevice() === 'mobile') {
        syncCardConfigForViewport({ force: true });
      }
    }

    return {
      init,
      renderSites,
      getSitesForCatalog,
      setActiveCatalogId(catalogId) {
        activeRenderedCatalogId = catalogId ? String(catalogId) : null;
      },
    };
  };
})();

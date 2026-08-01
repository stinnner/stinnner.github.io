(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const THEME_KEY = "tj-theme";

  /* Night paper toggle */
  const root = document.documentElement;
  const getTheme = () => root.getAttribute("data-theme") === "night" ? "night" : "day";

  const applyTheme = (theme, { persist = true } = {}) => {
    const next = theme === "night" ? "night" : "day";
    root.setAttribute("data-theme", next);
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (_) {
        /* ignore */
      }
    }
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      const night = next === "night";
      btn.setAttribute("aria-pressed", night ? "true" : "false");
      btn.setAttribute("aria-label", night ? "开灯，切换到日间纸色" : "关灯，切换到夜间纸色");
      btn.title = night ? "开灯" : "关灯";
    });
  };

  // Sync from storage / system if head script missed
  if (!root.getAttribute("data-theme")) {
    let initial = "day";
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "night" || saved === "day") initial = saved;
    } catch (_) {
      /* ignore */
    }
    applyTheme(initial, { persist: false });
  } else {
    applyTheme(getTheme(), { persist: false });
  }

  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTheme(getTheme() === "night" ? "day" : "night");
    });
  });

  /* Scroll progress */
  const progress = document.querySelector(".progress-rail > span");
  const updateProgress = () => {
    if (!progress) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  };

  /* Section / entry reveal */
  const revealTargets = document.querySelectorAll(
    ".section, .entry, .hero, .cover-figure, .overview, .regions, [data-reveal]"
  );

  if (reduceMotion) {
    revealTargets.forEach((el) => el.classList.add("is-inview"));
    document.documentElement.classList.add("reveal-ready");
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
    // Cover hero is above fold
    document.querySelectorAll(".hero").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
        el.classList.add("is-inview");
      }
    });
  } else {
    revealTargets.forEach((el) => el.classList.add("is-inview"));
  }

  /* Contents active state */
  const contentsLinks = Array.from(document.querySelectorAll(".contents a[href^='#']"));
  const sectionMap = contentsLinks
    .map((link) => {
      const id = link.getAttribute("href").slice(1);
      const section = document.getElementById(id);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  const pageIndicator = document.querySelector(".page-indicator .current");

  const setActive = () => {
    if (!sectionMap.length) return;
    let active = sectionMap[0];
    const y = window.scrollY + window.innerHeight * 0.28;
    sectionMap.forEach((item) => {
      if (item.section.offsetTop <= y) active = item;
    });
    sectionMap.forEach(({ link }) => link.classList.toggle("is-active", link === active.link));
    if (pageIndicator && active) {
      const label = active.link.dataset.label || active.link.textContent.trim();
      pageIndicator.textContent = label;
    }
  };

  window.addEventListener(
    "scroll",
    () => {
      updateProgress();
      setActive();
    },
    { passive: true }
  );
  updateProgress();
  setActive();

  /* Soft press feedback already in CSS; ensure focus rings on keyboard */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") document.documentElement.classList.add("using-keyboard");
  });

  /* Visitor counter offset (kept from original) */
  const bindCounter = (id, base, anchor) => {
    const element = document.getElementById(id);
    if (!element) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const raw = Number(element.textContent);
      if (Number.isFinite(raw) && element.textContent !== "--") {
        element.textContent = String(Math.max(base, base + raw - anchor));
        window.clearInterval(timer);
      } else if (attempts >= 150) {
        window.clearInterval(timer);
      }
    }, 100);
  };

  bindCounter("busuanzi_value_site_pv", 135, 9);
  bindCounter("busuanzi_value_page_pv", 35, 3);
})();

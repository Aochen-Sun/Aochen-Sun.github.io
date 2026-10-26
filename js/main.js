/*!
 * magazine — 交互脚本
 */
(function () {
    'use strict';

    var root = document.documentElement;

    /* ---------------------------------------------------------------- 主题切换 */
    var toggle = document.querySelector('[data-theme-toggle]');

    function syncToggleState() {
        if (!toggle) return;
        var isDark = root.classList.contains('dark');
        toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        toggle.setAttribute('aria-label', isDark ? '切换到浅色' : '切换到深色');
    }

    if (toggle) {
        syncToggleState();
        toggle.addEventListener('click', function () {
            var next = root.classList.contains('dark') ? 'light' : 'dark';
            root.classList.toggle('dark', next === 'dark');
            try {
                localStorage.setItem('theme', next);
            } catch (e) { /* 忽略隐私模式下的写入失败 */ }
            syncToggleState();
        });
    }

    /* ---------------------------------------------------------------- 阅读进度 */
    var progress = document.getElementById('progress');

    if (progress) {
        var ticking = false;

        function updateProgress() {
            var doc = document.documentElement;
            var max = doc.scrollHeight - doc.clientHeight;
            var ratio = max > 0 ? doc.scrollTop / max : 0;
            progress.style.width = Math.min(100, Math.max(0, ratio * 100)) + '%';
            ticking = false;
        }

        function onScroll() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateProgress);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        updateProgress();
    }

    /* ---------------------------------------------------------------- 目录高亮 */
    var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.tocbox a'));

    if (tocLinks.length && 'IntersectionObserver' in window) {
        var pairs = [];

        tocLinks.forEach(function (link) {
            var hash = link.getAttribute('href') || '';
            if (!hash || hash.charAt(0) !== '#') return;
            var id;
            try {
                id = decodeURIComponent(hash.slice(1));
            } catch (e) {
                id = hash.slice(1);
            }
            var heading = document.getElementById(id);
            if (heading) pairs.push({ link: link, heading: heading });
        });

        if (pairs.length) {
            function activate(activeLink) {
                tocLinks.forEach(function (link) {
                    link.classList.toggle('is-active', link === activeLink);
                });
            }

            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    for (var i = 0; i < pairs.length; i++) {
                        if (pairs[i].heading === entry.target) {
                            activate(pairs[i].link);
                            break;
                        }
                    }
                });
            }, {
                rootMargin: '-8% 0px -72% 0px',
                threshold: 0
            });

            pairs.forEach(function (pair) {
                observer.observe(pair.heading);
            });
        }
    }

    /* ------------------------------------------- 头条字号：短标题放大一档 */
    var leadTitle = document.querySelector('.lead__title');

    if (leadTitle) {
        var leadText = (leadTitle.textContent || '').trim();
        if (leadText && leadText.length <= 30) {
            leadTitle.classList.add('is-short');
        }
    }

    /* ------------------------------------------------- 外部链接补 rel（安全） */
    var host = window.location.hostname;

    Array.prototype.forEach.call(document.querySelectorAll('.prose a[href^="http"]'), function (link) {
        try {
            if (new URL(link.href).hostname === host) return;
        } catch (e) {
            return;
        }
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
})();

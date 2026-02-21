(function () {

    if (window.__AVIA_WEB_LOADED__) return;
    window.__AVIA_WEB_LOADED__ = true;

    const LINKTREE_URL = "https://linktr.ee/GermanAvaLilac";
    const STOAT_SERVER_URL = "https://stt.gg/GvBhcejB";

    function setIcon(button, type) {
        const oldSvg = button.querySelector('svg');
        if (oldSvg) oldSvg.remove();

        const icons = {
            monitor: "M3 4h18v12H3V4zm2 2v8h14V6H5zm3 12h8v2H8v-2z",
            upload: "M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h4.66V9h3.84L12 2z",
            refresh: "M17.65 6.35A7.95 7.95 0 0012 4V1L7 6l5 5V7a5 5 0 11-5 5H5a7 7 0 107.75-6.65z"
        };

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "currentColor");
        svg.style.marginRight = "8px";

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", icons[type]);
        svg.appendChild(path);

        button.insertBefore(svg, button.firstChild);
    }

    function injectButtons() {
        const appearanceBtn = Array.from(document.querySelectorAll('a'))
            .find(a => a.textContent.trim() === 'Appearance');
        if (!appearanceBtn) return;

        const targetBtn = document.querySelector(
            'a.pos_relative.min-w_0.d_flex.ai_center.p_6px_8px.bdr_8px.fw_500.me_12px.fs_15px.us_none.trs_background-color_0\\.1s_ease-in-out.c_var\\(\\--md-sys-color-on-surface\\).fill_var\\(\\--md-sys-color-on-surface\\).bg_unset'
        );
        if (!targetBtn) return;

        if (!document.getElementById('stoat-fake-linktree')) {
            const linktreeBtn = appearanceBtn.cloneNode(true);
            linktreeBtn.id = 'stoat-fake-linktree';
            const textNode = Array.from(linktreeBtn.querySelectorAll('div'))
                .find(d => d.children.length === 0 && d.textContent.trim() === 'Appearance');
            if (textNode) textNode.textContent = "(Avia) Ava's Linktree";
            setIcon(linktreeBtn, "monitor");
            linktreeBtn.addEventListener('click', () => window.open(LINKTREE_URL, "_blank"));
            targetBtn.parentElement.insertBefore(linktreeBtn, targetBtn);

            const stoatBtn = appearanceBtn.cloneNode(true);
            stoatBtn.id = 'stoat-fake-stoatserver';
            const stoatTextNode = Array.from(stoatBtn.querySelectorAll('div'))
                .find(d => d.children.length === 0 && d.textContent.trim() === 'Appearance');
            if (stoatTextNode) stoatTextNode.textContent = "(Avia) Stoat Server";
            setIcon(stoatBtn, "monitor");
            stoatBtn.addEventListener('click', () => window.open(STOAT_SERVER_URL, "_blank"));
            linktreeBtn.parentElement.insertBefore(stoatBtn, linktreeBtn.nextSibling);
        }

        if (!document.getElementById('stoat-fake-loadfont')) {
            const newBtn = appearanceBtn.cloneNode(true);
            newBtn.id = 'stoat-fake-loadfont';
            const textNode = Array.from(newBtn.querySelectorAll('div'))
                .find(d => d.children.length === 0);
            if (textNode) textNode.textContent = "(Avia) Font Loader";
            setIcon(newBtn, "upload");
            newBtn.addEventListener('click', loadFont);
            const stoatBtn = document.getElementById('stoat-fake-stoatserver');
            stoatBtn ? stoatBtn.parentElement.insertBefore(newBtn, stoatBtn.nextSibling) : document.getElementById('stoat-fake-linktree').parentElement.insertBefore(newBtn, document.getElementById('stoat-fake-linktree').nextSibling);

            if (!document.getElementById('stoat-fake-removefont')) {
                const removeBtn = appearanceBtn.cloneNode(true);
                removeBtn.id = 'stoat-fake-removefont';
                const removeTextNode = Array.from(removeBtn.querySelectorAll('div'))
                    .find(d => d.children.length === 0);
                if (removeTextNode) removeTextNode.textContent = "(Avia) Remove selected font";
                setIcon(removeBtn, "refresh");
                removeBtn.addEventListener('click', removeFont);
                newBtn.parentElement.insertBefore(removeBtn, newBtn.nextSibling);
            }
        }
    }

    function loadFont() {
        let savedUrl = localStorage.getItem('avia_custom_font_url');
        let url = savedUrl || prompt(
            "Paste your font link (.ttf, .otf, .woff, .woff2, .eot, or .css).\n\n⚠️ Warning: Loading a .css file could be dangerous because it may contain arbitrary code or styles that could affect your client. Only use trusted sources!"
        );
        if (!url) return;
        localStorage.setItem('avia_custom_font_url', url);
        applyFont(url);
        alert("Font Applied.");
    }

    function applyFont(url) {
        const fontName = "CustomFont" + Date.now();
        let styleTag = document.getElementById('custom-font-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'custom-font-style';
            document.head.appendChild(styleTag);
        }

        let ext = url.split('.').pop().toLowerCase();
        let formatMap = {
            ttf: 'truetype',
            otf: 'opentype',
            woff: 'woff',
            woff2: 'woff2',
            eot: 'embedded-opentype',
            css: 'truetype'
        };
        let format = formatMap[ext] || '';

        styleTag.textContent = `
            @font-face {
                font-family: '${fontName}';
                src: url('${url}')${format ? " format('" + format + "')" : ""};
                font-weight: normal;
                font-style: normal;
            }
            body, body *:not(.material-symbols-outlined) {
                font-family: '${fontName}', sans-serif !important;
            }
        `;
    }

    function removeFont() {
        localStorage.removeItem('avia_custom_font_url');
        const styleTag = document.getElementById('custom-font-style');
        if (styleTag) styleTag.remove();
        alert("Reverted Font To Original Settings.");
    }

    (function applySavedFont() {
        const savedUrl = localStorage.getItem('avia_custom_font_url');
        if (savedUrl) applyFont(savedUrl);
    })();

    function waitForBody(callback) {
        if (document.body) {
            callback();
        } else {
            new MutationObserver((obs) => {
                if (document.body) {
                    obs.disconnect();
                    callback();
                }
            }).observe(document.documentElement, { childList: true });
        }
    }

    waitForBody(() => {
        const observer = new MutationObserver(() => injectButtons());
        observer.observe(document.body, { childList: true, subtree: true });
        injectButtons();
    });

})();

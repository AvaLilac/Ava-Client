// ==UserScript==
// @name        AviaClient Experimental
// @namespace   userscript.builder
// @version     1.7.4
// @description AviaClient is a client mod for stoat that adds extra features like plugins, themes, online fonts, local fonts. and more
// @match       https://stoat.chat/*
// @grant       none
// @run-at      document-start
// ==/UserScript==

(function(){
'@preserve - Built on 2026-05-18T06:50:59.670Z';
window.__USERSCRIPT_VERSION__ = "1.7.4";

/* --- inject.js --- */
if(window.__US_BUILDER_INJECT_JS__){return;}window.__US_BUILDER_INJECT_JS__=true;

(function () {

    if (window.__AVIA_WEB_LOADED__) return;
    window.__AVIA_WEB_LOADED__ = true;

    const LINKTREE_URL = "https://linktr.ee/GermanAvaLilac";
    const STOAT_SERVER_URL = "https://stt.gg/GvBhcejB";

    function preloadMonaco() {
        return new Promise(resolve => {
            if (window.monaco) return resolve();
            const loader = document.createElement("script");
            loader.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/loader.js";
            loader.onload = function () {
                require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs" } });
                require(["vs/editor/editor.main"], () => resolve());
            };
            document.head.appendChild(loader);
        });
    }

    async function toggleQuickCSSPanel() {
        await preloadMonaco();

        let panel = document.getElementById('avia-quickcss-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            return;
        }

        panel = document.createElement('div');
        panel.id = 'avia-quickcss-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '650px',
            height: '420px',
            background: 'var(--md-sys-color-surface, #1e1e1e)',
            color: 'var(--md-sys-color-on-surface, #fff)',
            borderRadius: '16px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            zIndex: '999999',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)'
        });

        const header = document.createElement('div');
        header.textContent = 'QuickCSS';
        Object.assign(header.style, {
            padding: '14px 16px',
            fontWeight: '600',
            fontSize: '14px',
            letterSpacing: '0.3px',
            background: 'var(--md-sys-color-surface-container, rgba(255,255,255,0.04))',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            cursor: 'move',
            color: '#fff'
        });

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '12px',
            right: '16px',
            cursor: 'pointer',
            opacity: '0.7',
            color: '#fff'
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.7';
        closeBtn.onclick = () => panel.style.display = 'none';

        const editorContainer = document.createElement('div');
        editorContainer.style.flex = '1';

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(editorContainer);
        document.body.appendChild(panel);

        const editor = monaco.editor.create(editorContainer, {
            value: localStorage.getItem('avia_quickcss') || '',
            language: 'css',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: 'on'
        });

        editor.onDidChangeModelContent(() => {
            const value = editor.getValue();
            localStorage.setItem('avia_quickcss', value);
            applyQuickCSS(value);
        });

        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });
        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
    }

    function setIcon(button, type) {
        const oldSvg = button.querySelector('svg');
        if (oldSvg) oldSvg.remove();

        const icons = {
            monitor: "M3 4h18v12H3V4zm2 2v8h14V6H5zm3 12h8v2H8v-2z",
            upload: "M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h4.66V9h3.84L12 2z",
            refresh: "M17.65 6.35A7.95 7.95 0 0012 4V1L7 6l5 5V7a5 5 0 11-5 5H5a7 7 0 107.75-6.65z",
            code: "M8.7 16.3L4.4 12l4.3-4.3 1.4 1.4L7.2 12l2.9 2.9-1.4 1.4zm6.6 0l-1.4-1.4L16.8 12l-2.9-2.9 1.4-1.4L19.6 12l-4.3 4.3z"
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

    function applyFont(src, name) {
        const fontName = "CustomFont" + Date.now();
        let styleTag = document.getElementById('custom-font-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'custom-font-style';
            document.head.appendChild(styleTag);
        }
        const ext = (name || src).split('.').pop().split('?')[0].toLowerCase();
        const formatMap = {
            ttf: 'truetype',
            otf: 'opentype',
            woff: 'woff',
            woff2: 'woff2',
            eot: 'embedded-opentype'
        };
        const format = formatMap[ext] || '';
        styleTag.textContent = `
            @font-face {
                font-family: '${fontName}';
                src: url('${src}')${format ? " format('" + format + "')" : ""};
                font-weight: normal;
                font-style: normal;
            }
            body, body *:not(.material-symbols-outlined) {
                font-family: '${fontName}', sans-serif !important;
            }
        `;
        if (name) localStorage.setItem('avia_custom_font_name', name);
    }

    function removeFont() {
        localStorage.removeItem('avia_custom_font_url');
        localStorage.removeItem('avia_custom_font_data');
        localStorage.removeItem('avia_custom_font_name');
        const styleTag = document.getElementById('custom-font-style');
        if (styleTag) styleTag.remove();
    }

    (function applySavedFont() {
        const data = localStorage.getItem('avia_custom_font_data');
        const url = localStorage.getItem('avia_custom_font_url');
        const name = localStorage.getItem('avia_custom_font_name') || '';
        if (data) applyFont(data, name);
        else if (url) applyFont(url, name);
    })();

    function showFontLoaderModal() {
        if (document.getElementById('avia-font-modal-scrim')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'avia-font-modal-styles';
        styleEl.textContent = `
            @keyframes avia-scrim-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes avia-modal-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
            #avia-font-modal-inner { animation: avia-modal-in 0.15s forwards; }
            .avia-tab-btn { transition: background 0.15s, color 0.15s; font-family: inherit; }
            .avia-tab-btn:hover { opacity: 0.8; }
            .avia-tab-btn.avia-tab-active {
                background: var(--md-sys-color-primary, rgba(103,80,164,0.9)) !important;
                color: #fff !important;
            }
            .avia-modal-action-btn {
                height: 40px;
                border-radius: 999px;
                border: none;
                padding: 0 16px;
                font-size: 0.875rem;
                font-weight: 500;
                letter-spacing: 0.015625rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.15s;
                font-family: inherit;
            }
            .avia-modal-action-btn:hover { opacity: 0.8; }
            .avia-modal-action-btn:disabled { cursor: not-allowed; opacity: 0.38; }
            .avia-font-input {
                width: 100%;
                box-sizing: border-box;
                padding: 14px 16px;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.12);
                background: rgba(255,255,255,0.06);
                color: var(--md-sys-color-on-surface, #fff);
                font-size: 0.875rem;
                outline: none;
                font-family: inherit;
                transition: border-color 0.15s;
            }
            .avia-font-input:focus { border-color: var(--md-sys-color-primary, rgba(103,80,164,0.9)); }
            .avia-font-input::placeholder { color: rgba(255,255,255,0.4); }
            .avia-file-drop {
                width: 100%;
                box-sizing: border-box;
                border: 2px dashed rgba(255,255,255,0.15);
                border-radius: 12px;
                padding: 28px 16px;
                text-align: center;
                cursor: pointer;
                transition: border-color 0.15s, background 0.15s;
                color: rgba(255,255,255,0.5);
                font-size: 0.875rem;
            }
            .avia-file-drop:hover, .avia-file-drop.avia-drag-over {
                border-color: var(--md-sys-color-primary, rgba(103,80,164,0.9));
                background: rgba(103,80,164,0.08);
            }
        `;
        document.head.appendChild(styleEl);

        const scrim = document.createElement('div');
        scrim.id = 'avia-font-modal-scrim';
        Object.assign(scrim.style, {
            position: 'fixed',
            top: '0', left: '0', right: '0', bottom: '0',
            zIndex: '999999',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0,0,0,0.6)',
            padding: '80px',
            overflowY: 'auto',
            animation: 'avia-scrim-in 0.1s forwards',
            boxSizing: 'border-box'
        });

        scrim.addEventListener('click', e => {
            if (e.target === scrim) {
                scrim.remove();
                styleEl.remove();
            }
        });

        const modal = document.createElement('div');
        modal.id = 'avia-font-modal-inner';
        Object.assign(modal.style, {
            padding: '24px',
            minWidth: '340px',
            maxWidth: '480px',
            width: '100%',
            borderRadius: '28px',
            display: 'flex',
            flexDirection: 'column',
            color: 'var(--md-sys-color-on-surface, #fff)',
            background: 'var(--md-sys-color-surface-container-high, #2b2b2f)',
            boxSizing: 'border-box'
        });

        const title = document.createElement('span');
        title.textContent = 'Font Loader';
        Object.assign(title.style, {
            lineHeight: '2rem',
            fontSize: '1.5rem',
            letterSpacing: '0',
            fontWeight: '400',
            marginBottom: '6px'
        });
        modal.appendChild(title);

        const activeFontEl = document.createElement('div');
        activeFontEl.id = 'avia-font-active-label';
        Object.assign(activeFontEl.style, {
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.45)',
            marginBottom: '18px',
            minHeight: '16px'
        });
        const savedName = localStorage.getItem('avia_custom_font_name') || '';
        activeFontEl.textContent = savedName ? 'Active: ' + savedName : 'No custom font active';
        modal.appendChild(activeFontEl);

        const tabRow = document.createElement('div');
        Object.assign(tabRow.style, { display: 'flex', gap: '8px', marginBottom: '18px' });

        const tabUrl = document.createElement('button');
        tabUrl.textContent = 'URL';
        tabUrl.className = 'avia-tab-btn avia-tab-active';
        Object.assign(tabUrl.style, {
            flex: '1', padding: '8px', borderRadius: '8px', border: 'none',
            background: 'var(--md-sys-color-primary, rgba(103,80,164,0.9))',
            color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
        });

        const tabFile = document.createElement('button');
        tabFile.textContent = 'Local File';
        tabFile.className = 'avia-tab-btn';
        Object.assign(tabFile.style, {
            flex: '1', padding: '8px', borderRadius: '8px', border: 'none',
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer'
        });

        tabRow.appendChild(tabUrl);
        tabRow.appendChild(tabFile);
        modal.appendChild(tabRow);

        const body = document.createElement('div');
        Object.assign(body.style, { marginBottom: '20px' });
        modal.appendChild(body);

        const urlInput = document.createElement('input');
        urlInput.className = 'avia-font-input';
        urlInput.type = 'text';
        urlInput.placeholder = 'https://example.com/font.ttf';
        const savedUrl = localStorage.getItem('avia_custom_font_url') || '';
        if (savedUrl) urlInput.value = savedUrl;

        const fileDropZone = document.createElement('div');
        fileDropZone.className = 'avia-file-drop';

        const fileDropText = document.createElement('div');
        fileDropText.style.marginBottom = '6px';
        fileDropText.textContent = 'Drop a font file here or click to browse';

        const fileDropSub = document.createElement('div');
        Object.assign(fileDropSub.style, { fontSize: '11px', opacity: '0.5' });
        fileDropSub.textContent = '.ttf · .otf · .woff · .woff2';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.ttf,.otf,.woff,.woff2';
        fileInput.style.display = 'none';

        fileDropZone.appendChild(fileDropText);
        fileDropZone.appendChild(fileDropSub);
        fileDropZone.appendChild(fileInput);

        fileDropZone.addEventListener('click', () => fileInput.click());
        fileDropZone.addEventListener('dragover', e => { e.preventDefault(); fileDropZone.classList.add('avia-drag-over'); });
        fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('avia-drag-over'));
        fileDropZone.addEventListener('drop', e => {
            e.preventDefault();
            fileDropZone.classList.remove('avia-drag-over');
            const f = e.dataTransfer.files[0];
            if (f) handleFileSelected(f);
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) handleFileSelected(fileInput.files[0]);
        });

        let selectedFile = null;
        let currentTab = 'url';

        function handleFileSelected(f) {
            selectedFile = f;
            fileDropText.textContent = f.name;
            fileDropSub.textContent = (f.size / 1024).toFixed(1) + ' KB';
            fileDropZone.style.borderColor = 'var(--md-sys-color-primary, rgba(103,80,164,0.9))';
            fileDropZone.style.background = 'rgba(103,80,164,0.08)';
            applyBtn.disabled = false;
        }

        function renderTab() {
            body.innerHTML = '';
            selectedFile = null;
            if (currentTab === 'url') {
                tabUrl.classList.add('avia-tab-active');
                tabUrl.style.background = 'var(--md-sys-color-primary, rgba(103,80,164,0.9))';
                tabUrl.style.color = '#fff';
                tabFile.classList.remove('avia-tab-active');
                tabFile.style.background = 'rgba(255,255,255,0.06)';
                tabFile.style.color = 'rgba(255,255,255,0.7)';
                applyBtn.disabled = false;
                body.appendChild(urlInput);
            } else {
                tabFile.classList.add('avia-tab-active');
                tabFile.style.background = 'var(--md-sys-color-primary, rgba(103,80,164,0.9))';
                tabFile.style.color = '#fff';
                tabUrl.classList.remove('avia-tab-active');
                tabUrl.style.background = 'rgba(255,255,255,0.06)';
                tabUrl.style.color = 'rgba(255,255,255,0.7)';
                applyBtn.disabled = true;
                body.appendChild(fileDropZone);
            }
        }

        tabUrl.addEventListener('click', () => { currentTab = 'url'; renderTab(); });
        tabFile.addEventListener('click', () => { currentTab = 'file'; renderTab(); });

        const btnRow = document.createElement('div');
        Object.assign(btnRow.style, {
            display: 'flex', justifyContent: 'flex-end',
            gap: '8px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center'
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove Font';
        removeBtn.className = 'avia-modal-action-btn';
        Object.assign(removeBtn.style, {
            color: 'var(--md-sys-color-error, #f2b8b8)',
            background: 'transparent',
            marginRight: 'auto'
        });
        removeBtn.addEventListener('click', () => {
            removeFont();
            activeFontEl.textContent = 'No custom font active';
            fileDropText.textContent = 'Drop a font file here or click to browse';
            fileDropSub.textContent = '.ttf · .otf · .woff · .woff2';
            fileDropZone.style.borderColor = '';
            fileDropZone.style.background = '';
            urlInput.value = '';
            selectedFile = null;
        });

        const closeModalBtn = document.createElement('button');
        closeModalBtn.textContent = 'Close';
        closeModalBtn.className = 'avia-modal-action-btn';
        Object.assign(closeModalBtn.style, {
            color: 'var(--md-sys-color-primary, #cfbcff)',
            background: 'transparent'
        });
        closeModalBtn.addEventListener('click', () => { scrim.remove(); styleEl.remove(); });

        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply';
        applyBtn.className = 'avia-modal-action-btn';
        Object.assign(applyBtn.style, {
            background: 'var(--md-sys-color-primary, rgba(103,80,164,0.9))',
            color: '#fff'
        });

        applyBtn.addEventListener('click', () => {
            if (currentTab === 'url') {
                const url = urlInput.value.trim();
                if (!url) return;
                localStorage.removeItem('avia_custom_font_data');
                localStorage.removeItem('avia_custom_font_name');
                localStorage.setItem('avia_custom_font_url', url);
                const name = url.split('/').pop().split('?')[0];
                applyFont(url, name);
                activeFontEl.textContent = 'Active: ' + name;
            } else {
                if (!selectedFile) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result;
                    localStorage.removeItem('avia_custom_font_url');
                    localStorage.setItem('avia_custom_font_data', dataUrl);
                    applyFont(dataUrl, selectedFile.name);
                    activeFontEl.textContent = 'Active: ' + selectedFile.name;
                };
                reader.readAsDataURL(selectedFile);
            }
        });

        btnRow.appendChild(removeBtn);
        btnRow.appendChild(closeModalBtn);
        btnRow.appendChild(applyBtn);
        modal.appendChild(btnRow);

        scrim.appendChild(modal);
        document.body.appendChild(scrim);

        renderTab();
    }

    function injectButtons() {
        const appearanceBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === 'Appearance');
        if (!appearanceBtn) return;

        const aviaHeader = [...document.querySelectorAll('span')]
            .find(s => s.textContent.trim() === "AVIA CLIENT SETTINGS");
        if (!aviaHeader) return;

        const aviaContainer = aviaHeader.closest('.d_flex.flex-d_column');
        if (!aviaContainer) return;

        const targetParent = aviaContainer.querySelector('.d_flex.flex-d_column.gap_var\\(--gap-s\\)');
        if (!targetParent) return;

        if (!document.getElementById('stoat-fake-linktree')) {
            const linktreeBtn = appearanceBtn.cloneNode(true);
            linktreeBtn.id = 'stoat-fake-linktree';
            const textNode = Array.from(linktreeBtn.querySelectorAll('div')).find(d => d.children.length === 0 && d.textContent.trim() === 'Appearance');
            if (textNode) textNode.textContent = "(Avia) Ava's Linktree";
            setIcon(linktreeBtn, "monitor");
            linktreeBtn.addEventListener('click', () => window.open(LINKTREE_URL, "_blank"));
            targetParent.appendChild(linktreeBtn);

            const stoatBtn = appearanceBtn.cloneNode(true);
            stoatBtn.id = 'stoat-fake-stoatserver';
            const stoatTextNode = Array.from(stoatBtn.querySelectorAll('div')).find(d => d.children.length === 0 && d.textContent.trim() === 'Appearance');
            if (stoatTextNode) stoatTextNode.textContent = "(Avia) Stoat Server";
            setIcon(stoatBtn, "monitor");
            stoatBtn.addEventListener('click', () => window.open(STOAT_SERVER_URL, "_blank"));
            targetParent.appendChild(stoatBtn);
        }

        if (!document.getElementById('stoat-fake-loadfont')) {
            const newBtn = appearanceBtn.cloneNode(true);
            newBtn.id = 'stoat-fake-loadfont';
            const textNode = Array.from(newBtn.querySelectorAll('div')).find(d => d.children.length === 0);
            if (textNode) textNode.textContent = "(Avia) Font Loader";
            setIcon(newBtn, "upload");
            newBtn.addEventListener('click', showFontLoaderModal);
            targetParent.appendChild(newBtn);
        }

        if (!document.getElementById('stoat-fake-quickcss')) {
            const quickCssBtn = appearanceBtn.cloneNode(true);
            quickCssBtn.id = 'stoat-fake-quickcss';
            const quickCssTextNode = Array.from(quickCssBtn.querySelectorAll('div')).find(d => d.children.length === 0);
            if (quickCssTextNode) quickCssTextNode.textContent = "(Avia) QuickCSS";
            setIcon(quickCssBtn, "code");
            quickCssBtn.addEventListener('click', toggleQuickCSSPanel);
            targetParent.appendChild(quickCssBtn);
        }
    }

    function applyQuickCSS(css) {
        let styleTag = document.getElementById('avia-quickcss-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'avia-quickcss-style';
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = css;
    }

    (function applySavedQuickCSS() {
        const savedCSS = localStorage.getItem('avia_quickcss');
        if (savedCSS) applyQuickCSS(savedCSS);
    })();

    function waitForBody(callback) {
        if (document.body) callback();
        else new MutationObserver((obs) => {
            if (document.body) {
                obs.disconnect();
                callback();
            }
        }).observe(document.documentElement, { childList: true });
    }

    waitForBody(() => {
        const observer = new MutationObserver(() => injectButtons());
        observer.observe(document.body, { childList: true, subtree: true });
        injectButtons();
    });

    preloadMonaco();

})();


/* --- UpdateChecker.js --- */
if(window.__US_BUILDER_UPDATECHECKER_JS__){return;}window.__US_BUILDER_UPDATECHECKER_JS__=true;

(function() {
    if (window.__AVIA_USERSCRIPT_UPDATE_CHECKER__) return;
    window.__AVIA_USERSCRIPT_UPDATE_CHECKER__ = true;

    const SCRIPT_URL = "https://api.github.com/repos/AvaLilac/Ava-Client/contents/userscript/AviaClient.user.js";
    const RELEASES_URL = "https://github.com/AvaLilac/Ava-Client/raw/refs/heads/main/userscript/AviaClient.user.js";
    const STORAGE_KEY = "avia_userscript_update_checker_enabled";

    function isEnabled() {
        return localStorage.getItem(STORAGE_KEY) !== "false";
    }

    function setEnabled(val) {
        localStorage.setItem(STORAGE_KEY, val ? "true" : "false");
    }

        function getInstalledVersion() {
        try {
            return window.__USERSCRIPT_VERSION__ || null;
        } catch (_) {
            return null;
        }
    }

        async function fetchLatestVersion() {
        const res = await fetch(SCRIPT_URL, {
            headers: { "Accept": "application/vnd.github.v3.raw" }
        });
        const text = await res.text();
        const match = text.match(/@version\s+([^\s]+)/);
        return match ? match[1].trim() : null;
    }

    function showUpdateModal(installedVersion, latestVersion) {
        if (document.getElementById("avia-userscript-update-modal")) return;

        const backdrop = document.createElement("div");
        backdrop.id = "avia-userscript-update-modal";
        backdrop.className = "top_0 left_0 right_0 bottom_0 pos_fixed z_100 max-h_100% d_grid us_none place-items_center pointer-events_all anim-n_scrimFadeIn anim-dur_0.1s anim-fm_forwards trs_var(--transitions-medium)_all p_80px ov-y_auto";
        backdrop.style.cssText = "--background: rgba(0, 0, 0, 0.6); background: rgba(0, 0, 0, 0.6);";

        const motionWrap = document.createElement("div");
        motionWrap.style.cssText = "opacity: 1; --motion-translateY: 0px; transform: translateY(var(--motion-translateY));";

        const card = document.createElement("div");
        card.style.cssText = "min-width: 320px; max-width: 480px; padding: 24px; border-radius: 28px; display: flex; flex-direction: column; color: var(--md-sys-color-on-surface); background: var(--md-sys-color-surface-container-high);";

        const title = document.createElement("span");
        title.textContent = "Userscript Update Available";
        title.style.cssText = "line-height: 2rem; font-size: 1.5rem; letter-spacing: 0; font-weight: 400; margin-bottom: 16px;";

        const body = document.createElement("div");
        body.style.cssText = "color: var(--md-sys-color-on-surface-variant); line-height: 1.25rem; font-size: 0.875rem; letter-spacing: 0.015625rem; font-weight: 400; display: flex; flex-direction: column; gap: 12px;";

        const currentRow = document.createElement("div");
        currentRow.style.cssText = "display: flex; flex-direction: column; gap: 2px;";
        const currentLabel = document.createElement("span");
        currentLabel.textContent = "Your installed version";
        currentLabel.style.cssText = "font-size: 11px; opacity: 0.5; letter-spacing: 0.03em;";
        const currentVersionEl = document.createElement("span");
        currentVersionEl.textContent = installedVersion || "Unknown";
        currentVersionEl.style.cssText = "font-size: 14px; font-weight: 500; color: var(--md-sys-color-on-surface);";
        currentRow.appendChild(currentLabel);
        currentRow.appendChild(currentVersionEl);

        const latestRow = document.createElement("div");
        latestRow.style.cssText = "display: flex; flex-direction: column; gap: 2px;";
        const latestLabel = document.createElement("span");
        latestLabel.textContent = "Latest version";
        latestLabel.style.cssText = "font-size: 11px; opacity: 0.5; letter-spacing: 0.03em;";
        const latestVersionEl = document.createElement("span");
        latestVersionEl.textContent = latestVersion;
        latestVersionEl.style.cssText = "font-size: 14px; font-weight: 600; color: var(--md-sys-color-primary);";
        latestRow.appendChild(latestLabel);
        latestRow.appendChild(latestVersionEl);

        const message = document.createElement("span");
        message.textContent = `You are currently on version ${installedVersion || "Unknown"}. The latest version of AviaClient userscript is ${latestVersion}.`;

        body.appendChild(currentRow);
        body.appendChild(latestRow);
        body.appendChild(message);

        const btnRow = document.createElement("div");
        btnRow.style.cssText = "gap: 8px; display: flex; justify-content: flex-end; margin-top: 24px;";

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.style.cssText = "line-height: 1.25rem; font-size: 0.875rem; font-weight: 400; position: relative; padding: 0 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: inherit; cursor: pointer; border: none; transition: var(--transitions-medium) all; color: var(--md-sys-color-primary); height: 40px; border-radius: var(--borderRadius-full); background: none;";
        closeBtn.innerHTML = "<md-ripple aria-hidden='true'></md-ripple>Close";
        closeBtn.onclick = () => backdrop.remove();

        const updateBtn = document.createElement("button");
        updateBtn.type = "button";
        updateBtn.style.cssText = "line-height: 1.25rem; font-size: 0.875rem; font-weight: 400; position: relative; padding: 0 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: inherit; cursor: pointer; border: none; transition: var(--transitions-medium) all; color: var(--md-sys-color-on-primary); height: 40px; border-radius: var(--borderRadius-full); background: var(--md-sys-color-primary);";
        updateBtn.innerHTML = "<md-ripple aria-hidden='true'></md-ripple>Update Now";
        updateBtn.onclick = () => window.open(RELEASES_URL, "_blank");

        btnRow.appendChild(closeBtn);
        btnRow.appendChild(updateBtn);

        card.appendChild(title);
        card.appendChild(body);
        card.appendChild(btnRow);
        motionWrap.appendChild(card);
        backdrop.appendChild(motionWrap);
        document.body.appendChild(backdrop);
    }

    async function check() {
        if (!isEnabled()) return;
        const installedVersion = getInstalledVersion();
        const latestVersion = await fetchLatestVersion().catch(() => null);
        if (!latestVersion) return;
        if (installedVersion === latestVersion) return;
        showUpdateModal(installedVersion, latestVersion);
    }

    function applyToggleStyle(entry) {
        const desc = entry.querySelector("span.lh_1rem");
        const checkbox = entry.querySelector("mdui-checkbox");
        if (isEnabled()) {
            if (desc) desc.textContent = "Get notified when a new AviaClient userscript version is available";
            if (checkbox) checkbox.setAttribute("checked", "");
        } else {
            if (desc) desc.textContent = "Get notified when a new AviaClient userscript version is available";
            if (checkbox) checkbox.removeAttribute("checked");
        }
    }

    function tryInject() {
        if (document.querySelector("[data-userscript-update-entry]")) return;

        const target = [...document.querySelectorAll("a.pos_relative")]
            .find(a => a.innerText.includes("Plugins v2 Placeholder"));
        if (!target) return;

        const entry = target.cloneNode(true);
        entry.setAttribute("data-userscript-update-entry", "true");

        const iconWrap = entry.querySelector("div.w_36px.h_36px");
        if (iconWrap) {
            iconWrap.innerHTML = "";
            const icon = document.createElement("span");
            icon.className = "material-symbols-outlined";
            icon.style.cssText = "display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;font-size:20px;";
            icon.textContent = "system_update_alt";
            iconWrap.appendChild(icon);
        }

        const titleEl = entry.querySelector("div.d_flex.flex-g_1.flex-d_column > div");
        if (titleEl) titleEl.textContent = "Userscript Update Checker";

        const descEl = entry.querySelector("span.lh_1rem");
        if (descEl) descEl.setAttribute("data-userscript-desc", "true");

        applyToggleStyle(entry);

        entry.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            setEnabled(!isEnabled());
            applyToggleStyle(entry);
        });

        target.parentNode.insertBefore(entry, target.nextSibling);
    }

    check();

    const observer = new MutationObserver(() => tryInject());
    observer.observe(document.body, { childList: true, subtree: true });
    tryInject();
})();


/* --- themes.js --- */
if(window.__US_BUILDER_THEMES_JS__){return;}window.__US_BUILDER_THEMES_JS__=true;

(function () {

    if (window.__AVIA_THEMES_LOADED__) return;
    window.__AVIA_THEMES_LOADED__ = true;

    const STORAGE_KEY = "avia_themes";
    let editingThemeId = null;
    let monacoEditorInstance = null;

    const TEMPLATE = `/*
@name Whatever name here
@author Whatever Author Here
@version 1.0
@description Whatever description here
*/

`;

    const getThemes = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setThemes = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    function preloadMonaco() {
        return new Promise(resolve => {
            if (window.monaco) return resolve();
            const loader = document.createElement("script");
            loader.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/loader.js";
            loader.onload = function () {
                require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs" } });
                require(["vs/editor/editor.main"], () => resolve());
            };
            document.head.appendChild(loader);
        });
    }

    function parseMeta(css) {
        const name = css.match(/@name\s+(.+)/)?.[1] || "Unknown Theme";
        const author = css.match(/@author\s+(.+)/)?.[1] || "Unknown";
        const version = css.match(/@version\s+(.+)/)?.[1] || "1.0";
        const rawDescription = css.match(/@description\s+(.+)/)?.[1] || "No Description Available";
        const description = rawDescription.trim() === "*/" ? "No Description Available" : rawDescription;
        return { name, author, version, description };
    }

    function sanitizeFilename(name) {
        return name
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
            .replace(/\s+/g, "_")
            .replace(/\.+$/, "")
            .trim() || "theme";
    }

    function downloadTheme(theme) {
        const name = parseMeta(theme.css).name;
        const filename = sanitizeFilename(name) + ".css";
        const blob = new Blob([theme.css], { type: "text/css" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function applyThemes() {
        document.querySelectorAll(".avia-theme-style").forEach(e => e.remove());
        getThemes().forEach(theme => {
            if (!theme.enabled) return;

            const importRegex = /@import\s+url\(["']?([^"')]+)["']?\)\s*;/g;
            let match;
            while ((match = importRegex.exec(theme.css)) !== null) {
                const url = match[1];
                fetch(url)
                    .then(r => r.text())
                    .then(css => {
                        const style = document.createElement("style");
                        style.className = "avia-theme-style";
                        style.textContent = css;
                        document.head.appendChild(style);
                    })
                    .catch(() => {});
            }

            const stripped = theme.css.replace(/@import\s+url\(["']?[^"')]+["']?\)\s*;/g, "").trim();
            if (stripped) {
                const style = document.createElement("style");
                style.className = "avia-theme-style";
                style.textContent = stripped;
                document.head.appendChild(style);
            }
        });
    }

    function styleBtn(btn, bg) {
        Object.assign(btn.style, {
            padding: "5px 12px",
            borderRadius: "8px",
            border: "none",
            background: bg || "rgba(255,255,255,0.08)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "12px",
            whiteSpace: "nowrap",
            fontWeight: "500"
        });
        btn.onmouseenter = () => btn.style.opacity = "0.75";
        btn.onmouseleave = () => btn.style.opacity = "1";
    }

    function makeDraggable(panel, handle) {
        let dragging = false, offsetX, offsetY;
        handle.addEventListener("mousedown", e => {
            dragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = "none";
        });
        document.addEventListener("mouseup", () => { dragging = false; document.body.style.userSelect = ""; });
        document.addEventListener("mousemove", e => {
            if (!dragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        });
    }

    async function openThemeEditor(themeId) {
        await preloadMonaco();

        editingThemeId = themeId;
        const themes = getThemes();
        const theme = themes.find(t => t.id === themeId);
        if (!theme) return;

        const meta = parseMeta(theme.css);
        let panel = document.getElementById("avia-theme-editor");

        if (panel) {
            panel.style.display = "flex";
            panel.querySelector("#avia-theme-editor-title").textContent = "Theme Editor — " + meta.name;
            if (monacoEditorInstance) {
                monacoEditorInstance._aviaThemeId = themeId;
                const model = monacoEditorInstance.getModel();
                if (model) model.setValue(theme.css || "");
            }
            return;
        }

        panel = document.createElement("div");
        panel.id = "avia-theme-editor";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "650px",
            height: "420px",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            color: "var(--md-sys-color-on-surface, #fff)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            zIndex: "9999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
        });

        const header = document.createElement("div");
        header.id = "avia-theme-editor-title";
        header.textContent = "Theme Editor — " + meta.name;
        Object.assign(header.style, {
            padding: "14px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            color: "#fff",
            flex: "0 0 auto"
        });
        makeDraggable(panel, header);

        const close = document.createElement("div");
        close.textContent = "✕";
        Object.assign(close.style, {
            position: "absolute",
            right: "16px",
            top: "12px",
            cursor: "pointer",
            opacity: "0.6",
            fontSize: "15px",
            lineHeight: "1",
            padding: "2px 4px",
            color: "#fff"
        });
        close.onmouseenter = () => close.style.opacity = "1";
        close.onmouseleave = () => close.style.opacity = "0.6";
        close.onclick = () => panel.style.display = "none";

        const editorContainer = document.createElement("div");
        editorContainer.style.flex = "1";

        panel.appendChild(header);
        panel.appendChild(close);
        panel.appendChild(editorContainer);
        document.body.appendChild(panel);

        monacoEditorInstance = monaco.editor.create(editorContainer, {
            value: theme.css || "",
            language: "css",
            theme: "vs-dark",
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "on"
        });

        monacoEditorInstance._aviaThemeId = themeId;

        monacoEditorInstance.onDidChangeModelContent(() => {
            const id = monacoEditorInstance._aviaThemeId;
            if (!id) return;
            const value = monacoEditorInstance.getValue();
            const all = getThemes();
            const target = all.find(t => t.id === id);
            if (!target) return;
            target.css = value;
            setThemes(all);
            applyThemes();
            header.textContent = "Theme Editor — " + parseMeta(value).name;
            if (typeof window.__avia_refresh_themes_panel === "function") {
                window.__avia_refresh_themes_panel();
            }
        });
    }

    function toggleThemesPanel() {
        let panel = document.getElementById("avia-themes-panel");
        if (panel) {
            panel.style.display = panel.style.display === "none" ? "flex" : "none";
            return;
        }

        panel = document.createElement("div");
        panel.id = "avia-themes-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "40px",
            right: "40px",
            width: "500px",
            height: "460px",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            color: "var(--md-sys-color-on-surface, #fff)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            zIndex: "999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
        });

        const header = document.createElement("div");
        header.textContent = "Themes";
        Object.assign(header.style, {
            padding: "14px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move"
        });
        makeDraggable(panel, header);

        const close = document.createElement("div");
        close.textContent = "✕";
        Object.assign(close.style, {
            position: "absolute",
            right: "16px",
            top: "12px",
            cursor: "pointer",
            opacity: "0.6",
            fontSize: "15px",
            lineHeight: "1",
            padding: "2px 4px"
        });
        close.onmouseenter = () => close.style.opacity = "1";
        close.onmouseleave = () => close.style.opacity = "0.6";
        close.onclick = () => panel.style.display = "none";

        const btnRow = document.createElement("div");
        Object.assign(btnRow.style, {
            display: "flex",
            gap: "8px",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flex: "0 0 auto"
        });

        const importBtn = document.createElement("button");
        importBtn.textContent = "Import Theme";
        styleBtn(importBtn);
        importBtn.style.flex = "1";
        importBtn.style.padding = "8px 12px";

        const newBtn = document.createElement("button");
        newBtn.textContent = "+ New";
        styleBtn(newBtn);
        newBtn.style.flex = "1";
        newBtn.style.padding = "8px 12px";

        btnRow.appendChild(importBtn);
        btnRow.appendChild(newBtn);

        const list = document.createElement("div");
        Object.assign(list.style, {
            flex: "1",
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
        });

        const dropOverlay = document.createElement("div");
        dropOverlay.textContent = "Drop .css or .txt files here";
        Object.assign(dropOverlay.style, {
            position: "absolute",
            inset: "0",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: "600",
            color: "#fff",
            opacity: "0",
            pointerEvents: "none",
            transition: "opacity 0.15s ease",
            borderRadius: "16px"
        });

        panel.appendChild(header);
        panel.appendChild(close);
        panel.appendChild(btnRow);
        panel.appendChild(list);
        panel.appendChild(dropOverlay);
        document.body.appendChild(panel);

        let dragDepth = 0;

        panel.addEventListener("dragenter", e => {
            e.preventDefault();
            e.stopPropagation();
            dragDepth++;
            dropOverlay.style.opacity = "1";
            panel.style.border = "1px dashed rgba(255,255,255,0.4)";
        });

        panel.addEventListener("dragover", e => {
            e.preventDefault();
            e.stopPropagation();
        });

        panel.addEventListener("dragleave", e => {
            e.preventDefault();
            e.stopPropagation();
            dragDepth--;
            if (dragDepth <= 0) {
                dropOverlay.style.opacity = "0";
                panel.style.border = "1px solid rgba(255,255,255,0.08)";
                dragDepth = 0;
            }
        });

        panel.addEventListener("drop", async e => {
            e.preventDefault();
            e.stopPropagation();
            dropOverlay.style.opacity = "0";
            panel.style.border = "1px solid rgba(255,255,255,0.08)";
            dragDepth = 0;
            const files = [...e.dataTransfer.files].filter(f => f.name.endsWith(".css") || f.name.endsWith(".txt"));
            if (!files.length) return;
            const themes = getThemes();
            for (const file of files) {
                const css = await file.text();
                themes.push({ id: crypto.randomUUID(), css, enabled: true });
            }
            setThemes(themes);
            applyThemes();
            render();
        });

        function render() {
            list.innerHTML = "";
            const themes = getThemes();

            if (themes.length === 0) {
                const empty = document.createElement("div");
                empty.textContent = "No themes yet. Import or create one above.";
                Object.assign(empty.style, { opacity: "0.4", fontSize: "13px" });
                list.appendChild(empty);
                return;
            }

            themes.forEach(theme => {
                const meta = parseMeta(theme.css);

                const card = document.createElement("div");
                Object.assign(card.style, {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)"
                });

                const left = document.createElement("div");
                Object.assign(left.style, { display: "flex", alignItems: "center", gap: "10px" });

                const dot = document.createElement("div");
                Object.assign(dot.style, {
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    flexShrink: "0",
                    background: theme.enabled ? "#4dff88" : "#777",
                    boxShadow: theme.enabled ? "0 0 6px #4dff88" : "none"
                });

                const info = document.createElement("div");
                info.innerHTML = `<div style="font-weight:600;font-size:13px">${meta.name}</div><div style="font-size:11px;opacity:.5">${meta.author} • v${meta.version}</div><div style="font-size:11px;opacity:.4">${meta.description}</div>`;

                left.appendChild(dot);
                left.appendChild(info);

                const controls = document.createElement("div");
                Object.assign(controls.style, { display: "flex", gap: "6px" });

                const toggle = document.createElement("button");
                toggle.textContent = theme.enabled ? "Disable" : "Enable";
                styleBtn(toggle);
                toggle.onclick = () => {
                    theme.enabled = !theme.enabled;
                    setThemes(themes);
                    applyThemes();
                    render();
                };

                const edit = document.createElement("button");
                edit.textContent = "Edit";
                styleBtn(edit, "rgba(100,160,255,0.15)");
                edit.onclick = () => openThemeEditor(theme.id);

                const dlBtn = document.createElement("button");
                dlBtn.textContent = "Export";
                styleBtn(dlBtn, "rgba(80,200,120,0.15)");
                dlBtn.title = "Download theme as .css";
                dlBtn.onclick = e => {
                    e.stopPropagation();
                    downloadTheme(theme);
                };

                const del = document.createElement("button");
                del.textContent = "✕";
                styleBtn(del, "rgba(255,80,80,0.15)");
                del.onclick = () => {
                    const updated = themes.filter(t => t.id !== theme.id);
                    setThemes(updated);
                    applyThemes();
                    render();
                };

                controls.appendChild(toggle);
                controls.appendChild(edit);
                controls.appendChild(dlBtn);
                controls.appendChild(del);
                card.appendChild(left);
                card.appendChild(controls);
                list.appendChild(card);
            });
        }

        window.__avia_refresh_themes_panel = render;

        importBtn.onclick = () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".css,.txt";
            input.multiple = true;
            input.onchange = async () => {
                const files = [...input.files];
                if (!files.length) return;
                const themes = getThemes();
                for (const file of files) {
                    const css = await file.text();
                    themes.push({ id: crypto.randomUUID(), css, enabled: true });
                }
                setThemes(themes);
                applyThemes();
                render();
            };
            input.click();
        };

        newBtn.onclick = () => {
            const themes = getThemes();
            themes.push({ id: crypto.randomUUID(), css: TEMPLATE, enabled: true });
            setThemes(themes);
            applyThemes();
            render();
        };

        render();
    }

    function injectButton() {
        if (document.getElementById("avia-themes-btn")) return;
        const appearanceBtn = [...document.querySelectorAll("a")].find(a => a.textContent.trim() === "Appearance");
        const quickCSS = document.getElementById("stoat-fake-quickcss");
        if (!appearanceBtn || !quickCSS) return;
        const clone = appearanceBtn.cloneNode(true);
        clone.id = "avia-themes-btn";
        const text = [...clone.querySelectorAll("div")].find(d => d.children.length === 0);
        if (text) text.textContent = "(Avia) Themes";
        clone.onclick = toggleThemesPanel;
        quickCSS.parentElement.insertBefore(clone, quickCSS.nextSibling);
    }

    new MutationObserver(injectButton).observe(document.body, { childList: true, subtree: true });
    injectButton();
    applyThemes();
    preloadMonaco();

})();


/* --- repofrontend.js --- */
if(window.__US_BUILDER_REPOFRONTEND_JS__){return;}window.__US_BUILDER_REPOFRONTEND_JS__=true;

(function () {

    if (window.__AVIA_OFFICIAL_REPO_LOADED__) return;
    window.__AVIA_OFFICIAL_REPO_LOADED__ = true;

    const STORAGE_KEY = "avia_plugins";
    const OFFICIAL_REPO_URL = "https://avalilac.github.io/PluginRepo/pluginrepobackend.js";
    const THEMES_REGISTRY_URL = "https://avalilac.github.io/PluginRepo/themebackend/themerepobackend.js";

    const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    let repoContent;
    let currentRepoData = [];
    let currentThemeData = [];
    let searchInput;
    let activeTab = "plugins"; // "plugins" | "themes"

    document.getElementById("avia-official-repo-btn")?.remove();

    function triggerManagerRefresh() {
        const panel = document.getElementById("avia-plugins-panel");
        if (!panel) return;
        const refreshBtn = Array.from(panel.querySelectorAll("button"))
        .find(b => b.textContent.trim() === "Refresh");
        if (refreshBtn) refreshBtn.click();
    }

    function updateInstallStates() {
        if (!repoContent) return;
        const installed = getPlugins().map(p => p.url);
        repoContent.querySelectorAll("[data-link]").forEach(row => {
            const link = row.getAttribute("data-link");
            const btn = row.querySelector("button.install-btn");
            if (!btn) return;
            if (installed.includes(link)) {
                btn.textContent = "Installed";
                btn.disabled = true;
            } else {
                btn.textContent = "Install";
                btn.disabled = false;
            }
        });
    }

    function renderRepo(data, filter = "") {
        if (!repoContent) return;

        currentRepoData = data.plugins;
        repoContent.innerHTML = "";

        const filtered = currentRepoData.filter(p =>
            (p.name + " " + (p.author || "") + " " + (p.description || ""))
            .toLowerCase()
            .includes(filter.toLowerCase())
            );

        if (filtered.length === 0) {
            repoContent.innerHTML = `<div style="opacity:0.5;text-align:center;margin-top:30px;">No plugins found.</div>`;
            return;
        }

        filtered.forEach(repoPlugin => {
            const row = document.createElement("div");
            row.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;width:100%;min-width:0;";
            row.setAttribute("data-link", repoPlugin.link);

            const left = document.createElement("div");
            left.style.cssText = "display:flex;flex-direction:column;flex:1;min-width:0;";

            const title = document.createElement("div");
            title.textContent = `${repoPlugin.name} — ${repoPlugin.author || "Unknown"}`;
            title.style.cssText = "font-weight:500;word-break:break-word;";

            const desc = document.createElement("div");
            desc.textContent = repoPlugin.description || "";
            desc.style.cssText = "font-size:12px;opacity:0.7;word-break:break-word;";

            left.appendChild(title);
            left.appendChild(desc);

            const installBtn = document.createElement("button");
            installBtn.className = "install-btn";
            Object.assign(installBtn.style, {
                padding: "6px 10px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                flexShrink: "0"
            });

            installBtn.onclick = () => {
                const plugins = getPlugins();
                if (!plugins.some(p => p.url === repoPlugin.link)) {
                    plugins.push({ name: repoPlugin.name, url: repoPlugin.link, enabled: false });
                    setPlugins(plugins);
                    window.dispatchEvent(new Event("avia-plugin-list-changed"));
                    triggerManagerRefresh();
                    renderRepo({ plugins: currentRepoData }, searchInput.value);
                }
            };

            row.appendChild(left);
            row.appendChild(installBtn);
            repoContent.appendChild(row);
        });

        updateInstallStates();
    }

    function refetchPlugins() {
        if (!repoContent) return;
        repoContent.innerHTML = "Loading...";

        function electronFetch() {
            try {
                const https = require("https");
                https.get(OFFICIAL_REPO_URL, res => {
                    let data = "";
                    res.on("data", chunk => data += chunk);
                    res.on("end", () => renderRepo(JSON.parse(data)));
                }).on("error", () => {
                    repoContent.innerHTML = "Failed to fetch repo.";
                });
            } catch {
                repoContent.innerHTML = "Failed to fetch repo.";
            }
        }

        try {
            fetch(OFFICIAL_REPO_URL)
            .then(res => res.json())
            .then(data => renderRepo(data))
            .catch(() => electronFetch());
        } catch {
            electronFetch();
        }
    }

    const THEMES_STORAGE_KEY = "avia_themes";
    const getStoredThemes = () => JSON.parse(localStorage.getItem(THEMES_STORAGE_KEY) || "[]");
    const setStoredThemes = (data) => localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(data));

    function buildThemeCSS(theme, rawCSS) {

        const header = `/* @name ${theme.name}\n   @author ${theme.author || "Unknown"}\n   @version 1.0\n   @description Installed from Trusted Themes Repo\n*/\n`;
        return header + rawCSS;
    }

    function installThemeCSS(theme, btn) {
        btn.disabled = true;
        btn.textContent = "Installing…";

        fetch(theme.download)
        .then(r => r.text())
        .then(rawCSS => {
            const css = buildThemeCSS(theme, rawCSS);
            const themes = getStoredThemes();

            const alreadyInstalled = themes.some(t => {
                const match = t.css.match(/@name\s+(.+)/);
                return match && match[1].trim() === theme.name;
            });

            if (alreadyInstalled) {
                btn.textContent = "Installed";

                return;
            }

            themes.push({ id: crypto.randomUUID(), css, enabled: true });
            setStoredThemes(themes);

            document.querySelectorAll(".avia-theme-style").forEach(e => e.remove());
            getStoredThemes().forEach(t => {
                if (!t.enabled) return;
                const style = document.createElement("style");
                style.className = "avia-theme-style";
                style.textContent = t.css;
                document.head.appendChild(style);
            });

            if (typeof window.__avia_refresh_themes_panel === "function") {
                window.__avia_refresh_themes_panel();
            }

            btn.textContent = "Installed";

        })
        .catch(() => {
            btn.textContent = "Install CSS";
            btn.disabled = false;
            alert("Failed to fetch theme CSS.");
        });
    }

    function renderThemes(filter = "") {
        if (!repoContent) return;
        repoContent.innerHTML = "";

        const filtered = currentThemeData.filter(t =>
            (t.name + " " + (t.author || ""))
            .toLowerCase()
            .includes(filter.toLowerCase())
            );

        if (filtered.length === 0) {
            repoContent.innerHTML = `<div style="opacity:0.5;text-align:center;margin-top:30px;">No themes found.</div>`;
            return;
        }

        filtered.forEach(theme => {
            const card = document.createElement("div");
            card.style.cssText = "margin-bottom:14px;background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);";

            if (theme.preview) {
                const img = document.createElement("img");
                img.src = theme.preview;
                img.alt = theme.name;
                img.style.cssText = "width:100%;display:block;background:#111;object-fit:contain;";
                img.onerror = () => img.style.display = "none";
                card.appendChild(img);
            }

            const info = document.createElement("div");
            info.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px 12px;gap:8px;";

            const meta = document.createElement("div");
            meta.style.cssText = "display:flex;flex-direction:column;min-width:0;flex:1;";

            const name = document.createElement("div");
            name.textContent = theme.name;
            name.style.cssText = "font-weight:500;word-break:break-word;";

            const author = document.createElement("div");
            author.textContent = `by ${theme.author || "Unknown"}`;
            author.style.cssText = "font-size:12px;opacity:0.6;";

            meta.appendChild(name);
            meta.appendChild(author);

            const alreadyInstalled = getStoredThemes().some(t => {
                const match = t.css.match(/@name\s+(.+)/);
                return match && match[1].trim() === theme.name;
            });

            const dlBtn = document.createElement("button");
            dlBtn.textContent = alreadyInstalled ? "Installed" : "Install CSS";
            dlBtn.disabled = alreadyInstalled;
            Object.assign(dlBtn.style, {
                padding: "6px 10px",
                borderRadius: "8px",
                border: "none",
                cursor: alreadyInstalled ? "default" : "pointer",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                flexShrink: "0",
                fontSize: "12px",
                whiteSpace: "nowrap"
            });
            dlBtn.onclick = () => installThemeCSS(theme, dlBtn);

            info.appendChild(meta);
            info.appendChild(dlBtn);
            card.appendChild(info);
            repoContent.appendChild(card);
        });
    }

    function refetchThemes() {
        if (!repoContent) return;
        repoContent.innerHTML = "Loading themes...";
        currentThemeData = [];

        fetch(THEMES_REGISTRY_URL)
        .then(r => r.json())
        .then(async registry => {
            const sources = registry.sources || [];
            const results = await Promise.allSettled(
                sources.map(s => fetch(s.url).then(r => r.json()))
                );
            results.forEach(r => {
                if (r.status === "fulfilled") {
                    currentThemeData.push(...(r.value.themes || []));
                }
            });
            renderThemes(searchInput.value);
        })
        .catch(() => {
            if (repoContent) repoContent.innerHTML = "Failed to fetch themes.";
        });
    }

    function switchTab(tab, tabPluginsBtn, tabThemesBtn) {
        activeTab = tab;
        const isPlugins = tab === "plugins";

        tabPluginsBtn.style.background = isPlugins ? "rgba(255,255,255,0.12)" : "transparent";
        tabPluginsBtn.style.color = isPlugins ? "#fff" : "rgba(255,255,255,0.45)";
        tabThemesBtn.style.background = !isPlugins ? "rgba(255,255,255,0.12)" : "transparent";
        tabThemesBtn.style.color = !isPlugins ? "#fff" : "rgba(255,255,255,0.45)";

        searchInput.placeholder = isPlugins
        ? "Search plugins, authors, or descriptions"
        : "Search themes or authors";
        searchInput.value = "";

        if (isPlugins) {
            if (currentRepoData.length > 0) renderRepo({ plugins: currentRepoData });
            else refetchPlugins();
        } else {
            if (currentThemeData.length > 0) renderThemes();
            else refetchThemes();
        }
    }

    function openWindow() {
        let panel = document.getElementById("avia-official-repo-window");
        if (panel) {
            panel.style.display = panel.style.display === "none" ? "flex" : "none";
            return;
        }

        panel = document.createElement("div");
        panel.id = "avia-official-repo-window";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "40px",
            right: "40px",
            width: "420px",
            height: "520px",
            background: "#1e1e1e",
            color: "#fff",
            borderRadius: "20px",
            boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)"
        });

        const header = document.createElement("div");
        header.textContent = "Plugins & Themes Repo";
        Object.assign(header.style, {
            padding: "18px",
            fontWeight: "600",
            fontSize: "16px",
            background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            position: "relative",
            textAlign: "center",
            userSelect: "none"
        });

        let isDragging = false, offsetX = 0, offsetY = 0;
        header.addEventListener("mousedown", (e) => {
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            panel.style.bottom = "auto";
            panel.style.right = "auto";
            panel.style.left = rect.left + "px";
            panel.style.top = rect.top + "px";
            document.body.style.userSelect = "none";
        });
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            panel.style.left = e.clientX - offsetX + "px";
            panel.style.top = e.clientY - offsetY + "px";
        });
        document.addEventListener("mouseup", () => {
            isDragging = false;
            document.body.style.userSelect = "";
        });

        const close = document.createElement("div");
        close.textContent = "✕";
        Object.assign(close.style, { position: "absolute", right: "18px", top: "16px", cursor: "pointer" });
        close.onclick = () => panel.style.display = "none";
        header.appendChild(close);

        const tabs = document.createElement("div");
        tabs.style.cssText = "display:flex;gap:6px;padding:10px 12px 0;background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.08);";

        const tabStyle = "padding:6px 16px;border-radius:8px 8px 0 0;border:none;cursor:pointer;font-size:13px;font-weight:500;transition:background 0.15s,color 0.15s;font-family:inherit;";

        const tabPluginsBtn = document.createElement("button");
        tabPluginsBtn.textContent = "Plugins";
        tabPluginsBtn.style.cssText = tabStyle;

        const tabThemesBtn = document.createElement("button");
        tabThemesBtn.textContent = "Themes";
        tabThemesBtn.style.cssText = tabStyle;

        tabPluginsBtn.onclick = () => switchTab("plugins", tabPluginsBtn, tabThemesBtn);
        tabThemesBtn.onclick = () => switchTab("themes", tabPluginsBtn, tabThemesBtn);

        tabs.appendChild(tabPluginsBtn);
        tabs.appendChild(tabThemesBtn);

        searchInput = document.createElement("input");
        searchInput.placeholder = "Search plugins, authors, or descriptions";
        Object.assign(searchInput.style, {
            margin: "12px",
            padding: "8px",
            borderRadius: "8px",
            border: "none",
            outline: "none",
            background: "rgba(255,255,255,0.06)",
            color: "#fff"
        });
        searchInput.addEventListener("input", () => {
            if (activeTab === "plugins") renderRepo({ plugins: currentRepoData }, searchInput.value);
            else renderThemes(searchInput.value);
        });

        repoContent = document.createElement("div");
        Object.assign(repoContent.style, {
            flex: "1",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "0 12px 12px"
        });

        const container = document.createElement("div");
        Object.assign(container.style, { flex: "1", display: "flex", flexDirection: "column", overflow: "hidden" });
        container.appendChild(searchInput);
        container.appendChild(repoContent);

        panel.appendChild(header);
        panel.appendChild(tabs);
        panel.appendChild(container);
        document.body.appendChild(panel);

        switchTab("plugins", tabPluginsBtn, tabThemesBtn);
        refetchPlugins();
    }

    function injectSettingsButton() {
        if (document.getElementById("avia-official-repo-btn-settings")) return;

        const appearanceBtn = [...document.querySelectorAll("a")]
        .find(a => a.textContent.trim() === "Appearance");
        const referenceNode = document.getElementById("stoat-fake-quickcss");
        if (!appearanceBtn || !referenceNode) return;

        const clone = appearanceBtn.cloneNode(true);
        clone.id = "avia-official-repo-btn-settings";

        const label = [...clone.querySelectorAll("div")].find(d => d.children.length === 0);
        if (label) label.textContent = "(Avia)  Plugins/Themes Repo";

        const iconSpan = clone.querySelector("span.material-symbols-outlined");
        if (iconSpan) {
            iconSpan.textContent = "extension";
            iconSpan.style.fontVariationSettings = "'FILL' 0,'wght' 400,'GRAD' 0";
        }

        clone.onclick = openWindow;
        referenceNode.parentElement.insertBefore(clone, referenceNode.nextSibling);
    }

    window.addEventListener("avia-plugin-list-changed", () => {
        if (document.getElementById("avia-official-repo-window")) {
            updateInstallStates();
        }
    });

    new MutationObserver(() => injectSettingsButton())
    .observe(document.body, { childList: true, subtree: true });

    injectSettingsButton();

})();



/* --- aviaclientbrowsertab.js --- */
if(window.__US_BUILDER_AVIACLIENTBROWSERTAB_JS__){return;}window.__US_BUILDER_AVIACLIENTBROWSERTAB_JS__=true;
(function(){

const TITLE = "Avia Client";
const ICON_URL = "https://raw.githubusercontent.com/AvaLilac/Ava-Client/refs/heads/main/userscript/icon.png"; // <-- change this

document.title = TITLE;

function setFavicon(url) {
  let link = document.querySelector("link[rel*='icon']");
  
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  
  link.href = url;
}

setFavicon(ICON_URL);

const titleObserver = new MutationObserver(() => {
  if (document.title !== TITLE) {
    document.title = TITLE;
  }
});

const faviconObserver = new MutationObserver(() => {
  setFavicon(ICON_URL);
});

titleObserver.observe(document.querySelector("title"), { childList: true });
faviconObserver.observe(document.head, { childList: true, subtree: true });

})();

/* --- LoginWithToken.js --- */
if(window.__US_BUILDER_LOGINWITHTOKEN_JS__){return;}window.__US_BUILDER_LOGINWITHTOKEN_JS__=true;

(function () {
  if (window.__LOGIN_WITH_TOKEN__) return;
  window.__LOGIN_WITH_TOKEN__ = true;

  async function loginWithToken(token) {
    const res = await fetch('https://stoat.chat/api/users/@me', {
      headers: { 'x-session-token': token }
    });
    if (!res.ok) throw new Error('Invalid token');
    const user = await res.json();

    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open('localforage');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });

    const tx = db.transaction('keyvaluepairs', 'readwrite');
    await new Promise((resolve, reject) => {
      const r = tx.objectStore('keyvaluepairs').put({
        session: {
          _id: user._id,
          token: token,
          userId: user._id,
          valid: true
        }
      }, 'auth');
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });

    location.reload();
  }

  function openTokenDialog() {
    const backdrop = document.createElement('div');
    backdrop.className = 'top_0 left_0 right_0 bottom_0 pos_fixed z_100 max-h_100% d_grid us_none place-items_center pointer-events_all anim-n_scrimFadeIn anim-dur_0.1s anim-fm_forwards trs_var(--transitions-medium)_all p_80px ov-y_auto';
    backdrop.style.cssText = '--background: rgba(0, 0, 0, 0.6);';

    backdrop.innerHTML = `
      <div style="opacity: 1; --motion-translateY: 0px; transform: translateY(var(--motion-translateY));">
        <div class="p_24px min-w_280px max-w_560px bdr_28px d_flex flex-d_column c_var(--md-sys-color-on-surface) bg_var(--md-sys-color-surface-container-high)">
          <span class="lh_2rem fs_1.5rem ls_0 fw_400 mbe_16px">Login With Token</span>
          <div class="c_var(--md-sys-color-on-surface-variant) lh_1.25rem fs_0.875rem ls_0.015625rem fw_400">
            <div class="d_flex flex-d_column flex-g_initial m_0 ai_initial jc_initial gap_var(--gap-md)">
              <mdui-text-field id="lwt-token-input" variant="filled" type="password" name="token" required label="Session Token"></mdui-text-field>
            </div>
          </div>
          <div class="gap_8px d_flex jc_end mbs_24px">
            <button id="lwt-close-btn" type="button" class="lh_1.25rem fs_0.875rem ls_0.015625rem fw_400 pos_relative px_16px flex-sh_0 d_flex ai_center jc_center ff_inherit cursor_pointer bd_none trs_var(--transitions-medium)_all c_var(--color) fill_var(--color) h_40px bdr_var(--borderRadius-full) --color_var(--md-sys-color-primary)">
              <md-ripple aria-hidden="true"></md-ripple>Close
            </button>
            <button id="lwt-login-btn" type="button" class="lh_1.25rem fs_0.875rem ls_0.015625rem fw_400 pos_relative px_16px flex-sh_0 d_flex ai_center jc_center ff_inherit cursor_pointer bd_none trs_var(--transitions-medium)_all c_var(--color) fill_var(--color) h_40px bdr_var(--borderRadius-full) --color_var(--md-sys-color-on-primary) bg_var(--md-sys-color-primary)">
              <md-ripple aria-hidden="true"></md-ripple>Login
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closeBtn = backdrop.querySelector('#lwt-close-btn');
    const loginBtn = backdrop.querySelector('#lwt-login-btn');
    const tokenInput = backdrop.querySelector('#lwt-token-input');

    function close() { backdrop.remove(); }

    function setLoading(loading) {
      loginBtn.disabled = loading;
      loginBtn.style.cursor = loading ? 'not-allowed' : 'pointer';
      const ripple = loginBtn.querySelector('md-ripple');
      loginBtn.textContent = loading ? 'Logging in…' : 'Login';
      if (ripple) loginBtn.prepend(ripple);
    }

    function setError(msg) {
      loginBtn.disabled = false;
      loginBtn.style.cursor = 'pointer';
      const ripple = loginBtn.querySelector('md-ripple');
      loginBtn.textContent = msg;
      if (ripple) loginBtn.prepend(ripple);
      setTimeout(() => {
        loginBtn.textContent = 'Login';
        if (ripple) loginBtn.prepend(ripple);
      }, 2000);
    }

    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    closeBtn.addEventListener('click', close);

    loginBtn.addEventListener('click', async () => {
      const token = tokenInput.value?.trim();
      if (!token) {
        setError('Enter a token!');
        return;
      }
      setLoading(true);
      try {
        await loginWithToken(token);
      } catch (err) {
        setError('Invalid token!');
      }
    });
  }

  function injectLoginButton() {
    const signUpBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Sign Up');
    if (!signUpBtn) return;

    const parent = signUpBtn.parentElement;
    if (parent.querySelector('[data-lwt-btn]')) return;

    const clone = signUpBtn.cloneNode(false);
    clone.dataset.lwtBtn = 'true';
    clone.textContent = 'Login With Token';

    const ripple = document.createElement('md-ripple');
    ripple.setAttribute('aria-hidden', 'true');
    clone.prepend(ripple);

    clone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openTokenDialog();
    });

    signUpBtn.insertAdjacentElement('afterend', clone);
  }

  let debounceTimer = null;
  new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(injectLoginButton, 150);
  }).observe(document.body, { childList: true, subtree: true });

  injectLoginButton();
})();



/* --- LocalPlugins.js --- */
if(window.__US_BUILDER_LOCALPLUGINS_JS__){return;}window.__US_BUILDER_LOCALPLUGINS_JS__=true;

(function () {

    if (window.__AVIA_LOCAL_PLUGINS_LOADED__) return;
    window.__AVIA_LOCAL_PLUGINS_LOADED__ = true;

    const STORAGE_KEY = "avia_local_plugins";

    const runningLocalPlugins = {};
    const localPluginErrors = {};

    const getLocalPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setLocalPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    function preloadMonaco() {
        return new Promise(resolve => {
            if (window.monaco) return resolve();
            const loader = document.createElement("script");
            loader.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/loader.js";
            loader.onload = function () {
                require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs" } });
                require(["vs/editor/editor.main"], () => resolve());
            };
            document.head.appendChild(loader);
        });
    }

    function runLocalPlugin(plugin) {
        stopLocalPlugin(plugin);
        try {
            const script = document.createElement("script");
            script.textContent = plugin.code || "";
            script.dataset.localPluginId = plugin.id;
            document.body.appendChild(script);
            runningLocalPlugins[plugin.id] = script;
            delete localPluginErrors[plugin.id];
        } catch (e) {
            localPluginErrors[plugin.id] = true;
        }
        renderLocalPanel();
    }

    function stopLocalPlugin(plugin) {
        const script = runningLocalPlugins[plugin.id];
        if (!script) return;
        script.remove();
        delete runningLocalPlugins[plugin.id];
        delete localPluginErrors[plugin.id];
        renderLocalPanel();
    }

    async function openEditorPanel(plugin, onSave) {
        await preloadMonaco();

        const existing = document.getElementById("avia-local-editor-panel");
        if (existing) existing.remove();

        const panel = document.createElement("div");
        panel.id = "avia-local-editor-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            left: "24px",
            width: "680px",
            height: "460px",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            zIndex: "9999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
        });

        const header = document.createElement("div");
        header.textContent = `Editing: ${plugin.name}`;
        Object.assign(header.style, {
            padding: "14px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            color: "#fff",
            flex: "0 0 auto"
        });

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            position: "absolute",
            top: "12px",
            right: "16px",
            cursor: "pointer",
            opacity: "0.7",
            color: "#fff",
            zIndex: "1"
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
        closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.7";
        closeBtn.onclick = () => panel.remove();

        const toolbar = document.createElement("div");
        Object.assign(toolbar.style, {
            padding: "8px 16px",
            display: "flex",
            gap: "8px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flex: "0 0 auto"
        });

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "💾 Save";
        styleEditorBtn(saveBtn, "#2d6a4f");

        const saveRunBtn = document.createElement("button");
        saveRunBtn.textContent = "▶ Save & Run";
        styleEditorBtn(saveRunBtn, "#1b4332");

        toolbar.appendChild(saveBtn);
        toolbar.appendChild(saveRunBtn);

        const editorContainer = document.createElement("div");
        editorContainer.style.flex = "1";

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(toolbar);
        panel.appendChild(editorContainer);
        document.body.appendChild(panel);

        const editor = monaco.editor.create(editorContainer, {
            value: plugin.code || "// Write your plugin code here\n",
            language: "javascript",
            theme: "vs-dark",
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "on"
        });

        saveBtn.onclick = () => {
            onSave(editor.getValue(), false);
            saveBtn.textContent = "✓ Saved";
            setTimeout(() => saveBtn.textContent = "💾 Save", 1200);
        };

        saveRunBtn.onclick = () => {
            onSave(editor.getValue(), true);
            saveRunBtn.textContent = "✓ Ran!";
            setTimeout(() => saveRunBtn.textContent = "▶ Save & Run", 1200);
        };

        enableEditorDrag(panel, header);
    }

    function styleEditorBtn(btn, bg) {
        Object.assign(btn.style, {
            padding: "5px 14px",
            borderRadius: "8px",
            border: "none",
            background: bg || "rgba(255,255,255,0.1)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500"
        });
        btn.onmouseenter = () => btn.style.opacity = "0.8";
        btn.onmouseleave = () => btn.style.opacity = "1";
    }

    function enableEditorDrag(panel, handle) {
        let isDragging = false, offsetX, offsetY;
        handle.addEventListener("mousedown", e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = "none";
        });
        document.addEventListener("mouseup", () => {
            isDragging = false;
            document.body.style.userSelect = "";
        });
        document.addEventListener("mousemove", e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        });
    }

    function toggleLocalPanel() {
        let panel = document.getElementById("avia-local-plugins-panel");
        if (panel) {
            panel.style.display = panel.style.display === "none" ? "flex" : "none";
            return;
        }

        panel = document.createElement("div");
        panel.id = "avia-local-plugins-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            right: "560px",
            width: "520px",
            height: "460px",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            color: "var(--md-sys-color-on-surface, #fff)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            zIndex: "999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
        });

        const header = document.createElement("div");
        header.textContent = "Local Plugins";
        Object.assign(header.style, {
            padding: "14px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move"
        });

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            position: "absolute",
            top: "12px",
            right: "16px",
            cursor: "pointer",
            opacity: "0.7"
        });
        closeBtn.onclick = () => panel.style.display = "none";

        const controlsBar = document.createElement("div");
        Object.assign(controlsBar.style, {
            padding: "12px 16px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flex: "0 0 auto"
        });

        const nameInput = document.createElement("input");
        nameInput.placeholder = "Plugin name";
        styleLocalInput(nameInput);
        nameInput.style.flex = "1";

        const addBtn = document.createElement("button");
        addBtn.textContent = "+ New";
        styleLocalBtn(addBtn);
        addBtn.onclick = () => {
            const name = nameInput.value.trim();
            if (!name) return;
            const plugins = getLocalPlugins();
            const newPlugin = {
                id: "local_" + Date.now(),
                name,
                code: "// " + name + "\n",
                enabled: false
            };
            plugins.push(newPlugin);
            setLocalPlugins(plugins);
            nameInput.value = "";
            renderLocalPanel();
        };

        const importBtn = document.createElement("button");
        importBtn.textContent = "Import";
        styleLocalBtn(importBtn, "#2d6a4f");
        importBtn.onmouseenter = () => importBtn.style.opacity = "0.75";
        importBtn.onmouseleave = () => importBtn.style.opacity = "1";

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".js";
        fileInput.multiple = true;
        fileInput.style.display = "none";

        importBtn.onclick = () => fileInput.click();

        fileInput.onchange = async () => {
            const files = [...fileInput.files];
            if (!files.length) return;

            const plugins = getLocalPlugins();

            for (const file of files) {
                const text = await file.text();
                const name = file.name.replace(/\.js$/i, "");
                plugins.push({
                    id: "local_" + Date.now() + "_" + Math.random(),
                    name,
                    code: text,
                    enabled: false
                });
            }

            setLocalPlugins(plugins);
            fileInput.value = "";
            renderLocalPanel();
        };

        controlsBar.appendChild(nameInput);
        controlsBar.appendChild(addBtn);
        controlsBar.appendChild(importBtn);
        controlsBar.appendChild(fileInput);

        const content = document.createElement("div");
        content.id = "avia-local-plugins-content";
        Object.assign(content.style, {
            flex: "1",
            overflow: "auto",
            padding: "16px"
        });

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(controlsBar);
        panel.appendChild(content);
        document.body.appendChild(panel);

        const dropOverlay = document.createElement("div");
        dropOverlay.textContent = "Import JS files";
        Object.assign(dropOverlay.style, {
            position: "absolute",
            inset: "0",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: "600",
            color: "#fff",
            opacity: "0",
            pointerEvents: "none",
            transition: "opacity 0.15s ease",
            borderRadius: "16px"
        });
        panel.appendChild(dropOverlay);

        let dragDepth = 0;

        panel.addEventListener("dragenter", e => {
            e.preventDefault();
            e.stopPropagation();
            dragDepth++;
            dropOverlay.style.opacity = "1";
            panel.style.border = "1px dashed rgba(255,255,255,0.4)";
        });

        panel.addEventListener("dragover", e => {
            e.preventDefault();
            e.stopPropagation();
        });

        panel.addEventListener("dragleave", e => {
            e.preventDefault();
            e.stopPropagation();
            dragDepth--;
            if (dragDepth <= 0) {
                dropOverlay.style.opacity = "0";
                panel.style.border = "1px solid rgba(255,255,255,0.08)";
                dragDepth = 0;
            }
        });

        panel.addEventListener("drop", async e => {
            e.preventDefault();
            e.stopPropagation();

            dropOverlay.style.opacity = "0";
            panel.style.border = "1px solid rgba(255,255,255,0.08)";
            dragDepth = 0;

            const files = [...e.dataTransfer.files].filter(f => f.name.endsWith(".js"));
            if (!files.length) return;

            const plugins = getLocalPlugins();

            for (const file of files) {
                const text = await file.text();
                const name = file.name.replace(/\.js$/i, "");
                plugins.push({
                    id: "local_" + Date.now() + "_" + Math.random(),
                    name,
                    code: text,
                    enabled: false
                });
            }

            setLocalPlugins(plugins);
            renderLocalPanel();
        });

        let isDragging = false, offsetX, offsetY;
        header.addEventListener("mousedown", e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
        });
        document.addEventListener("mouseup", () => isDragging = false);
        document.addEventListener("mousemove", e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        });

        renderLocalPanel();
    }

    function renderLocalPanel() {
        const content = document.getElementById("avia-local-plugins-content");
        if (!content) return;
        content.innerHTML = "";
        const plugins = getLocalPlugins();

        if (plugins.length === 0) {
            const empty = document.createElement("div");
            empty.textContent = "No local plugins yet. Add one above.";
            empty.style.opacity = "0.4";
            empty.style.fontSize = "13px";
            content.appendChild(empty);
            return;
        }

        plugins.forEach((plugin, index) => {
            const isRunning = !!runningLocalPlugins[plugin.id];
            const hasError = !!localPluginErrors[plugin.id];

            const row = document.createElement("div");
            Object.assign(row.style, {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)"
            });

            const left = document.createElement("div");
            Object.assign(left.style, { display: "flex", alignItems: "center", gap: "10px" });

            const statusDot = document.createElement("div");
            Object.assign(statusDot.style, { width: "10px", height: "10px", borderRadius: "50%", flexShrink: "0" });
            if (hasError) {
                statusDot.style.background = "#ff4d4d";
                statusDot.style.boxShadow = "0 0 6px #ff4d4d";
            } else if (isRunning) {
                statusDot.style.background = "#4dff88";
                statusDot.style.boxShadow = "0 0 6px #4dff88";
            } else {
                statusDot.style.background = "#777";
            }

            const name = document.createElement("div");
            name.textContent = plugin.name;
            name.style.fontSize = "13px";

            left.appendChild(statusDot);
            left.appendChild(name);

            const controls = document.createElement("div");
            Object.assign(controls.style, { display: "flex", gap: "6px" });

            const editBtn = document.createElement("button");
            editBtn.textContent = "✏ Edit";
            styleLocalBtn(editBtn, "rgba(100,140,255,0.2)");
            editBtn.onclick = () => {
                openEditorPanel(plugin, (newCode, andRun) => {
                    const all = getLocalPlugins();
                    const target = all.find(p => p.id === plugin.id);
                    if (target) {
                        target.code = newCode;
                        plugin.code = newCode;
                        setLocalPlugins(all);
                    }
                    if (andRun) {
                        plugin.enabled = true;
                        if (target) target.enabled = true;
                        setLocalPlugins(getLocalPlugins().map(p => p.id === plugin.id ? { ...p, code: newCode, enabled: true } : p));
                        runLocalPlugin(plugin);
                    }
                    renderLocalPanel();
                });
            };

            const toggleBtn = document.createElement("button");
            toggleBtn.textContent = plugin.enabled ? "Disable" : "Enable";
            styleLocalBtn(toggleBtn);
            toggleBtn.onclick = () => {
                const all = getLocalPlugins();
                const target = all.find(p => p.id === plugin.id);
                if (!target) return;
                target.enabled = !target.enabled;
                plugin.enabled = target.enabled;
                setLocalPlugins(all);
                if (target.enabled) runLocalPlugin(plugin);
                else stopLocalPlugin(plugin);
                renderLocalPanel();
            };

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "✕";
            styleLocalBtn(removeBtn, "rgba(255,80,80,0.15)");
            removeBtn.onclick = () => {
                stopLocalPlugin(plugin);
                const editorPanel = document.getElementById("avia-local-editor-panel");
                if (editorPanel) editorPanel.remove();
                const all = getLocalPlugins();
                all.splice(all.findIndex(p => p.id === plugin.id), 1);
                setLocalPlugins(all);
                renderLocalPanel();
            };

            controls.appendChild(editBtn);
            controls.appendChild(toggleBtn);
            controls.appendChild(removeBtn);
            row.appendChild(left);
            row.appendChild(controls);
            content.appendChild(row);
        });
    }

    function styleLocalInput(input) {
        Object.assign(input.style, {
            padding: "6px 8px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: "13px"
        });
    }

    function styleLocalBtn(btn, bg) {
        Object.assign(btn.style, {
            padding: "5px 12px",
            borderRadius: "8px",
            border: "none",
            background: bg || "rgba(255,255,255,0.08)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "12px",
            whiteSpace: "nowrap"
        });
        btn.onmouseenter = () => btn.style.opacity = "0.75";
        btn.onmouseleave = () => btn.style.opacity = "1";
    }

    function injectLocalButton() {
        if (document.getElementById("avia-local-plugins-btn")) return;
        const appearanceBtn = [...document.querySelectorAll("a")]
            .find(a => a.textContent.trim() === "Appearance");
        if (!appearanceBtn) return;

        const aviaPluginsBtn = document.getElementById("stoat-fake-plugins");
        if (!aviaPluginsBtn) return;

        const localBtn = appearanceBtn.cloneNode(true);
        localBtn.id = "avia-local-plugins-btn";

        const textNode = [...localBtn.querySelectorAll("div")]
            .find(d => d.children.length === 0 && d.textContent.trim() === "Appearance");
        if (textNode) textNode.textContent = "(Avia) Local Plugins";

        const oldSvg = localBtn.querySelector("svg");
        if (oldSvg) oldSvg.remove();
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "currentColor");
        svg.style.marginRight = "8px";
        const path = document.createElementNS(svgNS, "path");

        path.setAttribute("d", "M20.5 11H19V7a2 2 0 00-2-2h-4V3.5a2.5 2.5 0 00-5 0V5H4a2 2 0 00-2 2v3.8h1.5c1.5 0 2.7 1.2 2.7 2.7S5 16.2 3.5 16.2H2V20a2 2 0 002 2h3.8v-1.5c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7V22H17a2 2 0 002-2v-4h1.5a2.5 2.5 0 000-5z");
        svg.appendChild(path);
        localBtn.insertBefore(svg, localBtn.firstChild);

        localBtn.addEventListener("click", toggleLocalPanel);
        aviaPluginsBtn.parentElement.insertBefore(localBtn, aviaPluginsBtn.nextSibling);
    }

    function waitForBody(callback) {
        if (document.body) callback();
        else new MutationObserver((obs) => {
            if (document.body) { obs.disconnect(); callback(); }
        }).observe(document.documentElement, { childList: true });
    }

    waitForBody(() => {
        const observer = new MutationObserver(() => injectLocalButton());
        observer.observe(document.body, { childList: true, subtree: true });
        injectLocalButton();
    });

    getLocalPlugins().forEach(plugin => {
        if (plugin.enabled) runLocalPlugin(plugin);
    });

    preloadMonaco();

})();



/* --- pluginsupport.js --- */
if(window.__US_BUILDER_PLUGINSUPPORT_JS__){return;}window.__US_BUILDER_PLUGINSUPPORT_JS__=true;

(function () {

    if (window.__AVIA_PLUGINS_LOADED__) return;
    window.__AVIA_PLUGINS_LOADED__ = true;

    const STORAGE_KEY = "avia_plugins";

    const runningPlugins = {};
    const pluginErrors = {};
    const injectionQueue = [];

    const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    function normalizePluginUrl(url) {
        try {
            const u = new URL(url);
            if (u.hostname === "github.com") {
                const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
                if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
                return url;
            }
            if (u.hostname === "raw.githubusercontent.com") return url;
            if (u.hostname === "raw.codeberg.page") return url;
            if (u.hostname === "codeberg.org") {
                const parts = u.pathname.split("/").filter(Boolean);
                if (parts.length >= 5 && (parts[2] === "raw" || parts[2] === "src")) {
                    const user = parts[0], repo = parts[1];
                    const branchName = ["branch","commit","tag"].includes(parts[3]) ? parts[4] : parts[3];
                    const fileStart = ["branch","commit","tag"].includes(parts[3]) ? 5 : 4;
                    const filePath = parts.slice(fileStart).join("/");
                    return `https://raw.codeberg.page/${user}/${repo}/@${branchName}/${filePath}`;
                }
                if (parts.length >= 4 && parts[2] === "raw") {
                    return `https://raw.codeberg.page/${parts[0]}/${parts[1]}/@${parts[3]}/${parts.slice(4).join("/")}`;
                }
            }
        } catch (_) {}
        return url;
    }

    async function processQueue() {
        if (processQueue.running) return;
        processQueue.running = true;
        while (injectionQueue.length) {
            const { plugin, force } = injectionQueue.shift();
            await loadPluginInternal(plugin, force);
        }
        processQueue.running = false;
    }

    function queuePlugin(plugin, force = false) {
        injectionQueue.push({ plugin, force });
        processQueue();
    }

    async function loadPluginInternal(plugin, force = false) {
        if (runningPlugins[plugin.url] && !force) return;
        if (force) stopPlugin(plugin);
        try {
            const fetchUrl = normalizePluginUrl(plugin.url);
            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error("Fetch failed");
            const code = await res.text();
            delete pluginErrors[plugin.url];
            const script = document.createElement("script");
            script.textContent = code;
            script.dataset.pluginUrl = plugin.url;
            document.body.appendChild(script);
            runningPlugins[plugin.url] = script;
        } catch {
            pluginErrors[plugin.url] = true;
        }
        renderPanel();
    }

    function stopPlugin(plugin) {
        const script = runningPlugins[plugin.url];
        if (!script) return;
        script.remove();
        delete runningPlugins[plugin.url];
        delete pluginErrors[plugin.url];
        renderPanel();
    }

    function preloadMonaco() {
        return new Promise(resolve => {
            if (window.monaco) return resolve();
            const loader = document.createElement("script");
            loader.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/loader.js";
            loader.onload = function () {
                require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs" } });
                require(["vs/editor/editor.main"], () => resolve());
            };
            document.head.appendChild(loader);
        });
    }

    async function openViewerPanel(plugin) {
        await preloadMonaco();
        const existing = document.getElementById("avia-plugin-viewer-panel");
        if (existing) existing.remove();

        const panel = document.createElement("div");
        panel.id = "avia-plugin-viewer-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            left: "24px",
            width: "700px",
            height: "480px",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
            zIndex: "9999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            color: "#fff"
        });

        const header = document.createElement("div");
        Object.assign(header.style, {
            padding: "14px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: "0 0 auto"
        });

        const titleText = document.createElement("span");
        titleText.textContent = `Viewing: ${plugin.name}`;
        titleText.style.flex = "1";

        const readOnlyBadge = document.createElement("span");
        readOnlyBadge.textContent = "READ ONLY";
        Object.assign(readOnlyBadge.style, {
            fontSize: "10px",
            fontWeight: "700",
            letterSpacing: "0.08em",
            padding: "2px 8px",
            borderRadius: "20px",
            background: "rgba(255,180,0,0.15)",
            color: "#ffb400",
            border: "1px solid rgba(255,180,0,0.3)"
        });

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            cursor: "pointer",
            opacity: "0.6",
            fontSize: "15px",
            lineHeight: "1",
            padding: "2px 4px"
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
        closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.6";
        closeBtn.onclick = () => panel.remove();

        header.appendChild(titleText);
        header.appendChild(readOnlyBadge);
        header.appendChild(closeBtn);

        const urlBar = document.createElement("div");
        Object.assign(urlBar.style, {
            padding: "8px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: "11px",
            color: "rgba(255,255,255,0.35)",
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.15)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: "0 0 auto"
        });
        urlBar.textContent = plugin.url;
        urlBar.title = plugin.url;

        const editorContainer = document.createElement("div");
        editorContainer.style.flex = "1";
        editorContainer.style.overflow = "hidden";

        const loadingMsg = document.createElement("div");
        Object.assign(loadingMsg.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            opacity: "0.4",
            fontSize: "13px"
        });
        loadingMsg.textContent = "Fetching source…";
        editorContainer.appendChild(loadingMsg);

        panel.appendChild(header);
        panel.appendChild(urlBar);
        panel.appendChild(editorContainer);
        document.body.appendChild(panel);
        enableDragOn(panel, header);

        let code;
        try {
            const res = await fetch(normalizePluginUrl(plugin.url));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            code = await res.text();
        } catch (err) {
            loadingMsg.textContent = `Failed to fetch source: ${err.message}`;
            loadingMsg.style.color = "#ff4d4d";
            loadingMsg.style.opacity = "1";
            return;
        }

        editorContainer.removeChild(loadingMsg);
        monaco.editor.create(editorContainer, {
            value: code,
            language: "javascript",
            theme: "vs-dark",
            readOnly: true,
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "off",
            domReadOnly: true,
            renderValidationDecorations: "off",
            renderLineHighlight: "none",
            cursorStyle: "block",
            cursorBlinking: "solid"
        });
    }

    function togglePluginsPanel() {
        let panel = document.getElementById('avia-plugins-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            return;
        }

        panel = document.createElement('div');
        panel.id = 'avia-plugins-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '560px',
            height: '520px',
            background: 'var(--md-sys-color-surface, #1e1e1e)',
            color: 'var(--md-sys-color-on-surface, #fff)',
            borderRadius: '16px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            zIndex: '999999',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)'
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            padding: '14px 16px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'var(--md-sys-color-surface-container, rgba(255,255,255,0.04))',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            cursor: 'move',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: '0 0 auto'
        });

        const headerTitle = document.createElement('span');
        headerTitle.textContent = 'Plugins';

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        Object.assign(closeBtn.style, {
            cursor: 'pointer',
            opacity: '0.7',
            fontSize: '15px',
            lineHeight: '1',
            padding: '2px 4px'
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.7';
        closeBtn.onclick = () => panel.style.display = 'none';

        header.appendChild(headerTitle);
        header.appendChild(closeBtn);

        const controlsBar = document.createElement('div');
        Object.assign(controlsBar.style, {
            padding: '12px 16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flex: '0 0 auto'
        });

        const nameInput = document.createElement('input');
        nameInput.placeholder = 'Name';
        styleInput(nameInput);
        nameInput.style.width = '110px';

        const urlInput = document.createElement('input');
        urlInput.placeholder = 'Plugin URL';
        styleInput(urlInput);
        urlInput.style.flex = '1';

        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add';
        styleBtn(addBtn);
        addBtn.onclick = () => {
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();
            if (!name || !url) return;
            const plugins = getPlugins();
            plugins.push({ name, url, enabled: false });
            setPlugins(plugins);
            nameInput.value = '';
            urlInput.value = '';
            renderPanel();
        };

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Refresh';
        styleBtn(refreshBtn);
        refreshBtn.onclick = () => {
            getPlugins().forEach(p => { if (p.enabled) queuePlugin(p, true); });
        };

        controlsBar.appendChild(nameInput);
        controlsBar.appendChild(urlInput);
        controlsBar.appendChild(addBtn);
        controlsBar.appendChild(refreshBtn);

        const searchBar = document.createElement('div');
        Object.assign(searchBar.style, {
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flex: '0 0 auto'
        });

        const searchInput = document.createElement('input');
        searchInput.placeholder = 'Search plugins…';
        styleInput(searchInput);
        searchInput.style.width = '100%';
        searchInput.oninput = () => renderPanel(searchInput.value.toLowerCase());
        searchBar.appendChild(searchInput);

        const content = document.createElement('div');
        content.id = 'avia-plugins-content';
        Object.assign(content.style, {
            flex: '1',
            overflowY: 'auto',
            padding: '12px 16px 16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
        });
        if (!document.getElementById('avia-scrollbar-hide')) {
            const s = document.createElement('style');
            s.id = 'avia-scrollbar-hide';
            s.textContent = '#avia-plugins-content::-webkit-scrollbar{display:none}';
            document.head.appendChild(s);
        }

        panel.appendChild(header);
        panel.appendChild(controlsBar);
        panel.appendChild(searchBar);
        panel.appendChild(content);
        document.body.appendChild(panel);
        enableDragOn(panel, header);
        renderPanel();
    }

    function renderPanel(filter = '') {
        const content = document.getElementById('avia-plugins-content');
        if (!content) return;
        content.innerHTML = '';

        const plugins = getPlugins();
        const runSnap = { ...runningPlugins };
        const errSnap = { ...pluginErrors };

        const visible = filter
            ? plugins.filter(p => p.name.toLowerCase().includes(filter))
            : plugins;

        if (visible.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = plugins.length === 0
                ? 'No plugins yet. Add one above.'
                : 'No plugins match your search.';
            Object.assign(empty.style, { opacity: '0.4', fontSize: '13px', textAlign: 'center', padding: '24px 0' });
            content.appendChild(empty);
            return;
        }

        const sectionLabel = document.createElement('div');
        sectionLabel.textContent = `User Plugins: ${visible.length}`;
        Object.assign(sectionLabel.style, {
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '10px'
        });
        content.appendChild(sectionLabel);

        const grid = document.createElement('div');
        Object.assign(grid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '10px'
        });

        visible.forEach((plugin) => {
            const realIndex = plugins.indexOf(plugin);
            const isRunning = !!runSnap[plugin.url];
            const hasError = !!errSnap[plugin.url];

            const card = document.createElement('div');
            Object.assign(card.style, {
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${hasError ? 'rgba(255,77,77,0.3)' : isRunning ? 'rgba(77,255,136,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            });
            card.onmouseenter = () => {
                if (!hasError && !isRunning) card.style.borderColor = 'rgba(255,255,255,0.13)';
            };
            card.onmouseleave = () => {
                card.style.borderColor = hasError ? 'rgba(255,77,77,0.3)' : isRunning ? 'rgba(77,255,136,0.25)' : 'rgba(255,255,255,0.06)';
            };

            const topRow = document.createElement('div');
            Object.assign(topRow.style, {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
            });

            const nameWrap = document.createElement('div');
            Object.assign(nameWrap.style, { display: 'flex', alignItems: 'center', gap: '7px', minWidth: '0', flex: '1' });

            const dot = document.createElement('div');
            Object.assign(dot.style, {
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                flexShrink: '0',
                background: hasError ? '#ff4d4d' : isRunning ? '#4dff88' : '#555',
                boxShadow: hasError ? '0 0 5px #ff4d4d' : isRunning ? '0 0 5px #4dff88' : 'none'
            });

            const nameEl = document.createElement('div');
            nameEl.textContent = plugin.name;
            Object.assign(nameEl.style, {
                fontSize: '13px',
                fontWeight: '600',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            });

            nameWrap.appendChild(dot);
            nameWrap.appendChild(nameEl);

            const switchWrap = document.createElement('div');
            Object.assign(switchWrap.style, {
                position: 'relative',
                width: '36px',
                height: '20px',
                flexShrink: '0',
                cursor: 'pointer'
            });

            const track = document.createElement('div');
            Object.assign(track.style, {
                position: 'absolute',
                inset: '0',
                borderRadius: '10px',
                background: plugin.enabled ? 'rgba(100,160,255,0.6)' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.2s'
            });

            const thumb = document.createElement('div');
            Object.assign(thumb.style, {
                position: 'absolute',
                top: '3px',
                left: plugin.enabled ? '19px' : '3px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
                pointerEvents: 'none'
            });

            switchWrap.appendChild(track);
            switchWrap.appendChild(thumb);

            switchWrap.onclick = () => {
                plugin.enabled = !plugin.enabled;
                setPlugins(plugins);
                if (plugin.enabled) queuePlugin(plugin);
                else stopPlugin(plugin);
                renderPanel(filter);
            };

            topRow.appendChild(nameWrap);
            topRow.appendChild(switchWrap);

            const footer = document.createElement('div');
            Object.assign(footer.style, { display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '2px' });

            const viewBtn = document.createElement('button');
            viewBtn.textContent = 'View';
            styleBtn(viewBtn, 'rgba(100,160,255,0.15)');
            viewBtn.style.flex = '1';
            viewBtn.onclick = () => openViewerPanel(plugin);

            const removeBtn = document.createElement('button');
            removeBtn.textContent = '✕';
            styleBtn(removeBtn, 'rgba(255,80,80,0.15)');
            removeBtn.onclick = () => {
                stopPlugin(plugin);
                plugins.splice(realIndex, 1);
                setPlugins(plugins);
                renderPanel(filter);
            };

            footer.appendChild(viewBtn);
            footer.appendChild(removeBtn);

            card.appendChild(topRow);
            card.appendChild(footer);
            grid.appendChild(card);
        });

        content.appendChild(grid);
    }

    function styleInput(input) {
        Object.assign(input.style, {
            padding: '6px 8px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '13px'
        });
    }

    function styleBtn(btn, bg) {
        Object.assign(btn.style, {
            padding: '5px 12px',
            borderRadius: '8px',
            border: 'none',
            background: bg || 'rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            whiteSpace: 'nowrap'
        });
        btn.onmouseenter = () => btn.style.opacity = '0.75';
        btn.onmouseleave = () => btn.style.opacity = '1';
    }

    function enableDragOn(panel, header) {
        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });
        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
    }

    function injectButtons() {
        if (document.getElementById('stoat-fake-plugins')) return;
        const appearanceBtn = [...document.querySelectorAll('a')]
            .find(a => a.textContent.trim() === 'Appearance');
        if (!appearanceBtn) return;
        const referenceNode = document.getElementById('stoat-fake-quickcss');
        if (!referenceNode) return;
        const pluginsBtn = appearanceBtn.cloneNode(true);
        pluginsBtn.id = 'stoat-fake-plugins';
        const textNode = [...pluginsBtn.querySelectorAll('div')]
            .find(d => d.children.length === 0 && d.textContent.trim() === 'Appearance');
        if (textNode) textNode.textContent = "(Avia) Plugins";
        const svgNS = "http://www.w3.org/2000/svg";
        const oldSvg = pluginsBtn.querySelector('svg');
        if (oldSvg) oldSvg.remove();
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "currentColor");
        svg.style.marginRight = "8px";
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M20.5 11H19V7a2 2 0 00-2-2h-4V3.5a2.5 2.5 0 00-5 0V5H4a2 2 0 00-2 2v3.8h1.5c1.5 0 2.7 1.2 2.7 2.7S5 16.2 3.5 16.2H2V20a2 2 0 002 2h3.8v-1.5c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7V22H17a2 2 0 002-2v-4h1.5a2.5 2.5 0 000-5z");
        svg.appendChild(path);
        pluginsBtn.insertBefore(svg, pluginsBtn.firstChild);
        pluginsBtn.addEventListener('click', togglePluginsPanel);
        referenceNode.parentElement.insertBefore(pluginsBtn, referenceNode.nextSibling);
    }

    function waitForBody(callback) {
        if (document.body) callback();
        else new MutationObserver((obs) => {
            if (document.body) { obs.disconnect(); callback(); }
        }).observe(document.documentElement, { childList: true });
    }

    waitForBody(() => {
        const observer = new MutationObserver(() => injectButtons());
        observer.observe(document.body, { childList: true, subtree: true });
        injectButtons();
        preloadMonaco();
    });

    getPlugins().forEach(plugin => {
        if (plugin.enabled) queuePlugin(plugin);
    });

})();



/* --- backup.js --- */
if(window.__US_BUILDER_BACKUP_JS__){return;}window.__US_BUILDER_BACKUP_JS__=true;

(function () {
  if (window.__clientBackup) return;
  window.__clientBackup = true;

  const TARGET_TEXT = "Plugins v2 Placeholder";
  const CLONE_KEY   = "data-lsbackup-cloned";

  function exportLS() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "localstorage-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importLS(file, onDone) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        let count = 0;
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, value);
          count++;
        }
        onDone(null, count);
      } catch (err) {
        onDone(err);
      }
    };
    reader.readAsText(file);
  }

  function buildPanel() {
    const panel = document.createElement("div");
    panel.style.cssText = `
      display: none;
      flex-direction: column;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--md-sys-color-surface-container-highest);
      border: 1px solid var(--md-sys-color-outline-variant);
      font-size: 12px;
      color: var(--md-sys-color-on-surface);
    `;

    const btnStyle = `
      padding: 5px 12px;
      border-radius: 4px;
      border: none;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    `;

    const status = document.createElement("span");
    status.style.cssText = "font-size: 11px; opacity: 0.7; min-height: 14px;";

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "⬇ Export localStorage";
    exportBtn.style.cssText = btnStyle + `
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    `;
    exportBtn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      exportLS();
      status.textContent = `✓ Exported ${localStorage.length} keys`;
    });

    const fileInput = document.createElement("input");
    fileInput.type   = "file";
    fileInput.accept = ".json";
    fileInput.style.cssText = "display: none;";
    fileInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      importLS(file, (err, count) => {
        if (err) {
          status.textContent = "✗ Invalid JSON file";
        } else {
          status.textContent = `✓ Imported ${count} keys`;
        }
        fileInput.value = "";
      });
    });

    const importBtn = document.createElement("button");
    importBtn.textContent = "⬆ Import localStorage";
    importBtn.style.cssText = btnStyle + `
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface);
      border: 1px solid var(--md-sys-color-outline-variant);
    `;
    importBtn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    });

    panel.appendChild(exportBtn);
    panel.appendChild(importBtn);
    panel.appendChild(fileInput);
    panel.appendChild(status);
    return panel;
  }

  function tryInject() {
    document.querySelectorAll("a.pos_relative").forEach(btn => {
      if (
        btn.hasAttribute(CLONE_KEY) ||
        btn.hasAttribute("data-lsbackup-entry") ||
        !btn.innerText.includes(TARGET_TEXT)
      ) return;

      btn.setAttribute(CLONE_KEY, "true");

      const clone = btn.cloneNode(true);
      clone.removeAttribute(CLONE_KEY);
      clone.setAttribute("data-lsbackup-entry", "true");

      const title = clone.querySelector("div.d_flex.flex-g_1.flex-d_column > div");
      if (title) title.textContent = "AviaClient Backup";

      const desc = clone.querySelector("div.d_flex.flex-g_1.flex-d_column > span");
      if (desc) desc.textContent = "Backup or Restore all client data";

      const iconBtn = document.createElement("div");
      iconBtn.title = "LocalStorage Backup";
      iconBtn.style.cssText = "cursor: pointer; z-index: 10; flex-shrink: 0;";
      iconBtn.innerHTML = `
        <div class="fill_var(--md-sys-color-on-surface) bg_var(--md-sys-color-surface-dim) w_36px h_36px d_flex flex-sh_0 ai_center jc_center bdr_var(--borderRadius-full)">
          <span aria-hidden="true" class="material-symbols-outlined fs_inherit fw_undefined!" style="display: block; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0;">database</span>
        </div>
      `;

      const existingIcon = clone.querySelector("div.fill_var\\(--md-sys-color-on-surface\\)");
      if (existingIcon) {
        existingIcon.replaceWith(iconBtn);
      } else {
        clone.prepend(iconBtn);
      }

      clone.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        panel.style.display = panel.style.display === "flex" ? "none" : "flex";
      });

      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display: flex; flex-direction: column;";

      const panel = buildPanel();

      wrapper.appendChild(clone);
      wrapper.appendChild(panel);

      btn.parentNode.insertBefore(wrapper, btn.nextSibling);
    });
  }

  tryInject();

  const observer = new MutationObserver(() => tryInject());
  observer.observe(document.body, { childList: true, subtree: true });
})();


/* --- aviaclientcategory.js --- */
if(window.__US_BUILDER_AVIACLIENTCATEGORY_JS__){return;}window.__US_BUILDER_AVIACLIENTCATEGORY_JS__=true;

(function(){
    if(window.__AVIA_CATEGORY_SETTINGS__) return;
    window.__AVIA_CATEGORY_SETTINGS__ = true;

    function inject(){

        if(document.getElementById('avia-cloned-settings')) return;

        const spans = [...document.querySelectorAll('span')];
        const target = spans.find(s => s.textContent.trim() === "User Settings");
        if(!target) return;

        const container = target.closest('.d_flex.flex-d_column');
        if(!container) return;

        const clone = container.cloneNode(true);
        clone.id = "avia-cloned-settings";

        const header = clone.querySelector('span');
        if(header) header.textContent = "AVIA CLIENT SETTINGS";

        const list = clone.querySelector('.d_flex.flex-d_column.gap_var\\(--gap-s\\)');
        if(list) list.innerHTML = "";

        container.parentNode.insertBefore(clone, container.nextSibling);
        }

        new MutationObserver(() => {
            inject();
        }).observe(document.body, { childList: true, subtree: true });

    inject();

})();



/* --- badges.js --- */
if(window.__US_BUILDER_BADGES_JS__){return;}window.__US_BUILDER_BADGES_JS__=true;

(function () {
    if (window.__AVIA_PROFILE_BADGESV2__) return;
    window.__AVIA_PROFILE_BADGESV2__ = true;

    const BADGE_URL = "https://raw.githubusercontent.com/AvaLilac/AviaClientBadges/refs/heads/main/userbadgesbackend.js";

    let badgeData = null, loadingPromise = null;

    function loadBadges() {
        if (badgeData) return Promise.resolve();
        if (loadingPromise) return loadingPromise;

        loadingPromise = fetch(BADGE_URL + "?t=" + Date.now())
            .then(r => r.text())
            .then(code => {
                new Function(code)();
                badgeData = window.AVIA_USER_BADGES || [];
            })
            .catch(() => { badgeData = []; });

        return loadingPromise;
    }

    function getUsername(root) {
        const tag = root.querySelector("span.fw_200");
        if (!tag) return null;
        const span = tag.parentElement;
        return span ? span.textContent.trim() : null;
    }

    function getUserBadges(username) {
        if (!badgeData) return [];
        const clean = username.trim().toLowerCase();
        return badgeData.filter(b =>
            b.users.some(u => u.toLowerCase() === clean)
        );
    }

    function findCardByTitle(root, title) {
        return [...root.querySelectorAll("div.pos_relative")]
            .find(c => {
                const heading = c.querySelector("span.fw_550");
                return heading && heading.textContent.trim() === title;
            });
    }

    function makeBadgeSpan(b) {
        const wrapper = document.createElement("span");
        wrapper.setAttribute("aria-label", b.name);
        wrapper.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;font-size:20px;line-height:1;cursor:default;position:relative;";
        wrapper.textContent = b.icon;

        let tip = null;

        wrapper.addEventListener("mouseenter", () => {
            tip = document.createElement("div");
            tip.style.cssText = "position:fixed;z-index:9999;pointer-events:none;white-space:nowrap;";

            const inner = document.createElement("div");
            inner.className = "bg_black p_var(--gap-md) bdr_var(--borderRadius-md) lh_0.875rem fs_0.6875rem ls_0.03125rem fw_500";

            const color = b.color || "";
            if (color.includes("gradient")) {
                inner.style.background = color;
                inner.style.webkitBackgroundClip = "text";
                inner.style.webkitTextFillColor = "transparent";
                inner.style.color = "transparent";
            } else {
                inner.style.color = color || "white";
            }

            inner.textContent = b.name;
            tip.appendChild(inner);
            document.body.appendChild(tip);

            requestAnimationFrame(() => {
                const badgeRect = wrapper.getBoundingClientRect();
                const tipRect = tip.getBoundingClientRect();
                const x = badgeRect.left + badgeRect.width / 2 - tipRect.width / 2;
                const y = badgeRect.top - tipRect.height - 5;
                tip.style.left = Math.max(4, x) + "px";
                tip.style.top = Math.max(4, y) + "px";
            });
        });

        wrapper.addEventListener("mouseleave", () => {
            if (tip) { tip.remove(); tip = null; }
        });

        return wrapper;
    }

    function injectBadges(root, username) {
        if (root.querySelector("[data-avia-badge-injected='true']")) return;

        const badges = getUserBadges(username);
        if (!badges.length) return;

        const nativeBadgesCard = findCardByTitle(root, "Badges");
        if (nativeBadgesCard) {
            const grid = nativeBadgesCard.querySelector("div.d_flex.flex-wrap_wrap");
            if (!grid) return;
            badges.forEach(b => grid.appendChild(makeBadgeSpan(b)));
            nativeBadgesCard.dataset.aviaBadgeInjected = "true";
            return;
        }

        const joinedCard = findCardByTitle(root, "Joined");
        if (!joinedCard) return;

        const card = joinedCard.cloneNode(false);
        card.removeAttribute("data-avia-badge-injected");
        card.dataset.aviaBadgeInjected = "true";
        card.style.cssText = "overflow:hidden;";
        if (!card.classList.contains("asp_1/1")) card.classList.add("asp_1/1");

        const titleSpan = joinedCard.querySelector("span.fw_550");
        const title = titleSpan ? titleSpan.cloneNode(false) : document.createElement("span");
        title.textContent = "Badges";
        card.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "gap_var(--gap-md) d_flex flex-wrap_wrap [&_img,_&_svg]:w_24px [&_img,_&_svg]:h_24px [&_img,_&_svg]:asp_1/1";
        grid.style.overflow = "hidden";
        badges.forEach(b => grid.appendChild(makeBadgeSpan(b)));
        card.appendChild(grid);

        joinedCard.insertAdjacentElement("afterend", card);
    }

    async function processProfile(root) {
        await loadBadges();

        const username = getUsername(root);
        if (!username) return;

        if (findCardByTitle(root, "Badges")) {
            injectBadges(root, username);
            return;
        }

        const obs = new MutationObserver(() => {
            if (!findCardByTitle(root, "Joined")) return;
            if (!findCardByTitle(root, "Bio")) return;
            obs.disconnect();
            injectBadges(root, username);
        });

        obs.observe(root, { childList: true, subtree: true });

        if (findCardByTitle(root, "Joined") && findCardByTitle(root, "Bio")) {
            obs.disconnect();
            injectBadges(root, username);
        }

        setTimeout(() => obs.disconnect(), 10000);
    }

    const observer = new MutationObserver(muts => {
        for (const m of muts) {
            for (const n of m.addedNodes) {
                if (!(n instanceof HTMLElement)) continue;

                if (n.matches?.("div.will-change_transform")) processProfile(n);
                if (n.matches?.("div.p_24px.min-w_280px.max-w_560px")) processProfile(n);

                const small    = n.querySelector?.("div.will-change_transform");
                const expanded = n.querySelector?.("div.p_24px.min-w_280px.max-w_560px");
                if (small)    processProfile(small);
                if (expanded) processProfile(expanded);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();


/* --- ButtonFix.js --- */
if(window.__US_BUILDER_BUTTONFIX_JS__){return;}window.__US_BUILDER_BUTTONFIX_JS__=true;

(function () {
    if (window.__BUTTON_FIX__) return;
    window.__BUTTON_FIX__ = true;

    function uninjectButton(button){
        if(button){
            button.parentElement.removeChild(button)
        }
    }
    
    const observer = new MutationObserver(()=>{
        let balls = [];
        document.querySelectorAll('div[class=\'flex-sh_0 d_flex ai_end jc_center w_42px\']').forEach(element=>{
        if(element.id?.includes('avia')){
            balls.push(element)
        }
        })
        
        const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
        .find(s => s.textContent.trim() === "gif");

        if(!gifSpan){
            balls.forEach(element=>{
                uninjectButton(element)
            })
        }
    });
    observer.observe(document.documentElement, {childList: true, subtree: true })
})();


/* --- aviafavsystem.js --- */
if(window.__US_BUILDER_AVIAFAVSYSTEM_JS__){return;}window.__US_BUILDER_AVIAFAVSYSTEM_JS__=true;

(function () {
    if (window.__AVIA_FAVORITES_LOADED__) return;
    window.__AVIA_FAVORITES_LOADED__ = true;

    const STORAGE_KEY = "avia_favorites";

    const getFavorites = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setFavorites = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    function extractYouTubeID(url) {
        const reg = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/;
        const match = url.match(reg);
        return match ? match[1] : null;
    }

    function fallbackCopy(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0;";
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(ta);
    }

    function updateBadge() {
        const badge = document.getElementById("avia-favorites-badge");
        if (!badge) return;
        const count = getFavorites().length;
        badge.textContent = count;
        badge.style.display = count > 0 ? "flex" : "none";
    }

    function showToast(card, msg) {
        const old = card.querySelector(".fav-toast");
        if (old) old.remove();
        const toast = document.createElement("div");
        toast.className = "fav-toast";
        toast.textContent = msg || "Copied!";
        Object.assign(toast.style, {
            position: "absolute",
            bottom: "6px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.85)",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            color: "#fff",
            opacity: "0",
            transition: "opacity 0.15s",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: "3"
        });
        card.appendChild(toast);
        requestAnimationFrame(() => toast.style.opacity = "1");
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 150);
        }, 1500);
    }

    function flashDupe(url) {
        const card = document.querySelector(`[data-fav-url="${CSS.escape(url)}"]`);
        if (!card) return;
        card.style.outline = "2px solid rgba(255,80,80,0.9)";
        setTimeout(() => { card.style.outline = ""; }, 700);
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function buildCard(item, onRemove) {
        const card = document.createElement("div");
        card.dataset.favUrl = item.url;
        Object.assign(card.style, {
            position: "relative",
            width: "90px",
            height: "90px",
            borderRadius: "12px",
            overflow: "hidden",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer",
            flexShrink: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color 0.2s, transform 0.15s"
        });

        const removeBtn = document.createElement("div");
        removeBtn.textContent = "✕";
        Object.assign(removeBtn.style, {
            position: "absolute",
            top: "4px",
            right: "5px",
            fontSize: "10px",
            cursor: "pointer",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "1px 4px",
            borderRadius: "4px",
            zIndex: "2",
            opacity: "0",
            transition: "opacity 0.15s"
        });
        removeBtn.onclick = e => {
            e.stopPropagation();
            onRemove(item.url);
        };
        card.appendChild(removeBtn);

        card.addEventListener("mouseenter", () => {
            card.style.borderColor = "rgba(255,255,255,0.25)";
            card.style.transform = "scale(1.04)";
            removeBtn.style.opacity = "1";
        });
        card.addEventListener("mouseleave", () => {
            card.style.borderColor = "rgba(255,255,255,0.08)";
            card.style.transform = "scale(1)";
            removeBtn.style.opacity = "0";
        });

        const ytID = extractYouTubeID(item.url);
        if (ytID) {
            const img = new Image();
            img.draggable = false;
            img.src = `https://img.youtube.com/vi/${ytID}/hqdefault.jpg`;
            Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" });
            img.onerror = () => fallback();
            card.appendChild(img);
        } else {
            const ext = item.url.split(".").pop().split("?")[0].toLowerCase();
            const isVideo = ["mp4", "webm", "mov", "gifv"].includes(ext);

            if (isVideo) {
                const video = document.createElement("video");
                video.src = item.url.replace(".gifv", ".mp4");
                video.autoplay = true; video.loop = true;
                video.muted = true; video.playsInline = true;
                video.draggable = false;
                Object.assign(video.style, { width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" });
                video.onerror = () => fallback();
                card.appendChild(video);
            } else {
                const img = new Image();
                img.draggable = false;
                img.src = item.url;
                Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" });
                img.onerror = () => fallback();
                card.appendChild(img);
            }
        }

        function fallback() {
            [...card.children].forEach(c => { if (c !== removeBtn) c.remove(); });
            const inner = document.createElement("div");
            Object.assign(inner.style, {
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "4px", padding: "6px",
                width: "100%", height: "100%", boxSizing: "border-box", pointerEvents: "none"
            });
            const icon = document.createElement("span");
            icon.className = "material-symbols-outlined";
            icon.textContent = "link";
            icon.style.cssText = "font-size:20px;opacity:0.35;color:#fff;display:block;";
            inner.appendChild(icon);
            const label = document.createElement("div");
            if (item.title) {
                label.textContent = item.title;
            } else {
                try { label.textContent = new URL(item.url).hostname.replace("www.", ""); } catch { label.textContent = "link"; }
            }
            Object.assign(label.style, {
                fontSize: "9px", color: "#fff", opacity: "0.55",
                textAlign: "center", wordBreak: "break-word", overflow: "hidden",
                maxHeight: "36px", lineHeight: "1.3", padding: "0 4px"
            });
            inner.appendChild(label);
            card.appendChild(inner);
        }

        if (item.title) {
            const titleOverlay = document.createElement("div");
            titleOverlay.textContent = item.title;
            Object.assign(titleOverlay.style, {
                position: "absolute",
                bottom: "0",
                width: "100%",
                background: "rgba(0,0,0,0.6)",
                fontSize: "11px",
                padding: "4px",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                zIndex: "1",
                pointerEvents: "none"
            });
            card.appendChild(titleOverlay);
        }

        card.addEventListener("click", () => {
            const done = () => showToast(card, "Copied!");
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(item.url).then(done).catch(() => { fallbackCopy(item.url); done(); });
            } else {
                fallbackCopy(item.url); done();
            }
        });

        return card;
    }

    function toggleFavoritesPanel() {
        let panel = document.getElementById("avia-favorites-panel");
        if (panel) {
            const isHidden = panel.style.display === "none";
            panel.style.display = isHidden ? "flex" : "none";
            if (isHidden) renderGrid();
            return;
        }

        panel = document.createElement("div");
        panel.id = "avia-favorites-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            right: "40px",
            width: "460px",
            height: "400px",
            background: "var(--md-sys-color-surface, #141418)",
            color: "var(--md-sys-color-on-surface, #fff)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: "999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)"
        });

        const header = document.createElement("div");
        Object.assign(header.style, {
            padding: "13px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: "0"
        });

        const headerIcon = document.createElement("span");
        headerIcon.className = "material-symbols-outlined";
        headerIcon.textContent = "star";
        headerIcon.style.cssText = "font-size:18px;opacity:0.7;display:block;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0;";
        header.appendChild(headerIcon);

        const headerTitle = document.createElement("span");
        headerTitle.textContent = "Favorites";
        header.appendChild(headerTitle);

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            marginLeft: "auto", cursor: "pointer", opacity: "0.5",
            fontSize: "13px", lineHeight: "1"
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
        closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.5";
        closeBtn.onclick = () => panel.style.display = "none";
        header.appendChild(closeBtn);

        const inputRow = document.createElement("div");
        Object.assign(inputRow.style, {
            padding: "10px 14px", display: "flex", gap: "6px",
            alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: "0"
        });

        const urlInput = document.createElement("input");
        urlInput.placeholder = "Paste a link...";
        Object.assign(urlInput.style, {
            flex: "1", padding: "7px 10px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--md-sys-color-on-surface, #fff)",
            fontSize: "12px", outline: "none", minWidth: "0"
        });

        const titleInput = document.createElement("input");
        titleInput.placeholder = "Title (optional)";
        Object.assign(titleInput.style, {
            width: "110px", flexShrink: "0", padding: "7px 10px",
            borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--md-sys-color-on-surface, #fff)",
            fontSize: "12px", outline: "none"
        });

        const addBtn = document.createElement("button");
        addBtn.textContent = "Add";
        Object.assign(addBtn.style, {
            padding: "7px 14px", borderRadius: "8px", border: "none",
            background: "var(--md-sys-color-primary, rgba(255,255,255,0.15))",
            color: "var(--md-sys-color-on-primary, #fff)",
            fontSize: "12px", fontWeight: "600", cursor: "pointer",
            flexShrink: "0", transition: "opacity 0.15s"
        });
        addBtn.onmouseenter = () => addBtn.style.opacity = "0.8";
        addBtn.onmouseleave = () => addBtn.style.opacity = "1";

        inputRow.appendChild(urlInput);
        inputRow.appendChild(titleInput);
        inputRow.appendChild(addBtn);

        const gridWrapper = document.createElement("div");
        Object.assign(gridWrapper.style, {
            flex: "1", minHeight: "0", overflowY: "auto",
            padding: "14px", boxSizing: "border-box"
        });

        const grid = document.createElement("div");
        grid.id = "avia-favorites-grid";
        Object.assign(grid.style, {
            display: "flex", flexWrap: "wrap", gap: "10px", alignContent: "start"
        });

        gridWrapper.appendChild(grid);
        panel.appendChild(header);
        panel.appendChild(inputRow);
        panel.appendChild(gridWrapper);
        document.body.appendChild(panel);

        let isPanelDragging = false, pOffsetX, pOffsetY;
        header.addEventListener("mousedown", e => {
            isPanelDragging = true;
            const rect = panel.getBoundingClientRect();
            pOffsetX = e.clientX - rect.left;
            pOffsetY = e.clientY - rect.top;
            panel.style.bottom = "auto"; panel.style.right = "auto";
            panel.style.left = rect.left + "px"; panel.style.top = rect.top + "px";
            document.body.style.userSelect = "none";
        });
        document.addEventListener("mouseup", () => {
            isPanelDragging = false;
            document.body.style.userSelect = "";
        });
        document.addEventListener("mousemove", e => {
            if (!isPanelDragging) return;
            panel.style.left = (e.clientX - pOffsetX) + "px";
            panel.style.top = (e.clientY - pOffsetY) + "px";
        });

        function tryAdd() {
            const url = urlInput.value.trim();
            const title = titleInput.value.trim();
            if (!url) return;
            const favs = getFavorites();
            if (favs.some(f => f.url === url)) { flashDupe(url); return; }
            favs.push({ url, title, addedAt: Date.now() });
            setFavorites(favs);
            urlInput.value = ""; titleInput.value = "";
            updateBadge(); renderGrid();
        }

        addBtn.onclick = tryAdd;
        urlInput.addEventListener("keydown", e => { if (e.key === "Enter") tryAdd(); });
        titleInput.addEventListener("keydown", e => { if (e.key === "Enter") tryAdd(); });

        renderGrid();
    }

    function renderGrid() {
        const grid = document.getElementById("avia-favorites-grid");
        if (!grid) return;
        grid.innerHTML = "";

        const favs = getFavorites();

        if (favs.length === 0) {
            const empty = document.createElement("div");
            Object.assign(empty.style, {
                width: "100%", padding: "24px 0", textAlign: "center",
                opacity: "0.35", fontSize: "13px",
                color: "var(--md-sys-color-on-surface, #fff)"
            });
            const emptyIcon = document.createElement("span");
            emptyIcon.className = "material-symbols-outlined";
            emptyIcon.textContent = "star_border";
            emptyIcon.style.cssText = "display:block;font-size:32px;margin-bottom:6px;";
            empty.appendChild(emptyIcon);
            const emptyText = document.createElement("div");
            emptyText.textContent = "No favorites yet";
            empty.appendChild(emptyText);
            grid.appendChild(empty);
            return;
        }

        const onRemove = (url) => {
            setFavorites(getFavorites().filter(f => f.url !== url));
            updateBadge();
            renderGrid();
        };

        favs.forEach(item => grid.insertBefore(buildCard(item, onRemove), grid.firstChild));
    }

    function injectButton() {
        if (document.getElementById("avia-favorites-btn")) return;
        const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
            .find(s => s.textContent.trim() === "gif");
        if (!gifSpan) return;
        const wrapper = gifSpan.closest("div.flex-sh_0");
        if (!wrapper) return;
        const clone = wrapper.cloneNode(true);
        clone.id = "avia-favorites-btn";
        clone.style.position = "relative";

        const btn = clone.querySelector("button");
        btn.onclick = toggleFavoritesPanel;

        btn.style.position = "relative";

        clone.querySelector("span.material-symbols-outlined").textContent = "star";

        const badge = document.createElement("div");
        badge.id = "avia-favorites-badge";
        Object.assign(badge.style, {
            position: "absolute",
            top: "2px",
            right: "2px",
            background: "var(--md-sys-color-primary, #6750a4)",
            color: "var(--md-sys-color-on-primary, #fff)",
            borderRadius: "99px",
            fontSize: "9px",
            fontWeight: "700",
            minWidth: "14px",
            height: "14px",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            pointerEvents: "none",
            zIndex: "1"
        });

        btn.appendChild(badge);

        wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);
        updateBadge();
    }

    new MutationObserver(injectButton).observe(document.body, { childList: true, subtree: true });
    injectButton();
})();



})();

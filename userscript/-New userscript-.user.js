// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2026-04-20
// @description  try to take over the world!
// @author       You
// @match        old.stoat.chat/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

state.plugins.add({
    format: 1,
    version: "1.0",
    namespace: "AvaLilac",
    id: "RevivaClient",
    entrypoint: `
    async () => {

        // ════════════════════════════════════════════════════════════════════
        //  PLUGIN MANAGER
        // ════════════════════════════════════════════════════════════════════
        (function () {
            if (window.__AVIA_PLUGINS_LOADED__) return;
            window.__AVIA_PLUGINS_LOADED__ = true;

            const STORAGE_KEY = "avia_plugins";
            const runningPlugins = {};
            const pluginErrors   = {};
            const injectionQueue = [];

            const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

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
                    const res = await fetch(plugin.url);
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
                    loader.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js";
                    loader.onload = function () {
                        require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs" } });
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
                    position: "fixed", bottom: "24px", left: "24px",
                    width: "700px", height: "480px",
                    background: "var(--md-sys-color-surface, #1e1e1e)",
                    borderRadius: "16px", boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
                    zIndex: "9999999", display: "flex", flexDirection: "column",
                    overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)", color: "#fff"
                });

                const header = document.createElement("div");
                Object.assign(header.style, {
                    padding: "14px 16px", fontWeight: "600", fontSize: "14px",
                    background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
                    borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "move",
                    display: "flex", alignItems: "center", gap: "10px", flex: "0 0 auto"
                });

                const titleText = document.createElement("span");
                titleText.textContent = "Viewing: " + plugin.name;
                titleText.style.flex = "1";

                const readOnlyBadge = document.createElement("span");
                readOnlyBadge.textContent = "READ ONLY";
                Object.assign(readOnlyBadge.style, {
                    fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em",
                    padding: "2px 8px", borderRadius: "20px",
                    background: "rgba(255,180,0,0.15)", color: "#ffb400",
                    border: "1px solid rgba(255,180,0,0.3)"
                });

                const closeBtn = document.createElement("div");
                closeBtn.textContent = "\u2715";
                Object.assign(closeBtn.style, {
                    cursor: "pointer", opacity: "0.6", fontSize: "15px",
                    lineHeight: "1", padding: "2px 4px"
                });
                closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
                closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.6";
                closeBtn.onclick = () => panel.remove();

                header.appendChild(titleText);
                header.appendChild(readOnlyBadge);
                header.appendChild(closeBtn);

                const urlBar = document.createElement("div");
                Object.assign(urlBar.style, {
                    padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                    fontSize: "11px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace",
                    background: "rgba(0,0,0,0.15)", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "0 0 auto"
                });
                urlBar.textContent = plugin.url;
                urlBar.title = plugin.url;

                const editorContainer = document.createElement("div");
                editorContainer.style.flex = "1";
                editorContainer.style.overflow = "hidden";

                const loadingMsg = document.createElement("div");
                Object.assign(loadingMsg.style, {
                    display: "flex", alignItems: "center", justifyContent: "center",
                    height: "100%", opacity: "0.4", fontSize: "13px"
                });
                loadingMsg.textContent = "Fetching source\u2026";
                editorContainer.appendChild(loadingMsg);

                panel.appendChild(header);
                panel.appendChild(urlBar);
                panel.appendChild(editorContainer);
                document.body.appendChild(panel);
                enableDragOn(panel, header);

                let code;
                try {
                    const res = await fetch(plugin.url);
                    if (!res.ok) throw new Error("HTTP " + res.status);
                    code = await res.text();
                } catch (err) {
                    loadingMsg.textContent = "Failed to fetch source: " + err.message;
                    loadingMsg.style.color = "#ff4d4d";
                    loadingMsg.style.opacity = "1";
                    return;
                }

                editorContainer.removeChild(loadingMsg);
                monaco.editor.create(editorContainer, {
                    value: code, language: "javascript", theme: "vs-dark",
                    readOnly: true, automaticLayout: true, minimap: { enabled: true },
                    fontSize: 13, scrollBeyondLastLine: false, wordWrap: "off",
                    domReadOnly: true, renderValidationDecorations: "off",
                    renderLineHighlight: "none", cursorStyle: "block", cursorBlinking: "solid"
                });
            }

            function togglePluginsPanel() {
                let panel = document.getElementById("avia-plugins-panel");
                if (panel) {
                    panel.style.display = panel.style.display === "none" ? "flex" : "none";
                    return;
                }
                panel = document.createElement("div");
                panel.id = "avia-plugins-panel";
                Object.assign(panel.style, {
                    position: "fixed", bottom: "24px", right: "24px",
                    width: "520px", height: "460px",
                    background: "var(--md-sys-color-surface, #1e1e1e)",
                    color: "var(--md-sys-color-on-surface, #fff)",
                    borderRadius: "16px", boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
                    zIndex: "999999", display: "flex", flexDirection: "column",
                    overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)"
                });

                const header = document.createElement("div");
                header.textContent = "Plugins";
                Object.assign(header.style, {
                    padding: "14px 16px", fontWeight: "600", fontSize: "14px",
                    background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
                    borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "move"
                });

                const closeBtn = document.createElement("div");
                closeBtn.textContent = "\u2715";
                Object.assign(closeBtn.style, {
                    position: "absolute", top: "12px", right: "16px",
                    cursor: "pointer", opacity: "0.7"
                });
                closeBtn.onclick = () => panel.style.display = "none";

                const controlsBar = document.createElement("div");
                Object.assign(controlsBar.style, {
                    padding: "12px 16px", display: "flex", gap: "8px",
                    alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)",
                    flex: "0 0 auto"
                });

                const content = document.createElement("div");
                content.id = "avia-plugins-content";
                Object.assign(content.style, { flex: "1", overflow: "auto", padding: "16px" });

                const nameInput = document.createElement("input");
                nameInput.placeholder = "Name";
                styleInput(nameInput);
                nameInput.style.width = "110px";

                const urlInput = document.createElement("input");
                urlInput.placeholder = "Plugin URL";
                styleInput(urlInput);
                urlInput.style.flex = "1";

                const addBtn = document.createElement("button");
                addBtn.textContent = "+ Add";
                styleBtn(addBtn);
                addBtn.onclick = () => {
                    const name = nameInput.value.trim();
                    const url  = urlInput.value.trim();
                    if (!name || !url) return;
                    const plugins = getPlugins();
                    plugins.push({ name, url, enabled: false });
                    setPlugins(plugins);
                    nameInput.value = "";
                    urlInput.value  = "";
                    renderPanel();
                };

                const refreshAll = document.createElement("button");
                refreshAll.textContent = "Refresh";
                styleBtn(refreshAll);
                refreshAll.onclick = () => {
                    getPlugins().forEach(p => { if (p.enabled) queuePlugin(p, true); });
                };

                controlsBar.appendChild(nameInput);
                controlsBar.appendChild(urlInput);
                controlsBar.appendChild(addBtn);
                controlsBar.appendChild(refreshAll);
                panel.appendChild(header);
                panel.appendChild(closeBtn);
                panel.appendChild(controlsBar);
                panel.appendChild(content);
                document.body.appendChild(panel);
                enableDragOn(panel, header);
                renderPanel();
            }

            function renderPanel() {
                const content = document.getElementById("avia-plugins-content");
                if (!content) return;
                content.innerHTML = "";
                const plugins         = getPlugins();
                const runningSnapshot = { ...runningPlugins };
                const errorSnapshot   = { ...pluginErrors };

                if (plugins.length === 0) {
                    const empty = document.createElement("div");
                    empty.textContent = "No plugins yet. Add one above.";
                    Object.assign(empty.style, { opacity: "0.4", fontSize: "13px" });
                    content.appendChild(empty);
                    return;
                }

                plugins.forEach((plugin, index) => {
                    const isRunning = !!runningSnapshot[plugin.url];
                    const hasError  = !!errorSnapshot[plugin.url];

                    const row = document.createElement("div");
                    Object.assign(row.style, {
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginBottom: "12px", padding: "10px 12px", borderRadius: "10px",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)"
                    });

                    const left = document.createElement("div");
                    Object.assign(left.style, { display: "flex", alignItems: "center", gap: "10px" });

                    const statusDot = document.createElement("div");
                    Object.assign(statusDot.style, {
                        width: "10px", height: "10px", borderRadius: "50%", flexShrink: "0"
                    });
                    if (hasError) {
                        statusDot.style.background  = "#ff4d4d";
                        statusDot.style.boxShadow   = "0 0 6px #ff4d4d";
                    } else if (isRunning) {
                        statusDot.style.background  = "#4dff88";
                        statusDot.style.boxShadow   = "0 0 6px #4dff88";
                    } else {
                        statusDot.style.background  = "#777";
                    }

                    const name = document.createElement("div");
                    name.textContent  = plugin.name;
                    name.style.fontSize = "13px";

                    left.appendChild(statusDot);
                    left.appendChild(name);

                    const controls = document.createElement("div");
                    Object.assign(controls.style, { display: "flex", gap: "6px" });

                    const toggle = document.createElement("button");
                    toggle.textContent = plugin.enabled ? "Disable" : "Enable";
                    styleBtn(toggle);
                    toggle.onclick = () => {
                        plugin.enabled = !plugin.enabled;
                        setPlugins(plugins);
                        if (plugin.enabled) queuePlugin(plugin);
                        else stopPlugin(plugin);
                        renderPanel();
                    };

                    const viewBtn = document.createElement("button");
                    viewBtn.textContent = "View";
                    styleBtn(viewBtn, "rgba(100,160,255,0.15)");
                    viewBtn.onclick = () => openViewerPanel(plugin);

                    const remove = document.createElement("button");
                    remove.textContent = "\u2715";
                    styleBtn(remove, "rgba(255,80,80,0.15)");
                    remove.onclick = () => {
                        stopPlugin(plugin);
                        plugins.splice(index, 1);
                        setPlugins(plugins);
                        renderPanel();
                    };

                    controls.appendChild(toggle);
                    controls.appendChild(viewBtn);
                    controls.appendChild(remove);
                    row.appendChild(left);
                    row.appendChild(controls);
                    content.appendChild(row);
                });
            }

            function styleInput(input) {
                Object.assign(input.style, {
                    padding: "6px 8px", borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "13px"
                });
            }

            function styleBtn(btn, bg) {
                Object.assign(btn.style, {
                    padding: "5px 12px", borderRadius: "8px", border: "none",
                    background: bg || "rgba(255,255,255,0.08)", color: "#fff",
                    cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap"
                });
                btn.onmouseenter = () => btn.style.opacity = "0.75";
                btn.onmouseleave = () => btn.style.opacity = "1";
            }

            function enableDragOn(panel, header) {
                let isDragging = false, offsetX, offsetY;
                header.addEventListener("mousedown", e => {
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
                    panel.style.left   = (e.clientX - offsetX) + "px";
                    panel.style.top    = (e.clientY - offsetY) + "px";
                    panel.style.right  = "auto";
                    panel.style.bottom = "auto";
                });
            }

            function injectButtons() {
                if (document.getElementById("avia-fake-plugins")) return;
                const items = [...document.querySelectorAll("._item_1avxi_1")];
                const appearanceBtn = items.find(el =>
                    el.querySelector("._content_1avxi_40")?.textContent.trim() === "Appearance"
                );
                if (!appearanceBtn) return;

                const pluginsBtn = appearanceBtn.cloneNode(true);
                pluginsBtn.id = "avia-fake-plugins";
                pluginsBtn.removeAttribute("data-active");

                const svgNS  = "http://www.w3.org/2000/svg";
                const oldSvg = pluginsBtn.querySelector("svg");
                if (oldSvg) {
                    const svg  = document.createElementNS(svgNS, "svg");
                    svg.setAttribute("viewBox", "0 0 24 24");
                    svg.setAttribute("width",   "20");
                    svg.setAttribute("height",  "20");
                    svg.setAttribute("fill",    "currentColor");
                    const path = document.createElementNS(svgNS, "path");
                    path.setAttribute("d", "M20.5 11H19V7a2 2 0 00-2-2h-4V3.5a2.5 2.5 0 00-5 0V5H4a2 2 0 00-2 2v3.8h1.5c1.5 0 2.7 1.2 2.7 2.7S5 16.2 3.5 16.2H2V20a2 2 0 002 2h3.8v-1.5c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7V22H17a2 2 0 002-2v-4h1.5a2.5 2.5 0 000-5z");
                    svg.appendChild(path);
                    oldSvg.replaceWith(svg);
                }

                const contentDiv = pluginsBtn.querySelector("._content_1avxi_40");
                if (contentDiv) {
                    for (const node of [...contentDiv.childNodes]) {
                        if (node.nodeType === Node.TEXT_NODE) node.remove();
                    }
                    contentDiv.appendChild(document.createTextNode(" (Avia) Plugins"));
                }

                pluginsBtn.addEventListener("click", togglePluginsPanel);
                appearanceBtn.parentNode.insertBefore(pluginsBtn, appearanceBtn.nextSibling);
            }

            function waitForBody(callback) {
                if (document.body) callback();
                else new MutationObserver((obs) => {
                    if (document.body) { obs.disconnect(); callback(); }
                }).observe(document.documentElement, { childList: true });
            }

            waitForBody(() => {
                new MutationObserver(() => injectButtons())
                    .observe(document.body, { childList: true, subtree: true });
                injectButtons();
                preloadMonaco();
            });

            getPlugins().forEach(plugin => { if (plugin.enabled) queuePlugin(plugin); });
        })();

        // ════════════════════════════════════════════════════════════════════
        //  THEME MANAGER
        // ════════════════════════════════════════════════════════════════════
        (function () {
            if (window.__AVIA_THEMES_LOADED__) return;
            window.__AVIA_THEMES_LOADED__ = true;

            const STORAGE_KEY = "avia_themes";
            let editingTheme  = null;
            const TEMPLATE    = "";

            const getThemes = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            const setThemes = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            function parseMeta(css) {
                const name        = css.match(/@name\s+(.+)/)?.[1]        || "Unknown Theme";
                const author      = css.match(/@author\s+(.+)/)?.[1]      || "Unknown";
                const version     = css.match(/@version\s+(.+)/)?.[1]     || "1.0";
                const rawDesc     = css.match(/@description\s+(.+)/)?.[1] || "No Description Available";
                const description = rawDesc.trim() === "*/" ? "No Description Available" : rawDesc;
                return { name, author, version, description };
            }

            function applyThemes() {
                document.querySelectorAll(".avia-theme-style").forEach(e => e.remove());
                getThemes().forEach(theme => {
                    if (!theme.enabled) return;
                    const style = document.createElement("style");
                    style.className   = "avia-theme-style";
                    style.textContent = theme.css;
                    document.head.appendChild(style);
                });
            }

            function styleBtn(btn, bg) {
                Object.assign(btn.style, {
                    padding: "5px 12px", borderRadius: "8px", border: "none",
                    background: bg || "rgba(255,255,255,0.08)", color: "#fff",
                    cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap", fontWeight: "500"
                });
                btn.onmouseenter = () => btn.style.opacity = "0.75";
                btn.onmouseleave = () => btn.style.opacity = "1";
            }

            function makeDraggable(panel, handle) {
                let dragging = false, offsetX, offsetY;
                handle.addEventListener("mousedown", e => {
                    dragging = true;
                    offsetX  = e.clientX - panel.offsetLeft;
                    offsetY  = e.clientY - panel.offsetTop;
                    document.body.style.userSelect = "none";
                });
                document.addEventListener("mouseup", () => {
                    dragging = false;
                    document.body.style.userSelect = "";
                });
                document.addEventListener("mousemove", e => {
                    if (!dragging) return;
                    panel.style.left   = (e.clientX - offsetX) + "px";
                    panel.style.top    = (e.clientY - offsetY) + "px";
                    panel.style.right  = "auto";
                    panel.style.bottom = "auto";
                });
            }

            function openThemeEditor(theme) {
                editingTheme = theme;
                let panel = document.getElementById("avia-theme-editor");
                if (panel) {
                    panel.style.display = "flex";
                    panel.querySelector("textarea").value = theme.css;
                    return;
                }
                panel = document.createElement("div");
                panel.id = "avia-theme-editor";
                Object.assign(panel.style, {
                    position: "fixed", bottom: "24px", right: "24px",
                    width: "420px", height: "340px",
                    background: "var(--md-sys-color-surface, #1e1e1e)",
                    color: "var(--md-sys-color-on-surface, #fff)",
                    borderRadius: "16px", boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
                    zIndex: "999999", display: "flex", flexDirection: "column",
                    overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)"
                });

                const header = document.createElement("div");
                header.textContent = "Theme Editor";
                Object.assign(header.style, {
                    padding: "14px 16px", fontWeight: "600", fontSize: "14px",
                    background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
                    borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "move"
                });
                makeDraggable(panel, header);

                const close = document.createElement("div");
                close.textContent = "\u2715";
                Object.assign(close.style, {
                    position: "absolute", right: "16px", top: "12px",
                    cursor: "pointer", opacity: "0.6", fontSize: "15px",
                    lineHeight: "1", padding: "2px 4px"
                });
                close.onmouseenter = () => close.style.opacity = "1";
                close.onmouseleave = () => close.style.opacity = "0.6";
                close.onclick = () => panel.style.display = "none";

                const textarea = document.createElement("textarea");
                Object.assign(textarea.style, {
                    flex: "1", border: "none", outline: "none", resize: "none",
                    padding: "16px", background: "transparent", color: "inherit",
                    fontFamily: "monospace", fontSize: "13px"
                });
                textarea.value = theme.css;
                textarea.addEventListener("input", () => {
                    const themes = getThemes();
                    const t = themes.find(x => x.id === editingTheme.id);
                    if (!t) return;
                    t.css = textarea.value;
                    setThemes(themes);
                    applyThemes();
                    if (window.__avia_refresh_themes_panel) window.__avia_refresh_themes_panel();
                });

                panel.appendChild(header);
                panel.appendChild(close);
                panel.appendChild(textarea);
                document.body.appendChild(panel);
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
                    position: "fixed", bottom: "40px", right: "40px",
                    width: "500px", height: "460px",
                    background: "var(--md-sys-color-surface, #1e1e1e)",
                    color: "var(--md-sys-color-on-surface, #fff)",
                    borderRadius: "16px", boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
                    zIndex: "999999", display: "flex", flexDirection: "column",
                    overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)"
                });

                const header = document.createElement("div");
                header.textContent = "Themes";
                Object.assign(header.style, {
                    padding: "14px 16px", fontWeight: "600", fontSize: "14px",
                    background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
                    borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "move"
                });
                makeDraggable(panel, header);

                const close = document.createElement("div");
                close.textContent = "\u2715";
                Object.assign(close.style, {
                    position: "absolute", right: "16px", top: "12px",
                    cursor: "pointer", opacity: "0.6", fontSize: "15px",
                    lineHeight: "1", padding: "2px 4px"
                });
                close.onmouseenter = () => close.style.opacity = "1";
                close.onmouseleave = () => close.style.opacity = "0.6";
                close.onclick = () => panel.style.display = "none";

                const btnRow = document.createElement("div");
                Object.assign(btnRow.style, {
                    display: "flex", gap: "8px", padding: "12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)", flex: "0 0 auto"
                });

                const importBtn = document.createElement("button");
                importBtn.textContent = "Import Theme";
                styleBtn(importBtn);
                importBtn.style.flex    = "1";
                importBtn.style.padding = "8px 12px";

                const newBtn = document.createElement("button");
                newBtn.textContent = "+ New";
                styleBtn(newBtn);
                newBtn.style.flex    = "1";
                newBtn.style.padding = "8px 12px";

                btnRow.appendChild(importBtn);
                btnRow.appendChild(newBtn);

                const list = document.createElement("div");
                Object.assign(list.style, {
                    flex: "1", overflowY: "auto", padding: "16px",
                    display: "flex", flexDirection: "column", gap: "8px"
                });

                panel.appendChild(header);
                panel.appendChild(close);
                panel.appendChild(btnRow);
                panel.appendChild(list);
                document.body.appendChild(panel);

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
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 12px", borderRadius: "10px",
                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)"
                        });

                        const left = document.createElement("div");
                        Object.assign(left.style, { display: "flex", alignItems: "center", gap: "10px" });

                        const dot = document.createElement("div");
                        Object.assign(dot.style, {
                            width: "10px", height: "10px", borderRadius: "50%", flexShrink: "0",
                            background:  theme.enabled ? "#4dff88" : "#777",
                            boxShadow:   theme.enabled ? "0 0 6px #4dff88" : "none"
                        });

                        const info = document.createElement("div");
                        info.innerHTML =
                            "<div style='font-weight:600;font-size:13px'>"   + meta.name        + "</div>" +
                            "<div style='font-size:11px;opacity:.5'>"        + meta.author + " \u2022 v" + meta.version + "</div>" +
                            "<div style='font-size:11px;opacity:.4'>"        + meta.description + "</div>";

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
                        edit.onclick = () => openThemeEditor(theme);

                        const del = document.createElement("button");
                        del.textContent = "\u2715";
                        styleBtn(del, "rgba(255,80,80,0.15)");
                        del.onclick = () => {
                            setThemes(themes.filter(t => t.id !== theme.id));
                            applyThemes();
                            render();
                        };

                        controls.appendChild(toggle);
                        controls.appendChild(edit);
                        controls.appendChild(del);
                        card.appendChild(left);
                        card.appendChild(controls);
                        list.appendChild(card);
                    });
                }

                window.__avia_refresh_themes_panel = render;

                importBtn.onclick = () => {
                    const input = document.createElement("input");
                    input.type   = "file";
                    input.accept = ".css,.txt";
                    input.onchange = async () => {
                        const file = input.files[0];
                        if (!file) return;
                        const css    = await file.text();
                        const themes = getThemes();
                        themes.push({ id: crypto.randomUUID(), css, enabled: true });
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
                const items = [...document.querySelectorAll("._item_1avxi_1")];
                const appearanceBtn = items.find(el =>
                    el.querySelector("._content_1avxi_40")?.textContent.trim() === "Appearance"
                );
                if (!appearanceBtn) return;

                const clone = appearanceBtn.cloneNode(true);
                clone.id = "avia-themes-btn";
                clone.removeAttribute("data-active");

                const svgNS  = "http://www.w3.org/2000/svg";
                const oldSvg = clone.querySelector("svg");
                if (oldSvg) {
                    const svg  = document.createElementNS(svgNS, "svg");
                    svg.setAttribute("viewBox", "0 0 24 24");
                    svg.setAttribute("width",   "20");
                    svg.setAttribute("height",  "20");
                    svg.setAttribute("fill",    "currentColor");
                    const path = document.createElementNS(svgNS, "path");
                    path.setAttribute("d", "M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.17-.64-1.59a.485.485 0 0 1-.13-.33c0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm5.5 11c-.83 0-1.5-.67-1.5-1.5S16.67 10 17.5 10s1.5.67 1.5 1.5S18.33 13 17.5 13zm-3-4c-.83 0-1.5-.67-1.5-1.5S13.67 6 14.5 6s1.5.67 1.5 1.5S15.33 9 14.5 9zM5 11.5C5 10.67 5.67 10 6.5 10s1.5.67 1.5 1.5S7.33 13 6.5 13 5 12.33 5 11.5zm6-4c0 .83-.67 1.5-1.5 1.5S8 8.33 8 7.5 8.67 6 9.5 6s1.5.67 1.5 1.5z");
                    svg.appendChild(path);
                    oldSvg.replaceWith(svg);
                }

                const contentDiv = clone.querySelector("._content_1avxi_40");
                if (contentDiv) {
                    for (const node of [...contentDiv.childNodes]) {
                        if (node.nodeType === Node.TEXT_NODE) node.remove();
                    }
                    contentDiv.appendChild(document.createTextNode(" (Avia) Themes"));
                }

                clone.addEventListener("click", toggleThemesPanel);
                appearanceBtn.parentNode.insertBefore(clone, appearanceBtn.nextSibling);
            }

            new MutationObserver(injectButton).observe(document.body, { childList: true, subtree: true });
            injectButton();
            applyThemes();
        })();

        // ════════════════════════════════════════════════════════════════════
        //  OFFICIAL REPO BROWSER
        // ════════════════════════════════════════════════════════════════════
        (function () {
            if (window.__AVIA_OFFICIAL_REPO_LOADED__) return;
            window.__AVIA_OFFICIAL_REPO_LOADED__ = true;

            const STORAGE_KEY         = "avia_plugins";
            const OFFICIAL_REPO_URL   = "https://avalilac.github.io/PluginRepo/pluginrepobackend.js";
            const THEMES_REGISTRY_URL = "https://avalilac.github.io/PluginRepo/themebackend/themerepobackend.js";

            const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            let repoContent;
            let currentRepoData  = [];
            let currentThemeData = [];
            let searchInput;
            let activeTab = "plugins";

            const THEMES_STORAGE_KEY = "avia_themes";
            const getStoredThemes    = () => JSON.parse(localStorage.getItem(THEMES_STORAGE_KEY) || "[]");
            const setStoredThemes    = (data) => localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(data));

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
                    const btn  = row.querySelector("button.install-btn");
                    if (!btn) return;
                    if (installed.includes(link)) { btn.textContent = "Installed"; btn.disabled = true; }
                    else { btn.textContent = "Install"; btn.disabled = false; }
                });
            }

            function renderRepo(data, filter = "") {
                if (!repoContent) return;
                currentRepoData  = data.plugins;
                repoContent.innerHTML = "";

                const filtered = currentRepoData.filter(p =>
                    (p.name + " " + (p.author || "") + " " + (p.description || ""))
                        .toLowerCase().includes(filter.toLowerCase())
                );

                if (filtered.length === 0) {
                    repoContent.innerHTML = "<div style='opacity:0.5;text-align:center;margin-top:30px;'>No plugins found.</div>";
                    return;
                }

                filtered.forEach(repoPlugin => {
                    const row = document.createElement("div");
                    row.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;width:100%;min-width:0;";
                    row.setAttribute("data-link", repoPlugin.link);

                    const left = document.createElement("div");
                    left.style.cssText = "display:flex;flex-direction:column;flex:1;min-width:0;";

                    const title = document.createElement("div");
                    title.textContent = repoPlugin.name + " \u2014 " + (repoPlugin.author || "Unknown");
                    title.style.cssText = "font-weight:500;word-break:break-word;";

                    const desc = document.createElement("div");
                    desc.textContent = repoPlugin.description || "";
                    desc.style.cssText = "font-size:12px;opacity:0.7;word-break:break-word;";

                    left.appendChild(title);
                    left.appendChild(desc);

                    const installBtn = document.createElement("button");
                    installBtn.className = "install-btn";
                    Object.assign(installBtn.style, {
                        padding: "6px 10px", borderRadius: "8px", border: "none",
                        cursor: "pointer", background: "rgba(255,255,255,0.08)",
                        color: "#fff", flexShrink: "0"
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
                fetch(OFFICIAL_REPO_URL)
                    .then(res => res.json())
                    .then(data => renderRepo(data))
                    .catch(() => { if (repoContent) repoContent.innerHTML = "Failed to fetch repo."; });
            }

            function installThemeCSS(theme, btn) {
                btn.disabled    = true;
                btn.textContent = "Installing\u2026";
                fetch(theme.download)
                    .then(r => r.text())
                    .then(rawCSS => {
                        const themes           = getStoredThemes();
                        const alreadyInstalled = themes.some(t => {
                            const match = t.css.match(/@name\s+(.+)/);
                            return match && match[1].trim() === theme.name;
                        });
                        if (alreadyInstalled) { btn.textContent = "Installed"; return; }
                        themes.push({ id: crypto.randomUUID(), css: rawCSS, enabled: true });
                        setStoredThemes(themes);
                        document.querySelectorAll(".avia-theme-style").forEach(e => e.remove());
                        getStoredThemes().forEach(t => {
                            if (!t.enabled) return;
                            const style = document.createElement("style");
                            style.className   = "avia-theme-style";
                            style.textContent = t.css;
                            document.head.appendChild(style);
                        });
                        if (typeof window.__avia_refresh_themes_panel === "function")
                            window.__avia_refresh_themes_panel();
                        btn.textContent = "Installed";
                    })
                    .catch(() => {
                        btn.textContent = "Install CSS";
                        btn.disabled    = false;
                        alert("Failed to fetch theme CSS.");
                    });
            }

            function renderThemes(filter = "") {
                if (!repoContent) return;
                repoContent.innerHTML = "";
                const filtered = currentThemeData.filter(t =>
                    (t.name + " " + (t.author || "")).toLowerCase().includes(filter.toLowerCase())
                );
                if (filtered.length === 0) {
                    repoContent.innerHTML = "<div style='opacity:0.5;text-align:center;margin-top:30px;'>No themes found.</div>";
                    return;
                }
                filtered.forEach(theme => {
                    const card = document.createElement("div");
                    card.style.cssText = "margin-bottom:14px;background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);";

                    if (theme.preview) {
                        const img = document.createElement("img");
                        img.src   = theme.preview;
                        img.alt   = theme.name;
                        img.style.cssText = "width:100%;display:block;background:#111;object-fit:contain;";
                        img.onerror = () => img.style.display = "none";
                        card.appendChild(img);
                    }

                    const info = document.createElement("div");
                    info.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px 12px;gap:8px;";

                    const meta = document.createElement("div");
                    meta.style.cssText = "display:flex;flex-direction:column;min-width:0;flex:1;";

                    const nameEl = document.createElement("div");
                    nameEl.textContent  = theme.name;
                    nameEl.style.cssText = "font-weight:500;word-break:break-word;";

                    const authorEl = document.createElement("div");
                    authorEl.textContent  = "by " + (theme.author || "Unknown");
                    authorEl.style.cssText = "font-size:12px;opacity:0.6;";

                    meta.appendChild(nameEl);
                    meta.appendChild(authorEl);

                    const alreadyInstalled = getStoredThemes().some(t => {
                        const match = t.css.match(/@name\s+(.+)/);
                        return match && match[1].trim() === theme.name;
                    });

                    const dlBtn = document.createElement("button");
                    dlBtn.textContent = alreadyInstalled ? "Installed" : "Install CSS";
                    dlBtn.disabled    = alreadyInstalled;
                    Object.assign(dlBtn.style, {
                        padding: "6px 10px", borderRadius: "8px", border: "none",
                        cursor: alreadyInstalled ? "default" : "pointer",
                        background: "rgba(255,255,255,0.08)", color: "#fff",
                        flexShrink: "0", fontSize: "12px", whiteSpace: "nowrap"
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
                        const sources  = registry.sources || [];
                        const results  = await Promise.allSettled(
                            sources.map(s => fetch(s.url).then(r => r.json()))
                        );
                        results.forEach(r => {
                            if (r.status === "fulfilled") currentThemeData.push(...(r.value.themes || []));
                        });
                        renderThemes(searchInput.value);
                    })
                    .catch(() => { if (repoContent) repoContent.innerHTML = "Failed to fetch themes."; });
            }

            function switchTab(tab, tabPluginsBtn, tabThemesBtn) {
                activeTab = tab;
                const isPlugins = tab === "plugins";
                tabPluginsBtn.style.background = isPlugins  ? "rgba(255,255,255,0.12)" : "transparent";
                tabPluginsBtn.style.color      = isPlugins  ? "#fff" : "rgba(255,255,255,0.45)";
                tabThemesBtn.style.background  = !isPlugins ? "rgba(255,255,255,0.12)" : "transparent";
                tabThemesBtn.style.color       = !isPlugins ? "#fff" : "rgba(255,255,255,0.45)";
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
                    position: "fixed", bottom: "40px", right: "40px",
                    width: "420px", height: "520px",
                    background: "#1e1e1e", color: "#fff",
                    borderRadius: "20px", boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
                    zIndex: "999999", display: "flex", flexDirection: "column",
                    overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)"
                });

                const header = document.createElement("div");
                header.textContent = "Plugins & Themes Repo";
                Object.assign(header.style, {
                    padding: "18px", fontWeight: "600", fontSize: "16px",
                    background: "rgba(255,255,255,0.04)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    cursor: "move", position: "relative",
                    textAlign: "center", userSelect: "none"
                });

                let isDragging = false, offsetX = 0, offsetY = 0;
                header.addEventListener("mousedown", e => {
                    isDragging = true;
                    const rect = panel.getBoundingClientRect();
                    offsetX = e.clientX - rect.left;
                    offsetY = e.clientY - rect.top;
                    panel.style.bottom = "auto"; panel.style.right = "auto";
                    panel.style.left   = rect.left + "px";
                    panel.style.top    = rect.top  + "px";
                    document.body.style.userSelect = "none";
                });
                document.addEventListener("mousemove", e => {
                    if (!isDragging) return;
                    panel.style.left = (e.clientX - offsetX) + "px";
                    panel.style.top  = (e.clientY - offsetY) + "px";
                });
                document.addEventListener("mouseup", () => {
                    isDragging = false;
                    document.body.style.userSelect = "";
                });

                const close = document.createElement("div");
                close.textContent = "\u2715";
                Object.assign(close.style, {
                    position: "absolute", right: "18px", top: "16px", cursor: "pointer"
                });
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
                tabThemesBtn.onclick  = () => switchTab("themes",  tabPluginsBtn, tabThemesBtn);
                tabs.appendChild(tabPluginsBtn);
                tabs.appendChild(tabThemesBtn);

                searchInput = document.createElement("input");
                searchInput.placeholder = "Search plugins, authors, or descriptions";
                Object.assign(searchInput.style, {
                    margin: "12px", padding: "8px", borderRadius: "8px",
                    border: "none", outline: "none",
                    background: "rgba(255,255,255,0.06)", color: "#fff"
                });
                searchInput.addEventListener("input", () => {
                    if (activeTab === "plugins") renderRepo({ plugins: currentRepoData }, searchInput.value);
                    else renderThemes(searchInput.value);
                });

                repoContent = document.createElement("div");
                Object.assign(repoContent.style, {
                    flex: "1", overflowY: "auto", overflowX: "hidden", padding: "0 12px 12px"
                });

                const container = document.createElement("div");
                Object.assign(container.style, {
                    flex: "1", display: "flex", flexDirection: "column", overflow: "hidden"
                });
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
                const items = [...document.querySelectorAll("._item_1avxi_1")];
                const appearanceBtn = items.find(el =>
                    el.querySelector("._content_1avxi_40")?.textContent.trim() === "Appearance"
                );
                if (!appearanceBtn) return;

                const clone = appearanceBtn.cloneNode(true);
                clone.id = "avia-official-repo-btn-settings";
                clone.removeAttribute("data-active");

                const svgNS  = "http://www.w3.org/2000/svg";
                const oldSvg = clone.querySelector("svg");
                if (oldSvg) {
                    const svg  = document.createElementNS(svgNS, "svg");
                    svg.setAttribute("viewBox", "0 0 24 24");
                    svg.setAttribute("width",   "20");
                    svg.setAttribute("height",  "20");
                    svg.setAttribute("fill",    "currentColor");
                    const path = document.createElementNS(svgNS, "path");
                    path.setAttribute("d", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z");
                    svg.appendChild(path);
                    oldSvg.replaceWith(svg);
                }

                const contentDiv = clone.querySelector("._content_1avxi_40");
                if (contentDiv) {
                    for (const node of [...contentDiv.childNodes]) {
                        if (node.nodeType === Node.TEXT_NODE) node.remove();
                    }
                    contentDiv.appendChild(document.createTextNode(" (Avia) Plugins/Themes Repo"));
                }

                clone.onclick = openWindow;
                const anchor =
                    document.getElementById("avia-local-plugins-btn") ||
                    document.getElementById("avia-fake-plugins")       ||
                    appearanceBtn;
                anchor.parentNode.insertBefore(clone, anchor.nextSibling);
            }

            window.addEventListener("avia-plugin-list-changed", () => {
                if (document.getElementById("avia-official-repo-window")) updateInstallStates();
            });

            new MutationObserver(() => injectSettingsButton())
                .observe(document.body, { childList: true, subtree: true });
            injectSettingsButton();
        })();

    }
    `
})
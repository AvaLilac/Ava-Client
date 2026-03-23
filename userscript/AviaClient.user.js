// ==UserScript==
// @name        AviaClient
// @namespace   userscript.builder
// @version     1.5
// @description Combined userscript generated locally
// @match       https://stoat.chat/*
// @grant       none
// @run-at      document-start
// ==/UserScript==

(function(){
'@preserve - Built on 2026-03-23T13:36:43.447Z';

/* --- officialpluginrepo.js --- */
if(window.__US_BUILDER_OFFICIALPLUGINREPO_JS__){return;}window.__US_BUILDER_OFFICIALPLUGINREPO_JS__=true;

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



/* --- themes.js --- */
if(window.__US_BUILDER_THEMES_JS__){return;}window.__US_BUILDER_THEMES_JS__=true;

(function () {

if (window.__AVIA_THEMES_LOADED__) return;
window.__AVIA_THEMES_LOADED__ = true;

const STORAGE_KEY = "avia_themes";
let editingTheme = null;

const TEMPLATE = `/*
@name Whatever name here
@author Whatever Author Here
@version 1.0
@description Whatever description here
*/

`;

const getThemes = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const setThemes = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

function parseMeta(css){
    const name = css.match(/@name\s+(.+)/)?.[1] || "Unknown Theme";
    const author = css.match(/@author\s+(.+)/)?.[1] || "Unknown";
    const version = css.match(/@version\s+(.+)/)?.[1] || "1.0";
    const rawDescription = css.match(/@description\s+(.+)/)?.[1] || "No Description Available";
    const description = rawDescription.trim() === "*/" ? "No Description Available" : rawDescription;
    return {name,author,version,description};
}

function applyThemes(){
    document.querySelectorAll(".avia-theme-style").forEach(e=>e.remove());
    const themes = getThemes();
    themes.forEach(theme=>{
        if(!theme.enabled) return;
        const style=document.createElement("style");
        style.className="avia-theme-style";
        style.textContent=theme.css;
        document.head.appendChild(style);
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

function makeDraggable(panel, handle){
    let dragging=false,offsetX,offsetY;
    handle.addEventListener("mousedown",e=>{
        dragging=true;
        offsetX=e.clientX-panel.offsetLeft;
        offsetY=e.clientY-panel.offsetTop;
        document.body.style.userSelect="none";
    });
    document.addEventListener("mouseup",()=>{dragging=false;document.body.style.userSelect="";});
    document.addEventListener("mousemove",e=>{
        if(!dragging) return;
        panel.style.left=(e.clientX-offsetX)+"px";
        panel.style.top=(e.clientY-offsetY)+"px";
        panel.style.right="auto";
        panel.style.bottom="auto";
    });
}

function openThemeEditor(theme){
    editingTheme = theme;
    let panel = document.getElementById('avia-theme-editor');
    if(panel){
        panel.style.display="flex";
        panel.querySelector("textarea").value = theme.css;
        return;
    }
    panel=document.createElement("div");
    panel.id="avia-theme-editor";
    Object.assign(panel.style,{
        position:"fixed",
        bottom:"24px",
        right:"24px",
        width:"420px",
        height:"340px",
        background:"var(--md-sys-color-surface,#1e1e1e)",
        color:"var(--md-sys-color-on-surface,#fff)",
        borderRadius:"16px",
        boxShadow:"0 8px 28px rgba(0,0,0,0.35)",
        zIndex:999999,
        display:"flex",
        flexDirection:"column",
        overflow:"hidden",
        border:"1px solid rgba(255,255,255,0.08)",
        backdropFilter:"blur(12px)"
    });
    const header=document.createElement("div");
    header.textContent="Theme Editor";
    Object.assign(header.style,{
        padding:"14px 16px",
        fontWeight:"600",
        fontSize:"14px",
        background:"var(--md-sys-color-surface-container,rgba(255,255,255,0.04))",
        borderBottom:"1px solid rgba(255,255,255,0.08)",
        cursor:"move"
    });
    makeDraggable(panel,header);
    const close=document.createElement("div");
    close.textContent="✕";
    Object.assign(close.style,{
        position:"absolute",
        right:"16px",
        top:"12px",
        cursor:"pointer",
        opacity:"0.6",
        fontSize:"15px",
        lineHeight:"1",
        padding:"2px 4px"
    });
    close.onmouseenter=()=>close.style.opacity="1";
    close.onmouseleave=()=>close.style.opacity="0.6";
    close.onclick=()=>panel.style.display="none";
    const textarea=document.createElement("textarea");
    Object.assign(textarea.style,{
        flex:"1",
        border:"none",
        outline:"none",
        resize:"none",
        padding:"16px",
        background:"transparent",
        color:"inherit",
        fontFamily:"monospace",
        fontSize:"13px"
    });
    textarea.value=theme.css;
    textarea.addEventListener("input",()=>{
        const themes=getThemes();
        const t=themes.find(x=>x.id===editingTheme.id);
        if(!t) return;
        t.css=textarea.value;
        setThemes(themes);
        applyThemes();
        if(window.__avia_refresh_themes_panel){window.__avia_refresh_themes_panel();}
    });
    panel.appendChild(header);
    panel.appendChild(close);
    panel.appendChild(textarea);
    document.body.appendChild(panel);
}

function toggleThemesPanel(){
    let panel=document.getElementById("avia-themes-panel");
    if(panel){
        panel.style.display = panel.style.display==="none"?"flex":"none";
        return;
    }
    panel=document.createElement("div");
    panel.id="avia-themes-panel";
    Object.assign(panel.style,{
        position:"fixed",
        bottom:"40px",
        right:"40px",
        width:"500px",
        height:"460px",
        background:"var(--md-sys-color-surface,#1e1e1e)",
        color:"var(--md-sys-color-on-surface,#fff)",
        borderRadius:"16px",
        boxShadow:"0 8px 28px rgba(0,0,0,0.35)",
        zIndex:999999,
        display:"flex",
        flexDirection:"column",
        overflow:"hidden",
        border:"1px solid rgba(255,255,255,0.08)",
        backdropFilter:"blur(12px)"
    });

    const header=document.createElement("div");
    header.textContent="Themes";
    Object.assign(header.style,{
        padding:"14px 16px",
        fontWeight:"600",
        fontSize:"14px",
        background:"var(--md-sys-color-surface-container,rgba(255,255,255,0.04))",
        borderBottom:"1px solid rgba(255,255,255,0.08)",
        cursor:"move"
    });
    makeDraggable(panel,header);

    const close=document.createElement("div");
    close.textContent="✕";
    Object.assign(close.style,{
        position:"absolute",
        right:"16px",
        top:"12px",
        cursor:"pointer",
        opacity:"0.6",
        fontSize:"15px",
        lineHeight:"1",
        padding:"2px 4px"
    });
    close.onmouseenter=()=>close.style.opacity="1";
    close.onmouseleave=()=>close.style.opacity="0.6";
    close.onclick=()=>panel.style.display="none";

    const btnRow=document.createElement("div");
    Object.assign(btnRow.style,{
        display:"flex",
        gap:"8px",
        padding:"12px 16px",
        borderBottom:"1px solid rgba(255,255,255,0.08)",
        flex:"0 0 auto"
    });

    const importBtn=document.createElement("button");
    importBtn.textContent="Import Theme";
    styleBtn(importBtn);
    importBtn.style.flex="1";
    importBtn.style.padding="8px 12px";

    const newBtn=document.createElement("button");
    newBtn.textContent="+ New";
    styleBtn(newBtn);
    newBtn.style.flex="1";
    newBtn.style.padding="8px 12px";

    btnRow.appendChild(importBtn);
    btnRow.appendChild(newBtn);

    const list=document.createElement("div");
    Object.assign(list.style,{
        flex:"1",
        overflowY:"auto",
        padding:"16px",
        display:"flex",
        flexDirection:"column",
        gap:"8px"
    });

    panel.appendChild(header);
    panel.appendChild(close);
    panel.appendChild(btnRow);
    panel.appendChild(list);
    document.body.appendChild(panel);

    function render(){
        list.innerHTML="";
        const themes=getThemes();

        if(themes.length === 0){
            const empty=document.createElement("div");
            empty.textContent="No themes yet. Import or create one above.";
            Object.assign(empty.style,{opacity:"0.4",fontSize:"13px"});
            list.appendChild(empty);
            return;
        }

        themes.forEach(theme=>{
            const meta=parseMeta(theme.css);

            const card=document.createElement("div");
            Object.assign(card.style,{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                padding:"10px 12px",
                borderRadius:"10px",
                background:"rgba(255,255,255,0.04)",
                border:"1px solid rgba(255,255,255,0.06)",
                marginBottom:"0"
            });

            const left=document.createElement("div");
            Object.assign(left.style,{display:"flex",alignItems:"center",gap:"10px"});

            const dot=document.createElement("div");
            Object.assign(dot.style,{
                width:"10px",
                height:"10px",
                borderRadius:"50%",
                flexShrink:"0",
                background: theme.enabled ? "#4dff88" : "#777",
                boxShadow: theme.enabled ? "0 0 6px #4dff88" : "none"
            });

            const info=document.createElement("div");
            info.innerHTML=`<div style="font-weight:600;font-size:13px">${meta.name}</div><div style="font-size:11px;opacity:.5">${meta.author} • v${meta.version}</div><div style="font-size:11px;opacity:.4">${meta.description}</div>`;

            left.appendChild(dot);
            left.appendChild(info);

            const controls=document.createElement("div");
            Object.assign(controls.style,{display:"flex",gap:"6px"});

            const toggle=document.createElement("button");
            toggle.textContent=theme.enabled?"Disable":"Enable";
            styleBtn(toggle);
            toggle.onclick=()=>{
                theme.enabled=!theme.enabled;
                setThemes(themes);
                applyThemes();
                render();
            };

            const edit=document.createElement("button");
            edit.textContent="Edit";
            styleBtn(edit, "rgba(100,160,255,0.15)");
            edit.onclick=()=>openThemeEditor(theme);

            const del=document.createElement("button");
            del.textContent="✕";
            styleBtn(del, "rgba(255,80,80,0.15)");
            del.onclick=()=>{
                const updated=themes.filter(t=>t.id!==theme.id);
                setThemes(updated);
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

    importBtn.onclick=()=>{
        const input=document.createElement("input");
        input.type="file";
        input.accept=".css,.txt";
        input.onchange=async()=>{
            const file=input.files[0];
            if(!file) return;
            const css=await file.text();
            const themes=getThemes();
            themes.push({id:crypto.randomUUID(),css,enabled:true});
            setThemes(themes);
            applyThemes();
            render();
        };
        input.click();
    };

    newBtn.onclick=()=>{
        const themes=getThemes();
        themes.push({id:crypto.randomUUID(),css:TEMPLATE,enabled:true});
        setThemes(themes);
        applyThemes();
        render();
    };

    render();
}

function injectButton(){
    if(document.getElementById("avia-themes-btn")) return;
    const appearanceBtn=[...document.querySelectorAll("a")].find(a=>a.textContent.trim()==="Appearance");
    const quickCSS=document.getElementById("stoat-fake-quickcss");
    if(!appearanceBtn || !quickCSS) return;
    const clone=appearanceBtn.cloneNode(true);
    clone.id="avia-themes-btn";
    const text=[...clone.querySelectorAll("div")].find(d=>d.children.length===0);
    if(text) text.textContent="(Avia) Themes";
    clone.onclick=toggleThemesPanel;
    quickCSS.parentElement.insertBefore(clone, quickCSS.nextSibling);
}

new MutationObserver(injectButton).observe(document.body,{childList:true,subtree:true});
injectButton();
applyThemes();

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
            loader.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js";
            loader.onload = function () {
                require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs" } });
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

        controlsBar.appendChild(nameInput);
        controlsBar.appendChild(addBtn);

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



/* --- inject.js --- */
if(window.__US_BUILDER_INJECT_JS__){return;}window.__US_BUILDER_INJECT_JS__=true;

(function () {

    if (window.__AVIA_WEB_LOADED__) return;
    window.__AVIA_WEB_LOADED__ = true;

    const LINKTREE_URL = "https://linktr.ee/GermanAvaLilac";
    const STOAT_SERVER_URL = "https://stt.gg/GvBhcejB";

    function toggleQuickCSSPanel() {
        let panel = document.getElementById('avia-quickcss-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            return;
        }

        panel = document.createElement('div');
        panel.id = 'avia-quickcss-panel';
        panel.style.position = 'fixed';
        panel.style.bottom = '24px';
        panel.style.right = '24px';
        panel.style.width = '420px';
        panel.style.height = '340px';
        panel.style.background = 'var(--md-sys-color-surface, #1e1e1e)';
        panel.style.color = 'var(--md-sys-color-on-surface, #fff)';
        panel.style.borderRadius = '16px';
        panel.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)';
        panel.style.zIndex = '999999';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.overflow = 'hidden';
        panel.style.border = '1px solid rgba(255,255,255,0.08)';
        panel.style.backdropFilter = 'blur(12px)';

        const header = document.createElement('div');
        header.textContent = 'QuickCSS';
        header.style.padding = '14px 16px';
        header.style.fontWeight = '600';
        header.style.fontSize = '14px';
        header.style.letterSpacing = '0.3px';
        header.style.background = 'var(--md-sys-color-surface-container, rgba(255,255,255,0.04))';
        header.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
        header.style.cursor = 'move';

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '12px';
        closeBtn.style.right = '16px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.opacity = '0.7';
        closeBtn.onmouseenter = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.7';
        closeBtn.onclick = () => panel.style.display = 'none';

        const textarea = document.createElement('textarea');
        textarea.style.flex = '1';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.padding = '16px';
        textarea.style.background = 'transparent';
        textarea.style.color = 'inherit';
        textarea.style.fontFamily = 'monospace';
        textarea.style.fontSize = '13px';
        textarea.style.lineHeight = '1.4';
        textarea.value = localStorage.getItem('avia_quickcss') || '';

        textarea.addEventListener('input', () => {
            localStorage.setItem('avia_quickcss', textarea.value);
            applyQuickCSS(textarea.value);
        });

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(textarea);
        document.body.appendChild(panel);

        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });

        document.addEventListener('mousemove', (e) => {
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

    function showFontLoaderPopup() {
        removeExistingPopup();
        const popup = document.createElement('div');
        popup.id = 'avia-font-loader-popup';
        Object.assign(popup.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '16px',
            background: '#1e1e1e',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            zIndex: 999999,
            minWidth: '320px'
        });
        popup.innerHTML = `
            <div style="margin-bottom:8px;">Paste font URL (.ttf, .woff, etc.)</div>
            <input id="avia-font-url" type="text" style="width:100%; padding:6px; margin-bottom:8px; border-radius:6px; border:none; outline:none;"/>
            <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button id="avia-font-apply" style="padding:6px 12px;">Apply</button>
                <button id="avia-font-cancel" style="padding:6px 12px;">Cancel</button>
            </div>
        `;
        document.body.appendChild(popup);
        document.getElementById('avia-font-apply').onclick = () => {
            const url = document.getElementById('avia-font-url').value;
            if (!url) return;
            localStorage.setItem('avia_custom_font_url', url);
            applyFont(url);
            alert("Font Applied.");
            popup.remove();
        };
        document.getElementById('avia-font-cancel').onclick = () => popup.remove();
    }

    function showRemoveFontPopup() {
        removeExistingPopup();
        const popup = document.createElement('div');
        popup.id = 'avia-remove-font-popup';
        Object.assign(popup.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '16px',
            background: '#1e1e1e',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            zIndex: 999999,
            minWidth: '280px',
            textAlign: 'center'
        });
        popup.innerHTML = `
            <div style="margin-bottom:12px;">Are you sure you want to remove the custom font?</div>
            <button id="avia-font-remove" style="padding:6px 12px;">Remove Font</button>
            <button id="avia-font-cancel" style="padding:6px 12px; margin-left:6px;">Cancel</button>
        `;
        document.body.appendChild(popup);
        document.getElementById('avia-font-remove').onclick = () => {
            removeFont();
            popup.remove();
        };
        document.getElementById('avia-font-cancel').onclick = () => popup.remove();
    }

    function removeExistingPopup() {
        const existing = document.getElementById('avia-font-loader-popup') || document.getElementById('avia-remove-font-popup');
        if (existing) existing.remove();
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
            newBtn.addEventListener('click', showFontLoaderPopup);

            const stoatBtn = document.getElementById('stoat-fake-stoatserver');
            targetParent.appendChild(newBtn);

            if (!document.getElementById('stoat-fake-removefont')) {
                const removeBtn = appearanceBtn.cloneNode(true);
                removeBtn.id = 'stoat-fake-removefont';
                const removeTextNode = Array.from(removeBtn.querySelectorAll('div')).find(d => d.children.length === 0);
                if (removeTextNode) removeTextNode.textContent = "(Avia) Remove selected font";
                setIcon(removeBtn, "refresh");
                removeBtn.addEventListener('click', showRemoveFontPopup);
                targetParent.appendChild(removeBtn);
            }
        }

        if (!document.getElementById('stoat-fake-quickcss')) {
            const quickCssBtn = appearanceBtn.cloneNode(true);
            quickCssBtn.id = 'stoat-fake-quickcss';
            const quickCssTextNode = Array.from(quickCssBtn.querySelectorAll('div')).find(d => d.children.length === 0);
            if (quickCssTextNode) quickCssTextNode.textContent = "(Avia) QuickCSS";
            setIcon(quickCssBtn, "code");
            quickCssBtn.addEventListener('click', toggleQuickCSSPanel);

            const lastBtn = document.getElementById('stoat-fake-removefont') ||
                            document.getElementById('stoat-fake-loadfont') ||
                            document.getElementById('stoat-fake-stoatserver') ||
                            document.getElementById('stoat-fake-linktree');
targetParent.appendChild(quickCssBtn);        }
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

function toggleFavoritesPanel() {

    let panel = document.getElementById("avia-favorites-panel");
    if (panel) {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
        return;
    }

    panel = document.createElement("div");
    panel.id = "avia-favorites-panel";

    Object.assign(panel.style, {
        position: "fixed",
        bottom: "40px",
        right: "40px",
        width: "640px",
        height: "580px",
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
    header.textContent = "Favorites";
    Object.assign(header.style, {
        padding: "18px",
        fontWeight: "600",
        fontSize: "16px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        cursor: "move",
        position: "relative",
        userSelect: "none"
    });

    const close = document.createElement("div");
    close.textContent = "✕";
    Object.assign(close.style, {
        position: "absolute",
        right: "18px",
        top: "16px",
        cursor: "pointer"
    });
    close.onclick = () => panel.style.display = "none";
    header.appendChild(close);

    const inputRow = document.createElement("div");
    Object.assign(inputRow.style, {
        display: "flex",
        gap: "8px",
        padding: "14px 18px"
    });

    const urlInput = document.createElement("input");
    urlInput.placeholder = "Paste link...";
    Object.assign(urlInput.style, {
        flex: "2",
        padding: "10px",
        borderRadius: "10px",
        border: "none",
        outline: "none"
    });

    const titleInput = document.createElement("input");
    titleInput.placeholder = "Optional title...";
    Object.assign(titleInput.style, {
        flex: "1",
        padding: "10px",
        borderRadius: "10px",
        border: "none",
        outline: "none"
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    Object.assign(addBtn.style, {
        padding: "10px 16px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer"
    });

    inputRow.appendChild(urlInput);
    inputRow.appendChild(titleInput);
    inputRow.appendChild(addBtn);

    const grid = document.createElement("div");
    Object.assign(grid.style, {
        flex: "1",
        minHeight: "0",
        overflowY: "auto",
        padding: "18px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, 120px)",
        gap: "14px",
        alignContent: "start"
    });

    panel.appendChild(header);
    panel.appendChild(inputRow);
    panel.appendChild(grid);
    document.body.appendChild(panel);

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

    function showToast(card) {
        const toast = document.createElement("div");
        toast.textContent = "Copied to clipboard";
        Object.assign(toast.style, {
            position: "absolute",
            bottom: "6px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.85)",
            padding: "6px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            opacity: "0",
            transition: "opacity 0.2s",
            pointerEvents: "none"
        });
        card.appendChild(toast);
        requestAnimationFrame(() => toast.style.opacity = "1");
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 200);
        }, 2000);
    }

    function fallbackCopy(text) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(textarea);
    }

    function render() {

        grid.innerHTML = "";
        const favorites = getFavorites();

        favorites.forEach(item => {

            const card = document.createElement("div");
            Object.assign(card.style, {
                position: "relative",
                width: "120px",
                height: "120px",
                borderRadius: "14px",
                overflow: "hidden",
                background: "rgba(255,255,255,0.05)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            });

            const remove = document.createElement("div");
            remove.textContent = "✕";
            Object.assign(remove.style, {
                position: "absolute",
                top: "6px",
                right: "8px",
                fontSize: "12px",
                cursor: "pointer",
                background: "rgba(0,0,0,0.6)",
                padding: "2px 6px",
                borderRadius: "6px",
                zIndex: 2
            });

            remove.onclick = (e) => {
                e.stopPropagation();
                setFavorites(favorites.filter(f => f.url !== item.url));
                render();
            };

            card.appendChild(remove);

            let mediaAdded = false;

            const ytID = extractYouTubeID(item.url);
            if (ytID) {
                const img = new Image();
                img.src = `https://img.youtube.com/vi/${ytID}/hqdefault.jpg`;
                Object.assign(img.style, { width:"100%", height:"100%", objectFit:"cover" });
                card.appendChild(img);
                mediaAdded = true;
            }

            if (!mediaAdded) {
                const ext = item.url.split(".").pop().split("?")[0].toLowerCase();
                const isVideo = ["mp4","webm","mov","gifv"].includes(ext);

                if (isVideo) {
                    const video = document.createElement("video");
                    video.src = item.url.replace(".gifv",".mp4");
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    Object.assign(video.style, { width:"100%", height:"100%", objectFit:"cover" });
                    video.onerror = fallback;
                    card.appendChild(video);
                } else {
                    const img = new Image();
                    img.src = item.url;
                    Object.assign(img.style, { width:"100%", height:"100%", objectFit:"cover" });
                    img.onerror = fallback;
                    card.appendChild(img);
                }
            }

            function fallback() {
                card.innerHTML = "";
                card.appendChild(remove);
                const text = document.createElement("div");
                text.textContent = item.title || item.url;
                Object.assign(text.style, {
                    padding:"8px",
                    fontSize:"11px",
                    textAlign:"center",
                    wordBreak:"break-word"
                });
                card.appendChild(text);
            }

            if (item.title) {
                const titleOverlay = document.createElement("div");
                titleOverlay.textContent = item.title;
                Object.assign(titleOverlay.style, {
                    position:"absolute",
                    bottom:"0",
                    width:"100%",
                    background:"rgba(0,0,0,0.6)",
                    fontSize:"11px",
                    padding:"4px",
                    textAlign:"center",
                    whiteSpace:"nowrap",
                    overflow:"hidden",
                    textOverflow:"ellipsis"
                });
                card.appendChild(titleOverlay);
            }

            card.onclick = () => {
                const doToast = () => showToast(card);
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(item.url)
                        .then(doToast)
                        .catch(() => {
                            fallbackCopy(item.url);
                            doToast();
                        });
                } else {
                    fallbackCopy(item.url);
                    doToast();
                }
            };

            grid.appendChild(card);
        });
    }

    addBtn.onclick = () => {
        const url = urlInput.value.trim();
        const title = titleInput.value.trim();
        if (!url) return;
        const favorites = getFavorites();
        if (favorites.some(f => f.url === url)) return;
        favorites.push({ url, title, addedAt: Date.now() });
        setFavorites(favorites);
        urlInput.value = "";
        titleInput.value = "";
        render();
    };

    render();
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
    clone.querySelector("span.material-symbols-outlined").textContent = "star";
    clone.querySelector("button").onclick = toggleFavoritesPanel;

    wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);
}

new MutationObserver(injectButton)
.observe(document.body, { childList: true, subtree: true });

injectButton();

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
            const res = await fetch(plugin.url);
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
            width: '520px',
            height: '460px',
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
        header.textContent = 'Plugins';
        Object.assign(header.style, {
            padding: '14px 16px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'var(--md-sys-color-surface-container, rgba(255,255,255,0.04))',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            cursor: 'move'
        });

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '12px',
            right: '16px',
            cursor: 'pointer',
            opacity: '0.7'
        });
        closeBtn.onclick = () => panel.style.display = 'none';

        const controlsBar = document.createElement('div');
        Object.assign(controlsBar.style, {
            padding: '12px 16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flex: '0 0 auto'
        });

        const content = document.createElement('div');
        content.id = 'avia-plugins-content';
        Object.assign(content.style, {
            flex: '1',
            overflow: 'auto',
            padding: '16px'
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

        const refreshAll = document.createElement('button');
        refreshAll.textContent = 'Refresh';
        styleBtn(refreshAll);
        refreshAll.onclick = () => {
            const plugins = getPlugins();
            plugins.forEach(p => {
                if (p.enabled) queuePlugin(p, true);
            });
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
        const content = document.getElementById('avia-plugins-content');
        if (!content) return;
        content.innerHTML = '';
        const plugins = getPlugins();
        const runningSnapshot = { ...runningPlugins };
        const errorSnapshot = { ...pluginErrors };

        if (plugins.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'No plugins yet. Add one above.';
            Object.assign(empty.style, { opacity: '0.4', fontSize: '13px' });
            content.appendChild(empty);
            return;
        }

        plugins.forEach((plugin, index) => {
            const isRunning = !!runningSnapshot[plugin.url];
            const hasError = !!errorSnapshot[plugin.url];

            const row = document.createElement('div');
            Object.assign(row.style, {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
            });

            const left = document.createElement('div');
            Object.assign(left.style, { display: 'flex', alignItems: 'center', gap: '10px' });

            const statusDot = document.createElement('div');
            Object.assign(statusDot.style, {
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                flexShrink: '0'
            });
            if (hasError) {
                statusDot.style.background = '#ff4d4d';
                statusDot.style.boxShadow = '0 0 6px #ff4d4d';
            } else if (isRunning) {
                statusDot.style.background = '#4dff88';
                statusDot.style.boxShadow = '0 0 6px #4dff88';
            } else {
                statusDot.style.background = '#777';
            }

            const name = document.createElement('div');
            name.textContent = plugin.name;
            name.style.fontSize = '13px';

            left.appendChild(statusDot);
            left.appendChild(name);

            const controls = document.createElement('div');
            Object.assign(controls.style, { display: 'flex', gap: '6px' });

            const toggle = document.createElement('button');
            toggle.textContent = plugin.enabled ? 'Disable' : 'Enable';
            styleBtn(toggle);
            toggle.onclick = () => {
                plugin.enabled = !plugin.enabled;
                setPlugins(plugins);
                if (plugin.enabled) queuePlugin(plugin);
                else stopPlugin(plugin);
                renderPanel();
            };

            const viewBtn = document.createElement('button');
            viewBtn.textContent = 'View';
            styleBtn(viewBtn, 'rgba(100,160,255,0.15)');
            viewBtn.onclick = () => openViewerPanel(plugin);

            const remove = document.createElement('button');
            remove.textContent = '✕';
            styleBtn(remove, 'rgba(255,80,80,0.15)');
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



})();

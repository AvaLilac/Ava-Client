(function () {
    // Prevent double injection
    if (document.getElementById("avia-web-injected")) return;

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("inject.js");
    script.id = "avia-web-injected";

    (document.head || document.documentElement).appendChild(script);
})();
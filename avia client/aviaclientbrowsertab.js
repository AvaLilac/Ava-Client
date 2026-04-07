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
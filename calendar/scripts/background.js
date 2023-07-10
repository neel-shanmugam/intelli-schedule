chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
        type: "popup",
        url: chrome.runtime.getURL("popup.html"),
        width: 800,
        height: 600
    });
});
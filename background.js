var re = /dashboard(?:\/dashboard)?;/;
function hashListener(details) {
    var refIndex = details.url.indexOf('#');
    var ref = refIndex >= 0 ? details.url.slice(refIndex+1) : '';
    if (re.test(ref)) {
        chrome.pageAction.show(details.tabId, ()=>{
            if (chrome.runtime.lastError) { //Tab no longer exists
                console.log(chrome.runtime.lastError.message);
            } else {// Tab exists
                chrome.pageAction.setIcon({tabId:details.tabId, path:"Assets/powerup.png"});
                chrome.tabs.executeScript(details.tabId, {file: '3rdParty/jquery-3.5.1.min.js', runAt: "document_end"});
                chrome.tabs.executeScript(details.tabId, {file: 'extside.min.js', runAt: "document_end"});        
            }
        });
        
    } else {
        chrome.pageAction.hide(details.tabId, ()=>{
            if (chrome.runtime.lastError) { //Tab no longer exists
                console.log(chrome.runtime.lastError.message);
            } else {// Tab exists
                chrome.pageAction.setIcon({tabId:details.tabId, path:"Assets/powerup_gray.png"});
            }
        });
        
    }
}
// Base filter
var filter = {
    url: [{
        urlMatches: '(?:\/e\/)|(?:dynatracelabs.com)|(?:live.dynatrace.com)'
    }]
};
chrome.webNavigation.onCommitted.addListener(hashListener, filter);
chrome.webNavigation.onHistoryStateUpdated.addListener(hashListener, filter);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(hashListener, filter)

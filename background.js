var re = /dashboard(?:\/dashboard)?;/;
function hashListener(details) {
    var refIndex = details.url.indexOf('#');
    var ref = refIndex >= 0 ? details.url.slice(refIndex + 1) : '';
    if (re.test(ref)) {
        chrome.pageAction.show(details.tabId, () => {
            if (chrome.runtime.lastError) { //Tab no longer exists
                console.log(chrome.runtime.lastError.message);
            } else {// Tab exists
                let version = getVersion();
                getAckedVersion((ackedVersion)=>{
                    if(!ackedVersion) chrome.pageAction.setIcon({ tabId: details.tabId, path: "Assets/powerup_purple.png" });
                    ackedVersion = Number( (ackedVersion || "0.0").split('.')[1]);
                    version = Number( (version || "0.0").split('.')[1]);
                    if(ackedVersion === version)
                        chrome.pageAction.setIcon({ tabId: details.tabId, path: "Assets/powerup.png" });
                    else
                        chrome.pageAction.setIcon({ tabId: details.tabId, path: "Assets/powerup_purple.png" });
                });
                
                chrome.tabs.executeScript(details.tabId, { file: '3rdParty/jquery-3.5.1.min.js', runAt: "document_end" });
                chrome.tabs.executeScript(details.tabId, { file: '3rdParty/node_modules/uuid/dist/umd/uuidv4.min.js', runAt: "document_end" });
                chrome.tabs.executeScript(details.tabId, { file: '3rdParty/node_modules/@dynatrace/openkit-js/dist/browser/openkit.js', runAt: "document_end" });
                chrome.tabs.executeScript(details.tabId, { file: 'beacon.min.js', runAt: "document_end" });
                chrome.tabs.executeScript(details.tabId, { file: 'extside.min.js', runAt: "document_end" });
            }
        });

    } else {
        chrome.pageAction.hide(details.tabId, () => {
            if (chrome.runtime.lastError) { //Tab no longer exists
                console.log(chrome.runtime.lastError.message);
            } else {// Tab exists
                chrome.pageAction.setIcon({ tabId: details.tabId, path: "Assets/powerup_gray.png" });
            }
        });

    }
}

function getVersion() {
    var manifestData = chrome.runtime.getManifest();
    return manifestData.version;
}

function getAckedVersion(callback) {
    chrome.storage.local.get(['Powerups'], function (result) {
        //console.log('Powerup: (popup) config from storage is: ' + JSON.stringify(result));
        if (result && result.Powerups && result.Powerups.ackedVersion) {
            callback(result.Powerups.ackedVersion);
        } else {
            callback(undefined);
        }
    });
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

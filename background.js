var re = /dashboard(?:\/dashboard)?;/;
var HotFixMode = (HotFixMode ? HotFixMode : 0);

function hashListener(details) {
    var refIndex = details.url.indexOf('#');
    var ref = refIndex >= 0 ? details.url.slice(refIndex + 1) : '';
    if (re.test(ref)) {
        chrome.pageAction.show(details.tabId, () => {
            if (chrome.runtime.lastError) { //Tab no longer exists
                console.log(chrome.runtime.lastError.message);
            } else {// Tab exists
                let version = getVersion();
                getAckedVersion((ackedVersion) => {
                    if (!ackedVersion) chrome.pageAction.setIcon({ tabId: details.tabId, path: "Assets/powerup_purple.png" });
                    ackedVersion = Number((ackedVersion || "0.0").split('.')[1]);
                    version = Number((version || "0.0").split('.')[1]);
                    if (ackedVersion === version)
                        chrome.pageAction.setIcon({ tabId: details.tabId, path: "Assets/powerup.png" });
                    else
                        chrome.pageAction.setIcon({ tabId: details.tabId, path: "Assets/powerup_purple.png" });
                });
                listenForBeaconMessages();

                chrome.tabs.executeScript(details.tabId, { file: '3rdParty/jquery-3.5.1.min.js', runAt: "document_end" });
                chrome.tabs.executeScript(details.tabId, { file: '3rdParty/node_modules/uuid/dist/umd/uuidv4.min.js', runAt: "document_end" });
                loadExtside(details);
                //chrome.tabs.executeScript(details.tabId, { file: 'extside.min.js', runAt: "document_end" });
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

var openKit, openKitSession, openKitAction;

function listenForBeaconMessages() {
    if (typeof (BEACON_LISTENING) == "undefined") {
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                console.log(sender.tab ?
                    "from a content script:" + sender.tab.url :
                    "from the extension");
                switch (request.OpenKit) {
                    case "start_beacon":
                        startBeacon(request);
                        sendResponse({ beacon_status: "sent" });
                        break;
                    case "end_beacon":
                        endBeacon(request);
                        sendResponse({ beacon_status: "done" });
                        break;
                    case "crash_beacon":
                        crashBeacon(request);
                        sendResponse({ beacon_status: "sent" });
                        break;
                    case "error_beacon":
                        errorBeacon(request);
                        sendResponse({ beacon_status: "sent" });
                        break;
                }
                switch (request.PowerUp) {
                    case "PU_BACKGROUND":
                    case "PU_IMAGE":
                        backgroundPowerup(request, sender);
                        break;
                }
                return true;
            });
        console.log("POWERUP: message listener loaded.");
        BEACON_LISTENING = true;
    }
}

function startBeacon(request) {
    if (typeof (OpenKitBuilder) === "undefined") return false;
    if (request.beaconOptOut) return false;

    console.log("POWERUP: DEBUG - OpenKit start beacon");
    if (!openKit || !openKit.isInitialized()) {
        openKit = new OpenKitBuilder(BG_ENV.OPENKIT_URL, BG_ENV.OPENKIT_APPID, request.uuid)
            .withApplicationVersion(request.applicationVersion)
            .withOperatingSystem(request.operatingSystem)
            .withManufacturer(request.manufacturer)
            .withModelId(request.modelId)
            .withScreenResolution(request.screenResolution[0], request.screenResolution[1])
            .build();
    }

    if (openKit) {
        if (!openKitSession || openKitSession.isShutdown())
            openKitSession = openKit.createSession();
        if (openKitSession) {
            if (!openKitSession.userId || openKitSession.userId !== request.name) {
                openKitSession.identifyUser(request.name);
                openKitSession.userId = request.name; //safe store for later
            }
            openKitAction = openKitSession.enterAction(request.action);
            if (openKitAction) {
                Object.keys(request.vals).forEach(x => {
                    openKitAction.reportValue(x, request.vals[x]);
                });
                openKitAction.reportValue("hotfixMode", HotFixMode);
                openKitAction.vals = request.vals; //safe store for later
            }
        }
    }
}

function crashBeacon(request) {
    if (typeof (OpenKitBuilder) === "undefined") return false;
    if (request.beaconOptOut) return false;

    if (openKitSession) {
        let e = request.e || { name: "", message: "", stack: "" };
        openKitSession.reportCrash(e.name, e.message, e.stack);
        openKitSession.end();
        openKit.shutdown();
    }

    console.log("POWERUP: DEBUG - OpenKit crash beacon");
}

function errorBeacon(request) {
    if (typeof (OpenKitBuilder) === "undefined") return false;
    if (request.beaconOptOut) return false;

    if (openKitAction) {
        let err, reason;
        if (typeof (request) == "string") {
            err = request;
            reason = `Error in background context`;
        } else if (typeof (request) == "object") {
            err = request.err;
            reason = `Error in ${request.context} context`;
        } else err = "Unknown error";
        let code = 1;

        openKitAction.reportError(err, code, reason);
    }

    console.log("POWERUP: DEBUG - OpenKit crash beacon");
}

function endBeacon(request) {
    if (typeof (OpenKitBuilder) === "undefined" || !openKit) return false;
    console.log("POWERUP: DEBUG - OpenKit end beacon");
    if (openKitAction) {
        Object.keys(request.vals).forEach(x => {
            openKitAction.reportValue(x, request.vals[x]);
        });
        openKitAction.leaveAction();

        let payload = createMetricPayload({ ...request.vals, ...openKitAction.vals });
        if (payload && payload.length) sendMetricToDT(payload);
    }
    //if (openKitSession) openKitSession.end(); //now that we have MINT, no need to end the session on each DB powerup
    //if (openKit) openKit.shutdown();
}

function createMetricPayload(vals) {
    let payload = "";
    let line = `${BG_ENV.METRIC_KEY},dt.entity.custom_application=${BG_ENV.ENT_ID},`;

    if ("internalUser" in vals) line += `internaluser=${vals['internalUser']},`;
    if ("configuratorTag" in vals) line += `configuratortag=${vals['configuratorTag']},`;
    if ("host" in vals) line += `host=${vals['host']},`;
    if ("tenantId" in vals) line += `tenantid=${vals['tenantId']},`;
    if (openKit && openKit.config && openKit.config.meta && openKit.config.meta.applicationVersion)
        line += `version=${openKit.config.meta.applicationVersion},`;
    if (openKitSession && openKitSession.userId) line += `userid=${openKitSession.userId},`;
    if (typeof (HotFixMode) != "undefined") line += `hotfixmode=${HotFixMode},`;

    let re = new RegExp(`^${BG_ENV.METRIC_KEY},`);
    let summaryLine = line.replace(re, `${BG_ENV.METRIC_SUMMARY_KEY},`);
    if (vals && Object.keys(vals).length) {
        Object.keys(vals).filter(x => x.startsWith('PU_'))
            .forEach(x => {
                payload += line + `powerup=${x} ${vals[x]}\n`;
            });
        payload += summaryLine + `poweredup=true 1\n`;
    } else {
        payload = summaryLine + `poweredup=false 1\n`;
    }


    return payload;
}

function sendMetricToDT(payload) {
    let settings = {
        url: BG_ENV.API_URL,
        data: payload,
        headers: {
            Authorization: "Api-Token " + BG_ENV.DT_TOKEN,
            "Content-Type": "text/plain; charset=utf-8"
        }
    }

    $.post(settings)
        .done(() => { console.log("POWERUP: sendMetricToDT success.") })
        .fail(() => { console.log("POWERUP: sendMetricToDT failed.") });
}

function checkSignals(alarm) {
    const SIGNAL_URL = BG_ENV.GH_URL + 'signals.json';

    $.getJSON(SIGNAL_URL)
        .done((signal) => {
            if (signal && typeof (signal.hotfixMode) !== "undefined") {
                chrome.storage.local.set({ 'hotfixMode': signal.hotfixMode }, () => { });
                HotFixMode = signal.hotfixMode;
            }
        })
        .fail((jqxhr, textStatus, error) => {
            console.log(`POWERUP: failed to get signals.json. ${error}`);
        });
}

function loadExtside(details) {
    if (HotFixMode > 1) { //in case of emergency hotfix, load from GH instead of ext. 
        //strongly prefer loading from extension, use only in event of critical bug + slow Google ChromeStore review
        const file = BG_ENV.GH_URL + 'extside.min.js';
        console.log("POWERUP: WARN - in HotFixMode, loading extside from GH.");
        $.get(file)
            .done((code) => {
                chrome.tabs.executeScript(details.tabId, { code: code, runAt: "document_end" });
            })
            .fail((jqxhr, textStatus, error) => {
                console.log(`POWERUP: FATAL - In HotFixMode but failed to load extside from GH. ${error}`);
            });
    } else {
        chrome.tabs.executeScript(details.tabId, { file: 'extside.min.js', runAt: "document_end" });
    }
}

function backgroundPowerup(request, sender) {
    switch (request.PowerUp) {
        case "PU_BACKGROUND":
        case "PU_IMAGE":
            const allowedFileTypes = ["image/png", "image/jpeg", "image/gif"];
            let url = request.url;
            fetch(url).then(response => {
                response.blob().then(blobResponse => {
                    let type = blobResponse.type;
                    if (allowedFileTypes.indexOf(type) < 0) {
                        let err = `POWERUP: ${request.PowerUp} - not an allowed filetype: '${type}' for '${url}'`
                        console.warn(err);
                        errorBeacon(err);
                        return false;
                    } else {
                        let obj = {};
                        let reader = new FileReader();
                        reader.onload = (e) => {
                            obj[url] = e.target.result;

                            chrome.storage.local.set(obj, () => {
                                if (typeof (chrome.runtime.lastError) != "undefined") {
                                    let err = chrome.runtime.lastError;
                                    if(err) console.error(err);
                                }
                                chrome.tabs.sendMessage(sender.tab.id,
                                    {
                                        PowerUpResult: request.PowerUp,
                                        url: url,
                                        targetSelector: request.targetSelector
                                    },
                                    (response) => {
                                        console.log(response);
                                    })
                            });
                        }
                        reader.readAsDataURL(blobResponse);
                    }
                })
            });
            break;
    }
}

// Main
chrome.webNavigation.onCommitted.addListener(hashListener, filter);
chrome.webNavigation.onHistoryStateUpdated.addListener(hashListener, filter);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(hashListener, filter)
chrome.alarms.onAlarm.addListener(checkSignals);
chrome.alarms.create("checkSignals", { delayInMinutes: 1, periodInMinutes: 60 });
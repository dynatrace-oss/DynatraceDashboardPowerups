/*
Copyright 2020 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
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

var openKit, openKitSession, openKitAction, webRequestTracer;

function listenForBeaconMessages() {
    if (typeof (BEACON_LISTENING) == "undefined") {
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                console.log(sender.tab ?
                    "from a content script:" + sender.tab.url :
                    "from the extension");
                switch (request.OpenKit) {
                    case "start_beacon":
                    case "start_report_beacon":
                        startBeacon(request);
                        sendResponse({ beacon_status: "sent" });
                        break;
                    case "end_beacon":
                    case "end_report_beacon":
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
                    case "report_usage":
                        reportUsage(request);
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
    let deviceId = request.uuid.replace(/[-a-z]/g, '').slice(0, 19); //openkit only supports INT, so convert it
    if (!openKit || !openKit.initialized || openKit.isShutdown) {
        openKit = new OpenKitBuilder(
            BG_ENV.OPENKIT_URL,
            BG_ENV.OPENKIT_APPID,
            deviceId
        )
            .withApplicationVersion(request.applicationVersion)
            .withOperatingSystem(request.operatingSystem)
            .withManufacturer(request.manufacturer)
            .withModelId(request.modelId)
            .withScreenResolution(request.screenResolution[0], request.screenResolution[1])
            .withLogLevel(20)
            .build();
    }

    if (openKit) {
        if (!openKitSession || openKitSession._isShutdown)
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
                openKitAction.reportValue("uuid", request.uuid);
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

function endBeacon(request) { //ends user action & triggers MINT, does not close user session
    if (typeof (OpenKitBuilder) === "undefined" || !openKit) return false;
    console.log("POWERUP: DEBUG - OpenKit end beacon");
    if (openKitAction) {
        Object.keys(request.vals).forEach(x => {
            openKitAction.reportValue(x, request.vals[x]);
        });
        openKitAction.leaveAction();

        if(request.OpenKit == "end_beacon"){
            let payload = createMetricPayload({ ...request.vals, ...openKitAction.vals });
            if (payload && payload.length) sendMetricToDT(payload);
        } else if(request.OpenKit == "end_beacon"){
            //do not create a report payload here, instead reportUsage()
        }
        
    }
}

function createMetricPayload(vals) { //TODO: refactor for readability
    let payload = "";
    let line = `${BG_ENV.METRIC_KEY},dt.entity.custom_application=${BG_ENV.ENT_ID},`;

    if ("internalUser" in vals) line += `internaluser=${vals['internalUser']},`;
    if ("configuratorTag" in vals) line += `configuratortag=${vals['configuratorTag']},`;
    if ("host" in vals) line += `host=${vals['host']},`;
    if ("tenantId" in vals) line += `tenantid=${vals['tenantId']},`;
    if ("libLocation" in vals) line += `liblocation=${vals['libLocation']},`;
    if ("uuid" in vals) line += `uuid=${vals['uuid']},`
    if (openKit && openKit.config && openKit.config.meta && openKit.config.meta.applicationVersion)
        line += `version=${openKit.config.meta.applicationVersion},`;
    if (openKitSession && openKitSession.userId) line += `userid=${openKitSession.userId},`;
    if (typeof (HotFixMode) != "undefined") line += `hotfixmode=${HotFixMode},`;

    let re = new RegExp(`^${BG_ENV.METRIC_KEY},`);
    let summaryLine = line.replace(re, `${BG_ENV.METRIC_SUMMARY_KEY},`);
    if (vals && Object.keys(vals).length) {
        let powerups = Object.keys(vals).filter(x => x.startsWith('PU_'));
        powerups.forEach(x => {
            payload += line + `powerup=${x} ${vals[x]}\n`;
        });
        if (powerups.length)
            payload += summaryLine + `poweredup=true 1\n`;
        else
            payload = summaryLine + `poweredup=false 1\n`;
    } else {
        console.log("POWERUP: unable to send beacon, vals empty!");
        return undefined;
    }

    return payload;
}

function reportUsage(request) {
    let vals = request.metadata;
    let payload = "";
    let line = `${BG_ENV.METRIC_REPORT_DETAIL},dt.entity.custom_application=${BG_ENV.ENT_ID},`;

    if ("internalUser" in vals) line += `internaluser=${vals['internalUser']},`;
    if ("configuratorTag" in vals) line += `configuratortag=${vals['configuratorTag']},`;
    if ("host" in vals) line += `host=${vals['host']},`;
    if ("tenantId" in vals) line += `tenantid=${vals['tenantId']},`;
    if ("libLocation" in vals) line += `liblocation=${vals['libLocation']},`;
    if ("uuid" in vals) line += `uuid=${vals['uuid']},`
    if (openKit && openKit.config && openKit.config.meta && openKit.config.meta.applicationVersion)
        line += `version=${openKit.config.meta.applicationVersion},`;
    if (openKitSession && openKitSession.userId) line += `userid=${openKitSession.userId},`;
    if (typeof (HotFixMode) != "undefined") line += `hotfixmode=${HotFixMode},`;

    let re = new RegExp(`^${BG_ENV.METRIC_REPORT_DETAIL},`);
    let summaryLine = line.replace(re, `${BG_ENV.METRIC_REPORTS},`);
    if (request.aggUsage && Object.keys(request.aggUsage).length) {
        let styles = Object.keys(request.aggUsage);
        styles.forEach(x => {
            payload += line + `style=${x} ${request.aggUsage[x]}\n`;
        });
        if (styles.length)
            payload += summaryLine + `styles=true 1\n`;
        else
            payload = summaryLine + `styles=false 1\n`;
    } else {
        console.log("POWERUP: unable to send beacon, vals empty!");
        return undefined;
    }

    sendMetricToDT(payload);
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
            // 1. check cache, if found return
            // 2. if not, fetch and cache
            // 3. if fetch fails, send error beacon
            // 4. retrieve as blob, convert to data url
            // 5. message data url back to ext side
            if (caches) {
                const url = request.url;
                if (!url.length) {
                    console.warn(`POWERUP: blank URL in backgroundPowerup`);
                    return false;
                }
                caches.match(url).then(function (response) {
                    if (response !== undefined) { //found in cache
                        if (openKitAction)
                            webRequestTracer = openKitAction.traceWebRequest(url);

                        messageBackDataURLFromResponse(response, request, sender)

                        if (webRequestTracer) {
                            webRequestTracer.setBytesSent(0);
                            webRequestTracer.setBytesReceived(0);
                            webRequestTracer.stop(203);
                        }
                        return true;
                    } else {  //not in cache, go get it
                        if (openKitAction)
                            webRequestTracer = openKitAction.traceWebRequest(url);
                        return fetch(url).then(response => {
                            let status = response.status;

                            let responseClone = response.clone(); //cache it for later
                            caches.open('PowerUps').then(function (cache) {
                                cache.put(url, responseClone);
                            });

                            if (webRequestTracer) { //OpenKit web tracer
                                response.clone().blob().then(blob => {
                                    let size = blob.size;
                                    webRequestTracer.setBytesSent(0);
                                    webRequestTracer.setBytesReceived(size);
                                    webRequestTracer.stop(status);
                                })
                            }

                            messageBackDataURLFromResponse(response, request, sender)
                            return true;
                        }).catch(function () {
                            return false;
                        });
                    }
                });
            } else {
                console.warn("POWERUP: caches API not available.");
            }
            break;
    }
}

function messageBackDataURLFromResponse(response, request, sender) {
    const allowedFileTypes = ["image/png", "image/jpeg", "image/gif"];
    response.blob().then((blobResponse) => { //convert response -> blob -> dataUrl
        let type = blobResponse.type;
        let url = request.url;
        if (allowedFileTypes.indexOf(type) < 0) {
            let err = `POWERUP: ${request.PowerUp} - not an allowed filetype: '${type}' for '${url}'`
            console.warn(err);
            errorBeacon(err);
            return false;
        } else {
            let reader = new FileReader();
            reader.onload = (e) => {
                let dataURL = e.target.result;

                chrome.tabs.sendMessage(sender.tab.id, //send back to ext side
                    {
                        PowerUpResult: request.PowerUp,
                        url: url,
                        targetSelector: request.targetSelector,
                        dataURL: dataURL
                    },
                    (responseFromExtside) => {
                        //console.log(response);
                        if (chrome.runtime.lastError) //Check for stupid errors
                            console.log(chrome.runtime.lastError.message);
                    })
            }
            reader.readAsDataURL(blobResponse);
        }
    });
}

// Main
chrome.webNavigation.onCommitted.addListener(hashListener, filter);
chrome.webNavigation.onHistoryStateUpdated.addListener(hashListener, filter);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(hashListener, filter)
chrome.alarms.onAlarm.addListener(checkSignals);
chrome.alarms.create("checkSignals", { delayInMinutes: 1, periodInMinutes: 60 });
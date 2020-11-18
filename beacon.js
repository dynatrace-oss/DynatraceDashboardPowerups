if (typeof (BEACON_LOADED) == "undefined") {
    const OPENKIT_URL = 'https://bf49960xxn.bf-sprint.dynatracelabs.com/mbeacon';
    const OPENKIT_APPID = '9a51173a-1898-45ef-94dd-4fea40538ef4';
    var openKit, openKitSession, openKitAction;

    function listenForBeaconMessages() {
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
                }
            });
        console.log("POWERUP: message listener loaded.");
    }

    function startBeacon(request) {
        if (typeof (OpenKitBuilder) === "undefined") return false;
        if (request.beaconOptOut) return false;

        console.log("POWERUP: DEBUG - OpenKit start beacon");
        openKit = new OpenKitBuilder(OPENKIT_URL, OPENKIT_APPID, request.uuid)
            .withApplicationVersion(request.applicationVersion)
            .withOperatingSystem(request.operatingSystem)
            .withManufacturer(request.manufacturer)
            .withModelId(request.modelId)
            .withScreenResolution(request.screenResolution[0], request.screenResolution[1])
            .build();
        if (openKit) {
            openKitSession = openKit.createSession();
            if (openKitSession) {
                openKitSession.identifyUser(request.name);
                openKitAction = openKitSession.enterAction(request.action);
                if (openKitAction) {
                    Object.keys(request.vals).forEach(x => {
                        openKitAction.reportValue(x, request.vals[x]);
                    });
                }
            }
        }
    }

    function endBeacon(request) {
        if (typeof (OpenKitBuilder) === "undefined" || !openKit) return false;
        console.log("POWERUP: DEBUG - OpenKit end beacon");
        if (openKitAction) {
            Object.keys(request.vals).forEach(x => {
                openKitAction.reportValue(x, request.vals[x]);
            });
            powerupsFired = {};
            openKitAction.leaveAction();
        }
        if (openKitSession) openKitSession.end();
        if (openKit) openKit.shutdown();
    }

    listenForBeaconMessages();
    BEACON_LOADED = true;
}
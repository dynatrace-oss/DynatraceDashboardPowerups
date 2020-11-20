if (typeof (INJECTED) == "undefined") {
    const POWERUPDEBUG = false;
    if (POWERUPDEBUG) console.log("Powerup: Dashboard powerups installed.");
    window.jQuery || console.log("Powerup: ERROR - No jQuery...");
    $(document).ready(function () {
        if (POWERUPDEBUG) console.log("Powerup: document ready");
        $(window).on("load hashchange", powerupListener);
        if (POWERUPDEBUG) console.log("Powerup: listener loaded");
        powerupListener();
    });

    const ext_url = chrome.runtime.getURL("");
    const version = chrome.runtime.getManifest().version;
    const ext_id = chrome.runtime.id;
    const GH_URL = 'https://raw.githubusercontent.com/LucasHocker/DynatraceDashboardPowerups/master/';
    var HotFixMode = 0;
    var waits = 0;
    var timeout;

    //Function to check to see if we should do some 
    function powerupListener() {
        if (window.location.hash.startsWith("#dashboard;") ||
            window.location.hash.startsWith("#dashboard/dashboard;")) {
            if (POWERUPDEBUG) console.log("Powerup: on a dashboard, power-up!");
            window.requestAnimationFrame(powerupDashboards);
        } else {
            if (POWERUPDEBUG) console.log("Powerup: not a dashboard, quit.");
            return;
        }
    }


    //This is a function that runs when on the "dashboard" page (the check if we are on that page is at the bottom) 
    function powerupDashboards() {
        //Wait for the dashboard page to load before proceeding 
        if (document.readyState == 'complete' &&
            $('[uitestid="gwt-debug-dashboardGrid"]').length &&     //grid is loaded
            !$(".loader").length &&                                 //main loading distractor gone
            !$('[uitestid="gwt-debug-tileLoader"]:visible').length  //tile distractors hidden
        ) {
            if (POWERUPDEBUG) console.log("Powerup: things look ready, begin power-ups...");
            let config_p = loadConfig();

            $.when(config_p).done(function (config) {
                //Load functions to call in client context
                let clientside_p = injectClientsideLib(config);
                injectCSS();
                if (POWERUPDEBUG) console.log("Powerup: clientside libs injected.");

                $.when(clientside_p).then(() => {
                    startBeaconListener();
                    injectOtherModules(config);
                    injectHighchartsModules(config);
                    injectD3Modules(config);
                    injectClientsideString(`
                    DashboardPowerups.POWERUP_EXT_URL='${ext_url}';
                    DashboardPowerups.VERSION='${version}';
                    DashboardPowerups.EXT_ID='${ext_id}';
                    DashboardPowerups.config = ${JSON.stringify(config)};
                    DashboardPowerups.GridObserver.launchGridObserver();
                    `);

                    console.log("Powerup: powerups complete.");
                });
            });
            return;
        } else {
            waits++;
            if (waits % 10 == 0)
                console.log(`Powerup: WARN - still doesn't look like things are loaded yet, slept ${waits}s.`);
            clearTimeout(timeout);
            timeout = setTimeout(powerupDashboards, 1000);
        }
    };

    function injectClientsideLib(config) {
        let p = $.Deferred();
        if (!$("#DashboardPowerupsTag").length) {
            if (config.Powerups.libLocation == "gh" //Allow user to opt-in to pull from GitHub instead of extension, due to slow Google approvals
                || HotFixMode) { //Or force all users to GitHub copy in case of emergency hotfix
                console.log(`POWERUP: Loading libs from: GH...`);
                fetch('https://raw.githubusercontent.com/LucasHocker/DynatraceDashboardPowerups/master/clientside.min.js')
                    .then(function (response) {
                        if (!response.ok) {
                            //default back to local copy
                        } else return response.text();
                    })
                    .then(function (text) { // read response body as text
                        var $s = $("<script>")
                            .attr("id", "DashboardPowerupsTag")
                            .text(text) //execute in webpage context, not extension
                            .appendTo("body");
                        p.resolve(true);
                    });
            } else {
                let lib = (config.Powerups.libLocation == "gh" ? GH_URL : ext_url)
                    + (POWERUPDEBUG ? "clientside.js" : "clientside.min.js");
                console.log(`POWERUP: Loading libs from: ${lib}...`);
                var $s = $("<script>")
                    .attr("id", "DashboardPowerupsTag")
                    .attr("src", lib) //execute in webpage context, not extension
                    .appendTo("body");
                p.resolve(true);
            }
        } else {
            p.resolve(false);
        }
        return p;
    }

    function injectClientsideString(s) {
        let id = uniqId();

        let wrapped = `
        function injectedFunction${id}(tries=0){
            if(typeof(DashboardPowerups) == "object"){
                ${s}
            } else {
                tries++;
                if(tries>20){
                    console.log("Powerup: FATAL client lib never loaded.");
                    return false;
                } else
                    setTimeout(()=>{injectedFunction${id}(tries)},50);
            }
        }
        injectedFunction${id}();`;
        var $s = $("<script>")
            .append(document.createTextNode(wrapped))
            .appendTo("body");
    }

    var uniqId = (function () {
        //usage: let myId = uniqId();
        var i = 0;
        return function () {
            return i++;
        }
    })();

    function injectCSS() {
        if ($("#PowerUpCSS").length < 1) {
            var $link = $("<link>")
                .attr("id", "PowerUpCSS")
                .attr("rel", "stylesheet")
                .attr("type", "text/css")
                .attr("href", ext_url + "powerup.css")
                .appendTo("head");
        }
    }

    function loadConfig() {
        let p = $.Deferred();
        let defaultConfig = {
            Powerups: {
                tooltipPU: true,
                colorPU: true,
                svgPU: true,
                worldmapPU: true,
                bannerPU: true,
                usqlstackPU: true,
                usqlcolorPU: true,
                linePU: true,
                heatmapPU: true,
                sankeyPU: true,
                funnelPU: true,
                mathPU: true,
                datePU: true,
                gaugePU: true,
                comparePU: true,
                debug: false,
                colorPUTarget: "Text",
                animateCritical: "3 Pulses",
                animateWarning: "Never",
                sunburnMode: false,
                libLocation: "ext",
                ackedVersion: "0.0",
                BeaconOptOut: false,
                uuid: (typeof (uuidv4) === "function" ? uuidv4() : "")
            }
        }

        if (!chrome || !chrome.storage || !chrome.storage.local) return false;
        chrome.storage.local.get(['Powerups', 'hotfixMode'], function (result) {
            HotFixMode = (result.hotfixMode ? result.hotfixMode : 0);
            if (result && result.Powerups &&
                Object.keys(defaultConfig.Powerups).length === Object.keys(result.Powerups).length) {
                if (result.Powerups.debug)
                    console.log('Powerup: DEBUG - (extside) config from storage is: ' + JSON.stringify(result));
                p.resolve(result);
            }
            else {
                console.log("Powerup: WARN - stored config format didn't match, merging...");
                if (typeof (result) == "object" && typeof (result.Powerups) == "object") {
                    for (const [key, value] of Object.entries(result.Powerups)) { //merge existing preferences
                        if (typeof (defaultConfig[key]) != "undefined")
                            defaultConfig[key] = value;
                    }
                }
                writeConfig(defaultConfig);
                p.resolve(defaultConfig);
            }
        });

        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                if (request.Powerup == "UpdateConfig") {
                    chrome.storage.local.get(['Powerups'], function (result) {
                        let s = `DashboardPowerups.config = ${JSON.stringify(result)};`
                        injectClientsideString(s);
                        sendResponse({ Powerup: "InjectedUpdatedConfig" });
                    });
                }
            });

        return p;
    }

    function writeConfig(defaultConfig) {
        if (!chrome || !chrome.storage || !chrome.storage.local) return false;
        chrome.storage.local.set(defaultConfig, function () {
            if (defaultConfig.Powerups.debug)
                console.log('Powerup: (extside) config storage set to ' + JSON.stringify(defaultConfig));
        });
    }

    function injectHighchartsModule(mod) {
        let id = "HighchartsMod_" + mod;
        let src = `${ext_url}3rdParty/Highcharts/modules/6.2.0/${mod}.js`;
        if (!$('#' + id).length) {
            let $s = $("<script>")
                .attr("id", id)
                .attr("src", src)
                .appendTo("body");
        } else {
            //already injected
        }
    }

    function injectHighchartsModules(config) {
        if (config.Powerups.heatmapPU) {
            injectHighchartsModule("heatmap");
            injectClientsideString(`
            //Highcharts Heatmap bug workaround
            if(Highcharts && Highcharts.charts)
                Highcharts.charts
                    .filter(x=>typeof(x)!=="undefined")
                    .filter(x=>typeof(x.colorAxis)=="undefined")
                    .forEach(x=>{x.colorAxis=[];});
            `);
        }
        if (config.Powerups.sankeyPU) {
            injectHighchartsModule("sankey");
        }
        if (config.Powerups.treemapPU)
            injectHighchartsModule("treemap");
        if (config.Powerups.gaugePU)
            injectHighchartsModule("solid-gauge");
    }

    function injectD3Modules(config) {
        if (config.Powerups.funnelPU) {
            injectD3Module("d3-funnel.min.js");
        }
    }

    function injectD3Module(mod) {
        let id = "D3_" + mod;
        let src = `${ext_url}3rdParty/D3/${mod}`;
        if (!$('#' + id).length) {
            let $s = $("<script>")
                .attr("id", id)
                .attr("src", src)
                .appendTo("body");
        } else {
            //already injected
        }
    }

    function injectOtherModules(config) {
        if (!config.Powerups.BeaconOptOut) {
            injectOtherModule('3rdParty/node_modules/@dynatrace/openkit-js/dist/browser/openkit.js', "OpenKitBuilder");
        }
        if (config.Powerups.sankeyPU) {
            injectOtherModule('3rdParty/node_modules/@iconfu/svg-inject/dist/svg-inject.min.js', "SVGInject");
        }
        if (config.Powerups.mathPU) {
            injectOtherModule("3rdParty/node_modules/math-expression-evaluator/dist/browser/math-expression-evaluator.min.js", "mexp");
        }
        if (config.Powerups.datePU) {
            injectOtherModule("3rdParty/date_fns.min.js", "dateFns");
        }
    }

    function injectOtherModule(mod, glob) {
        let src = ext_url + encodeURI(mod);
        injectClientsideString(`
        if (typeof (${glob}) == "undefined" &&
            ! $("#powerup_lib_${glob}").length) {
            $("<script>")
                .attr("id", "powerup_lib_${glob}")
                .attr("src", "${src}" )
                .appendTo("body");
        }`);
    }

    function startBeaconListener() {
        if (typeof (BEACON_LISTENING) == "undefined") {
            window.addEventListener("message", function (event) {
                // We only accept messages from ourselves
                if (event.source != window)
                    return;

                if (event.data.OpenKit) {
                    console.log("POWERUP: Content script received: " + event.data.OpenKit);
                    chrome.runtime.sendMessage(event.data);
                }
            }, false);
        }
        BEACON_LISTENING = true;
    }

    INJECTED = true;
}
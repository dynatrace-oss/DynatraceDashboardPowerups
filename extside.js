if (typeof (INJECTED) == "undefined") {
    const POWERUPDEBUG = false;
    if (POWERUPDEBUG) console.log("Powerup: Dashboard powerups installed.");
    window.jQuery || console.log("Powerup: ERROR - No jQuery...");
    $(document).ready(function () {
        if (POWERUPDEBUG) console.log("Powerup: document ready");
        $(window).on("load hashchange", powerupListener);
        if (POWERUPDEBUG) console.log("Powerup: listener loaded");
    });

    const ext_url = chrome.runtime.getURL("");
    var waits = 0;
    var timeout;

    //Function to check to see if we should do some 
    function powerupListener() {
        if (window.location.hash.startsWith("#dashboard;") ||
            window.location.hash.startsWith("#dashboard/dashboard;")) {
            if (POWERUPDEBUG) console.log("Powerup: on a dashboard, power-up!");
            powerupDashboards();
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
            //Load functions to call in client context
            injectClientsideLib();
            injectCSS();
            if (POWERUPDEBUG) console.log("Powerup: clientside libs injected.");

            $.when(config_p).done(function (config) {
                injectClientsideString(`
            DashboardPowerups.POWERUP_EXT_URL='${ext_url}';
            DashboardPowerups.config = ${JSON.stringify(config)};
            
            //Step1: color changes
            DashboardPowerups.colorPowerUp();

            //Step2: swap markdowns for SVGs
            DashboardPowerups.svgPowerUp();

            //Step3: add tooltips
            DashboardPowerups.addToolTips();

            //Last Step: cleanup ugly markup
            DashboardPowerups.cleanMarkup();
            `);

                console.log("Powerup: powerups complete.");
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

    function injectClientsideLib() {
        if (!$("#DashboardPowerupsTag").length) {
            var $s = $("<script>")
                .attr("id", "DashboardPowerupsTag")
                .attr("src", chrome.runtime.getURL("clientside.js")) //execute in webpage context, not extension
                .appendTo("body");
        }
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
        var $link = $("link")
            .attr("id", "PowerUpCSS")
            .attr("rel", "stylesheet")
            .attr("type", "text/css")
            .attr("href", ext_url + "powerup.css")
            .appendTo("head");
    }

    function loadConfig() {
        let p = $.Deferred();
        let defaultConfig = {
            Powerups: {}
        }

        chrome.storage.local.get(['Powerups'], function (result) {
            if (result && result.Powerups) {//&&
                //Object.keys(defaultConfig.Powerups).length === Object.keys(result.Powerups).length) {
                if (result.Powerups.debug)
                    console.log('Powerup: POWERUPDEBUG - (extside) config from storage is: ' + JSON.stringify(result));
                //TODO: add some sort of new config merge
                p.resolve(result);
            }
            else {
                console.log("Powerup: WARN - stored config format didn't match, defaulting...");
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
        chrome.storage.local.set(defaultConfig, function () {
            if (defaultConfig.Powerups.debug)
                console.log('Powerup: (extside) config storage set to ' + JSON.stringify(defaultConfig));
        });
    }

    INJECTED = true;
}
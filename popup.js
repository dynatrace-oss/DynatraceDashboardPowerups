console.log("Powerup: popup.js loaded.");
window.jQuery || console.log("Powerup: No jQuery for popup.js...");
$(document).ready(function () {
    let config_p = loadConfig();
    updateDebugOutput(config_p);

    $.when(config_p).done(function (config) {
        updateControls(config);
        $('#save').on('click', writeConfig);
    });

});

function loadConfig() {
    let p = $.Deferred();
    let defaultConfig = {
        Powerups: {
            tooltipPU: true,
            colorPU: true,
            svgPU: true,
            worldmapPU: true,
            bannerPU: true,
            debug: false
        }
    };

    chrome.storage.local.get(['Powerups'], function (result) {
        console.log('Powerup: (popup) config from storage is: ' + JSON.stringify(result));
        if (result && result.Powerups &&
            Object.keys(defaultConfig.Powerups).length === Object.keys(result.Powerups).length) {
            //TODO: add some sort of new config merge
            p.resolve(result);
        }
        else {
            console.log("Powerup: stored config format didn't match, defaulting...");
            writeConfig(defaultConfig);
            p.resolve(defaultConfig);
        }
    });
    return p;
}

function writeConfig() {
    let p = $.Deferred();
    let config = {
        Powerups: {
            tooltipPU: $('#tooltipPU').prop("checked"),
            colorPU: $('#colorPU').prop("checked"),
            svgPU: $('#svgPU').prop("checked"),
            worldmapPU: $('#worldmapPU').prop("checked"),
            bannerPU: $('#bannerPU').prop("checked"),
            debug: $('#debug').prop("checked"),
        }
    }

    chrome.storage.local.set(config, function () {
        p.resolve(true);
        console.log('Powerup: (popup) config storage set to ' + JSON.stringify(config));
        updateDebugOutput(loadConfig());
    });
    return p;
}

function updateDebugOutput(config_p) {
    $.when(config_p).done(function(config){
        $('p#notice').text(JSON.stringify(config));
    })
}

function updateControls(config) {
    let powerups = config.Powerups || {};
    Object.keys(config.Powerups).forEach((key)=>{
        let selector = '#'+key;
        let val = powerups[key];
        if(typeof(val) == "boolean")
            $(selector).prop("checked",val);
        else
            $(selector).val(val);
    })
}
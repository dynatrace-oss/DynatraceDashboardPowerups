/*
Copyright 2020 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

const defaultConfig = {
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
        tablePU: true,
        honeycombPU: true,
        treemapPU: true,
        reporting: true,
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
};
Object.freeze(defaultConfig);


var HotFixMode = 0;
console.log("Powerup: popup.js loaded.");
window.jQuery || console.log("Powerup: No jQuery for popup.js...");
$(document).ready(function () {
    let config_p = loadConfig();
    updateDebugOutput(config_p);

    $.when(config_p).done(function (config) {
        //startBeaconMessage();
        updateControls(config);
        $('#save').on('click', saveAndClose);
        $('#prefs').on('click', togglePrefs);
        $('#report').on('click', generateReport);
        togglePrefs();
        //endBeaconMessage();
    });

});

function saveAndClose() {
    let p = writeConfig();
    $.when(p).done(function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { Powerup: "UpdateConfig" }, () => {
                window.close();
            });
        });
    });
}

function loadConfig(alreadyWritten = false) {
    let p = $.Deferred();

    chrome.storage.local.get(['Powerups', 'hotfixMode'], function (result) {
        HotFixMode = (result.hotfixMode ? result.hotfixMode : 0);
        console.log('Powerup: (popup) config from storage is: ', result);
        if (result && result.Powerups
            && Object.keys(defaultConfig.Powerups).length === Object.keys(result.Powerups).length
            && result.Powerups.ackedVersion === chrome.runtime.getManifest().version
        ) {
            p.resolve(result);
        } else if (alreadyWritten) {
            console.log("Powerup: (popup) FATAL - write/read did not match.");
            p.resolve(defaultConfig);
        } else {
            console.log("Powerup: (popup) stored config format didn't match, defaulting...");
            let newConfig = JSON.parse(JSON.stringify(defaultConfig));
            if (typeof (result) == "object" && typeof (result.Powerups) == "object") {
                for (const [key, value] of Object.entries(result.Powerups)) { //merge existing preferences
                    if (typeof (newConfig[key]) != "undefined")
                        newConfig[key] = value;
                }
            }
            newConfig.ackedVersion = chrome.runtime.getManifest().version;
            writeConfig(newConfig);
            updateIcon();
            p.resolve(newConfig);
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
            usqlstackPU: $('#usqlstackPU').prop("checked"),
            usqlcolorPU: $('#usqlcolorPU').prop("checked"),
            linePU: $('#linePU').prop("checked"),
            heatmapPU: $('#heatmapPU').prop("checked"),
            sankeyPU: $('#sankeyPU').prop("checked"),
            funnelPU: $('#funnelPU').prop("checked"),
            mathPU: $('#mathPU').prop("checked"),
            datePU: $('#datePU').prop("checked"),
            gaugePU: $('#gaugePU').prop("checked"),
            comparePU: $('#comparePU').prop("checked"),
            tablePU: $('#tablePU').prop("checked"),
            honeycombPU: $('#honeycombPU').prop("checked"),
            treemapPU: $('#treemapPU').prop("checked"),
            reporting: $('#reporting').prop("checked"),
            debug: $('#debug').prop("checked"),
            colorPUTarget: $('#colorPUTarget').val(),
            animateCritical: $('#animateCritical').val(),
            animateWarning: $('#animateWarning').val(),
            sunburnMode: $('#sunburnMode').prop("checked"),
            libLocation: $('#libLocation').val(),
            ackedVersion: chrome.runtime.getManifest().version,
            BeaconOptOut: $('#BeaconOptOut').prop("checked"),
            uuid: $('#uuid').val() || (typeof (uuidv4) === "function" ? uuidv4() : "")
        }
    }
    //prevent mismatch
    let keys = Object.keys(config.Powerups);
    let defaultKeys = Object.keys(defaultConfig.Powerups);
    if (keys.length != defaultKeys.length) {
        let missing = defaultKeys.filter(dk => !keys.includes(dk));
        let extra = keys.filter(k => !defaultKeys.includes(k));
        console.warn(`Powerup: WARN - Popup - Mismatch config key count on write.`
            + (missing.length ? ` Missing: ${missing}.` : '')
            + (extra.length ? ` Extra: ${extra}` : '')
        );
        if (missing && missing.length) missing.forEach(k => {
            config.Powerups[k] = defaultConfig.Powerups[k];
        });
        if (extra && extra.length) extra.Powerups.forEach(k => {
            delete config.Powerups[k];
        })
    }

    chrome.storage.local.set(config, function () {
        p.resolve(true);
        console.log('Powerup: (popup) config storage set to ' + JSON.stringify(config));
        updateDebugOutput(loadConfig(true));
    });
    return p;
}

function updateDebugOutput(config_p) {
    $.when(config_p).done(function (config) {
        $('#notice').val(JSON.stringify(config));
        $(`#version`).text(`version: ${config.Powerups.ackedVersion}`);
        if (HotFixMode) {
            $("<span>")
                .addClass("hotfixMode")
                .text(" (in HotFix Mode)")
                .appendTo($(`#version`));
        }
    })
}

function updateControls(config) {
    let powerups = config.Powerups || {};
    Object.keys(config.Powerups).forEach((key) => {
        let selector = '#' + key;
        let val = powerups[key];
        if (typeof (val) == "boolean")
            $(selector).prop("checked", val);
        else
            $(selector).val(val);
    })
}

function updateIcon() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.pageAction.setIcon({ tabId: tab.id, path: 'Assets/powerup.png' });
    });
}

function togglePrefs() {
    let $closer = $("#prefCloser");
    $closer.parents("thead").siblings().toggle();
    $closer.toggleClass("open");
}

function generateReport() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { Powerup: "GenerateReport" }, (response) => {
            if (typeof (response) != "undefined" && response.Powerup == "LaunchedReportGeneration") {
                console.log("Powerup: launched report generation");
            } else {
                console.log("Powerup: report generation failed");
            }
            window.close();
        });
    });
}
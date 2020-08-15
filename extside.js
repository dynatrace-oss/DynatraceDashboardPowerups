console.log("Powerup: Dashboard powerups installed.");
window.jQuery || console.log("Powerup: No jQuery...");
$(document).ready(function () {
    console.log("Powerup: document ready");
    $(window).on("load hashchange", powerupListener);
    console.log("Powerup: listener loaded");
});

const ext_url = chrome.runtime.getURL("");

//Function to check to see if we should do some 
function powerupListener() {
    if (window.location.hash.startsWith("#dashboard;") ||
        window.location.hash.startsWith("#dashboard/dashboard;")) {
        console.log("Powerup: on a dashboard, power-up!");
        powerupDashboards();
    } else {
        console.log("Powerup: not a dashboard, quit.");
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
        console.log("Powerup: things look ready, begin power-ups...");
        //Load functions to call in client context
        injectClientsideLib();
        injectCSS();
        console.log("Powerup: clientside libs injected.");

        injectClientsideString(`
        DashboardPowerups.POWERUP_EXT_URL='${ext_url}';
        
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
        return;
    } else {
        console.log("Powerup: doesn't look like things are loaded yet, sleeping 1s.");
        setTimeout(powerupDashboards, 1000);
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
    function injectedFunction${id}(){
        if(typeof(DashboardPowerups) == "object"){
            ${s}
        } else {
            console.log("Powerup: client lib not yet loaded.");
            setTimeout(injectedFunction${id},50);
        }
    }
    injectedFunction${id}();`
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
console.log("Powerup: Dashboard powerups installed.");
window.jQuery || console.log("Powerup: No jQuery...");
$(document).ready(function () {
    console.log("Powerup: document ready");
    if (window.location.hash.startsWith("#dashboard;") ||
        window.location.hash.startsWith("#dashboard/dashboard;")) {
        //Add event listener to start hacking
        console.log("Powerup: listener loaded");
        $(window).on("load hashchange", hackDashboards);
        //Highcharts.addEvent(chart, 'load', hackDashboards); //cannot access webpage's globals
    } else {
        console.log("Powerup: not a dashboard, quit.");
        return; //not a dashboard
    }


});

//Note, this is hacked from Alistair Emslie's Dynatrace Business Impact extension
const title_selector = '[uitestid="gwt-debug-title"]';
const val_selector = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"] > span:first-of-type';
const colorize_selector = '.grid-tile';
const svg_selector = '[uitestid="gwt-debug-MARKDOWN"] > div:first-child > div:first-child';
const colorhack = '!colorhack:';
const svghack = '!svghack:';
const linker = '!link=';





//This is a function that runs when on the "dashboard" page (the check if we are on that page is at the bottom) 
function hackDashboards() {
    //Wait for the dashboard page to load before proceeding 
    if (document.readyState == 'complete' &&
        $('[uitestid="gwt-debug-dashboardGrid"]').length &&     //grid is loaded
        !$(".loader").length &&                                //main loading distractor gone
        !$('[uitestid="gwt-debug-tileLoader"]:visible').length        //tile distractors hidden
    ) {
        console.log("Powerup: dashboard hacking...");

        //Step1: color changes
        colorPowerUp();

        //Step2: swap markdowns for SVGs
        svgPowerUp();

        //Step3: add tooltips
        addToolTips();

        return; //Stop checking we are on the dashboard screen once it's navigated to
    } else {
        console.log("Powerup: dashboardGrid not found yet, sleeping 200.");
        setTimeout(hackDashboards, 200);
    }
};



function colorPowerUp() {
    $(title_selector).each((i, el) => {
        let $title = $(el);
        let $tile = $title.parents(".grid-tile");

        //Step1: change tile colors
        if ($title.text().includes(colorhack)) { //example !colorhack:base=high;warn=90;crit=70
            console.log("Powerup: color hack found");
            let titletokens = $title.text().split(colorhack);
            let argstring = titletokens[1];
            let args = argstring.split(";").map(x => x.split("="));
            if (args.length < 3) {
                console.log("Powerup: invalid argstring: " + argstring);
                return false;
            }
            let base = args.find(x => x[0] == "base")[1];
            let warn = Number(args.find(x => x[0] == "warn")[1]);
            let crit = Number(args.find(x => x[0] == "crit")[1]);
            let val = Number($tile.find(val_selector).text());

            $tile.removeClass("powerup-colorhack-critical powerup-colorhack-warning powerup-colorhack-normal");
            if (base == "low") {
                if (val < warn) $tile.addClass("powerup-colorhack-normal");
                else if (val < crit) $tile.addClass("powerup-colorhack-warning");
                else $tile.addClass("powerup-colorhack-critical");
            } else if (base == "high") {
                if (val > warn) $tile.addClass("powerup-colorhack-normal");
                else if (val > crit) $tile.addClass("powerup-colorhack-warning");
                else $tile.addClass("powerup-colorhack-critical");
            }

            //hide ugly markup
            if (!$title.html().includes('<span class="powerup-markup">')) {
                let newTitle = titletokens[0] + '<span class="powerup-markup">' + titletokens[1] + '</span>';
                $title.html(newTitle);
            }
        }
    });
}

function svgPowerUp() {
    $(svg_selector).each((i, el) => {
        let $svgcontainer = $(el);
        let $tile = $svgcontainer.parents(".grid-tile");

        if ($svgcontainer.text().includes(svghack)) { //example !svghack:icon=host;link=val1;base=high;warn=90;crit=70 other tile has !link=val1
            console.log("Powerup: svg hack found");
            let argstring = $svgcontainer.text().split(svghack)[1];
            let args = argstring.split(";").map(x => x.split("="));
            let icon = args.find(x => x[0] == "icon")[1];
            let link = args.find(x => x[0] == "link")[1];
            let base = args.find(x => x[0] == "base")[1];
            let warn = Number(args.find(x => x[0] == "warn")[1]);
            let crit = Number(args.find(x => x[0] == "crit")[1]);
            let val;

            //find val
            let link_text = linker + link;
            $(title_selector).each((i_link, el_link) => {
                let $linktitle = $(el_link);

                if ($linktitle.text().includes(link_text)) {
                    let $linktile = $linktitle.parents(".grid-tile");
                    val = Number($linktile.find(val_selector).text());

                    //hide ugly markup
                    if (!$linktitle.html().includes('<span class="powerup-markup">')) {
                        let re = new RegExp('(.*)(' + linker + '[^ ]*)(.*)');
                        let titletokens = $linktitle.html().match(re);
                        let newTitle = titletokens[1] + '<span class="powerup-markup">' + titletokens[2] + '</span>' + titletokens[3];
                        $linktitle.html(newTitle);
                    }

                }
            });
            if (typeof val == "undefined") {
                console.log("Powerup: unable to match link: " + link_text);
            }

            //swap in the svg
            var imgURL = chrome.runtime.getURL("3rdParty/barista-icons/" + icon + ".svg");
            fetch(imgURL)
                .then((response) => response.text())
                .then((svgtext) => {
                    $svgcontainer.empty();
                    let $svg = $(svgtext)
                        .appendTo($svgcontainer);

                    $svg.removeClass("powerup-svghack-critical powerup-svghack-warning powerup-svghack-normal");
                    if (base == "low") {
                        if (val < warn) $svg.addClass("powerup-svghack-normal");
                        else if (val < crit) $svg.addClass("powerup-svghack-warning");
                        else $svg.addClass("powerup-svghack-critical");
                    } else if (base == "high") {
                        if (val > warn) $svg.addClass("powerup-svghack-normal");
                        else if (val > crit) $svg.addClass("powerup-svghack-warning");
                        else $svg.addClass("powerup-svghack-critical");
                    }
                });
        }
    });

}

function addToolTips() {
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src = chrome.runtime.getURL("tooltips.js"); //execute in webpage context, not extension
    $("head").append(s);
    $(".highcharts-container").css("z-index", 999);
}
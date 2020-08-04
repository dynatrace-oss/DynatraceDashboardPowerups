//Note, this is hacked from Alistair Emslie's Dynatrace Business Impact extension
const title_selector = '[uitestid="gwt-debug-title"]';
const val_selector = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"] > span:first-of-type';
const colorize_selector = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"]';
const svg_selector = '[uitestid="gwt-debug-MARKDOWN"] > div > div';
const colorhack = '!colorhack:';
const svghack = '!svghack:';

//Add event listener to check if it should calculate results when the anchor tag changes
window.addEventListener("load hashchange", hackDashboards, false);


//This is a function that runs when on the "dashboard" page (the check if we are on that page is at the bottom) 
function hackDashboards() {

    //Wait for the dashboard page to load before proceeding 
    if ($('[uitestid="gwt-debug-dashboardGrid"]').length) {
        console.log("Powerup: dashboard hacking...");

        //Step1: color changes
        colorPowerUp();

        //Step2: swap markdowns for SVGs
        svgPowerUp();

        //Step3: add tooltips
        addToolTips();

        return; //Stop checking we are on the dashboard screen once it's navigated to
    }
    //If we're not on the dashboard screen, then keep checking //TODO: add throttling or smarter waiting
    window.requestAnimationFrame(ready);
};



function colorPowerUp() {
    $(title_selector).each((i, el) => {
        let $title = $(el);
        let $tile = $title.parents(".grid-tile");

        //Step1: change tile colors
        if ($title.text().includes(colorhack)) { //example !colorhack:base=high;warn=90;crit=70
            console.log("Powerup: color hack found");
            let argstring = $title.text().split(colorhack)[1];
            let args = argstring.split(";").map(x => x.split("="));
            let base = args.find(x => x[0] == "base")[1];
            let warn = Number(args.find(x => x[0] == "warn")[1]);
            let crit = Number(args.find(x => x[0] == "crit")[1]);
            let val = Number($tile.find(val_selector).text());

            $title.removeClass("powerup-colorhack-critical powerup-colorhack-warning powerup-colorhack-normal");
            if (base == "low") {
                if (val < warn) $title.addClass("powerup-colorhack-normal");
                else if (val < crit) $title.addClass("powerup-colorhack-warning");
                else $title.addClass("powerup-colorhack-critical");
            } else if (base == "high") {
                if (val > warn) $title.addClass("powerup-colorhack-normal");
                else if (val > crit) $title.addClass("powerup-colorhack-warning");
                else $title.addClass("powerup-colorhack-critical");
            }
        }
    });
}

function svgPowerUp() {
    $(svg_selector).each((i, el) => {
        if ($title.text().includes(svghack)) { //example !svghack:icon=host;link=val1;base=high;warn=90;crit=70
            console.log("Powerup: svg hack found");
            let argstring = $title.text().split(svghack)[1];
            let args = argstring.split(";").map(x => x.split("="));
            let link = args.find(x => x[0] == "link")[1];
            let base = args.find(x => x[0] == "base")[1];
            let warn = Number(args.find(x => x[0] == "warn")[1]);
            let crit = Number(args.find(x => x[0] == "crit")[1]);
            let val = 0;

            //find val
            $(title_selector).each((i, el) => {
                let $linktitle = $(el);
                let $linktile = $linktitle.parents(".grid-tile");
                //if ()
            });

            let $svgcontainer = $(el);
            $svgcontainer.empty();
            let $svg = (examplesvg) //get actual svg somewhere
                .appendTo($svgcontainer);


            $svg.removeClass("powerup-colorhack-critical powerup-colorhack-warning powerup-colorhack-normal");
            if (base == "low") {
                if (val < warn) $title.addClass("powerup-colorhack-normal");
                else if (val < crit) $title.addClass("powerup-colorhack-warning");
                else $title.addClass("powerup-colorhack-critical");
            } else if (base == "high") {
                if (val > warn) $title.addClass("powerup-colorhack-normal");
                else if (val > crit) $title.addClass("powerup-colorhack-warning");
                else $title.addClass("powerup-colorhack-critical");
            }
        }
    });

}

function addToolTips() {
    Highcharts.charts.forEach((x) => {
        if (typeof (x) !== "undefined") {
            x.update({
                series: {
                    "animation": true,
                    "allowPointSelect": true,
                    "enableMouseTracking": true,
                    "states": {
                        "hover": {
                            "enabled": true,
                            "halo": {
                                "opacity": 0.25,
                                "size": 10
                            }
                        }
                    },
                    point: {
                        events: {
                            mouseOver: x.tooltip.refresh
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    animation: true,
                    outside: true,
                    useHTML: false,
                    pointFormat: "<span style=\"color:{point.color}\">●</span> {series.name}: <b>{point.y:.1f}</b><br/>",
                    crosshairs: [true, true]
                }
            });
            //x.tooltip.refresh(x.series[0].data[0]);

            //console.log(x.options);
        }
    });
    $(".highcharts-container").css("z-index", 999);
}

var examplesvg = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="512px" height="512px" viewBox="0 0 512 512" enable-background="new 0 0 512 512" space="preserve" fill="#ffffff"><desc>Created with Sketch.</desc><g id="aws-icons_DT">	<g id="amazon-qldb">		<g id="Amazon-Quantum-Ledger-Database-QLDB">			<g id="Icon_Test">				<path id="Shape" d="M190.7,185.8c-64.7,0-113.4-20.6-113.4-47.9S126,90,190.7,90s113.5,20.6,113.5,47.9					S255.3,185.8,190.7,185.8z M190.7,101.2c-60.3,0-102.3,19.4-102.3,36.8s42,36.8,102.3,36.8S293,155.4,293,138					S251,101.2,190.7,101.2z"></path>				<polygon id="Rectangle-path" points="293,137.9 304.1,137.9 304.1,219.5 293,219.5 				"></polygon>				<path id="Shape_1_" d="M190.7,428C126,428,77,407.4,77,380.5V137.9h11.1v242.6c0,17.4,42,36.8,102.3,36.8					s102.3-19.4,102.3-36.8V329h11.1v51.5C304.1,407.4,255.3,428,190.7,428z"></path>				<path id="Shape_2_" d="M143.7,266.4c-41.3-7.8-65.8-24.1-65.8-44.2H89c0,13.3,22.9,26.4,56.8,32.8L143.7,266.4z"></path>				<path id="Shape_3_" d="M191,353.7c-64.5,0-113.2-20.6-113.2-47.9h11.1c0,17.4,41.9,36.8,102.3,36.8					c48.4,0,73.9-11.5,74.2-11.6l4.6,10.2C268.6,341.7,242,353.7,191,353.7z"></path>				<path id="Shape_4_" d="M214.1,299.5h-24.7c-7.2,0-12.9-5.9-12.9-13.1v-25.1c-0.1-3.5,1.3-6.9,3.7-9.4					s5.8-3.9,9.2-3.9h24.7c7.2,0,13,5.9,13,13.1v24.8c0.1,3.6-1.2,7-3.6,9.6C221.1,298,217.7,299.5,214.1,299.5L214.1,299.5z					 M189.4,259.7c-1,0-1.8,0.9-1.8,1.9v24.8c0,1,0.8,1.8,1.8,1.8h24.7c1,0,1.8-0.8,1.8-1.8v-25.1c0-1-0.8-1.9-1.8-1.9L189.4,259.7z					"></path>				<path id="Shape_5_" d="M308.4,299.5h-24.7c-7.2,0-12.9-5.9-12.9-13.1v-25.1c-0.1-3.5,1.3-6.9,3.7-9.4					c2.4-2.5,5.8-3.9,9.2-3.9h24.7c7.2,0,12.9,5.9,12.9,13.1v24.8c0.1,3.6-1.2,7-3.6,9.6C315.3,298,311.9,299.5,308.4,299.5z					 M283.7,259.7c-1,0-1.8,0.9-1.8,1.9v24.8c0,1,0.8,1.8,1.8,1.8h24.7c1,0,1.8-0.8,1.8-1.8v-25.1c0-1-0.8-1.9-1.8-1.9L283.7,259.7z					"></path>				<path id="Shape_6_" d="M402.6,299.5H378c-7.2,0-13-5.9-13-13.1v-25.1c-0.1-3.5,1.3-6.9,3.7-9.4					c2.4-2.5,5.8-3.9,9.3-3.9h24.6c7.2,0,13,5.9,13,13.1v24.8c0.1,3.6-1.2,7-3.6,9.6C409.5,298,406.1,299.5,402.6,299.5z					 M377.9,259.7c-1,0-1.9,0.9-1.9,1.9v24.8c0,1,0.9,1.8,1.9,1.8h24.6c1,0,1.9-0.8,1.9-1.8v-25.1c0-1.1-0.9-1.9-1.9-1.9					L377.9,259.7z"></path>				<path id="Shape_7_" d="M423.5,318.3h-66.3c-3,0-5.9-1.2-8-3.4c-2.1-2.2-3.3-5.1-3.2-8.1v-17.7h-5.6v17.7					c0,3-1.2,5.9-3.3,8c-2.1,2.1-4.9,3.3-7.9,3.3H263c-6.2,0-11.1-5.1-11.2-11.3v-17.5h-5.9v17.5c0,6.2-5,11.2-11.2,11.3h-66.3					c-6.1-0.1-11.1-5.1-11.1-11.3v-66.3c0-6.2,5-11.2,11.2-11.3h66.3c6.1,0.1,11.1,5.1,11.1,11.3v22.1h5.9v-22.1					c0-6.2,5-11.2,11.2-11.3h66.3c3,0,5.8,1.2,7.9,3.3s3.3,5,3.3,8v22.1h5.6v-22.1c0-6.2,5-11.2,11.2-11.3h66.3					c3-0.1,5.9,1.1,8.1,3.2c2.2,2.1,3.4,5,3.4,8.1v66.3c0.1,3.1-1.1,6-3.3,8.2C429.5,317.2,426.6,318.4,423.5,318.3z M357.3,278.2					v28.6h66.3v-66.3h-66.3v33.3h-27.9v-33.3H263v33.3h-28.2v-33.3h-66.3v66.3h66.3v-28.6H263v29.4h66.3v-29.4H357.3z"></path>			</g>		</g>	</g></g></svg>`;
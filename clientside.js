var DashboardPowerups = (function () {
    const TITLE_SELECTOR = '[uitestid="gwt-debug-title"]';
    const VAL_SELECTOR = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"] > span:first-of-type, [uitestid="gwt-debug-kpiValue"] > span:first-of-type';
    const TILE_SELECTOR = '.grid-tile';
    const LEGEND_SELECTOR = '[uitestid="gwt-debug-legend"]';
    const SVG_SELECTOR = '[uitestid="gwt-debug-MARKDOWN"] > div:first-child > div:first-child';
    const BIGNUM_SELECTOR = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"] span, [uitestid="gwt-debug-kpiValue"] span';
    const TREND_SELECTOR = '[uitestid="gwt-debug-trendLabel"]';
    const COLORHACK = '!colorhack:';
    const SVGHACK = '!svghack:';
    const LINKER = '!link=';
    const MARKERS = [COLORHACK, SVGHACK, LINKER];
    const SERIES_OPTS = {
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

    };
    const TOOLTIP_OPTS = {
        enabled: true,
        animation: false,
        outside: true,
        useHTML: false,
        hideDelay: 100,
        shared: true,
        formatter: function () {
            return this.points.reduce(function (s, point) {
                let n = point.series.name;
                let i = n.indexOf('¦') || "APPLICATION-0000000000000000".length;
                let sn = n.substring(0, i) || "";

                let $container = $(point.series.chart.container);
                let color = point.series.color;
                let $legend = $container.parents(TILE_SELECTOR).find(LEGEND_SELECTOR);
                if ($legend.length) {
                    let series_index = point.series.index;
                    //let series_name = $legend.children(`.gwt-HTML:nth-child(${series_index + 1})`).text();
                    let series_name = $legend.find(`svg[fill='${color}']`).parents(".gwt-HTML").text();
                    if (series_name.length) sn = series_name;
                }

                return s + '<br/><span style=\"color:' + point.color + '\">●</span>' + sn + ': ' +
                    Math.round(point.y, 1) + '';
            }, '<b>' + Highcharts.dateFormat("%H:%M", this.x) + '</b>');
        },
    };
    const AXIS_OPTS = {
        crosshair: {
            color: '#cccccc',
            width: '1px'
        }
    };
    var hackHighchartsMutex = false;

    //Private methods
    const debounce = (func, wait) => {
        let timeout;

        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const debounceMutex = (fn, time) => {
        let timeout;
        let mutex = false;

        return function () {
            const functionCall = () => {
                mutex = true;
                let p = fn.apply(this, arguments);
                $.when(p).done(() => { mutex = false; })
            }

            clearTimeout(timeout);
            if (!mutex)
                timeout = setTimeout(functionCall, time);
        }
    }



    //Public methods
    var pub = {};

    pub.POWERUP_EXT_URL = "";

    pub.hackHighcharts = function () {
        //be sure not to leak off dashboards
        if (window.location.hash.startsWith("#dashboard;") ||
            window.location.hash.startsWith("#dashboard/dashboard;")) {
            console.log("Powerup: hacking Highcharts...");
            //if(hackHighchartsMutex){
            //    console.log("Powerup: hacking Highcharts mutex blocked");
            //    return false;
            //}
            // hackHighchartsMutex = true;
            let hackedCount = 0;
            let promises = [];
            let mainPromise = new $.Deferred();
            Highcharts.charts.slice().forEach(chart => {
                if (typeof (chart) !== "undefined" &&
                    !chart.powerupHacked &&
                    typeof (chart.container) != "undefined") {
                    let p = new $.Deferred();
                    promises.push(p);
                    setTimeout(function () {
                        if (pub.hackHighchart(chart))
                            hackedCount++;
                        p.resolve();
                    }, 100); //still hitting synchronicity issues, try waiting
                }
            });
            $.when.apply($, promises).then(function () {
                $(".highcharts-container").css("z-index", 999);
                console.log("Powerup: " + hackedCount + " Highcharts hacked.");
                //other dashboard hacking here
                pub.colorPowerUp();
                pub.updateSVGPowerUp();
                pub.cleanMarkup();
                //hackHighchartsMutex = false;
                mainPromise.resolve(true);
            });
            return mainPromise;
        } else {
            console.log("Powerup: no longer on a dashboard, removing hackHighcharts listener...");
            Highcharts.removeEvent(Highcharts.Chart, 'load', pub.hackHighcharts);
            return false;
        }
    }

    pub.hackHighchart = function (chart) {
        if (typeof (chart) !== "undefined" &&
            !chart.powerupHacked &&
            typeof (chart.container) != "undefined") {
            chart.series.forEach(series => {
                series.update(SERIES_OPTS, false);
            });
            chart.update({ tooltip: TOOLTIP_OPTS }, false);
            chart.update({ xAxis: AXIS_OPTS }, false);
            chart.update({ yAxis: AXIS_OPTS }, false);


            chart.redraw(false);
            //chart.powerupHacked = true;  //Don't know why this doesn't work

            return true;
        } else {
            return false;
        }
    }

    pub.addHackHighchartsListener = function () {
        console.log("Powerup: added hackHighcharts listener");
        Highcharts.addEvent(Highcharts.Chart, 'load', debounceMutex(pub.hackHighcharts,200));
        Highcharts.addEvent(Highcharts.Chart, 'redraw', debounceMutex(pub.hackHighcharts,200));
        pub.hackHighcharts();

        /*
            custom charts are destroyed and loaded on new data, fires load event
            usql charts are redrawn on new data, fires redraw event

            listen for either event and begin hacking
            we will get several of these events, so need to debounce
                start a timer
                throw aways all but last event until timer expires

            at the end of hacking, we must redraw the chart(s) ourselves, which again fires redraw
                handle by using a crude mutex
                if mutex == true, we're already hacking, abort
                else set mutex=true and hack away
                when done set mutex=false

        */
    }

    pub.highlightPointsInOtherCharts = function (e) {
        const container = e.currentTarget;
        const charts = Highcharts.charts.filter(x => typeof (x) != "undefined");
        const chartIndex = charts.findIndex(chart => chart.container === container);

        if (chartIndex > -1) {
            const chart = charts[chartIndex];

            const event = chart.pointer.normalize(e.originalEvent); // Find coordinates within the chart
            const point = chart.series[0].searchPoint(event, true); // Get the hovered point
            //const point = chart.pointer.findNearestKDPoint(
            //    chart.series, true, e
            //)

            if (point) {
                const x = point.x;

                for (let i = 0; i < charts.length; i++) {
                    if (i != chartIndex) {
                        for (let s = 0; s < charts[i].series.length; s++) {
                            const points = charts[i].series[s].points;
                            for (let p = 0; p < points.length; p++) {
                                if (points[p].x === x) {
                                    //points[p].onMouseOver();
                                    points[p].series.xAxis.drawCrosshair(undefined, points[p]);
                                    points[p].series.yAxis.drawCrosshair(undefined, points[p]);
                                    break;
                                }
                            }
                        }

                    } else {
                        //point.series.xAxis.drawCrosshair(undefined,point);
                        //point.series.yAxis.drawCrosshair(undefined,point);
                        try {
                            //point.series.chart.tooltip.refresh(point,undefined); 
                        } catch (err) {
                            //Cannot read property 'category' of undefined
                            //no idea why or how to stop it, let's just throw it away for now...
                            //console.log(err.message);
                            //console.log(point);
                        }

                    }
                }
            }
        }
    }

    pub.removeHighlightPointsInOtherCharts = function (e) {
        const charts = Highcharts.charts.filter(x => typeof (x) != "undefined");
        for (let i = 0; i < charts.length; i++) {
            charts[i].xAxis[0].hideCrosshair();
        }
    }

    pub.loadChartSync = function () {
        $('[uitestid="gwt-debug-dashboardGrid"]').on("mouseover", ".highcharts-container", debounce(pub.highlightPointsInOtherCharts, 50));
        $('[uitestid="gwt-debug-dashboardGrid"]').on("mouseout", ".highcharts-container", pub.removeHighlightPointsInOtherCharts);
    }

    pub.cleanMarkup = function () {
        $(TITLE_SELECTOR).each((i, el) => {
            let $title = $(el);
            let title = $title.text();
            let idx = title.length;

            idx = MARKERS.reduce((acc, marker) =>
                (title.includes(marker) ?
                    Math.min(title.indexOf(marker), acc) :
                    Math.min(acc, idx))
                , idx);

            let newTitle = title.substring(0, idx) +
                `<span class="powerup-markup">` +
                title.substring(idx) +
                `</span>`;

            if (idx < title.length)
                $title.html(newTitle);
        });
    }

    pub.colorPowerUp = function () {
        $(TITLE_SELECTOR).each((i, el) => {
            let $title = $(el);
            let $tile = $title.parents(".grid-tile");
            let $bignum = $tile.find(BIGNUM_SELECTOR);

            //Step1: change tile colors
            if ($title.text().includes(COLORHACK)) { //example !COLORHACK:base=high;warn=90;crit=70
                console.log("Powerup: color hack found");
                let titletokens = $title.text().split(COLORHACK);
                let argstring = titletokens[1];
                let args = argstring.split(";").map(x => x.split("="));
                if (args.length < 3) {
                    console.log("Powerup: invalid argstring: " + argstring);
                    return false;
                }
                let base = args.find(x => x[0] == "base")[1];
                let warn = Number(args.find(x => x[0] == "warn")[1]);
                let crit = Number(args.find(x => x[0] == "crit")[1]);
                let val = Number($tile.find(VAL_SELECTOR).text().replace(/,/g, ''));

                let $target = $bignum; //or $tile
                $target.removeClass("powerup-colorhack-critical powerup-colorhack-warning powerup-colorhack-normal");
                if (base == "low") {
                    if (val < warn) $target.addClass("powerup-colorhack-normal");
                    else if (val < crit) $target.addClass("powerup-colorhack-warning");
                    else $target.addClass("powerup-colorhack-critical");
                } else if (base == "high") {
                    if (val > warn) $target.addClass("powerup-colorhack-normal");
                    else if (val > crit) $target.addClass("powerup-colorhack-warning");
                    else $target.addClass("powerup-colorhack-critical");
                }

                let $trend = $tile.find(TREND_SELECTOR);
                if($trend.length){
                    let trend = Number($trend.text().replace(/%/,''));
                    $trend.removeClass("powerup-colorhack-critical powerup-colorhack-warning powerup-colorhack-normal");
                    if(base == "low"){
                        if(trend>0) $trend.addClass("powerup-colorhack-warning");
                        else if(trend<0) $trend.addClass("powerup-colorhack-normal");
                    } else if(base == "high"){
                        if(trend<0) $trend.addClass("powerup-colorhack-warning");
                        else if(trend>0) $trend.addClass("powerup-colorhack-normal");
                    }
                }
            }
        });
    }

    pub.svgPowerUp = function () {
        $(SVG_SELECTOR).each((i, el) => {
            let $svgcontainer = $(el);
            let $tile = $svgcontainer.parents(".grid-tile");

            if ($svgcontainer.text().includes(SVGHACK)) { //example !SVGHACK:icon=host;link=val1;base=high;warn=90;crit=70 other tile has !link=val1
                console.log("Powerup: svg hack found");
                let argstring = $svgcontainer.text().split(SVGHACK)[1];

                let args = argstring.split(";").map(x => x.split("="));
                let icon = args.find(x => x[0] == "icon")[1];
                let link = args.find(x => x[0] == "link")[1];
                let base = args.find(x => x[0] == "base")[1];
                let warn = Number(args.find(x => x[0] == "warn")[1]);
                let crit = Number(args.find(x => x[0] == "crit")[1]);
                let argObj = {
                    icon: icon,
                    link: link,
                    base: base,
                    warn: warn,
                    crit: crit
                }
                let val = pub.findLinkedVal(link);

                //swap in the svg
                var imgURL = pub.POWERUP_EXT_URL + encodeURI(`3rdParty/node_modules/@dynatrace/barista-icons/${icon}.svg`);
                fetch(imgURL)
                    .then((response) => response.text())
                    .then((svgtext) => {
                        $svgcontainer.empty();
                        let $svg = $(svgtext)
                            .attr("data-args", JSON.stringify(argObj))
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

    pub.updateSVGPowerUp = function () {
        $(SVG_SELECTOR).each((i, el) => {
            let $svgcontainer = $(el);
            let $tile = $svgcontainer.parents(".grid-tile");
            let $svg = $svgcontainer.find("svg:first-of-type");

            if ($svg.length) {
                let args = $svg.attr("data-args") || "{}";
                args = JSON.parse(args);

                let val = pub.findLinkedVal(args.link);

                $svg.removeClass("powerup-svghack-critical powerup-svghack-warning powerup-svghack-normal");
                if (args.base == "low") {
                    if (val < args.warn) $svg.addClass("powerup-svghack-normal");
                    else if (val < args.crit) $svg.addClass("powerup-svghack-warning");
                    else $svg.addClass("powerup-svghack-critical");
                } else if (args.base == "high") {
                    if (val > args.warn) $svg.addClass("powerup-svghack-normal");
                    else if (val > args.crit) $svg.addClass("powerup-svghack-warning");
                    else $svg.addClass("powerup-svghack-critical");
                }
            }
        });
    }

    pub.findLinkedVal = function (link) {
        //find val
        let link_text = LINKER + link;
        $(TITLE_SELECTOR).each((i_link, el_link) => {
            let $linktitle = $(el_link);

            if ($linktitle.text().includes(link_text)) {
                let $linktile = $linktitle.parents(".grid-tile");
                val = Number($linktile.find(VAL_SELECTOR).text());
            }
        });
        if (typeof val == "undefined") {
            console.log("Powerup: unable to match link: " + link_text);
            return undefined;
        } else {
            return val;
        }
    }

    pub.addToolTips = function () {
        if (typeof (pub.addHackHighchartsListener) == "undefined") {
            console.log("Powerup: clientside.js not loaded yet");
            setTimeout(pub.initHackHighcharts, 200);
        } else {
            pub.addHackHighchartsListener();
            pub.loadChartSync();
        }
    }


    return pub;
})();
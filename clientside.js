var DashboardPowerups = (function () {
    const TITLE_SELECTOR = '[uitestid="gwt-debug-title"]';
    const VAL_SELECTOR = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"] > span:first-of-type, [uitestid="gwt-debug-kpiValue"] > span:first-of-type';
    const TILE_SELECTOR = '.grid-tile';
    const LEGEND_SELECTOR = '[uitestid="gwt-debug-legend"]';
    const SVG_SELECTOR = '[uitestid="gwt-debug-MARKDOWN"] > div:first-child > div:first-child';
    const BIGNUM_SELECTOR = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"] span, [uitestid="gwt-debug-kpiValue"] span';
    const TREND_SELECTOR = '[uitestid="gwt-debug-trendLabel"]';
    const MAP_SELECTOR = '[uitestid="gwt-debug-map"]';
    const MAPTITLE_SELECTOR = 'span[uitestid="gwt-debug-WorldMapTile"]';
    const TABLE_SELECTOR = '[uitestid="gwt-debug-tablePanel"] > div > div';
    const BANNER_SELECTOR = '[uitestid="gwt-debug-dashboardNameLabel"]';
    const TAG_SELECTOR = '[uitestid="gwt-debug-showMoreTags"] ~ [title]';
    const PU_COLOR = '!PU(color):';
    const PU_SVG = '!PU(svg):';
    const PU_MAP = '!PU(map):';
    const PU_LINK = '!PU(link):';
    const PU_BANNER = '!PU(banner):';
    const PU_LINE = '!PU(line):';
    const PU_USQLSTACK = '!PU(usqlstack):'; //TODO: add color schemes
    const PU_HEATMAP = '!PU(heatmap):'; //TBI

    const MARKERS = [PU_COLOR, PU_SVG, PU_LINK, PU_MAP, PU_BANNER, PU_LINE, PU_USQLSTACK, PU_HEATMAP];
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
        useHTML: true,
        hideDelay: 100,
        shared: true,
        formatter: function () {
            if (typeof (this.points) == "undefined") return;
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

                let y = Number(point.y);
                if (Number.isNaN(y)) y = point.y; //Isn't a number, keep what we had
                else y = y.toLocaleString(undefined, { maximumFractionDigits: 2 });

                let tip = s + //s gives the category for first series' point, blank otherwise
                    `<div class="powerupLineTooltip">
                    <div class="dot" style="color: ${point.color}; background:${contrast(color)}">● </div>
                    <div>${sn}:</div>
                    <div class="spacer"></div>
                    <div>${y}</div>
                </div>`;

                return tip;
            }, '<b>' + Highcharts.dateFormat("%H:%M", this.x) + '</b>');
        },
    };
    const AXIS_OPTS = {
        crosshair: {
            color: '#cccccc',
            width: '1px'
        }
    };
    const MO_CONFIG = { attributes: true, childList: true, subtree: true }; //MutexObserver
    var waits = 0;
    var observers = [];
    var targets = [];
    var dataTables = [];


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

    const debounceMutex = (fn, mutex, time) => {
        let timeout;

        return function () {
            const functionCall = () => {
                let p = fn.apply(this, arguments);
                //$.when(p).done(() => { mutex = false; })
            }

            clearTimeout(timeout); //new fn trigger came in, throw away old and start waiting again
            if (!mutex.blocking) {
                timeout = setTimeout(functionCall, time);
            } else {
                //already running, throw it away
            }
        }
    }

    const contrast = (color) => {
        let c = d3.rgb(color);
        let L = (0.2126 * c.r) / 255 + (0.7152 * c.g) / 255 + (0.0722 * c.b) / 255;
        if ((L + 0.05) / (0.0 + 0.05) > (1.0 + 0.05) / (L + 0.05))
            return "black";
        else
            return "white";
    }

    const PUwatchdog = () => {
        var timeout;
        var unpowered = pub.PUHighchartsStatus().filter(x => !x).length;
        //test for un-powereduped charts
        if (unpowered) {
            //if we we're not doing it, then do it
            if (!pub.PUHighchartsMutex.blocking) {
                if (pub.config.Powerups.debug)
                    console.log(`Powerup: WARN - Watchdog found ${unpowered} Highcharts w/o powerup. Kicking off powerup.`);
                pub.PUHighcharts();
            }

            if (pub.PUHighchartsMutex.blocking &&
                pub.PUHighchartsMutex.blocked > 100) {
                console.log(`Powerup: ERROR - Watchdog saw Mutex blocked too long ${PUHighchartsMutex.blocked}. Reset.`)
                pub.PUHighchartsMutex.blocking = false;
                pub.PUHighchartsMutex.blocked = 0;
                pub.PUHighcharts();
            }
        }
        clearTimeout(timeout);
        timeout = setTimeout(PUwatchdog, 5000); //run every 5s
    }

    const clearPowerup = (e) => {
        if (!pub.PUHighchartsMutex.blocked) {
            let chart = e.target;
            chart.poweredup = false;
        }
    }



    //Public methods
    var pub = {};

    pub.POWERUP_EXT_URL = "";
    pub.config = {};
    pub.PUHighchartsMutex = { blocking: false, blocked: 0 }; //must be obj to ensure passby ref
    pub.PUHighchartsStatus = () => { return Highcharts.charts.filter(x => typeof (x) !== "undefined").map(x => x.poweredup); }

    pub.PUHighcharts = function () {
        //be sure not to leak off dashboards
        if (window.location.hash.startsWith("#dashboard;") ||
            window.location.hash.startsWith("#dashboard/dashboard;")) {
            if (pub.PUHighchartsMutex.blocking) {
                pub.PUHighchartsMutex.blocked++;
                if (pub.PUHighchartsMutex.blocked % 100 == 0) {
                    console.log("Powerup: WARN - PUHighcharts mutex blocked, skipped " + pub.PUHighchartsMutex.blocked);
                }
                return false;
            } else {
                pub.PUHighchartsMutex.blocking = true;
            }
            if (pub.config.Powerups.debug) console.log("Powerup: powering-up Highcharts...");
            let PUcount = 0;
            let promises = [];
            let mainPromise = new $.Deferred();
            Highcharts.charts.forEach(chart => {
                if (typeof (chart) !== "undefined" &&
                    !chart.poweredup &&
                    typeof (chart.container) != "undefined") {
                    let p = new $.Deferred();
                    promises.push(p);
                    setTimeout(function () {
                        let pu = false;
                        if (pub.PUHighchart(chart))
                            PUcount++;
                        p.resolve();
                    }, 100); //still hitting synchronicity issues, try waiting
                }
            });
            $.when.apply($, promises).then(function () {
                $(".highcharts-container").css("z-index", 999);
                if (pub.config.Powerups.debug) console.log("Powerup: " + PUcount + " Highcharts powered-up.");
                //other dashboard powering-up here
                pub.fireAllPowerUps(true);
                mainPromise.resolve(true);
                setTimeout(() => {
                    pub.PUHighchartsMutex.blocking = false;
                    pub.PUHighchartsMutex.blocked = 0;
                }, 10000); //Don't do it again for at least 10s
            });
            return mainPromise;
        } else {
            if (pub.config.Powerups.debug) console.log("Powerup: no longer on a dashboard, removing PUHighcharts listener...");
            Highcharts.removeEvent(Highcharts.Chart, 'load', pub.PUHighcharts);
            return false;
        }
    }

    pub.PUHighchart = function (chart) {
        if (pub.config.Powerups.tooltipPU &&
            typeof (chart) !== "undefined" &&
            !chart.poweredup &&
            typeof (chart.container) != "undefined") {
            chart.series.forEach(series => {
                series.update(SERIES_OPTS, false);
            });
            chart.update({ tooltip: TOOLTIP_OPTS }, false);
            chart.update({ xAxis: AXIS_OPTS }, false);
            chart.update({ yAxis: AXIS_OPTS }, false);

            let $container = $(chart.container);
            let $tile = $container.parents(TILE_SELECTOR);
            let $title = $tile.find(TITLE_SELECTOR);
            let title = $title.text();
            if (title.includes(PU_LINE)) pub.PULine(chart, title);
            if (title.includes(PU_USQLSTACK)) setTimeout(() => {
                pub.PUUsqlStack(chart, title);
            }, 100);
            if (title.includes(PU_HEATMAP)) setTimeout(() => {
                if($(chart.container).is(":visible"))
                    pub.PUHeatmap(chart, title);
            }, 100);

            chart.redraw(false);

            chart.poweredup = true;
            return true;
        } else {
            return false;
        }
    }

    pub.PULine = function (chart, title) { //example: !PU(line):thld=4000;hcol=green;lcol=red
        if (!pub.config.Powerups.linePU) return;
        let titletokens = title.split(PU_LINE);
        let argstring = titletokens[1];
        let args = argstring.split(";").map(x => x.split("="));
        if (args.length < 3) {
            if (pub.config.Powerups.debug)
                console.log("Powerup: ERROR - invalid argstring: " + argstring);
            return false;
        }
        let thld = args.find(x => x[0] == "thld")[1];
        let hcol = args.find(x => x[0] == "hcol")[1];
        let lcol = args.find(x => x[0] == "lcol")[1];

        let series_opts = {
            threshold: thld,
            negativeColor: lcol,
            color: hcol
        }

        chart.series[0].update(series_opts);
        chart.yAxis[0].addPlotLine({
            value: thld,
            color: 'yellow',
            width: 1
        });
    }

    pub.PUUsqlStack = function (chart, title) { //example: !PU(usqlstack):color:green
        if (!pub.config.Powerups.usqlstackPU) return;
        let titletokens = title.split(PU_USQLSTACK);
        let argstring = titletokens[1];
        let args = argstring.split(";").map(x => x.split("="));
        if (args.length < 1) {
            if (pub.config.Powerups.debug)
                console.log("Powerup: ERROR - invalid argstring: " + argstring);
            return false;
        }
        let color = args.find(x => x[0] == "color")[1];

        //get data
        console.log(chart.series[0].data);
        if (chart.series.length != 1) return false; //if more than 1 series, this doesn't make sense; quit
        if (!chart.series[0].data.length) return false; //no data, quit
        if (!chart.series[0].data[0].name.includes(',')) return false; //if there's no splitting, quit
        let splittings = [];
        let newSeries = [];
        let newCategories = [];

        chart.series[0].data.forEach((d) => {
            let nameArr = d.name.split(',');
            let newName = nameArr[0];
            let split = nameArr[1].trim();
            let i = splittings.findIndex((x) => x == split);
            if (i < 0) {
                splittings.push(split);
                let newSerie = {
                    name: chart.series[0].name + `(${split})`,
                    type: 'bar',
                    stacking: 'normal',
                    data: [
                        {
                            name: newName,
                            x: 0,
                            y: d.y
                        }
                    ]
                }
                newSeries.push(newSerie);
            } else {
                newSeries[i].data.push({
                    name: newName,
                    x: newSeries[i].data.length,
                    y: d.y
                });
            }
            if (newCategories.findIndex(x => x == newName) < 0)
                newCategories.push(newName);
        });

        newSeries.forEach((ns) => {
            chart.addSeries(ns, false, false);
        });
        //chart.series[0].hide();
        chart.series[0].remove(false, false);
        chart.axes[0].setCategories(newCategories, false);

        chart.redraw(false);
    }

    pub.addPUHighchartsListener = function () {
        if (pub.config.Powerups.debug) console.log("Powerup: added PUHighcharts listener");
        Highcharts.addEvent(Highcharts.Chart, 'load', debounceMutex(pub.PUHighcharts, pub.PUHighchartsMutex, 200));
        Highcharts.addEvent(Highcharts.Chart, 'redraw', debounceMutex(pub.PUHighcharts, pub.PUHighchartsMutex, 200));
        Highcharts.addEvent(Highcharts.Chart, 'redraw', clearPowerup);
        pub.PUHighcharts();
        PUwatchdog();

        /*
            custom charts are destroyed and loaded on new data, fires load event
            usql charts are redrawn on new data, fires redraw event

            listen for either event and begin powering-up
            we will get several of these events, so need to debounce
                start a timer
                throw away all but last event until timer expires

            at the end of powering-up, we must redraw the chart(s) ourselves, which again fires redraw
                handle by using a crude mutex
                if mutex == true, we're already powering-up, abort
                else set mutex=true and power-up
                when done set mutex=false

        */
    }

    pub.highlightPointsInOtherCharts = function (e) {
        if (!pub.config.Powerups.tooltipPU) return;

        const container = e.currentTarget;
        const charts = Highcharts.charts.filter(x => typeof (x) != "undefined");
        const chartIndex = charts.findIndex(chart => chart.container === container);

        if (chartIndex > -1) {
            const chart = charts[chartIndex];

            const event = chart.pointer.normalize(e.originalEvent); // Find coordinates within the chart
            var point;
            chart.series.forEach((s, i) => { // Get the hovered point
                if (!point)
                    point = s.searchPoint(event, true);
            });

            if (point && point.series && point.series.xAxis && point.series.yAxis) { //prevent errors if something doesn't exist
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

                    } else { //no need to anything on current chart

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

    pub.bannerPowerUp = function () {
        if (!pub.config.Powerups.bannerPU) return;
        $(TAG_SELECTOR).each((i, el) => {
            let $tag = $(el);
            let title = $tag.attr("title");

            if (title.includes(PU_BANNER)) {
                let titletokens = title.split(PU_BANNER);
                let argstring = titletokens[1];
                let args = argstring.split(";").map(x => x.split("="));
                let color = args.find(x => x[0] == "color")[1];

                $(BANNER_SELECTOR).css("background", color);
                $(BANNER_SELECTOR).css("color", contrast(color));
            }
        });
    }

    pub.colorPowerUp = function () {
        if (!pub.config.Powerups.colorPU) return;
        let class_norm = `powerup-color-normal`;
        let class_warn = `powerup-color-warning`;
        switch (pub.config.Powerups.animateWarning) {
            case "3 Pulses":
                class_warn += "-blink threeBlink";
                break;
            case "Always":
                class_warn += "-blink";
                break;
            case "Never":
            default:
        }
        let class_crit = `powerup-color-critical`;
        switch (pub.config.Powerups.animateCritical) {
            case "Always":
                class_crit += "-blink";
                break;
            case "Never":
                break;
            case "3 Pulses":
            default:
                class_crit += "-blink threeBlink";
        }


        $(TITLE_SELECTOR).each((i, el) => {
            let $title = $(el);
            let $tile = $title.parents(".grid-tile");
            let $bignum = $tile.find(BIGNUM_SELECTOR);

            //Step1: change tile colors
            if ($title.text().includes(PU_COLOR)) { //example !PU(color):base=high;warn=90;crit=70
                if (pub.config.Powerups.debug) console.log("Powerup: color power-up found");
                let titletokens = $title.text().split(PU_COLOR);
                let argstring = titletokens[1];
                let args = argstring.split(";").map(x => x.split("="));
                if (args.length < 3) {
                    console.log("Powerup: ERROR - invalid argstring: " + argstring);
                    return false;
                }
                let base = args.find(x => x[0] == "base")[1];
                let warn = Number(args.find(x => x[0] == "warn")[1]);
                let crit = Number(args.find(x => x[0] == "crit")[1]);
                let val = Number($tile.find(VAL_SELECTOR).text().replace(/,/g, ''));

                let $target = (pub.config.Powerups.colorPUTarget == "Border" ? $tile : $bignum);
                $target.removeClass("powerup-color-critical powerup-color-warning powerup-color-normal");
                $target.removeClass("powerup-color-critical-blink powerup-color-warning-blink threeBlink");
                if (base == "low") {
                    if (val < warn) $target.addClass(class_norm);
                    else if (val < crit) $target.addClass(class_warn);
                    else $target.addClass(class_crit);
                } else if (base == "high") {
                    if (val > warn) $target.addClass(class_norm);
                    else if (val > crit) $target.addClass(class_warn);
                    else $target.addClass(class_crit);
                }

                let $trend = $tile.find(TREND_SELECTOR);
                if ($trend.length) {
                    let trend = Number($trend.text().replace(/%/, ''));
                    $trend.removeClass("powerup-color-critical powerup-color-warning powerup-color-normal");
                    if (base == "low") {
                        if (trend > 0) $trend.addClass("powerup-color-warning");
                        else if (trend < 0) $trend.addClass("powerup-color-normal");
                    } else if (base == "high") {
                        if (trend < 0) $trend.addClass("powerup-color-warning");
                        else if (trend > 0) $trend.addClass("powerup-color-normal");
                    }
                }
            }
        });
    }

    pub.svgPowerUp = function () {
        if (!pub.config.Powerups.svgPU) return;
        let class_norm = `powerup-svg-normal`;
        let class_warn = `powerup-svg-warning`;
        switch (pub.config.Powerups.animateWarning) {
            case "3 Pulses":
                class_warn += "-blink threeBlink";
                break;
            case "Always":
                class_warn += "-blink";
                break;
            case "Never":
            default:
        }
        let class_crit = `powerup-svg-critical`;
        switch (pub.config.Powerups.animateCritical) {
            case "Always":
                class_crit += "-blink";
                break;
            case "Never":
                break;
            case "3 Pulses":
            default:
                class_crit += "-blink threeBlink";
        }

        $(SVG_SELECTOR).each((i, el) => {
            let $svgcontainer = $(el);
            let $tile = $svgcontainer.parents(".grid-tile");

            if ($svgcontainer.text().includes(PU_SVG)) {
                if (pub.config.Powerups.debug) console.log("Powerup: svg power-up found");
                let argstring = $svgcontainer.text().split(PU_SVG)[1];

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

                        $svg.removeClass("powerup-svg-critical powerup-svg-warning powerup-svg-normal");
                        $svg.removeClass("powerup-svg-critical-blink powerup-svg-warning-blink threeBlink");
                        if (base == "low") {
                            if (val < warn) $svg.addClass(class_norm);
                            else if (val < crit) $svg.addClass(class_warn);
                            else $svg.addClass(class_crit);
                        } else if (base == "high") {
                            if (val > warn) $svg.addClass(class_norm);
                            else if (val > crit) $svg.addClass(class_warn);
                            else $svg.addClass(class_crit);
                        }
                    });
            }
        });
    }

    pub.updateSVGPowerUp = function () {
        if (!pub.config.Powerups.svgPU) return;
        let class_norm = `powerup-svg-normal`;
        let class_warn = `powerup-svg-warning`;
        switch (pub.config.Powerups.animateWarning) {
            case "3 Pulses":
                class_warn += "-blink threeBlink";
                break;
            case "Always":
                class_warn += "-blink";
                break;
            case "Never":
            default:
        }
        let class_crit = `powerup-svg-critical`;
        switch (pub.config.Powerups.animateCritical) {
            case "Always":
                class_crit += "-blink";
                break;
            case "Never":
                break;
            case "3 Pulses":
            default:
                class_crit += "-blink threeBlink";
        }

        $(SVG_SELECTOR).each((i, el) => {
            let $svgcontainer = $(el);
            let $tile = $svgcontainer.parents(".grid-tile");
            let $svg = $svgcontainer.find("svg:first-of-type");

            if ($svg.length) {
                let args = $svg.attr("data-args") || "{}";
                args = JSON.parse(args);

                let val = pub.findLinkedVal(args.link);

                $svg.removeClass("powerup-svg-critical powerup-svg-warning powerup-svg-normal");
                $svg.removeClass("powerup-svg-critical-blink powerup-svg-warning-blink threeBlink");
                if (args.base == "low") {
                    if (val < args.warn) $svg.addClass(class_norm);
                    else if (val < args.crit) $svg.addClass(class_warn);
                    else $svg.addClass(class_crit);
                } else if (args.base == "high") {
                    if (val > args.warn) $svg.addClass(class_norm);
                    else if (val > args.crit) $svg.addClass(class_warn);
                    else $svg.addClass(class_crit);
                }
            }
        });
    }

    pub.findLinkedVal = function (link) {
        //find val
        let link_text = PU_LINK + link;
        $(TITLE_SELECTOR).each((i_link, el_link) => {
            let $linktitle = $(el_link);

            if ($linktitle.text().includes(link_text)) {
                let $linktile = $linktitle.parents(".grid-tile");
                val = Number($linktile.find(VAL_SELECTOR).text());
            }
        });
        if (typeof val == "undefined") {
            console.log("Powerup: ERROR - unable to match link: " + link_text);
            return undefined;
        } else {
            return val;
        }
    }

    pub.addToolTips = function () {
        if (typeof (pub.addPUHighchartsListener) == "undefined") {
            waits++;
            if (waits % 10 == 0)
                console.log(`Powerup: WARN - clientside.js not loaded yet after ${waits / 5}s`);
            setTimeout(pub.addToolTips, 200);
        } else {
            pub.addPUHighchartsListener();
            pub.loadChartSync();
        }
    }

    pub.mapPowerUp = function () {
        if (!pub.config.Powerups.worldmapPU) return;


        const callback = function (mutationsList, observer) {
            observer.disconnect(); //stop listening while we make some changes
            setTimeout(() => {
                transformMap(mutationsList, observer);
            }, 50); //Sleep a bit in case there was a lot of mutations

        }

        //Read data from table
        function readTableData(tabletile) {
            let $tabletile = $(tabletile);
            let dataTable = [];
            let normalTable = [];
            let keys = [];
            $tabletile
                .find(TABLE_SELECTOR)
                .each(function (i, el) {
                    let $el = $(el);
                    $el.find('span').each(function (j, el2) {
                        if (typeof (dataTable[i]) == "undefined") dataTable[i] = [];
                        dataTable[i][j] = $(el2).text();
                    });
                });

            let numKeys = dataTable.length;
            let numRows = dataTable[0].length;
            for (let i = 0; i < numKeys; i++) {
                keys.push(dataTable[i].shift());
            }

            for (let i = 0; i < numRows; i++) {
                let obj = {};
                for (let j = 0; j < numKeys; j++) {
                    let key = keys[j];
                    if (j == numKeys - 1 && dataTable[j][i] != null) //Last column should be a number
                        obj[key] = Number(dataTable[j][i].replace(/,/g, ''));
                    else
                        obj[key] = dataTable[j][i] || 0;
                }
                normalTable.push(obj);
            }
            return ({ keys: keys, normalTable: normalTable })
        }

        transformMap = function (mutationsList, observer) {
            if (!pub.config.Powerups.worldmapPU) return;
            let i = observers.findIndex((o) => observer === o);
            let target = targets[i];
            let $target = $(target);
            let d3Target = d3.select(target);
            let $container = $target.parents(MAP_SELECTOR);
            let $tile = $target.parents(TILE_SELECTOR);
            let width = d3Target.attr("width");
            let height = d3Target.attr("height");
            let keys = dataTables[i].keys;
            let valKey = keys[keys.length - 1];
            let normalTable = dataTables[i].normalTable;
            let color = dataTables[i].color;
            let link = dataTables[i].link;
            let newTitle = dataTables[i].newTitle;
            let max = Math.max(1, normalTable.reduce((acc, row) => Math.max(row[valKey], acc), 0));
            let min = Math.max(1, normalTable.reduce((acc, row) => Math.min(row[valKey], acc), 0));
            let scale = d3.scaleLog().domain([min, max]);

            const zoom = d3.zoom()
                .scaleExtent([1, 8])
                .on("zoom", zoomed);
            d3Target.call(zoom);
            d3Target.selectAll("path").on("click", clicked);
            d3Target.selectAll("path").on("mouseover", hover);
            d3Target.on("click", reset);

            function zoomed() {
                observer.disconnect();
                const { transform } = d3.event;
                let g = d3Target.select("g[transform]");
                g.attr("transform", transform);
                g.attr("stroke-width", 1 / transform.k);
                //console.log("Powerup: map zoom");
                observer.observe(target, MO_CONFIG);  //done zooming, resume observations  
            }

            function clicked(d) {
                //let d3Path = d3.select(this);
                //const [[x0, y0], [x1, y1]] = d3Path.bounds(d);
                let bb = this.getBBox();

                d3.event.stopPropagation();
                d3Target.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                        .translate(width / 2, height / 2)
                        .scale(Math.min(8, 0.9 / Math.max((bb.width) / width, (bb.height) / height)))
                        .translate(-(bb.x + bb.width / 2), -(bb.y + bb.height / 2)),
                    d3.mouse(d3Target.node())
                );
            }

            function reset() {
                d3Target.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity,
                    d3.zoomTransform(d3Target.node()).invert([width / 2, height / 2])
                );
            }

            function hover() {
                if (!pub.config.Powerups.worldmapPU) return;
                let $tooltip = $tile.find(".powerupMapTooltip");
                let $path = $(this);
                let country = $path.attr("title");
                let code = $path.attr("id").split('-')[1];
                let key = keys[keys.length - 1];
                let countryData = normalTable.find(x => x.country == country);
                let val;
                if (typeof countryData !== "undefined" && typeof (countryData[key]) !== "undefined")
                    val = countryData[key].toLocaleString();
                else
                    val = "0";

                if ($tooltip.length) {
                    let flag = code.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
                    $tooltip.find(".geoText").text(`Country: ${country} (${flag})`);
                    $tooltip.find(".valueText").text(`${key}: ${val}`)
                }
            }

            //Prep the SVG
            $target.find(`path`).css("fill", ""); //remove existing coloring
            $container.css("z-index", 999); //bring to front to get hovers

            //Create tooltip
            if (!$tile.find(".powerupMapTooltip").length) {
                let $tooltip = $("<div>")
                    .addClass("powerupMapTooltip")
                    .appendTo($tile);
                let $geoText = $("<div>")
                    .addClass("geoText")
                    .text("Country: ")
                    .appendTo($tooltip);
                let $valueText = $("<div>")
                    .addClass("valueText")
                    .text("Value: ")
                    .appendTo($tooltip);
            }

            //Populate map
            $target.find("path").each(function (i, el) {
                let $el = $(el);
                let country = $el.attr("title");

                let data = normalTable.filter(x => x.country == country);

                $el.attr("data-data", JSON.stringify(data));
                let val = 0;
                if (data.length && data[0][valKey]) {
                    val = data[0][valKey];
                    let pathColor = d3.hsl(color);
                    pathColor.s = color.s * scale(val);
                    $el.css("fill", pathColor.toString());
                }
            });
            let $maptile = $target.parents(TILE_SELECTOR);
            let $maptitle = $maptile.find(MAPTITLE_SELECTOR);
            let maptitle = `World Map (${newTitle})`;
            $maptitle.text(maptitle);

            if (pub.config.Powerups.debug) console.log("Powerup: map powered-up");
            observer.observe(target, MO_CONFIG); //done w/ initial power-up, resume observations
        }

        $(TITLE_SELECTOR).each((i, el) => {
            let $tabletitle = $(el);
            let $tabletile = $tabletitle.parents(TILE_SELECTOR);

            if ($tabletitle.text().includes(PU_MAP)) {
                let titletokens = $tabletitle.text().split(PU_MAP);
                let argstring = titletokens[1];
                let args = argstring.split(";").map(x => x.split("="));
                let color = args.find(x => x[0] == "color")[1] || "green";
                color = d3.hsl(color);
                let link = args.find(x => x[0] == "link")[1];

                // Start observing the target node for configured mutations
                $(MAP_SELECTOR).find(`svg`).each(function (i, map) {
                    let $maptile = $(map).parents(TILE_SELECTOR);
                    let $maptitle = $maptile.find(MAPTITLE_SELECTOR);
                    let maptitle = $maptitle.text();
                    if (maptitle.includes(link) || link == null) {
                        let idx = targets.findIndex(x => x == map);
                        if (idx > -1) {
                            //replace the dataTable
                            let dataTable = readTableData($tabletile);
                            dataTable.color = color;
                            dataTable.link = link;
                            dataTable.newTitle = titletokens[0].trim();
                            dataTables.splice(idx, 1, dataTable);

                            const observer = observers[idx];
                            callback(undefined, observer);
                        } else {
                            //insert the dataTable
                            let dataTable = readTableData($tabletile);
                            dataTable.color = color;
                            dataTable.link = link;
                            dataTable.newTitle = titletokens[0].trim();
                            dataTables.push(dataTable);

                            const observer = new MutationObserver(callback);
                            observer.observe(el, MO_CONFIG);
                            observers.push(observer);
                            targets.push(map);
                            callback(undefined, observer);
                        }
                    }
                });


            }
        });




    };

    pub.PUHeatmap = function (chart, title) { //example: !PU(heatmap):
        //return;
        if (!pub.config.Powerups.heatmapPU) return;
        if (chart.series.length < 1 || chart.series[0].data.length < 1) return;
        /*let titletokens = title.split(PU_HEATMAP);
        let argstring = titletokens[1];
        let args = argstring.split(";").map(x => x.split("="));*/
        let oldContainer = chart.container;
        let $tile = $(oldContainer).parents(TILE_SELECTOR);
        let $newContainer = $("<div>")
            .attr("id", "heatmap")
            .insertAfter(oldContainer);
        let newContainer = $newContainer[0];
        let $legend = $tile.find(LEGEND_SELECTOR);

        let newData = [];
        let yNames = [];
        let categories = [];
        chart.series.forEach((s, sIdx) => {
            if (s.type != "column") {
                console.log("Powerup: ERROR - Please use a bar chart as a source for heatmap powerup.");
                return;
            }

            //come up with a better y category
            let series_name = s.name;
            if ($legend.length) {
                let name = $legend.find(`svg[fill='${s.color}']`).parents(".gwt-HTML").text();
                if (name.length) series_name = name;
            } 
            yNames.push(series_name);

            //map new X values
            s.data.forEach((d) => {
                const date = new Date(d.category);
                d.newCat = date.toLocaleDateString();
                d.newCatIdx = categories.findIndex(x => x === d.newCat);
                if (d.newCatIdx < 0) {
                    d.newCatIdx = categories.length;
                    categories.push(d.newCat);
                }
            });

            //aggregate
            categories.forEach((c, cIdx) => {
                let avg = s.data.filter((d) => d.newCatIdx === cIdx)
                    .reduce((total, d, idx, arr) => {
                        total += d.y;
                        if (idx === arr.length - 1) {
                            return total / arr.length;
                        } else {
                            return total;
                        }
                    }, 0);
                newData.push([cIdx, sIdx, avg]);
            });
        });
        //Highcharts expects data to be sorted
        newData = newData.sort((a, b) => {
            if (a[0] === b[0]) {
                return a[1] - b[1];
            } else {
                return a[0] - b[0];
            }
        });
        let newSeries = {
            type: 'heatmap',
            data: newData,
            dataLabels: {
                enabled: true,
                color: '#000000',
                format: '{point.value:.2f}'
            },

        }
        let newChartOpts = {
            type: 'heatmap',
            series: [newSeries],
            title: {
                text: 'Apdex Heatmap'
            },

            xAxis: {
                categories: categories,
                reversed: true
            },

            yAxis: {
                categories: yNames,
                title: null,
                reversed: true
            },
            tooltip: {
                enabled: true,
                formatter: function () {
                    return 'Date:<b>' + getPointCategoryName(this.point, 'x') + '</b><br>' +
                        'App:<b>' + getPointCategoryName(this.point, 'y') + '</b><br>' +
                        'Apdex:<b>' + this.point.value + '</b>';
                }
            },
            colorAxis: {
                dataClasses: [
                    { to: .5, name: "Unacceptable", color: "#dc172a" },
                    { from: .5, to: .7, name: "Poor", color: "#ef651f" },
                    { from: .7, to: .85, name: "Fair", color: "#ffe11c" },
                    { from: .85, to: .94, name: "Good", color: "#6bcb8b" },
                    { from: .94, name: "Excellent", color: "#2ab06f" },
                ]
            },
        }

        //$(oldContainer).css('z-index', -100);
        $(oldContainer).hide();
        $newContainer.html('');
        let newChart = Highcharts.chart(newContainer, newChartOpts);
        newChart.poweredup = true;
    }

    pub.fireAllPowerUps = function (update = false) {
        if (update) pub.PUHighcharts();
        else pub.addToolTips();
        pub.bannerPowerUp();
        pub.colorPowerUp();
        pub.updateSVGPowerUp();
        pub.svgPowerUp();
        pub.mapPowerUp();

        pub.cleanMarkup();
        if (pub.config.Powerups.debug)
            console.log("Powerup: DEBUG - fire all PowerUps" + (update ? " (update)" : ""));
    }

    return pub;
})();
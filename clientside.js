/*
Copyright 2020 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
var DashboardPowerups = (function () {
    const OPENKIT_URL = 'https://bf49960xxn.bf-sprint.dynatracelabs.com/mbeacon';
    const OPENKIT_APPID = '9a51173a-1898-45ef-94dd-4fea40538ef4';
    const GRID_SELECTOR = '.grid-dashboard';
    const VIEWPORT_SELECTOR = '.grid-viewport';
    const TITLE_SELECTOR = '[uitestid="gwt-debug-title"]';
    const VAL_SELECTOR = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"] > span:first-of-type, [uitestid="gwt-debug-kpiValue"] > span:first-of-type, [uitestid="gwt-debug-dexp-visualization-single-value"] span:first-of-type, [uitestid="gwt-debug-visualization-single-value"] span:first-of-type';
    const TILE_SELECTOR = '.grid-tile';
    const LEGEND_SELECTOR = '[uitestid="gwt-debug-legend"]';
    const MARKDOWN_SELECTOR = '[uitestid="gwt-debug-MARKDOWN"] > div:first-child > div:first-child';
    const BIGNUM_SELECTOR = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"] span, [uitestid="gwt-debug-kpiValue"] span, [uitestid="gwt-debug-dexp-visualization-single-value"] span';
    const TREND_SELECTOR = '[uitestid="gwt-debug-trendLabel"]';
    const MAP_SELECTOR = '[uitestid="gwt-debug-map"]';
    const MAPTITLE_SELECTOR = 'span[uitestid="gwt-debug-WorldMapTile"]';
    const TABLE_SELECTOR = '[uitestid="gwt-debug-tablePanel"]';
    const TABLE_COL_SELECTOR = '[uitestid="gwt-debug-tablePanel"] > div > div';
    const BANNER_SELECTOR = '[uitestid="gwt-debug-dashboardNameLabel"]';
    const TAG_SELECTOR = '[uitestid="gwt-debug-showMoreTags"] ~ [title]';
    const FUNNEL_SELECTOR = '[uitestid="gwt-debug-funnelPanel"]';
    const SVT_PANEL_SELECTOR = '[uitestid="gwt-debug-chartPanel"]';
    const SVT_METRIC_SELECTOR = '[uitestid="gwt-debug-custom-chart-single-value-title"]';
    const SVT_UNITS_SELECTOR = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"] > span:nth-of-type(2), [uitestid="gwt-debug-kpiValue"] > span:nth-of-type(2)';
    const COLUMN_SELECTOR = '.powerupTable > div > div > div:nth-of-type(1) > span';
    const MENU_ICON_SELECTOR = '[uitestid="gwt-debug-dashboard-tile-menu-icon"]';
    const MENU_POPUP_SELECTOR = '[uitestid="gwt-debug-dashboard-tile-menu-popup"]';
    const TOPLIST_SELECTOR = '[uitestid="gwt-debug-chartPanel"] > div';
    const TOPLIST_BAR_SELECTOR = 'div[data-dynamic-color]';
    const NO_DATA_SELECTOR = 'div.grid-tileContent > div > div:nth-of-type(3) > div:nth-of-type(1), [uitestid="gwt-debug-renderedCustomError"] > div > div:nth-of-type(1)';
    const TILE_CONTENT_SELECTOR = '.grid-tileContent > div:first-of-type > div:first-of-type';

    const PU_COLOR = '!PU(color):';
    const PU_SVG = '!PU(svg):';
    const PU_MAP = '!PU(map):';
    const PU_LINK = '!PU(link):';
    const PU_BANNER = '!PU(banner):';
    const PU_LINE = '!PU(line):';
    const PU_USQLSTACK = '!PU(usqlstack):';
    const PU_USQLCOLOR = '!PU(usqlcolor):';
    const PU_HEATMAP = '!PU(heatmap):';
    const PU_SANKEY = '!PU(sankey):';
    const PU_FUNNEL = '!PU(funnel):';
    const PU_MATH = '!PU(math):';
    const PU_DATE = '!PU(date):';
    const PU_GAUGE = '!PU(gauge):';
    const PU_COMPARE = '!PU(compare):';
    const PU_MCOMPARE = '!PU(mcompare):';
    const PU_VLOOKUP = '!PU(vlookup):';
    const PU_STDEV = '!PU(stdev):';
    const PU_100STACK = '!PU(100stack):';
    const PU_TABLE = '!PU(table):';
    const PU_BACKGROUND = '!PU(background):';
    const PU_IMAGE = '!PU(image):';
    const PU_FUNNELCOLORS = '!PU(funnelcolors):';
    const PU_FORECAST = '!PU(forecast):';
    const PU_TILECSS = '!PU(tilecss):';
    const PU_GRID = '!PU(grid):';
    const PU_MENU = '!PU(menu):';
    const PU_TOPCOLOR = '!PU(topcolor):';

    const USQL_URL = `ui/user-sessions/query?sessionquery=`;
    const MARKERS = [PU_COLOR, PU_SVG, PU_LINK, PU_MAP, PU_BANNER, PU_LINE, PU_USQLSTACK, PU_HEATMAP,
        PU_FUNNEL, PU_SANKEY, PU_MATH, PU_DATE, PU_GAUGE, PU_USQLCOLOR, PU_COMPARE, PU_VLOOKUP, PU_STDEV, PU_100STACK,
        PU_TABLE, PU_BACKGROUND, PU_MCOMPARE, PU_FUNNELCOLORS, PU_FORECAST, PU_TILECSS, PU_GRID, PU_MENU,
        PU_TOPCOLOR
    ];
    const CHART_OPTS = {
        //plotBackgroundColor: '#454646',
    }
    const SERIES_OPTS = {
        "animation": false,
        "allowPointSelect": true,
        cursor: 'crosshair',
        "enableMouseTracking": true,
        stickyTracking: true,
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
                if (!sn) sn = n; //worst case use the existing series name

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
    const PIE_TOOLTIP_OPTS = {
        enabled: true,
        animation: false,
        outside: true,
        useHTML: true,
        hideDelay: 100,
        shared: true,
        formatter: undefined,
        pointFormat: `<span style="color:{point.color}">●</span>: <b>{point.percentage:.1f}%</b><br/>`
    }
    const PIE_SERIES_OPTS = {
        "animation": false,
        "allowPointSelect": true,
        cursor: 'crosshair',
        "enableMouseTracking": true,
        stickyTracking: true,
        //tooltip: PIE_TOOLTIP_OPTS,
        "states": {
            "hover": {
                "enabled": true,
                "halo": {
                    "opacity": 0.25,
                    "size": 3
                }
            }
        },
    };
    const AXIS_OPTS = {
        crosshair: {
            color: '#cccccc',
            width: '1px'
        }
    };
    const CREDITS_OFF = {
        credits: {
            enabled: false
        }
    };
    const DATALABELS = {
        enabled: true,
        color: '#ffffff',
        //format: '{point.value:.2f}',
        format: '{y:.2f}',
        crop: true,
        overflow: "justify",
        style: {
            color: "#ffffff",
            fontSize: "10px",
            fontWeight: "",
            textOutline: ""
        }
    };
    const MO_CONFIG = { attributes: true, childList: true, subtree: true }; //MutexObserver
    var waits = 0;
    var observers = [];
    var targets = [];
    var dataTables = [];
    var D3MutexBlocking = false;
    var openKit;
    var powerupsFired = {};


    //Private methods
    var uniqId = (function () {
        //usage: let myId = uniqId();
        var i = 0;
        return function () {
            return i++;
        }
    })();

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

    const clearPowerup = (e) => {
        if (!pub.PUHighchartsMutex.blocked) {
            let chart = e.target;
            chart.poweredup = false;
        }
    }

    const waitForHCmod = (mod, fn, retries = 5) => {
        if (retries < 1) {
            console.log(`POWERUP: CRITICAL - failed to load Highcharts module ${mod}`);
            return;
        }
        if (mod in Highcharts.seriesTypes) fn();
        else
            setTimeout(() => { waitForHCmod(mod, fn, retries - 1); }, 100);
    }

    const argsplit = (str, pu) => {
        let splits = str.split(pu);
        splits.shift(); //remove leading text
        let count = splits.length;
        let argObjs = [];
        splits.forEach(split => {
            let argstring = split.split(/[!\n]/)[0].trim();
            let args = argstring.split(";").map(x => x.split("="));
            args.argstring = argstring;
            argObjs.push(args);
        })
        //return first argObj for backwards compatibility, w/ full array as a property
        let args = argObjs[0];
        args.argObjs = argObjs;
        return args;
    }

    //Read data from USQL table
    function readTableData(tabletile, forceLastColumnNumber = true) {
        let $tabletile = $(tabletile);
        if (!$tabletile.length) return false;
        let dataTable = [];
        let normalTable = [];
        let keys = [];
        $tabletile
            .find(TABLE_COL_SELECTOR)
            .each(function (i, el) {
                let $el = $(el);
                $el.find('span, a').each(function (j, el2) {
                    if (typeof (dataTable[i]) == "undefined") dataTable[i] = [];
                    dataTable[i][j] = $(el2).text();
                });
            });

        let numKeys = dataTable.length;
        if (!numKeys) return false;
        for (let i = 0; i < numKeys; i++) {
            keys.push(dataTable[i].shift());
        }
        let numRows = dataTable[0].length;

        for (let i = 0; i < numRows; i++) {
            let obj = {};
            for (let j = 0; j < numKeys; j++) {
                let key = keys[j];
                if (forceLastColumnNumber //Last column should be a number
                    && j == numKeys - 1
                    && dataTable[j][i] != null) {
                    obj[key] = Number(dataTable[j][i].replace(/[,a-z ]/g, ''));
                } else {
                    obj[key] = dataTable[j][i] || 0;
                }
            }
            normalTable.push(obj);
        }
        return ({ keys: keys, normalTable: normalTable })
    }

    function columnSorterAsc(a, b, key) {
        switch (typeof (a[key])) {
            case "number":
                return a - b;
            case "string":
                if (a[key].match(/^[0-9]/)
                    && b[key].match(/^[0-9]/)) { //likely number as a string
                    let a0 = a[key].replace(/[^0-9]*/g, '');
                    let b0 = b[key].replace(/[^0-9]*/g, '');
                    return a0 - b0;
                } else { //should be a string
                    return (a[key].toLowerCase() > b[key].toLowerCase() ? -1 : 1);
                }
            default:
                return false;
        }
    }

    function columnSorterDesc(a, b, key) {
        switch (typeof (a[key])) {
            case "number":
                return b - a;
            case "string":
                if (a[key].match(/^[0-9]/)
                    && b[key].match(/^[0-9]/)) { //likely number as a string
                    let a0 = a[key].replace(/[^0-9]*/g, '');
                    let b0 = b[key].replace(/[^0-9]*/g, '');
                    return b0 - a0;
                } else { //should be a string
                    return (a[key].toLowerCase() < b[key].toLowerCase() ? -1 : 1);
                }
            default:
                return false;
        }
    }

    function startBeacon() {
        if (pub.config.Powerups.BeaconOptOut) return false;
        if (pub.config.Powerups.debug) console.log("POWERUP: DEBUG - OpenKit start beacon");

        //try sending message to background.js instead to avoid CSP issues
        let email = $(`[debugid="userEmail"]`).text();
        let name = (email > "" ? email : $(`[debugid="userName"]`).text());
        if (!name.length) name = "Anonymous";
        let internalUser = (name.includes('@dynatrace.com')
            || name.includes('@ruxitlabs.com')
            || location.href.match(/managed[a-z-]*.internal.dynatrace/)
            ? "true" : "false");
        let dtVersion = ($(`[uitestid="gwt-debug-systemVerisionSection"]`).text().match(/[0-9.]+/) || [])[0];
        let dbName = $(`[uitestid="gwt-debug-dashboardNameLabel"]`).text();
        let configuratorTag = ($(`[uitestid="gwt-debug-showMoreTags"]`).parent().find(`[title="Configurator"]`).length ? "true" : "false");
        let envName = (
            ($(`[uitestid="gwt-debug-searchField"] div input`).attr("placeholder") || "")
                .match(/Search Dynatrace (.+).../) || []
        )[1];

        let vals = {
            tenantId: tenantId,
            host: location.host,
            dashboardID: (location.hash.match(/id=([0-9a-f-]+)/) || [])[1],
            internalUser: internalUser,
            dtVersion: dtVersion,
            dbName: dbName,
            configuratorTag: configuratorTag,
            envName: envName,
            libLocation: pub.config.Powerups.libLocation,
            uuid: pub.config.Powerups.uuid
        };
        window.postMessage(
            {
                OpenKit: "start_beacon",
                action: "PowerUp: " + location.href,
                beaconOptOut: pub.config.Powerups.BeaconOptOut,
                uuid: pub.config.Powerups.uuid,
                applicationVersion: pub.VERSION,
                operatingSystem: (navigator.userAgent.match(/\(([^)]+)\)/) || [])[1],
                manufacturer: 'Chrome',
                modelId: (navigator.userAgent.match(/Chrome\/([^ ]+)/) || [])[1],
                screenResolution: [window.innerWidth, window.innerHeight],
                name: name,
                vals: vals
            }, "*");
    }

    function crashBeacon(e) {
        if (pub.config.Powerups.BeaconOptOut) return false;
        if (pub.config.Powerups.debug) console.log("POWERUP: DEBUG - OpenKit crash beacon");

        window.postMessage(
            {
                OpenKit: "crash_beacon",
                e: e
            }, "*");
    }

    function errorBeacon(err) {
        if (pub.config.Powerups.BeaconOptOut) return false;
        if (pub.config.Powerups.debug) console.log("POWERUP: DEBUG - OpenKit crash beacon");

        window.postMessage(
            {
                OpenKit: "error_beacon",
                context: "clientside",
                err: err
            }, "*");
    }

    function endBeacon() {
        if (pub.config.Powerups.BeaconOptOut) return false;
        if (pub.config.Powerups.debug) console.log("POWERUP: DEBUG - OpenKit end beacon");

        let vals = powerupsFired;
        powerupsFired = {};
        window.postMessage(
            {
                OpenKit: "end_beacon",
                vals: vals
            }, "*");
    }

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    function downloadExcel(filename, sheetname, json) {
        if (typeof (XLSX) == "undefined") return false;
        let wb = XLSX.utils.book_new();
        let ws = XLSX.utils.json_to_sheet(json);
        XLSX.utils.book_append_sheet(wb, ws, sheetname);
        let wbout = XLSX.writeFile(wb, filename);
    }

    //Public methods
    var pub = {};

    pub.POWERUP_EXT_URL = "";
    pub.SVGLib = () => { return pub.POWERUP_EXT_URL + encodeURI(`3rdParty/node_modules/@dynatrace/barista-icons/`); };
    pub.config = {};
    pub.PUHighchartsMutex = { blocking: false, blocked: 0 }; //must be obj to ensure passby ref
    pub.PUHighchartsStatus = () => { return Highcharts.charts.filter(x => typeof (x) !== "undefined").map(x => x.poweredup); }
    pub.SVGInject = (obj, attempts = 5) => {
        if (typeof (SVGInject) == "undefined") {
            if (attempts < 1) return false;
            setTimeout(() => { pub.SVGInject(obj, attempts - 1); }, 100);
        } else {
            SVGInject(obj);
        }
    }

    pub.PUHighcharts = function () {
        function wrapExporting() {
            Highcharts.wrap(Highcharts.Chart.prototype, 'contextMenu', function (proceed) { //Highcharts bug fix, https://github.com/highcharts/highcharts/issues/9800
                proceed.apply(this, Array.prototype.slice.call(arguments, 1));

                if (typeof (this.exportContextMenu.style.originalTop) == "undefined") {
                    // Correct for chart position
                    var pos = Highcharts.offset(this.container);
                    var defaultPadding = 5 * 2;
                    this.exportContextMenu.style.top = (parseInt(this.exportContextMenu.style.top) + pos.top) + 'px';
                    this.exportContextMenu.style.left = (pos.left + this.chartWidth - this.exportMenuWidth - parseInt(this.exportContextMenu.style.padding) - defaultPadding) + 'px';
                    this.exportContextMenu.style.width = this.exportMenuWidth + 'px';

                    //safe store
                    this.exportContextMenu.style.originalTop = this.exportContextMenu.style.top;

                    // Move it to the body
                    Highcharts.doc.body.appendChild(this.exportContextMenu);
                    this.exportContextMenu.poweredup = true;
                } else {
                    var pos = Highcharts.offset(this.container);
                    var defaultPadding = 5 * 2;
                    this.exportContextMenu.style.top = this.exportContextMenu.style.originalTop;
                }
            });
        }

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
            wrapExporting();
            Highcharts.charts
                .filter(x => typeof (x) != "undefined")
                //.filter(x => !x.poweredup)
                .filter(x => typeof (x.container) != "undefined")
                .filter(x => x.options.type != 'sankey' && x.options.type != 'heatmap')
                .forEach(chart => {
                    let p = pub.PUHighchart(chart);
                    promises.push(p);
                    $.when(p).done(val => { if (val) PUcount++; });
                });
            $.when.apply($, promises).then(function () {
                $(".highcharts-container").css("z-index", 999);
                if (pub.config.Powerups.debug) console.log("Powerup: " + PUcount + " Highcharts powered-up.");
                //other dashboard powering-up here
                //pub.fireAllPowerUps(true); //don't think this is needed anymore, thanks to MO

                mainPromise.resolve(true);
                pub.PUHighchartsMutex.blocking = false;
                pub.PUHighchartsMutex.blocked = 0;
            });
            return mainPromise;
        } else {
            if (pub.config.Powerups.debug) console.log("Powerup: no longer on a dashboard, removing PUHighcharts listener...");
            Highcharts.removeEvent(Highcharts.Chart, 'load', pub.PUHighcharts);
            return false;
        }
    }

    pub.PUHighchart = function (chart) {
        let pu = false;
        var EXPORT_OPTS = {
            enabled: true,
            fallbackToExportServer: true,
            libURL: pub.POWERUP_EXT_URL + '3rdParty/Highcharts/lib',
            buttons: {
                contextButton: {
                    //    ["printChart", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG", "separator", "downloadCSV", "downloadXLS", "viewData", "openInCloud"]
                    menuItems: ["downloadSVG", "downloadPDF", "separator", "downloadCSV", "downloadXLS", "printChart"]
                }
            }
        }
        const compare = function (optsNew, optsCurrent) {
            //Loop through properties in new options, looking for 1-way equivalency
            for (var p in optsNew) {
                //Check property exists on both objects
                if (optsNew.hasOwnProperty(p) !== optsCurrent.hasOwnProperty(p)) return false;

                switch (typeof (optsNew[p])) {
                    //Deep compare objects
                    case 'object':
                        if (!compare(optsNew[p], optsCurrent[p])) return false;
                        break;
                    //Compare function code
                    case 'function':
                        if (typeof (optsCurrent[p]) == 'undefined' || (p != 'compare' && optsNew[p].toString() != optsCurrent[p].toString())) return false;
                        break;
                    //Compare values
                    default:
                        if (optsNew[p] != optsCurrent[p]) return false;
                }
            }
            return true;
        }

        const enableExporting = function () {
            let $container = $(chart.container);

            if (!compare(EXPORT_OPTS, chart.options.exporting)) { //enable exporting
                //if bigger than XYZ, allow
                chart.update({ exporting: EXPORT_OPTS }, false);
                pu = true;
            }
            $container //enable exporting
                .off("mouseenter.powerup")
                .on("mouseenter.powerup", (e) => {
                    $container.find(".highcharts-exporting-group").addClass("powerupVisible");
                })
                .off("mouseleave.powerup")
                .on("mouseleave.powerup", (e) => {
                    $container.find(".highcharts-exporting-group").removeClass("powerupVisible");
                });
        }

        const restoreHandlers = function () {
            let $container = $(chart.container);
            //try to restore normal chart interactions, preventing navigation from plot
            $container.find(".highcharts-plot-background")
                .off("touchstart.powerup")
                .on("touchstart.powerup", (e) => {
                    chart.pointer.onContainerTouchStart(e);
                    e.stopImmediatePropagation();
                })
                .off("touchmove.powerup")
                .on("touchmove.powerup", (e) => {
                    chart.pointer.onContainerTouchMove(e);
                    e.stopImmediatePropagation();
                })
                .off("click.powerup")
                .on("click.powerup", (e) => {
                    console.log("Powerup: clicked plot background");
                    e.stopImmediatePropagation();
                })
                .addClass("powerupPlotBackground"); //change cursor
        }

        var lineChartPU = function () {
            let $container = $(chart.container);

            chart.series.forEach(series => {
                if (!compare(SERIES_OPTS, series.options)) {
                    series.update(SERIES_OPTS, false);
                    pu = true;
                }
            });
            if (!compare(CHART_OPTS, chart.options.chart)) {
                chart.update({ chart: CHART_OPTS }, false);
                pu = true;
            }
            //if (!compare(TOOLTIP_OPTS, chart.tooltip.options)) {
            if (typeof (chart.tooltip.options.userOptions) == "undefined"
                || !chart.tooltip.options.userOptions.enabled) {  //do not override built-in tooltips
                chart.update({ tooltip: TOOLTIP_OPTS }, false);
                pu = true;
            }
            if (!compare(AXIS_OPTS, chart.xAxis[0].options)) {
                chart.update({ xAxis: AXIS_OPTS }, false);
                pu = true;
            }
            if (!compare(AXIS_OPTS, chart.yAxis[0].options)) {
                chart.update({ yAxis: AXIS_OPTS }, false);
                pu = true;
            }
            restoreHandlers();
        }

        var pieChartPU = function () {
            chart.series.forEach(series => {
                if (!compare(PIE_SERIES_OPTS, series.options)) {
                    series.update(PIE_SERIES_OPTS, false);
                    pu = true;
                }
                if (typeof (chart.tooltip.options.userOptions) == "undefined"
                    || !chart.tooltip.options.userOptions.enabled) { //do not override built-in tooltips
                    chart.update({ tooltip: PIE_TOOLTIP_OPTS }, false);
                    pu = true;
                }
            });
            restoreHandlers();
        }

        var PU100stack = function (chart, title) {
            //let argstring = title.split(PU_100STACK)[1].split('!')[0].trim();
            //let args = argstring.split(";").map(x => x.split("="));
            let args = argsplit(title, PU_100STACK);

            let pad = Number((args.find(x => x[0] == "pad") || [])[1]);
            chart.series.forEach((s, i) => {
                if (s.options.type === "column") {
                    let opts = {
                        stack: 'stack0',
                        stacking: "percent"
                    }
                    if (!isNaN(pad)) {
                        opts.pointPadding = pad;
                        opts.groupPadding = pad;
                        opts.borderWidth = 0;
                        opts.shadow = false;
                    }
                    s.update(opts, false);
                    s.yAxis.setExtremes(0, 100);
                }
            });
        }

        if (pub.config.Powerups.tooltipPU &&
            typeof (chart) !== "undefined" &&
            //!chart.poweredup &&
            typeof (chart.container) != "undefined") {
            let mainPromise = new $.Deferred();
            let promises = [];

            let $container = $(chart.container);
            let $tile = $container.parents(TILE_SELECTOR);
            let $title = $tile.find(TITLE_SELECTOR);
            let title = $title.text();
            if (title.includes(PU_LINE)) {
                if (pub.PULine(chart, title)) {
                    pu = true;
                    lineChartPU();
                    enableExporting();
                    powerupsFired['PU_LINE'] ? powerupsFired['PU_LINE']++ : powerupsFired['PU_LINE'] = 1;
                }
            } else if (title.includes(PU_USQLSTACK)) {
                let p = pub.PUUsqlStack(chart, title);
                promises.push(p);
                $.when(p).done(val => {
                    restoreHandlers();
                    enableExporting();
                    if (val) pu = true;
                    powerupsFired['PU_USQLSTACK'] ? powerupsFired['PU_USQLSTACK']++ : powerupsFired['PU_USQLSTACK'] = 1;
                })
            } else if (title.includes(PU_USQLCOLOR)) {
                let p = pub.PUUsqlColor(chart, title);
                promises.push(p);
                $.when(p).done(val => {
                    if (chart.series[0] && chart.series[0].type == "pie") {
                        pieChartPU();
                    } else {
                        lineChartPU();
                        enableExporting();
                    }
                    restoreHandlers();
                    if (val) pu = true;
                    powerupsFired['PU_USQLCOLOR'] ? powerupsFired['PU_USQLCOLOR']++ : powerupsFired['PU_USQLCOLOR'] = 1;
                })
            } else if (title.includes(PU_HEATMAP)) {
                if (pub.PUHeatmap(chart, title, chart.newContainer))
                    pu = true;
                powerupsFired['PU_HEATMAP'] ? powerupsFired['PU_HEATMAP']++ : powerupsFired['PU_HEATMAP'] = 1;
            } else if (title.includes(PU_GAUGE)) {
                let p = pub.puGauge(chart, title);
                promises.push(p);
                $.when(p).done(val => {
                    //restoreHandlers();
                    //enableExporting();
                    if (val) pu = true;
                    powerupsFired['PU_GAUGE'] ? powerupsFired['PU_GAUGE']++ : powerupsFired['PU_GAUGE'] = 1;
                })
            } else if (title.includes(PU_100STACK)) {
                if (PU100stack(chart, title))
                    pu = true;
                powerupsFired['PU_100STACK'] ? powerupsFired['PU_100STACK']++ : powerupsFired['PU_100STACK'] = 1;
            } else if (chart.series[0] && chart.series[0].type == "pie") {
                pieChartPU();
            } else if (title.includes(PU_FORECAST)) {
                let p = pub.PUforecast(chart, title);
                promises.push(p);
                $.when(p).done(val => {
                    if (val) pu = true;
                    lineChartPU();
                    enableExporting();
                    powerupsFired['PU_FORECAST'] ? powerupsFired['PU_FORECAST']++ : powerupsFired['PU_FORECAST'] = 1;
                });
            } else {
                lineChartPU();
                enableExporting();
            }


            $.when.apply($, promises).then(() => {
                if (pu) {
                    try {
                        if (Object.keys(chart).length) {
                            //Highcharts Heatmap bug workaround
                            if ("heatmap" in Highcharts.seriesTypes &&
                                typeof (chart.colorAxis) === "undefined")
                                chart.colorAxis = [];
                            chart.redraw(false);
                        } else {
                            console.log("Powerup: DEBUG - ignoring empty chart");
                        }
                    } catch (e) {
                        console.log("Powerup: CRITICAL - failed to redraw, error:");
                        console.log(e);
                        console.log(chart);
                    }
                }
                mainPromise.resolve(true);
            });
            return mainPromise;
        } else {
            return false;
        }
    }

    pub.PUforecast = function (chart, title) { //!PU(forecast):alg=sma;n=5;color=lightblue
        const IDs = ["SMA", "EMA", "Mean", "Stdev", "Bands", "Linear"];
        let data = chart.series[0].data;
        let dataSet = data.filter(i => i.y != null).map(i => [i.x, i.y]);
        //let argstring = title.split(PU_FORECAST)[1].split(/[!\n]/)[0].trim();
        //let args = argstring.split(";").map(x => x.split("="));
        let args = argsplit(title, PU_FORECAST);

        let analysis = ((args.find(x => x[0] == "analysis") || [])[1] || "Linear").split(',');
        let colors = ((args.find(x => x[0] == "colors") || [])[1] || "#2ab6f4,#4fd5e0,#748cff,#4fd5e0,#fd8232").split(',');
        let n = (args.find(x => x[0] == "n") || [])[1] || "20%";
        if (n.includes("%")) {
            n = Number(n.split('%')[0]) * 0.01;
            n = Math.round(n * data.length);
        } else {
            n = Number(n);
        }
        let p = (args.find(x => x[0] == "p") || [])[1] || "0";
        if (p.includes("%")) {
            p = Number(p.split('%')[0]) * 0.01;
            p = Math.round(p * data.length);
        } else {
            p = Number(p);
        }


        //cleanup old added series, for some reason Product kills them in memory but not in SVG
        chart.series
            .filter(x => IDs.includes(x.id))
            .forEach(x => {
                x.remove(true);
            });
        chart.series
            .filter(x => typeof (x.id) == "undefined" && x.index) //remove any other series except for the 1st source series
            .forEach(x => {
                x.remove(true);
            });
        let $container = $(chart.container);
        let groups = chart.series
            .filter(x => typeof (x.group) != "undefined")
            .map(x => x.group.element);
        $container.find(`.highcharts-series`).each((i, el) => {
            if (!groups.includes(el)) {
                $(el).remove();
            }
        });

        //Move series name into graph
        let $tile = $container.parents(TILE_SELECTOR);
        let $legend = $tile.find(LEGEND_SELECTOR).hide();
        let seriesName = $legend.find(`[title]`).eq(0).attr('title');
        if (seriesName != null) {
            chart.series[0].update({ name: seriesName }, false);
        }
        chart.legend.update({
            enabled: true,
            itemStyle: {
                color: "#B7B7B8",
                fontSize: "10px",
                fontWeight: "normal"
            },
            itemHoverStyle: {
                color: "white"
            }
        }, false);

        function nextColor() {
            let i = chart.series.length; //ie next element
            i = i % colors.length; //radix
            return colors[i];
        }

        function lastColor() {
            let i = chart.series.length - 1;
            return chart.series[i].color;
        }

        function simpleMovingAverage() {
            let sma = [];
            for (let i = 0; i < data.length; i++) {
                let smaPoint = [];
                let sum = 0;
                let start = Math.max(0, i - n + 1);
                let end = i;
                let len = end - start + 1;
                for (let j = start; j <= end; j++) {
                    sum += data[j].y;
                }
                let avg = sum / len;
                if (data[i].y != null) {
                    smaPoint = [data[i].x, avg];
                } else {
                    smaPoint = [data[i].x, null];
                }
                sma.push(smaPoint);
            }

            chart.addSeries({
                name: "SMA",
                id: "SMA",
                data: sma,
                color: nextColor(),
                visible: analysis.includes("SMA")
            }, false);
        }

        function expontialMovingAverage() {
            let ema = [];
            ema[0] = [data[0].x, data[0].y];
            for (let i = 1; i < data.length; i++) {
                if (data[i].y == null) continue;
                let h = Math.max(i - 1, 0);
                let k = 2 / (n + 1)

                if (typeof (ema[h]) == "undefined") continue;
                let EMA = data[i].y * k + ema[h][1] * (1 - k);
                ema.push([data[i].x, EMA]);
            }
            chart.addSeries({
                name: "EMA",
                id: "EMA",
                data: ema,
                color: nextColor(),
                visible: analysis.includes("EMA")
            }, false);

            return ema;
        }

        function mean() {
            let mean = [];
            let sum = 0;
            let count = 0;
            data.forEach(x => {
                if (x.y != null) {
                    sum += x.y;
                    count++;
                }
            });
            let m = sum / count;
            data.forEach(x => {
                if (x.y != null) {
                    mean.push([x.x, m]);
                }
            });
            chart.addSeries({
                name: "Mean",
                id: "Mean",
                data: mean,
                color: nextColor(),
                visible: analysis.includes("Mean")
            }, false);
            return m;
        }

        function standardDeviation(m) {
            let deltas = [];
            let stdevs = [];
            let count = 0;
            data.forEach(x => {
                if (x.y != null) {
                    deltas.push(x.y - m);
                    count++;
                }
            });
            let sum = deltas.reduce((acc, curr) => acc + curr * curr, 0);
            let stdev = Math.sqrt(sum / count);
            data.forEach(x => {
                if (x.y != null) {
                    stdevs.push([
                        x.x,
                        m - stdev,
                        m + stdev
                    ])
                }
            });

            chart.addSeries({
                name: "Stdev",
                id: "Stdev",
                type: 'arearange',
                data: stdevs,
                color: chart.get('Mean').color,
                opacity: 0.3,
                linkedTo: "Mean",
                visible: analysis.includes("Mean")
            }, false);
        }

        function bands(ema) {
            let deltas = [];
            let stdevs = [];
            let count = 0;
            data.forEach((x, i) => {
                if (x.y != null
                    && typeof (ema[i]) != "undefined") {
                    deltas.push(x.y - ema[i][1]);
                    count++;
                }
            });

            for (let i = 0; i < deltas.length; i++) { //walk the window
                let stdPoint = [];
                let sum = 0;
                let start = Math.max(0, i - n + 1);
                let end = i;
                let len = end - start + 1;
                for (let j = start; j <= end; j++) {  //walk inside the window
                    sum += deltas[j] * deltas[j];
                }
                let stdev = Math.sqrt(sum / len);
                if (data[i].y != null) {
                    stdPoint = [
                        ema[i][0],
                        ema[i][1] - stdev,
                        ema[i][1] + stdev
                    ];
                    stdevs.push(stdPoint);
                }
            }
            chart.addSeries({
                name: "Bands",
                id: "Bands",
                type: 'arearange',
                data: stdevs,
                color: chart.get("EMA").color,
                opacity: 0.3,
                linkedTo: "EMA",
                visible: analysis.includes("EMA")
            }, false);

            return stdevs;
        }

        function linearRegression(dataSet) {
            let x_sum = 0;
            let y_sum = 0;
            let xy_sum = 0;
            let xx_sum = 0;
            let count = 0;

            for (let i = 0; i < dataSet.length; i++) {
                if (dataSet[i][1] == null) continue;
                let x = dataSet[i][0];
                let y = dataSet[i][1];
                x_sum += x;
                y_sum += y;
                xx_sum += x * x;
                xy_sum += x * y;
                count++;
            }

            // Calculate m and b for the line equation: y = m * x + b
            let m = (count * xy_sum - x_sum * y_sum) / (count * xx_sum - x_sum * x_sum);
            let b = (y_sum / count) - (m * x_sum) / count;
            let line = [];

            for (let i = 0; i < dataSet.length; i++) {
                if (dataSet[i][1] == null) continue;
                let point = [
                    dataSet[i][0],
                    dataSet[i][0] * m + b
                ];
                line.push(point);
            }
            return { m: m, b: b, line: line };
        }

        function linearTrendLine() {
            let line = linearRegression(dataSet);
            chart.addSeries({
                name: "Linear",
                id: "Linear",
                data: line.line,
                color: nextColor(),
                visible: analysis.includes("Linear")
            }, false);
            return line;
        }

        function projection(linear) {
            if (!p || typeof (linear) == "undefined") return;
            let l = linear.line.length;
            if (l < 2) return;
            let d = linear.line[l - 1][0] - linear.line[l - 2][0];
            let newLine = [];
            for (let i = 1; i <= p; i++) {
                let x = linear.line[l - 1][0] + i * d;
                let y = linear.m * x + linear.b;
                newLine.push([x, y]);
            }
            return newLine;
        }

        function linearProjection(linear) {
            if (!p) return;
            let newLine = projection(linear);
            chart.addSeries({
                name: "Projection",
                id: "Projection",
                data: newLine,
                color: nextColor(),
                dashStyle: "shortDash"
            }, false);

            chart.axes.filter(x => x.isXAxis)[0].setExtremes(
                data[0].x,
                newLine[newLine.length - 1][0],
                false
            );
        }

        function rangeProjection(stdevs) {
            if (!p) return;
            let highs = stdevs.map(x => [x[0], x[2]]);
            let lows = stdevs.map(x => [x[0], x[1]]);
            let highLR = linearRegression(highs);
            let lowLR = linearRegression(lows);
            let highLine = projection(highLR) || [];
            let lowLine = projection(lowLR) || [];
            let range = [];
            if (!lowLine.length || !highLine.length) return;
            lowLine.forEach((x, i) => {
                range.push([
                    x[0],
                    x[1],
                    highLine[i][1]
                ]);
            });

            chart.addSeries({
                name: "RangeProjection",
                id: "RangeProjection",
                data: range,
                color: nextColor(),
                type: 'arearange',
                linkedTo: "Projection",
                opacity: 0.3
            }, false);

            chart.axes.filter(x => x.isXAxis)[0].setExtremes(
                data[0].x,
                range[range.length - 1][0],
                false
            );
        }

        function updateYAxis() {
            chart.axes
                .filter(x => typeof (x.isXAxis) == "undefined"
                    && x.series.length)
                .forEach(x => {
                    let tick = x.tickInterval;
                    let min = Math.min.apply(Math, dataSet.map(x => x[1]));
                    min = Math.round((min * .9) / tick) * tick;
                    let max = Math.max.apply(Math, dataSet.map(x => x[1]));
                    max = Math.round((max * 1.1) / tick) * tick;
                    x.setExtremes(min, max, false);
                })
        }

        simpleMovingAverage();
        let ema = expontialMovingAverage();
        let m = mean();
        let stdev = standardDeviation(m);
        let stdevs = bands(ema);
        let linear = linearTrendLine();
        linearProjection(linear);
        rangeProjection(stdevs);
        updateYAxis();

        return true;
    }

    pub.PULine = function (chart, title) { //example: !PU(line):thld=4000;hcol=green;lcol=red
        if (!pub.config.Powerups.linePU) return;

        //let argstring = title.split(PU_LINE)[1].split('!')[0].trim();
        //let args = argstring.split(";").map(x => x.split("="));
        let args = argsplit(title, PU_LINE);
        if (args.length < 3) {
            if (pub.config.Powerups.debug)
                console.log("Powerup: ERROR - invalid argstring: " + args.argstring);
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

        //chart.poweredup = true;
        return true;
    }

    pub.PUUsqlStack = function (chart, title, retries = 3) { //example: !PU(usqlstack):colors=green,yellow,red
        if (!pub.config.Powerups.usqlstackPU) return false;
        let p = new $.Deferred();
        //let argstring = title.split(PU_USQLSTACK)[1].split('!')[0].trim();
        //let args = argstring.split(";").map(x => x.split("="));
        let args = argsplit(title, PU_USQLSTACK);
        if (args.length < 1) {
            if (pub.config.Powerups.debug)
                console.log("Powerup: ERROR - invalid argstring: " + args.argstring);
            return false;
        }
        let colors = ((args.find(x => x[0] == "colors") || [])[1]);
        if (colors) colors = colors.split(',');
        let vals = ((args.find(x => x[0] == "vals") || [])[1]);
        if (vals) vals = vals.split(',');
        let stacking = (title.includes(PU_100STACK) ? "percent" : "normal");
        let dataLabels = (((args.find(x => x[0] == "dataLabels") || ["dataLabels", "false"])[1])
            .toLowerCase()
            .trim() === "true" ? true : false);

        //get data
        if (chart.series.length > 1) { //magically the data is actually already split, just stack it
            chart.series.forEach((s, i) => {
                let opts = {
                    stack: 'stack0',
                    stacking: stacking,
                    dataLabels: {
                        enabled: dataLabels
                    },
                    groupPadding: 0
                }
                if (vals) {
                    let name = (s.name.match(/\(([^)]+)/) || [])[1] || "";
                    let idx = vals.findIndex(x => x.toLowerCase() === name.toLowerCase());
                    if (idx > -1) {
                        opts.color = colors[idx];
                    } else {
                        if (colors && Array.isArray(colors) && colors[i])
                            opts.color = colors[i];
                    }

                } else {
                    if (colors && Array.isArray(colors) && colors[i])
                        opts.color = colors[i];
                }
                s.update(opts, false);

            });
            chart.redraw(false);
            return true;
        } else if (chart.series.length < 1) { //something's broken, just abort
            console.log("Powerup: WARN - USQLStack did not find a series, aborting.");
            return false;
        }


        if (!chart.series[0].data.length) {//no data, try 3 more times then quit
            if (retries) {
                setTimeout(() => {
                    let p0 = pub.PUUsqlStack(chart, title, retries - 1);
                    $.when(p0).done((d0) => { p.resolve(d0); })
                }, 50);
                return p;
            } else return false;
        }
        if (!chart.series[0].data[0].name.includes(',')) return false; //if there's no splitting, quit
        let splittings = [];
        let newSeries = [];
        let newCategories = [... new Set(chart.series[0].data.map(x => x.category.split(',')[0]))];

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
                    cursor: 'crosshair',
                    stacking: stacking,
                    dataLabels: {
                        enabled: dataLabels
                    },
                    data: [
                        {
                            name: newName,
                            x: newCategories.findIndex(x => x === newName),
                            y: d.y
                        }
                    ]
                }
                let seriesNum = newSeries.length;
                if (vals) {
                    let idx = vals.findIndex(x => x.toLowerCase() === split.toLowerCase());
                    if (idx > -1) {
                        newSerie.color = colors[idx];
                    } else {
                        if (colors && Array.isArray(colors) && colors[seriesNum])
                            newSerie.color = colors[seriesNum];
                    }
                } else {
                    if (colors && Array.isArray(colors) && colors[seriesNum])
                        newSerie.color = colors[seriesNum];
                }
                newSeries.push(newSerie);
            } else {
                newSeries[i].data.push({
                    name: newName,
                    x: newCategories.findIndex(x => x === newName),
                    y: d.y
                });
            }
            if (newCategories.findIndex(x => x == newName) < 0)
                newCategories.push(newName);
        });

        chart.series[0].remove(false, false);
        chart.axes[0].setCategories(newCategories, false);
        newSeries.forEach((ns, idx) => {
            chart.addSeries(ns, false, false);
            //chart.series[idx].setData(ns.data);
        });


        chart.update({ chart: CHART_OPTS }, false);

        chart.redraw(false);
        //chart.poweredup = true;
        $(".highcharts-exporting-group").addClass("powerupVisible");
        p.resolve(true);
        return p;
    }

    pub.PUUsqlColor = function (chart, title, retries = 3) { //example: !PU(usqlcolor):vals=satisfied,tolerated,frustrated;colors=green,yellow,red
        if (!pub.config.Powerups.usqlcolorPU) return false;
        let p = new $.Deferred();
        //let argstring = title.split(PU_USQLCOLOR)[1].split('!')[0].trim();
        //let args = argstring.split(";").map(x => x.split("="));
        let args = argsplit(title, PU_USQLCOLOR);
        if (args.length < 1) {
            if (pub.config.Powerups.debug)
                console.log("Powerup: ERROR - invalid argstring: " + args.argstring);
            return false;
        }
        let colors = ((args.find(x => x[0] == "colors") || [])[1]);
        let dataLabels = (((args.find(x => x[0] == "dataLabels") || ["dataLabels", "false"])[1])
            .toLowerCase()
            .trim() === "true" ? true : false);
        let vals = ((args.find(x => x[0] == "vals") || [])[1]);

        if (colors) colors = colors.split(',');
        else return false;
        if (vals) {
            vals = vals.split(',');
            let data = chart.series[0].data;
            data.forEach(pt => {
                let idx = vals.findIndex(x => x.toLowerCase() === pt.name.toLowerCase());
                if (idx > -1) {
                    pt.update({ color: colors[idx] }, false);
                }
            });
        } else { //assign colors in series order
            let opts = {
                //stacking: "normal",
                //groupPadding: 0
                colors: colors
            }
            chart.update(opts, false);
            chart.series.forEach((s, i) => {
                if (s.color)
                    s.update({ color: colors[i] });
            });
        }
        if (dataLabels) {
            let opts = {
                dataLabels: { ...DATALABELS }
            }
            chart.series.forEach(s => { s.update(opts, false); });
        }
        chart.redraw(false);
        return true;
    }

    pub.highlightPointsInOtherCharts = function (e) {
        if (!pub.config.Powerups.tooltipPU) return;

        const container = e.currentTarget;
        const charts = Highcharts.charts
            .filter(x => typeof (x) != "undefined")
            .filter(x => x.options.type != 'sankey' && x.options.type != 'heatmap');
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
                            if (points && points.length)
                                for (let p = 0; p < points.length; p++) {
                                    if (points[p].x === x
                                        && points[p].series.xAxis
                                        && points[p].series.yAxis
                                    ) {
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
        $('[uitestid="gwt-debug-dashboardGrid"]').off("mouseover", ".highcharts-container");
        $('[uitestid="gwt-debug-dashboardGrid"]').off("mouseout", ".highcharts-container");

        $('[uitestid="gwt-debug-dashboardGrid"]').on("mouseover", ".highcharts-container", debounce(pub.highlightPointsInOtherCharts, 50));
        $('[uitestid="gwt-debug-dashboardGrid"]').on("mouseout", ".highcharts-container", pub.removeHighlightPointsInOtherCharts);
    }

    pub.cleanMarkup = function () {
        let p = new $.Deferred();
        if (pub.config.Powerups.debug) console.log("Powerup: DEBUG - clean power-up markup");
        $(TITLE_SELECTOR).each((i, el) => {
            let $title = $(el);
            if ($title.children('.powerup-markup').length) return true; //already done
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
        $(TAG_SELECTOR).each((i, el) => {
            let $tag = $(el);
            let title = $tag.attr("title");

            if (title.includes(PU_BANNER)) {
                $tag.hide();
            }
        });
        p.resolve(true);
        return p;
    }

    pub.bannerPowerUp = function () {
        if (!pub.config.Powerups.bannerPU) return;
        let powerupFound = false;
        $(TAG_SELECTOR).each((i, el) => {
            let $tag = $(el);
            let title = $tag.attr("title");

            if (title.includes(PU_BANNER)) {
                //let argstring = title.split(PU_BANNER)[1].split('!')[0].trim();
                //let args = argstring.split(";").map(x => x.split("="));
                let args = argsplit(title, PU_BANNER);
                let color = args.find(x => x[0] == "color")[1];

                $(BANNER_SELECTOR).css("background", color);
                $(BANNER_SELECTOR).css("color", contrast(color));
                powerupFound = true;
                powerupsFired['PU_BANNER'] ? powerupsFired['PU_BANNER']++ : powerupsFired['PU_BANNER'] = 1;
            }
        });

        if (!powerupFound) {
            $(BANNER_SELECTOR).css("background", '');
            $(BANNER_SELECTOR).css("color", '');
        } else {
            if (pub.config.Powerups.debug) console.log("Powerup: DEBUG - banner power-up found");
        }
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
            let title = $title.text();
            let $tile = $title.parents(".grid-tile");
            let $bignum = $tile.find(BIGNUM_SELECTOR);

            //Step1: change tile colors
            if ($title.text().includes(PU_COLOR)) { //example !PU(color):base=high;warn=90;crit=70
                if (pub.config.Powerups.debug) console.log("Powerup: color power-up found");

                let args = argsplit(title, PU_COLOR);
                let base = (args.find(x => x[0] == "base") || [])[1] || "low";
                let warn = Number(
                    (args.find(x => x[0] == "warn") || [])
                    [1]);
                let crit = Number(
                    (args.find(x => x[0] == "crit") || [])
                    [1]);
                let val = Number(
                    $tile.find(VAL_SELECTOR)
                        .text().replace(/,/g, ''));
                let color = (args.find(x => x[0] == "color") || [])[1];
                let nan = (args.find(x => x[0] == "nan") || ["nan", "#b7b7b7"])[1];

                let $target = (pub.config.Powerups.colorPUTarget == "Border" ? $tile : $bignum);
                if (!$target.length) {
                    $target = $tile.find(NO_DATA_SELECTOR);
                    val = NaN;
                }
                if (!isNaN(warn) && !isNaN(crit)) {

                    $target.removeClass("powerup-color-critical powerup-color-warning powerup-color-normal");
                    $target.removeClass("powerup-color-critical-blink powerup-color-warning-blink threeBlink");
                    $target.removeClass("powerup-color-nan");
                    if (isNaN(val)) {
                        $target
                            .addClass("powerup-color-nan")
                            .css("color", nan);
                    } else if (base == "low") {
                        if (val < warn) $target.addClass(class_norm);
                        else if (val < crit) $target.addClass(class_warn);
                        else $target.addClass(class_crit);
                    } else if (base == "high") {
                        if (val > warn) $target.addClass(class_norm);
                        else if (val > crit) $target.addClass(class_warn);
                        else $target.addClass(class_crit);
                    } else if (typeof (base) == "string" && base.startsWith("abs")) {
                        let abs = Number((base.split(',') || ["abs", "0"])[1]);
                        if (val >= abs + crit || val <= abs - crit) $target.addClass(class_crit);
                        else if (val >= abs + warn || val <= abs - warn) $target.addClass(class_warn);
                        else $target.addClass(class_norm);
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
                } else if (typeof (color) != "undefined") {
                    $target.css("color", color);
                }
                powerupsFired['PU_COLOR'] ? powerupsFired['PU_COLOR']++ : powerupsFired['PU_COLOR'] = 1;
            }
        });
    }

    pub.PUTopListColor = function () {
        $(TITLE_SELECTOR).each((i, el) => {
            let $title = $(el);
            let title = $title.text();
            let $tile = $title.parents(".grid-tile");

            if ($title.text().includes(PU_TOPCOLOR)) { //example !PU(topcolor):base=high;warn=90;crit=70
                if (pub.config.Powerups.debug) console.log("Powerup: toplist color power-up found");

                let args = argsplit(title, PU_TOPCOLOR);
                let vals = ((args.find(x => x[0] == "vals") || [])[1] || ".5,.7,.85,.94").split(',').map(x => Number(x));
                let colors = ((args.find(x => x[0] == "colors") || [])[1] || "#dc172a,#ef651f,#ffe11c,#6bcb8b,#2ab06f").split(',');

                let sorted = !!vals.reduce((n, item) => n !== false && item >= n && item);
                if (!sorted) {
                    console.log("Powerup: ERROR - toplist PU must have vals sorted ascending");
                    return false;
                }

                function getColor(val) {
                    let color;
                    vals.forEach((v, idx) => {
                        if (val < v && (!idx || val >= vals[idx - 1])) color = colors[idx];
                        else if (val >= v && (idx == vals.length - 1)) color = colors[idx + 1];
                    })
                    return color;
                }

                let $toplist = $tile.find(TOPLIST_SELECTOR);
                let $bignums = $toplist.children().first().children();
                let $bars = $toplist.children().last().children();

                $bignums.each((i, el) => {
                    let $bignum = $(el);
                    let bignum = Number($bignum.text());
                    let color = getColor(bignum);

                    let $bar = $bars.eq(i).find(TOPLIST_BAR_SELECTOR);
                    $bar.css("background-color", color);
                });
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

        $(MARKDOWN_SELECTOR).each((i, el) => {
            let $svgcontainer = $(el);
            let text = $svgcontainer.text();
            let $tile = $svgcontainer.parents(".grid-tile");

            if (!text.includes(PU_SVG)) return;
            if (pub.config.Powerups.debug) console.log("Powerup: svg power-up found");
            //let argstring = $svgcontainer.text().split(PU_SVG)[1].split('!')[0].trim();
            //let args = argstring.split(";").map(x => x.split("="));

            let args = argsplit(text, PU_SVG);
            let icon = (args.find(x => x[0] == "icon") || ["icon", "abort"])[1];
            let link = (args.find(x => x[0] == "link") || [])[1];
            let color = (args.find(x => x[0] == "color") || [])[1];
            let base = (args.find(x => x[0] == "base") || [])[1];
            let warn = Number((args.find(x => x[0] == "warn") || [])[1]);
            let crit = Number((args.find(x => x[0] == "crit") || [])[1]);
            let tooltip = (args.find(x => x[0] == "tooltip") || [])[1];

            let url = (args.argstring.match(/url=([^ ]+)/) || [])[1];
            //let url = (args.find(x => x[0] == "url") || [])[1]; //this does not work due to ; in urls
            if (url) url = url.trim();
            let argObj = {
                icon: icon,
                link: link,
                base: base,
                warn: warn,
                crit: crit,
                url: url
            }
            let val = pub.findLinkedVal(link);

            //swap in the svg
            var imgURL = pub.SVGLib() + encodeURI(`${icon}.svg`);
            fetch(imgURL)
                .then((response) => response.text())
                .then((svgtext) => {
                    $svgcontainer.empty();
                    let $svg = $(svgtext)
                        .attr("data-args", JSON.stringify(argObj))
                        .appendTo($svgcontainer);

                    $svg.removeClass("powerup-svg-critical powerup-svg-warning powerup-svg-normal");
                    $svg.removeClass("powerup-svg-critical-blink powerup-svg-warning-blink threeBlink");
                    $svg.removeClass("powerup-svg-nan");
                    if (isNaN(val)) {
                        $svg.addClass("powerup-svg-nan");
                    } else if (base == "low") {
                        if (val < warn) $svg.addClass(class_norm);
                        else if (val < crit) $svg.addClass(class_warn);
                        else $svg.addClass(class_crit);
                    } else if (base == "high") {
                        if (val > warn) $svg.addClass(class_norm);
                        else if (val > crit) $svg.addClass(class_warn);
                        else $svg.addClass(class_crit);
                    } else if (typeof (base) == "string" && base.startsWith("abs")) {
                        let abs = Number((base.split(',') || ["abs", "0"])[1]);
                        if (val >= abs + crit || val <= abs - crit) $target.addClass(class_crit);
                        else if (val >= abs + warn || val <= abs - warn) $target.addClass(class_warn);
                        else $target.addClass(class_norm);
                    } else if (color) {
                        $svg.css("fill", color);
                    }
                    if (url) {
                        let $a = $(`<a>`)
                            .attr('href', url)
                            .insertBefore($svg);
                        if (url.startsWith('http'))
                            $a.attr('target', '_blank');
                        $svg.appendTo($a);
                    }
                });

            //hide menu icon
            $tile.find(MENU_ICON_SELECTOR).hide();

            //add custom tooltip
            if (tooltip) {
                tooltip = tooltip.replace(/_/g, " ");
                let $tooltip = $tile.find(`.powerupTooltip`);
                if (!$tooltip.length) {
                    $tooltip = $("<div>")
                        .addClass("powerupTooltip")
                        .html(`<span>${tooltip}</span>`)
                        .appendTo($tile);
                }
            }

            powerupsFired['PU_SVG'] ? powerupsFired['PU_SVG']++ : powerupsFired['PU_SVG'] = 1;
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

        $(MARKDOWN_SELECTOR).each((i, el) => {
            let $svgcontainer = $(el);
            let $tile = $svgcontainer.parents(".grid-tile");
            let $svg = $svgcontainer.find("svg:first-of-type");

            if ($svg.length &&
                !$svg.hasClass('highcharts-root')) {
                let args = $svg.attr("data-args") || "{}";
                args = JSON.parse(args);

                let val = pub.findLinkedVal(args.link);

                $svg.removeClass("powerup-svg-critical powerup-svg-warning powerup-svg-normal");
                $svg.removeClass("powerup-svg-critical-blink powerup-svg-warning-blink threeBlink");
                $svg.removeClass("powerup-svg-nan");
                if (isNaN(val)) {
                    $svg.addClass("powerup-svg-nan");
                } else if (args.base == "low") {
                    if (val < args.warn) $svg.addClass(class_norm);
                    else if (val < args.crit) $svg.addClass(class_warn);
                    else $svg.addClass(class_crit);
                } else if (args.base == "high") {
                    if (val > args.warn) $svg.addClass(class_norm);
                    else if (val > args.crit) $svg.addClass(class_warn);
                    else $svg.addClass(class_crit);
                } else if (typeof (base) == "string" && base.startsWith("abs")) {
                    let abs = Number((base.split(',') || ["abs", "0"])[1]);
                    if (val >= abs + crit || val <= abs - crit) $target.addClass(class_crit);
                    else if (val >= abs + warn || val <= abs - warn) $target.addClass(class_warn);
                    else $target.addClass(class_norm);
                }

                //hide menu icon
                $tile.find(MENU_ICON_SELECTOR).hide();
            }
        });
    }

    pub.findLinkedVal = function (link) {
        //find val
        let link_text = `!PU\\(link\\):` + link;
        let re = new RegExp(link_text + '(?!\\w)');
        let val;
        $(TITLE_SELECTOR).each((i_link, el_link) => { //Check in titles first
            let $linktitle = $(el_link);

            if (re.test($linktitle.text())) {
                let $linktile = $linktitle.parents(".grid-tile");
                //val = Number($linktile.find(VAL_SELECTOR).text().replace(/,/g, ''));
                val = $linktile.find(VAL_SELECTOR).text();
            }
        });

        if (typeof val == "undefined") //Check in markdown tiles if link not found in titles
            $(MARKDOWN_SELECTOR).each((i_link, el_link) => {
                let $linkmd = $(el_link);

                if (re.test($linkmd.text())) {
                    let $linktile = $linkmd.parents(".grid-tile");
                    //val = Number($linktile.find(`h1`).text().replace(/\D+/g, ''));
                    val = $linktile.find(`h1`).text()
                }
            });
        if (typeof val == "undefined") {
            console.log("Powerup: ERROR - unable to match link: " + link_text);
            return undefined;
        } else { //cleanup & return val
            val = val.trim();

            //check for a plain number string
            let num_val = Number(val);
            if (!isNaN(num_val))
                return num_val;

            //check for a date string
            let date_val = new Date(val);
            if (!isNaN(date_val.getTime()))
                return date_val.getTime();

            //check for simple comma grouped number string
            let comma_val = Number(val.replace(/,/g, ''));
            if (!isNaN(comma_val))
                return comma_val;

            //worst case, strip all non-numeric and make it a number
            let last_val = Number(val.replace(/[^0-9.]/g, ''));
            if (!isNaN(last_val))
                return last_val;

            //somehow haven't found a number yet, just return whatever we found
            return val;
        }
    }

    pub.findLinkedTile = function (link) {
        //find val
        let link_text = `!PU\\(link\\):` + link;
        let re = new RegExp(link_text + '(?!\\w)');
        let $tile;
        $(TITLE_SELECTOR).each((i_link, el_link) => {
            let $linktitle = $(el_link);

            if (re.test($linktitle.text())) {
                let $linktile = $linktitle.parents(".grid-tile");
                $tile = $linktile;
            }
        });
        if (typeof $tile == "undefined") {
            console.log("Powerup: WARN - unable to match link: " + link_text);
            return undefined;
        } else {
            return $tile;
        }
    }

    pub.findLinkedMarkdown = function (link) {
        //find val
        let link_text = PU_LINK + link;
        let tile;
        $(MARKDOWN_SELECTOR).each((i, el) => {
            if ($(el).text().includes(link_text)) {
                tile = el;
            }
        });
        if (typeof tile == "undefined") {
            console.log("Powerup: ERROR - unable to match markdown with link: " + link_text);
            return undefined;
        } else {
            return tile;
        }
    }

    pub.sankeyPowerUp = function () {
        if (!pub.config.Powerups.sankeyPU) return;
        let re = /\/\d+(\/.*)?$/;
        (function (H) {

            //workaround from: https://github.com/highcharts/highcharts/issues/9300
            H.seriesTypes.sankey.prototype.destroy = function () {
                // Nodes must also be destroyed (#8682, #9300)
                this.data = [].concat(this.points, this.nodes);
                H.Series.prototype.destroy.call(this);
            };

            //workaround for "TypeError: this[c].destroy is not a function" error
            H.Point.prototype.destroyElements = function () {
                var point = this,
                    props = [
                        'graphic',
                        'dataLabel',
                        'dataLabelUpper',
                        'connector',
                        'shadowGroup'
                    ],
                    prop,
                    i = props.length;
                while (i--) {
                    prop = props[i];
                    if (point[prop]) {
                        point[prop] = point[prop].destroy();
                    }
                }
                // Handle point.dataLabels and point.connectors
                if (point.dataLabels) {
                    H.each(point.dataLabels, function (label) {
                        if (label.element) {
                            label.destroy();
                        }
                    });
                    delete point.dataLabels;
                }
                if (point.connectors) {
                    H.each(point.connectors, function (connector) {
                        if (connector.element) {
                            connector.destroy();
                        }
                    });
                    delete point.connectors;
                }
            }

            function readTableData(table, params) {
                let $table = $(table);
                let dataTable = [];
                let normalTable = []; //replaces dataTable
                let filteredTable = []; //replaces dataTable
                let touples = [];
                let goals = [];
                let apdexList = [];
                let actionDetailList = []; //replaces apdexList
                let UAPs = {
                    strings: [], //{actionName, key, val, count}
                    doubles: [], //{actionName, key, sum, count}
                    longs: [], //{actionName, key, sum, count}
                    dates: [] //{actionName, key, val, count}
                };
                let data = { 
                    touples: touples, 
                    goals: goals, 
                    apdexList: apdexList, 
                    UAPs: UAPs 
                };

                //new refactored approach
                normalTable = buildNormalTable($table);
                filteredTable = filterTable(normalTable);
                touples = buildTouples(filteredTable);
                goals = buildGoals(filteredTable);
                actionDetailList = buildactionDetailList(filteredTable);
                addEntryActionsToList(actionDetailList,filteredTable);
                addExitActionsToList(actionDetailList,filteredTable);
                addUAPStringToList(UAPs,filteredTable);
                addUAPDoubleToList(UAPs,filteredTable);
                addUAPLongToList(UAPs,filteredTable);
                addUAPDateToList(UAPs,filteredTable);
                addDurationToList(actionDetailList,filteredTable);
                addErrorsToList(actionDetailList,filteredTable);
                addApdexStylesToList(actionDetailList);
                touples = sortTouples(touples);
                return(data);


                function buildNormalTable(table){
                    $(table)
                        .children('div:first-of-type')
                        .children('div')
                        .each((colIdx, col) => {
                            let $rows = $(col).find('span');
                            let colName = $rows.eq(0).text();
                            let rowCount = $rows.length;
                            if (typeof (dataTable[colIdx]) == "undefined") dataTable[colIdx] = [];

                            $rows.each(function (rowIdx, rowEl) {
                                if (typeof (dataTable[colIdx][rowIdx]) == "undefined") dataTable[colIdx][rowIdx] = [];
                                if (typeof (normalTable[rowIdx]) == "undefined") normalTable[rowIdx] = {};
                                let row = $(rowEl).text();
                                if (row.substring(0, 1) != '[' || row.substr(-1) != ']') return;
                                let arr = [];
                                try {
                                    arr = JSON.parse(row);
                                } catch (e) { //Sometimes it's not valid JSON...
                                    arr = row.substr(1, row.length - 2)
                                        .split(', ');
                                };

                                try {
                                    switch(colName){
                                        case "useraction.matchingConversionGoals":
                                            arr = arr
                                                .map(x => Array.isArray(x) ? x.join(', ') : x);
                                        default:
                                    }
                                    arr = arr
                                        //.map(x => Array.isArray(x) ? x.join(', ') : x) //why are we doing this in the first place?
                                        //.map(x => typeof (x) != "string" ? x.toString() : x) //consider correctly handling types later
                                        .map(x => typeof (x) == "string" ? x.trim() : x)
                                        .map(x => typeof (x) == "string" ? x.replace(re, '/*$1') : x);//clean up strings
                                } catch (e) {
                                    console.warn([e, row]);
                                }
                                dataTable[colIdx][rowIdx] = arr; //safe-store the dataTable in case we want to manipulate later
                                normalTable[rowIdx][colName] = arr;
                            });
                        });
                    normalTable.shift();//row 0 was the titles
                    return normalTable;
                }

                function filterTable(normalTable){
                    let filteredTable = [];
                    normalTable.forEach((row,rowIdx)=>{
                        let filtered = row["useraction.name"].filter(x =>
                            x !== "[]" &&
                            x !== "");
                        if (Array.isArray(params.exclude) && params.exclude.length) {
                            params.exclude.forEach(ex => {
                                filtered = filtered.filter(x => !x.includes(ex));
                            });
                        }
                        if (params.convHack == "2") {
                            filtered.unshift("START");
                            filtered.push("END");
                        }
                        if (Array.isArray(params.filter)) {
                            params.filter.forEach(f => {
                                let fromIdx;
                                if (f.from !== undefined && f.to !== undefined){
                                    fromIdx = filtered.findIndex((x, i, arr) =>
                                    x === f.from
                                    && arr.length > i + 1
                                    && arr[i + 1] === f.to);
                                } else if (f.type !== undefined && f.key !== undefined && f.val !== undefined) {
                                    fromIdx = filtered.findIndex((x, i, arr) =>
                                    true);
                                } else {}
                                
                                if (fromIdx < 0) filtered = []; //this row filtered out
                            });
                        }
                        if(filtered.length){
                            row.filtered = filtered;
                            filteredTable.push(row);
                        }
                    });
                    return filteredTable;
                }

                function buildTouples(filteredTable){
                    let touples = [];
                    filteredTable.forEach(row=>{
                        let filtered = row.filtered;
                        for (let k = 0; k < filtered.length - 1; k++) { //useraction.name (or possibly useraction.matchingConversionGoals)
                            let touple = { from: filtered[k], to: filtered[k + 1] };
                            if (touple.from === touple.to) continue; // ignore self actions
                            if (params.convHack == "true" && k === 0) touple.from = "Start: " + touple.from;
                            if (params.convHack == "true" && k + 1 === filtered.length - 1) touple.to = "End: " + touple.to;

                            let l = touples.findIndex(t => t.from === touple.from && t.to === touple.to);
                            if (l < 0) {
                                touple.weight = 1;
                                touples.push(touple);
                            } else {
                                touples[l].weight++;
                            }
                        }
                    });
                    return touples;
                }

                function  buildGoals(filteredTable) {
                    let goals = [];
                    filteredTable.forEach(row=>{
                        let arr = row["useraction.matchingConversionGoals"];
                        for (let k = 0; k < arr.length; k++) { //matchingConversion goals
                            if (Array.isArray(arr[k]) && arr[k].length) {
                                let actionName = row["useraction.name"][k];
                                let goalsIdx = goals.findIndex(x => x.actionName == actionName);
                                if (goalsIdx < 0) goals.push({
                                    actionName: actionName,
                                    count: 1,
                                    svg: `<img src='${pub.SVGLib() + 'finishflag.svg'}' onload="DashboardPowerups.SVGInject(this)" class='powerup-sankey-icon powerup-icon-white'>`,
                                    goalName: (arr[k].substring(0, 1) == '[' && arr[k].substr(-1) == ']')
                                        ? arr[k].substr(1, arr[k].length - 2).trim()
                                        : arr[k].trim()
                                });
                                else goals[goalsIdx].count++;
                            }
                        }
                    });
                    return goals;
                }

                function buildactionDetailList(filteredTable){
                    let apdexList = [];
                    filteredTable.forEach(row=>{
                        let arr = row["useraction.apdexCategory"];
                        for (let k = 0; k < arr.length; k++) { //apdex
                            let val = arr[k];
                            if (val !== "") {
                                let actionName = row["useraction.name"][k];
                                let apdexIdx = apdexList.findIndex(x => x.actionName == actionName);

                                if (apdexIdx < 0) {
                                    let apdexObj = { actionName: actionName, satisfied: 0, tolerating: 0, frustrated: 0 };
                                    apdexIdx = apdexList.length;
                                    apdexList.push(apdexObj);
                                }
                                switch (val) {
                                    case 'SATISFIED':
                                        apdexList[apdexIdx].satisfied++;
                                        break;
                                    case 'TOLERATING':
                                        apdexList[apdexIdx].tolerating++;
                                        break;
                                    case 'FRUSTRATED':
                                        apdexList[apdexIdx].frustrated++;
                                        break;
                                }
                            }
                        }
                    });
                    return apdexList;
                } 
                            
                function addEntryActionsToList(apdexList,filteredTable){
                    filteredTable.forEach(row=>{
                        let arr = row["useraction.isEntryAction"];
                            for (let k = 0; k < arr.length; k++) { //entry actions
                            let val = arr[k];
                            if (val === "true") {
                                let actionName = row["useraction.name"][k];
                                let apdexIdx = apdexList.findIndex(x => x.actionName == actionName);

                                if (apdexIdx > -1) {
                                    if (!apdexList[apdexIdx].entryAction)
                                        apdexList[apdexIdx].entryAction = true;
                                    apdexList[apdexIdx].entryActionSVG = `<img src='${pub.SVGLib() + 'entry.svg'}'  onload="DashboardPowerups.SVGInject(this)" class='powerup-sankey-icon powerup-icon-white'>`;
                                }
                            }
                        }
                    });
                    return apdexList;
                }

                function addExitActionsToList(apdexList,filteredTable){
                    filteredTable.forEach(row=>{
                        let arr = row["useraction.isExitAction"];
                            for (let k = 0; k < arr.length; k++) { //exit actions
                                let val = arr[k];
                                if (val === "true") {
                                    let actionName = row["useraction.name"][k];
                                    let apdexIdx = apdexList.findIndex(x => x.actionName == actionName);

                                    if (apdexIdx > -1) {
                                        if (!apdexList[apdexIdx].exitAction)
                                            apdexList[apdexIdx].exitAction = true;
                                        apdexList[apdexIdx].exitActionSVG = `<img src='${pub.SVGLib() + 'exit.svg'}' onload="DashboardPowerups.SVGInject(this)" class='powerup-sankey-icon powerup-icon-white'>`;
                                    }
                                }
                            } 
                    });
                }
                            
                function addUAPStringToList(UAPs,filteredTable){
                    filteredTable.forEach(row=>{
                        let arr = row["useraction.isExitAction"];
                                arr.forEach((uapCol, uapColIdx) => {
                                    uapCol.forEach((uapVal, uapValIdx) => {
                                        let actionName = row["useraction.name"][k];
                                        let uapIdx = UAPs.strings.findIndex(x =>
                                            x.actionName == actionName &&
                                            x.key == uapVal.key &&
                                            x.val == uapVal.value
                                        );

                                        if (uapIdx < 0) {
                                            let uapObj = { actionName: actionName, key: uapVal.key, val: uapVal.value, count: 1 };
                                            UAPs.strings.push(uapObj);
                                        } else {
                                            let uap = UAPs.strings[uapIdx];
                                            uap.count++;
                                        }
                                    });
                                });
                            }); 
                        }
                            
                            /*else if (colIdx == 6) { //UAP-Double
                                let uapRow;

                                try {
                                    uapRow = JSON.parse(row);
                                } catch (e) {
                                    console.log("Powerup: Sankey - String: unable to parse JSON");
                                }
                                if (typeof (uapRow) == "undefined") return;

                                uapRow.forEach((uapCol, uapColIdx) => {
                                    uapCol.forEach((uapVal, uapValIdx) => {
                                        let actionName = dataTable[0][rowIdx][uapColIdx];
                                        let uapIdx = UAPs.doubles.findIndex(x =>
                                            x.actionName == actionName &&
                                            x.key == uapVal.key
                                        );
                                        let val = Number(uapVal.value);

                                        if (uapIdx < 0) {
                                            let uapObj = { actionName: actionName, key: uapVal.key, sum: val, count: 1 };
                                            UAPs.doubles.push(uapObj);
                                        } else {
                                            let uap = UAPs.doubles[uapIdx];
                                            uap.count++;
                                            uap.sum += val;
                                        }

                                    });
                                });
                            } else if (colIdx == 7) for (let k = 0; k < arr.length; k++) { //UAP-Long
                                let uapRow;

                                try {
                                    uapRow = JSON.parse(row);
                                } catch (e) {
                                    console.log("Powerup: Sankey - String: unable to parse JSON");
                                }
                                if (typeof (uapRow) == "undefined") return;

                                uapRow.forEach((uapCol, uapColIdx) => {
                                    uapCol.forEach((uapVal, uapValIdx) => {
                                        let actionName = dataTable[0][rowIdx][uapColIdx];
                                        let uapIdx = UAPs.longs.findIndex(x =>
                                            x.actionName == actionName &&
                                            x.key == uapVal.key
                                        );
                                        let val = Number(uapVal.value);

                                        if (uapIdx < 0) {
                                            let uapObj = { actionName: actionName, key: uapVal.key, sum: val, count: 1 };
                                            UAPs.longs.push(uapObj);
                                        } else {
                                            let uap = UAPs.longs[uapIdx];
                                            uap.count++;
                                            uap.sum += val;
                                        }

                                    });
                                });
                            } else if (colIdx == 8) for (let k = 0; k < arr.length; k++) { //UAP-Date
                                let uapRow;

                                try {
                                    uapRow = JSON.parse(row);
                                } catch (e) {
                                    console.log("Powerup: Sankey - String: unable to parse JSON");
                                }
                                if (typeof (uapRow) == "undefined") return;

                                uapRow.forEach((uapCol, uapColIdx) => {
                                    uapCol.forEach((uapVal, uapValIdx) => {
                                        let actionName = dataTable[0][rowIdx][uapColIdx];
                                        let uapIdx = UAPs.dates.findIndex(x =>
                                            x.actionName == actionName &&
                                            x.key == uapVal.key &&
                                            x.val == uapVal.value
                                        );

                                        if (uapIdx < 0) {
                                            let uapObj = { actionName: actionName, key: uapVal.key, val: uapVal.value, count: 1 };
                                            UAPs.dates.push(uapObj);
                                        } else {
                                            let uap = UAPs.dates[uapIdx];
                                            uap.count++;
                                        }

                                    });
                                });
                            } else if (colIdx == 9) for (let k = 0; k < arr.length; k++) { //duration
                                let val = arr[k];
                                if (val !== "") {
                                    let actionName = dataTable[0][rowIdx][k];
                                    let apdexIdx = apdexList.findIndex(x => x.actionName == actionName);

                                    if (apdexIdx > -1) {
                                        if (!Array.isArray(apdexList[apdexIdx].durations))
                                            apdexList[apdexIdx].durations = [];

                                        apdexList[apdexIdx].durations.push(val);
                                    }
                                }
                            } else if (colIdx == 10) {
                                for (let k = 0; k < arr.length; k++) { //errors
                                    let val = arr[k];
                                    if (val !== "") {
                                        let actionName = dataTable[0][rowIdx][k];
                                        let apdexIdx = apdexList.findIndex(x => x.actionName == actionName);

                                        if (apdexIdx > -1) {
                                            if (typeof (apdexList[apdexIdx].errors) == "undefined")
                                                apdexList[apdexIdx].errors = 0;

                                            let num = Number(val);
                                            if (!isNaN(num)) {
                                                if (num > 0) {
                                                    apdexList[apdexIdx].errors += num;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        })
                    });*/

                

                apdexList.forEach((apdex) => {
                    if (apdex.satisfied >= Math.max(apdex.tolerating, apdex.frustrated)) {
                        apdex.svg = `<img src="${pub.SVGLib() + 'smiley-happy-2.svg'}" onload="DashboardPowerups.SVGInject(this)" class='powerup-sankey-icon powerup-icon-green'></div>`;
                        apdex.name = "satisfied";
                        apdex.color = "#6bcb8b";
                    } else if (apdex.tolerating >= Math.max(apdex.satisfied, apdex.frustrated)) {
                        apdex.svg = `<img src="${pub.SVGLib() + 'smiley-neutral-2.svg'}" onload="DashboardPowerups.SVGInject(this)" class='powerup-sankey-icon powerup-icon-yellow'></div>`;
                        apdex.name = "tolerating";
                        apdex.color = "#ffee7c";
                    } else if (apdex.frustrated >= Math.max(apdex.tolerating, apdex.satisfied)) {
                        apdex.svg = `<img src="${pub.SVGLib() + 'smiley-unhappy-2.svg'}" onload="DashboardPowerups.SVGInject(this)" class='powerup-sankey-icon powerup-icon-red'></div>`;
                        apdex.name = "frustrated";
                        apdex.color = "#c41425";
                    } else {
                        apdex.svg = "";
                        apdex.color = "#6d6d6d";
                    }
                });
                touples = touples.sort((a, b) => b.weight - a.weight);

                return ({ touples: touples, goals: goals, apdexList: apdexList, UAPs: UAPs });
            }

            function newChart(data, container, params, limit = 20) {
                let options = {
                    type: 'sankey',
                    title: {
                        text: params.title
                    },
                    chart: {
                        marginLeft: 100,
                        marginBottom: 200,
                        marginRight: 100
                    },
                    series: [{
                        data: data.touples.slice(0, limit),
                        type: 'sankey',
                        name: 'UserActions',
                        cursor: 'crosshair',
                        clip: false,
                        dataLabels: {
                            enabled: true,
                            useHTML: true,
                            nodeFormat: '{point.display}',
                            padding: 0
                        },
                        nodes: [],
                        tooltip: {
                            nodeFormat: `<div class="powerup-sankey-tooltip">
                            <b>{point.name}</b><br>
                            UserActions in sample: {point.sum}<br>
                            <u>Apdex</u><br>
                            &nbsp;&nbsp; Satisfied: {point.apdexSatisfied}<br>
                            &nbsp;&nbsp; Tolerating: {point.apdexTolerating}<br>
                            &nbsp;&nbsp; Frustrated: {point.apdexFrustrated}<br>
                            Errors: {point.errors}<br>
                            Avg Duration: {point.avgDuration}ms<br>
                            Is entry action: {point.entryAction}<br>
                            Is exit action: {point.exitAction}<br>
                            Goal: {point.conversionGoal}<br>
                            ${uc(params.kpi)}: {point.${params.kpi}}
                            </div>
                        `.trim(),
                            pointFormat: `<div class="powerup-sankey-tooltip">
                        {point.fromNode.name} → {point.toNode.name}: <b>{point.weight}</b><br/>
                        </div>
                        `.trim(),
                            headerFormat: ''
                        }
                    }],
                    tooltip: {
                        useHTML: true,
                        outside: true,
                        borderWidth: 0,
                        backgroundColor: 'none',
                        shadow: false,
                        className: 'powerup-sankey-tooltip'
                    },
                    exporting: {
                        enabled: true,
                        fallbackToExportServer: true,
                        libURL: pub.POWERUP_EXT_URL + '3rdParty/Highcharts/lib',
                        buttons: {
                            contextButton: {
                                //    ["printChart", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG", "separator", "downloadCSV", "downloadXLS", "viewData", "openInCloud"]
                                menuItems: ["downloadSVG", "downloadPDF", "separator", "printChart"]
                            }
                        }
                    }
                }

                function uc(str) {
                    if (!str) return false;
                    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                }

                //convHack handling
                if (params.convHack == "2") {
                    let node = {
                        id: "START",
                        //column: 0,
                        display: "Start...",
                        color: "#b7b7b7"
                    }
                    options.series[0].nodes.push(node);
                    node = {
                        id: "END",
                        //column: 1,
                        display: "...End",
                        color: "#b7b7b7"
                    }
                    options.series[0].nodes.push(node);
                }

                data.apdexList.forEach(apdex => {
                    let node = {
                        id: apdex.actionName,
                        apdex: apdex,
                        apdexSatisfied: apdex.satisfied.toString(),
                        apdexTolerating: apdex.tolerating.toString(),
                        apdexFrustrated: apdex.frustrated.toString(),
                        entryAction: (apdex.entryAction ? 'true' : 'false'),
                        exitAction: (apdex.exitAction ? 'true' : 'false'),
                        errors: apdex.errors
                    }

                    //avg duration
                    if (Array.isArray(apdex.durations)) {
                        let durations = node.apdex.durations.map(x => Number(x.replace(/[,ms]*/g, '')));
                        let min = durations.reduce((acc, curr) => Math.min(acc, curr));
                        let max = durations.reduce((acc, curr) => Math.max(acc, curr));
                        let sum = durations.reduce((acc, curr) => acc + curr, 0);
                        let avg = sum / durations.length;
                        fmt = Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format;
                        node.avgDuration = fmt(avg);
                    }

                    //Color handling
                    if (params.colors == "apdex") {
                        node.color = apdex.color;
                    }

                    //Conversion goal handling
                    let goal = data.goals.find(x => x.actionName == apdex.actionName);
                    if (typeof (goal) != "undefined") {
                        node.goal = goal;
                        node.conversionGoal = goal.goalName;
                    } else {
                        node.conversionGoal = 'false';
                    }

                    //Revenue (UAPs)
                    let locale = navigator.language;
                    let rev = data.UAPs.doubles.find(x =>
                        x.actionName == apdex.actionName &&
                        x.key == params.kpi);
                    let style = { maximumFractionDigits: 2 };
                    if (params.kpicurr && params.kpicurr.length)
                        style = { style: 'currency', currency: params.kpicurr };
                    if (typeof (rev) != "undefined") {
                        node[params.kpi] = Intl.NumberFormat(locale, style).format(rev.sum);
                    } else {
                        node[params.kpi] = Intl.NumberFormat(locale, style).format(0);
                    }


                    //Node label
                    node.display = //apdex.svg +
                        (goal ? `<br>${goal.svg}` : "") +
                        (apdex.entryActionSVG ? `<br>${apdex.entryActionSVG}` : '') +
                        (apdex.exitActionSVG ? `<br>${apdex.exitActionSVG}` : '');

                    options.series[0].nodes.push(node);
                });

                let chart = H.chart(container, options, (chart) => {
                    let $container = $(container);
                    chart.limit = limit = Math.min(limit, data.touples.length);
                    chart.renderer.button('-', 10, 5)
                        .attr({ zIndex: 1100 })
                        .on('click', function (e) {
                            e.stopPropagation();
                            let newLimit = Math.max(Math.round(chart.limit * .5), 2);
                            if (chart && typeof (chart.destroy) != "undefined") {
                                try {
                                    chart.destroy();
                                } catch (e) {
                                    console.warn(`POWERUP: exception on chart.destroy on click`, e);
                                }
                            } else chart = null;
                            newChart(data, container, params, newLimit);
                        })
                        .add();
                    chart.renderer.button('+', 40, 5)
                        .attr({ zIndex: 1100 })
                        .on('click', function (e) {
                            e.stopPropagation();
                            let newLimit = Math.min(chart.limit * 2, data.touples.length);
                            if (chart && typeof (chart.destroy) != "undefined") {
                                try {
                                    chart.destroy();
                                } catch (e) {
                                    console.warn(`POWERUP: exception on chart.destroy on click`, e);
                                }
                            } else chart = null;
                            newChart(data, container, params, newLimit);
                        })
                        .add();
                    //display limit text
                    chart.renderer.text(`${limit}/${data.touples.length}`, 70, 25)
                        .add();
                    //display filter text
                    if (Array.isArray(params.filter)) {
                        let y = 55, inc = 20;
                        params.filter.forEach((f, fidx) => {
                            let txt;
                            if (f.from !== undefined && f.to !== undefined)
                                txt = `X - ${f.from} -> ${f.to}`;
                            else if (f.type !== undefined && f.key !== undefined && f.val !== undefined)
                                txt = `X - (${f.type}) ${f.key}=${f.val}`;
                            else txt = "X - ERROR";
                            chart.renderer.text(txt, 10, y)
                                .attr({ zIndex: 1100 })
                                .on('click', function (e) {
                                    e.stopPropagation();
                                    if (Array.isArray(params.filter)) params.filter.splice(fidx, 1);
                                    if (chart && typeof (chart.destroy) != "undefined") {
                                        try {
                                            chart.destroy();
                                        } catch (e) {
                                            console.warn(`POWERUP: exception on chart.destroy on click`, e);
                                        }
                                    } else chart = null;
                                    let data = readTableData(params.table, params);
                                    newChart(data, container, params, 20);
                                })
                                .add();
                            y += inc;
                        });
                    }

                    //redraw to help convHack use case
                    chart.setSize(undefined, undefined, false);

                    $container.find(".highcharts-plot-background")
                        .addClass("powerupPlotBackground");

                    //attach click handlers
                    $container.find(".highcharts-node")
                        .click(filterPopup);
                    $container.find(".highcharts-data-label")
                        .click(filterPopup);
                    $container.find(".highcharts-link")
                        .click(filterSankey);


                    function filterSankey(e) {
                        let el = e.target;
                        let $el = $(el);
                        let link;
                        if ($el.is(".highcharts-link"))
                            link = chart.series[0].data.find(x => x.graphic.element === el);
                        if (typeof (link) === "undefined") return false;

                        e.stopPropagation();
                        let filter = {
                            from: link.from,
                            to: link.to
                        }
                        if (!Array.isArray(params.filter)) params.filter = [];
                        params.filter.push(filter);
                        if (chart && typeof (chart.destroy) != "undefined") {
                            try {
                                chart.destroy();
                            } catch (e) {
                                console.warn(`POWERUP: exception on chart.destroy on click`, e);
                            }
                        } else chart = null;
                        let data = readTableData(params.table, params);
                        newChart(data, container, params, limit);
                    }

                    function filterProp(e) {
                        let el = e.target;
                        let $el = $(el);
                        let type = $el.data("type");
                        let key = $el.data("key");
                        let val = $el.data("val");
                        //alert(`${type}\n${key}\n${val}`);

                        //e.stopPropagation();
                        let filter = {
                            type: type,
                            key: key,
                            val: val
                        }
                        if (!Array.isArray(params.filter)) params.filter = [];
                        params.filter.push(filter);
                        if (chart && typeof (chart.destroy) != "undefined") {
                            try {
                                chart.destroy();
                            } catch (e) {
                                console.warn(`POWERUP: exception on chart.destroy on click`, e);
                            }
                        } else chart = null;
                        let data = readTableData(params.table, params);
                        newChart(data, container, params, limit);
                    }

                    function filterPopup(e) {
                        let el = e.target;
                        let $el = $(el);
                        let node;
                        if ($el.is(".highcharts-node"))
                            node = chart.series[0].nodes.find(x => x.graphic.element === el);
                        else if ($el.parents(".highcharts-data-label").length)
                            node = chart.series[0].nodes.find(x => x.dataLabel.div === $el.parents(".highcharts-data-label")[0]);
                        else
                            return false;

                        if (typeof (node) === "undefined"
                            || typeof (node.apdex) == "undefined") return false;
                        let name = node.apdex.actionName;
                        let fmt = Intl.NumberFormat().format;
                        let currFmt = fmt;
                        if (params.kpicurr && params.kpicurr.length) {
                            let locale = navigator.language;
                            let style = { style: 'currency', currency: params.kpicurr };
                            currFmt = Intl.NumberFormat(locale, style).format;
                        }
                        let link = USQL_URL + encodeURIComponent(`SELECT * FROM usersession WHERE useraction.name LIKE "${name.replace(/"/g, `""`)}"`);
                        let html = `<p><a href='${link}'><b>${name}</b></a>:</p><ul>`;

                        if (Array.isArray(node.apdex.durations)) {
                            let durations = node.apdex.durations.map(x => Number(x.replace(/[,ms]*/g, '')));
                            let min = durations.reduce((acc, curr) => Math.min(acc, curr));
                            let max = durations.reduce((acc, curr) => Math.max(acc, curr));
                            let sum = durations.reduce((acc, curr) => acc + curr, 0);
                            let avg = sum / durations.length;
                            html += `<li>Action Duration (ms): <ul>`;
                            html += `<li>min: ${fmt(min)}</li>`;
                            html += `<li>max: ${fmt(max)}</li>`;
                            html += `<li>avg: ${fmt(avg)}</li>`;
                            html += `</ul></li>`;
                        }
                        if (typeof (node.apdex.errors) != "undefined") {
                            html += `<li>Errors: ${node.apdex.errors}</li>`;
                        }

                        if (data.UAPs.doubles.length) {
                            html += `<li>Double Properties:<ul>`;
                            data.UAPs.doubles
                                .filter(x => x.actionName === name)
                                .sort((a, b) => {
                                    if (a.key.toLowerCase() < b.key.toLowerCase()) return -1;
                                    else if (a.key.toLowerCase() > b.key.toLowerCase()) return 1;
                                    else return a.sum - b.sum;
                                })
                                .forEach(x => {
                                    let fmter = (x.key === params.kpi ? currFmt : fmt);
                                    let sublink = link + encodeURIComponent(` AND useraction.doubleProperties.${x.key} IS NOT NULL`);
                                    html += `<li><a href="${sublink}">${x.key}</a>: <ul>`
                                        + `<li>sum: ${fmter(x.sum)}</li>`
                                        + `<li>count: ${fmt(x.count)}</li>`
                                        + `<li>avg: ${fmter(x.sum / x.count)}</li>`
                                        + `</ul></li>`;
                                });
                            html += `</ul></li>` //end double
                        }

                        if (data.UAPs.longs.length) {
                            html += `<li>Long Properties:<ul>`;
                            data.UAPs.longs
                                .filter(x => x.actionName === name)
                                .sort((a, b) => {
                                    if (a.key.toLowerCase() < b.key.toLowerCase()) return -1;
                                    else if (a.key.toLowerCase() > b.key.toLowerCase()) return 1;
                                    else return a.sum - b.sum;
                                })
                                .forEach(x => {
                                    let sublink = link + encodeURIComponent(` AND useraction.longProperties.${x.key} IS NOT NULL`);
                                    html += `<li><a href="${sublink}">${x.key}</a>: <ul>`
                                        + `<li>sum: ${fmt(x.sum)}</li>`
                                        + `<li>count: ${fmt(x.count)}</li>`
                                        + `<li>avg: ${fmt(x.sum / x.count)}</li>`
                                        + `</ul></li>`;
                                });
                            html += `</ul></li>` //end long
                        }

                        if (data.UAPs.strings.length) {
                            html += `<li>String Properties:<ul>`;
                            let lastKey, list = "";
                            data.UAPs.strings
                                .filter(x => x.actionName === name)
                                .sort((a, b) => {
                                    if (a.key.toLowerCase() < b.key.toLowerCase()) return -1;
                                    else if (a.key.toLowerCase() > b.key.toLowerCase()) return 1;
                                    else return b.count - a.count;
                                })
                                .forEach(x => {
                                    if (x.key !== lastKey) {
                                        if (list.length) list += `</ul></li>`;
                                        html += list;
                                        let sublink = link + encodeURIComponent(` AND useraction.stringProperties.${x.key} IS NOT NULL`);
                                        list = `<li><a href="${sublink}">${x.key}</a>:<ul>`;
                                    }
                                    let sublink = link + encodeURIComponent(` AND useraction.stringProperties.${x.key} = "${x.val}"`);
                                    list += `<li><a href="${sublink}">${x.val}</a> 
                                        (<a href="javascript:" class="powerupFilterProp" data-type="string" 
                                        data-key="${x.key}" data-val="${x.val}">${x.count}</a>)
                                        </li>`;
                                    lastKey = x.key;
                                });
                            if (list.length) list += `</ul></li>`;
                            html += list;
                            html += `</ul></li>` //end string
                        }

                        if (data.UAPs.dates.length) {
                            html += `<li>Date Properties:<ul>`;
                            lastKey = ""; list = "";
                            data.UAPs.dates
                                .filter(x => x.actionName === name)
                                .sort((a, b) => {
                                    if (a.key.toLowerCase() < b.key.toLowerCase()) return -1;
                                    else if (a.key.toLowerCase() > b.key.toLowerCase()) return 1;
                                    else return b.count - a.count;
                                })
                                .forEach(x => {
                                    if (x.key !== lastKey) {
                                        if (list.length) list += `</ul></li>`;
                                        html += list;
                                        let sublink = link + encodeURIComponent(` AND useraction.dateProperties.${x.key} IS NOT NULL`);
                                        list = `<li><a href="${sublink}">${x.key}</a>:<ul>`;
                                    }
                                    let sublink = link + encodeURIComponent(` AND useraction.dateProperties.${x.key} = ${x.val}`);
                                    list += `<li><a href="${sublink}">${x.val}</a> (${x.count})</li>`;
                                    lastKey = x.key;
                                });
                            if (list.length) list += `</ul></li>`;
                            html += list;
                            html += `</ul></li>` //end date
                        }

                        let $popup = $("<div>")
                            .addClass("powerupSankeyDetailPopup")
                            .html(html)
                            .click(() => { $popup.remove(); })
                            .appendTo(container);

                        $popup.find(`.powerupFilterProp`)
                            .on("click", filterProp);
                    }
                });

                return chart;
            }

            function findContainer(link) {
                let container, markdown;
                $(MARKDOWN_SELECTOR)
                    .each(function (i, el) {
                        let $el = $(el);
                        let text = $el.text();
                        if (!text.includes(PU_LINK)) return;
                        if (text.split(PU_LINK)[1].includes(link))
                            markdown = el;
                    });

                if (markdown) { // change behavior here. instead of swapping out the markdown, hide it and add a container div
                    let $containers = $(markdown).siblings("[data-highcharts-chart]").children(".highcharts-container");
                    $containers.each((i, c) => { //sankey already exists, destroy and recreate later
                        let oldChart = Highcharts.charts
                            .filter(x => typeof (x) !== "undefined")
                            .find(x => x.container === c);
                        container = $(c).parent().get(0);
                        if (oldChart) oldChart.destroy();
                    });
                    if (!$containers.length) { //hide the markdown, add a container
                        $(markdown).hide();
                        let $c = $("<div>")
                            .addClass("powerupHighchartsContainer")
                            .insertAfter(markdown);
                        container = $c.get(0);
                    }
                }
                return container;
            }

            function destroyChartsAndContainers(tile) {
                let $tile = $(tile);
                let $containers = $tile.find(".highcharts-container");

                $containers.each((i, c) => {
                    let oldChart = H.charts
                        .filter(x => typeof (x) !== "undefined")
                        .find(x => x.container === c);
                    if (oldChart) oldChart.destory();
                    $(c).remove();
                })
            }


            //$(TABLE_SELECTOR)
            $(TITLE_SELECTOR)
                .each(function (i, el) {
                    let $title = $(el);
                    let title = $title.text();
                    if (!title.includes(PU_SANKEY)) return;
                    let $tile = $title.parents(TILE_SELECTOR);
                    let $table = $tile.find(TABLE_SELECTOR);

                    let chartTitle = title.split(PU_SANKEY)[0];
                    let args = argsplit(title, PU_SANKEY);
                    if (args.length < 1) {
                        if (pub.config.Powerups.debug)
                            console.log("Powerup: ERROR - invalid argstring: " + args.argstring);
                        return false;
                    }
                    let link = args.find(x => x[0] == "link")[1];
                    let kpi = (args.find(x => x[0] == "kpi") || [])[1];
                    let kpicurr = (args.find(x => x[0] == "kpicurr") || [])[1];
                    let convHack = (args.find(x => x[0] == "convHack") || [])[1] || "2";
                    let colors = (args.find(x => x[0] == "colors") || [])[1] || "apdex";
                    let exclude = (args.find(x => x[0] == "exclude") || [])[1];
                    if (exclude) exclude = exclude.split(",");

                    let container = findContainer(link);
                    if (typeof (container) == "undefined") {
                        console.log("Powerup: WARN - Sankey container is undefined.");
                        return false;
                    }
                    if (!$table.length) { //USQL error or no data
                        //destroyChartsAndContainers($tile.get(0));
                        return false;
                    }

                    let params = {
                        title: chartTitle,
                        kpi: kpi,
                        kpicurr: kpicurr,
                        convHack: convHack,
                        colors: colors,
                        exclude: exclude,
                        table: $table
                    };
                    let data = readTableData($table.get(0), params);
                    let sankey = newChart(data, container, params);
                    $(".highcharts-exporting-group").addClass("powerupVisible");
                    powerupsFired['PU_SANKEY'] ? powerupsFired['PU_SANKEY']++ : powerupsFired['PU_SANKEY'] = 1;
                });
            return true;
        })(Highcharts);
    }

    pub.mapPowerUp = function () {
        if (!pub.config.Powerups.worldmapPU) return;


        const callback = function (mutationsList, observer) {
            observer.disconnect(); //stop listening while we make some changes
            setTimeout(() => {
                transformMap(mutationsList, observer);
            }, 50); //Sleep a bit in case there was a lot of mutations

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
            let tabletitle = $tabletitle.text();
            let $tabletile = $tabletitle.parents(TILE_SELECTOR);

            if (tabletitle.includes(PU_MAP)) {
                let titletokens = $tabletitle.text().split(PU_MAP);
                //let argstring = $tabletitle.text().split(PU_MAP)[1].split('!')[0].trim();
                //let args = argstring.split(";").map(x => x.split("="));
                let args = argsplit(tabletitle, PU_MAP);

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
                powerupsFired['PU_MAP'] ? powerupsFired['PU_MAP']++ : powerupsFired['PU_MAP'] = 1;
            }
        });




    };

    pub.PUHeatmap = function (chart, title, newContainer) { //example: !PU(heatmap):vals=.5,.7,.85,.94;names=Unacceptable,Poor,Fair,Good,Excellent;colors=#dc172a,#ef651f,#ffe11c,#6bcb8b,#2ab06f
        if (!pub.config.Powerups.heatmapPU) return;
        if (chart.series.length < 1 || chart.series[0].data.length < 1) return;
        //let argstring = title.split(PU_HEATMAP)[1].split('!')[0];
        //let args = argstring.split(";").map(x => x.split("="));
        let args = argsplit(title, PU_HEATMAP);

        let txtColor = (args.find(x => x[0] == "txtColor") || [])[1] || "#ffffff";
        //let interval = (args.find(x => x[0] == "int") || [])[1] || "1d";
        let colorAxis = {};
        let ms = Number((args.find(x => x[0] == "ms") || [])[1] || "86400000");
        let fmt = (args.find(x => x[0] == "fmt") || [])[1] || "MM/DD";
        let scale = Number((args.find(x => x[0] == "scale") || [])[1] || "1");

        //determine fixed color or colorAxis
        //if (argstring.includes("vals")) {
        if (args.argstring.includes("vals")) {
            let dataClasses = colorAxis.dataClasses = [];
            let vals = ((args.find(x => x[0] == "vals") || [])[1] || ".5,.7,.85,.94").split(',').map(x => Number(x));
            let names = ((args.find(x => x[0] == "names") || [])[1] || "Unacceptable,Poor,Fair,Good,Excellent").split(',');
            let colors = ((args.find(x => x[0] == "colors") || [])[1] || "#dc172a,#ef651f,#ffe11c,#6bcb8b,#2ab06f").split(',');

            let sorted = !!vals.reduce((n, item) => n !== false && item >= n && item);
            if (!sorted) {
                console.log("Powerup: ERROR - Heatmap PU must have vals sorted ascending");
                return false;
            }

            for (let i = 0; i < vals.length; i++) {
                let obj = {};
                if (i === 0) {
                    obj.to = vals[i];
                    obj.name = names[i];
                    obj.color = colors[i];
                    dataClasses.push(obj);
                    obj = {};
                }

                obj.from = vals[i];
                obj.name = names[i + 1];
                obj.color = colors[i + 1];
                if (i < vals.length - 1) obj.to = vals[i + 1];
                dataClasses.push(obj);
            }
        } else {
            let min = (args.find(x => x[0] == "min") || [])[1];
            let max = (args.find(x => x[0] == "max") || [])[1];
            let minColor = (args.find(x => x[0] == "minColor") || [])[1];
            let maxColor = (args.find(x => x[0] == "maxColor") || [])[1];

            colorAxis = {};
            if (typeof (min) !== "undefined") colorAxis.min = min;
            if (typeof (max) !== "undefined") colorAxis.max = max;
            if (typeof (minColor) !== "undefined") colorAxis.minColor = d3.rgb(minColor).toString();
            if (typeof (maxColor) !== "undefined") colorAxis.maxColor = d3.rgb(maxColor).toString();
        }

        //handle containers
        let oldContainer = chart.container;
        let $tile = $(oldContainer).parents(TILE_SELECTOR);
        let $newContainer;
        if (typeof (newContainer) !== "undefined") {
            let oldChart = Highcharts.charts
                .filter(x => typeof (x) !== "undefined")
                .find(x => x.renderTo === newContainer);
            if (oldChart) oldChart.destroy();
            $newContainer = $(newContainer);
        } else {
            $newContainer = $("<div>")
                .addClass("powerupHeatmap")
                .insertAfter(oldContainer);
            newContainer = $newContainer[0];
            chart.newContainer = newContainer;
        }
        let $legend = $tile.find(LEGEND_SELECTOR);
        if ($legend.children().last().text().endsWith("more")) {
            $legend.children().last().text("ERROR: too many series");
        }

        //data manipulation
        let newData = [];
        let yNames = [];
        let categories = [];
        let oldCategories = [... new Set(chart.series.map(x => x.data)
            .flat().map(x => x.category))];
        let categoryMap = new Map();
        if (ms && fmt) {
            oldCategories.forEach(x => {
                if (!categoryMap.has(x)) {
                    let newCategory = dateFns.format(
                        parseInt(x / ms) * ms,
                        fmt);
                    categoryMap.set(x, newCategory);
                }
            });
            categories = [... new Set(categoryMap.values())];
        }
        function getPointCategoryName(point, dimension) {
            var series = point.series,
                isY = dimension === 'y',
                axis = series[isY ? 'yAxis' : 'xAxis'];
            return axis.categories[point[isY ? 'y' : 'x']];
        }
        chart.series.forEach((s, sIdx) => {
            if (s.type != "column") {
                console.log("Powerup: ERROR - Please use a bar chart as a source for heatmap powerup.");
                return;
            }

            //come up with a better y category
            let series_name = s.name;
            if ($legend.length) {
                let $colorMatches = $legend.find(`svg[fill='${s.color}']`);
                let name;
                if ($colorMatches.length == 1)
                    name = $colorMatches.parents(".gwt-HTML").text();
                else if ($colorMatches.length > 1)
                    name = `ERROR: duplicate color in legend`;
                else if ($colorMatches.length < 1)
                    name = `ERROR: color not found in legend`;
                if (name.length) series_name = name;
            }
            yNames.push(series_name);

            //map new X values
            s.data.forEach((d) => {
                if (ms && fmt) {
                    d.newCat = categoryMap.get(d.category);
                    d.newCatIdx = categories.findIndex(x => x === d.newCat);
                } else {
                    const date = new Date(d.category);
                    d.newCat = date.toLocaleDateString();
                    d.newCatIdx = categories.findIndex(x => x === d.newCat);
                    if (d.newCatIdx < 0) {
                        d.newCatIdx = categories.length;
                        categories.push(d.newCat);
                    }
                }
            });

            //aggregate
            categories.forEach((c, cIdx) => {
                let avg = s.data.filter((d) => d.newCatIdx === cIdx)
                    .reduce((total, d, idx, arr) => {
                        total += d.y;
                        if (idx === arr.length - 1) { //final step, calc the avg
                            let len = arr.filter(x => x.y !== null).length;
                            if (!len) return NaN;
                            else return total / len;
                        } else { //not final step, keep summing everything up
                            return total;
                        }
                    }, 0);
                avg = avg * scale;
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
            dataLabels: { ...DATALABELS },

        };
        newSeries.dataLabels.format = '{point.value:.2f}';
        let newChartOpts = {
            type: 'heatmap',
            series: [newSeries],
            title: {
                text: title.split(PU_HEATMAP)[0] + " Heatmap"
            },
            credits: {
                enabled: false
            },
            xAxis: {
                categories: categories,
                reversed: (ms && fmt ? false : true)
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
                        title.split(' ')[0] + ':<b>' + this.point.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '</b>';
                }
            },
            colorAxis: colorAxis,
            exporting: {
                enabled: true,
                fallbackToExportServer: true,
                libURL: pub.POWERUP_EXT_URL + '3rdParty/Highcharts/lib',
                buttons: {
                    contextButton: {
                        //    ["printChart", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG", "separator", "downloadCSV", "downloadXLS", "viewData", "openInCloud"]
                        menuItems: ["downloadSVG", "downloadPDF", "separator", "downloadCSV", "downloadXLS", "printChart"]
                    }
                }
            }
        }

        //$(oldContainer).css('z-index', -100);
        $(oldContainer).hide();
        $newContainer.html('');
        let newChart = Highcharts.chart(newContainer, newChartOpts, () => {
            $newContainer.find("tspan").attr("stroke", "");
            $newContainer.find(".highcharts-data-label text")
                .css("font-weight", "")
                .css("fill", txtColor)
                .css("font-size", "10px");
            $newContainer.find("rect.highcharts-point").attr("stroke", "gray");
        });
        //newChart.poweredup = true;
        $(".highcharts-exporting-group").addClass("powerupVisible");
        return true;
    }

    pub.PUfunnel = function () {
        if (!pub.config.Powerups.funnelPU) return;
        let mainPromise = new $.Deferred();
        let $funnels = $(FUNNEL_SELECTOR);
        if (!$funnels.length) { //no funnels on this dashboard
            if (D3MutexBlocking) { //old Mutex
                console.log("Powerup: DEBUG - D3MutexBlocking but no D3s. Clear it.");
                D3MutexBlocking = false;
                return false;
            } else { //nothing to do
                return false;
            }
        } else { //funnels found
            if (D3MutexBlocking) { //already running, block it
                console.log("Powerup: D3MutexBlocked Funnel Powerup");
                return false;
            } else { //normal
                D3MutexBlocking = true;
                $.when(mainPromise).always(() => { //be sure to clear mutex when done
                    D3MutexBlocking = false;
                })
            }
        }


        const options = {
            chart: {
                curve: {
                    enabled: true,
                    height: 40
                },
                //animate: 50,
                bottomPinch: 1
            },
            block: {
                minHeight: 100,
                dynamicHeight: false,
                dynamicSlope: false,
                barOverlay: false,
                fill: {
                    type: 'gradient',
                    //scale: 
                },
                //highlight: true
            },
            label: {
                fill: "#fff",
                enabled: false //make html ones instead
            },
            //tooltip: {
            //    enabled: true,
            //},
            //events: {
            //click: {
            //    block: funnelClickHandler
            //}
            //}
        }

        $(FUNNEL_SELECTOR).each((i, el) => {
            let $funnelpanel = $(el);
            let $tile = $funnelpanel.parents(TILE_SELECTOR);
            let $title = $tile.find(TITLE_SELECTOR);
            let title = $title.text();

            if ($title.text().includes(PU_FUNNEL)) {
                //let argstring = $title.text().split(PU_FUNNEL)[1].split('!')[0];
                //let args = argstring.split(";").map(x => x.split("="));
                let args = argsplit(title, PU_FUNNEL);

                let mode = args.find(x => x[0] == "mode")[1];
                let small = Number((args.find(x => x[0] == "small") || [])[1]);
                let big = Number((args.find(x => x[0] == "big") || [])[1]);
                let links = (args.find(x => x[0] == "links") || [])[1];

                let $linkstile = $(pub.findLinkedMarkdown(links));
                let mdtext = $linkstile.text();
                $linkstile.hide();
                const linkRE = /^(?:\d+=)(.*)/gm;
                let linkList = Array.from(mdtext.matchAll(linkRE))
                    .map(x => x[1]);

                //styling
                switch (mode) {
                    case "slope":
                        options.block.dynamicSlope = true;
                        options.block.dynamicHeight = false;
                        options.block.barOverlay = false;
                        break;
                    case "bar":
                        options.block.dynamicSlope = false;
                        options.block.dynamicHeight = false;
                        options.block.barOverlay = true;
                        break;
                    case "height":
                    default:
                        options.block.dynamicSlope = false;
                        options.block.dynamicHeight = true;
                        options.block.barOverlay = false;
                        break;
                }

                //get the data
                let $steps = $funnelpanel.children(`div:nth-of-type(2)`).children();
                let numSteps = $steps.length;
                let steps = [];
                $steps.each((i, stepEl) => {
                    let $stepEl = $(stepEl);
                    let step = {};
                    step.abs = Number($stepEl.find(`div:first-of-type > span:nth-of-type(1)`).text().replace(/[,]*/g, ''));
                    step.percent = Number($stepEl.find(`div:first-of-type > span:nth-of-type(2)`).text().replace(/[()%]*/g, ''));
                    step.dPercent = Number($stepEl.children(`span:nth-of-type(1)`).text().replace(/[()%]*/g, ''));
                    step.dTime = $stepEl.children(`span:nth-of-type(2)`).text();
                    step.name = $stepEl.children(`div:nth-of-type(2)`).text();

                    step.label = step.name;
                    step.value = step.abs;
                    step.customFormattedValue = `
                        ${step.name}: <b>${step.abs}</b> (${step.percent}%)<br>
                        <small>${step.dPercent}% ${step.dTime}</small>
                        `.trim();

                    steps.push(step);
                })

                //hide old stuff
                $funnelpanel.find(`div:nth-of-type(1)`).hide();
                $funnelpanel.find(`div:nth-of-type(2)`).hide();

                //new funnel
                let $funnelContainer = $funnelpanel.find(".powerupFunnelContainer");
                if (!$funnelContainer.length)
                    $funnelContainer = $("<div>")
                        .addClass("powerupFunnelContainer")
                        .appendTo($funnelpanel);

                let chart = new D3Funnel($funnelContainer[0]);
                chart.draw(steps, options);

                //add HTML labels
                let tries = 5;
                function updateLabels() {
                    steps.forEach((step, idx) => {
                        let $path = $funnelContainer.find(`svg g:nth-of-type(${idx + 1}) path`);
                        let path = $path.get(0);
                        let pathBBox = path.getBBox();
                        let $label = $("<div>")
                            .addClass("powerupFunnelLabel")
                            .html(step.customFormattedValue)
                            .appendTo($funnelContainer);

                        let cp = $funnelContainer.position();
                        let x = cp.left + $funnelContainer.width() / 2 - $label.width() / 2;
                        let y = pathBBox.y + pathBBox.height / 2 - $label.height() / 2;
                        $label.css({ top: y, left: x });


                        //update background color too
                        let $grad = $funnelContainer.find(`svg linearGradient:nth-of-type(${idx + 1})`).eq(0);
                        let color;
                        if (step.dPercent < big * -1)
                            color = "#dc172a"; //bold red
                        else if (step.dPercent > big)
                            color = "#54c27d"; //bold green
                        else if (step.dPercent < small * -1)
                            color = "#f28289"; //light red
                        else if (step.dPercent > small)
                            color = "#99dea8"; //light green
                        else
                            color = "#898989"; //gray

                        function shade(c1) {
                            const { r, g, b } = d3.color(c1);
                            const shade = -0.2;
                            const t = shade < 0 ? 0 : 255;
                            const p = shade < 0 ? shade * -1 : shade;
                            const converted = 0x1000000 +
                                ((Math.round((t - r) * p) + r) * 0x10000) +
                                ((Math.round((t - g) * p) + g) * 0x100) +
                                (Math.round((t - b) * p) + b);
                            return `#${converted.toString(16).slice(1)}`; //replicate logic from d3-funnel gradient
                        }
                        let sideColor = shade(color);

                        function updateGradients(c1, c2) {
                            $grad.find("stop").each((stopI, stopEl) => {
                                switch (stopI) {
                                    case 0:
                                    case 3:
                                        $(stopEl).css("stop-color", c2);
                                        break;
                                    case 1:
                                    case 2:
                                    default:
                                        $(stopEl).css("stop-color", c1);
                                }
                            });
                        }
                        updateGradients(color, sideColor);
                        if (idx === 0) { //pain the back of funnel
                            let $back = $funnelContainer.find("svg > path").eq(0);
                            $back.attr("fill", sideColor);
                        }

                        //fix hovering
                        let hColor = "#008cdb";
                        let hSideColor = shade(hColor);
                        $path.add($label).hover(
                            () => { updateGradients(hColor, hSideColor); },
                            () => { updateGradients(color, sideColor); });


                        //add drilldowns
                        if (typeof (linkList[idx]) == "string")
                            $path.add($label).click(
                                () => { window.location.href = linkList[idx] });

                    });
                    console.log("Powerup: Funnel power up found");
                    powerupsFired['PU_FUNNEL'] ? powerupsFired['PU_FUNNEL']++ : powerupsFired['PU_FUNNEL'] = 1;
                    mainPromise.resolve(true);
                }
                function checkForDoneDrawing() {
                    if (!tries) {
                        mainPromise.resolve(false);
                        return false;
                    }
                    let funnelLen = $funnelContainer.find(`svg g`).length;
                    if (funnelLen == steps.length)
                        updateLabels();
                    else {
                        tries--;
                        console.log(`checkForDoneDrawing: ${funnelLen} < ${steps.length}, tries: ${tries}`);
                        setTimeout(checkForDoneDrawing, 100);
                    }
                }
                checkForDoneDrawing();
            } else {
                mainPromise.resolve(false);
            }
        });
        return mainPromise;
    }

    pub.PUMath = function () {  //example: !PU(math):exp=(x1+x2+x3+x4)/4;scope=x1,x2,x3,x4:link4;color=blue
        if (!pub.config.Powerups.mathPU) return;

        //find math PUs
        $(MARKDOWN_SELECTOR).each((i, el) => {
            let $container = $(el);
            let $tile = $container.parents(".grid-tile");
            let text = $container.text();

            if (!text.includes(PU_MATH)) { //markdown block has mathPU, do work
                return;
            }
            if (pub.config.Powerups.debug) console.log("Powerup: math power-up found");
            $container.children(".powerupMath").remove(); //remove old maths before we get started
            $container.children().each((i, el) => { //handle each paragraph individually
                let $para = $(el);
                let paratxt = $para.text();
                if (!paratxt.includes(PU_MATH)) return; //not important, next paragraph

                let args = argsplit(paratxt, PU_MATH);

                let exp = args.find(x => x[0] == "exp")[1].replace(/ /g, '');
                let scopeStr = args.find(x => x[0] == "scope")[1];
                let color = (args.find(x => x[0] == "color") || [])[1] || "white";
                let size = (args.find(x => x[0] == "size") || [])[1] || "36px";
                let base = (args.find(x => x[0] == "base") || [])[1] || "";
                let warn = Number((args.find(x => x[0] == "warn") || [])[1]);
                let crit = Number((args.find(x => x[0] == "crit") || [])[1]);
                let dates = (args.find(x => x[0] == "dates") || [])[1] == "true" ? true : false;
                let timeunit = (args.find(x => x[0] == "timeunit") || [])[1] || "ms";
                let full = (args.find(x => x[0] == "full") || [])[1] == "false" ? false : true;
                let currency = (args.find(x => x[0] == "currency") || [])[1];

                let scope = scopeStr.trim().split(',')
                    .map(x => (x.includes(':')
                        ? {
                            name: x.split(':')[0],
                            link: x.split(':')[1],
                        }
                        : {
                            name: x,
                            link: x
                        })
                    )

                scope.forEach(s => {
                    s.val = pub.findLinkedVal(s.link);
                    if (dates) {
                        let tmpdate = new Date(s.val);
                        let tmptime = tmpdate.getTime();
                        if (!isNaN(tmptime)) s.val = tmptime;
                    }
                });


                //generate weird mexp formats
                let tokens = scope.map(x => ({
                    type: 3,
                    token: x.name,
                    show: x.name,
                    value: x.name
                }));
                let pairs = {}
                scope.forEach(x => {
                    let token = x.name;
                    pairs[token] = x.val;
                });

                //calculate
                let val = mexp.eval(exp, tokens, pairs);

                //handle units
                if (dates) {
                    switch (timeunit) {
                        case "s":
                            val = val / 1000;
                            break;
                        case "m":
                            val = val / (1000 * 60);
                            break;
                        case "h":
                            val = val / (1000 * 60 * 60);
                            break;
                        case "d":
                            val = val / (1000 * 60 * 60 * 24);
                            break;
                        case "ms":
                        default:
                            val = val;
                    }
                }

                //format
                let fmt;
                if (currency)
                    fmt = Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format;
                else
                    fmt = Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format;
                let sVal = fmt(val);

                //swap markdown content
                let $h1;
                if (full) {
                    $container.hide();
                    let $newContainer = $("<div>")
                        .addClass("powerupMath")
                        .insertAfter($container);
                    $h1 = $("<h1>")
                        .text(sVal)
                        .css("font-size", size)
                        .appendTo($newContainer);
                } else {
                    $para.hide();
                    $h1 = $("<h1>")
                        .text(sVal)
                        .css("font-size", size)
                        .addClass("powerupMath")
                        .insertAfter($para);
                    $h1.siblings().addClass("powerupMathText");
                    $para.parent().attr("class", "");
                }

                //thresholds
                if (base && !isNaN(warn) && !isNaN(crit)) {
                    switch (base) {
                        case "low":
                            if (val < warn) $h1.addClass(`powerup-color-normal`);
                            else if (val < crit) $h1.addClass(`powerup-color-warning`);
                            else $h1.addClass(`powerup-color-critical`);
                            break;
                        case "high":
                            if (val > warn) $h1.addClass(`powerup-color-normal`);
                            else if (val > crit) $h1.addClass(`powerup-color-warning`);
                            else $h1.addClass(`powerup-color-critical`);
                            break;
                        default:
                            $h1.css("color", color);
                            break;
                    }
                } else {
                    $h1.css("color", color);
                }

                powerupsFired['PU_MATH'] ? powerupsFired['PU_MATH']++ : powerupsFired['PU_MATH'] = 1;
            });
        });
    }

    pub.PUCompare = function () {  //example: !PU(compare):link=link1;lt=green;gt=red;eq=yellow
        if (!pub.config.Powerups.comparePU) return;
        let count = 0;

        //find compare PUs
        $(TITLE_SELECTOR).each((i, el) => {
            let $title = $(el);
            let $tile = $title.parents(".grid-tile");
            let text = $title.text();
            let $bignum = $tile.find(BIGNUM_SELECTOR);

            if (!text.includes(PU_COMPARE)) return;
            if (pub.config.Powerups.debug) console.log("Powerup: compare power-up found");
            //let argstring = text.split(PU_COMPARE)[1].split('!')[0];
            //let args = argstring.split(";").map(x => x.split("="));
            let args = argsplit(text, PU_COMPARE);

            let link = args.find(x => x[0] == "link")[1];
            let lt = (args.find(x => x[0] == "lt") || [])[1] || "green";
            let gt = (args.find(x => x[0] == "gt") || [])[1] || "red";
            let eq = (args.find(x => x[0] == "eq") || [])[1] || "yellow";

            let linkval = pub.findLinkedVal(link);
            let val = Number($tile.find(VAL_SELECTOR).text().replace(/,/g, ''));

            //let $target = (pub.config.Powerups.colorPUTarget == "Border" ? $tile : $bignum);

            if (val < linkval) $bignum.css("color", lt);
            else if (val > linkval) $bignum.css("color", gt);
            else if (val === linkval) $bignum.css("color", eq);
            else return true;
            count++;
            powerupsFired['PU_COMPARE'] ? powerupsFired['PU_COMPARE']++ : powerupsFired['PU_COMPARE'] = 1;
        });
        return count;
    }

    pub.PUmCompare = function () {  //example: !PU(mcompare):links=link1,link2,link3;mode=outlier;low=green;high=red;other=gray
        if (!pub.config.Powerups.comparePU) return;
        let count = 0;

        //find compare PUs
        $(TITLE_SELECTOR).each((i, el) => {
            let $title = $(el);
            let $tile = $title.parents(".grid-tile");
            let text = $title.text();
            let $bignum = $tile.find(BIGNUM_SELECTOR);

            if (!text.includes(PU_MCOMPARE)) return;
            if (pub.config.Powerups.debug) console.log("Powerup: mcompare power-up found");
            //let argstring = text.split(PU_MCOMPARE)[1].split('!')[0];
            //let args = argstring.split(";").map(x => x.split("="));
            let args = argsplit(text, PU_MCOMPARE);

            let links = args.find(x => x[0] == "links")[1].trim();
            if (typeof (links) == "string" && links.length)
                links = links.split(',');
            let low = (args.find(x => x[0] == "low") || [])[1] || "green";
            low = low.trim();
            let high = (args.find(x => x[0] == "high") || [])[1] || "red";
            high = high.trim();
            let other = (args.find(x => x[0] == "other") || [])[1] || "gray";
            other = other.trim();
            let mode = (args.find(x => x[0] == "mode") || [])[1] || "outlier";
            mode = mode.trim();

            let linkvals = [];
            links.forEach(link => {
                let num = pub.findLinkedVal(link);
                if (!isNaN(num)) linkvals.push(num);
            });
            let min = Math.min.apply(Math, linkvals);
            let max = Math.max.apply(Math, linkvals);

            let val = Number($tile.find(VAL_SELECTOR).text().replace(/,/g, ''));

            //let $target = (pub.config.Powerups.colorPUTarget == "Border" ? $tile : $bignum);

            switch (mode) {
                case "scale":
                    let percent = (val - min) / (max - min);
                    let color = d3.interpolateHsl(low, high)(percent);
                    $bignum.css("color", color);
                    break;
                case "outlier":
                default:
                    if (val === min) $bignum.css("color", low);
                    else if (val === max) $bignum.css("color", high);
                    else $bignum.css("color", other);
            }

            count++;
            powerupsFired['PU_MCOMPARE'] ? powerupsFired['PU_MCOMPARE']++ : powerupsFired['PU_MCOMPARE'] = 1;
        });
        return count;
    }

    pub.puDate = function () { //example: !PU(date):res=now-7d/d;fmt=yyyy-mm-dd;color=blue
        if (!pub.config.Powerups.datePU) return;

        //find math PUs
        $(MARKDOWN_SELECTOR).each((i, el) => {
            let $container = $(el);
            let $tile = $container.parents(".grid-tile");
            let text = $container.text();

            if (!text.includes(PU_DATE)) return;
            if (pub.config.Powerups.debug) console.log("Powerup: date power-up found");
            //let argstring = text.split(PU_DATE)[1].split('!')[0];
            //let args = argstring.split(";").map(x => x.split("="));
            let args = argsplit(text, PU_DATE);

            let res = args.find(x => x[0] == "res")[1];
            let fmt = args.find(x => x[0] == "fmt")[1];
            let color = args.find(x => x[0] == "color")[1];

            let dtDate = dtDateMath.resolve(res);
            let from = dtDate[0];
            let to = dtDate[1];
            let dateMs = dtDate[2].start;

            let formattedDate = dateFns.format(dateMs, fmt);

            //swap markdown content
            $container.hide();
            let $newContainer = $("<div>")
                .addClass("powerupDate")
                .insertAfter($container);
            let h1 = $("<h2>")
                .text(formattedDate)
                .css("color", color)
                .appendTo($newContainer);
            powerupsFired['PU_DATE'] ? powerupsFired['PU_DATE']++ : powerupsFired['PU_DATE'] = 1;
        });
    }

    pub.puGauge = function (chart, title, retries = 3) {
        if (!pub.config.Powerups.gaugePU) return false;

        //prep gauges
        let p = new $.Deferred();
        let $container = $(chart.container);
        let $tile = $container.parents(TILE_SELECTOR);
        let $panel = $tile.find(SVT_PANEL_SELECTOR);
        //let titletokens = title.split(PU_GAUGE);
        //let argstring = title.split(PU_GAUGE)[1].split('!')[0];
        //let args = argstring.split(";").map(x => x.split("="));
        let args = argsplit(title, PU_GAUGE);
        if (args.length < 2) {
            if (pub.config.Powerups.debug)
                console.log("Powerup: ERROR - invalid argstring: " + args.argstring);
            return false;
        }
        let vals = ((args.find(x => x[0] == "stops") || [])[1]);
        if (vals) vals = vals.split(',').map(x => Number(x.replace(/,/g, '')));
        else return false;
        let colors = ((args.find(x => x[0] == "colors") || [])[1]);
        if (colors) colors = colors.split(',');
        else return false;
        let min = Number(((args.find(x => x[0] == "min") || [])[1]) || 0);
        let max = Number(((args.find(x => x[0] == "max") || [])[1]) || 100);
        let stops = [];
        vals.forEach((v, i) => {
            let stop = [v, colors[i]];
            stops.push(stop);
        });
        let digits = Number(((args.find(x => x[0] == "digits") || [])[1]) || 1);

        //cleanup any old gauges
        $tile.find(`.powerupGauge`).each((i, el) => {
            let oldcontainer = $(el).find(`.highcharts-container`)[0];
            if (oldcontainer) {
                let oldcharts = Highcharts.charts
                    .filter(x => typeof (x) != "undefined")
                    .filter(x => x.container === oldcontainer);
                if (oldcharts.length)
                    oldcharts.forEach(oc => oc.destroy());
            }
            $(el).remove();
        });

        //swap
        $panel.hide();
        let val = Number($panel.find(VAL_SELECTOR).text().replace(/,/g, ''));
        let metric = $panel.find(SVT_METRIC_SELECTOR).text();
        let units = $panel.find(SVT_UNITS_SELECTOR).text();
        let $newContainer = $("<div>")
            .addClass("powerupGauge")
            .insertAfter($panel);
        let positions = [min, max];
        stops.forEach(s => {
            positions.push(s[0] * max);
        });
        positions = positions.sort((a, b) => a - b);

        //new chart
        //default options
        var gaugeOptions = {
            chart: {
                type: 'solidgauge',
                backgroundColor: '#353535'
            },
            title: null,
            pane: {
                center: ['50%', '35%'],
                //size: '140%',
                startAngle: -90,
                endAngle: 90,
                background: {
                    backgroundColor: '#454646',
                    innerRadius: '60%',
                    outerRadius: '100%',
                    shape: 'arc',
                    borderColor: '#454646'
                }
            },
            exporting: {
                enabled: false
            },
            tooltip: {
                enabled: false
            },
            yAxis: {
                stops: stops,
                lineWidth: 0,
                tickWidth: 1,
                minorTickInterval: null,
                //tickAmount: 2,
                //tickPositioner: () => { return [min,max] },
                tickPositioner: () => { return positions },
                tickPosition: "outside",
                //tickInterval: (max-min)/100,
                labels: {
                    y: 16,
                    style: {
                        color: '#ffffff'
                    },
                    formatter: function () {
                        if (this.value === min || this.value === max)
                            return this.value;
                        else
                            return "";
                    }
                },
                title: {
                    text: metric,
                    y: -70,
                    style: {
                        color: '#ffffff'
                    }
                },
                min: min,
                max: max,
                endOnTick: false
            },
            series: [{
                name: metric,
                data: [val],
                dataLabels: {
                    format:
                        '<div style="text-align:center">' +
                        `<span style="font-size:25px">{y:.${digits}f}</span>` +
                        `<span style="font-size:12px;opacity:0.4">${units}</span>` +
                        '</div>',
                    color: '#ffffff',
                    borderWidth: 0,
                    y: -20
                },
                tooltip: {
                    valueSuffix: ` ${units}`
                }
            }]
        }
        let gaugeChart = Highcharts.charts
            .filter(x => typeof (x) != "undefined")
            .filter(x => x.container === $newContainer[0])
        [0];
        if (gaugeChart)
            gaugeChart.update(gaugeOptions, true, false);
        else
            gaugeChart = Highcharts.chart($newContainer[0], gaugeOptions, () => { });
    }

    pub.extDisclaimer = function () {
        const DISC_HEIGHT = 76;
        const DISC_TEXT = 'Powerup Enabled Dashboard';

        //hide the disclaimer, since the user has the ext
        $(MARKDOWN_SELECTOR).each((i, el) => {
            let $md = $(el);
            if ($md.text().includes(DISC_TEXT) &&
                $md.is(':visible')) {
                $md.hide();
                moveTilesUp();
            }
        })

        //move everything up
        function moveTilesUp() {
            $(TILE_SELECTOR).each((i, el) => {
                let $tile = $(el);
                let top = $tile.css("top");
                top = top.substr(0, top.length - 2);
                top = Number(top);
                top -= DISC_HEIGHT;
                top = top + 'px';
                $(el).css("top", top);
            });
        }
    }

    pub.sunburnMode = function () {
        if (!pub.config.Powerups.sunburnMode) return false;

        //make white text black
        $('[data-page-content="canvas"]').find('*')
            .filter((i, el) => {
                //console.log($(el).css('background-color'));
                return $(el).css('color') === d3.rgb('white').toString();
            })
            .css('color', "black");

        //make greys white
        $('[data-page-content="canvas"]').find('div')
            .filter((i, el) => {
                let color = $(el).css('background-color');
                if (color === d3.rgb('#343434').toString()) return true;
                if (color === d3.rgb('#242424').toString()) return true;
                if (color === d3.rgb('#353535').toString()) return true;
                return false;
            })
            .css('background-color', "white");

        //same for chart backgrounds
        $('[data-page-content="canvas"]').find('rect')
            .filter((i, el) => {
                let color = $(el).css('fill');
                if (color === d3.rgb('#454646').toString()) return true;
                if (color === d3.rgb('#242424').toString()) return true;
                if (color === d3.rgb('#353535').toString()) return true;
                return false;
            })
            .css('fill', "white");
        $('.powerupPlotBackground').css('fill', "white");

        //and weird grey borders
        if (!$('#powerupSunburnMode').length) {
            $("<style>")
                .html(
                    `
                    [data-custom-charting-item-id-hash] div {
                        border-color: white !important;
                    }
                `)
                .attr("id", "powerupSunburnMode")
                .appendTo("head");
        }
        powerupsFired['PU_SUNBURN'] ? powerupsFired['PU_SUNBURN']++ : powerupsFired['PU_SUNBURN'] = 1;
    }

    pub.fixPublicDashboards = function () {
        $('.grid-tile').each((i, el) => {
            let $el = $(el);
            if ($el.css("pointer-events") === "none")
                $el.css("pointer-events", "auto");
        });
    }

    pub.PUvlookup = function () {
        $(MARKDOWN_SELECTOR).each((i, el) => {
            let $markdown = $(el);
            let markdown = $markdown.text();
            let $tile = $markdown.parents(TILE_SELECTOR);

            if (markdown.includes(PU_VLOOKUP)) {
                /*let argstring = $markdown.text()
                    .split(PU_VLOOKUP)[1]
                    .split(/[!\n]/)[0]
                    .trim();
                let args = argstring.split(";").map(x => x.split("="));*/
                let args = argsplit(markdown, PU_VLOOKUP);
                let color = (args.find(x => x[0] == "color") || ["white"])[1];
                let link = (args.find(x => x[0] == "link") || [])[1];
                let val = (args.find(x => x[0] == "val") || [""])[1];
                let col = (args.find(x => x[0] == "col") || [1])[1];
                let row = Number((args.find(x => x[0] == "row") || [])[1]);
                let base = (args.find(x => x[0] == "base") || [])[1] || "";
                let warn = Number((args.find(x => x[0] == "warn") || [])[1]);
                let crit = Number((args.find(x => x[0] == "crit") || [])[1]);
                let notfound = (args.find(x => x[0] == "notfound") || [])[1] || null;
                let size = (args.find(x => x[0] == "size") || [])[1] || "36px";

                //find the table
                let tabletile = pub.findLinkedTile(link);
                if (typeof (tabletile) == "undefined") return false;
                let $tabletile = $(tabletile)
                let dataTable = readTableData($tabletile, false);

                //console.log("POWERUP: DEBUG - readTableData:");
                //console.log(dataTable);

                //lookup val in table
                let firstColName = dataTable.keys[0];
                let rowIdx;
                if (row > 0) {
                    if (row > dataTable.normalTable.length) rowIdx = -1;
                    else rowIdx = row - 1;
                } else if (row < 0) {
                    rowIdx = dataTable.normalTable.length - 1 + row;
                } else {
                    rowIdx = dataTable.normalTable.findIndex(x => x[firstColName] === val);
                }

                let vlookupVal;
                let colName = (Number.isNaN(col) ? col : dataTable.keys[col]);
                if (rowIdx < 0) {
                    console.log("POWERUP: WARN - vlookup val not found in table.");
                    //return false;
                    vlookupVal = notfound;
                } else {
                    vlookupVal = dataTable.normalTable[rowIdx][colName];

                    //optionally compare to another table value
                    //compareTable=table;compareVal=/easytravel/rest/journeys/;compareCol=2;lt=red;gt=green;eq=yellow
                    let compareLink = (args.find(x => x[0] == "compareTable") || [])[1];
                    let compareVal = (args.find(x => x[0] == "compareVal") || [])[1];
                    if (compareLink && compareVal) {
                        let compareCol = (args.find(x => x[0] == "compareCol") || [1])[1];
                        let lt = (args.find(x => x[0] == "lt") || ['red'])[1];
                        let eq = (args.find(x => x[0] == "eq") || ['yellow'])[1];
                        let gt = (args.find(x => x[0] == "gt") || ['green'])[1];
                        let compareTable;
                        if (link === compareLink) compareTable = dataTable;
                        else {
                            let comparetabletile = pub.findLinkedTile(compareLink);
                            if (typeof (comparetabletile) == "undefined") return false;
                            let $comparetabletile = $(comparetabletile);
                            compareTable = readTableData($comparetabletile);
                        }
                        let compareFirstColName = compareTable.keys[0];
                        let compareRowIdx = compareTable.normalTable.findIndex(x => x[compareFirstColName] === compareVal);
                        if (compareRowIdx < 0) {
                            console.log("POWERUP: WARN - vlookup compareVal not found in table.");
                        } else {
                            let compareColName = (Number.isNaN(compareCol) ? compareCol : compareTable.keys[compareCol]);
                            let compareVlookupVal = compareTable.normalTable[compareRowIdx][compareColName];
                            let a, b;
                            //a = Number(vlookupVal.replace(/[,a-zA-Z]/g, ""));
                            if (typeof (vlookupVal) == "string")
                                a = Number(vlookupVal.replace(/[,a-zA-Z]/g, ""));
                            if (typeof (vlookupVal) == "number")
                                a = vlookupVal;
                            //b = Number(compareVlookupVal.replace(/[,a-zA-Z]/g, ""));
                            if (typeof (compareVlookupVal) == "string")
                                a = Number(compareVlookupVal.replace(/[,a-zA-Z]/g, ""));
                            if (typeof (compareVlookupVal) == "number")
                                a = compareVlookupVal;
                            if (Number.isNaN(a) || Number.isNaN(b)) {
                                console.log("POWERUP: WARN - vlookup could not compare vals.");
                            } else {
                                if (a < b) color = lt;
                                else if (a === b) color = eq;
                                else if (a > b) color = gt;
                            }
                        }
                    } else if (base && !isNaN(warn) && !isNaN(crit)) {
                        let a;
                        if (typeof (vlookupVal) == "string")
                            a = Number(vlookupVal.replace(/[,a-zA-Z %]/g, ""));
                        if (typeof (vlookupVal) == "number")
                            a = vlookupVal;
                        switch (base) {
                            case "low":
                                if (a < warn) color = "green";
                                else if (a < crit) color = "yellow";
                                else color = "red";
                                break;
                            case "high":
                                if (a > warn) color = "green";
                                else if (a > crit) color = "yellow";
                                else color = "red";
                                break;
                        }
                    }
                }

                //display val
                $markdown.hide();
                $markdown.parent().children(".powerupVlookup").remove();
                let $newContainer = $("<div>")
                    .addClass("powerupVlookup")
                    .insertAfter($markdown);
                let $h1 = $("<h1>")
                    .css("color", color)
                    .css("font-size", size)
                    .text(vlookupVal)
                    .appendTo($newContainer);
                powerupsFired['PU_VLOOKUP'] ? powerupsFired['PU_VLOOKUP']++ : powerupsFired['PU_VLOOKUP'] = 1;
            }
        });
        return true;
    }

    pub.PUtable = function () {
        $(TITLE_SELECTOR).each((i, el) => {
            let $title = $(el);
            let $tile = $title.parents(TILE_SELECTOR);
            let title = $title.text();

            if (title.includes(PU_TABLE)) {
                let $table = $tile.find(TABLE_SELECTOR);
                //let argstring = title.split(PU_TABLE)[1].split(/[!\n]/)[0];
                //let args = argstring.split(";").map(x => x.split("="));
                let args = argsplit(title, PU_TABLE);

                title = title.split(PU_TABLE)[0].trim();  //for use in filenames etc
                let col = Number((args.find(x => x[0] == "col") || [])[1]);

                //decorate the table
                $table.addClass("powerupTable");
                //reorder link to make text selectable
                $tile.find(`[uitestid="gwt-debug-DTAQL"] > a`)
                    .prependTo($tile.find(`[uitestid="gwt-debug-DTAQL"]`));

                //read the table
                let dataTable = readTableData($tile, false); // maybe make it sortable etc later

                //build menu
                let $menu = $("<div>")
                    .addClass("powerupTableMenu")
                    .appendTo($tile);
                let $ellipsis = $("<a>")
                    .addClass("powerupTableButton")
                    .attr("href", "javascript:;")
                    .text('...')
                    .appendTo($menu);
                let $list = $("<div>")
                    .css("display", "none")
                    .appendTo($menu);
                let $csv = $("<a>")
                    .addClass("powerupTableButton")
                    .attr("href", "javascript:;")
                    .text('CSV')
                    .appendTo($list);
                let $xls = $("<a>")
                    .addClass("powerupTableButton")
                    .attr("href", "javascript:;")
                    .text('XLS')
                    .appendTo($list);

                //bind click handlers
                $table.off("click")
                    .on("click", (e) => {
                        e.stopImmediatePropagation();
                    });
                $ellipsis.on('click', () => {
                    $list.toggle();
                    $menu.toggleClass("on");
                });
                $csv.on('click', () => {
                    if (!dataTable) return false;
                    let csvContent = dataTable.keys.join(',') + '\n';
                    dataTable.normalTable.forEach(row => {
                        dataTable.keys.forEach(k => {
                            csvContent += row[k] + ',';
                        });
                        csvContent += '\n';
                    });
                    let filename = title + '.csv';
                    download(filename, csvContent);
                });
                $xls.on('click', () => {
                    let filename = title + '.xlsx';
                    let sheetname = title;
                    downloadExcel(filename, sheetname, dataTable.normalTable);
                });

                //make column headers clickable
                $tile.find(COLUMN_SELECTOR)
                    .each((i, el) => {
                        let $span = $(el);
                        $span.hide();
                        $span.siblings(".powerTableCol").remove();
                        let $a = $("<a>")
                            .attr("href", "javascript:;")
                            .addClass("powerTableCol")
                            .text($span.text())
                            .insertAfter($span)
                            .on('click', event => {
                                if (!dataTable) return false;
                                let key = dataTable.keys[i];
                                let sorted;
                                if ($a.hasClass("powerupTableColAsc")) {
                                    $(".powerupTableColAsc, .powerupTableColDesc").removeClass(["powerupTableColAsc", "powerupTableColDesc"]);
                                    $a.addClass("powerupTableColDesc");
                                    sorted = dataTable.normalTable.sort((a, b) => columnSorterDesc(a, b, key));
                                } else {
                                    $(".powerupTableColAsc, .powerupTableColDesc").removeClass(["powerupTableColAsc", "powerupTableColDesc"]);
                                    $a.addClass("powerupTableColAsc");
                                    sorted = dataTable.normalTable.sort((a, b) => columnSorterAsc(a, b, key));
                                }
                                sorted.forEach((row, i) => {
                                    dataTable.keys.forEach((col, j) => {
                                        $table.find(`div > div:nth-of-type(${j + 1}) > div:nth-of-type(${i + 2}) > span`)
                                            .text(row[col]);
                                    })
                                })
                            });
                        if (col === i + 1) {
                            $a.addClass("powerupTableColDesc");
                        } else if (col === -1 * (i + 1)) {
                            $a.addClass("powerupTableColAsc");
                        }
                    });
                $tile.find(`a.powerupTableColDesc, a.powerupTableColAsc`)
                    .eq(0).trigger("click");

                //generate CVS/XLSX/etc on menu item click
                powerupsFired['PU_TABLE'] ? powerupsFired['PU_TABLE']++ : powerupsFired['PU_TABLE'] = 1;
            }
        });
        return true;
    }

    pub.PUstdev = function () {
        $(TITLE_SELECTOR).each((i, el) => {
            let $title = $(el);
            let title = $title.text();
            let $tile = $title.parents(TILE_SELECTOR);

            if (title.includes(PU_STDEV)) {
                //let argstring = $title.text().split(PU_STDEV)[1].split(/[!\n]/)[0].trim();
                //let args = argstring.split(";").map(x => x.split("="));
                let args = argsplit(title, PU_STDEV);
                let color = (args.find(x => x[0] == "color") || ["white"])[1];
                let output = (args.find(x => x[0] == "output") || ["output", "stdev"])[1].split(',');

                //find the table
                let dataTable = readTableData($tile);
                if (!dataTable) return false;

                //console.log("POWERUP: DEBUG - readTableData:");
                //console.log(dataTable);
                let key = dataTable.keys[0];
                let sum = dataTable.normalTable.reduce((agg, x) => agg + x[key], 0);
                let avg = sum / dataTable.normalTable.length;
                let sumsqdeltas = dataTable.normalTable
                    .map(x => {
                        let delta = x[key] - avg;
                        return delta * delta;
                    })
                    .reduce((agg, x) => agg + x, 0);
                let stdev = Math.sqrt(sumsqdeltas / dataTable.normalTable.length);
                let sorted = dataTable.normalTable
                    .sort((a, b) => a[key] - b[key])
                    .map(x => x[key]);
                let len = sorted.length;
                let max = sorted[len - 1];
                let min = sorted[0];
                const quantile = (q) => {
                    const pos = (len - 1) * q;
                    const base = Math.floor(pos);
                    const rest = pos - base;
                    if (sorted[base + 1] !== undefined) {
                        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
                    } else {
                        return sorted[base];
                    }
                };

                //display val
                let $table = $tile.find(TABLE_SELECTOR);
                $table.hide();
                $tile.find(".powerupStdev").remove();
                output.forEach(o => {
                    let text;
                    switch (o.toLowerCase()) {
                        case 'stdev':
                            text = stdev.toLocaleString(undefined, { maximumFractionDigits: 2 });
                            break;
                        case 'avg':
                            text = avg.toLocaleString(undefined, { maximumFractionDigits: 2 });
                            break;
                        case 'sum':
                            text = sum.toLocaleString(undefined, { maximumFractionDigits: 2 });
                            break;
                        case 'max':
                            text = max.toLocaleString(undefined, { maximumFractionDigits: 2 });
                            break;
                        case 'min':
                            text = min.toLocaleString(undefined, { maximumFractionDigits: 2 });
                            break;
                        case 'median':
                            text = quantile(.5).toLocaleString(undefined, { maximumFractionDigits: 2 });
                            break;
                        default:
                            if (o.includes('%')) {
                                let q = Number(o.replace(/%/g, '')) / 100;
                                text = quantile(q).toLocaleString(undefined, { maximumFractionDigits: 2 });
                                break;
                            }
                    }
                    $("<div>")
                        .addClass("powerupStdev")
                        .css("color", color)
                        .html(`${o}: <span>${text}</span>`)
                        .insertBefore($table);
                })
                powerupsFired['PU_STDEV'] ? powerupsFired['PU_STDEV']++ : powerupsFired['PU_STDEV'] = 1;
            }
        });
        return true;
    }

    pub.hideEarlyAdopter = function () {
        $(`[uitestid="gwt-debug-dashboard-tile-filter-indicator-icon"]`).siblings()
            .each((i, el) => {
                let $el = $(el);
                if ($el.text() == "Early Adopter") {
                    $el.hide();
                    let $tile = $el.parents(TILE_SELECTOR);
                    let $title = $tile.find(TITLE_SELECTOR);
                    $title.css("width", "100%");
                }
            });
    }

    pub.PUbackground = function () {
        let backgrounded = false;
        $(MARKDOWN_SELECTOR).each((i, el) => {
            let $markdown = $(el);
            let text = $markdown.text();
            let $tile = $markdown.parents(TILE_SELECTOR);

            if (text.includes(PU_BACKGROUND)) {
                //let argstring = $markdown.text().split(PU_BACKGROUND)[1].split(/[!\n]/)[0].trim();
                //let args = argstring.split(";").map(x => x.split("="));
                let args = argsplit(text, PU_BACKGROUND);

                let width = (args.find(x => x[0] == "width") || ["width", "100%"])[1];
                let url = (args.argstring.match(/url=([^ ]+)/) || [])[1];
                if (url) url = url.trim();

                //pass message back to extside to get the image, avoid block by CSP
                window.postMessage(
                    {
                        PowerUp: "PU_BACKGROUND",
                        url: url,
                        targetSelector: VIEWPORT_SELECTOR
                    }, "*");
                $markdown.hide();
                powerupsFired['PU_BACKGROUND'] ? powerupsFired['PU_BACKGROUND']++ : powerupsFired['PU_BACKGROUND'] = 1;
                backgrounded = true;
                return true;
            }
        });
        if (!backgrounded) {  //if dashboard changed and new dashboard doesn't have background remove old one
            $(`.powerupBackground`)
                .css(`background-image`, "")
                .removeClass('powerupBackground');
        }
    }

    pub.PUimage = function () {
        $(MARKDOWN_SELECTOR).each((i, el) => {
            let $markdown = $(el);
            let text = $markdown.text();
            let $tile = $markdown.parents(TILE_SELECTOR);

            if (text.includes(PU_IMAGE)) {
                //let argstring = $markdown.text().split(PU_IMAGE)[1].split(/[!\n]/)[0].trim();
                //let args = argstring.split(";").map(x => x.split("="));
                let args = argsplit(text, PU_IMAGE);

                let width = (args.find(x => x[0] == "width") || ["width", "100%"])[1];
                let url = (args.argstring.match(/url=([^ ]+)/) || [])[1];
                if (url) url = url.trim();
                let out = (args.argstring.match(/out=([^ ]+)/) || [])[1];
                if (out) out = out.trim();

                //pass message back to extside to get the image, avoid block by CSP
                $markdown.hide();
                $markdown.siblings('.powerupImage').remove();
                let id = `PUimage-` + uniqId();
                let $target = $('<div>')
                    .attr('id', id)
                    .addClass('powerupImage')
                    .insertAfter($markdown);
                if (out) {
                    let $a = $(`<a>`)
                        .attr('href', out)
                        .addClass('powerupImage')
                        .insertBefore($target);
                    if (out.startsWith('http'))
                        $a.attr('target', '_blank');
                    $target.appendTo($a);
                }
                window.postMessage(
                    {
                        PowerUp: "PU_IMAGE",
                        url: url,
                        targetSelector: `#${id}`
                    }, "*");
                powerupsFired['PU_IMAGE'] ? powerupsFired['PU_IMAGE']++ : powerupsFired['PU_IMAGE'] = 1;
            }
        })
    }

    pub.PUfunnelColors = function () {
        $(TITLE_SELECTOR).each((i, el) => {
            let $title = $(el);
            let title = $title.text();
            let $tile = $title.parents(TILE_SELECTOR);

            if (title.includes(PU_FUNNELCOLORS)) {
                //let argstring = $title.text().split(PU_FUNNELCOLORS)[1].split(/[!\n]/)[0].trim();
                //let args = argstring.split(";").map(x => x.split("="));
                let args = argsplit(title, PU_FUNNELCOLORS);

                let colors = (args.find(x => x[0] == "colors") || [])[1];
                let scale = (args.find(x => x[0] == "scale") || [])[1];
                if (colors) colors = colors.split(',');
                if (scale) scale = scale.split(',');

                if (colors && colors.length) {
                    $tile.find(FUNNEL_SELECTOR).find(`path`).each((idx, path) => {
                        $(path).css('fill', colors[idx]);
                    });
                    powerupsFired['PU_FUNNELCOLORS'] ? powerupsFired['PU_FUNNELCOLORS']++ : powerupsFired['PU_FUNNELCOLORS'] = 1;
                } else if (scale && scale.length == 2) {
                    let $paths = $tile.find(FUNNEL_SELECTOR).find(`path`);
                    $paths.each((idx, path) => {
                        let percent = idx / $paths.length;
                        let color = d3.interpolateHsl(scale[0], scale[1])(percent);
                        $(path).css('fill', color);
                    });
                    powerupsFired['PU_FUNNELCOLORS'] ? powerupsFired['PU_FUNNELCOLORS']++ : powerupsFired['PU_FUNNELCOLORS'] = 1;
                }
            }
        });
    }

    pub.PUtilecss = function () {
        let reTitle = new RegExp('!PU\\(tilecss\\):`[^`]+`');
        let reCSS = /[ ]*([\w-]+):[ ]*([^;]+);/g;
        let reURL = /[uU][rR][lL]\([^)]*\)/;
        $([TITLE_SELECTOR, MARKDOWN_SELECTOR].join(', '))
            .each((i, el) => {
                let $text = $(el);
                let $tile = $text.parents(TILE_SELECTOR);

                if ($text.text().includes(PU_TILECSS)) {
                    let match = $text.text().match(reTitle);
                    if (match && match.length) {
                        let cssText = match[0];
                        let oldstyle = $tile.attr('style');
                        let cssItems = [...cssText.matchAll(reCSS)];

                        cssItems.forEach(x => {
                            if (!reURL.test(x[2].m))
                                $tile.css(x[1], x[2]);
                        });

                        powerupsFired['PU_TILECSS'] ? powerupsFired['PU_TILECSS']++ : powerupsFired['PU_TILECSS'] = 1;
                    }
                }
            })
    }

    pub.PUmenu = function () {
        $([TITLE_SELECTOR, MARKDOWN_SELECTOR].join(', '))
            .each((i, el) => {
                let $text = $(el);
                let text = $text.text();
                let $tile = $text.parents(TILE_SELECTOR);

                if (text.includes(PU_MENU)) {
                    //Menu PowerUp is present
                    //Actual menu appears and disappears in DOM, rather than being hidden
                    //Step 1 - Add click listener to menu_icon
                    //Step 2 - On click, add a new anchor element

                    let argsArr = argsplit(text, PU_MENU);
                    argsArr.argObjs.forEach(args => {
                        let url = (args.argstring.match(/url=([^ ]+)/) || [])[1];
                        if (url) url = url.trim();
                        let name = (args.find(x => x[0] == "name") || [])[1];
                        if (typeof (url) == "undefined"
                            || typeof (name) == "undefined")
                            return false;

                        function menu_icon_click_handler(e) {
                            setTimeout(() => {
                                let $popup = $(MENU_POPUP_SELECTOR);
                                let a_class = $popup.children("a").first().attr("class");
                                let $a;

                                //check for already added
                                $popup.children("a").each((child_idx, child) => {
                                    let $child = $(child);
                                    if ($child.text() == name) $a = $child;
                                })

                                if (typeof ($a) == "undefined"
                                    || !$a.length) {
                                    $a = $("<a>")
                                        .attr("href", url)
                                        .attr("class", a_class)
                                        .addClass("powerMenuItem")
                                        .text(name)
                                        .appendTo($popup);

                                    if (url.startsWith('http'))
                                        $a.attr('target', '_blank');
                                }
                            }, 50);
                        }

                        let $icon = $tile.find(MENU_ICON_SELECTOR);
                        $icon
                            .off(`.PUmenu-${name}`)
                            .on(`click.PUmenu-${name}`, menu_icon_click_handler);

                        if ($icon.length) {
                            powerupsFired['PU_MENU'] ? powerupsFired['PU_MENU']++ : powerupsFired['PU_MENU'] = 1;
                        } else {
                            console.log("POWERUP: WARN - PU(menu) used but no icon found.");
                        }
                    })
                }
            })
    }

    pub.PUHideShow = function () {
        $(MENU_ICON_SELECTOR).each((i, el) => {
            let $menuicon = $(el);
            let $tile = $menuicon.parents(TILE_SELECTOR);
            let $tilecontent = $tile.find(TILE_CONTENT_SELECTOR);

            function toggle() {
                let $popup = $(MENU_POPUP_SELECTOR);
                let $a;
                let name = $tilecontent.is(":visible") ? "Hide" : "Show";

                $tilecontent.toggle();

                $popup.children("a").each((child_idx, child) => {
                    let newname;
                    let $child = $(child);

                    if (name == "Hide")
                        newname = "Show";
                    else if (name == "Show")
                        newname = "Hide";
                    if ($child.text() == name)
                        $child.text(newname);
                });

                $popup.parent().parent().css("visibility", "hidden");
            }

            function addHideShow(e) {
                setTimeout(() => {
                    let $popup = $(MENU_POPUP_SELECTOR);
                    let a_class = $popup.children("a").first().attr("class");
                    let $a;
                    let name = $tilecontent.is(":visible") ? "Hide" : "Show";

                    //check for already added
                    $popup.children("a").each((child_idx, child) => {
                        let $child = $(child);
                        if ($child.text() == name) $a = $child;
                    })

                    if (typeof ($a) == "undefined"
                        || !$a.length) {
                        $a = $("<a>")
                            .attr("href", "javascript:")
                            .attr("class", a_class)
                            .addClass("powerMenuItem")
                            .text(name)
                            .appendTo($popup)
                            .on("click", toggle);
                    }
                }, 50);
            }

            $menuicon.on("click", addHideShow);
        });
    }

    pub.PUgrid = function () {
        const block = 38;
        $('.powerupGrid').remove();

        $(MARKDOWN_SELECTOR).each((i, el) => {
            let $md = $(el);
            let text = $md.text();
            let $tile = $md.parents(TILE_SELECTOR);

            if (text.includes(PU_GRID)) {
                //let argstring = $md.text().split(PU_GRID)[1].split(/[!\n]/)[0].trim();
                //let args = argstring.split(";").map(x => x.split("="));
                let args = argsplit(text, PU_GRID);

                let color = (args.find(x => x[0] == "color") || [])[1] || "#454646";
                let hor = (args.find(x => x[0] == "hor") || [])[1];
                if (hor) hor = [...hor.matchAll(/[0-9]+/g)].map(x => Number(x));
                let ver = (args.find(x => x[0] == "ver") || [])[1];
                if (ver) ver = [...ver.matchAll(/[0-9]+/g)].map(x => Number(x));
                let wid = (args.find(x => x[0] == "wid") || [])[1] || block;
                let margin = (args.find(x => x[0] == "margin") || [])[1] || 4;

                //dashboard stuff
                let $grid = $(GRID_SELECTOR).eq(0);
                const left = Number($grid.css("left").replace('px', ''));
                const top = Number($grid.css("top").replace('px', ''));
                const width = $grid.css("width");
                const height = $grid.css("height");


                //horizontal lines
                hor.forEach(x => {
                    let lineLeft = left;
                    let lineTop = top + x * block;
                    let lineWidth = wid;
                    if (lineTop) {
                        lineTop -= margin;
                        lineWidth += 2 * margin;
                    }
                    else {
                        lineWidth += 1 * margin;
                    }
                    let $line = $("<div>")
                        .addClass('powerupGrid')
                        .css('position', 'absolute')
                        .css('left', `${lineLeft}px`)
                        .css('top', `${lineTop}px`)
                        .css('height', `${lineWidth}px`)
                        .css('width', '100%')
                        .css('background', color)
                        .css('z-index', 0) //need to test this, should go under tiles
                        .appendTo($grid);
                });

                //vertical lines
                ver.forEach(x => {
                    let lineLeft = left + x * block;
                    let lineTop = top;
                    let lineWidth = wid;
                    if (lineLeft) {
                        lineLeft -= margin;
                        lineWidth += 2 * margin;
                    }
                    else {
                        lineWidth += 1 * margin;
                    }

                    let $line = $("<div>")
                        .addClass('powerupGrid')
                        .css('position', 'absolute')
                        .css('left', `${lineLeft}px`)
                        .css('top', `${lineTop}px`)
                        .css('height', '100%')
                        .css('width', `${lineWidth}px`)
                        .css('background', color)
                        .css('z-index', 0) //need to test this, should go under tiles
                        .appendTo($grid);
                });

                //$tile.hide(); //instead use standard hiding feature
                powerupsFired['PU_GRID'] ? powerupsFired['PU_GRID']++ : powerupsFired['PU_GRID'] = 1;
            }
        })
    }

    pub.fireAllPowerUps = function (update = false) {
        let mainPromise = new $.Deferred();
        let promises = [];

        if (!pub.config.beaconOptOut) startBeacon();

        try {
            //data gathering operations
            promises.push(pub.PUvlookup());
            promises.push(pub.PUstdev());

            //data processing operations
            promises.push(pub.PUMath());
            promises.push(pub.puDate());

            //visualize data
            promises.push(pub.PUHighcharts());
            promises.push(pub.colorPowerUp());
            promises.push(pub.updateSVGPowerUp());
            promises.push(pub.svgPowerUp());
            promises.push(pub.mapPowerUp());
            promises.push(pub.PUfunnel());
            promises.push(pub.PUCompare());
            promises.push(pub.PUmCompare());
            promises.push(pub.PUtable());
            promises.push(pub.PUfunnelColors());
            promises.push(pub.PUTopListColor());
            waitForHCmod('sankey', () => { promises.push(pub.sankeyPowerUp()) });

            //misc visualizations
            promises.push(pub.PUbackground());
            promises.push(pub.extDisclaimer());
            promises.push(pub.bannerPowerUp());
            promises.push(pub.PUimage());
            promises.push(pub.PUtilecss());
            promises.push(pub.PUgrid());
            promises.push(pub.sunburnMode());
            promises.push(pub.hideEarlyAdopter());
            promises.push(pub.fixPublicDashboards());
            promises.push(pub.PUmenu());
            promises.push(pub.PUHideShow());

            //cleanup activities
            pub.loadChartSync();

        } catch (e) {
            crashBeacon(e);
            console.warn("POWERUP: ERROR ", e);
        }
        $.when.apply($, promises).always(function () {
            let p = pub.cleanMarkup();
            if (!pub.config.beaconOptOut) endBeacon();
            if (pub.config.Powerups.debug)
                console.log("Powerup: DEBUG - fire all PowerUps" + (update ? " (update)" : ""));
            $.when(p).always(() => {
                mainPromise.resolve();
            });
        });

        return mainPromise;
    }

    pub.GridObserver = (function () {
        /* New method for deciding when to fire powerups
            Step 1 (extside) - inject clientside lib, if not already
            Step 2 (extside) - inject trigger to launch Mutation observer
            Step 3 (clientside) - launch new observer on the dashboard grid, discard if already exists
            Step 4 (clientside) - when a mutation occurs (this should be tiles loading), flag it, start timeout of 50ms
            Step 5 - continue updating timeout to 50ms until mutation stop
            Step 6 - once no mutations occur for 50ms, disable observer, fire powerups
            Step 7 - once powerups are complete, reenable observer, repeat from step 4
            */
        const time = 200;
        const MO_CONFIG = { attributes: true, childList: true, subtree: false };
        var GO = {};
        var observer = {};
        var timeout = {};
        const firstRunRaceTime = 1000;

        const mutationHappening = (mutationsList, obs) => {
            if (pub.config.Powerups.debug) {
                console.log("Powerup: DEBUG - mutations happening:");
                console.log(mutationsList);
            }
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                mutationsDone(mutationsList, obs);
            }, time);
        }

        const mutationsDone = (mutationsList, obs) => {
            let p;
            if (pub.config.Powerups.debug) {
                console.log("Powerup: DEBUG - mutations have stopped.");
            }
            observer.disconnect();
            if (window.location.hash.startsWith("#dashboard;") ||
                window.location.hash.startsWith("#dashboard/dashboard;")) {
                if ($('[uitestid="gwt-debug-dashboardGrid"]').length &&        //grid is loaded
                    !$(".loader:visible").length &&                            //main loading distractor gone
                    !$('[uitestid="gwt-debug-tileLoader"]:visible').length) {  //tile distractors hidden)
                    p = pub.fireAllPowerUps();
                } else { //still loading apparently, wait and try again
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        mutationsDone(mutationsList, obs);
                    }, firstRunRaceTime);
                }

                $.when(p).done(() => {
                    GO.observeGrid();
                })
            }
        }

        GO.launchGridObserver = () => {
            observer = new MutationObserver(mutationHappening);
            GO.observeGrid();

            //backstop initial race condition
            timeout = setTimeout(() => {
                mutationsDone(undefined, undefined);
            }, firstRunRaceTime);
        };

        GO.observeGrid = () => {
            const GRID_SELECTOR = '.grid-dashboard';
            const TITLE_SELECTOR = '[uitestid="gwt-debug-title"]';

            let $grid = $(GRID_SELECTOR);
            if ($grid.length < 1) return false;
            $grid.each((i, grid) => {
                observer.observe(grid, { attributes: true, childList: true, subtree: false });
            });

            let $titles = $(TITLE_SELECTOR);
            if ($titles.length) {
                $titles.each((i, title) => {
                    observer.observe(title, { attributes: true, childList: true, subtree: false });
                })
            }
        }

        return GO;
    })();

    return pub;
})();
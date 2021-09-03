/*
Copyright 2020 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
var PowerupReporting = (function () {

    var uniqId = (function () {
        //usage: let myId = uniqId();
        var i = 0;
        return function () {
            return i++;
        }
    })();

    function startReportBeacon(action) {
        if (DashboardPowerups.config.Powerups.BeaconOptOut) return false;
        if (DashboardPowerups.config.Powerups.debug) console.log("POWERUP: DEBUG - OpenKit start beacon");

        //send message to background.js instead to avoid CSP issues
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
            dbUrl: location.href,
            configuratorTag: configuratorTag,
            envName: envName,
            libLocation: DashboardPowerups.config.Powerups.libLocation,
            uuid: DashboardPowerups.config.Powerups.uuid
        };
        window.postMessage(
            {
                OpenKit: "start_report_beacon",
                action: "PowerUp Report: " + action,
                beaconOptOut: DashboardPowerups.config.Powerups.BeaconOptOut,
                uuid: DashboardPowerups.config.Powerups.uuid,
                applicationVersion: DashboardPowerups.VERSION,
                operatingSystem: (navigator.userAgent.match(/\(([^)]+)\)/) || [])[1],
                manufacturer: 'Chrome',
                modelId: (navigator.userAgent.match(/Chrome\/([^ ]+)/) || [])[1],
                screenResolution: [window.innerWidth, window.innerHeight],
                name: name,
                vals: vals
            }, "*");
    }

    function crashBeacon(e) {
        if (DashboardPowerups.config.Powerups.BeaconOptOut) return false;
        if (DashboardPowerups.config.Powerups.debug) console.log("POWERUP: DEBUG - OpenKit crash beacon");

        window.postMessage(
            {
                OpenKit: "crash_beacon",
                e: {
                    name: e.name,
                    message: e.message,
                    stack: e.stack
                }
            }, "*");
    }

    function errorBeacon(err) {
        if (DashboardPowerups.config.Powerups.BeaconOptOut) return false;
        if (DashboardPowerups.config.Powerups.debug) console.log("POWERUP: DEBUG - OpenKit crash beacon");

        window.postMessage(
            {
                OpenKit: "error_beacon",
                context: "clientside",
                err: err
            }, "*");
    }

    function endReportBeacon() {
        if (DashboardPowerups.config.Powerups.BeaconOptOut) return false;
        if (DashboardPowerups.config.Powerups.debug) console.log("POWERUP: DEBUG - OpenKit end beacon");

        let vals = powerupsFired;
        powerupsFired = {};
        window.postMessage(
            {
                OpenKit: "end_report_beacon",
                vals: vals
            }, "*");
    }

    //Public methods
    var pub = {};

    pub.openReportGenerator = () => {
        $(`.PowerupReportGenerator`).remove(); //remove any stragglers

        let $repgen = $("<div>")
            .html(`
        <div id="PowerupReportGeneratorTitleBar"><h3>Generate Report</h3></div>
        <div id="PowerupReportGeneratorPreview">
            <div id="PowerupReportGeneratorPreviewTitle"></div>
            <div id="PowerupReportGeneratorPreviewContent"></div>
            <div id="PowerupReportGeneratorPreviewOptions"></div>
        </div>
        <div id="PowerupReportGeneratorHiddenCopy"></div>
        <div id="PowerupReportGeneratorButtonBar"></div>
        `)
            .addClass("PowerupReportGenerator")
            .appendTo("body");
        let $buttonBar = $repgen.find(`#PowerupReportGeneratorButtonBar`);


        let $cancel = $(`<button type="button" id="cancelReportButton">`)
            .on('click', closeReportGenerator)
            .text("Cancel")
            .addClass("powerupButton")
            .appendTo($buttonBar);

        let $generate = $(`<button type="button" id="generateReportButton">`)
            .on('click', generateReport)
            .text("Generate")
            .addClass("powerupButton")
            .appendTo($buttonBar);

        startReportBeacon("Open report generator");
        endReportBeacon();
    }

    function closeReportGenerator() {
        $("div.PowerupReportGenerator").remove();
        startReportBeacon("Close report generator");
        endReportBeacon();
    }

    function generateReport() {
        $(`#generateReportButton`).hide();
        $(`#PowerupReportGeneratorPreviewOptions`).show();
        let $previewContent = $(`#PowerupReportGeneratorPreviewContent`);
        let $previewTitle = $(`#PowerupReportGeneratorPreviewTitle`);
        let $previewOptions = $(`#PowerupReportGeneratorPreviewOptions`);
        let $buttonBar = $(`#PowerupReportGeneratorButtonBar`);
        let $copies = $(`#PowerupReportGeneratorHiddenCopy`);

        (function (H) {
            // adapted from https://jsfiddle.net/gh/get/library/pure/H/H/tree/master/samples/H/exporting/multiple-charts-offline/

            let copyChart = function (chart, chartOptions, containerContainer) {
                if (!Object.keys(chart).length) return null;
                let chartCopy,
                    sandbox,
                    svg,
                    seriesOptions,
                    sourceWidth,
                    sourceHeight,
                    cssWidth,
                    cssHeight,
                    allOptions = H.merge(chart.options);
                // Copy the options and add extra options
                options = H.merge(chart.userOptions, chartOptions);

                // create a sandbox where a new chart will be generated
                sandbox = H.createElement('div', null, {
                    position: 'absolute',
                    top: '-9999em',
                    width: chart.chartWidth + 'px',
                    height: chart.chartHeight + 'px'
                }, containerContainer);

                // get the source size
                cssWidth = chart.renderTo.style.width;
                cssHeight = chart.renderTo.style.height;
                sourceWidth = allOptions.exporting.sourceWidth ||
                    options.chart.width ||
                    allOptions.chart.width ||
                    (/px$/.test(cssWidth) && parseInt(cssWidth, 10)) ||
                    600;
                sourceHeight = allOptions.exporting.sourceHeight ||
                    options.chart.height ||
                    allOptions.chart.height ||
                    (/px$/.test(cssHeight) && parseInt(cssHeight, 10)) ||
                    400;

                // override some options
                H.extend(options.chart, {
                    animation: false,
                    renderTo: sandbox,
                    forExport: true,
                    renderer: 'SVGRenderer',
                    width: sourceWidth,
                    height: sourceHeight
                });
                options.exporting = { enabled: false }// hide buttons in print
                delete options.data; // #3004
                if (typeof (options.tooltip) == "undefined") options.tooltip = {};
                options.tooltip.userOptions = null; //prevent crash
                options.tooltip.enabled = false;

                // prepare for replicating the chart
                options.series = [];
                H.each(chart.series, function (serie) {
                    seriesOptions = H.merge(serie.userOptions, { // #4912
                        animation: false, // turn off animation
                        enableMouseTracking: false,
                        showCheckbox: false,
                        visible: serie.visible
                    });

                    // Used for the navigator series that has its own option set
                    if (!seriesOptions.isInternal) {
                        options.series.push(seriesOptions);
                    }

                    //troubleshooting crash from pies
                    if (options.series.filter(s => s.type == "pie").length) {
                        //console.log(`Powerup: DEBUG - reporting proactively disabling legend for pie chart.`);
                        //options.legend.enabled = false;
                        if (options.legend.itemStyle) {
                            delete options.legend.itemStyle.lineHeight;
                        }
                    }

                });

                // Assign an internal key to ensure a one-to-one mapping (#5924)
                H.each(chart.axes, function (axis) {
                    if (!axis.userOptions.internalKey) { // #6444
                        axis.userOptions.internalKey = H.uniqueKey();
                    }
                });

                // Add support for narrative
                narrativeSupport(options);

                // generate the chart copy
                try {
                    chartCopy = new H.Chart(options, chart.callback);
                } catch (err) {
                    console.log(`Powerup: reporting - failed to copy chart`)
                    console.warn(err);
                    console.log(options);
                    return null;
                }


                // Axis options and series options  (#2022, #3900, #5982)
                if (chartOptions) {
                    H.each(['xAxis', 'yAxis', 'series'], function (coll) {
                        var collOptions = {};
                        if (chartOptions[coll]) {
                            collOptions[coll] = chartOptions[coll];
                            chartCopy.update(collOptions);
                        }
                    });
                }

                // Reflect axis extremes in the export (#5924)
                H.each(chart.axes, function (axis) {
                    var axisCopy = H.find(chartCopy.axes, function (copy) {
                        return copy.options.internalKey ===
                            axis.userOptions.internalKey;
                    }),
                        extremes = axis.getExtremes(),
                        userMin = extremes.userMin,
                        userMax = extremes.userMax;

                    if (
                        axisCopy &&
                        (
                            (userMin !== undefined && userMin !== axisCopy.min) ||
                            (userMax !== undefined && userMax !== axisCopy.max)
                        )
                    ) {
                        axisCopy.setExtremes(userMin, userMax, true, false);
                    }
                });

                return chartCopy;
            },
                rebuildAndAddToplist = function (charts) {
                    $(DashboardPowerups.SELECTORS.TOPLIST_SELECTOR).each((i, el) => {
                        let data = [], categories = [];
                        let $toplist = $(el);
                        let $tile = $toplist.parents(DashboardPowerups.SELECTORS.TILE_SELECTOR);
                        let $left = $toplist.children().first();
                        let $right = $toplist.children().eq(1);
                        $right.find(DashboardPowerups.SELECTORS.TOPLIST_BAR_SELECTOR).each((b_idx, bar) => {
                            let $bar = $(bar);
                            let color = $bar.css('background-color');
                            let percent = $bar.attr('style').match(/width:([0-9.]+)%/);
                            percent = (Array.isArray(percent) && percent.length > 1) ? Number(percent[1]) : 0;
                            let name = $bar.next().text();
                            let val = $left.children().eq(b_idx).text();

                            data.push({
                                longName: name,
                                color: color,
                                y: percent
                            });
                            categories.push(val);
                        });
                        let $container = $("<div>").appendTo($copies);
                        let options = {
                            chart: {
                                plotBackgroundColor: "#f2f2f2"
                            },
                            credits: {
                                enabled: false
                            },
                            legend: {
                                enabled: false
                            },
                            series: [{
                                type: "bar",
                                data: data,
                                dataLabels: {
                                    enabled: true,
                                    formatter: function () { return this.point.longName },
                                    align: "left",
                                    inside: true,
                                    style: {
                                        fontSize: "10px",
                                        //color: "black",
                                        fontWeight: "",
                                        textOutline: ""
                                    }
                                },
                            }],
                            title: getTitleOpt(null, $tile[0]),
                            xAxis: {
                                categories: categories
                            },
                            yAxis: {
                                title: {
                                    enabled: false
                                }
                            }
                        };
                        narrativeSupport(options);

                        let newChart = H.chart($container[0], options);

                        //get the original coordinates and safe store for sorting
                        let rect = $tile[0].getBoundingClientRect();
                        newChart.originalRect = rect;

                        charts.push(newChart);
                    });
                },
                copyCharts = function () {
                    //get all the charts and export as PDF
                    let charts = [];
                    //Copy all charts for safe keeping
                    H.charts
                        .filter(x => typeof (x) != "undefined")
                        .filter(x => typeof (x.container) != "undefined")
                        .forEach(chart => {
                            let opts = {};
                            let $chart = $(chart.container);
                            let $tile = $chart.parents(DashboardPowerups.SELECTORS.TILE_SELECTOR);
                            opts.title = getTitleOpt(chart, $tile[0]);
                            let newChart = copyChart(chart, opts, $copies[0]);

                            //get the original coordinates and safe store for sorting
                            let rect = $tile[0].getBoundingClientRect();
                            newChart.originalRect = rect;

                            charts.push(newChart);
                        });
                    return charts;
                },
                getTitleOpt = function (chart = null, tile = null) {  //Dynatrace charts don't set the title, get it and set it
                    let $chart, $tile;
                    if (chart != null) {
                        $chart = $(chart.container);
                        $tile = $chart.parents(DashboardPowerups.SELECTORS.TILE_SELECTOR);
                    } else if (tile != null) {
                        $tile = $(tile);
                    } else return null;

                    let $title = $tile.find(DashboardPowerups.SELECTORS.TITLE_SELECTOR);
                    let title = $title.text();
                    let idx = title.length;

                    //remove markers from title using string manipulation instead of regex to avoid excessive escaping
                    idx = DashboardPowerups.MARKERS.reduce((acc, marker) =>
                    (title.includes(marker) ?
                        Math.min(title.indexOf(marker), acc) :
                        Math.min(acc, idx))
                        , idx);
                    title = title.substring(0, idx)

                    if (typeof (title) != "undefined" && title.length)
                        return {
                            text: title,
                            align: "left",
                            style: {
                                color: "#454646",
                                fontSize: "12px"
                            }
                        }
                    else return null;
                },
                getSVG = function (charts, options, callback) {
                    const space = 10;
                    let svgArr = [],
                        top = 0,
                        width = 0,
                        fastForward = false,
                        addSVG = function (svgres, i) {
                            // Grab width/height from exported chart
                            let svgWidth = +svgres.match(
                                /^<svg[^>]*width\s*=\s*\"?(\d+)\"?[^>]*>/
                            )[1],
                                svgHeight = +svgres.match(
                                    /^<svg[^>]*height\s*=\s*\"?(\d+)\"?[^>]*>/
                                )[1],
                                // Offset the position of this chart in the final SVG
                                svg = svgres.replace('<svg', '<g transform="translate(0,' + top + ')" ');
                            svg = svg.replace('</svg>', '</g>');
                            top += svgHeight + (i + 1 === charts.length ? 0 : space);
                            width = Math.max(width, svgWidth);
                            svgArr.push(svg);
                        },
                        previewSVG = function (svg, i, chartOptions, result = null) {
                            let p = $.Deferred();  //expecting {refresh: bool, id: string}
                            pub.activeChart = charts[i];
                            pub.chartOptions = chartOptions;

                            if (!fastForward) {
                                startReportBeacon(`Preview SVG - ${i}`
                                    + (result && result.id ? ` - ${result.id}` : ''));
                                
                                $previewTitle.html(`<h4>Chart ${i}:</h4>`);
                                $previewContent.html(svg);
                                let id = (result != null && result.id) ? result.id : null;
                                buildOptions(chartOptions, p, id);

                                //next button
                                $(`#generateReportNextButton`).remove();
                                let $next = $(`<button type="button" id="generateReportNextButton">`)
                                    .on('click', gotoNext)
                                    .text("Next")
                                    .addClass("powerupButton")
                                    .addClass("powerupButtonDefault")
                                    .appendTo($buttonBar);

                                //fast forward button
                                $(`#generateReportFFButton`).remove();
                                let $ff = $(`<button type="button" id="generateReportFFButton">`)
                                    .on('click', (e) => {
                                        fastForward = true;
                                        gotoNext(e);
                                    })
                                    .text(" >> ")
                                    .addClass("powerupButton")
                                    .appendTo($buttonBar);
                                endReportBeacon();
                            } else {
                                p.resolve({
                                    refresh: false,
                                    include: true
                                });
                            }
                            return (p);

                            function gotoNext(e) {
                                let checked = $(`#includeChart`).is(":checked");
                                $previewTitle.text(``);
                                $previewContent.html(``);
                                $previewOptions.html(``);
                                $(`#generateReportRefreshButton, #generateReportNextButton, #generateReportFFButton`).remove();
                                p.resolve({
                                    refresh: false,
                                    include: checked
                                });
                            }
                        },
                        getTitle = function (i, chartOptions = {}) {
                            //Dynatrace charts don't set the title, get it and set it
                            let $chart = $(charts[i].container);
                            let $tile = $chart.parents(DashboardPowerups.SELECTORS.TILE_SELECTOR);
                            let $title = $tile.find(DashboardPowerups.SELECTORS.TITLE_SELECTOR);
                            let title = $title.text();
                            let idx = title.length;

                            //remove markers from title using string manipulation instead of regex to avoid excessive escaping
                            idx = DashboardPowerups.MARKERS.reduce((acc, marker) =>
                            (title.includes(marker) ?
                                Math.min(title.indexOf(marker), acc) :
                                Math.min(acc, idx))
                                , idx);
                            title = title.substring(0, idx)

                            if (typeof (title) != "undefined" && title.length)
                                chartOptions.title = {
                                    text: title,
                                    align: "left",
                                    style: {
                                        color: "#454646",
                                        fontSize: "12px"
                                    }
                                }
                            return title; //in case we need the actual title string, use chartOptions by ref
                        },
                        exportChart = function (i, chartOptions = null, result = null) {
                            if (i === charts.length) { //when done, combine everything
                                let combinedSVG = '<svg height="' + top + '" width="' + width +
                                    '" version="1.1" xmlns="http://www.w3.org/2000/svg">' + svgArr.join('') + '</svg>';

                                //display combined SVG (as an img for copy-paste)
                                $previewTitle.text(`Download:  `);
                                $previewContent
                                    .html(combinedSVG)
                                    .addClass('powerupBordered');
                                let $svgButton = $(`<button>`)
                                    .text("SVG")
                                    .addClass("powerupButton")
                                    .appendTo($previewTitle)
                                    .on('click', () => {
                                        startReportBeacon("Download SVG");
        
                                        let svgOptions = JSON.parse(JSON.stringify(options));
                                        svgOptions.type = 'image/svg+xml';
                                        H.downloadSVGLocal(combinedSVG, svgOptions, function () {
                                            console.log("Failed to export SVG on client side");
                                        });
                                        endReportBeacon();
                                    })
                                let $pdfButton = $(`<button>`)
                                    .text("PDF")
                                    .addClass("powerupButton")
                                    .addClass("powerupButtonDefault")
                                    .appendTo($previewTitle)
                                    .on('click', () => {
                                        startReportBeacon("Download PDF");
                                        
                                        let pdfOptions = JSON.parse(JSON.stringify(options));
                                        pdfOptions.type = 'application/pdf';
                                        H.downloadSVGLocal(combinedSVG, pdfOptions, function () {
                                            console.log("Failed to export PDF on client side");
                                        });
                                        endReportBeacon();
                                    })
                                $(`#cancelReportButton`).text('Close');
                                $previewTitle.append(`<h3>Combined</h3>`);
                                return callback(combinedSVG);
                            }

                            if (charts[i] == null
                                || typeof (charts[i].userOptions) == "undefined") { //null chart, skip it
                                return exportChart(i + 1);
                            }

                            if (chartOptions == null)
                                chartOptions = charts[i].userOptions;

                            charts[i].getSVGForLocalExport(options, chartOptions, function () {
                                console.log("Powerup: getSVGForLocalExport Failed to get SVG");
                            }, async function (svg) {
                                let p_result = await previewSVG(svg, i, chartOptions, result);
                                pub.activeChart = null; //don't leak chart
                                if (p_result && p_result.refresh) {
                                    return exportChart(i, chartOptions, p_result);
                                } else {
                                    if (p_result && p_result.include)
                                        addSVG(svg, i);
                                    return exportChart(i + 1); // Export next only when this SVG is received
                                }
                            });
                        };

                    exportChart(0);
                };

            let exportCharts = function (charts, options) {
                options = H.merge(H.getOptions().exporting, options);

                // Get SVG asynchronously and then download the resulting SVG
                getSVG(charts, options, function (combinedsvg) {
                    //callback for when everything is built
                });

            },
                sortCharts = (inCharts) => { //sort based on originalRect coordinates
                    let sortedCharts = inCharts.sort((a, b) => {
                        if (typeof (a.originalRect) != "object"
                            || typeof (a.originalRect.x) == "undefined"
                            || typeof (a.originalRect.y) == "undefined"
                            || typeof (b.originalRect) != "object"
                            || typeof (b.originalRect.x) == "undefined"
                            || typeof (b.originalRect.y) == "undefined") {
                            console.warn("Powerup: chart copy missing originalRect");
                            return false;
                        }
                        if (a.originalRect.y < b.originalRect.y) {
                            return -1;
                        } else if (a.originalRect.y > b.originalRect.y) {
                            return 1;
                        } else if (a.originalRect.y == b.originalRect.y) {
                            if (a.originalRect.x < b.originalRect.x) {
                                return -1;
                            } else if (a.originalRect.x > b.originalRect.x) {
                                return 1;
                            } else if (a.originalRect.x == b.originalRect.x) {
                                return 0;
                            }
                        }
                    })
                    return sortedCharts;
                },
                cleanup = function (charts) {
                    charts.forEach((chart, cIdx) => {
                        if (chart && typeof (chart.destroy) == "function") {
                            if (typeof (chart.renderer) != "object") chart.renderer = {}; //crash prevention
                            try {
                                chart.destroy();
                            } catch (e) {
                                charts[cIdx] = null;
                                let hIdx = H.charts.findIndex(x => x == chart);
                                if (hIdx > -1) H.charts[hIdx] = undefined;
                            }
                        } else {
                            charts[cIdx] = null;
                            let hIdx = H.charts.findIndex(x => x == chart);
                            if (chart != undefined && hIdx > -1) H.charts[hIdx] = undefined;
                        }
                    });
                    charts = charts.filter(x => x != null);
                };

            // Set global default options for all charts
            H.setOptions({
                exporting: {
                    fallbackToExportServer: false // Ensure the export happens on the client side or not at all
                }
            });

            startReportBeacon("Generate report");
            let reportName = $(DashboardPowerups.SELECTORS.BANNER_SELECTOR).text();
            let charts = copyCharts();
            rebuildAndAddToplist(charts);
            charts = sortCharts(charts);
            $(`#cancelReportButton`).on('click', () => { cleanup(charts) }); //don't leak charts, if cancelling early
            exportCharts(charts,
                {
                    filename: reportName,
                    type: 'application/pdf',
                    libURL: DashboardPowerups.POWERUP_EXT_URL + '3rdParty/Highcharts/lib'
                })
            endReportBeacon(); //should fire before all of the nested callbacks
        }(Highcharts));
    }

    function buildOptions(chartOptions, promise, open = null) {
        let $optionsBlock = $(`#PowerupReportGeneratorPreviewOptions`)
            .html('<h4>Options:</h4>')
            .addClass('generated');

        drawIncludeOptions();
        //draw options sections closed, fill in after click
        let $story = $(createSection("PowerupReportOptionsStory", "Data Story (presets)", storyContent));
        let $foreground = $(createSection("PowerupReportOptionsForeground", "Foreground/Background", foregroundContent));
        let $segments = $(createSection("PowerupReportOptionsSegments", "Highlight Segments", highlightContent));
        let $trends = $(createSection("PowerupReportOptionsTrends", "Trendlines", trendlineContent));
        let $bands = $(createSection("PowerupReportOptionsBands", "Plot Bands / Lines", bandsAndLinesContent));
        let $annotations = $(createSection("PowerupReportOptionsAnnotations", "Annotations", annotationContent));
        let $narrative = $(createSection("PowerupReportOptionsNarrative", "Narrative", narrativeContent));
        let $declutter = $(createSection("PowerupReportOptionsDeclutter", "Declutter", declutterContent));
        let $json = $(createSection("PowerupReportOptionsJSON", "JSON (expert mode)", jsonContent));

        ///////////////////////////////
        function drawIncludeOptions() {
            let $include = $(`
                <span>Include chart:</span>
                <input type="checkbox" id="includeChart" checked>`)
                .appendTo($optionsBlock);
        }

        function createSection(id, name, callback = dummyContent) {
            let $section = $(`<section>`)
                .attr('id', id)
                .appendTo($optionsBlock);
            let $button = $(`
        <button role="button" class="powerupExpandable">
            <div role="img" name="dropdownopen" class="powerupExpandableArrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" focusable="false"><path d="M403.078 142.412L256 289.49 108.922 142.412l-45.255 45.255L256 380l192.333-192.333z"></path></svg>
            </div>
            <div class="powerupExpandableHeader"> ${name} </div>
        </button>`)
                .appendTo($section);
            let $content = $(`<div>`)
                .addClass("powerupOptionsContent")
                .appendTo($section);

            $button.on('click', function () {
                if ($section.hasClass("powerupOptionsOpen")) {
                    closeThisSection();
                } else {
                    openThisSection();
                    closeOtherSections();
                }
            });

            if (open === id) openThisSection();
            return $section;

            function openThisSection() {
                $section.addClass("powerupOptionsOpen");
                callback($content);
            }

            function closeThisSection() {
                $section.removeClass("powerupOptionsOpen");
                $content.html('');
            }

            function closeOtherSections() {
                $optionsBlock.find(`section:not([id=${id}])`).each((s_i, s) => {
                    $(s).removeClass("powerupOptionsOpen")
                        .find(`.powerupOptionsContent`)
                        .html('');
                })
            }
        }

        function dummyContent(content) {
            let $content = $(content);

            $content.html(`<h3>Dummy content...</h3>`);
        }

        function jsonContent(content) {
            let $content = $(content);
            let $div = $(`<div>`).appendTo($content);
            let $options = $(`<textarea>`)
                .addClass("powerupPreviewOptions")
                .val(JSON.stringify(chartOptions, null, 2))
                .appendTo($div)
                .on('keydown paste', debounce(validateJSON, 100));

            addRefreshButton(
                $div,
                () => {
                    let obj = JSON.parse($options.val());
                    Highcharts.merge(true, chartOptions, obj); //deep copy into chartOptions ref
                });

            let $help = $(`<div>Format help: <a href="https://api.highcharts.com/highcharts/" target="_blank">Highcharts</a></div>`)
                .addClass("powerupHelpFooter")
                .appendTo($content);
        }

        function storyContent(content) {
            let $content = $(content);

            const stories = [
                {
                    id: "improvingTrend",
                    name: "Improving Trend",
                    example: "Assets/datastory-positive.png",
                    plotBackgroundColor: "#e1f7dc",
                    highlightColor: "#2ab06f",
                    bandColor: "#99dea8"
                },
                {
                    id: "degradingTrend",
                    name: "Degrading Trend",
                    example: "Assets/datastory-degraded.png",
                    plotBackgroundColor: "#ffeaea",
                    highlightColor: "#c41425",
                    bandColor: "#f28289"
                },
                {
                    id: "interestingEvent",
                    name: "Interesting Event",
                    example: "Assets/datastory-interesting.png",
                    plotBackgroundColor: "#f8f8f8",
                    highlightColor: "#f5d30f",
                    bandColor: "#ffee7c"
                }
            ]

            buildRadioOption("none", "None", "", changeStory);
            stories.forEach(s => buildRadioOption(s.id, s.name, s.example, changeStory));
            /*buildRadioOption("improvingTrend", "Improving Trend", "Assets/story-mock1.png", changeStory);
            buildRadioOption("degradingTrend", "Degrading Trend", "Assets/story-mock7.png", changeStory);
            //buildRadioOption("positiveImpact", "Positive Impact", "Assets/story-mock2.png");
            //buildRadioOption("negativeImpact", "Negative Impact", "Assets/story-mock3.png");
            buildRadioOption("interestingEvent", "Interesting Event", "Assets/story-mock6.png", changeStory);
            //buildRadioOption("recommendation", "Recommendation", "Assets/story-mock4.png");*/

            addRefreshButton($content);

            function buildRadioOption(value, text, img, callback = notYetImplemented) {
                let $div, $radio, $right, $img, $span;
                $div = $(`<div>`)
                    .addClass('powerupRadioOption')
                    .appendTo($content);
                $radio = $(`<input type="radio" value="${value}" name="preset">`)
                    .appendTo($div)
                    .attr('checked', (chartOptions.dataStory && chartOptions.dataStory.id == value))
                    .on('click', () => { callback(value) });
                $right = $(`<div>`)
                    .appendTo($div);
                $span = $(`<label>`)
                    .text(text)
                    .on('click', () => { $radio.trigger('click') })
                    .appendTo($right);
                $img = $(`<img>`)
                    .on('click', () => { $radio.trigger('click') })
                    .appendTo($right);
                if (img && img.length)
                    $img.attr('src', DashboardPowerups.POWERUP_EXT_URL + img);
            }

            function changeStory(value) {
                let story = stories.find(x => x.id == value);
                chartOptions.dataStory = story ?
                    JSON.parse(JSON.stringify(story)) :
                    undefined;

                if (chartOptions.dataStory && chartOptions.dataStory.plotBackgroundColor)
                    chartOptions.chart.plotBackgroundColor;
                else
                    delete chartOptions.chart.plotBackgroundColor;
            }
        }

        function foregroundContent(content) {
            let $content = $(content)
                .addClass('powerupNoFlex');
            let $table = $(`<table>`)
                .appendTo($content);
            let $header = $(`<tr><th>Series</th></tr>`)
                .appendTo($table);
            let $fgheader = $(`<th><a>Foreground</a></th>`)
                .addClass('powerupClickableHeader')
                .appendTo($header)
                .on('click', (e) => {
                    $table.find(`input[type=radio][value="fg"]`)
                        .trigger('click');
                });
            let $bgheader = $(`<th><a>Background</a></th>`)
                .addClass('powerupClickableHeader')
                .appendTo($header)
                .on('click', (e) => {
                    $table.find(`input[type=radio][value="bg"]`)
                        .trigger('click');
                });
            let $storyheader = !chartOptions.dataStory || !chartOptions.dataStory.highlightColor ?
                undefined :
                $(`<th><a>DataStory</a></th>`)
                    //.addClass('powerupClickableHeader')
                    .appendTo($header);


            chartOptions.series.forEach((s, s_idx) => {
                let name = seriesName(s);
                let color = s.color;
                let bgcolor = desaturate(color);
                let fgcolor = saturate(color);
                let storycolor = chartOptions.dataStory && chartOptions.dataStory.highlightColor ?
                    chartOptions.dataStory.highlightColor : undefined;

                let $row = $(`<tr>`);
                let $series = $(`<td>`)
                    .text(name)
                    .appendTo($row);
                let $fg = $(`<td>`)
                    .appendTo($row);
                let $bg = $(`<td>`)
                    .appendTo($row);
                let $fg_button = $(`<input type="radio" name="${s_idx}" value="fg">`)
                    .appendTo($fg)
                    .on('click', (e) => {
                        chartOptions.series[s_idx].color = fgcolor;
                        chartOptions.series[s_idx].zIndex = 4;
                        chartOptions.series[s_idx].shadow = true;
                    });
                let $bg_button = $(`<input type="radio" name="${s_idx}" value="bg">`)
                    .appendTo($bg)
                    .on('click', (e) => {
                        chartOptions.series[s_idx].color = bgcolor;
                        chartOptions.series[s_idx].zIndex = 2;
                        chartOptions.series[s_idx].shadow = false;
                    });
                let $fg_color = $(`<div>`)
                    .addClass('powerupColorPreview')
                    .html(`&nbsp;`)
                    .css('background-color', fgcolor)
                    .appendTo($fg)
                    .on('click', () => { $fg_button.trigger('click') });
                let $bg_color = $(`<div>`)
                    .addClass('powerupColorPreview')
                    .html(`&nbsp;`)
                    .css('background-color', bgcolor)
                    .appendTo($bg)
                    .on('click', () => { $bg_button.trigger('click') });
                $row.appendTo($table);

                if (storycolor) {
                    let $ds = $(`<td>`)
                        .appendTo($row);
                    let $ds_button = $(`<input type="radio" name="${s_idx}" value="ds">`)
                        .appendTo($ds)
                        .on('click', (e) => {
                            chartOptions.series[s_idx].color = storycolor;
                            chartOptions.series[s_idx].zIndex = 4;
                            chartOptions.series[s_idx].shadow = true;
                        });
                    let $ds_color = $(`<div>`)
                        .addClass('powerupColorPreview')
                        .html(`&nbsp;`)
                        .css('background-color', storycolor)
                        .appendTo($ds)
                        .on('click', () => { $ds_button.trigger('click') });
                }
            });
            addRefreshButton($content);
        }

        function declutterContent(content) {
            if (typeof (chartOptions) != "object" || !Object.keys(chartOptions).length) return false; //crash prevention
            let $content = $(content)
                .addClass('powerupNoFlex');
            let $table = $(`<table>`)
                .appendTo($content);
            let $header = $(`<tr><th>Visual</th></tr>`)
                .appendTo($table);
            let $enabledheader = $(`<th><a>Enabled</a></th>`)
                .addClass('powerupClickableHeader')
                .on('click', () => { $content.find(`input[type=radio][value="enable"]`).trigger('click') })
                .appendTo($header);
            let $disabledheader = $(`<th><a>Disabled</a></th>`)
                .addClass('powerupClickableHeader')
                .on('click', () => { $content.find(`input[type=radio][value="disable"]`).trigger('click') })
                .appendTo($header);

            //chart title
            if (typeof (chartOptions.title) != "object") chartOptions.title = {};
            buildTextRow("Chart Title", chartOptions.title.text, function (e) {
                let val = $(this).val();
                if (val && val.length) {
                    chartOptions.title.text = val;
                } else {
                    chartOptions.title.text = undefined;
                }
            });

            //plot background color
            if (typeof (chartOptions.chart.plotBackgroundColor) == "undefined") chartOptions.chart.plotBackgroundColor = "#f2f2f2";
            buildColorRow("Plot Background", chartOptions.chart.plotBackgroundColor, function (e) {
                let val = $(this).val();
                if (val && val.length) {
                    chartOptions.chart.plotBackgroundColor = val;
                } else {
                    chartOptions.chart.plotBackgroundColor = undefined;
                }
            });

            //chart border
            if (typeof (chartOptions.chart.borderWidth) == "undefined") chartOptions.chart.borderWidth = 0;
            buildRadioRow(
                "Chart Border", chartOptions.chart.borderWidth,
                () => {
                    chartOptions.chart.borderWidth = 1;
                    chartOptions.xAxis.gridLineColor = "#b7b7b7";
                    if (!chartOptions.chart.spacingBottom) chartOptions.chart.spacingBottom = 5;
                    if (!chartOptions.chart.spacingLeft) chartOptions.chart.spacingLeft = 5;
                    if (!chartOptions.chart.spacingRight) chartOptions.chart.spacingRight = 5;
                },
                () => { chartOptions.chart.borderWidth = 0 },
            );

            //plot border
            if (typeof (chartOptions.chart.plotBorderWidth) == "undefined") chartOptions.chart.plotBorderWidth = 0;
            buildRadioRow(
                "Plot Border", chartOptions.chart.plotBorderWidth,
                () => {
                    chartOptions.chart.plotBorderWidth = 1;
                    chartOptions.xAxis.gridLineColor = "#b7b7b7";
                },
                () => { chartOptions.chart.plotBorderWidth = 0 },
            );

            //xAxis title
            if (typeof (chartOptions.xAxis) != "object") chartOptions.xAxis = {};
            if (typeof (chartOptions.xAxis.title) != "object") chartOptions.xAxis.title = {};
            buildTextRow("xAxis Title", chartOptions.xAxis.title.text, function (e) {
                let val = $(this).val();
                if (val && val.length) {
                    chartOptions.xAxis.title.text = val;
                    chartOptions.xAxis.title.enabled = true
                } else {
                    chartOptions.xAxis.title.text = undefined;
                    chartOptions.xAxis.title.enabled = false
                }
            });

            //xAxis labels
            if (typeof (chartOptions.xAxis) != "object") chartOptions.xAxis = {};
            if (typeof (chartOptions.xAxis.labels) != "object") chartOptions.xAxis.labels = {};
            buildRadioRow(
                "xAxis Labels",
                chartOptions.xAxis.labels.enabled,
                () => { chartOptions.xAxis.labels.enabled = true },
                () => { chartOptions.xAxis.labels.enabled = false },
            );

            //xAxis gridlines
            if (typeof (chartOptions.xAxis) != "object") chartOptions.xAxis = {};
            buildRadioRow(
                "xAxis Gridlines",
                chartOptions.xAxis.gridLineWidth > 0,
                () => {
                    chartOptions.xAxis.gridLineWidth = 1;
                    chartOptions.xAxis.gridLineColor = "#b7b7b7";
                },
                () => { chartOptions.xAxis.gridLineWidth = 0 },
            );

            //legend
            if (typeof (chartOptions.legend) != "object") chartOptions.legend = {};
            if (typeof (chartOptions.legend.itemStyle) != "object") chartOptions.legend.itemStyle = {};
            buildRadioRow(
                "Legend",
                chartOptions.legend.enabled,
                () => {
                    chartOptions.series.forEach(s => {
                        s.prettyName = seriesName(s);
                    });
                    chartOptions.legend = {
                        enabled: true,
                        align: 'right',
                        layout: 'proximate',
                        width: 250,
                        labelFormatter: function(){
                            return this.options.prettyName
                        },
                        itemStyle: {
                            fontSize: "10px"
                        },
                    };
                    if(!chartOptions.chart.originalWidth){
                        chartOptions.chart.originalWidth = chartOptions.chart.width;
                        chartOptions.chart.width += 250;
                    }
                },
                () => { chartOptions.legend.enabled = false },
            );

            //yAxes titles & labels
            if (Array.isArray(chartOptions.yAxis)) {
                chartOptions.yAxis.forEach((yAxis, axisNum) => {
                    if (!pub.activeChart.yAxis[axisNum].visible) return;
                    if (typeof (yAxis.title) != "object") yAxis.title = {};
                    buildTextRow(`yAxis(${axisNum}) Title`, chartOptions.xAxis.title.text, function (e) {
                        let val = $(this).val();
                        if (val && val.length) {
                            yAxis.title.text = val;
                            yAxis.title.enabled = true
                        } else {
                            yAxis.title.text = undefined;
                            yAxis.title.enabled = false
                        }
                    });
                    if (typeof (yAxis.labels) != "object") yAxis.labels = {};
                    buildRadioRow(
                        `yAxis(${axisNum}) Labels`,
                        yAxis.labels.enabled,
                        () => { yAxis.labels.enabled = true },
                        () => { yAxis.labels.enabled = false },
                    );
                    buildRadioRow(
                        `yAxis(${axisNum}) Gridlines`,
                        yAxis.gridLineWidth > 0,
                        () => {
                            yAxis.gridLineWidth = 1;
                            yAxis.gridLineColor = "#b7b7b7";
                        },
                        () => { yAxis.gridLineWidth = 0 },
                    );
                })
            }

            //series data labels & markers
            if (Array.isArray(chartOptions.series)) {
                chartOptions.series.forEach((serie, s_idx) => {
                    let name = seriesName(serie);
                    if (typeof (serie.dataLabels) != "object") serie.dataLabels = {};
                    buildRadioRow(
                        `Series (${s_idx} - ${name}) Data Labels`,
                        serie.dataLabels.enabled,
                        () => { serie.dataLabels.enabled = true },
                        () => { serie.dataLabels.enabled = false },
                    );
                    if (typeof (serie.marker) != "object") serie.marker = {};
                    buildRadioRow(
                        `Series (${s_idx} - ${name}) Data Markers`,
                        serie.marker.enabled,
                        () => { serie.marker.enabled = true },
                        () => { serie.marker.enabled = false },
                    );
                })
            }

            addRefreshButton($content);

            function buildRadioRow(name, enabled, enableCallback, disableCallback) {
                let $row = $(`<tr>`);
                let $name = $(`<td>`)
                    .text(name)
                    .appendTo($row);
                let $enable = $(`<td>`)
                    .appendTo($row);
                let $disable = $(`<td>`)
                    .appendTo($row);
                let $enable_button = $(`<input type="radio" value="enable">`)
                    .attr('name', name)
                    .attr('checked', enabled)
                    .appendTo($enable)
                    .on('click', enableCallback);
                let $disable_button = $(`<input type="radio" value="disable">`)
                    .attr('name', name)
                    .attr('checked', !enabled)
                    .appendTo($disable)
                    .on('click', disableCallback);

                $row.appendTo($table);
            }

            function buildTextRow(name, value, editCallback) {
                let $row = $(`<tr>`);
                let $name = $(`<td>`)
                    .text(name)
                    .appendTo($row);
                let $text = $(`<td colspan=2>`)
                    .appendTo($row);
                let $input = $(`<input type="text">`)
                    .attr('name', name)
                    .val(value)
                    .appendTo($text)
                    .on('change', editCallback);

                $row.appendTo($table);
            }


            function buildColorRow(name, value, editCallback) {
                let $row = $(`<tr>`);
                let $name = $(`<td>`)
                    .text(name)
                    .appendTo($row);
                let $color = $(`<td colspan=2>`)
                    .appendTo($row);
                let $input = $(`<input type="color">`)
                    .attr('name', name)
                    .val(value)
                    .appendTo($color)
                    .on('change', editCallback);

                $row.appendTo($table);
            }
        }

        function narrativeContent(content) {
            let $content = $(content);

            let $textarea = $(`<textarea>`)
                .addClass('powerupPreviewOptions')
                .appendTo($content);

            if (chartOptions.customNarrative && chartOptions.customNarrative.text)
                $textarea.val(chartOptions.customNarrative.text);

            $textarea.on('keydown paste', debounce(
                () => {
                    chartOptions.customNarrative.text = $textarea.val();
                },
                100));

            if (chartOptions.dataStory && chartOptions.dataStory.highlightColor) {
                $(`<p>Add data story highlighting by wrapping with **</p>`).appendTo($content);
            }

            addRefreshButton($content, () => {
                setNarrativeOptions(chartOptions);
            });
        }

        function bandsAndLinesContent(content) {
            let $content = $(content);
            let $buttons = $(`<div>`)
                .appendTo($content)
                .addClass('powerupNoFlex');
            let $linesAndBands = $(`<div>`)
                .appendTo($content)
                .addClass('powerupNoFlex');
            let $addLine = $(`<button>`)
                .addClass('powerupButton')
                .text(`+ Line`)
                .on(`click`, () => { addLine() })
                .appendTo($buttons);
            let $addBand = $(`<button>`)
                .addClass('powerupButton')
                .text(`+ Band`)
                .on(`click`, () => { addBand() })
                .appendTo($buttons);


            drawExistingPlotLines();
            drawExistingPlotBands();
            addRefreshButton($content);


            ///////////////
            function drawExistingPlotLines() {
                if (Array.isArray(chartOptions.xAxis)) {
                    chartOptions.xAxis.forEach((x, xIdx) => {
                        if (Array.isArray(x.plotLines) && x.plotLines.length)
                            x.plotLines.forEach(pl => { addLine(pl) })
                    });
                } else if (typeof (chartOptions.xAxis) == "object") {
                    if (Array.isArray(chartOptions.xAxis.plotLines) && chartOptions.xAxis.plotLines.length)
                        chartOptions.xAxis.plotLines.forEach(pl => { addLine(pl) })
                }
                if (Array.isArray(chartOptions.yAxis)) {
                    chartOptions.yAxis.forEach((y, yIdx) => {
                        if (Array.isArray(y.plotLines) && y.plotLines.length)
                            y.plotLines.forEach(pl => { addLine(pl) })
                    });
                }
            }

            function drawExistingPlotBands() {
                if (Array.isArray(chartOptions.xAxis)) {
                    chartOptions.xAxis.forEach((x, xIdx) => {
                        if (Array.isArray(x.plotBands) && x.plotBands.length)
                            x.plotBands.forEach(pl => { addBand(pl) })
                    });
                } else if (typeof (chartOptions.xAxis) == "object") {
                    if (Array.isArray(chartOptions.xAxis.plotBands) && chartOptions.xAxis.plotBands.length)
                        chartOptions.xAxis.plotBands.forEach(pl => { addBand(pl) })
                }
                if (Array.isArray(chartOptions.yAxis)) {
                    chartOptions.yAxis.forEach((y, yIdx) => {
                        if (Array.isArray(y.plotBands) && y.plotBands.length)
                            y.plotBands.forEach(pl => { addBand(pl) })
                    });
                }
            }

            function removeLineFromOptions(line) {
                if (chartOptions.xAxis && Array.isArray(chartOptions.xAxis)) {
                    chartOptions.xAxis.forEach(axis => {
                        if (Array.isArray(axis.plotLines)) {
                            axis.plotLines = axis.plotLines.filter(x => x != line);
                        }
                    })
                } else if (chartOptions.xAxis && typeof (chartOptions.xAxis) == "object") {
                    let axis = chartOptions.xAxis;
                    if (Array.isArray(axis.plotLines)) {
                        axis.plotLines = axis.plotLines.filter(x => x != line);
                    }
                }
                if (chartOptions.yAxis && Array.isArray(chartOptions.yAxis)) {
                    chartOptions.yAxis.forEach(axis => {
                        if (Array.isArray(axis.plotLines)) {
                            axis.plotLines = axis.plotLines.filter(x => x != line);
                        }
                    })
                }
            }

            function addLineToOptions(line) {
                let axis;
                if (Array.isArray(chartOptions[line.axis])) { //case: multiple axes
                    axis = chartOptions[line.axis][line.axisNum];
                } else if (typeof (chartOptions[line.axis]) == "object") { //case: single axis
                    axis = chartOptions[line.axis];
                } else { //case: not in options
                    chartOptions[line.axis] = [];
                    axis = {};
                    chartOptions[line.axis].push(axis);
                }
                if (!Array.isArray(axis.plotLines)) axis.plotLines = [];
                axis.plotLines.push(line);
            }

            function addLine(line = null) {
                if (line == null) {
                    line = {
                        color: "#526cff",
                        axis: "xAxis",
                        axisNum: 0,
                        value: null,
                        label: {
                            text: "New Line"
                        },
                        width: 2,
                        zIndex: 2
                    }
                }
                let axis, min, max;

                let $lineDiv = $(`<div>`)
                    .addClass('powerupLineConfig')
                    .appendTo($linesAndBands);
                let $table = $(`<table>`).appendTo($lineDiv);
                let $header = $(`<tr><th></th><th>Plot line</th></tr>`).appendTo($table);

                //Component: Axis selector
                let $axisRow = $(`<tr><td>Axis:</td><td></td></tr>`).appendTo($table);
                let $axisSelector = $(`<select>`).appendTo($axisRow.children().eq(1));
                pub.activeChart.xAxis.forEach((x, xIdx) => {
                    if (!x.visible) return;
                    let $opt = $(`<option>`)
                        .data('axis', 'xAxis')
                        .data('axisNum', xIdx)
                        .text(`xAxis - ${xIdx}`)
                        .appendTo($axisSelector);
                });
                pub.activeChart.yAxis.forEach((y, yIdx) => {
                    if (!y.visible) return;
                    let $opt = $(`<option>`)
                        .data('axis', 'yAxis')
                        .data('axisNum', yIdx)
                        .text(`yAxis - ${yIdx}`)
                        .appendTo($axisSelector);
                });

                let $valueRow = $(`<tr><td>Value:</td><td></td></tr>`).appendTo($table);
                let $range = $(`<input type="range">`)
                    .appendTo($valueRow.children().eq(1));
                let $value = $(`<input type="text">`)
                    .val(line.value)
                    .appendTo($valueRow.children().eq(1));
                $range.on('change', () => {
                    $value.val($range.val());
                    $value.trigger('change');
                });

                let $colorRow = $(`<tr><td>Color:</td><td></td></tr>`).appendTo($table);
                let $colorPicker = $(`<input type="color">`)
                    .val(line.color)
                    .appendTo($colorRow.children().eq(1));

                let $labelRow = $(`<tr><td>Label:</td><td></td></tr>`).appendTo($table);
                let $label = $(`<input type="text">`)
                    .val(line.label.text)
                    .appendTo($labelRow.children().eq(1));

                //vals
                $axisSelector.on('change', () => {
                    line.axis = $axisSelector.children(`:selected`).data('axis');
                    line.axisNum = $axisSelector.children(`:selected`).data('axisNum');

                    axis = pub.activeChart[line.axis][line.axisNum];
                    min = axis.min;
                    max = axis.max;
                    if (line.value == null
                        || line.value < min
                        || line.value > max)
                        line.value = (min + max) / 2;

                    $range
                        .attr('min', min)
                        .attr('max', max)
                        .val(line.value)
                        .trigger('change');

                    removeLineFromOptions(line);
                    addLineToOptions(line);

                    if (axis && axis.isDatetimeAxis) {
                        let $td = $valueRow.children().eq(1)
                            .addClass('powerupTDTooltip');
                        let $hover = $(`<div>`)
                            .addClass('powerupTDTooltipText')
                            .text(new Date($value.val()).toString())
                            .appendTo($td);
                        $value.on('change', () => {
                            $hover
                                .text(new Date(Number($value.val())).toString());
                        })
                    } else {
                        $valueRow.children().removeClass('powerupTDTooltip');
                        $valueRow.find(`.powerupTDTooltipText`).remove();
                    }
                });
                $axisSelector
                    .val(`${line.axis} - ${line.axisNum}`)
                    .trigger('change');

                //update on change
                $value.on('change', () => { line.value = $value.val() });
                $colorPicker.on('change', () => { line.color = $colorPicker.val() });
                $label.on('change', () => { line.label.text = $label.val() });

                //delete button
                let $remove = $(`<button>`)
                    .addClass('powerupButton')
                    .addClass('powerupCloseButton')
                    .text('x')
                    .appendTo($lineDiv)
                    .on('click', () => {
                        removeLineFromOptions(line);
                        $lineDiv.remove();
                    })

                return line;
            }

            function removeBandFromOptions(band) {
                if (chartOptions.xAxis && Array.isArray(chartOptions.xAxis)) {
                    chartOptions.xAxis.forEach(axis => {
                        if (Array.isArray(axis.plotBands)) {
                            axis.plotBands = axis.plotBands.filter(x => x != band);
                        }
                    })
                } else if (chartOptions.xAxis && typeof (chartOptions.xAxis) == "object") {
                    let axis = chartOptions.xAxis;
                    if (Array.isArray(axis.plotBands)) {
                        axis.plotBands = axis.plotBands.filter(x => x != band);
                    }
                }
                if (chartOptions.yAxis && Array.isArray(chartOptions.yAxis)) {
                    chartOptions.yAxis.forEach(axis => {
                        if (Array.isArray(axis.plotBands)) {
                            axis.plotBands = axis.plotBands.filter(x => x != band);
                        }
                    })
                }
            }

            function addBandToOptions(band) {
                let axis;
                if (Array.isArray(chartOptions[band.axis])) { //case: multiple axes
                    axis = chartOptions[band.axis][band.axisNum];
                } else if (typeof (chartOptions[band.axis]) == "object") { //case: single axis
                    axis = chartOptions[band.axis];
                } else { //case: not in options
                    chartOptions[band.axis] = [];
                    axis = {};
                    chartOptions[band.axis].push(axis);
                }
                if (!Array.isArray(axis.plotBands)) axis.plotBands = [];
                axis.plotBands.push(band);
            }

            function addBand(band = null) {
                if (band == null) {
                    band = {
                        color: null,
                        axis: "xAxis",
                        axisNum: 0,
                        from: null,
                        to: null,
                        label: {
                            text: "New Band"
                        },
                        zIndex: 0
                    }
                }
                let axis, min, max;

                let $bandDiv = $(`<div>`)
                    .addClass('powerupBandConfig')
                    .appendTo($linesAndBands);
                let $table = $(`<table>`).appendTo($bandDiv);
                let $header = $(`<tr><th></th><th>Plot band</th></tr>`).appendTo($table);

                //Component: Axis selector
                let $axisRow = $(`<tr><td>Axis:</td><td></td></tr>`).appendTo($table);
                let $axisSelector = $(`<select>`).appendTo($axisRow.children().eq(1));
                pub.activeChart.xAxis.forEach((x, xIdx) => {
                    if (!x.visible) return;
                    let $opt = $(`<option>`)
                        .data('axis', 'xAxis')
                        .data('axisNum', xIdx)
                        .text(`xAxis - ${xIdx}`)
                        .appendTo($axisSelector);
                });
                pub.activeChart.yAxis.forEach((y, yIdx) => {
                    if (!y.visible) return;
                    let $opt = $(`<option>`)
                        .data('axis', 'yAxis')
                        .data('axisNum', yIdx)
                        .text(`yAxis - ${yIdx}`)
                        .appendTo($axisSelector);
                });

                let $fromRow = $(`<tr><td>From:</td><td></td></tr>`).appendTo($table);
                let $fromRange = $(`<input type="range">`)
                    .appendTo($fromRow.children().eq(1));
                let $from = $(`<input type="text">`)
                    .val(band.from)
                    .appendTo($fromRow.children().eq(1));
                $fromRange.on('change', () => {
                    $from.val($fromRange.val());
                    $from.trigger('change');
                });

                let $toRow = $(`<tr><td>To:</td><td></td></tr>`).appendTo($table);
                let $toRange = $(`<input type="range">`)
                    .appendTo($toRow.children().eq(1));
                let $to = $(`<input type="text">`)
                    .val(band.to)
                    .appendTo($toRow.children().eq(1));
                $toRange.on('change', () => {
                    $to.val($toRange.val());
                    $to.trigger('change');
                });

                if(!band.color)
                    band.color = (chartOptions.dataStory && chartOptions.dataStory.bandColor) || "#fff5e4";
                let $colorRow = $(`<tr><td>Color:</td><td></td></tr>`).appendTo($table);
                let $colorPicker = $(`<input type="color">`)
                    .val(band.color)
                    .appendTo($colorRow.children().eq(1));

                let $labelRow = $(`<tr><td>Label:</td><td></td></tr>`).appendTo($table);
                let $label = $(`<input type="text">`)
                    .val(band.label.text)
                    .appendTo($labelRow.children().eq(1));

                //vals
                $axisSelector.on('change', () => {
                    band.axis = $axisSelector.children(`:selected`).data('axis');
                    band.axisNum = $axisSelector.children(`:selected`).data('axisNum');

                    axis = pub.activeChart[band.axis][band.axisNum];
                    min = axis.min;
                    max = axis.max;
                    if (band.from == null
                        || band.from < min
                        || band.from > max)
                        band.from = min + ((max - min) / 4);
                    if (band.to == null
                        || band.to < min
                        || band.to > max)
                        band.to = max - ((max - min) / 4);

                    $fromRange
                        .attr('min', min)
                        .attr('max', max)
                        .val(band.from)
                        .trigger('change');
                    $toRange
                        .attr('min', min)
                        .attr('max', max)
                        .val(band.to)
                        .trigger('change');

                    removeBandFromOptions(band);
                    addBandToOptions(band);

                    if (axis && axis.isDatetimeAxis) {
                        let $fromtd = $fromRow.children().eq(1)
                            .addClass('powerupTDTooltip');
                        let $fromhover = $(`<div>`)
                            .addClass('powerupTDTooltipText')
                            .text(new Date($from.val()).toString())
                            .appendTo($fromtd);
                        $from.on('change', () => {
                            band.from = Number($from.val());
                            let date = new Date(band.from).toString();
                            $fromhover.text(date);
                        })

                        let $totd = $toRow.children().eq(1)
                            .addClass('powerupTDTooltip');
                        let $tohover = $(`<div>`)
                            .addClass('powerupTDTooltipText')
                            .text(Date($to.val()).toString())
                            .appendTo($totd);
                        $to.on('change', () => {
                            band.to = Number($to.val());
                            let date = new Date(band.to).toString();
                            $tohover.text(date);
                        })
                    } else {
                        $fromRow.children().removeClass('powerupTDTooltip');
                        $fromRow.find(`.powerupTDTooltipText`).remove();
                        $toRow.children().removeClass('powerupTDTooltip');
                        $toRow.find(`.powerupTDTooltipText`).remove();
                    }
                });
                $axisSelector
                    .val(`${band.axis} - ${band.axisNum}`)
                    .trigger('change');

                //update on change
                $from.on('change', () => { band.from = $from.val() });
                $to.on('change', () => { band.to = $to.val() });
                $colorPicker.on('change', () => { band.color = $colorPicker.val() });
                $label.on('change', () => { band.label.text = $label.val() });

                //delete button
                let $remove = $(`<button>`)
                    .addClass('powerupButton')
                    .addClass('powerupCloseButton')
                    .text('x')
                    .appendTo($bandDiv)
                    .on('click', () => {
                        removeBandFromOptions(band);
                        $bandDiv.remove();
                    })

                return band;
            }
        }

        function highlightContent(content) {
            let $content = $(content);
            let $buttons = $(`<div>`)
                .appendTo($content)
                .addClass('powerupOptionsButtonBar');
            let $highlights = $(`<div>`)
                .appendTo($content)
                .addClass('powerupNoFlex');
            let $addHighlight = $(`<button>`)
                .addClass('powerupButton')
                .text(`+ Highlight`)
                .on(`click`, () => { addHighlight() })
                .appendTo($buttons);



            drawExistingHighlights();
            addRefreshButton($content);


            function drawExistingHighlights() {
                if (Array.isArray(chartOptions.series)) {
                    chartOptions.series.forEach((s, sIdx) => {
                        if (Array.isArray(s.highlights)) {
                            s.highlights.forEach(h => addHighlight(h))
                        }
                    })
                }
            }

            function removeHighlightFromOptions(highlight) {
                let series = chartOptions.series[highlight.seriesNum];
                if (Array.isArray(series.highlights)) {
                    series.highlights = series.highlights.filter(x => x != highlight);

                    if (series.originalColor) {
                        series.color = series.originalColor;
                        delete series.originalColor;
                        series.data.forEach((d, dIdx) => { //delete only matching, in case there's other highlights
                            if (typeof (d.x) != "undefined") {
                                if (d.x >= highlight.from && d.x <= highlight.to) {
                                    delete d.color;
                                    //delete d.marker;
                                }
                            }
                        })
                    }
                    if (series.type == "line") {
                        //delete series.zoneAxis;
                        if (Array.isArray(series.zones)) {
                            series.zones = series.zones
                                .filter(x =>
                                    x.hlID != highlight.id);
                        }
                    }
                }
            }

            function addHighlightToOptions(highlight) {
                let series = chartOptions.series[highlight.seriesNum];
                if (!Array.isArray(series.highlights)) series.highlights = [];
                series.highlights.push(highlight);

                let originalColor;
                if (series.originalColor) {
                    originalColor = series.originalColor;
                } else {
                    originalColor = series.color;
                    series.originalColor = originalColor;
                }
                series.color = desaturate(originalColor);
                series.data.forEach((d, dIdx) => {
                    if (Array.isArray(d) && d.length == 2) { //data type 1: array of 2 element arrays
                        if (d[0] >= highlight.from && d[0] <= highlight.to) {
                            let newD = {};
                            newD.x = d[0];
                            newD.y = d[1];
                            newD.color = highlight.color;
                            //newD.marker = highlight.marker;
                            series.data[dIdx] = newD; //switch to object
                        }
                    } else if (typeof (d) == "object") { //data type 2: object
                        if (d.x >= highlight.from && d.x <= highlight.to) {
                            d.color = highlight.color;
                            //d.marker = highlight.marker;
                        }
                    } else if (typeof (d.x) != "undefined") { //data type 3: primitive
                        let newD = {};
                        newD.y = d;
                        newD.color = highlight.color;
                        //newD.marker = highlight.marker;
                        series.data[dIdx] = newD; //switch to object
                    }
                })
                if (series.type == "line") {
                    series.zoneAxis = highlight.axis;
                    if (!Array.isArray(series.zones)) series.zones = [];
                    series.zones.push({
                        value: highlight.from,
                        hlID: highlight.id
                    });
                    series.zones.push({
                        value: highlight.to,
                        color: highlight.color,
                        hlID: highlight.id
                    });
                }
            }

            function addHighlight(highlight = null) {
                if (highlight == null) {
                    highlight = {
                        id: 'HL' + uniqId(),
                        color: null,
                        seriesNum: 0,
                        axis: "x",
                        from: null,
                        to: null,
                    }
                }
                let series, axis, min, max;

                let $highlightDiv = $(`<div>`)
                    .addClass('powerupLineConfig')
                    .appendTo($highlights);
                let $table = $(`<table>`).appendTo($highlightDiv);
                let $header = $(`<tr><th></th><th>Highlight</th></tr>`).appendTo($table);


                //Component: Series selector
                let $seriesRow = $(`<tr><td>Series:</td><td></td></tr>`).appendTo($table);
                let $seriesSelector = $(`<select>`).appendTo($seriesRow.children().eq(1));
                pub.activeChart.series.forEach((s, sIdx) => {
                    if (!s.visible) return;
                    let $opt = $(`<option>`)
                        .data('seriesNum', sIdx)
                        .val(sIdx)
                        .text(seriesName(s))
                        .appendTo($seriesSelector);
                });

                let $axisRow = $(`<tr><td>Axis:</td><td></td></tr>`).appendTo($table);
                let $axisSelector = $(`
                <select>
                    <option>x</option>
                    <option>y</option>
                </select>`)
                    .val(highlight.axis)
                    .appendTo($axisRow.children().eq(1));

                let $fromRow = $(`<tr><td>From:</td><td></td></tr>`).appendTo($table);
                let $fromRange = $(`<input type="range">`)
                    .appendTo($fromRow.children().eq(1));
                let $from = $(`<input type="text">`)
                    .val(highlight.from)
                    .appendTo($fromRow.children().eq(1));
                $fromRange.on('change', () => {
                    $from.val($fromRange.val());
                    $from.trigger('change');
                });

                let $toRow = $(`<tr><td>To:</td><td></td></tr>`).appendTo($table);
                let $toRange = $(`<input type="range">`)
                    .appendTo($toRow.children().eq(1));
                let $to = $(`<input type="text">`)
                    .val(highlight.to)
                    .appendTo($toRow.children().eq(1));
                $toRange.on('change', () => {
                    $to.val($toRange.val());
                    $to.trigger('change');
                });

                let $colorRow = $(`<tr><td>Color:</td><td></td></tr>`).appendTo($table);
                let $colorPicker = $(`<input type="color">`)
                    //.val(highlight.color)
                    .appendTo($colorRow.children().eq(1));


                //vals
                $seriesSelector.on('change', () => {
                    let newSeriesNum = $seriesSelector.children(`:selected`).data('seriesNum');
                    series = pub.activeChart.series[newSeriesNum];

                    //set color
                    if (highlight.color == null || newSeriesNum != highlight.seriesNum) {
                        if (chartOptions.dataStory && chartOptions.dataStory.highlightColor) {
                            highlight.color = chartOptions.dataStory.highlightColor;
                        } else {
                            highlight.color = saturate(series.color, "hex");
                        }

                    }
                    $colorPicker.val(highlight.color);

                    //add highlight
                    removeHighlightFromOptions(highlight);
                    highlight.seriesNum = newSeriesNum;

                    //handle axis
                    if (!Array.isArray(chartOptions.series[highlight.seriesNum].highlights))
                        chartOptions.series[highlight.seriesNum].highlights = [];
                    let existingAxis = chartOptions.series[highlight.seriesNum].highlights
                        .filter(h => h != highlight)
                        .map(h => h.axis);
                    if (Array.isArray(existingAxis) && existingAxis.length) {
                        $axisSelector
                            .val(existingAxis[0])
                            .prop('disabled', true);
                    } else {
                        $axisSelector
                            .prop('disabled', false);
                    }
                    $axisSelector.trigger('change');
                });

                $axisSelector.on('change', () => {
                    highlight.axis = $axisSelector.val();
                    //set extremes
                    if (highlight.axis == "x")
                        axis = series.xAxis;
                    else if (highlight.axis == "y")
                        axis = series.yAxis;
                    min = axis.min;
                    max = axis.max;
                    if (highlight.from == null
                        || highlight.from < min
                        || highlight.from > max)
                        highlight.from = min + ((max - min) / 4);
                    if (highlight.to == null
                        || highlight.to < min
                        || highlight.to > max)
                        highlight.to = max - ((max - min) / 4);

                    $fromRange
                        .attr('min', min)
                        .attr('max', max)
                        .val(highlight.from)
                        .trigger('change');
                    $toRange
                        .attr('min', min)
                        .attr('max', max)
                        .val(highlight.to)
                        .trigger('change');

                    if (axis && axis.isDatetimeAxis) {
                        let $fromtd = $fromRow.children().eq(1)
                            .addClass('powerupTDTooltip');
                        let $fromhover = $(`<div>`)
                            .addClass('powerupTDTooltipText')
                            .text(new Date(Number($from.val())).toString())
                            .appendTo($fromtd);
                        $from.on('change', () => {
                            $fromhover
                                .text(new Date(Number($from.val())).toString());
                        })

                        $totd = $toRow.children().eq(1)
                            .addClass('powerupTDTooltip');
                        $tohover = $(`<div>`)
                            .addClass('powerupTDTooltipText')
                            .text(new Date(Number($totd.val())).toString())
                            .appendTo($totd);
                        $to.on('change', () => {
                            $tohover
                                .text(new Date(Number($to.val())).toString());
                        })
                    } else {
                        $fromRow.children().removeClass('powerupTDTooltip');
                        $fromRow.find(`.powerupTDTooltipText`).remove();
                        $toRow.children().removeClass('powerupTDTooltip');
                        $toRow.find(`.powerupTDTooltipText`).remove();
                    }

                    removeHighlightFromOptions(highlight);
                    addHighlightToOptions(highlight);
                })

                //initial load
                $seriesSelector
                    .val(highlight.seriesNum)
                    .trigger('change');
                $axisSelector
                    .trigger('change');

                //update on change (must readd to chart to update zones)
                $from.on('change', () => {
                    let val = $from.val();
                    let num = Number(val);
                    highlight.from = (isNaN(num) ? num : val);
                    removeHighlightFromOptions(highlight);
                    addHighlightToOptions(highlight);
                });
                $to.on('change', () => {
                    let val = $to.val();
                    let num = Number(val);
                    highlight.to = (isNaN(num) ? num : val);
                    removeHighlightFromOptions(highlight);
                    addHighlightToOptions(highlight);
                });
                $colorPicker.on('change', () => {
                    highlight.color = $colorPicker.val();
                    removeHighlightFromOptions(highlight);
                    addHighlightToOptions(highlight);
                });

                //delete button
                let $remove = $(`<button>`)
                    .addClass('powerupButton')
                    .addClass('powerupCloseButton')
                    .text('x')
                    .appendTo($highlightDiv)
                    .on('click', () => {
                        removeHighlightFromOptions(highlight);
                        $highlightDiv.remove();
                    })

                return highlight;
            }
        }

        function annotationContent(content) {
            let $content = $(content);
            let $buttons = $(`<div>`)
                .appendTo($content)
                .addClass('powerupOptionsButtonBar');
            let $annotations = $(`<div>`)
                .appendTo($content)
                .addClass('powerupNoFlex');
            let $addAnnotation = $(`<button>`)
                .addClass('powerupButton')
                .text(`+ Annotation`)
                .on(`click`, () => { addAnnotation() })
                .appendTo($buttons);



            drawExistingAnnotations();
            addRefreshButton($content);


            function drawExistingAnnotations() {
                if (Array.isArray(chartOptions.annotations)) {
                    chartOptions.annotations.forEach((a, aIdx) => addAnnotation(a));
                }
            }

            function removeAnnotationFromOptions(annotation) {
                if (Array.isArray(chartOptions.annotations)) {
                    chartOptions.annotations = chartOptions.annotations.filter(x => x != annotation);
                }
            }

            function addAnnotationToOptions(annotation) {
                if (!Array.isArray(chartOptions.annotations)) chartOptions.annotations = [];
                if (!chartOptions.annotations.includes(annotation))
                    chartOptions.annotations.push(annotation);
            }

            function addAnnotation(annotation = null) {
                if (annotation == null) {
                    annotation = {
                        id: 'a' + uniqId(),
                        seriesNum: 0,
                        labels: [{
                            point: {
                                xAxis: 0,
                                yAxis: 0,
                                x: null,
                                y: null
                            },
                            text: 'x: {x}<br/>y: {y}',
                            backgroundColor: 'rgba(255,249,213,0.5)'
                        }]
                    }
                }
                let series, axis, xmin, xmax, ymin, ymax,
                    point = annotation.labels[0].point;

                let $annotationDiv = $(`<div>`)
                    .addClass('powerupLineConfig')
                    .appendTo($annotations);
                let $table = $(`<table>`).appendTo($annotationDiv);
                let $header = $(`<tr><th></th><th>Annotation</th></tr>`).appendTo($table);


                //Component: Series selector
                let $seriesRow = $(`<tr><td>Series:</td><td></td></tr>`).appendTo($table);
                let $seriesSelector = $(`<select>`).appendTo($seriesRow.children().eq(1));
                pub.activeChart.series.forEach((s, sIdx) => {
                    if (!s.visible) return;
                    let $opt = $(`<option>`)
                        .data('seriesNum', sIdx)
                        .val(sIdx)
                        .text(seriesName(s))
                        .appendTo($seriesSelector);
                });

                let $xRow = $(`<tr><td>X:</td><td></td></tr>`).appendTo($table);
                let $xRange = $(`<input type="range">`)
                    .appendTo($xRow.children().eq(1));
                let $x = $(`<input type="text">`)
                    .val(point.x)
                    .appendTo($xRow.children().eq(1));
                $xRange.on('change', () => {
                    $x.val($xRange.val());
                    $x.trigger('change');
                });

                let $yRow = $(`<tr><td>Y:</td><td></td></tr>`).appendTo($table);
                let $yRange = $(`<input type="range">`)
                    .appendTo($yRow.children().eq(1));
                let $y = $(`<input type="text">`)
                    .val(point.y)
                    .appendTo($yRow.children().eq(1));
                $yRange.on('change', () => {
                    $y.val($yRange.val());
                    $y.trigger('change');
                });

                let $colorRow = $(`<tr><td>Background:</td><td></td></tr>`).appendTo($table);
                let $colorPicker = $(`<input type="color">`)
                    .val(colorToHex(annotation.labels[0].backgroundColor))
                    .appendTo($colorRow.children().eq(1));

                let $textRow = $(`<tr><td>Text:</td><td></td></tr>`).appendTo($table);
                let $text = $(`<input type="text">`)
                    .val(annotation.labels[0].text)
                    .appendTo($textRow.children().eq(1));

                //vals
                $seriesSelector.on('change', () => {
                    let newSeriesNum = $seriesSelector.children(`:selected`).data('seriesNum');
                    series = pub.activeChart.series[newSeriesNum];
                    annotation.seriesNum = newSeriesNum;

                    //add annotation
                    axis = series.xAxis;
                    xmin = axis.min;
                    xmax = axis.max;
                    ymin = series.yAxis.min;
                    ymax = series.yAxis.max;
                    if (point.x == null
                        || point.x < xmin
                        || point.x > xmax) {
                        let goal = xmin + ((xmax - xmin) / 2);
                        let dataPoint = series.data //find closest point
                            .reduce((prev, curr) => Math.abs(curr.x - goal) < Math.abs(prev.x - goal) ? curr : prev);
                        point.x = dataPoint.x;
                        point.y = dataPoint.y;
                    }


                    $xRange
                        .attr('min', xmin)
                        .attr('max', xmax)
                        .val(point.x)
                        .trigger('change');
                    $yRange
                        .attr('min', ymin)
                        .attr('max', ymax)
                        .val(point.y)
                        .trigger('change');

                    if (axis && axis.isDatetimeAxis) {
                        let $xtd = $xRow.children().eq(1)
                            .addClass('powerupTDTooltip');
                        let $xhover = $(`<div>`)
                            .addClass('powerupTDTooltipText')
                            .text(new Date(Number($x.val())).toString())
                            .appendTo($xtd);
                        $x.on('change', () => {
                            $xhover
                                .text(new Date(Number($x.val())).toString());
                        })
                    } else {
                        $xRow.children().removeClass('powerupTDTooltip');
                        $xRow.find(`.powerupTDTooltipText`).remove();
                    }

                    if (series.yAxis && series.yAxis.isDatetimeAxis) {
                        $ytd = $yRow.children().eq(1)
                            .addClass('powerupTDTooltip');
                        $yhover = $(`<div>`)
                            .addClass('powerupTDTooltipText')
                            .text(Date($y.val()).toString())
                            .appendTo($ytd);
                        $y.on('change', () => {
                            $yhover
                                .text(new Date(Number($y.val())).toString());
                        })
                    } else {
                        $yRow.children().removeClass('powerupTDTooltip');
                        $yRow.find(`.powerupTDTooltipText`).remove();
                    }

                    addAnnotationToOptions(annotation);
                });



                //initial load
                $seriesSelector
                    .val(annotation.seriesNum)
                    .trigger('change');

                //update on change 
                $x.on('change', () => {
                    let val = $x.val();
                    let goal = Number(val);
                    if (isNaN(goal)) {
                        point.x = goal;
                    } else {
                        let dataPoint = series.data //find closest point
                            .reduce((prev, curr) => Math.abs(curr.x - goal) < Math.abs(prev.x - goal) ? curr : prev);
                        point.x = dataPoint.x;
                        point.y = dataPoint.y;
                        $x.val(point.x);

                        $yRange
                            .val(point.y)
                            .trigger('change');
                    }
                });
                $y.on('change', () => {
                    let val = $y.val();
                    let num = Number(val);
                    point.y = (isNaN(num) ? num : val);
                });
                $colorPicker.on('change', () => {
                    let color = $colorPicker.val();
                    let rgb = d3.rgb(color);
                    annotation.labels[0].backgroundColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`;
                });
                $text.on('change', () => {
                    annotation.labels[0].text = $text.val();
                })

                //delete button
                let $remove = $(`<button>`)
                    .addClass('powerupButton')
                    .addClass('powerupCloseButton')
                    .text('x')
                    .appendTo($annotationDiv)
                    .on('click', () => {
                        removeAnnotationFromOptions(annotation);
                        $annotationDiv.remove();
                    })

                return annotation;
            }
        }

        function trendlineContent(content) {
            let $content = $(content);
            let $buttons = $(`<div>`)
                .appendTo($content)
                .addClass('powerupOptionsButtonBar');
            let $trendlines = $(`<div>`)
                .appendTo($content)
                .addClass('powerupNoFlex');
            let $addTrendline = $(`<button>`)
                .addClass('powerupButton')
                .text(`+ Trendline`)
                .on(`click`, () => { addTrendline() })
                .appendTo($buttons);



            drawExistingTrendlines();
            addRefreshButton($content);


            function drawExistingTrendlines() {
                if (Array.isArray(chartOptions.trendlines)) {
                    chartOptions.trendlines.forEach((a, aIdx) => addTrendline(a));
                }
            }

            function removeTrendlineFromOptions(trendline) {
                if (Array.isArray(chartOptions.trendlines)) {
                    chartOptions.trendlines = chartOptions.trendlines.filter(x => x != trendline);
                }
                removeTrendlineFromSeries(trendline);
                removeR2(trendline);
            }

            function addTrendlineToOptions(trendline) {
                if (!Array.isArray(chartOptions.trendlines)) chartOptions.trendlines = [];
                if (!chartOptions.trendlines.includes(trendline)) {
                    chartOptions.trendlines.push(trendline);

                    addTrendlineToSeries(trendline);
                    if (trendline.showR2) addR2(trendline);
                }

            }

            function addTrendlineToSeries(trendline) {
                let series = pub.activeChart.series[trendline.seriesNum];

                switch (trendline.type) {
                    case "linear":
                    default:
                        trendline.reg = linearRegression(series.data);
                }

                let newSeries = {
                    type: 'line',
                    name: `${trendline.type}-${trendline.seriesNum}`,
                    id: `tl-${trendline.id}`,
                    originalSeriesNum: trendline.seriesNum,
                    data: trendline.reg.data,
                    color: trendline.color,
                    visible: true,
                    powerupTrendline: true
                }
                chartOptions.series.push(newSeries);
                pub.activeChart.addSeries(newSeries, false);
            }

            function addR2(trendline) {
                let last, x, y;
                if (trendline.reg.data) last = trendline.reg.data[trendline.reg.data.length - 1];
                else return;
                if (Array.isArray(last)) {
                    x = last[0];
                    y = last[1];
                } else if (typeof (last) == "object") {
                    x = last.x;
                    y = last.y;
                }
                let annotation = {
                    id: `a-${trendline.id}`,
                    seriesNum: trendline.seriesNum,
                    forTrendline: true,
                    labels: [{
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: x,
                            y: y
                        },
                        text: `r^2: ${trendline.reg.r2.toFixed(2)}`,
                        backgroundColor: 'rgba(0,0,0,0)',
                        borderWidth: 0,
                        style: {
                            color: 'black',
                            fontSize: '8px'
                        }
                    }]
                }
                if (!Array.isArray(chartOptions.annotations)) chartOptions.annotations = [];
                if (!chartOptions.annotations.includes(annotation))
                    chartOptions.annotations.push(annotation);
            }

            function removeR2(trendline) {
                if (Array.isArray(chartOptions.annotations)) {
                    chartOptions.annotations = chartOptions.annotations
                        .filter(a => a.id != `a-${trendline.id}`);
                }
            }

            function removeTrendlineFromSeries(trendline) {
                chartOptions.series = chartOptions.series
                    .filter(s => !(s.powerupTrendline && s.originalSeriesNum == trendline.seriesNum))

                let activeSeries = pub.activeChart.get(`tl-${trendline.id}`);
                if (activeSeries)
                    activeSeries.remove();
            }

            function addTrendline(trendline = null) {
                if (trendline == null) {
                    trendline = {
                        id: 'tl' + uniqId(),
                        seriesNum: 0,
                        color: null,
                        type: "linear",
                        showR2: true
                    }
                }
                let series;

                let $trendlineDiv = $(`<div>`)
                    .addClass('powerupLineConfig')
                    .appendTo($trendlines);
                let $table = $(`<table>`).appendTo($trendlineDiv);
                let $header = $(`<tr><th></th><th>Trendline</th></tr>`).appendTo($table);


                //Component: Series selector
                let $seriesRow = $(`<tr><td>Series:</td><td></td></tr>`).appendTo($table);
                let $seriesSelector = $(`<select>`).appendTo($seriesRow.children().eq(1));
                pub.activeChart.series
                    .filter(s => !s.powerupTrendline)
                    .forEach((s, sIdx) => {
                        if (!s.visible) return;
                        let $opt = $(`<option>`)
                            .data('seriesNum', sIdx)
                            .val(sIdx)
                            .text(seriesName(s))
                            .appendTo($seriesSelector);
                    });

                let $typeRow = $(`<tr><td>Type:</td><td></td></tr>`).appendTo($table);
                let $typeSelector = $(
                    `<select>
                            <option selected>linear</option>
                        </select>`)
                    .appendTo($typeRow.children().eq(1));

                let $colorRow = $(`<tr><td>Color:</td><td></td></tr>`).appendTo($table);
                let $colorPicker = $(`<input type="color">`)
                    .val(colorToHex(trendline.color))
                    .appendTo($colorRow.children().eq(1));

                let $r2Row = $(`<tr><td>Show r<sup>2</sup>:</td><td></td></tr>`).appendTo($table);
                let $r2 = $(`<input type="checkbox">`)
                    .prop('checked', trendline.showR2)
                    .appendTo($r2Row.children().eq(1));

                //vals
                $seriesSelector.on('change', () => {
                    let newSeriesNum = $seriesSelector.children(`:selected`).data('seriesNum');
                    series = pub.activeChart.series[newSeriesNum];

                    //set color
                    if (trendline.color == null || newSeriesNum != trendline.seriesNum) {
                        if (chartOptions.dataStory && chartOptions.dataStory.highlightColor) {
                            trendline.color = chartOptions.dataStory.highlightColor;
                        } else {
                            trendline.color = saturate(series.color, "hex");
                        }

                    }
                    $colorPicker.val(trendline.color);

                    removeTrendlineFromOptions(trendline);
                    trendline.seriesNum = newSeriesNum;
                    addTrendlineToOptions(trendline);
                });

                //initial load
                $seriesSelector
                    .val(trendline.seriesNum)
                    .trigger('change');

                //changes
                $typeSelector.on('change', () => {
                    trendline.type = $typeSelector.val();
                });
                $colorPicker.on('change', () => {
                    trendline.color = $colorPicker.val();
                });
                $r2.on('click', () => {
                    trendline.showR2 = $r2.prop('checked');
                });

                //delete button
                let $remove = $(`<button>`)
                    .addClass('powerupButton')
                    .addClass('powerupCloseButton')
                    .text('x')
                    .appendTo($trendlineDiv)
                    .on('click', () => {
                        removeTrendlineFromOptions(trendline);
                        $trendlineDiv.remove();
                    })

                return trendline;
            }
        }

        function notYetImplemented() {
            alert(`Not yet implemented...`);
        }

        function addRefreshButton(target = "#PowerupReportGeneratorButtonBar", refreshCallback = () => { }) {
            let $target = $(target);
            let id = $(`section.powerupOptionsOpen`).attr('id');
            let $refresh = $(`<button type="button" id="generateReportRefreshButton">`)
                .on('click', (e) => {
                    try {
                        refreshCallback();
                    } catch (err) {
                        let $err = $target.find(`.powerupErrorBar`);
                        if (!$err.length)
                            $err = $(`<span>`)
                                .addClass("powerupErrorBar")
                                .appendTo($target);
                        $err.text(err);
                        return (false);
                    }

                    $(`#generateReportRefreshButton`).remove();
                    promise.resolve({
                        refresh: true,
                        id: id
                    });
                })
                .text("Refresh")
                .addClass("powerupButton")
                .appendTo($target);

            return $refresh;
        }
    }

    function validateJSON(e) {
        let $target = $(e.target);
        let valid = true;
        try {
            JSON.parse($target.val());
        } catch (err) {
            valid = false;
        }
        if (valid) {
            $target.addClass("powerupValidJSON");
            $target.removeClass("powerupInvalidJSON");
        } else {
            $target.addClass("powerupInvalidJSON");
            $target.removeClass("powerupValidJSON");
        }
    }

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

    const componentToHex = (c) => {
        let num = Math.round(c);
        num = Math.min(num, 255);
        num = Math.max(num, 0);
        let hex = num.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    const rgbToHex = (r, g, b) => {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    const colorToHex = (s) => {
        let c = d3.rgb(s);
        return rgbToHex(c.r, c.g, c.b);
    }

    const desaturate = (color, format = "rgb") => {
        const factor = 0.25;
        if (typeof (d3) == "undefined") {
            console.log(`Powerup reporting: WARN - D3 unavailable`);
            return color;
        }

        let hsl = d3.hsl(color);
        if (isNaN(hsl.h)) {
            console.log(`Powerup reporting: WARN - D3 invalid color`);
            return color;
        }

        hsl.s = hsl.s * factor;

        switch (format) {
            case "hex":
                let rgb = hsl.rgb();
                return rgbToHex(rgb.r, rgb.g, rgb.b);
            //case "hsl":
            //    return hsl.formatHsl();
            case "d3":
                return hsl;
            case "rgb":
            default:
                return hsl.toString();
        }
    }

    const saturate = (color, format = "rgb") => {
        const factor = 1.75;
        if (typeof (d3) == "undefined") {
            console.log(`Powerup reporting: WARN - D3 unavailable`);
            return color;
        }

        let hsl = d3.hsl(color);
        if (isNaN(hsl.h)) {
            console.log(`Powerup reporting: WARN - D3 invalid color`);
            return color;
        }

        hsl.s = hsl.s * factor;

        switch (format) {
            case "hex":
                let rgb = hsl.rgb();
                return rgbToHex(rgb.r, rgb.g, rgb.b);
            //case "hsl":
            //    return hsl.formatHsl();
            case "d3":
                return hsl;
            case "rgb":
            default:
                return hsl.toString();
        }
    }

    const seriesName = (series) => {
        let name = "";
        if (series && series.name && !series.name.startsWith("null")) {
            name = series.name;
        } else if (series && series.name && series.name.match(/null¦[^»]+»([^»]+)»/)){
            name = series.name.match(/null¦[^»]+»([^»]+)»/)[1];
        } else if (series && series.entityId && !series.entityId.startsWith("null")) {
            name = series.entityId;
        } else if (series && series.chartableTimeseriesUniqueIdentifier && !series.chartableTimeseriesUniqueIdentifier.startsWith("null")) {
            name = series.chartableTimeseriesUniqueIdentifier;
        } 
        let idx = name.indexOf('¦');
        if (idx < 1) idx = name.indexOf('|'); //sometimes a broken pipe, sometimes a pipe
        if (idx > 0) name = name.substring(0, idx);

        if (name == "" && typeof (series.index) !== "undefined")
            name = `Series: ${series.index}`;


        //TODO: add DT API to get actual entity names
        return name;
    }

    const linearRegression = (data) => {
        let dataSet = data.filter(i => i.y != null).map(i => [i.x, i.y]);
        let x_sum = 0;
        let y_sum = 0;
        let xy_sum = 0;
        let xx_sum = 0;
        let yy_sum = 0;
        let count = 0;

        for (let i = 0; i < dataSet.length; i++) {
            if (dataSet[i][1] == null) continue;
            let x = dataSet[i][0];
            let y = dataSet[i][1];
            x_sum += x;
            y_sum += y;
            xx_sum += x * x;
            xy_sum += x * y;
            yy_sum += y * y;
            count++;
        }

        // Calculate m and b for the line equation: y = m * x + b
        let m = (count * xy_sum - x_sum * y_sum) / (count * xx_sum - x_sum * x_sum);
        let b = (y_sum / count) - (m * x_sum) / count;
        let r2 = Math.pow((count * xy_sum - x_sum * y_sum) / Math.sqrt((count * xx_sum - x_sum * x_sum) * (count * yy_sum - y_sum * y_sum)), 2);
        let line = [];

        for (let i = 0; i < dataSet.length; i++) {
            if (dataSet[i][1] == null) continue;
            let point = [
                dataSet[i][0],
                dataSet[i][0] * m + b
            ];
            line.push(point);
        }
        return { m: m, b: b, data: line, r2: r2 };
    }

    const narrativeSupport = (options) => {
        if (typeof (options.customNarrative) != "object")
            options.customNarrative = {
                text: "",
                width: 250,
                height: 200,
                position: "right",
                color: "#6d6d6d",
                x: 0,
                y: 0,
                pad: 2
            };
        if (typeof (options.chart) == "object") {
            if (typeof (options.chart.events) != "object")
                options.chart.events = {};
            if (typeof (options.chart.events.load) != "function")
                options.chart.events.load = drawNarrative;
            if (typeof (options.chart.events.exportData) != "function")
                options.chart.events.exportData = drawNarrative;
            if (typeof (options.chart.events.redraw) != "function")
                options.chart.events.redraw = drawNarrative;
        }

        function drawNarrative() {
            let cn = options.customNarrative;
            setNarrativeOptions(options);

            if (this.customNarrative) {
                this.customNarrative.destroy();
                this.customNarrative = undefined;
            }

            let color, text, bold = `font-weight: bold;`;
            color = (options.dataStory && options.dataStory.highlightColor) ?
                color = `color: ${options.dataStory.highlightColor};` :
                '';
            let re = /\*\*([^*]+)\*\*/g;
            text = cn.text.replace(re, `<span style="${color}${bold}">$1</span>`);

            //this.customNarrative = this.renderer.g('customNarrative').add();
            this.customNarrative = this.renderer.text(text, cn.x, cn.y)
                .css({
                    color: cn.color,
                    fontSize: "12px",
                    width: `${cn.width-20}px`
                    //width: `195px`
                })
                //.add(this.customNarrative);
                .add();
        }
    }

    const setNarrativeOptions = (options) => {
        let cn = options.customNarrative;
        switch (cn.position) {
            case "bottom":
                cn.x = 0;
                break;
            case "right":
            default:
                cn.x = options.chart.originalWidth || options.chart.width || 250;
                cn.x += 2;
                if (typeof (options.exporting) == "undefined") options.exporting = {}; //crash prevention
                if (cn.text.length) {
                    if (!options.chart.originalWidth) {
                        options.chart.originalWidth = options.chart.width;
                        options.chart.width += cn.width + (2 * cn.pad);
                        options.exporting.sourceWidth = options.chart.width;
                        options.chart.marginRight = cn.width + (2 * cn.pad);
                        //options.chart.spacingRight = options.customNarrative.width;
                        options.chart.plotBorderWidth = 1;
                    } else { //already expanded

                    }
                } else { //nothing to display
                    if (options.chart.originalWidth) {
                        options.chart.width = options.chart.originalWidth;
                        options.exporting.sourceWidth = options.chart.originalWidth;
                        delete options.chart.originalWidth;
                        delete options.chart.marginRight;
                    } else { //wasn't expanded

                    }
                }

                break;
        }

        cn.y = //(pub.activeChart ?
            //pub.activeChart.plotTop + pub.activeChart.plotHeight :
            //options.chart.height - 10 );
            options.chart.height / 2;
    }

    return pub;
})();
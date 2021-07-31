function openReportGenerator() {
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
}

function closeReportGenerator() {
    $("div.PowerupReportGenerator").remove();
}

function generateReport() {
    $(`#generateReportButton`).hide();
    let $previewContent = $(`#PowerupReportGeneratorPreviewContent`);
    let $previewTitle = $(`#PowerupReportGeneratorPreviewTitle`);
    let $previewOptions = $(`#PowerupReportGeneratorPreviewOptions`);
    let $buttonBar = $(`#PowerupReportGeneratorButtonBar`);
    let $copies = $(`#PowerupReportGeneratorHiddenCopy`);

    (function (H) {
        // adapted from https://jsfiddle.net/gh/get/library/pure/H/H/tree/master/samples/H/exporting/multiple-charts-offline/

        let copyChart = function (chart, chartOptions, containerContainer) {
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
                allOptions.chart.width ||
                (/px$/.test(cssWidth) && parseInt(cssWidth, 10)) ||
                600;
            sourceHeight = allOptions.exporting.sourceHeight ||
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
                    let $right = $toplist.children().last();
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
                    let newChart = H.chart($container[0], {
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
                                    color: "black",
                                    fontWeight: "",
                                    textOutline: ""
                                }
                            },
                        }],
                        title: getTitleOpt(null, $tile[0]),
                        xAxis: {
                            categories: categories
                        }
                    });
                    charts.push(newChart);
                });
            },
            copyCharts = function () {
                //get all the charts and export as PDF
                let charts = [];
                //Copy all charts for safe keeping
                H.charts.filter(x => typeof (x) != "undefined").forEach(chart => {
                    /*let opts = H.merge(chart.userOptions);
                    if (typeof (opts.series) == "undefined") opts.series = [];
                    chart.series.forEach(s => opts.series.push(H.merge(s.userOptions)));
                    let container = $(`<div>`).appendTo($copies)[0];*/
                    let opts = {};
                    opts.title = getTitleOpt(chart);
                    //let newChart = H.chart(container, opts);
                    let newChart = copyChart(chart, opts, $copies[0]);
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
                    validateJSON = function (e) {
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
                    },
                    previewSVG = function (svg, i, chartOptions) {
                        let p = $.Deferred();
                        $previewTitle.text(`Chart ${i}:`);
                        $previewContent.html(svg);
                        let $options = $(`<textarea>`)
                            .addClass("powerupPreviewOptions")
                            .val(JSON.stringify(chartOptions, null, 2))
                            .appendTo($previewOptions)
                            .on('keypress paste', validateJSON);
                        let $refresh = $(`<button type="button" id="generateReportRefreshButton">`)
                            .on('click', (e) => {
                                try {
                                    let obj = JSON.parse($options.val());
                                    H.merge(true, chartOptions, obj); //deep copy into chartOptions ref
                                } catch (err) {
                                    let $err = $previewOptions.find(`.powerupErrorBar`);
                                    if (!$err.length)
                                        $err = $(`<span>`)
                                            .addClass("powerupErrorBar")
                                            .appendTo($previewOptions);
                                    $err.text(err);
                                    return (false);
                                }

                                $previewTitle.text(``);
                                $previewContent.html(``);
                                $previewOptions.html(``);
                                $(`#generateReportRefreshButton, #generateReportNextButton`).remove();
                                p.resolve(true);
                            })
                            .text("Refresh")
                            .addClass("powerupButton")
                            .appendTo($buttonBar);
                        let $next = $(`<button type="button" id="generateReportNextButton">`)
                            .on('click', (e) => {
                                $previewTitle.text(``);
                                $previewContent.html(``);
                                $previewOptions.html(``);
                                $(`#generateReportRefreshButton, #generateReportNextButton`).remove();
                                p.resolve(false);
                            })
                            .text("Next")
                            .addClass("powerupButton")
                            .addClass("powerupButtonDefault")
                            .appendTo($buttonBar);
                        return (p);
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
                    exportChart = function (i, chartOptions = null) {
                        if (i === charts.length) { //when done, combine everything
                            let combinedSVG = '<svg height="' + top + '" width="' + width +
                                '" version="1.1" xmlns="http://www.w3.org/2000/svg">' + svgArr.join('') + '</svg>';
                            $previewTitle.text(`Combined:`);
                            $previewContent.html(combinedSVG);
                            return callback(combinedSVG);
                        }

                        if (charts[i] == null
                            || typeof (charts[i].userOptions) == "undefined") { //null chart, skip it
                            return exportChart(i + 1);
                        }

                        if (chartOptions == null)
                            chartOptions = charts[i].userOptions;

                        /*if (typeof (chartOptions.title) == "undefined" //try doing this before we copy
                            || chartOptions.title.text == null)
                            getTitle(i, chartOptions);*/

                        charts[i].getSVGForLocalExport(options, chartOptions, function () {
                            console.log("Powerup: getSVGForLocalExport Failed to get SVG");
                        }, async function (svg) {
                            let refresh = await previewSVG(svg, i, chartOptions);
                            if (refresh) {
                                return exportChart(i, chartOptions);
                            } else {
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
                H.downloadSVGLocal(combinedsvg, options, function () {
                    console.log("Failed to export on client side");
                });
                //moved to callback simplify async
                cleanup(charts);
            });

        },
            cleanup = function (charts) {
                charts.forEach(chart => {
                    chart.destroy();
                });
                $(`#cancelReportButton`).text('Close');
            };;

        // Set global default options for all charts
        H.setOptions({
            exporting: {
                fallbackToExportServer: false // Ensure the export happens on the client side or not at all
            }
        });


        let charts = copyCharts();
        rebuildAndAddToplist(charts);
        exportCharts(charts,
            {
                type: 'application/pdf',
                libURL: DashboardPowerups.POWERUP_EXT_URL + '3rdParty/Highcharts/lib'
            })

    }(Highcharts));
}
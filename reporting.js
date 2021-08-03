/*
Copyright 2020 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
var PowerupReporting = (function () {

    //Public methods
    var pub = {};

    pub.openReportGenerator = () => {

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
                        let newChart = H.chart($container[0], {
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

                            if (!fastForward) {
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

                            charts[i].getSVGForLocalExport(options, chartOptions, function () {
                                console.log("Powerup: getSVGForLocalExport Failed to get SVG");
                            }, async function (svg) {
                                let p_result = await previewSVG(svg, i, chartOptions, result);
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
                    H.downloadSVGLocal(combinedsvg, options, function () {
                        console.log("Failed to export on client side");
                    });
                    //moved to callback simplify async
                    cleanup(charts);
                });

            },
                cleanup = function (charts) {
                    charts.forEach(chart => {
                        if (chart && typeof (chart.destroy) == "function")
                            chart.destroy();
                    });
                    $(`#cancelReportButton`).text('Close');
                };

            // Set global default options for all charts
            H.setOptions({
                exporting: {
                    fallbackToExportServer: false // Ensure the export happens on the client side or not at all
                }
            });


            let charts = copyCharts();
            rebuildAndAddToplist(charts);
            $(`#cancelReportButton`).on('click', cleanup); //don't leak charts, if cancelling early
            exportCharts(charts,
                {
                    type: 'application/pdf',
                    libURL: DashboardPowerups.POWERUP_EXT_URL + '3rdParty/Highcharts/lib'
                })

        }(Highcharts));
    }

    function buildOptions(chartOptions, promise, open = null) {
        let $optionsBlock = $(`#PowerupReportGeneratorPreviewOptions`)
            .html('<h4>Options:</h4>')
            .addClass('generated');

        drawIncludeOptions();
        //draw options sections closed, fill in after click
        let $story = $(createSection("PowerupReportOptionsStory", "Data Story (presets)", storyContent));
        let $foreground = $(createSection("PowerupReportOptionsForeground", "Foreground/Background"));
        let $segments = $(createSection("PowerupReportOptionsSegments", "Highlight Segments"));
        let $bands = $(createSection("PowerupReportOptionsBands", "Plot Bands / Lines"));
        let $annotations = $(createSection("PowerupReportOptionsAnnotations", "Annotations"));
        let $narrative = $(createSection("PowerupReportOptionsNarrative", "Narrative"));
        let $declutter = $(createSection("PowerupReportOptionsDeclutter", "Declutter"));
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
            let id = $content.parents(`section`).attr('id');
            let $options = $(`<textarea>`)
                .addClass("powerupPreviewOptions")
                .val(JSON.stringify(chartOptions, null, 2))
                .appendTo($div)
                .on('keydown paste', debounce(validateJSON, 100));

            let $refresh = $(`<button type="button" id="generateReportRefreshButton">`)
                .on('click', (e) => {
                    try {
                        let obj = JSON.parse($options.val());
                        Highcharts.merge(true, chartOptions, obj); //deep copy into chartOptions ref
                    } catch (err) {
                        let $err = $div.find(`.powerupErrorBar`);
                        if (!$err.length)
                            $err = $(`<span>`)
                                .addClass("powerupErrorBar")
                                .appendTo($div);
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
                .appendTo($div);

            let $help = $(`<div>Format help: <a href="https://api.highcharts.com/highcharts/" target="_blank">Highcharts</a></div>`)
                .addClass("powerupHelpFooter")
                .appendTo($content);
        }

        function storyContent(content) {
            let $content = $(content);

            buildRadioOption("none", "None", "");
            buildRadioOption("improvingTrend", "Improving Trend", "Assets/story-mock1.png");
            buildRadioOption("degradingTrend", "Degrading Trend", "Assets/story-mock7.png");
            buildRadioOption("positiveImpact", "Positive Impact", "Assets/story-mock2.png");
            buildRadioOption("negativeImpact", "Negative Impact", "Assets/story-mock3.png");
            buildRadioOption("interestingOutlier", "Interesting Outlier", "Assets/story-mock6.png");
            buildRadioOption("recommendation", "Recommendation", "Assets/story-mock4.png");

            function buildRadioOption(value, text, img, callback = notYetImplemented) {
                let $div, $radio, $right, $img, $span;
                $div = $(`<div>`)
                    .addClass('powerupRadioOption')
                    .appendTo($content);
                $radio = $(`<input type="radio" value="${value}">`)
                    .appendTo($div)
                    .on('click', callback);
                $right = $(`<div>`)
                    .appendTo($div);
                $span = $(`<span>`)
                    .text(text)
                    .appendTo($right);
                $img = $(`<img>`)
                    .appendTo($right);
                if (img && img.length)
                    $img.attr('src', DashboardPowerups.POWERUP_EXT_URL + img);
            }
        }

        function notYetImplemented() {
            alert(`Not yet implemented...`);
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

    return pub;
})();
function openReportGenerator() {
    let $repgen = $("<div>")
        .html("<h3>Generate Report</h3>")
        .addClass("PowerupReportGenerator")
        .appendTo("body");

    let $cancel = $(`<button type="button">`)
        .on('click', closeReportGenerator)
        .text("Cancel")
        .addClass("powerupButton")
        .appendTo($repgen);

    let $generate = $(`<button type="button">`)
        .on('click', generateReport)
        .text("Generate")
        .addClass("powerupButton")
        .appendTo($repgen);
}

function closeReportGenerator() {
    $("div.PowerupReportGenerator").remove();
}

function generateReport() {
 
    (function (H) {
        // adapted from https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/exporting/multiple-charts-offline/

        let getSVG = function (charts, options, callback) {
            const space = 10;
            let svgArr = [],
                top = 0,
                width = 0,
                addSVG = function (svgres) {
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
                    top += svgHeight + space;
                    width = Math.max(width, svgWidth);
                    svgArr.push(svg);
                },
                exportChart = function (i) {
                    if (i === charts.length) {
                        return callback('<svg height="' + top + '" width="' + width +
                            '" version="1.1" xmlns="http://www.w3.org/2000/svg">' + svgArr.join('') + '</svg>');
                    }
                    let chartOptions = {};
                    //Dynatrace charts don't set the title, get it and set it
                    let $chart = $(charts[i].container);
                    let $tile = $chart.parents(DashboardPowerups.SELECTORS.TILE_SELECTOR);
                    let $title = $tile.find(DashboardPowerups.SELECTORS.TITLE_SELECTOR);
                    let title = $title.text();
                    DashboardPowerups.MARKERS.forEach(m => {
                        let r = new RegExp(m + '.*')
                        title = title.replace(m,'')
                    });
                    if(typeof(title) != "undefined" && title.length)
                        chartOptions.title = {
                            text: title,
                            align: "left",
                            style: {
                                color: "#454646",
                                fontSize: "12px"
                            }
                        }


                    charts[i].getSVGForLocalExport(options, chartOptions, function () {
                        console.log("Failed to get SVG");
                    }, function (svg) {
                        addSVG(svg);
                        return exportChart(i + 1); // Export next only when this SVG is received
                    });
                };
            exportChart(0);
        };

        let exportCharts = function (charts, options) {
            options = Highcharts.merge(Highcharts.getOptions().exporting, options);

            // Get SVG asynchronously and then download the resulting SVG
            getSVG(charts, options, function (svg) {
                Highcharts.downloadSVGLocal(svg, options, function () {
                    console.log("Failed to export on client side");
                });
            });
        };

        // Set global default options for all charts
        Highcharts.setOptions({
            exporting: {
                fallbackToExportServer: false // Ensure the export happens on the client side or not at all
            }
        });

        
        //get all the charts and export as PDF
        let charts = H.charts.filter(x => typeof(x) != "undefined");
        exportCharts(charts, 
            {
                type: 'application/pdf',
                libURL: DashboardPowerups.POWERUP_EXT_URL + '3rdParty/Highcharts/lib'
            })

    }(Highcharts));
}
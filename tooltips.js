const title_selector = '[uitestid="gwt-debug-title"]';
const val_selector = '[uitestid="gwt-debug-custom-chart-single-value-formatted-value"] > span:first-of-type';
const colorize_selector = '.grid-tile';
const svg_selector = '[uitestid="gwt-debug-MARKDOWN"] > div:first-child > div:first-child';
const colorhack = '!colorhack:';
const svghack = '!svghack:';
const linker = '!link=';
const markers = [colorhack, svghack, linker];
const series_opts = {
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


const tooltip_opts = {
    enabled: true,
    animation: false,
    outside: true,
    useHTML: false,
    hideDelay: 100,
    shared: true,
    formatter: function () {
        return this.points.reduce(function (s, point) {
            let n = point.series.name;
            let i = n.indexOf('¦') || "APPLICATION-007CAB1ABEACDFE1".length;
            let sn = n.substring(0, i) || "";
            return s + '<br/><span style=\"color:' + point.color + '\">●</span>' + sn + ': ' +
                Math.round(point.y, 1) + '';
        }, '<b>' + Highcharts.dateFormat("%H:%M", this.x) + '</b>');
    },
};


const xAxis_opts = {
    crosshair: {
        color: '#cccccc',
        width: '1px'
    }
};

function hackHighcharts() {
    //be sure not to leak off dashboards
    if (window.location.hash.startsWith("#dashboard;") ||
        window.location.hash.startsWith("#dashboard/dashboard;")) {
        console.log("Powerup: hacking Highcharts...");
        let hackedCount = 0;
        let promises = [];
        Highcharts.charts.slice().forEach(chart => {
            if (typeof (chart) !== "undefined" &&
                !chart.powerupHacked &&
                typeof (chart.container) != "undefined") {
                let p = new $.Deferred();
                promises.push(p);
                setTimeout(function () {
                    if (hackHighchart(chart))
                        hackedCount++;
                    p.resolve();
                }, 100); //still hitting synchronicity issues, try waiting
            }
        });
        $.when.apply($, promises).then(function () {
            $(".highcharts-container").css("z-index", 999);
            console.log("Powerup: " + hackedCount + " Highcharts hacked.");
        });
    } else {
        console.log("Powerup: no longer on a dashboard, removing hackHighcharts listener...");
        Highcharts.removeEvent(Highcharts.Chart, 'load', hackHighcharts);
    }
}

function hackHighchart(chart) {
    if (typeof (chart) !== "undefined" &&
        !chart.powerupHacked &&
        typeof (chart.container) != "undefined") {
        chart.series.forEach(series => {
            series.update(series_opts, false);
        });
        chart.update({ tooltip: tooltip_opts }, false);
        chart.update({ xAxis: xAxis_opts }, false);
        chart.update({ yAxis: xAxis_opts }, false);


        chart.redraw(false);

        //other dashboard hacking here
        cleanMarkup();

        return true;
    } else {
        return false;
    }
}


function addHackHighchartsListener() {
    console.log("Powerup: added hackHighcharts listener");
    Highcharts.addEvent(Highcharts.Chart, 'load', hackHighcharts);
    hackHighcharts();
}

function highlightPointsInOtherCharts(e) {
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

function removeHighlightPointsInOtherCharts(e) {
    const charts = Highcharts.charts.filter(x => typeof (x) != "undefined");
    for (let i = 0; i < charts.length; i++) {
        charts[i].xAxis[0].hideCrosshair();
    }
}

function loadChartSync() {
    $('[uitestid="gwt-debug-dashboardGrid"]').on("mouseover", ".highcharts-container", debouncedHighlight);
    $('[uitestid="gwt-debug-dashboardGrid"]').on("mouseout", ".highcharts-container", removeHighlightPointsInOtherCharts);
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

var debouncedHighlight = debounce(highlightPointsInOtherCharts, 50);

function cleanMarkup() {
    $(title_selector).each((i, el) => {
        let $title = $(el);
        let title = $title.text();
        let idx = title.length;

        idx = markers.reduce((acc, marker) => (title.includes(marker) ? Math.min(title.indexOf(marker), acc) : idx));

        let newTitle = title.substring(0, idx) +
            `<span class="powerup-markup">` +
            title.substring(idx) +
            `</span>`;

        if (idx < title.length)
            $title.html(newTitle);
    });
}
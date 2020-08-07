
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
    }
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
                    chart.series.forEach(series => {
                        series.update(series_opts, false);
                    });
                    //chart.update(xAxis_opts,false);
                    chart.update({ tooltip: tooltip_opts }, false);
                    chart.update({ xAxis: xAxis_opts }, false);
                    chart.update({ yAxis: xAxis_opts }, false);


                    chart.redraw(false);
                    //chart.powerupHacked = true;
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

function addHackHighchartsListener() {
    console.log("Powerup: added hackHighcharts listener");
    Highcharts.addEvent(Highcharts.Chart, 'load', hackHighcharts);
    hackHighcharts();
}
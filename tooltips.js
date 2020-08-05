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
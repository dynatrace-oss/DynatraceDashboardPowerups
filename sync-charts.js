///////////not working


/**
 * Highlight a point by showing tooltip, setting hover state and draw crosshair
 */
Highcharts.Point.prototype.highlight = function (event) {
    event = this.series.chart.pointer.normalize(event);
    this.onMouseOver(); // Show the hover marker
    //if (typeof (this.series.chart.tooltip) != "undefined")
    //    this.series.chart.tooltip.refresh(this); // Show the tooltip
    this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
};


/**
 * Override the reset function, we don't need to hide the tooltips and
 * crosshairs.
 */
Highcharts.Pointer.prototype.reset = function () {
    return undefined;
};

/** Taken from highcharts examples
 * In order to synchronize tooltips and crosshairs, override the
 * built-in events with handlers defined on the parent element.
 */

$('.highcharts-container').on("mousemove touchmove touchstart", (e) => {
    var point,
        i,
        event;

    Highcharts.charts.forEach(chart => {
        if (typeof (chart) !== "undefined") {
            // Find coordinates within the chart
            event = chart.pointer.normalize(e);
            // Get the hovered point
            point = chart.series[0].searchPoint(event, true);

            if (point) {
                point.highlight(e);
            }
        }
    });
});




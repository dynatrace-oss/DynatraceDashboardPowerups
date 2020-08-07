function highlightPointsInOtherCharts(e) {
    const container = this;
    //const charts = Highcharts.charts.slice();
    const charts = Highcharts.charts.filter(x=>typeof(x)!="undefined");
    const chartIndex = charts.findIndex(chart => chart.renderTo === container);
  
    if (chartIndex > -1) {
      //const chart = charts.splice(chartIndex, 1)[0];
      const chart = charts[chartIndex];
  
      const event = chart.pointer.normalize(e.originalEvent); // Find coordinates within the chart
      const point = chart.series[0].searchPoint(event, true); // Get the hovered point
  
      if (point) {
        const x = point.x;
        //point.highlight(e);
  
        /*charts.forEach(chart => {
          const points = chart.series[0].points;
          for (let i = 0; i < points.length; i = i + 1) {
            if (points[i].x === x) {
              points[i].highlight(e);
              break;
            }
          }
        })*/
        for(let i=0; i<charts.length; i++){
            if(i != chartIndex){
                const points = charts[i].points;
                for(let p=0; p< points.lenght; p++){
                    if(points[p].x === x){
                        points[p].onMouseOver();
                    }
                }
            }
        }
      }
    }
  }
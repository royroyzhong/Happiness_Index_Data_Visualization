class SpiderChart {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
   constructor(_config, _data, _dispatcher, _currYear) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 470,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || {top: 25, right: 110, bottom: 25, left: 110},
      tooltipPadding: _config.tooltipPadding || 15,
      levels: 5,
      // levelScale: 0.85,
      labelScale: 1.0,
      // facetPaddingScale: 2.5,
      maxValue: 1,
      radians: 2 * Math.PI,
      polygonAreaOpacity: 0.3,
      polygonStrokeOpacity: 1,
      polygonPointSize: 4,
      legendBoxSize: 10,
      translateX: 350 / 3,
      translateY: 350 / 8,
      paddingX: 350,
      paddingY: 350,
      colors: d3.scaleOrdinal(d3.schemeCategory10),
      showLevels: true,
      showLevelsLabels: true,
      showAxesLabels: true,
      showAxes: true,
      showLegend: true,
      showVertices: true,
      showPolygons: true
    }
    this.dispatcher = _dispatcher;
    this.data = _data;
    this.currYear = _currYear;
    this.initVis();
  }
  
  initVis() {
    // Create SVG area, initialize scales and axes
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // d3.select(vis.config.parentElement).selectAll("svg").remove();

    // create main vis svg
    vis.svg = d3.select(vis.config.parentElement)
      .append("svg").classed("svg-vis", true)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight)
      .append("svg:g")
      .attr("transform", "translate(" + vis.config.translateX + "," + vis.config.translateY + ")");

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
    vis.chart = vis.chartArea.append('g');

    // update vis parameters
    vis.allAxis = ["Social support", "Freedom", 
    "Perceptions of corruption", "Positive affect", "Negative affect"];
    vis.totalAxes = vis.allAxis.length;
    vis.radius = Math.min(vis.width / 2, vis.height / 2);

    // create verticesTooltip
    vis.verticesTooltip = d3.select("body")
      .append("div").classed("verticesTooltip", true)
      .attr("opacity", 0)
      .style({
        "position": "absolute",
        "color": "black",
        "font-size": "10px",
        "width": "100px",
        "height": "auto",
        "padding": "5px",
        "border": "2px solid gray",
        "border-radius": "5px",
        "pointer-events": "none",
        "opacity": "0",
        "background": "#f4f4f4"
      });

    // create levels
    vis.levels = vis.svg.selectAll(".levels")
      .append("svg:g").classed("levels", true);

    // create axes
    vis.axes = vis.svg.selectAll(".axes")
      .append("svg:g").classed("axes", true);

    // create vertices
    vis.vertices = vis.svg.selectAll(".vertices");

    //Initiate Legend	
    vis.legend = vis.svg.append("svg:g").classed("legend", true)
      .attr("height", vis.config.containerHeight / 2)
      .attr("width", vis.config.containerWidth / 2)
      .attr("transform", "translate(" + 0 + ", " + 1.1 * vis.config.containerHeight + ")");

    vis.svg.append('text')
      .attr('class', 'axis-title')
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', '.71em')
      .style("font-size", "15px")
      .text('Attribute:');

    vis.renderStatic();
    vis.updateVis();
  }

  // Update data
  updateVis() {
    let vis = this;

    // remove old data from the chart
    d3.select(vis.config.parentElement).selectAll("polygon").remove();
    d3.select(vis.config.parentElement).selectAll(".polygon-vertices").remove();

    // Preprocess data
    vis.filterYear = vis.data.filter((d) => {
      return (d.year == vis.currYear) && d.display
    });
    vis.groupedData = [];
    vis.groups = [];
    vis.filterYear.forEach(function(record) {
      let group = record["Country name"];
      if (vis.groups.indexOf(group) < 0) {
        vis.groups.push(group); // push to unique groups tracking
        vis.groupedData.push({ // push group node in data
          lifeLadder: record["Life Ladder"],
          group: group,
          axes: []
        });
      };
      vis.groupedData.forEach(function(d) {
        if (d.group === record["Country name"]) { // push record data into right group in data
          d.axes.push({
            axis: "Social support",
            value: record["Social support"]
          });
          d.axes.push({
            axis: "Freedom",
            value: record["Freedom to make life choices"]
          });
          d.axes.push({
            axis: "Perceptions of corruption",
            value: record["Perceptions of corruption"]
          });
          d.axes.push({
            axis: "Positive affect",
            value: record["Positive affect"]
          });
          d.axes.push({
            axis: "Negative affect",
            value: record["Negative affect"]
          });
        }
      });
    });

    vis.renderVis();
  }

  // Render the unchanging parts of the chart
  renderStatic() {
    let vis = this;
    
    // builds out the levels of the spiderweb
    for (var level = 0; level < vis.config.levels; level++) {
      let levelFactor = vis.radius * ((level + 1) / vis.config.levels);

      // build level-lines
      vis.levels
        .data(vis.allAxis)
        .enter()
        .append("svg:line").classed("level-lines", true)
        .attr("x1", function(d, i) { return levelFactor * (1 - Math.sin(i * vis.config.radians / vis.totalAxes)); })
        .attr("y1", function(d, i) { return levelFactor * (1 - Math.cos(i * vis.config.radians / vis.totalAxes)); })
        .attr("x2", function(d, i) { return levelFactor * (1 - Math.sin((i + 1) * vis.config.radians / vis.totalAxes)); })
        .attr("y2", function(d, i) { return levelFactor * (1 - Math.cos((i + 1) * vis.config.radians / vis.totalAxes)); })
        .attr("transform", "translate(" + (vis.width / 2 - levelFactor) + ", " + (vis.height / 2 - levelFactor) + ")")
        .attr("stroke", "gray")
        .attr("stroke-width", "0.5px");
    }

    // builds out the levels labels
    for (var level = 0; level < vis.config.levels; level++) {
      var levelFactor = vis.radius * ((level + 1) / vis.config.levels);

      // build level-labels
      vis.levels
        .data([1])
        .enter()
        .append("svg:text").classed("level-labels", true)
        .text((vis.config.maxValue * (level + 1) / vis.config.levels).toFixed(2))
        .attr("x", function(d) { return levelFactor * (1 - Math.sin(0)); })
        .attr("y", function(d) { return levelFactor * (1 - Math.cos(0)); })
        .attr("transform", "translate(" + (vis.width / 2 - levelFactor + 5) + ", " + (vis.height / 2 - levelFactor) + ")")
        .attr("fill", "gray")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10 * vis.config.labelScale + "px");
    }

    // builds out the axes
    vis.axes
      .data(vis.allAxis)
      .enter()
      .append("svg:line").classed("axis-lines", true)
      .attr("x1", vis.width / 2)
      .attr("y1", vis.height / 2)
      .attr("x2", function(d, i) { return vis.width / 2 * (1 - Math.sin(i * vis.config.radians / vis.totalAxes)); })
      .attr("y2", function(d, i) { return vis.height / 2 * (1 - Math.cos(i * vis.config.radians / vis.totalAxes)); })
      .attr("stroke", "grey")
      .attr("stroke-width", "1px");

    // builds out the axes labels
    vis.axes
      .data(vis.allAxis)
      .enter()
      .append("svg:text").classed("axis-labels", true)
      .text(function(d) { return d; })
      .attr("text-anchor", "middle")
      .attr("x", function(d, i) { return vis.width / 2 * (1 - 1.3 * Math.sin(i * vis.config.radians / vis.totalAxes)); })
      .attr("y", function(d, i) { return vis.height / 2 * (1 - 1.1 * Math.cos(i * vis.config.radians / vis.totalAxes)); })
      .attr("font-family", "sans-serif")
      .attr("font-size", 11 * vis.config.labelScale + "px");
  }

  // Render the dynamic parts of the chart
  renderVis() {
    let vis = this;

    // builds [x, y] coordinates of polygon vertices.
    vis.groupedData.forEach(function(group) {
      group.axes.forEach(function(d, i) {
        d.coordinates = { // [x, y] coordinates
          x: vis.width / 2 * (1 - (parseFloat(Math.max(d.value, 0)) / vis.config.maxValue) * Math.sin(i * vis.config.radians / vis.totalAxes)),
          y: vis.height / 2 * (1 - (parseFloat(Math.max(d.value, 0)) / vis.config.maxValue) * Math.cos(i * vis.config.radians / vis.totalAxes))
        };
      });
    });

    // builds out the polygon vertices of the dataset
    vis.groupedData.forEach(function(group, g) {
      vis.vertices
        .data(group.axes)
        .enter()
        .append("svg:circle").classed("polygon-vertices", true)
        .attr("r", vis.config.polygonPointSize)
        .attr("cx", function(d, i) { return d.coordinates.x; })
        .attr("cy", function(d, i) { return d.coordinates.y; })
        .attr("fill", vis.config.colors(g))
    });

    // builds out the polygon areas of the dataset
    vis.vertices
      .data(vis.groupedData)
      .enter()
      .append("svg:polygon").classed("polygon-areas", true)
      .attr("points", function(group) { // build verticesString for each group
        var verticesString = "";
        group.axes.forEach(function(d) { verticesString += d.coordinates.x + "," + d.coordinates.y + " "; });
        return verticesString;
      })
      .attr("stroke-width", "2px")
      .attr("stroke", function(d, i) { return vis.config.colors(i); })
      .attr("fill", function(d, i) { return vis.config.colors(i); })
      .attr("fill-opacity", vis.config.polygonAreaOpacity)
      .attr("stroke-opacity", vis.config.polygonStrokeOpacity)
      .on("mouseover", function(d) {
        vis.svg.selectAll(".polygon-areas") // fade all other polygons out
        .transition(250)
          .attr("fill-opacity", 0.1)
          .attr("stroke-opacity", 0.1);
        d3.select(this) // focus on active polygon
        .transition(250)
          .attr("fill-opacity", 0.7)
      })
      .on("mousemove", (event, d) => {
        let name = d.group;
        let ladder = d.lifeLadder ? d.lifeLadder : "N/A";
        d3.select('#spider-tooltip')
          .attr("fill-opacity", 1)
          .style('display', 'block')
          .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
          .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
          .html(`
            <div class="tooltip-title">${name}</div>
            <div>Life Ladder: ${ladder}</div>
            `);
      })
      .on("mouseleave", function() {
        d3.selectAll(".polygon-areas")
          .transition(250)
          .attr("fill-opacity", vis.config.polygonAreaOpacity)
          .attr("stroke-opacity", 1);
        d3.select("#spider-tooltip").style("display", "none");
      });

    // builds out the legend
    //Create legend squares
    vis.legend.selectAll(".legend-tiles")
      .data(vis.groupedData)
      .enter()
      .append("svg:rect").classed("legend-tiles", true)
      .attr("x", vis.width - vis.config.paddingX / 2)
      .attr("y", function(d, i) { return i * 2 * vis.config.legendBoxSize; })
      .attr("width", vis.config.legendBoxSize)
      .attr("height", vis.config.legendBoxSize)
      .attr("fill", function(d, g) { return vis.config.colors(g); });

    //Create text next to squares
    vis.legend.selectAll(".legend-labels")
      .data(vis.groupedData)
      .enter()
      .append("svg:text").classed("legend-labels", true)
      .attr("x", vis.width - vis.config.paddingX / 2 + (1.5 * vis.config.legendBoxSize))
      .attr("y", function(d, i) { return i * 2 * vis.config.legendBoxSize; })
      .attr("dy", 0.07 * vis.config.legendBoxSize + "em")
      .attr("font-size", 11 * vis.config.labelScale + "px")
      .attr("fill", "gray")
      .text(function(d) {
        return d.group;
      });
  }
}
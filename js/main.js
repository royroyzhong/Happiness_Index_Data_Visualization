const dispatcher = d3.dispatch(
  "timeline",
  "selectMap",
  "selectScatter",
  "selectedCountry",
  "staticMap"
);

/**
 * Load and combine data
 */
let geoData,
  data,
  filteredData,
  lanLonData,
  choroplethMap,
  spiderChart,
  smiley,
  scatterplot;
Promise.all([
  d3.json("data/world_countries_topo.json"),
  d3.csv("data/world-happiness-report.csv"),
]).then((dataset) => {
  geoData = dataset[0];
  data = dataset[1];
  data.forEach((d) => {
    d["year"] = +d["year"];
    d["Life Ladder"] = +d["Life Ladder"];
    d["Log GDP per capita"] = +d["Log GDP per capita"];
    d["Social support"] = +d["Social support"];
    d["Healthy life expectancy at birth"] =
      +d["Healthy life expectancy at birth"];
    d["Freedom to make life choices"] = +d["Freedom to make life choices"];
    d["Generosity"] = +d["Generosity"];
    d["Perceptions of corruption"] = +d["Perceptions of corruption"];
    d["Positive affect"] = +d["Positive affect"];
    d["Negative affect"] = +d["Negative affect"];
    d.display = false;
  });

  // map search
  $(() => {
    let countryNames = d3.map(data, function (d) {
      return d["Country name"];
    });
    let uniqueNames = countryNames.filter(
      (name, i, j) => j.indexOf(name) === i
    );
    $("#mapSearch").autocomplete({
      source: uniqueNames,
    });

    $("#mapSearch").keyup(function (e) {
      if (e.keyCode == 13) {
        // console.log('pressed enter');
        selectedCountry = $("#mapSearch").val();
        dispatcher.call("selectMap", event, selectedCountry);
      }
    });
  });

  // add groups to the scatterplot's dropdown filter
  d3.select("#filterScatter")
    .selectAll("myOptions")
    .data([
      "Log GDP per capita",
      "Social support",
      "Healthy life expectancy at birth",
      "Freedom to make life choices",
      "Generosity",
      "Perceptions of corruption",
      "Positive affect",
      "Negative affect",
    ])
    .enter()
    .append("option")
    .text(function (d) {
      return d;
    }) // text showed in the menu
    .attr("value", function (d) {
      return d;
    })
    .property("selected", function (d) {
      return d === "Social support";
    });

  // Scatterplot init
  scatterplot = new Scatterplot(
    {
      parentElement: "#scatterplot",
    },
    data,
    dispatcher,
    "Social support",
    2013
  );
  scatterplot.updateVis();

  // Create a waypoint for each `step` container
  const waypoints = d3.selectAll(".step").each(function (d, stepIndex) {
    return new Waypoint({
      // `this` contains the current HTML element
      element: this,
      handler: function (direction) {
        // Check if the user is scrolling up or down
        const nextStep =
          direction === "down" ? stepIndex : Math.max(0, stepIndex - 1);

        // Update visualization based on the current step
        choroplethMap.goToStep(nextStep);
      },
      // Trigger scroll event halfway up. Depending on the text length, 75% might be even better
      offset: "50%",
    });
  });

  spiderChart = new SpiderChart(
    {
      parentElement: "#spider",
    },
    data,
    dispatcher,
    2013
  );

  smiley = new Smileyface(
    {
      parentElement: "#smiley",
    },
    data,
    2013
  );

  // choroplethMap init
  choroplethMap = new ChoroplethMap(
    {
      parentElement: "#map",
    },
    geoData,
    data,
    dispatcher,
    2013
  );
});

// clear button
d3.select("#clear").on("click", function (event, d) {
  data.forEach((d) => {
    d.display = 0;
    d.min = 0;
    d.max = 0;
  });
  let currStep = data[0]["stepNumber"];
  // choroplethMap.cleared = 1;
  choroplethMap.goToStep(currStep);
  // choroplethMap.step0();
  scatterplot.updateVis();
  spiderChart.updateVis();
  smiley.updateVis();
});

d3.select("#filterScatter").on("change", function (d) {
  // recover the option that has been chosen
  let selectedOption = d3.select(this).property("value");
  scatterplot.xAttr = selectedOption;
  scatterplot.updateVis();
});
/**
 * Dispatcher waits for 'timeline' event
 *  filter data based on the selected categories and update the plot
 */
dispatcher.on("timeline", (selectedYear) => {
  choroplethMap.currYear = selectedYear;
  let currStep = data[0]["stepNumber"];
  choroplethMap.filterData();
  choroplethMap.goToStep(currStep);
  spiderChart.currYear = selectedYear;
  spiderChart.updateVis();
  scatterplot.currYear = selectedYear;
  scatterplot.updateVis();
  smiley.currYear = selectedYear;
  smiley.updateVis();
});
/**
 * Dispatcher waits for 'selectedCountry' event
 *  filter data based on the selected categories and update the plot
 */
dispatcher.on("selectedCountry", (selectedCountry) => {
  data.forEach((d) => {
    if (selectedCountry.includes(d["Country name"])) {
      d.display = true;
    } else {
      d.display = false;
    }
  });

  spiderChart.data = data;
  spiderChart.updateVis();
  smiley.Data = data;
  smiley.updateVis();
});
/**
 * Dispatcher waits for 'selectMap' event
 *  filter data based on the selected categories and update the plot
 */
dispatcher.on("selectMap", (selectedCountries) => {
  data.forEach((d) => {
    if (selectedCountries.includes(d["Country name"])) {
      d.display = true;
    } else {
      d.display = false;
    }
  });

  scatterplot.data = data;
  scatterplot.updateVis();
  spiderChart.data = data;
  spiderChart.updateVis();
  smiley.Data = data;
  smiley.updateVis();
});

/**
 * Dispatcher waits for 'staticMap' event
 *  filter data based on the selected categories and update the plot
 */

dispatcher.on("staticMap", (newData) => {
  newData.forEach((d) => {
    if (d.min || d.max) {
      d.display = true;
    } else {
      d.display = false;
    }
  });

  scatterplot.data = newData;
  scatterplot.updateVis();
  spiderChart.data = newData;
  spiderChart.updateVis();
  smiley.Data = newData;
  smiley.updateVis();
});

/**
 * Used to draw a graph on the page.
 * March 2018
 * Sid Stamm <sidstamm@gmail.com>
 */

var d3TimeParser = d3.timeParse("%m/%d/%Y, %I:%M:%S %p");

var CtoF = function(c) { return +((c * 9.0 / 5.0) + 32); }

var margin = {top: 30, right: 50, bottom: 30, left: 70},
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// global paths
var G_PATHS = ["temps_path", "dewpt_path", "clouds_path",
               "cons_path", "prod_path", "net_prod_path", "net_cons_path"];

var svgElt = d3.select("#graph")
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Append all the paths to the main SVG element.
G_PATHS.forEach(function(p) { svgElt.append("path").attr("id", p); });

svgElt.append("svg:rect")
      .attr("class", "pane")
      .attr("width", 900)
      .attr("height", 600)
      .style("border", "1px solid black")
      .call(d3.zoom().on("zoom", zoom));

//scales
var xscale        = d3.scaleTime().range([0, width   ]);
var yscale_energy = d3.scaleLinear().range([0, height  ]); // energy
var yscale_temps  = d3.scaleLinear().range([0, height/2]); // temps
var yscale_cloud  = d3.scalePow().exponent(0.7).range([0, height/4]); // clouds

// global x-axis used for everything (time)
var xaxis = d3.axisBottom(xscale);

/**
 * Creates a line generator using the global xscale.
 * @param yscale - the y-axis scale to use when generating the line
 * @param fld    - the field in the "data" attribute list to use
 * @returns a d3.line() generator
 */
function makeLineForYscaleField(yscale, fld) {
  return d3.line().x(function(d) { return xscale(d.timestamp); })
                  .y(function(d) { return yscale(d[fld]); });
}
function makeAreaForYscaleField(yscale, fld) {
  return d3.area().x(function(d) { return xscale(d.timestamp); })
                  .y1(function(d) { return yscale(d[fld]); })
                  .y0(yscale(0));
}

// generators for the paths (place data on a line)
var G_GENERATORS = {
    'consumption' : makeLineForYscaleField(yscale_energy, "ConskWhDelta").curve(d3.curveStep),
    'production'  : makeLineForYscaleField(yscale_energy, "ProdkWhDelta").curve(d3.curveStep),
    'net_prod'    : makeLineForYscaleField(yscale_energy, "NetProdkWhDelta").curve(d3.curveStep),
    'net_cons'    : makeLineForYscaleField(yscale_energy, "NetConskWhDelta").curve(d3.curveStep),
    'temps'       : makeLineForYscaleField(yscale_temps,  "Temp"),
    'cloud'       : makeAreaForYscaleField(yscale_cloud,  "skycover").curve(d3.curveStep),
    'dewpt'       : makeLineForYscaleField(yscale_temps,  "dewpt")
};


/*
// for cutting stuff  -- not sure why it doesn't work.
svgElt.append("svg:clipPath")
    .attr("id", "clip")
  .append("svg:rect")
    .attr("x", margin.left)
    .attr("y", 0)
    .attr("width", width - margin.left)
    .attr("height", height);
    */


// Add the x Axis
svgElt.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")");

// y axis
svgElt.append("g")
      .attr("class", "axis energy_axis");
svgElt.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "translate(-50 ,"+(height/2)+")rotate(-90)")  // centre below axis
      .text("energy (kwh)");

// the temperature y axis
svgElt.append("g")
    .attr("class", "axis temp_axis")
    .attr("transform", "translate(" + width + ",0)");
svgElt.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "translate("+(width + 35)+","+(height/4)+")rotate(-90)")
      .text("Temp/Dew pt °F");

// the cloud y axis
svgElt.append("g")
    .attr("class", "axis cloud_axis")
    .attr("transform", "translate(" + (width-50) + "," + (0) + ")");
svgElt.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "translate("+(width - 15)+","+(height/8)+")rotate(-90)")
      .text("Cloud Cover");

//svgElt.append("text")
//      .attr("text-anchor", "middle")
//      .attr("transform", "translate("+(width + 35)+","+(height/2)+")rotate(-90)")  // centre below axis
//      .text("Temp/Dew pt °F");

function draw() {
  
  // set up the axes
  svgElt.select("g.x.axis")      .call(xaxis);
  svgElt.select("g.energy_axis") .call(d3.axisLeft(yscale_energy));
  svgElt.select("g.temp_axis")   .call(d3.axisRight(yscale_temps));
  svgElt.select("g.cloud_axis")  .call(d3.axisRight(yscale_cloud));

  // process the data in the paths
  svgElt.select("path#cons_path")     .attr("d", G_GENERATORS.consumption);
  svgElt.select("path#prod_path")     .attr("d", G_GENERATORS.production);
  svgElt.select("path#net_prod_path") .attr("d", G_GENERATORS.net_prod);
  svgElt.select("path#net_cons_path") .attr("d", G_GENERATORS.net_cons);
  svgElt.select("path#temps_path")    .attr("d", G_GENERATORS.temps);
  svgElt.select("path#clouds_path")   .attr("d", G_GENERATORS.cloud);
  svgElt.select("path#dewpt_path")    .attr("d", G_GENERATORS.dewpt);
}

/**
 * Hack to copy first (empty) value to end so we can close a shape.
 * @param data - the array of data rows.
 * @param fields - array of field names to set to zero in the head/tail.
 * @returns nothing.
 */
function hackAddZeroesToEnds(data, fields) {
  var elt = JSON.parse(JSON.stringify(data[0])); // copy first element
  fields.forEach(function(d) { elt[d] = 0; });

  // start element
  elt.timestamp = d3TimeParser((new Date(new Date(data[0].Time).getTime() - 5000)).toLocaleString());
  data.unshift(elt);

  // end element
  elt = JSON.parse(JSON.stringify(elt)); //make another copy
  elt.timestamp = d3TimeParser((new Date(new Date(data[data.length-1].Time).getTime() + 5000)).toLocaleString());
  data.push(elt);
}


d3.csv("data/envoy.csv", {credentials: 'same-origin'},
  function(m) { /* Pre-process function for all data rows */
    m['timestamp'] = d3TimeParser(new Date(m.Time).toLocaleString());

    // Clean up spaces and stuff in csv, verify data is valid.
    for (let x of ['ConsWnow', 'ProdWnow', 'ConsWhToday', 'ProdWhToday', 'ConsWh7Day', 'ProdWh7Day']) {
      try {
        m[x] = +(m[x].trim());
        if (isNaN(m[x])) {  m[x] = 0; }
      } catch(e) {
        m[x] = 0;
      }
    }
    return m;
  }).then(function(data) { /* Post-process callback */
    //if (error) { throw error; }

    // Iterate through and calculate diffs.
    let lastWhP = 0;
    let lastWhC = 0;

    // For each entry, find the previous row and calculate difference.
    for (let i = 0; i < data.length; i++) {
      // When the ConsWhToday decreases, we've started over the running tally
      if (data[i].ConsWhToday < lastWhC) { lastWhP = lastWhC = 0; }

      // calculate delta in kWh
      data[i].ProdkWhDelta = (data[i].ProdWhToday - lastWhP) / 1000.0;
      data[i].ConskWhDelta = -(data[i].ConsWhToday - lastWhC) / 1000.0;

      // calculate net export/import energy
      let net = data[i].ProdkWhDelta + data[i].ConskWhDelta;
      data[i].NetProdkWhDelta = Math.max(0, net);
      data[i].NetConskWhDelta = Math.min(0, net);

      // store previous values for next delta
      lastWhP = data[i].ProdWhToday;
      lastWhC = data[i].ConsWhToday;
    }

    hackAddZeroesToEnds(data, ["ProdkWhDelta", "ConskWhDelta", "ProdWhToday", "ConsWhToday"]);

    // Scale the range to show the data nicely
    xscale.domain(d3.extent(data, function(d) { return d.timestamp; }));
    //yscale_energy.domain([d3.max(data, function(d) { return d.ProdkWhDelta; })*1.5, 
    //                      d3.min(data, function(d) { return d.ConskWhDelta; })]);
    yscale_energy.domain([5, -2.5]);

    // set the axes
    svgElt.select("path#cons_path").data([data]);
    svgElt.select("path#prod_path").data([data]);
    svgElt.select("path#net_prod_path").data([data]);
    svgElt.select("path#net_cons_path").data([data]);

    // plot it!
    draw();   
  });

d3.csv("data/temps.csv", {credentials: 'same-origin'},
  function(m) {
    m['timestamp'] = d3.utcParse("%Y%m%d%H%M")(m.Date.trim() + m.Time.trim());

    // convert temps from °C to °F
    try {
      m['Temp'] = +(m['Temp'].trim());
      if (isNaN(m['Temp'])) {  m['Temp'] = 0; }
      //console.log(m.Temp);
      m.Temp = CtoF(m.Temp);

    } catch(e) {
      m['Temp'] = 0;
    }

    try {
      m['dewpt'] = +(m['dewpt'].trim());
      if (isNaN(m['dewpt'])) {  m['dewpt'] = 0; }
    } catch(e) {
      m['dewpt'] = 0;
    }

    // clean skycover numbers
    try {
      m['skycover'] = +(m['skycover'].trim());
      if (isNaN(m['skycover'])) {  m['skycover'] = 0; }
    } catch(e) {
      m['skycover'] = 0;
    }

    return m;
  }).then(function(data) {
    //if (error) { throw error; }

    // clean out crappy dates
    data = data.filter(function(d) {
       return d.Temp != 999.9
           && d.Temp != CtoF(999.9);
    });

    // Scale the range of the data
    //xscale.domain(d3.extent(data, function(d) { return d.timestamp; }));
    //yscale_energy.domain([0, d3.max(data, function(d) { return d.ds_rate; })]);
    //yscale_temps.domain([d3.max(data, function(d) { return d.Temp; }), 0]);
    yscale_temps.domain([d3.max(data, function(d) { return d.Temp; }), -20]);
    yscale_cloud.domain(d3.extent(data, function(d) { return d.skycover; }));
    //yscale_cloud.domain([1, 0]);

    svgElt.select("path#temps_path").data([data]);
    svgElt.select("path#clouds_path").data([data]);
    svgElt.select("path#dewpt_path").data([data]);

    // plot it!
    draw();   
  });


function zoom() {
  var oldxscale = xscale;
  var newxscale = d3.event.transform.rescaleX(xscale);

  // scale the axis
  svgElt.select("g.x.axis").call(xaxis.scale(newxscale));

  // transform all of the paths
  G_PATHS.forEach(function(p) {
      svgElt.select("path#" + p)
            .attr("transform", "translate(" + d3.event.transform.x + ", 0) scale(" + d3.event.transform.k + ", 1) ");
      });
}


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

function DateRange(ts, offset, hours) {
  let de = new Date(ts);
  de.setDate(ts.getDate() + offset);
  let dt = new Date(de);
  dt.setHours(de.getHours() - hours);
  return [ dt, de ];
}

var nrg = {
  raw_weather: [], /* This is where ALL the temp data will go. */
  weather: [], /* This is where pruned temp data will go. */
  energy: [], /* This is where pruned nrg will go. */
  raw_energy: [], /* This is where ALL the nrg will go. */

  /* This defines the window of data (distance from most recent and num hours). */
  pageOffset: 0,
  pageHours: 72,
  pageRange: null,

  pageAdvance: function(numDays) {
    //console.log("Advancing: " + numDays);
    nrg.pageOffset += numDays;

    // clamp to 0
    if (nrg.pageOffset > 0) { nrg.pageOffset = 0; }

    // recalculate the page and data, then redraw.
    nrg.recalcPageRange();
    nrg.pruneWeatherData();
    nrg.pruneEnergyData();
    draw(xscale);
  },

  recalcPageRange() {
    let dat = nrg.raw_energy ? nrg.raw_energy : nrg.raw_weather;
    let lastdate = dat[dat.length - 1].timestamp;
    nrg.pageRange = DateRange(lastdate, nrg.pageOffset, nrg.pageHours);
    xscale.domain(nrg.pageRange);
  },

  pruneWeatherData: function() {
    if (nrg.pageRange == null) { nrg.recalcPageRange(); }
    nrg.weather = nrg.raw_weather.filter(
        function(d) {
          return nrg.pageRange[0] <= d.timestamp
              && nrg.pageRange[1] >= d.timestamp;
        });
    //hackAddZeroesToEnds(nrg.weather, ["Temp", "ConskWhDelta", "ProdWhToday", "ConsWhToday"]);
  },

  pruneEnergyData: function() {
    if (nrg.pageRange == null) { nrg.recalcPageRange(); }
    nrg.energy = nrg.raw_energy.filter(
        function(d) {
          return nrg.pageRange[0] <= d.timestamp
              && nrg.pageRange[1] >= d.timestamp;
        });
    hackAddZeroesToEnds( nrg.energy,
                         ["ProdkWhDelta", "ConskWhDelta",
                          "NetProdkWhDelta", "NetConskWhDelta",
                          "ProdWhToday", "ConsWhToday"]);
    xscale.domain(nrg.pageRange);
  },
};

function findNearestPointOnPathX(path, x) {
  if (!path) { return {'x':0, 'y':0}; }
  let pathLength = path.getTotalLength();
  let beginning = x, end = pathLength, target;
  var pos;
  while (true) {
    // start in middle and do binary search
    target = Math.floor((beginning + end) / 2);
    pos = path.getPointAtLength(target);

    // stop if we get to an end or invalid pos
    if ((target === end || target === beginning) && pos.x !== x) { break; }

    // divide the range in half until pos.x == x
    if      (pos.x > x) end = target;
    else if (pos.x < x) beginning = target;
    else                break; //position found
  }
  return pos;
}


/**
 * This is the event handling rect.
 */
svgElt.append("svg:rect")
      .attr("class", "pane")
      .attr("id", "event_rect")
      .attr("width", width)
      .attr("height", height)
      .attr('pointer-events', 'all')
//      .call(d3.zoom().on("zoom", function(){
//        let oldxscale = xscale;
//        let newxscale = d3.event.transform.rescaleX(xscale);
//        draw(newxscale);
//      }))
      .on('mouseout', function() { // on mouse out hide line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "0");
      })
      .on('mouseover', function() { // on mouse in show line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "1");
      })
      .on('mousemove', function() { // mouse moving over canvas
        var mouse = d3.mouse(this);
        d3.select(".mouse-line")
          .attr("d", function() {
            var d = "M" + mouse[0] + "," + height;
            d += " " + mouse[0] + "," + 0;
            return d;
          });

        // also display some data
        let x = d3.event.pageX - margin.left;
        var pos_p = findNearestPointOnPathX(d3.select("path#prod_path").node(), x);
        var pos_c = findNearestPointOnPathX(d3.select("path#cons_path").node(), x);

        d3.select("span#consspan")
          .text(yscale_energy.invert(pos_c.y).toFixed(2));

        d3.select("span#prodspan")
          .text(yscale_energy.invert(pos_p.y).toFixed(2));

      });


// for mouseover
var mouseG = svgElt.append("g")
                   .attr("class", "mouse-over-effects");
mouseG.append("path") // for mouseover vertical line
      .attr("class", "mouse-line")
      .attr("opacity", "0");

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
    'cons_path'     : makeLineForYscaleField(yscale_energy, "ConskWhDelta").curve(d3.curveStep),
    'prod_path'     : makeLineForYscaleField(yscale_energy, "ProdkWhDelta").curve(d3.curveStep),
    'net_prod_path' : makeLineForYscaleField(yscale_energy, "NetProdkWhDelta").curve(d3.curveStep),
    'net_cons_path' : makeLineForYscaleField(yscale_energy, "NetConskWhDelta").curve(d3.curveStep),
    'temps_path'    : makeLineForYscaleField(yscale_temps,  "Temp"),
    'clouds_path'   : makeAreaForYscaleField(yscale_cloud,  "skycover").curve(d3.curveStep),
    'dewpt_path'    : makeLineForYscaleField(yscale_temps,  "dewpt")
};



// for cutting stuff  -- not sure why it doesn't work.
svgElt.append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);


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

function draw(xscale) {
  // set up the axes
  svgElt.select("g.x.axis")      .call(xaxis.scale(xscale));
  svgElt.select("g.energy_axis") .call(d3.axisLeft(yscale_energy));
  svgElt.select("g.temp_axis")   .call(d3.axisRight(yscale_temps));
  svgElt.select("g.cloud_axis")  .call(d3.axisRight(yscale_cloud));

  // apply data sets
  svgElt.select("path#cons_path").data([nrg.energy]);
  svgElt.select("path#prod_path").data([nrg.energy]);
  svgElt.select("path#net_prod_path").data([nrg.energy]);
  svgElt.select("path#net_cons_path").data([nrg.energy]);

  svgElt.select("path#temps_path").data([nrg.weather]);
  svgElt.select("path#clouds_path").data([nrg.weather]);
  svgElt.select("path#dewpt_path").data([nrg.weather]);

  yscale_temps.domain([d3.max(nrg.weather, function(d) { return d.Temp; }), -20]);
  yscale_cloud.domain(d3.extent(nrg.weather, function(d) { return d.skycover; }));
  yscale_energy.domain([5, -2.5]);

  // transform all of the paths
  G_PATHS.forEach(function(p) {
    svgElt.select("path#" + p)
      .attr("d", G_GENERATORS[p].x(function(d) {return xscale(d.timestamp);}));
    });

  // process the data in the paths
  G_PATHS.forEach(function(p) {
    // insert data
    svgElt.select("path#" + p).attr("d", G_GENERATORS[p]);
    // apply clipping
    svgElt.select("path#" + p).attr("clip-path", "url(#clip)");
  });
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
  elt.timestamp = (new Date(new Date(data[0].timestamp).getTime() - 5000));
  data.unshift(elt);

  // end element
  elt = JSON.parse(JSON.stringify(elt)); //make another copy
  elt.timestamp = d3TimeParser((new Date(new Date(data[data.length-1].Time).getTime() + 5000)).toLocaleString());
  data.push(elt);
  return data;
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

    // store for future use
    nrg.raw_energy = data;
    nrg.pruneEnergyData();

    // Scale the range to show the data nicely
    //xscale.domain(d3.extent(data, function(d) { return d.timestamp; }));
    //let maxtime =  d3.max(nrg.energy, function(d) { return d.timestamp; });
    //let mintime = new Date(new Date().setDate(maxtime.getDate()-2));
    //xscale.domain([mintime, maxtime]);

    // plot it!
    draw(xscale);
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

    // clean out crappy dates
    data = data.filter(function(d) {
       return d.Temp != 999.9
           && d.Temp != CtoF(999.9);
    });

    nrg.raw_weather = data;
    nrg.pruneWeatherData();

    // Scale the range of the data
    //xscale.domain(d3.extent(data, function(d) { return d.timestamp; }));
    //yscale_energy.domain([0, d3.max(data, function(d) { return d.ds_rate; })]);
    //yscale_temps.domain([d3.max(data, function(d) { return d.Temp; }), 0]);
    // plot it!
    draw(xscale);
  });


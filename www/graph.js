/**
 * Used to draw a graph on the page.
 * March 2018
 * Sid Stamm <sidstamm@gmail.com>
 */

var d3TimeParser = d3.timeParse("%m/%d/%Y, %I:%M:%S %p");

var CtoF = function(c) { return +((c * 9.0 / 5.0) + 32); }


// global paths
const G_PATHS = ["temps_path", /*"dewpt_path",*/ "clouds_path",
               "cons_path", "prod_path", "net_prod_path", "net_cons_path"];

// model for the mouseover circles (charms)
const G_MOUSECHARMS = [
 {'dset': "energy", 'field': "ProdkWhDelta",    'units': "kWh", 'yscale': 'energy'},
 {'dset': "energy", 'field': "ConskWhDelta",    'units': "kWh", 'yscale': 'energy'},
 {'dset': "temps",  'field': "Temp",            'units': "°F",  'yscale': 'temps'},
 //{'dset': "energy", 'field': "NetProdkWhDelta", 'units': "kWh"},
 //{'dset': "energy", 'field': "NetConskWhDelta", 'units': "kWh"}
];


var nrg = {
  raw_weather: [], /* This is where ALL the temp data will go. */
  weather: [], /* This is where pruned temp data will go. */
  energy: [], /* This is where pruned will go. */

  /* This defines the window of data (distance from most recent and num hours). */
  pageOffset: 0,
  pageHours: 48,
  pageRange: null,

  //scales
  xscale        : d3.scaleTime(),
  yscale_energy : d3.scaleLinear(),
  yscale_temps  : d3.scaleLinear(),
  yscale_cloud  : d3.scaleLinear(),

  // global x-axis used for everything (time)
  xaxis: d3.axisBottom(this.xscale),

  // graph sizes (these are set up on document load.
  graph_margin: {top: 30, right: 50, bottom: 30, left: 40},
  graph_width:  0,
  graph_height: 0,
  svg_bb: null,

  computeSvgSize: function() {
    //nrg.svg_bb = d3.select("svg#graph").node().getBBox();
    nrg.svg_bb = d3.select("svg#graph").node().viewBox.baseVal;
    nrg.graph_width  = nrg.svg_bb.width
                      - nrg.graph_margin.left
                      - nrg.graph_margin.right;
    nrg.graph_height = nrg.svg_bb.height
                      - nrg.graph_margin.top
                      - nrg.graph_margin.bottom;
  },

  pageZoom: function(factor) {
    nrg.pageHours /= factor;
    nrg.updatePage();
  },

  pageAdvance: function(numDays) {
    //console.log("Advancing: " + numDays);
    nrg.pageOffset += numDays;

    // clamp to 0
    if (nrg.pageOffset > 0) { nrg.pageOffset = 0; }
    nrg.updatePage();
  },

  updatePage: function() {
    // recalculate the page and data, then redraw.
    nrg.recalcPageRange();
    nrg.pruneEnergyData();
    nrg.pruneWeatherData();
    nrg.drawGraph();
  },

  /**
   * Recalculates the pageRange (for paging).
   * ALWAYS MUST set the pageRange to a valid range.
   * If for some reason the data isn't loaded yet, it will default to a range ending in now.
   */
  recalcPageRange() {
    let lastdate = new Date();
    if (nrg.energy.length > 0) {
      lastdate = nrg.energy[nrg.energy.length - 1].timestamp;
    } else if (nrg.raw_weather.length > 0) {
      lastdate = nrg.raw_weather[nrg.raw_weather.length - 1].timestamp;
    }
    nrg.pageRange = DateRange(lastdate, nrg.pageOffset, nrg.pageHours);
    nrg.xscale.domain(nrg.pageRange);
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
    let URL = "db/getjson.py?data=envoy&start=" + nrg.pageRange[0].getTime()/1000
		                      + "&end=" + nrg.pageRange[1].getTime()/1000;
    d3.json(URL, {credentials: 'same-origin'}).then(
      function(data) { /* Post-process callback */
        // Iterate through and calculate diffs.
        let lastWhP = 0;
        let lastWhC = 0;
  
        // For each entry, find the previous row and calculate difference.
        for (let i = 0; i < data.length; i++) {
          data[i].timestamp = new Date(data[i].timestamp * 1000)
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
        nrg.energy = data;
        hackAddZeroesToEnds( nrg.energy,
                             ["ProdkWhDelta", "ConskWhDelta",
                              "NetProdkWhDelta", "NetConskWhDelta",
                              "ProdWhToday", "ConsWhToday"]);
        nrg.xscale.domain(nrg.pageRange);
    });
  },

  /**
   * Sets up the path data and lays out the svg structure.
   */
  drawGraph: function() {
    //nrg.computeSvgSize();

    // apply data sets
    let svgElt = d3.select("svg#graph")
    svgElt.select("path#cons_path").data([nrg.energy]);
    svgElt.select("path#prod_path").data([nrg.energy]);
    svgElt.select("path#net_prod_path").data([nrg.energy]);
    svgElt.select("path#net_cons_path").data([nrg.energy]);

    svgElt.select("path#temps_path").data([nrg.weather]);
    svgElt.select("path#clouds_path").data([nrg.weather]);
    //svgElt.select("path#dewpt_path").data([nrg.weather]);

    nrg.yscale_temps.domain(d3.extent(nrg.weather, function(d) { return d.Temp; }).reverse());
    //yscale_cloud.domain(d3.extent(nrg.raw_weather, function(d) { return d.skycover; }));
    nrg.yscale_cloud.domain([0, 1]);
    nrg.yscale_energy.domain([5, -2.5]);

    // generators for the paths (place data on a line)
    var G_GENERATORS = {
        'cons_path'     : makeLineForYscaleField(nrg.yscale_energy, "ConskWhDelta").curve(d3.curveStep),
        'prod_path'     : makeLineForYscaleField(nrg.yscale_energy, "ProdkWhDelta").curve(d3.curveStep),
        'net_prod_path' : makeLineForYscaleField(nrg.yscale_energy, "NetProdkWhDelta").curve(d3.curveStep),
        'net_cons_path' : makeLineForYscaleField(nrg.yscale_energy, "NetConskWhDelta").curve(d3.curveStep),
        'temps_path'    : makeLineForYscaleField(nrg.yscale_temps,  "Temp"),
        'clouds_path'   : makeAreaForYscaleField(nrg.yscale_cloud,  "skycover").curve(d3.curveStep),
        //'dewpt_path'    : makeLineForYscaleField(nrg.yscale_temps,  "dewpt")
    };


    // transform all of the paths
    G_PATHS.forEach(function(p) {
      svgElt.select("path#" + p)
        .attr("d", G_GENERATORS[p].x(function(d) {return nrg.xscale(d.timestamp);}));
      });

    // process the data in the paths
    G_PATHS.forEach(function(p) {
      // insert data
      svgElt.select("path#" + p).attr("d", G_GENERATORS[p]);
    });

    // set up the axes
    svgElt.select("g.x.axis")      .call(nrg.xaxis.scale(nrg.xscale));
    svgElt.select("g.energy_axis") .call(d3.axisLeft(nrg.yscale_energy).tickSize(-nrg.graph_width));
    svgElt.select("g.temp_axis")   .call(d3.axisRight(nrg.yscale_temps));
    svgElt.select("g.cloud_axis")  .call(d3.axisRight(nrg.yscale_cloud));
  },

  /**
   * Set up the SVG DOM.  This runs after document load
   * when we know things about how big to make the graph.
   */
  setupGraph: function() {
    nrg.computeSvgSize();
    var svgElt = d3.select("#graph")
                   .append("g")
                   .attr("transform", "translate(" + nrg.graph_margin.left + "," + nrg.graph_margin.top + ")");

    // for mouseover effects
    var mouseG = svgElt.append("g")
                       .attr("class", "mouse-over-effects");
    mouseG.append("path") // for mouseover vertical line
          .attr("class", "mouse-line")
          .attr("opacity", "0");

    // set up charm data
    var charms = mouseG.selectAll(".mouse-charm")
                       .data(G_MOUSECHARMS)
                       .enter()
                       .append("g")
                       .attr("class", "mouse-charm");

    charms.append("circle").attr("r", 5);
    charms.append("text").attr("transform", "translate(7,3)");

    // This is the event handling rect.
    svgElt.append("svg:rect")
          .attr("class", "pane")
          .attr("id", "event_rect")
          .attr("width", nrg.graph_width)
          .attr("height", nrg.graph_height)
          .attr('pointer-events', 'all')
    //      .call(d3.zoom().on("zoom", function(){
    //        let oldxscale = xscale;
    //        let newxscale = d3.event.transform.rescaleX(xscale);
    //        drawGraph(); //<- used to pass in new scale
    //      }))
          .on('mouseout', function() { // on mouse out hide line, circles and text
            d3.select(".mouse-line")
              .style("opacity", "0");
            d3.selectAll(".mouse-charm circle")
              .style("opacity", "0");
            d3.selectAll(".mouse-charm text")
              .style("opacity", "0");
          })
          .on('mouseover', function() { // on mouse in show line, circles and text
            d3.select(".mouse-line")
              .style("opacity", "1");
            d3.selectAll(".mouse-charm circle")
              .style("opacity", "1");
            d3.selectAll(".mouse-charm text")
              .style("opacity", "1");
          })
          .on('mousemove', nrg.doMouseMove);
      // Add the x Axis
      svgElt.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + nrg.graph_height + ")");

      // y axis
      svgElt.append("g")
            .attr("class", "axis energy_axis");
      svgElt.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(-20 ,"+(nrg.graph_height/2)+")rotate(-90)")  // centre below axis
            .text("energy (kwh)");

      // the temperature y axis
      svgElt.append("g")
          .attr("class", "axis temp_axis")
          .attr("transform", "translate(" + nrg.graph_width + ",0)");
      svgElt.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+(nrg.graph_width + 35)+","+(nrg.graph_height/4)+")rotate(-90)")
            .text("Temp/Dew pt °F");

      // the cloud y axis
      svgElt.append("g")
          .attr("class", "axis cloud_axis")
          .attr("transform", "translate(" + (nrg.graph_width-50) + "," + (0) + ")");
      svgElt.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+(nrg.graph_width - 15)+","+(nrg.graph_height/8)+")rotate(-90)")
            .text("Cloud Cover");

    // Append all the paths to the main SVG element.
    G_PATHS.forEach(function(p) { svgElt.append("path").attr("id", p); });

    //scales
    nrg.xscale        = d3.scaleTime()  .range([0, nrg.graph_width   ]);
    nrg.yscale_energy = d3.scaleLinear().range([0, nrg.graph_height  ]); // energy
    nrg.yscale_temps  = d3.scaleLinear().range([0, nrg.graph_height/2]); // temps
    nrg.yscale_cloud  = d3.scalePow().exponent(0.7).range([0, nrg.graph_height/4]); // clouds

    // global x-axis used for everything (time)
    nrg.xaxis = d3.axisBottom(nrg.xscale);

    nrg.updatePage();
  },

  /**
   * Handles mouse moving over svg (draws charms and stuff).
   */ 
  doMouseMove: function() {
    // NOTE: can get event info from d3.event
    if (!nrg.energy.length ) { return; }

    let theX = nrg.xscale.invert(d3.mouse(this)[0]),
        bisectDate = d3.bisector(function(d) { return d.timestamp; }).left;
    let i, d0, d1, de, dw;

    try {
      // identify closest point in energy dataset
      i  = bisectDate(nrg.energy, theX, 1); // searches based on date
      d0 = nrg.energy[i - 1];
      d1 = nrg.energy[i];
      de  = (theX - d0.timestamp > d1.timestamp - theX) ? d1 : d0;
    } catch(e) {
      de = nrg.energy[nrg.energy.length-1];
    }

    try {
      // identify closest point in weather dataset
      i = bisectDate(nrg.weather, theX, 1);
      d0 = nrg.weather[i-1];
      d1 = nrg.weather[i];
      dw = (theX - d0.timestamp > d1.timestamp - theX) ? d1 : d0;
    } catch(e) {
      // default to last entry (it's usually behind energy production data)
      dw = nrg.weather[nrg.weather.length-1];
    }

    d3.select(".mouse-line")
      .attr("d", function() {
        // could use pos_c for mouse-following instead of snapping.
        return "M" + nrg.xscale(de.timestamp) + "," + nrg.graph_height
             + " " + nrg.xscale(de.timestamp) + "," + 0;
      });

    d3.selectAll(".mouse-charm")
      .attr("transform", function(dx, i) {
            let dmap = {"energy": de, "temps": dw};
            let dscale = {"energy": nrg.yscale_energy, "temps": nrg.yscale_temps};
            let d = dmap[dx.dset];
            if (!d) { return; }
            let yscale = dscale[dx.yscale];
            d3.select(this).select("text")
              .text(d[dx.field].toFixed(2) + dx.units);
            return "translate("
              + nrg.xscale(d.timestamp) + ","
              + yscale(d[dx.field]) +")";
      });

    // update displayed data
    d3.select("span#datespan").text(de.timestamp);
    d3.select("span#consspan").text(de.ConskWhDelta.toFixed(2));
    d3.select("span#prodspan").text(de.ProdkWhDelta.toFixed(2));
    d3.select("span#netenergyspan")
      .text(de.ProdkWhDelta == 0
            ? de.ConskWhDelta.toFixed(2)
            : de.ProdkWhDelta.toFixed(2));
  },

};

/*
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
*/


function DateRange(ts, offset, hours) {
  let de = new Date(ts);
  de.setDate(ts.getDate() + offset);
  let dt = new Date(de);
  dt.setHours(de.getHours() - hours);
  return [ dt, de ];
}



/**
 * Creates a line generator using the global xscale.
 * @param yscale - the y-axis scale to use when generating the line
 * @param fld    - the field in the "data" attribute list to use
 * @returns a d3.line() generator
 */
function makeLineForYscaleField(yscale, fld) {
  return d3.line().x(function(d) { return nrg.xscale(d.timestamp); })
                  .y(function(d) { return yscale(d[fld]); });
}
function makeAreaForYscaleField(yscale, fld) {
  return d3.area().x(function(d) { return nrg.xscale(d.timestamp); })
                  .y1(function(d) { return yscale(d[fld]); })
                  .y0(yscale(0));
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
  elt.timestamp = (new Date(new Date(data[data.length-1].timestamp).getTime() + 5000));
  data.push(elt);
  return data;
}


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

    /*
    try {
      m['dewpt'] = +(m['dewpt'].trim());
      if (isNaN(m['dewpt'])) {  m['dewpt'] = 0; }
    } catch(e) {
      m['dewpt'] = 0;
    }
    */

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
    //nrg.drawGraph();
  });


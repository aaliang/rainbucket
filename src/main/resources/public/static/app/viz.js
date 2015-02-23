/**
 * d3 visualization for a chart + integral line when you absolutely need:
 * - linear scales on the x/y axis
 * - dynamically sized svg (with limits!)
 * - true integers on the x attr, that aren't rounded incorrectly because of uninterpolate,
 *   when quantitivescae.rangeRounding kicks your ass with anti-aliasing
 *   and you're about to ragequit
 */

var vizlib = new (function () {

  var VizLibrary = function () {
    var self = this;

    var TARGET_WIDTH = 1220;
        MIN_BAND_WIDTH = 2; //px
        MIN_PADDING_WIDTH = 1,
        OUTER_BAND_PADDING = 0;


    self.calcLen = function (data_length, band_width, margin) {
      return (MIN_PADDING_WIDTH+band_width) * data_length
        + OUTER_BAND_PADDING*2
        + (margin.left + margin.right);
    };


    self.getWidthAndPaddingRatio = function (target_width, margin, d_len) {
      var spaceLeft = target_width
        - OUTER_BAND_PADDING*2;
        - (margin.left + margin.right);

      var stepSize = (spaceLeft + MIN_PADDING_WIDTH) / d_len;

      var vlen;

      if (stepSize >= MIN_BAND_WIDTH+MIN_PADDING_WIDTH) {
        stepSize = Math.floor(stepSize);
        vlen = self.calcLen(d_len, stepSize - MIN_PADDING_WIDTH, margin);
      } else {
        stepSize = MIN_BAND_WIDTH + MIN_PADDING_WIDTH;
        vlen = self.calcLen(d_len, MIN_BAND_WIDTH, margin);
      }

      return {
        len: vlen,
        rangePaddingRatio: MIN_PADDING_WIDTH/stepSize,
        bandSize: stepSize - 1
      };

    };

    /**
     * Unsparsifies an array. Array is assumed to be numerically sorted ascendingly
     */
    self.unsparsify = function (data) {
      if (data.length > 0) {

        var _data = [data[0]],
            t_trans = data[0].upper_bound;

        //js doesn't have an elegant array comprehension. have to do it this way...
        for (var i = data[0].upper_bound+1,
                 last = data[data.length-1].upper_bound,
                 index = 1; i < last; i++) {

          if (data[index].upper_bound == i) {
            _data.push(data[index]);
            index++;
          } else {
            _data.push({upper_bound: i, freq: 0});
          }

        }
      }

      data.length = 0;
      Array.prototype.push.apply(data, _data);
      return data;

    };


    self.makeBarChartFromData = function (data, margin, target_width, tooltipActivate, tooltipClose) {

      var _stuff = self.getWidthAndPaddingRatio(target_width, margin, data.length),
          width = _stuff.len + 2,
          rangePaddingRatio = _stuff.rangePaddingRatio,
          bandSize = _stuff.bandSize;

      var height = 760 - margin.top - margin.bottom;

      var x = d3.scale.linear().range([0, width]).nice(10);

      var y = d3.scale.linear()
          .range([height, 0]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(20);

      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left");

      x.domain([d3.min(data, function(d) { return d.upper_bound; }), d3.max(data, function(d) { return d.upper_bound; })]);
      y.domain([0, d3.max(data, function(d) { return d.freq; })]);

      x.interpolate(function (a, b) {

        var vstatus = (bandSize+1)/b,
            epsil = 1/(x.domain()[1] - x.domain()[0]);

        return function (t) {
          var t0 = (t/epsil) * vstatus;
          return a * (1 - t0) + b * t0;
        }
      });


      var chart = d3.select(".chart")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
          .style("pointer-events", "all");

      chart.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      chart.append("g")
          .attr("class", "y axis")
          .call(yAxis);

      chart.selectAll(".bar")
          .data(data)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) {
            return x(d.upper_bound);
            })
          .attr("y", function(d) {
            return y(d.freq);
            })
          .attr("height", function(d) { return height - y(d.freq); })
          .attr("width", bandSize)
          .on("mouseover", tooltipActivate)
          .on("mouseout", tooltipClose);

      var integralData = data.map(function (e) {
        var suh_weet = this.accu + e.freq;
        this.accu = suh_weet;
        return {
          freq: suh_weet,
          upper_bound: e.upper_bound
        };
      }, {accu: 0});

      var y_max = y.domain()[1],
          norm_factor = y_max/integralData[integralData.length-1].freq;

      var valueline = d3.svg.line()
          .x(function(d) {
            return x(d.upper_bound);
            })
          .y(function(d) {
            return y(d.freq * norm_factor);
            });

      var focus = chart.append("g")
          .style("display", "none");

        // append the circle at the intersection
      focus.append("circle")
          .attr("class", "y")
          .style("fill", "none")
          .style("stroke", "blue")
          .attr("r", 4);

      chart.append("path")
        .attr("class", "line")
        .attr("d", valueline(integralData))

    };

    self.makeBarChart = function (data_uri, settings) {
      var margin = settings.margin,
          target_width = settings.suggestedWidth || TARGET_WIDTH;

      //dis is passed in i guess
      var tooltip = d3.select("body").append("div")
                  .attr("class", "tooltip")
                  .style("opacity", 0);

      var tooltipActivate = function (d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);

        tooltip.html("<br/>"  + 'freq={' + d.freq + '}<br/>len={' + d.upper_bound + '}')
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      };

      var tooltipClose = function (d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      };


      d3.csv(data_uri, type, function (err, data) {

        self.makeBarChartFromData (self.unsparsify(data), margin, target_width, tooltipActivate, tooltipClose);
      });

      function type(d) {
        d.freq = +d.freq; // coerce to number
        d.upper_bound = +d.upper_bound;
        return d;
      }

    }


    self.csvFetcher = function (uri, callback) {
      d3.csv(uri, function (err, data) {
        callback(err, data);
      });
    }

    self.makeLineChart = function(dataGetter, options, interval, categories, start, end, cached, callback) {

      var margin = options.margin,
        width = options.suggestedWidth - margin.left - margin.right,
        height = 720 - margin.top - margin.bottom;

      var parseDate = d3.time.format("%d-%b-%y").parse;

      var x = d3.time.scale()
          .range([0, width]);

      var y = d3.scale.linear()
          .range([height, 0]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom");

      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left");

      var line = d3.svg.line()
          .x(function(d) { return x(d.date); })
          .y(function(d) { return y(d.close); });


      var dataWorker = function(error, _data) {
        var data = _data.map(function(d) {
          var ret = {
            date: new Date(+d.timestamp),
            _max: 0
          };



          categories.forEach(function (e) {
            var val = +d[e];
            ret[e] = val;

            if (val > ret._max) {
              ret._max = val;
            }
          });

          return ret;

        });

        start = start || Number.NEGATIVE_INFINITY;
        end = end || Number.POSITIVE_INFINITY;

        data = data.filter(function (_d) {
          return (_d.date.getTime() >= start && _d.date.getTime() <= end)
        });

       Array.prototype.forEach.call(document.getElementsByClassName('chart'), function (e) {
         e.innerHTML = ""
       });


        var svg = d3.select(".chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var div = d3.select(".trending-tooltip").style("opacity", 0);

        var formatTime = d3.time.format("%b %e %I:%M:%S %p");

        x.domain(d3.extent(data, function(d) { return d.date; }));
        y.domain([0, d3.max(data, function(d) { return d._max})]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Hashtags per time slice (" + interval + " seconds)");


        categories.forEach(function (e, i) {

          var lineClass = 'viz-line-'+ ((i+1) % 9);

          svg.append("path")
            .datum(data)
            .attr("class", "line " + lineClass)
            .attr("d", d3.svg.line()
                          .x(function(d) { return x(d.date); })
                          .y(function(d) { return y(d[e] || 0); }));

          svg.append("text")
             .attr("x", "150")
             .attr("class", "line-name")
             .text(e);

          svg.selectAll("dot")
		        .data(data)
	            .enter().append("circle")
               .attr("class", "dp")
		           .attr("r", 10)
		            .attr("cx", function(d) { return x(d.date); })
		            .attr("cy", function(d) { return y(d[e] || 0); })
              .on("mouseover", function(d) {
                div.transition()
                    .duration(100)
                    .style("opacity", .9);

                var html = [
                  "<strong>",
                  e,
                  "</strong><br />",
                  formatTime(d.date),
                  "<br />"
                ].concat(
                  Object.keys(d).filter(function (e) {
                    return e[0] === "#"; //is a hashtag
                  }).map(function (_e) {

                    var res = _e + " : <strong>" + d[_e] + "</strong>    <i>" + (d[_e]/interval).toFixed(3) + " ht/s</i><br />";

                    if (_e === e) {
                      res = "<span class='highlighted'>" + res + "</span>"
                    }
                    return res;
                  })

                ).join("");

                div.html(html)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
              })
            .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        });



        callback(Object.keys(_data[0]).filter(function (e)  {return e !== 'timestamp'}), x.domain(), _data);

      }


      if (cached) {
        dataWorker(null, cached);
      } else {

        dataGetter(dataWorker)
//        self.csvFetcher(uri, dataWorker);
      }

    };







  }

  return VizLibrary;
} ()) ();

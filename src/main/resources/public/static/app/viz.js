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
      }
    };
  }

  return VizLibrary;
} ()) ();

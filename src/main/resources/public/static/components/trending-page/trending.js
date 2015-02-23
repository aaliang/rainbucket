define(["knockout", "hasher", "text!./trending.html"], function(ko, hasher, analyticsTemplate) {

  function setHashSilently (hash) {
    hasher.changed.active = false;
    hasher.setHash(hash);
    hasher.changed.active = true;
  }

  function TrendingViewModel(route) {
    tellerum.vm.trendingViewModel = this;

    var self = this;

    var defaultStartGetter = function () {
      return Date.now() - (1000*60*60*6); //6 hours ago
    }

    var timestampToHumanDate = function (ts) {
      return new Date(ts);
    }

    // here are some defaults.
    var initialArray = [],
        initialStart = defaultStartGetter(), //6 hours ago
        initialInterval = 120; //120 seconds

    // parse any query parameters
    if (route['?query']) {
      var q = route['?query'];

      if (q.hasOwnProperty('ids')) {
        initialArray = q.ids.split(',').filter(Boolean).map(function (e) { return '#' + e});
      }

      if (q.hasOwnProperty('start')) {
        initialStart = +q.start;
      }

      if (q.hasOwnProperty('interval')) {
        initialInterval = +q.interval;
      }
    }

    self.dataCache = null;

    self.timeStart = ko.observable(timestampToHumanDate(initialStart));

    self.timeEnd = ko.observable();

    self.interval = ko.observable(initialInterval);

    self.hashTags = ko.observableArray([]);

    self.checkedHashTags = ko.observableArray(initialArray);

    self.isLoading = ko.observable(true);

    self.suggestedWidth = document.getElementById("trending-div").offsetWidth - 40*2;

    self.uncheckall = function () {
      self.checkedHashTags([]);
      self.updateUrl();
    };

    self.checkall = function () {
      self.checkedHashTags(self.hashTags());
    }

    self.resetRange = function () {
      self.timeStart(timestampToHumanDate(defaultStartGetter()));
      self.timeEnd(null);
      refreshChart();
    };

    self.hardUpdate = function () {
      self.dataCache = null;
      refreshChart();
    }

    /**
     * reflects query options onto the url, so the back button works, copy and pasting, etc
     */
    self.updateUrl = function () {

      var ids = self.checkedHashTags().map(function (e) {
        return e.substring(1);
      }).join(',');

      var newHash = document.location.hash.split('?')[0] +
                        '?ids=' + ids +
                        '&interval=' + self.interval() +
                        '&start=' + Date.parse(self.timeStart());

      var end = self.timeEnd();

      if (end) {
        newHash += Date.parse(end);
      }

      setHashSilently(newHash);
    };

    var refreshChart = function () {
      self.updateUrl(); //triggers an update from the

      self.isLoading(true);

      var end = self.timeEnd();
      if (end) {
        end = Date.parse(end)
      }

      vizlib.makeLineChart(
       self.dataGetter,
       {margin: {top: 20, right: 30, bottom: 30, left: 40}, suggestedWidth: self.suggestedWidth},
       self.interval(),
       self.checkedHashTags(),
       +Date.parse(self.timeStart()),
       end,
       self.dataCache,
       function (keys, timerange, cache) {

         var startTimeActual = timerange[0].getTime(),
             endTimeActual = timerange[1].getTime();

         self.dataCache = cache;
         self.isLoading(false);

         //add the hashtags so we can reflect the checkboxes on the ui. yeah i should probably
         //change the response struct
         var cindex = cache.length,
             hts = {};
         while (cindex--) {
           if (cache[cindex].timestamp >= startTimeActual && cache[cindex].timestamp <= endTimeActual) {

             for (var key in cache[cindex]) {
               if (key !== 'timestamp') {
                 hts[key] = true;
               }
             }

           }
         }

         self.hashTags(Object.keys(hts).sort());


       });
    };

    var isCheckedUpdate = true;

    self.toggleCheckBoxUpdate = function (vm, e) {
      if (e.target.value === "true") {
        isCheckedUpdate = true;
      } else {
        isCheckedUpdate = false;
      }

      return true;
    };

    self.checkedHashTags.subscribe(function () {
      self.updateUrl();
      if (isCheckedUpdate) {
        refreshChart();
      }
    });


    //xhr wrapper to get the hashtag_counts based on any parameters that the user may have selected via the ui
    self.dataGetter = function (callback) {

      var args = {
        url: "/hashtag_counts",
        data: {
          interval: self.interval(),
          start: Date.parse(self.timeStart())
        },
        method: "GET"
      };

      var end = self.timeEnd();

      if (end) {
        args.data.end = Date.parse(end);
      }

      $.ajax(args).done(function (res) {
        callback(null, res)
      })
    }

    self.softUpdate = refreshChart

    self.hardUpdate();

  }

  return { viewModel: TrendingViewModel, template: analyticsTemplate };

});

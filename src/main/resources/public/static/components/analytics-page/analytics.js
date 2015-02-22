define(["knockout", "text!./analytics.html"], function(ko, analyticsTemplate) {

  function AnalyticsViewModel(route) {
    tellerum.vm.analyticsViewModel = this;

    var self = this;

    self.dataFiles = [
      'static/char_freq.csv',
      'static/word_freq.csv',

    ];

    self.selectedDataSet = ko.observable();

    self.suggestedWidth = document.getElementById("analytics-div").offsetWidth - 40*2;

    self.selectedDataSet.subscribe(function (data_uri) {

      Array.prototype.forEach.call(document.getElementsByClassName('chart'), function (e) {
        e.innerHTML = ""
      });

      vizlib.makeBarChart(data_uri, {margin: {top: 20, right: 30, bottom: 30, left: 40}, suggestedWidth: self.suggestedWidth});

    });

  }

  AnalyticsViewModel.prototype.doSomething = function() {
    this.message('You invoked doSomething() on the viewmodel.');
  };

  return { viewModel: AnalyticsViewModel, template: analyticsTemplate };

});

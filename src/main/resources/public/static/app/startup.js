define(['jquery', 'knockout', './router', './viz', 'bootstrap', 'knockout-projections', 'd3'], function($, ko, router) {
  window.tellerum = {vm: {}};

  // Components can be packaged as AMD modules, such as the following:

  ko.components.register('nav-bar', { require: 'static/components/nav-bar/nav-bar' });
  ko.components.register('home-page', { require: 'static/components/home-page/home' });

  // ... or for template-only components, you can just point to a .html file directly:
  ko.components.register('about-page', {
    template: { require: 'text!static/components/about-page/about.html' }
  });

  ko.components.register('analytics-page', { require: 'static/components/analytics-page/analytics'});


  ko.components.register('trending-page', { require: 'static/components/trending-page/trending'});

  // [Scaffolded component registrations will be inserted here. To retain this feature, don't remove this comment.]

  // Start the application
  ko.applyBindings({ route: router.currentRoute });
});

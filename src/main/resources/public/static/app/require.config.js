// require.js looks for the following global when initializing
var require = {
    baseUrl: ".",
    paths: {
        "bootstrap": "static/bower_modules/components-bootstrap/js/bootstrap.min",
        "crossroads": "static/bower_modules/crossroads/dist/crossroads.min",
        "hasher": "static/bower_modules/hasher/dist/js/hasher.min",
        "jquery": "static/bower_modules/jquery/dist/jquery",
        "knockout": "static/bower_modules/knockout/dist/knockout",
        "knockout-projections": "static/bower_modules/knockout-projections/dist/knockout-projections",
        "signals": "static/bower_modules/js-signals/dist/signals.min",
        "text": "static/bower_modules/requirejs-text/text",
        "d3": "static/bower_modules/d3/d3"
    },
    shim: {
        "bootstrap": { deps: ["jquery"] }
    }
};


window.Router = Backbone.Router.extend({

    routes: {
        "": "home",        
    },

    initialize: function () {    

    },

    home: function () {              
      var mapModel = new MapModel({url: "/projects_compare/countries_overlap"})
      mapModel.project1 = "xmldom"
      mapModel.project2 = "wcf.js"
      var mapView = new MapView({mapModel: mapModel})
      mapModel.fetch(function() {mapView.render()})
      $("#root").html(mapView.el);  
    }
    
});

function loadTemplates(views, callback) {

        var deferreds = [];

        $.each(views, function(index, view) {
            if (window[view]) {         
                var url = '/components/map/' + view + '.html'                                     
                
                deferreds.push($.get(url, function(data) {
                    window[view].prototype.template = _.template(data);
                }, 'html'));                
            } else {
                alert(view + " not found");
            }
        });

        $.when.apply(null, deferreds).done(callback);
}

loadTemplates(["MapView"],
    function () {
            app = new Router();            
            Backbone.history.start();                   
    });
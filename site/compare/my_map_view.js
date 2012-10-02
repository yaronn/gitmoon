

window.MyMapView = BaseView.extend({

    initialize: function (options) {
       BaseView.prototype.initialize.call(this, options)
       this.title="World Dominance"
       this.help = "This map shows which project has more users across the globe"       
       this.requiresSvg = true              
    },

    showData: function (data, cbx) {        
      var self = this      
      cbx()

      var mapModel = new MapModel({url: "/projects_compare/countries_overlap"})
      mapModel.project1 = this.project1
      mapModel.project2 = this.project2

      var mapView = new MapView({mapModel: mapModel})
      mapModel.fetch(function() {mapView.render()})



      $("#diagram", this.el).html("<div><div id='map'style='float: left'></div>" +
                                  "<div id='legend' style='float: right'></div></div>" +
                                  "<div style='clear: both'></div>");  
      $("#map", this.el).html(mapView.el)      


      var data = {project1: this.project1, project2: this.project2}
      $("#legend", this.el).html(window.templates.MapLegend(data))
      mapView.bind("mapbuttonclicked", function(area) {
        utils.trackEvent("h2h", "map click", area)
      })
    }

});
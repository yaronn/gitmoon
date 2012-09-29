

window.MyMapView = BaseView.extend({

    initialize: function (options) {
       this.title="MapView"       
       BaseView.prototype.initialize.call(this, options)
    },

    showData: function (data) {        
      var self = this      
      data.splice(0,0,["country", "value"])      

      data = google.visualization.arrayToDataTable(data)

      var mapModel = new MapModel({url: "/projects_compare/countries_overlap"})
      mapModel.project1 = this.project1
      mapModel.project2 = this.project2

      var mapView = new MapView({mapModel: mapModel})
      mapModel.fetch(function() {mapView.render()})
      $("#diagram", this.el).html(mapView.el);  

    }

});
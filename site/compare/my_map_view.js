

window.MyMapView = BaseView.extend({

    initialize: function (options) {
       this.title="World dominance"
       this.help = "This map shows which project has more users across the globe"       
       BaseView.prototype.initialize.call(this, options)
    },

    showData: function () {        
      var self = this      

      var mapModel = new MapModel({url: "/projects_compare/countries_overlap"})
      mapModel.project1 = this.project1
      mapModel.project2 = this.project2

      var mapView = new MapView({mapModel: mapModel})
      mapModel.fetch(function() {mapView.render()})
      $("#diagram", this.el).html(mapView.el);  

    }

});
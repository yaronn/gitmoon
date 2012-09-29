
window.MapView = Backbone.View.extend({

   initialize: function (options) {
       
       var self = this

       this.mapModel = options.mapModel

       $(this.el).html(this.template())       
       this.currentRegion = "world"

        $('#map-buttons', this.el).button()

        $('#map-buttons', this.el).find('button').bind('click',function(e) {
            $("#map", self.el).hide()
            $("#loading", self.el).show()

            self.currentRegion = e.currentTarget.id

            var old_is_us = self.mapModel.is_us
            self.mapModel.is_us = self.currentRegion=="US"            
            self.mapModel.fetch(function() {self.render()})
        })            

    },

    render: function () {                       
        var data = this.mapModel.getMapData()               
        $("#loading", this.el).hide()
        
        data = google.visualization.arrayToDataTable(data)

        var options = 
              { width: 556
              , height: 347         
              , colors: ["red", "blue"]
              , enableRegionInteractivity: false
              , legend: "none"}
        if ( this.currentRegion!="world") options.region = this.Regions[this.currentRegion]
        if ( this.currentRegion=="US") options.resolution = "provinces"

        var geochart = new google.visualization.GeoChart(
            $('#map', this.el)[0]);
              geochart.draw(data, 
              options);
        $("#map", this.el).show()

        return this;
    },   

    Regions: {
        "US": "US",
        "europe": "150",
        "americas": "019",
        "africa": "002",
        "asia": "142",
        "oceania": "009"
    }




});
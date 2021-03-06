
window.MapView = Backbone.View.extend({

   initialize: function (options) {
       
       var self = this

       this.mapModel = options.mapModel
       
       $(this.el).html(this.template())       
       this.currentRegion = "world"

        $('#map-buttons', this.el).button()

        $('#map-buttons', this.el).find('button').bind('click',function(e) {
            $("#map", self.el).hide()
            $("#map_loading", self.el).show()

            self.currentRegion = e.currentTarget.id

            var old_is_us = self.mapModel.is_us
            self.mapModel.is_us = self.currentRegion=="US"            
            self.mapModel.fetch(function() {self.render()})

            self.trigger("mapbuttonclicked", e.currentTarget.id)
        })            

    },

    render: function () {        
        var data = this.mapModel.getMapData()               
        $("#map_loading", this.el).hide()
        
        data = google.visualization.arrayToDataTable(data)

        var project1_wins = 1
        var project2_wins = 3

        var options = 
              { width: 475
              , height: 297
              , colors: ["red", "blue"]
              , enableRegionInteractivity: true
              , legend: "none"
              , colorAxis: {minValue: project1_wins, maxValue: project2_wins}}
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
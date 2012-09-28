

window.MapView = BaseView.extend({

    initialize: function (options) {
       this.title="MapView"

       BaseView.prototype.initialize.call(this, options)
    },

    showData: function (data) {         
      var self = this      
      data.splice(0,0,["country", "value"])      

      data = google.visualization.arrayToDataTable(data)

      var geochart = new google.visualization.GeoChart(
        $('#diagram')[0]);
      geochart.draw(data, {width: 556, height: 347, colors: ["red", "blue"]});

    }

});
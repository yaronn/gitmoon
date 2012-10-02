
window.TotalNetworkView = BaseView.extend({

   initialize: function (options) {
       BaseView.prototype.initialize.call(this, options)
       this.title="Total Network"
       this.help = "These bars show how many users each project has directly and indirectly (via the network of its dependant projects)"
       this.requiresSvg = true              
    },

   showData: function (data, cbx) {           
      var self = this

      var query = '?include_stat=true&include_users=false'
      var url1 = '/projects/' + this.project1 + query
      var url2 = '/projects/' + this.project2 + query

      $.get(url1, function(project1) {
        $.get(url2, function(project2) {

             var array =  
                [ ['project', 'direct users', 'network users']
                , [project1.name, project1.direct_watch, project1.total_watch-project1.direct_watch]
                , [project2.name, project2.direct_watch, project2.total_watch-project2.direct_watch]]
            
             var data = google.visualization.arrayToDataTable(array)

             var chart = new google.visualization.BarChart($("#diagram", self.el).get()[0]);
             google.visualization.events.addListener(chart, 'ready', function() {              
               cbx()
             });             
             chart.draw(data,
                   {isStacked: true,
                    width:500, height:200,
                    fontSize: "13",
                    bar: {groupWidth: 15},
                    backgroundColor: 'transparent',
                    chartArea:{left: 100, top:20,width:"40%",height:"50%"},
                    colors: ['darkgreen', 'lightgreen']
                   }
              )

            
        })        
      })
   }

});

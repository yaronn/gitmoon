
window.RandomUserView = BaseView.extend({

   initialize: function (options) {
       this.title="Random Users"
       this.help = "Check out some of the users of the two projects"
       BaseView.prototype.initialize.call(this, options)
    },

   showData: function (data, cbx) {           
      var self = this

      var query = '?limit=2'
      var url1 = '/projects/' + this.project1 + "/users/random" + query
      var url2 = '/projects/' + this.project2 + "/users/random" + query

      $.get(url1, function(users1) {
        $.get(url2, function(users2) {                          
             if (users1.length==0 && users2.length==0)
             {
               $("#diagram", self.el).html("Information on users is not available")
             }
             else {
                var html = self.template()             
                $("#diagram", self.el).html(html)
                self.fillUsers(users1, "#project1users", "red", self.project1)                
                self.fillUsers(users2, "#project2users", "blue", self.project2)                 
             }
             cbx()
        })        
      })
   },

   fillUsers: function(data, container, color, project_name) {
      var el = $(container, this.el)      
      for (i in data) {
        data[i].color = color
        data[i].project_name = project_name
        var html = window.templates.UserView(data[i])
        if (i==0) html = html + "<hr />"
        el.append("<div style='width: 80%; padding-left: 30px; '>" + html + "</div>")
      }      
   }

});

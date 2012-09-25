
window.HomeView = Backbone.View.extend({    

    initialize: function(options) {                 
        var self = this

        this.projects = new PagedList(null, {"model": Project, "url": "/projects"})
        this.projects.paginator_ui.perPage = 15
        this.projectListView = new ProjectListView({model: this.projects, mode: "center"})
        
        this.projectListView.bind("hasSearchResult", function() {               
            $("#featured-list", self.el).hide()            
        })
    },

    render:function () {            
        $(this.el).html(this.template());                                            
        $("#projects-list", this.el).html(this.projectListView.el)                
        return this;
    },

    close:function() {
          
    }

});

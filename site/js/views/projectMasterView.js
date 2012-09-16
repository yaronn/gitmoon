
window.ProjectMasterView = Backbone.View.extend({

    initialize: function(options) {                                   
        var self = this    
        $(this.el).html(this.template());                                            
        this.projects = new PagedList(null, {"model": Project, "url": "/projects"})
        this.projects.paginator_ui.perPage = 35
        this.projectListView = new ProjectListView({model: this.projects, mode: "side"})

        this.projectListView.bind("hasSearchResult", function() {               
            $("#featured-list", self.el).hide()            
        })
        
        //this.projects.fetch()        
        this.show(options)
    },

    show: function(options) {        
        var self = this
        this.project = new Project({name: options.name});        
        this.project.fetch({success: function(data) {    
            self.projectView = new ProjectView({model: data})  
            self.projectView.render()  
            $('#project-view').html(self.projectView.el);
        }});
    },

    render:function () {
        $("#projects-list", this.el).html(this.projectListView.el)                
        return this;
    },

    close: function() {
        if (this.projectView) this.projectView.close()
        this.projectListView.close()
    }

});

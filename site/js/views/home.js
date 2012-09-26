
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

        var supportsSvg = supportsSVG()

        if (!supportsSvg) {
            $("#feature1", this.el).hide()
            $("#feature4", this.el).hide()
        }

        return this;
    },

    close:function() {
          
    }

});


function supportsSVG() {
    return !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect;
}
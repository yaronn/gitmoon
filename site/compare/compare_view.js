
window.CompareView = Backbone.View.extend({    

  
    initialize: function(options) {                 
        var self = this
        this.project1 = null
        this.project2 = null        

        this.reports = []
    },

    render:function () {                    
        var self = this
        $(this.el).html(this.template());                                            
      
        $("#featured-" + utils.getEdition(), this.el).show()

        this.addTypeahead("project1", "project2", "red")
        this.addTypeahead("project2", "project1", "blue")                    

        if (!utils.isMobile())
            setTimeout(function() {$("#project1", self.el).focus()}, 0)

        return self;
    },

    addTypeahead: function(current, other, color) {
        var self = this
        $('#' + current, this.el).typeahead({
            source: function(q,cbx) {utils.searchProjects(q, "e2e page", cbx)},
            updater: function(project) {                
                self.chooseProject(current, other, color, project)                
                $("#" + other, self.el).focus()                
                if (self.project1!=null && self.project2!=null)
                    utils.reportVisit("/compare/" + self.project1 + "/" + self.project2)
                return project;
            },
            maybeSelected: function() {                
                var prj1 = $("#project1", self.el).val()
                var prj2 = $("#project2", self.el).val()

                if (prj1!="" && prj2!="")
                    app.navigate('/#compare/' + prj1 + '/' + prj2, true);
            },
            items: 8})
    },   

    chooseProject: function(current, other, color, project) {        
        var self = this        
        $("#featured-left", self.el).show()
        self[current] = project            
        self[current + "Model"] = new Project({name: project, color: color})
        self[current + "Model"].query = "include_stat=false&include_users=true"                
        self[current + "Model"].fetch()
        self[current + "MiniView"] = new ProjectMiniView({model: self[current + "Model"]})
        $("#" + current + "_div").html(self[current + "MiniView"].el)
        self.tryLoadReport()
    },

    showProjects: function(project1, project2) {
        $('#project1', this.el).val(project1)
        $('#project2', this.el).val(project2)
        this.chooseProject("project1", "project2", "red", project1)
        this.chooseProject("project2", "project1", "blue", project2)
    },


    tryLoadReport: function() {        
        if (!this.project1 || !this.project2) return;
        
        Backbone.history.navigate("/compare/"+this.project1 + "/" + this.project2)

        $("#report_results", this.el).html("")

        var query = "?project1="+this.project1+"&project2="+this.project2

        var venn_url = "/projects_compare/users_overlap" + query
        this.addView(VennView, venn_url)
        
        this.addView(MyMapView, null)

        var depends_url = "/projects_compare/mutual_depends_on" + query
        this.addView(DependsView, depends_url)        

        var companies_url = "/projects_compare/companies_overlap" + query
        this.addView(CompaniesView, companies_url)

        this.addView(RandomUserView, null)
        
        this.addView(TotalNetworkView, null)

        var randomCodeUri = "/projects_compare/code/random_samples" + query
        this.addView(RandomCodeView, randomCodeUri)
       

    },

    addView: function(view, url, span) {

        var view = new view(
            { url: url
            , project1: this.project1
            , project2: this.project2
            , span: span});


        view.render()

        $("#report_results", this.el).append(view.el)        
        $("#report_results", this.el).append("<div style='clear: both; margin-bottom:30px' />")        
    },

    close: function() {

    }
})


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

        this.addTypeahead("project1", "project2", "red")
        this.addTypeahead("project2", "project1", "blue")                    

        setTimeout(function() {$("#project1", self.el).focus()}, 0)

        return self;
    },

    addTypeahead: function(current, other, color) {
        var self = this
        $('#' + current, this.el).typeahead({
            source: searchProjects,
            updater: function(project) {               
                self.chooseProject(current, other, color, project)
                $("#" + other, self.el).focus()                
                return project;
            },
            items: 8})

    },   

    chooseProject: function(current, other, color, project) {        
        var self = this
        $("#featured", self.el).hide()
        self[current] = project            
        self[current + "Model"] = new Project({name: project, color: color})
        self[current + "Model"].query = "include_stat=false&include_users=true"                
        self[current + "Model"].fetch()
        self[current + "MiniView"] = new ProjectMiniView({model: self[current + "Model"]})
        $("#" + current + "_div").html(self[current + "MiniView"].el)
        self.tryLoadReport()
    },

    showProjects: function(project1, project2) {
        this.chooseProject("project1", "project2", "red", project1)
        this.chooseProject("project2", "project1", "blue", project2)
    },


    tryLoadReport: function() {        
        if (!this.project1 || !this.project2) return;
        
        $("#report_results", this.el).html("")

        var venn_url = "/projects_compare/users_overlap?project1="+this.project1+"&project2="+this.project2                
        this.addView(VennView, venn_url)

        
        var map_url = "/projects_compare/countries_overlap?project1="+this.project1+"&project2="+this.project2                        
        this.addView(MyMapView, map_url)    
    },

    addView: function(view, url) {

        var view = new view(
            { url: url
            , project1: this.project1
            , project2: this.project2});


        view.render()

        $("#report_results", this.el).append(view.el)        
        $("#report_results", this.el).append("<div style='margin-bottom:30px' />")        
    },

    close: function() {

    }
})


function searchProjects(q, cbx) {    
    
    $.get("/projects?$name="+q+"&$top=8&mode=starts", function(data) {  
        var res = []
        data = JSON.parse(data)
        data.forEach(function(d) {
            res.push(d.name)
            cbx(res)
        })
    })

}

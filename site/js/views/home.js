
window.HomeView = Backbone.View.extend({    

    initialize: function(options) {                 
        var self = this
        
        this.project1 = null
        this.project2 = null

        this.projects = new PagedList(null, {"model": Project, "url": "/projects"})
        this.projects.paginator_ui.perPage = 15
        this.projectListView = new ProjectListView({model: this.projects, mode: "center"})
        
        this.projectListView.bind("hasSearchResult", function() {               
            $("#project-featured-list", self.el).hide()            
        })

        this.startTab = options.startTab

    },

    render:function () {            
        var self = this

        $(this.el).html(this.template());                                         

        $("#projects-list", this.el).html(this.projectListView.el)       

        if (this.startTab=="h2h") {           
            window.setTimeout(function() {$('#tab a[href="#h2h"]').tab('show')}, 0)            
            if (!utils.isMobile())
                window.setTimeout(function() {$("#project1", self.el).focus()}, 0)                        
        }
        else {
            if (!utils.isMobile())
                window.setTimeout(function() {self.projectListView.focus()}, 0)
        }        
       
        this.addTypeahead("project1", "project2")
        this.addTypeahead("project2", "project1")                        

        $('a[data-toggle="tab"]', self.el).on('shown', function (e) {    
          if (!utils.isMobile()) {              
            if (e.target.href.indexOf("#h2h")!=-1) $("#project1", self.el).focus()
            else self.projectListView.focus()
          }
        })

        return this;
    },

    close:function() {
          
    },

    tryNavigate: function() {
        var prj1 = $("#project1").val()
        var prj2 = $("#project2").val()

        if (prj1!="" && prj2!="")
            app.navigate('/#compare/' + prj1 + '/' + prj2, true);
    },

    addTypeahead: function(current, other) {    
        
    
        var self = this
        
        var x = $('#' + current, this.el)
        $('#' + current, this.el).typeahead({
            source: function(q,cbx) {utils.searchProjects(q, "home", cbx)},
            updater: function(project) {
                $("#" + other, self.el).focus()                
                self[current] = project
                self.tryNavigate()
                return project;
            },
            maybeSelected: function() {                
                self.tryNavigate()
            },
            items: 8})

    }

});


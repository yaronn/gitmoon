
window.SampleCodeMasterView = Backbone.View.extend({

    initialize: function(options) {                                   
        var self = this    
        $(this.el).html(this.template());                                            
        
        var baseCodeUrl = "/projects/" + options.projectName + "/sample_code"
        this.sampleCodeList = new PagedList(null, 
            { "model": SampleCode
            , "url": baseCodeUrl
            , "page_size": 7 })
           //   , "url": "http://localhost:8090/" })

        this.sampleCodeListView = new SampleCodeListView({
              model: this.sampleCodeList
            , "project_name": options.projectName})
        this.isLoaded = false


        this.projectsList = new ListViewModel(null, {model: ListItemModel, 
                url: '/projects/'+options.projectName+'/sample_code_using_projects',
                getCountUrl: '/projects/'+options.projectName+'/sample_code/count',
                "page_size": 20});

        this.projectsView = new ListViewView({model: this.projectsList})

        this.projectsView.bind("projectChosen", function(name) {
            self.sampleCodeListView.filterByProject(name)          
        })

        this.projectsView.bind("allProjectsChosen", function() {
          self.sampleCodeListView.filterByAllProjects()          
        })
                      
      
    },
        
    render:function () {
        var self = this 

        if (!this.isLoaded) {
            this.projectsList.fetch();
            this.sampleCodeListView.filterByAllProjects()
            this.sampleCodeListView.trackScroll(true)            
        }
        this.isLoaded = true
        
        $('#code-samples', this.el).html(self.sampleCodeListView.el);        
        
        this.projectsView.render()
        $('#using-projects-list', this.el).html(self.projectsView.el);

        return this;
    },

    close: function() {
        this.sampleCodeListView.close()
    },

    trackScroll: function(shouldTrack) {
        this.sampleCodeListView.trackScroll(shouldTrack)
    },


});


window.SampleCodeMasterView = Backbone.View.extend({

    initialize: function(options) {                                   
        var self = this    
        $(this.el).html(this.template());                                            
        
        var baseCodeUrl = "/projects/" + options.projectName + "/sample_code"
        this.sampleCodeList = new PagedList(null, 
            { "model": SampleCode
            , "url": baseCodeUrl
            , "page_size": 7})
           //   , "url": "http://localhost:8090/" })

        this.sampleCodeListView = new SampleCodeListView({model: this.sampleCodeList})
        this.isLoaded = false


        this.projectsList = new ListViewModel(null, {model: ListItemModel, 
                url: '/projects/'+options.projectName+'/sample_code_using_projects',
                getCountUrl: '/projects/'+options.projectName+'/sample_code/count',
                "page_size": 25});

        this.projectsView = new ListViewView({model: this.projectsList})

        this.projectsView.bind("projectChosen", function(name) {
            self.sampleCodeListView.filterByProject(name)          
        })

        this.projectsView.bind("allProjectsChosen", function() {
          self.sampleCodeListView.filterByAllProjects()          
        })
              
        this.projectsList.fetch();
      
    },
        
    render:function () {
        var self = this 
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

    tabVisible: function() {
        if (!this.isLoaded) {
            this.sampleCodeList.fetch()
            this.sampleCodeListView.trackScroll(true)
        }
        this.isLoaded = true
    }

});

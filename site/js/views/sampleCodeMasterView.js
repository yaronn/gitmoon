
window.SampleCodeMasterView = Backbone.View.extend({

    initialize: function(options) {                                   
        var self = this    
        $(this.el).html(this.template());                                            
        
        this.projectName = options.projectName


        if (utils.getEdition()=="nuget") {
            $("#code-samples", this.el).html("CodeBacks are not available for nuget just yet. <br />"
                + "You can check them out for node.js in <a href='http://npm.gitmoon.com'>GitMoon npm edition</a>")
            $("#byProjectTitle", this.el).hide()
            return
        }

        var baseCodeUrl = "/projects/" + this.projectName + "/sample_code"
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

        this.projectsView.bind("itemChosen", function(name) {
            utils.reportVisit("/project/" + self.projectName + "/code_samples/"+name)
            self.sampleCodeListView.filterByProject(name)          
        })

        this.projectsView.bind("allItemsChosen", function() {
          self.sampleCodeListView.filterByAllProjects()          
        })
                      
      
    },
        
    render:function () {
        var self = this 

        if (utils.getEdition()=="nuget")
            return this

        if (!this.isLoaded) {
            this.projectsView.refreshData()
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
        if (utils.getEdition()=="npm")
            this.sampleCodeListView.close()
    },

    trackScroll: function(shouldTrack) {
        if (utils.getEdition()=="npm")
            this.sampleCodeListView.trackScroll(shouldTrack)
    },


});



window.ProjectUsersMasterView = Backbone.View.extend({

    events: {
        "change #cbxDimention": "changeDimention"        
    },

    initialize: function(options) {                                   
        var self = this    
        $(this.el).html(this.template());                                            
        
        this.projectUserList = new PagedList(null, 
            { "model": ProjectUser
            , "url": "/projects/" + options.projectName + "/users"
            , "page_size": 7})      

        this.projectName = options.projectName;

        this.projectUserListView = new ProjectUserListView({model: this.projectUserList})      

        this.isLoaded = false                            
    },
        
    render:function () {
        var self = this 

        if (!this.isLoaded) {            
            this.initDimentionList("countries")
            this.projectUserList.fetch()
            this.projectUserListView.trackScroll(true)            
        }
        this.isLoaded = true

        $('#users-list', this.el).html(self.projectUserListView.el);        

        //this.dimentionListView.render()
        $('#dimention-list', this.el).html(self.dimentionListView.el);        

        return this;
    },

    close: function() {
        this.projectUserListView.close()
    },

    trackScroll: function(shouldTrack) {
        this.projectUserListView.trackScroll(shouldTrack)
    },

    changeDimention: function(e) {
        this.clearDimention("country")                
        this.clearDimention("company")                
        if (e.target.value=="country") this.changeDimentionInternal("countries");
        else this.changeDimentionInternal("companies");
    },

    changeDimentionInternal: function(url_key) {
         
         //so that elements are cleared from the ui
         this.dimentionList.reset()
         
         //so that the new url is
         this.dimentionList.initialize(null, {model: ListItemModel, 
                url: '/projects/'+this.projectName+'/users/' + url_key,
                getCountUrl: '/projects/'+this.projectName+'/users/count',
                "page_size": 20})
         
         this.dimentionListView.refreshData()                  
    },

    clearDimention: function(dimention) {
        this.projectUserListView.clearDimentionFilter(dimention)          
    },

    initDimentionList: function(url_key) {
        var self = this;
        
        this.dimentionList = new ListViewModel(null, {model: ListItemModel, 
                url: '/projects/'+this.projectName+'/users/' + url_key,
                getCountUrl: '/projects/'+this.projectName+'/users/count',
                "page_size": 20});
                
        this.dimentionListView = new ListViewView({model: this.dimentionList})

        var cbx = $("#cbxDimention", this.el)
        this.dimentionListView.bind("projectChosen", function(name) {             
            self.projectUserListView.filterByDimention(cbx.val(), name)          
        })

        this.dimentionListView.bind("allProjectsChosen", function() {
            self.projectUserListView.clearDimentionFilter(cbx.val())
        })
        
        this.dimentionList.fetch()
    }

});

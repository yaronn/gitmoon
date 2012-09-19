

window.ProjectUsersMasterView = Backbone.View.extend({

    events: {        
        "click #byCountry": "setCountryDimention",
        "click #byCompany": "setCompanyDimention"

    },

    initialize: function(options) {                                   
        var self = this    
        $(this.el).html(this.template());                                            
        
        this.currentDimention = "country"
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


    setCountryDimention: function(e) {
        this.clearDimentions()
        $("#liCountry", this.el).attr("class", "active")
        $("#liCompany", this.el).attr("class", "")
        this.currentDimention = "country"
        this.changeDimentionInternal("countries")
        return false        
    },

    setCompanyDimention: function(e) {
        this.clearDimentions()
        $("#liCountry", this.el).attr("class", "")
        $("#liCompany", this.el).attr("class", "active")
        this.currentDimention = "company"
        this.changeDimentionInternal("companies")
        return false
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

    clearDimentions: function(dimention) {
        this.projectUserListView.clearDimentionFilter(["country", "company"])        
        this.projectUserListView.refreshData()
    },

    initDimentionList: function(url_key) {
        var self = this;
        
        this.dimentionList = new ListViewModel(null, {model: ListItemModel, 
                url: '/projects/'+this.projectName+'/users/' + url_key,
                getCountUrl: '/projects/'+this.projectName+'/users/count',
                "page_size": 20});
                
        this.dimentionListView = new ListViewView({model: this.dimentionList})

        this.dimentionListView.bind("itemChosen", function(name) {            
            self.projectUserListView.filterByDimention(self.currentDimention, name)          
        })

        this.dimentionListView.bind("allItemsChosen", function() {
            self.projectUserListView.clearDimentionFilter(self.currentDimention)
            self.projectUserListView.refreshData()
        })
        
        this.dimentionList.fetch()
    }

});

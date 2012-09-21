

window.ProjectUsersMasterView = Backbone.View.extend({

    events: {        
        "click #byCountry": "setCountryDimention",
        "click #byCompany": "setCompanyDimention"

    },

    initialize: function(options) {                                   
        var self = this    
        $(this.el).html(this.template());                                            
        
        this.currentDimention = new this.countriesDimention()
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
            this.setCountryDimention()
            this.currentDimention.showAllItems(self.el)
            this.projectUserList.fetch()
            this.projectUserListView.trackScroll(true)            
            $('#users-list', this.el).html(self.projectUserListView.el);        
            //this.dimentionListView.render()
            $('#dimention-list', this.el).html(self.dimentionListView.el);

        }
        this.isLoaded = true
    
        return this;
    },

    close: function() {
        this.projectUserListView.close()
    },

    trackScroll: function(shouldTrack) {
        this.projectUserListView.trackScroll(shouldTrack)
    },


    setCountryDimention: function(e) {
        this.currentDimention = new this.countriesDimention()
        return this.changeDimention()
    },


    setCompanyDimention: function(e) {
        this.currentDimention = new this.companiesDimention()
        return this.changeDimention()
    },

    changeDimention: function() {
        this.clearDimentions()
        this.flipLinks(this.currentDimention.getName())                        
        this.currentDimention.showAllItems()
        this.changeDimentionInternal(this.currentDimention.getUrlKey())
        return false
    },

    flipLinks: function(name) {
        var isCountry = name == "country"
        $("#liCountry", this.el).attr("class", isCountry?"active":"")
        $("#liCompany", this.el).attr("class", isCountry?"":"active")
        $("#liGlobe", this.el).attr("class", "icon-globe"+(isCountry?" icon-white":""))
        $("#liBriefcase", this.el).attr("class", "icon-briefcase"+(isCountry?"":" icon-white"))
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
            self.projectUserListView.filterByDimention(self.currentDimention.getName(), name)                      
            self.currentDimention.showItem(name, self.el)
        })

        this.dimentionListView.bind("allItemsChosen", function() {
            self.projectUserListView.clearDimentionFilter(self.currentDimention.getName())            
            self.currentDimention.showAllItems(self.el)
        })
        
        //this.dimentionList.fetch()
    },

    countriesDimention: function() {

        this.getName = function() { return "country" }        
        
        this.getUrlKey = function() { return "countries" }        
        
        this.showItem = function(item, root) {
            $("#item-name", root).text(item)          
            var item_canonized = item
            if (item_canonized.toLowerCase()=="united states")
                item_canonized = "United States of America"

            var encodedItem = item_canonized.replace(/[ ]/g, "_")            
            url = "/img/flags/"+encodedItem+".png"
            $("#item-image", root).attr("src", url)
        }

        this.showAllItems = function(root) {
            $("#item-name", root).text("All Countries")
            $("#item-image", root).attr("src", "http://www.flags.net/images/largeflags/FRAN0001.GIF")
        }

        return this
    },

    companiesDimention: function() {

        this.getName = function() { return "company" }        
        
        this.getUrlKey = function() { return "companies" }        
        
        this.showItem = function(item, root) {
            $("#item-name", root).text(item)                        
            var name = item.toLowerCase().replace(/[!]/g, "")            
            $("#item-image", root).attr("src", "/img/companies/"+name+".jpg")
        }

        this.showAllItems = function(root) {
            $("#item-name", root).text("All Companies")            
            $("#item-image", root).attr("src", "http://www.flags.net/images/largeflags/FRAN0001.GIF")
        }

        return this
    }


});

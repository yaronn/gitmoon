

window.ProjectUsersMasterView = Backbone.View.extend({

    events: {        
        "click #byCountry": "setCountryDimention",
        "click #byCompany": "setCompanyDimention",
        "click #byDependency": "setDependencyDimention",
    },

    initialize: function(options) {                                   
        var self = this
        
        $(this.el).html(this.template());                                            

        $("#item-image", this.el).error(function () {
          self.imageNotFound()
        });

        this.projectName = options.projectName;

        this.currentDimention = new this.countriesDimention(this.projectName)
        this.projectUserList = new PagedList(null, 
            { "model": ProjectUser
            , "url": "/projects/" + options.projectName + "/users"
            , "page_size": 7})      


        this.projectUserListView = new ProjectUserListView({model: this.projectUserList})      

        this.isLoaded = false                            
    },
        
    render:function () {
        var self = this 

        if (!this.isLoaded) {            
            this.initDimentionList("countries")
            this.setCountryDimention()                        
            this.projectUserListView.trackScroll(true)            
            $('#users-list', this.el).html(self.projectUserListView.el);                    
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
        this.currentDimention = new this.countriesDimention(this.projectName)
        return this.changeDimention()
    },


    setCompanyDimention: function(e) {
        this.currentDimention = new this.companiesDimention()
        return this.changeDimention()
    },

    setDependencyDimention: function(e) {
        this.currentDimention = new this.dependencyDimention(this.projectName)
        return this.changeDimention()
    },


    changeDimention: function() {        
        this.clearDimentions()
        this.flipLinks(this.currentDimention.getName())                        
        this.currentDimention.showAllItems(this.el)
        this.changeDimentionInternal(this.currentDimention.getUrlKey())
        return false
    },

    flipLinks: function(name) {
        var buttons = ["country", "company", "dependency"]
        var icons = ["globe", "briefcase", "th"]
        for (i in buttons) {
            var current = buttons[i]
            var selected = (current==name) 
            $("#li_" + current, this.el).attr("class", selected?"active":"")
            $("#icon_"+current, this.el).attr("class", "icon-"+icons[i]+(selected?" icon-white":""))
        }
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
        this.projectUserListView.clearDimentionFilter(["country", "company", "dependency"])        
        //this.projectUserListView.refreshData()
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
                
    },

    countriesDimention: function(projectName) {

        this.initialize = function(projectName) {
            var self = this

            this.projectName = projectName
            this.currentArea = "world"

            $('#map-buttons', this.el).button()
                $('#map-buttons', this.el).find('button').bind('click',function(e){              
                  self.changeMap(e.currentTarget.id)
            })
        }

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
            $("#extra-data-countries", root).show()
            $("#extra-data-dependencies", root).hide()

            var region = utils.regionsMap[item]
            if (region) $("#" + region, root).click()
        }

        this.showAllItems = function(root) {            
            $("#item-name", root).show()
            $("#item-image", root).show()
            $("#item-name", root).text("All Countries")
            $("#item-image", root).attr("src", "/img/flags/default.png")            
            $("#extra-data-countries", root).show()
            $("#extra-data-dependencies", root).hide()
            $("#world", root).click()
        }

       this.drawVisualization = function(root, region) {
            var self = this            
            if (this.mapData) {                
                this.drawVisualizationInternal(root, region)                
            }
            else {                            
             var url = "/projects/" + this.projectName + "/users/" 
                       + (region=="US"?"us_states":"countries")                                           

             $('#map-loading', root).show()
             $('#map', root).hide()
             $.get(url, function(data) {  
                //data = JSON.parse(data)                
                var mapData = [['Location', 'Count']]
                
                data.forEach(function(d) {
                    mapData.push([d.name, d.count])
                })

                self.mapData = google.visualization.arrayToDataTable(mapData)
                self.drawVisualizationInternal(root, region)
                $('#map-loading', root).hide()
                $('#map', root).show()                
             })
            }
        }

        this.drawVisualizationInternal = function(root, region) {
               var self = this

               $('#map', root).html("")
               this.geomap = null;

               $('#map-loading', root).hide()
               this.geomap = new google.visualization.GeoChart(
                $('#map', root).get()[0]);
                
                var options = {
                    legend: "none"
                    , width: 360                    
                    , keepAspectRatio: true}

                if (region!="world") options.region = region
                if (region=="US") options.resolution = "provinces"

                this.geomap.draw(this.mapData, options)
        }

        this.changeMap = function(area) {            
            var region
                      
            //us requires different data
            if ((area=='US' && this.currentArea!="US") 
                || (this.currentArea=="US" && area!='US'))
            {
                this.mapData = null                
            }

            this.currentArea = area

            if (area=="world") region="world"
            else if (area=="US") region="US"     
            else if (area=="europe") region="150"
            else if (area=="americas") region="019"     
            else if (area=="africa") region="002"     
            else if (area=="asia") region="142"
            else if (area=="oceania") region="009"

            this.drawVisualization(this.el, region)
        },

        this.handleImageNotFound = function(root) {

        }

        this.initialize(projectName)
        return this
    },

    companiesDimention: function() {

        this.getName = function() { return "company" }        
        
        this.getUrlKey = function() { return "companies" }        
        
        this.showItem = function(item, root) {
            $("#item-name", root).hide()
            $("#item-image", root).show()
            $("#item-name", root).text(item)                        
            var name = item.toLowerCase().replace(/[!]/g, "")            
            var url = "/img/companies/"+name+".jpg"            
            $("#item-image", root).attr("src", url)
            $("#extra-data-countries", root).hide()
            $("#extra-data-dependencies", root).hide()
        }

        this.showAllItems = function(root) {
            $("#item-name", root).show()
            $("#item-image", root).show()
            $("#item-name", root).text("All Companies")            
            $("#item-image", root).attr("src", "/img/companies/default.jpg")
            $("#extra-data-countries", root).hide()
            $("#extra-data-dependencies", root).hide()
        },        

        this.handleImageNotFound = function(root) {
            $("#item-name", root).show()
            $("#item-image", root).hide()
        }

        return this
    },

    dependencyDimention: function(projectName) {


        this.initialize = function(projectName) {
            this.projectName = projectName
        }

        this.getName = function() { return "dependency" }        
        
        this.getUrlKey = function() { return "dep_projects" }        
        
        this.showItem = function(item, root) {
            $("#item-name", root).show()
            $("#item-image", root).hide()
            $("#item-name", root).text(item)                        
            var name = item.toLowerCase().replace(/[!]/g, "")
            $("#extra-data-countries", root).hide()
            $("#extra-data-dependencies", root).show()
        }

        this.showAllItems = function(root) {
            $("#item-name", root).show()
            $("#item-image", root).hide()
            $("#item-name", root).text("All Dependencies")                        
            $("#extra-data-countries", root).hide()
            $("#extra-data-dependencies", root).show()

            this.drawVisualization(root);
        },        

        this.handleImageNotFound = function(root) {
            
        }

        this.drawVisualization = function(root) {
            var self = this

            var url = "/projects/" + this.projectName + "/users/dep_projects?$top=50"                       
            $('#dependencies-bar-loading', root).css("visibility", "")
            $.get(url, function(data) {                  
                var mapData = [['Location', 'Count']]
                
                data.forEach(function(d) {
                    mapData.push([d.name, d.count])
                })

                self.mapData = google.visualization.arrayToDataTable(mapData)
                $('#dependencies-bar-loading', root).css("visibility", "hidden")
                self.drawVisualizationInternal(root)
                $('#dependencies-bar', root).show()                
             })
        }

        this.drawVisualizationInternal = function(root) {              
              var chart_area_height = this.mapData.D.length*30              
              new google.visualization.BarChart($("#dependencies-bar", root).get()[0]).draw(this.mapData,
                       { width: 300, height: chart_area_height + 60,
                        legend: {position: "none"},
                        colors: ["08C"], 
                        //backgroundColor: "red",
                        hAxis: {title: "Stars"},                                                 
                        chartArea:{left:150,top:0,width:"60%",height: chart_area_height},
                        fontSize: 14})

        }

        this.initialize(projectName)
        

        return this
    },

    imageNotFound: function() {        
        this.currentDimention.handleImageNotFound(this.el)
    }

});



window.ProjectListView = Backbone.View.extend({

    events: {
      "click #prev": "prev",      
      "click #next": "next",      
      "keyup #search" : "search"
    },
    

	initialize:function (options) {
        var self = this;

        this.mode = this.options.mode ? this.options.mode : "side";        
        this.firstTime = true;   

        this.is_searching = false
        this.model.bind("reset", function() { 
            $("#loading", this.el).css("visibility", "hidden")
            self.render()
        }, this);
        this.model.bind("add", function (project) {
            $(self.el).append(new ProjectItemView({model:project}).render().el);
        });        
        
        $(this.el).html(this.template())        

       if (this.firstTime) $("#loading", this.el).css("visibility", "hidden")
       this.showControls(this.firstTime)        

        $("#search", this.el).css("width",  this.mode=="side"?"80px":"200px")
        $("#search", this.el).attr("placeholder",  this.mode=="side"?"find project...":"find npm project...")
                
        $("#wrapper", this.el).attr("class", this.mode=="side"?"span2":"span5"  )  
        $("#divPager", this.el).attr("class",  this.mode=="side" ? "span2" : "span3" )
        $("#divList", this.el).attr("class",  this.mode=="side" ? "span2" : "span3" )        
        $("#divSearch", this.el).attr("class",  this.mode=="side" ? "span2" : "span5")

        if (this.mode=="center") {
            $("#divList", this.el).css("margin-left", "50px" )                        
        }
        $("#divList", this.el).css("margin-top",  this.mode=="side" ? "0px" : "20px" )        

        this.list = $("#projects-list", this.el)
    },

    showControls: function(firstTime) {        
        $("#divList", this.el).css("display",  firstTime?"none":"block")            
        $("#divPager", this.el).css("display",  firstTime?"none":"block")                    
    },

    render:function () {        
        this.list.empty()
       
        if (this.model.currentPage==0) $("#prev", this.el).css("visibility", "hidden")
        else $("#prev", this.el).css("visibility", "")     
       
        if (this.model.models.length<this.model.paginator_ui.perPage ) $("#next", this.el).css("visibility", "hidden")
        else $("#next", this.el).css("visibility", "")             

        _.each(this.model.models, function (project) {            
            this.list.append(new ProjectListItemView({model:project}).render().el);
        }, this);
        return this;
    },

    prev: function(e) { 
        e.preventDefault();
        if (this.model.currentPage>0) this.model.requestPreviousPage()
    },

    next: function(e) {        
        e.preventDefault();
        this.model.requestNextPage()
    },

    search: function(e) { 
        if (utils.ignoreKeyForSearch(e.keyCode)) return
        if (this.is_searching) return        

        this.is_searching = true
        var self = this        
        window.setTimeout(function() {self.doSearch(self)}, 100)
        return true
    }, 

    doSearch: function(self) {        
       $("#loading", this.el).css("visibility", "")
       self.model.server_api.$name=$("#search", self.el).val()
       self.model.currentPage = 0
       self.model.fetch({success: function(data) {
        self.trigger('hasSearchResult')
        self.showControls(false)        
       }})
       self.is_searching = false
    },

    close: function() {
        
    }

});
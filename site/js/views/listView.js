var dispatcher = _.clone(Backbone.Events)

window.ListView = Backbone.View.extend({

    events: {      
      "keyup #search"      : "search"
    },

	initialize:function () {        
        this.is_searching = false        
        this.shouldTrack = false
        var self = this
        this.isLoading = false

        this.scrollhandler = function(e) {
            self.scrolled.call(self, e)
        } 

        $(window).bind("scroll", this.scrollhandler);        
        this.model.bind("reset", function() {
            this.isLoading=false
            $("#loading", this.el).css("visibility", "hidden")          
            this.render()
        }, this)
                
        $(this.el).html(this.template())                
        this.list = $(this.options.list_id, this.el)        
    },    

    close: function() {        
        $(window).unbind('scroll', this.scrollhandler);
        this.remove();        
    },

    trackScroll:function(shouldTrack) {       
        this.shouldTrack = shouldTrack    
    },

    render:function () {  
        var word = $("#search", this.el).val()    
        _.each(this.model.models, function (m) {
            m.set("searchWord", word)                         
            this.list.append(new this.options.Model({model:m}).render().el);
        }, this);
        return this;
    },   

    search: function(e) { 
        if (utils.ignoreKeyForSearch(e.keyCode)) return
        if (this.is_searching) return
        this.is_searching = true
        var self = this        
        window.setTimeout(function() {self.doSearch(self)}, 500)
        return true
    }, 

    doSearch: function(self) {            
       self.list.empty()        
       $("#loading", this.el).css("visibility", "")  
       var word = $("#search", self.el).val() 
       self.model.server_api[self.options.filter_field_name]=word       
       self.model.currentPage = 0
       self.model.fetch()
       self.is_searching = false
    },

    scrolled: function(e) {  
        //no need to track, we are probably not visible
        if (!this.shouldTrack) return

        //the model has no more items - we are at last page        
        if (this.model.length==0) return
        
        //check if we are already loading
        if (this.isLoading) return

        //if we are 200px from the bottom let's load more items
        if($(document).height() - 200 < $(document).scrollTop() + $(window).height())
        {            
            var self = this
            this.isLoading = true
            $("#loading", this.el).css("visibility", "")          
            this.model.requestNextPage()
        }
    }         

});

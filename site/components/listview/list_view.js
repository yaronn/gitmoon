
window.ListViewView = Backbone.View.extend({

    events: {
      "click #prev": "prev",      
      "click #next": "next",   
      "click #all-items": function(e) {
        this.trigger("allProjectsChosen")                        
        return false
      }         
    },
    

   initialize:function (options) {
        var self = this;
            
        this.model.bind("reset", function() { 
            $("#loading", this.el).css("visibility", "hidden")
            self.render()
        }, this);

        this.model.bind("add", function (item) {
            var itemView = new ListViewItemView({model:item})
            itemView.bind("projectChosen", function(project)
            {
                self.trigger("projectChosen", project)
            })
            $(self.el).append(itemView.render().el);
        });        
        
        $(this.el).html(this.template())        

        if (this.firstTime) $("#loading", this.el).css("visibility", "hidden")       

        this.model.getTotalCount(function(count) {
            $("#all-items-count", self.el).text(count)    
        })
        

        this.list = $("#other-items", this.el)
    },


    render:function () {   
        var self = this     
        this.list.empty()
        
        if (this.model.currentPage == undefined  || this.model.currentPage==0) 
            $("#prev", this.el).css("visibility", "hidden")
        else 
            $("#prev", this.el).css("visibility", "")     
       
        if (this.model.models.length<this.model.paginator_ui.perPage ) $("#next", this.el).css("visibility", "hidden")
        else $("#next", this.el).css("visibility", "")             

        _.each(this.model.models, function (project) {
            var itemView = new ListViewItemView({model:project})
            itemView.bind("projectChosen", function(project)
            {
                self.trigger("projectChosen", project)
            })
            this.list.append(itemView.render().el);
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
   
    close: function() {
        
    }

});
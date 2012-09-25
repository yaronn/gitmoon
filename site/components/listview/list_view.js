
window.ListViewView = Backbone.View.extend({

    events: {
      "click #prev": "prev",      
      "click #next": "next",   
      "click #all-items": function(e) {
        this.trigger("allItemsChosen")                        
        return false
      }         
    },
    

   initialize:function (options) {
        var self = this;

        this.model.bind("reset", function() {             
            
            $("#loading", this.el).hide()           
            
            self.render()
        }, this);


        this.model.bind("add", function (item) {
            var itemView = new ListViewItemView({model:item})
            itemView.bind("itemChosen", function(item)
            {
                self.trigger("itemChosen", item)
            })
            $(self.el).append(itemView.render().el);
        });        
        
        $(this.el).html(this.template())                

        //if (this.firstTime) $("#loading", this.el).hide()
        
        this.list = $("#other-items", this.el)
    },


    render:function () {   
        var self = this     
        this.list.empty()
                
        if (this.model.currentPage == undefined  || this.model.currentPage==0) 
            $("#prev", this.el).hide()
        else 
            $("#prev", this.el).show()
       
        if (this.model.models.length<this.model.paginator_ui.perPage ) $("#next", this.el).hide()
        else $("#next", this.el).show()

        _.each(this.model.models, function (item) {
            var itemView = new ListViewItemView({model:item})
            itemView.bind("itemChosen", function(item)
            {
                self.trigger("itemChosen", item)
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
        
    },

    refreshData: function() {         
        this.model.getTotalCount(function(count) {   
            $("#all-items-count", self.el).text(count)    
        })

        $("#loading", this.el).show()        
        this.model.fetch()
    }

});
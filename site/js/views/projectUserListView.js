
window.ProjectUserListView = ListView.extend({

    initialize:function () {        
        this.options.list_id = "#users-list"
        this.options.Model = ProjectUserListItemView
        this.options.filter_field_name = "$login"
        ListView.prototype.initialize.call(this)
    },

    filterByDimention: function(dimention, name) {              
       delete this.model.server_api[dimention]       
       this.model.server_api[dimention] = name
       this.filterByDimentionInternal()       
    },
   
    clearDimentionFilter: function(dimentions) {      
      for (i in dimentions) 
        delete this.model.server_api[dimentions[i]]
      this.filterByDimentionInternal()      
    },

    filterByDimentionInternal: function() {
       var self = this
       self.list.empty()
       $("#loading", this.el).css("visibility", "")         
       self.model.currentPage = 0       
       this.refreshData()
    },

    refreshData: function() {
       this.model.fetch()
    }

});


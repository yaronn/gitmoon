
window.SampleCodeListView = ListView.extend({

	initialize: function (options) {        

        this.options.list_id = "#sample-code-list"
        this.options.Model = SampleCodeListItemView  
        this.options.filter_field_name = "$code"        
        this.is_searching = false
        $("help", this.el).tooltip()
        //this.list = $(this.options.list_id, this.el)   

        ListView.prototype.initialize.call(this)
    },

    filterByProject: function(name) {
       this.model.server_api["using_project_name"] = name
       this.filterByProjectInternal()
       $("#using_proj", this.el).text(name)
       $("#used_proj", this.el).text(this.options.project_name)
    },

    filterByAllProjects: function() {
      delete this.model.server_api["using_project_name"]
      this.filterByProjectInternal()
      $("#using_proj", this.el).text("[all projects]")
      $("#used_proj", this.el).text(this.options.project_name)
    },

    filterByProjectInternal: function() {
       var self = this
       self.list.empty()        
       $("#loading", this.el).css("visibility", "")         
       self.model.currentPage = 0
       self.model.fetch()
    }
   
});

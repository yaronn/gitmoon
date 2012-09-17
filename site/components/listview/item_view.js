

window.ListViewItemView = Backbone.View.extend({
    
   events: {
      "click #link": "clicked"
   },

   render: function () {        
       $(this.el).html(this.template(this.model.toJSON()));
       return this;
   },

   clicked: function(e) {      
      var proj = $(e.currentTarget).attr("project")
      this.trigger("projectChosen", proj)      
      return false
   }

})
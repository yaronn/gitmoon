

window.ListViewItemView = Backbone.View.extend({
    
   events: {
      "click #link": "clicked"
   },

   render: function () {        
       $(this.el).html(this.template(this.model.toJSON()));
       return this;
   },

   clicked: function(e) {      
      var proj = $(e.currentTarget).attr("item")
      this.trigger("itemChosen", proj)      
      return false
   }

})
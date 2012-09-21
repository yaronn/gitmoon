

window.ListViewItemView = Backbone.View.extend({
    
   events: {
      "click #link": "clicked"
   },

   render: function () {        
       var data = this.model.toJSON()
       _.extend(data, viewHelpers);
       $(this.el).html(this.template(data));
       return this;
   },

   clicked: function(e) {      
      var proj = $(e.currentTarget).attr("item")
      this.trigger("itemChosen", proj)      
      return false
   }

})

var viewHelpers = {

  //ugly WA... need to have extensibility for it
  canonize: function(name){    
    if (name=="United States") return "US"
    if (name=="United Kingdom") return "UK"
    return name;
  }
}
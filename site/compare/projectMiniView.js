
window.ProjectMiniView = Backbone.View.extend({

    initialize: function (options) {
       var self = this
       this.model.bind('change', this.render, this);
       this.model.bind("error", this.defaultErrorHandler, this);
       $(self.el).html(self.template(self.model.toJSON()))                
    },

    render: function () {        
        var self = this                
        $(self.el).html(self.template(self.model.toJSON()))
        $("#loading", self.el).hide()

        var repo = self.model.get("repository")
        if (!repo || repo.indexOf("github")==-1) {
          var editionTerm = utils.getEdition()=="npm"?"package.json file":"nuget definition"
          $("#error", this.el).text(            
            "Information about this project may be incomplete because its " +
             editionTerm + " does not link to its github repository.")
          $("#error", this.el).show()
        }

        return self;
    },

    defaultErrorHandler: function(model, error) {      
      $("#loading", this.el).hide()

      $("#error", this.el).text("This project was not found")
      $("#error", this.el).show()

    }

});
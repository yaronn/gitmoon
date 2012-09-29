
window.ProjectMiniView = Backbone.View.extend({

    initialize: function (options) {
       var self = this
       this.model.bind('change', this.render, this);
       $(self.el).html(self.template(self.model.toJSON()))                
    },

    render: function () {        
        var self = this                
        $(self.el).html(self.template(self.model.toJSON()))
        $("#loading", self.el).hide()
        return self;
    },

});
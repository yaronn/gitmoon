
window.BaseView = Backbone.View.extend({

    initialize: function (options) {
       this.project1 = options.project1
       this.project2 = options.project2       
       this.url = options.url       
    },

    render: function () {     
        var self = this
        
        $(this.el).html(window.templates.DiagramView)        

        $("#title", self.el).text(this.title)
        $("#loading", self.el).show()

        $.get(this.url, function(data) {

            $("#loading", self.el).hide()
            data = JSON.parse(data)
            self.showData(data)

        })

        return this;
    },

});
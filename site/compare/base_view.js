
window.BaseView = Backbone.View.extend({

    initialize: function (options) {
       this.project1 = options.project1
       this.project2 = options.project2       
       this.url = options.url       
       this.span = options.span
    },

    render: function () {     
        var self = this
        
        $(this.el).html(window.templates.DiagramView)        

        $("#title", self.el).text(this.title)
        $("#help", self.el).attr("title", this.help)
        $("#wrapper", self.el).attr("class", this.span)
        $("#loading", self.el).show()
                
        if (this.url) {
            $.get(this.url, function(data) {        
                $("#loading", self.el).hide()                        
                self.showData(data)
            })
        }
        else {
            $("#loading", self.el).hide()
            self.showData()
        }


        return this;
    },

});
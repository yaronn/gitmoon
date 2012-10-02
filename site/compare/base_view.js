
window.BaseView = Backbone.View.extend({

    initialize: function (options) {
       this.project1 = options.project1
       this.project2 = options.project2       
       this.url = options.url       
       this.span = options.span
       this.requiresSvg = false
    },

    render: function () {     
        var self = this
        
        $(this.el).html(window.templates.DiagramView)        



        $("#title", self.el).text(this.title)
        $("#help", self.el).attr("title", this.help)        

        if (this.requiresSvg && !utils.supportsSVG())
        {        
            $("#loading", self.el).hide()   
            $("#diagram", self.el).html("This report requires an SVG enabled browser :(")
            return this;
        }

        $("#loading", self.el).show()
                
        if (this.url) {
            $.get(this.url, function(data) {
                self.showData(data, function() {
                    $("#loading", self.el).hide()        
                })
            })
        }
        else {            
            self.showData(null, function() {
                $("#loading", self.el).hide()        
            })
        }


        return this;
    },

});
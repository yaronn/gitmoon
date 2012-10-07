
window.HeaderView = Backbone.View.extend({

    events: {
      "change #selEdition": "changeEdition"
    },

    initialize: function () {
      this.currentEdition = utils.getEdition()
    },

    render: function () {     
        $(this.el).html(this.template());
        this.paintEdition()
        window.setTimeout(function() {gapi.plusone.render("plusone", {size: "medium"})}, 0)
        return this;
    },

    paintEdition: function() {
        $("#selEdition", this.el).val(this.currentEdition)
        $("#imgEdition", this.el).attr("src", "/img/"+this.currentEdition+".png")        
    },

    changeEdition: function(e) {
      this.currentEdition = $("#selEdition", this.el).val()
      var host_suffix = window.location.host
      var suffix = host_suffix.substring(host_suffix.indexOf('.'))
      var url = "http://" + this.currentEdition + suffix     
      window.location.href = url
    }

});
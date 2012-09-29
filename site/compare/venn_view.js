
window.VennView = BaseView.extend({

   initialize: function (options) {
       this.title="Users Overlap"

       BaseView.prototype.initialize.call(this, options)
    },

   showData: function (data) {     
      
      var self = this

      venn2($("#diagram", self.el)[0], {
            cards: [data.project1, data.project2],
            labels: [ self.project1 + " (" + data.project1 + " users)"
                    , self.project2 + " (" + data.project2 + " users)"],
            overlapLabel: "overlap ("+data.overlap+")",
            overlap: data.overlap
      }, 120);
 }

});
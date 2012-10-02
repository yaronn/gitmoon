
window.VennView = BaseView.extend({

   initialize: function (options) {
       BaseView.prototype.initialize.call(this, options)
       this.title="Users Overlap"
       this.help = "This Venn diagram shows how many users each project has, and how many of them watch both projects"       
       this.requiresSvg = true
    },

   showData: function (data, cbx) {     
      
      var self = this

      cbx()
      
      //workaround for venn infinite loop on zeros
      if (data.project1==0) data.project1=1
      if (data.project2==0) data.project2=1

      venn2($("#diagram", self.el)[0], {
            cards: [data.project1, data.project2],
            labels: [ self.project1 + " (" + data.project1 + " users)"
                    , self.project2 + " (" + data.project2 + " users)"],
            overlapLabel: "overlap ("+data.overlap+")",
            overlap: data.overlap
      }, 90);
 }

});
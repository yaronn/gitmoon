
window.CompaniesView = BaseView.extend({

   initialize: function (options) {
       this.title="Users in top companies"
       this.help = "Here you can see the project users according to their companies"
       BaseView.prototype.initialize.call(this, options)
    },

   showData: function (data, cbx) {         

      html = "<table rules='rows' style='font-size: x-large'>" +
             "<tr><th width='200px'>"+this.project1+"</th>" +
             "<th width='400px'></th>" +
             "<th width='200px'>"+this.project2+"</th></tr>"


      var is_first = true
      for (i in data) {          
        data[i].canonizedName = utils.getCanonizedCompany(data[i].name)
        if (!data[i].project1_count) data[i].project1_count=0
        if (!data[i].project2_count) data[i].project2_count=0
        data[i].is_first = is_first
        html += window.templates.CompanyOverlapView(data[i])
        is_first = false
      }
    
      html += "</table>"

      $("#diagram", this.el).html(html)  
      cbx()
   }

});

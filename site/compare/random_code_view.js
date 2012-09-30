

window.RandomCodeView = BaseView.extend({

    initialize: function (options) {
       this.title="Random Code"
       this.help = "These are two samples of code showing how other projects use the selected projects"
       BaseView.prototype.initialize.call(this, options)
    },

    showData: function (data, cbx) {        
      var self = this      

      var html = ''
      
      if (data.project1sample)
        addHtml(data.project1sample, this.project1, '255,0,0')
      if (data.project2sample)
        addHtml(data.project2sample, this.project2, '0,0,255')
        
      $("#diagram", this.el).html(html)

      cbx()

      function addHtml(data, project, color) {
        var reg = new RegExp(data.var_name, "g")        
        var sample = data.code.replace(reg, "<span class='codeSampleHighlight'>"+data.var_name+"</span>")        

        html += '<b>' + data.project_using_name + ' using ' + project + ':</b>'
        html += '<br />'
        html += '<pre style="background-color: rgba('+color+',0.1)">' + sample + '</pre>' 
      }

    },


});


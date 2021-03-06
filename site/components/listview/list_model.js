
window.ListViewModel = window.PagedList.extend({

   initialize: function(models, options) {   
      this.getCountUrl = options.getCountUrl   
      window.PagedList.prototype.initialize.call(this, null, 
         {model: options.model, url: options.url, page_size: options.page_size})
      this.currentPage = 0
   },   

   getTotalCount: function(cbx)
   {

      var url = this.getCountUrl
      $.get(url, 
         function(data) {                              
                  cbx(data)
         })
   }

})
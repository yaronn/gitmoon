window.ListViewModel = window.PagedList.extend({

   initialize: function(models, options) {   
      this.getCountUrl = options.getCountUrl   
      window.PagedList.prototype.initialize.call(this, null, 
         {model: options.model, url: options.url, page_size: options.page_size})
   },

   getTotalCount: function(cbx)
   {
      $.ajax({url: this.getCountUrl})
               .done(function(res) {
                  cbx(res)
               })
   }

})
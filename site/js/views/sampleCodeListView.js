
window.SampleCodeListView = ListView.extend({

	initialize:function () {        

        this.options.list_id = "#sample-code-list"
        this.options.Model = SampleCodeListItemView  
        this.options.filter_field_name = "$code"
        this.is_searching = false        
        ListView.prototype.initialize.call(this)        
    },
   
});

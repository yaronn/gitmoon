
window.DepProjectListView = ListView.extend({

	initialize:function () {        
        this.options.list_id = "#dep-projects-list"
        this.options.Model = DepProjectListItemView
        this.options.filter_field_name = "$name"        
        ListView.prototype.initialize.call(this)
    }
});


window.ProjectUserListView = ListView.extend({

    initialize:function () {        
        this.options.list_id = "#users-list"
        this.options.Model = ProjectUserListItemView
        this.options.filter_field_name = "$login"
        ListView.prototype.initialize.call(this)
    }
});


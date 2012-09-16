
window.SimilarProjectListView = ListView.extend({

    initialize:function () {        
        this.options.list_id = "#similar-projects-list"
        this.options.Model = SimilarProjectListItemView        
        ListView.prototype.initialize.call(this)
    }

});


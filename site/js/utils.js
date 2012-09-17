// The Template Loader. Used to asynchronously load templates located in separate .html files
window.templateLoader = {

    load: function(views, callback) {

        var deferreds = [];

        $.each(views, function(index, view) {
            
            var name, path;

            if (view instanceof Array) {                
                name = view[0]
                path=view[1]
            }
            else {
               name = view
               path = ""
            }

            if (window[name]) {
                var url = 'tpl/' + path + name + '.html'                
                deferreds.push($.get(url, function(data) {                   
                    window[name].prototype.template = _.template(data);
                }, 'html'));                
            } else {
                alert(name + " not found");
            }
        });

        $.when.apply(null, deferreds).done(callback);
    }

};

consts = 
{
    page_size: 10
}

var utils = {}

utils.ignoreKeyForSearch = function(code) {
    return (code>=9 && code<=47 && code!=32)
}
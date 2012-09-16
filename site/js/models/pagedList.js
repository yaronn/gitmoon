window.PagedList = Backbone.Paginator.requestPager.extend({

    initialize: function(models, options) {        
        this.model = options.model
        this.url = options.url                
                
        this.server_api = {            
            // number of items to return per request/page
            '$top': function() { return this.perPage },

            // how many results the request should skip ahead to
            // customize as needed. For the Netflix API, skipping ahead based on
            // page * number of results per page was necessary.
            '$skip': function() { return this.currentPage * this.perPage },
        }

        this.paginator_core = {
            type: 'GET',            
            dataType: 'json',            
        }

        this.paginator_ui = {            
            firstPage: 0,
            currentPage: 0,
            perPage: options.page_size || consts.page_size,
            totalPages: 10
        }

        this.paginator_core.url = this.url + '?'
                   
    },


        parse: function (response) {            
            // Be sure to change this based on how your results
            // are structured (e.g d.results is Netflix specific)
            //var tags = response.d.results;

            //Normally this.totalPages would equal response.d.__count
            //but as this particular NetFlix request only returns a
            //total count of items for the search, we divide.
            //this.totalPages = Math.floor(response.d.__count / this.perPage);

            //return tags;
            return response;
        }
})



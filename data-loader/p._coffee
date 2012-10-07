

foo = (_) ->
	request = require('request')

	url = "https://nuget.org/api/v2/Packages?$top=2&$orderby=Published&
		   $select=Title,Published&$filter=IsLatestVersion%20eq%20true
		   %20and%20Published%20gt%20datetime'2010-01-01'"
	options = { url: url				  				 
			  , headers: {"accept": "application/json"}}
	res = request options, _		

	console.log res.body

foo _
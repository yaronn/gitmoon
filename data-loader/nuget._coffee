ex_utils = require './ex_utils'
request = require('request')
moment = require('moment')


class NugetStrategy
	
	constructor: () ->


	registerLoader: (config) ->
		config.last_nuget_date = "2010-01-01T00:00:00.00"
		@updated_projects_list = []

	getUpdatedProjectsList: (config, limit, _) ->

		url = "https://nuget.org/api/v2/Packages?$top=#{limit}&$orderby=Published&
			   $select=Title,Published&$filter=IsLatestVersion%20eq%20true
			   %20and%20Published%20gt%20datetime'#{config.data.last_nuget_date}'"

		console.log url		
		options = { url: url				  				 
				  , headers: {"accept": "application/json"}}
		
		res = request options, _				
		list = JSON.parse(res.body)								
		console.log list
		@updated_projects_list = []
		@updated_projects_list.push {name: r.Title, published: r.Published} for r in list.d		
		@updated_projects_list

	setLastUpdateToken: (config) ->
		#console.log config.last_nuget_date
		d = new Date(parseInt(@updated_projects_list[@updated_projects_list.length-1].published.substr(6)));
		config.last_nuget_date = moment(d).format('YYYY-MM-DDTHH:mm:ss.SSS');
		#console.log config.last_nuget_date

	getProject: (name, _) ->
		

	getPlatformName: () ->
		"nuget"

	shouldIgnoreProject: (name) ->
		false


	updateProjectCodeReferences: (using_proj, db, _) ->	
		return

exports.NugetStrategy = NugetStrategy
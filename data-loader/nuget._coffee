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
			   $select=Id, Title,Published&$filter=IsLatestVersion%20eq%20true
			   %20and%20Published%20gt%20datetime'#{config.data.last_nuget_date}'"
		
		options = { url: url				  				 
				  , headers: {"accept": "application/json"}}
		
		res = request options, _				
		list = JSON.parse(res.body)										
		@updated_projects_list = []
		@updated_projects_list.push { name: r.Id, published: r.Published} for r in list.d
		@updated_projects_list

	setLastUpdateToken: (config) ->
		console.log "original last nuget update: #{config.last_nuget_date}"
		d = new Date(parseInt(@updated_projects_list[@updated_projects_list.length-1].published.substr(6)));
		config.last_nuget_date = moment(d).format('YYYY-MM-DDTHH:mm:ss.SSS');
		console.log "set last nuget update: #{config.last_nuget_date}"

	getProject: (name, _) ->
		url = "https://nuget.org/api/v2/Packages?&$filter=" +
			  "IsLatestVersion%20eq%20true and Id%20eq%20'#{name}'"
		console.log "get project #{name} #{url}"
		options = { url: url				  				 
				  , headers: {"accept": "application/json"}}
		res = request options, _		
		data = JSON.parse res.body
		item = data.d.results[0]		
		item.name = item.Id
		item.displayName = item.displayName
		item.verion = item.Verion
		item.description = item.Description
		item.home_page = item.ProjectUrl
		item.repository = {url: item.ProjectUrl}
		item.dependencies = @buildDependsList item.Dependencies		
		item

	buildDependsList: (dependsStr) ->
		res = {}
		return res if dependsStr.trim()==""
		for s in dependsStr.split "|"
			pair = s.split(":")
			res[pair[0]] = pair[1]
		res

	getPlatformName: () ->
		"nuget"

	shouldIgnoreProject: (name) ->
		false


	updateProjectCodeReferences: (using_proj, db, _) ->	
		return

exports.NugetStrategy = NugetStrategy
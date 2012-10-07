temp = require 'temp'
exec = require('child_process').exec
fs = require 'fs'
analyzer = require './analyzer'
utils = require './utils'
ex_utils = require './ex_utils'
request = require('request')


NPM_SEARCH_ALIAS = "isaacs.iriscouch.com"
ISAACS_REGISTRY_ALIAS = "isaacs.ic.ht"
REGISTRY_NPM_ALIAS = "registry.npmjs.org"

class NpmStrategy
	
	constructor: () ->
		@updated_projects_list = []

	registerLoader: (config) ->
		config.last_npm_seq = 174279 #formatio, updated mid july 12	

	getUpdatedProjectsList: (config, limit, _) ->			
		url = "http://#{NPM_SEARCH_ALIAS}/registry/_changes?since=#{config.data.last_npm_seq}&include_docs=false&limit=#{limit}"		
		res = request.get url, _		
		@updated_projects_list = JSON.parse(res.body).results
		r.name = r.id for r in @updated_projects_list
		@updated_projects_list

	setLastUpdateToken: (config) ->
		config.last_npm_seq = @updated_projects_list[@updated_projects_list.length-1].seq

	getProject: (name, _) ->
		url = "http://#{ISAACS_REGISTRY_ALIAS}/registry/#{name}"
		#console.log url
		res = request.get url, _		
		data = JSON.parse res.body
		return data if data.error	
		@getMaxVersion data.versions

	getPlatformName: () ->
		"npm"

	shouldIgnoreProject: (name) ->
		name=='hoarders' or name=='maga' or name=='npm-remapper'	

	#no better way to find "last" item in object literal
	#in theory we should not count on order in literal. but we have no choice with this api -
	#sorting the versions may fail if a version is illegal (I've seen versions with letters 1.2.1a?)
	getMaxVersion: (list) ->
		res = null	
		for i of list		
			res = list[i]
		return res

	updateProjectCodeReferences: (using_proj, db, _) ->	
		#console.log "start updateProjectCodeReferences"
		@deleteCodeSamples db, using_proj, _	
		file_name = "#{using_proj.data.name}-#{using_proj.data.version}.tgz"
		url = "http://#{REGISTRY_NPM_ALIAS}/#{using_proj.data.name}/-/#{file_name}"
		res = request.get {uri: url, encoding: null}, _
		console.log "before save temp file"
		[file, path] = @saveTemporaryFile res.body, file_name, _
		console.log "after save temp file"
		try
			@extractTar path, file, _
			files = utils.walk path, _						
			@analyzeCodeFiles using_proj, files, path, db, _			
		catch error
			ex_utils.logError "error: " + error
		finally
			try
				utils.removeRecursive path, _
			catch e
				ex_utils.logError e

	deleteCodeSamples: (db, proj, _) ->
		console.log "start delete code samples"
		qry = "START n = node(*)
				WHERE HAS(n.type) and n.type='coderef' and n.project_using_id=#{proj.id}
				DELETE n"		
		db.query qry, _	
		console.log "end delete code samples"

	extractTar: (path, file, _) ->
		cmd = "tar -xzvf #{file} -C #{path}"
		console.log "before " + cmd
		#exec cmd, {maxBuffer: 55000*1024}, _
		exec cmd, _
		console.log("after")

	saveTemporaryFile: (content, file_name, _) ->
		path = temp.mkdir 'gitme', _
		file = "#{path}/#{file_name}"
		fs.writeFile "#{file}", content, _
		console.log "saved temp file: #{file}, #{path}"
		[file, path]

	analyzeCodeFiles: (using_project, files, root, db, _) ->
		self = this
		files = files.filter (a) -> a.match(/\._?(js|coffee)$/)		
		iFile = 0
		totalUsage = 0
		iGlobalUsage = 0
		#low risk, not expected to add new projects		
		files.forEach_ _, 5, (_, file) ->						
			iFile++
			console.log "start analyze files #{iFile}/#{files.length}"
			if (file.indexOf("node_modules")==-1)
				data = fs.readFile file, _
				usage = analyzer.extractUsage data.toString()			
				totalUsage += usage.length
				iUsage = 0
				#low risk, not expected to add new projects. though if there is new project most surtely a duplicate is created
				usage.forEach_ _, 5, (_, u) ->							
					console.log "analyze usage #{iUsage}/#{usage.length}"
					if (u.module!=using_project.data.name) #don't add code ref to self usage
						used_proj = ex_utils.findNode db, u.module, self.getPlatformName(), _
						used_proj = ex_utils.addNewProject(db, u.module, self.getPlatformName(), _) if !used_proj
						coderef = db.createNode 
							type: 'code_ref'		
							code: u.code
							var_name: u.var_name
							relativeFileName: file.substring root.length+"/package".length
							project_used_id: used_proj.id
							project_using_id: using_project.id
							project_used_name: used_proj.data.name
							project_using_name: using_project.data.name
							project_used_repository: using_project.data.repository					
						console.log coderef.data.project_used_name + " - " + coderef.data.relativeFileName					
						coderef.save _
						iUsage++
						iGlobalUsage++
						console.log "end analyze usage #{iGlobalUsage}/#{totalUsage} for #{using_project.data.name}"

exports.NpmStrategy = NpmStrategy
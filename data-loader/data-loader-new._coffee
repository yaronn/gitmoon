request = require('request')#.defaults 'proxy':'http://web-proxy.israel.hp.com:8080/'
neo4j = require 'neo4j'
db = new neo4j.GraphDatabase 'http://ec2-54-245-26-197.us-west-2.compute.amazonaws.com:7474/'#http://localhost:7474'
fs = require 'fs'
analyzer = require './analyzer'
utils = require './utils'
temp = require 'temp'
exec = require('child_process').exec
config = db.getIndexedNode 'node_auto_index', 'type', 'config', _

MAX_ROWS_TO_FETCH = 2
GITHUB_ALIAS = "api.github.com"
NPM_SEARCH_ALIAS = "isaacs.iriscouch.com"
ISAACS_REGISTRY_ALIAS = "isaacs.ic.ht"
REGISTRY_NPM_ALIAS = "registry.npmjs.org"

addProject = (name, _) ->
	console.log("add project #{name}")
	proj = db.createNode
		name: name
		name_lower: name.toLowerCase()
		description: ""
		type: 'project'		
		forks: 0
		repository: ""
		github_last_update: 0
		stale: true

	proj.save _	
	return proj

reviewAllProjects = (_) ->	
	console.log config.data
	url = "http://#{NPM_SEARCH_ALIAS}/registry/_changes?since=#{config.data.last_npm_deq}&include_docs=false&limit=2000"
	res = request.get url, _
	list = JSON.parse(res.body).results	
	
	console.log("total changes: #{list.length}")
	i = 0

	#safe in paralel. each row with different project.
	list.forEach_ _, 10, (_, r) ->	
		i++
		console.log("updating project #{i} - #{r.id}")
		proj = db.getIndexedNode 'node_auto_index', 'name', r.id, _				
		proj = addProject(r.id, _) if !proj
		proj.data.stale = true
		proj.save _

	if list.length>0
		config.data.last_npm_deq = list[list.length-1].seq		
		config.save _
		console.log config.data


updateStale = (limit, _) ->
	qry = 	"START n=node(*) 
		 	 WHERE HAS(n.type) and n.type='project' and n.stale=true
		 	 RETURN n.name as name LIMIT #{limit}" #and n.name =~ /^[s-z].*/
	res = db.query qry, _
	
	i = 0
	#probably safe in paralel. risks are that when adding link we add a new duplicate project,
	#but adding new projects here will be rare. also risk on deletions.
	res.forEach_ _, 5, (_, r) ->
		i++
		console.log "update project #{i} - #{r.name}"
		try
			updateProject r.name, _
		catch e
			console.log "error: #{e}" 

updateProject = (name, _) ->
	console.log "update project #{name}"
	return if name=='hoarders'	
	return if name=='maga'	
	return if name=='npm-remapper'	

	#res = request.get "http://localhost:8090/", _		
	url = "http://#{ISAACS_REGISTRY_ALIAS}/registry/#{name}"
	console.log url
	res = request.get url, _		
	data = JSON.parse res.body	

	proj = db.getIndexedNode 'node_auto_index', 'name', name, _	
	#sometimes the project is deleted and we get json with error
	if  data.error!="not_found"		
		last =  getMaxVersion data.versions			
		proj.data.version = last.version	
		proj.data.description = data.description ? ""		
		if data.repository and data.repository.url and data.repository.url.indexOf('github')!=-1
			proj.data.repository = data.repository.url
		proj.save _		
		addNewDependencies proj, last.dependencies, _	
		deleteOldStoredDependencies proj, last.dependencies
		try
			updateProjectCodeReferences proj, _	
		catch e
			console.log e

	proj.data.stale = false
	proj.save _

#no better way to find "last" item in object literal
#in theory we should not count on order in literal. but we have no choice with this api -
#sorting the versions may fail if a version is illegal (I've seen versions with letters 1.2.1a?)
getMaxVersion = (list) ->
	res = null	
	for i of list		
		res = list[i]
	return res

deleteOldStoredDependencies = (proj, updated_dependencies, _) ->	
	console.log "deleteOldStoredDependencies"
	stored_dependencies = proj.outgoing "depends_on", _

	#deletions are better bnot in paralel
	stored_dependencies.forEach_ _, 1, (_, l) ->		
		dep_name = db.getNode l.end.self, _				
		if !updated_dependencies[dep_name.data.name]			
			console.log "delete link between #{proj.data.name} and #{dep_name.data.name}"
			l.del _

addNewDependencies = (proj, dependencies, _) ->			
	console.log "addNewDependencies"
	for d of dependencies		
		dep = db.getIndexedNode 'node_auto_index', 'name', d, _						
		dep = addProject(d, _) if !dep
		path = proj.path dep, 'depends_on', 'out', 1, null, _										
		if path
			console.log "path found between #{proj.data.name} and #{dep.data.name}"
			continue		
		console.log "adding path between #{proj.data.name} and #{dep.data.name}"
		proj.createRelationshipTo dep, 'depends_on', {}, _


cleanDb = (_) ->
	qry = "START n = node(*)
	       MATCH n-[r]-()
	       DELETE n, r"
	db.query qry, _

	qry = "START n = node(*)
	       DELETE n"
	db.query qry, _

applyOnNodes = (_, type, func) ->
	qry = 	"START n=node(*) "
	qry += "WHERE HAS(n.type) and n.type='#{type}' " if type
	qry += "RETURN n"
	res = db.query qry, _
	i = 0
	res.forEach_ _, 5, (_, r) ->
		console.log i++
		n = db.getNodeById r.n.id, _	
		func n, _		

applyOnAllNodes = (_, func) ->
	applyOnNodes _, null, func

makeAllStale = (_) ->
	qry = 	"START n=node(*) WHERE n.type='project' SET n.stale=true"
	res = db.query qry, _
	console.log res
	###
	applyOnNodes _, "project", (n, _) ->
		console.log "set #{n.data.name} stale"
		n.data.stale = true
		n.save _
	###

updateGithub = (limit, _) ->
	qry = 	"START n=node(*) 
		 	 WHERE HAS(n.type) and n.type='project' and has(n.repository) and n.repository<>''
		 	 RETURN n.name as name 		 	 		 	 
		 	 ORDER BY n.github_last_update
		 	 LIMIT #{limit}" # and n.github_last_update=0
	
	res = db.query qry, _	

	#some risk to add users multiple times
	res.forEach_ _, 2, (_, r) ->				
		proj = db.getIndexedNode 'node_auto_index', 'name', r.name, _				
		try			
			updateGithubProject proj, _			
		catch e
			console.log e

updateGithubProject = (proj, _) ->
	console.log "update #{proj.data.name} from github. repository: #{proj.data.repository}"
	proj.data.github_last_update = Date.now()

	try
		data = getProjectData proj.data.repository, _
		proj.data.description = data.description ? ""
		proj.data.forks = data.forks
		pages = Math.floor(data.watchers / 100) + 1
		console.log "pages: #{pages}"
		#pages = 1
		watchers_ids = []
		for i in [1..pages]
			try
				res = updateWatchers proj, i, _
				watchers_ids = watchers_ids.concat(res)
			catch e
				console.log e
		
		deleteOldStoredWatchers(proj, watchers_ids, _)
	catch e
		console.log e

	proj.save _

getProjectData = (url, _) ->
	rep = repository url
	api = "https://#{GITHUB_ALIAS}/repos/#{rep.user}/#{rep.name}"
	console.log api
	res = request.get api, _
	throw "error in url #{api}" if res.statusCode!=200	
	list = JSON.parse res.body

updateWatchers = (proj, page, _) ->
	rep = repository proj.data.repository
	api = "https://#{GITHUB_ALIAS}/repos/#{rep.user}/#{rep.name}/watchers?per_page=100&page=#{page}"
	console.log api
	res = request.get api, _
	throw "error in url #{api}" if res.statusCode!=200	
	list = JSON.parse res.body
	
	#no risk since watchers are uniqe for project
	list.forEach_ _, 8, (_, u) ->									
		user = db.getIndexedNode 'node_auto_index', 'id', u.id, _								
		user = addUser(u.id, u.login, _) if !user
		ensureUserWatchsProject(user, proj, _)

	watchers_ids = (r.id for r in list)
	return watchers_ids	

ensureUserWatchsProject = (user, proj, _) ->
	path = user.path proj, 'watches', 'out', 1, null, _								
	if path
		console.log "#{user.data.login} already watches #{proj.data.name}"
		return
	console.log "adding #{user.data.login} as watcher to #{proj.data.name}"
	user.createRelationshipTo proj, 'watches', {}, _	

deleteOldStoredWatchers = (proj, updated_watchers_ids, _) ->
	stored_watches = proj.incoming "watches", _		

	#delete is better not in paralel
	stored_watches.forEach_ _, 1, (_, l) ->
		user = db.getNode l.start.self, _		
		if updated_watchers_ids.indexOf(user.data.id)==-1
			console.log "delete watches link between #{user.data.login} and #{proj.data.name}"
			try
				l.del _, true
			catch e
				console.log "an error while deleting #{user.data.login} from watching
							 project #{proj.data.name}. error: #{e}"


addUser = (id, login, _) ->
	console.log("add user #{login}")
	#preferebly we identify user by id and not login however getting user details is only by login
	user = db.createNode 
		id: id
		login: login
		login_lower: login.toLowerCase()
		type: "user"
	updateUser user, _
	return user
	
updateUser = (user, _) ->	
	api = "https://#{GITHUB_ALIAS}/users/#{user.data.login}"
	console.log api
	res = request.get api, _
	#some users, like http://github:8081/users/aaronblohowiak, have special chars in their bio
	#and json does not parse them. that guy has #28 right before the work "Fooniverse"
	res.body = res.body.replace(/[^\u000A\u0020-\u007E]/g, ' ');
	res.body = res.body.replace(/"/g, '\"');
	data = JSON.parse res.body	
	user.data.id = data.id
	user.data.blog = data.blog ? ""
	user.data.gravatar_id = data.gravatar_id ? ""
	user.data.company = if data.company then data.company.trim() else ""
	user.data.email = data.email ? ""
	user.data.followers = data.followers ? 0
	user.data.following = data.following ? 0
	user.data.bio = data.bio ? ""
	user.data.public_repos = data.public_repos ? 0
	user.data.full_name = data.name ? ""
	user.data.location = data.location ? ""
	user.data.avatar_url = data.avatar_url ? ""
	user.data.login = data.login
	user.last_update = Date.now()	
	user.save _

#https://github.com/bu/Accessor_Singleton/
#git://github.com/dominictarr/remote-events.git
repository = (url) ->
	#url.substring(0, 4) == "http"
	url_working = url
	url_working = url_working.substring(0, url.length-1) if url[url.length-1]=='/'
	console.log url_working
	name_start = url_working.lastIndexOf('/')+1
	name_end = url_working.lastIndexOf('.')
	name_end = url_working.length if (name_end<=name_start)
	name = url_working.substring(name_start, name_end)

	sub = url_working.substring(0, name_start-1)
	user_start = sub.lastIndexOf('/')
	user_start = sub.lastIndexOf(':') if (user_start==-1)
	throw "could not parse user for url_working #{url_working}" if user_start==-1
	user_start++
	
	user_end = name_start-1
	user = url_working.substring(user_start, user_end)
	name: name, user: user

updateProjectCodeReferences = (using_proj, _) ->	
	#console.log "start updateProjectCodeReferences"
	deleteCodeSamples using_proj, _	
	file_name = "#{using_proj.data.name}-#{using_proj.data.version}.tgz"
	url = "http://#{REGISTRY_NPM_ALIAS}/#{using_proj.data.name}/-/#{file_name}"
	console.log url
	res = request.get {uri: url, encoding: null}, _
	#console.log "before save temp file"
	[file, path] = saveTemporaryFile res.body, file_name, _
	#console.log "after save temp file"
	try
		extractTar path, file, _
		files = utils.walk 																																									path, _		
		console.log "after walk files"
		#console.log files
		#console.log "before analyze"
		analyzeCodeFiles using_proj, files, path, _
		#console.log "after analyze"
	catch error
		console.log "error: " + error
	finally
		try
			utils.removeRecursive path, _
		catch e
			console.log e

deleteCodeSamples = (proj, _) ->
	console.log "start delete code samples"
	qry = "START n = node(*)
		   WHERE HAS(n.type) and n.type='coderef' and n.project_using_id=#{proj.id}
	       DELETE n"
	db.query qry, _	
	console.log "end delete code samples"

extractTar = (path, file, _) ->		
		cmd = "tar -xzvf #{file} -C #{path}"
		console.log "before " + cmd
		#exec cmd, {maxBuffer: 55000*1024}, _
		exec cmd, _
		console.log("after")
	
saveTemporaryFile = (content, file_name, _) ->
	path = temp.mkdir 'gitme', _
	file = "#{path}/#{file_name}"
	fs.writeFile "#{file}", content, _
	console.log "saved temp file: #{file}, #{path}"
	[file, path]

analyzeCodeFiles = (using_project, files, root, _) ->		
	files = files.filter (a) -> a.match(/\._?(js|coffee)$/)		
	
	iFile = 0
	totalUsage = 0
	iGlobalUsage = 0
	#low risk, not expected to add new projects
	files.forEach_ _, 5, (_, file) ->						
		iFile++
		#console.log "start analyze files #{iFile}/#{files.length}"
		if (file.indexOf("node_modules")==-1)
			data = fs.readFile file, _
			usage = analyzer.extractUsage data.toString()			
			totalUsage += usage.length
			iUsage = 0
			#low risk, not expected to add new projects. though if there is new project most surtely a duplicate is created
			usage.forEach_ _, 5, (_, u) ->							
				#console.log "analyze usage #{iUsage}/#{usage.length}"
				
				if (u.module!=using_project.data.name) #don't add code ref to self usage
					used_proj = db.getIndexedNode 'node_auto_index', 'name', u.module, _
					used_proj = addProject(u.module, _) if !used_proj					
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
					#console.log coderef.data.project_used_name + " - " + coderef.data.relativeFileName					
					coderef.save _
				iUsage++
				iGlobalUsage++
				console.log "end analyze usage #{iGlobalUsage}/#{totalUsage} for #{using_project.data.name}"

setProjectRating = (_) ->	
	qry = "START u=node(*) WHERE u.type='user' WITH count(distinct u) as total_watchers
	   START n=node(*) MATCH (n)<-[:watches]-(y) WITH count(*) as prj_watchers_count, n as n, 
	   		total_watchers as total_watchers
	   SET n.rating = prj_watchers_count/total_watchers*100"
	   
	db.query qry, _

parseLocations = (_) ->	
	qry = "START u=node(*) WHERE u.type='user' AND HAS(u.location) and u.location<>''
		   and (not has(u.city)) and (not has(u.country)) and (not has(u.state))
		   return u limit 10000"
	   
	i = 0
	users = db.query qry, _	
	users.forEach_ _, 5, (_, r) ->
		try
			info = request.get "http://where.yahooapis.com/geocode?location=#{r.u.data.location}&flags=J", _
				
			try
				json = JSON.parse(info.body)
			catch e
				console.log info.body
				throw e

			if json.ResultSet.Found==0
				console.log "no info found for #{r.u.data.location}"
				r.u.data.location_parse = "fail"
			else
				#console.log r.u.data.location	
				#console.log "-->"
				#console.log "city:" + json.ResultSet.Results[0].city
				#console.log "state:" + json.ResultSet.Results[0].state
				#console.log "country:" + json.ResultSet.Results[0].country
				r.u.data.city = json.ResultSet.Results[0].city
				r.u.data.state = json.ResultSet.Results[0].state
				r.u.data.country = json.ResultSet.Results[0].country
			r.u.save _
			i = i+1
			console.log i
			console.log r.u.data.country
		catch e
			console.log e
			console.log r.u.data.location

canonizeLocations = (_) ->
	qry = 	"START  n=node(*) WHERE HAS(n.country) 
			 AND n.country='The Netherlands'
			 SET n.country='Netherlands'"
	res = db.query qry, _

	qry = 	"START  n=node(*) WHERE HAS(n.country) 
			 AND n.country='Republic of Latvia'
			 SET n.country='Latvia'"
	res = db.query qry, _	

	qry = 	"START  n=node(*) WHERE HAS(n.country) 
			 AND n.country='Republic of Lithuania'
			 SET n.country='Lithuania'"
	res = db.query qry, _	

canonizeCompanies = (_) ->
	qry = 	"START  n=node(*) WHERE HAS(n.company) 
			 AND (n.company='Yahoo! Inc.' OR n.company='Yahoo')
			 SET n.company='Yahoo!'"

	res = db.query qry, _	

	qry = 	"START  n=node(*) WHERE HAS(n.company) 
			 AND n.company='Mozilla Corporation'
			 SET n.company='Mozilla'"
			 
	res = db.query qry, _	

	qry = 	"START  n=node(*) WHERE HAS(n.company) 
			 AND n.company='Twitter, Inc.'
			 SET n.company='Twitter'"
			 
	res = db.query qry, _	

	qry = 	"START  n=node(*) WHERE HAS(n.company) 
			 AND n.company='Nodejitsu, Inc.'
			 SET n.company='Nodejitsu'"
			 
	res = db.query qry, _

	qry = 	"START  n=node(*) WHERE HAS(n.company) 
			 AND n.company='GitHub, Inc.'
			 SET n.company='GitHub'"
			 
	res = db.query qry, _


init_config = (_) ->
	config = db.getIndexedNode 'node_auto_index', 'type', 'config', _				
	config = db.createNode() if !config	
	config.data.type = 'config'
	config.data.last_npm_deq = 174279 #formatio, updated mid july 12	
	config.save _


#init_config()

#cleanDb _
#reviewAllProjects _	
#updateStale 2000, _

#makeAllStale _ #optional

#updateGithub 200, _

#setProjectRating _

#parseLocations _

#canonizeLocations _

canonizeCompanies _

###
#delete everything without type property

applyOnNodes _, null, (r, _) ->
	if !r.data.type
		r.del _, true
		console.log "del"
###

###
neo4j = require 'neo4j'
qry = 	"START  n=node(*) WHERE HAS(n.company) 
		 AND n.company =~ /( .*)|(.* )/
		 RETURN n"
res = db.query qry, _
i = 0
res.forEach_ _, 10, (_, r) ->	
	console.log i++
	r.n.data.company = r.n.data.company.trim()
	r.n.save _	
###

###
# add field to node
applyOnNodes _, "code_ref", (r, _) ->
	tmp = r.data.project_used_id
	console.log tmp
###

#C:\Users\naveh\Documents\features\projects\oss>_coffee data-loader/stub/runner._coffee 8081 hybrid


#11265 wcf.js

###
qry = "START n=node:node_auto_index(type='code_ref') SET n.project_used_name=n.project_used_name"
res = db.query qry, _
console.log res
###



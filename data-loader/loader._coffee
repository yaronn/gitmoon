request = require('request')#.defaults 'proxy':'http://web-proxy.israel.hp.com:8080/'
neo4j = require 'neo4j'
utils = require './ex_utils'

MAX_ROWS_TO_FETCH = 2
GITHUB_ALIAS = "api.github.com"

class DataLoader

	constructor: (@loader, db, _) ->		
		@db = db
		@platform = @loader.getPlatformName()		
		res = @db.query "START n=node:node_auto_index(type='config') RETURN n", _
		
		if (res.length==0)
			@config = @db.createNode()
			@config.data.type = 'config'
			@config.save _
		else
			@config = res[0].n

	findNode: (name, _) =>				
		res = utils.findNode @db, name, @loader.getPlatformName(), _		
		res

	registerLoader: (_) ->		
		@loader.registerLoader @config.data		
		@config.save _

	updatePackageManager: (limit, _) =>						
		@markStale limit, _		
		#@updateStaleProjects limit, _

	markStale: (limit, _) =>			
		self = this				
		updated = @loader.getUpdatedProjectsList @config, limit, _		
		#safe in paralel. each row with different project.		
		updated.forEach_ _, 10, (_, r) ->							
			proj = self.findNode r.name, _			
			if !proj				
				proj = self.addNewProject(r.name, _)
			else				
				proj.data.stale = true
				proj.save _
				
		if updated.length>0
			@loader.setLastUpdateToken(@config.data)			
			@config.save _


	updateStaleProjects: (limit, _) ->		
		self = this
		
		qry = "START n=node:node_auto_index(type='project') 
				WHERE HAS(n.type) and n.type='project' and n.stale=true
				RETURN n.name as name LIMIT #{limit}" #and n.name =~ /^[s-z].*/		
		res = @db.query qry, _
				
		#probably safe in paralel. risks are that when adding link we add a new duplicate project,
		#but adding new projects here will be rare. also risk on deletions.
		res.forEach_ _, 2, (_, r) ->			
			try				
				self.updateProject r.name, _
			catch e
				utils.logError "error while updating project #{r.name}: #{e}" 		

	updateProject: (name, _) ->		
		return if @loader.shouldIgnoreProject name		
		proj = @findNode name, _
		data = @loader.getProject name, _		
		#sometimes the project is deleted and we get json with error
		if  data.error!="not_found"			
			proj.data.version = data.version	
			proj.data.description = data.description ? ""					
			if data.repository and data.repository.url and data.repository.url.indexOf('github')!=-1
				proj.data.repository = data.repository.url
			else
				proj.data.repository = ""
			proj.data.home_page = data.home_page ? ""
			proj.save _
			@addNewDependencies proj, data.dependencies, _	
			@deleteOldStoredDependencies proj, data.dependencies
			try
				@loader.updateProjectCodeReferences proj, @db, _	
			catch e
				utils.logError e
			proj.data.stale = false
			proj.save _
		else
			utils.logError "could not update #{name}: #{data.error}"

	deleteOldStoredDependencies: (proj, updated_dependencies, _) ->		
		stored_dependencies = proj.outgoing "depends_on", _

		#deletions are better not in paralel
		stored_dependencies.forEach_ _, 1, (_, l) ->		
		dep_name = @db.getNode l.end.self, _				
		if !updated_dependencies[dep_name.data.name]			
			console.log "delete link between #{proj.data.name} and #{dep_name.data.name}"
			l.del _

	addNewDependencies: (proj, dependencies, _) ->				
		for d of dependencies		
			dep = @findNode d, _
			dep = @addNewProject(d, _) if !dep
			path = proj.path dep, 'depends_on', 'out', 1, null, _										
			if path
				console.log "path found between #{proj.data.name} and #{dep.data.name}"
				continue		
				console.log "adding path between #{proj.data.name} and #{dep.data.name}"
				proj.createRelationshipTo dep, 'depends_on', {}, _

	postProcessData: (_) ->		
		@setProjectRating _
		@parseLocations _

		console.log "start canonicalization"
		@canonizeLocations _
		@canonizeCompaniesCaps _
		@canonizeCompanies _
		console.log "end canonicalization"

	addNewProject: (name, _) ->		
		console.log "add project #{name}"
		utils.addNewProject @db, name, @platform, _

	updateGithub: (limit, _) ->		
		self = this
		qry = "START n=node(*) 
			WHERE HAS(n.type) and n.type='project' and has(n.repository) and n.repository<>''
			RETURN n.name as name 		 	 		 	 
			ORDER BY n.github_last_update
	 	 	LIMIT #{limit}" # and n.github_last_update=0

		res = @db.query qry, _	

		#some risk to add users multiple times
		res.forEach_ _, 1, (_, r) ->				
			proj = self.findNode r.name, _
			try			
				self.updateGithubProject proj, _			
			catch e
				utils.logError e

	updateGithubProject: (proj, _) ->
		self = this
		console.log "update #{proj.data.name} from github. repository: #{proj.data.repository}"
		proj.data.github_last_update = Date.now()

		try
			data = @getProjectData proj.data.repository, _
			proj.data.description = data.description ? ""
			proj.data.forks = data.forks
			pages = Math.floor(data.watchers / 100) + 1
			console.log "pages: #{pages}"
			#pages = 1
			watchers_ids = []
			for i in [1..pages]
				try
					res = self.updateWatchers proj, i, _
					watchers_ids = watchers_ids.concat res
				catch e
					utils.logError e

				self.deleteOldStoredWatchers proj, watchers_ids, _
		catch e
			utils.logError e

		proj.save _

	getProjectData: (url, _) ->
		rep = @repository url
		api = "https://#{GITHUB_ALIAS}/repos/#{rep.user}/#{rep.name}"
		res = request.get api, _
		throw "error in url #{api}" if res.statusCode!=200	
		list = JSON.parse res.body

	updateWatchers: (proj, page, _) ->
		self = this
		rep = @repository proj.data.repository
		api = "https://#{GITHUB_ALIAS}/repos/#{rep.user}/#{rep.name}/watchers?per_page=100&page=#{page}"
		res = request.get api, _
		throw "error in url #{api}" if res.statusCode!=200	
		list = JSON.parse res.body

		#no risk since watchers are uniqe for project
		list.forEach_ _, 10, (_, u) ->									
			user = self.db.getIndexedNode 'node_auto_index', 'id', u.id, _								
			user = self.addUser(u.id, u.login, _) if !user
			self.ensureUserWatchsProject(user, proj, _)

		watchers_ids = (r.id for r in list)
		watchers_ids	

	ensureUserWatchsProject: (user, proj, _) ->
		path = user.path proj, 'watches', 'out', 1, null, _								
		if path
			console.log "#{user.data.login} already watches #{proj.data.name}"
			return
		console.log "adding #{user.data.login} as watcher to #{proj.data.name}"
		user.createRelationshipTo proj, 'watches', {}, _	

	deleteOldStoredWatchers: (proj, updated_watchers_ids, _) ->
		self = this
		stored_watches = proj.incoming "watches", _		

		#delete is better not in paralel
		stored_watches.forEach_ _, 1, (_, l) ->
			user = self.db.getNode l.start.self, _		
			if updated_watchers_ids.indexOf(user.data.id)==-1
				console.log "delete watches link between #{user.data.login} and #{proj.data.name}"
				try
					l.del _, true
				catch e
					utils.logError "an error while deleting #{user.data.login} from watching project #{proj.data.name}. error: #{e}"


	addUser: (id, login, _) ->
		console.log("add user #{login}")
		#preferebly we identify user by id and not login however getting user details is only by login
		user = @db.createNode 
			id: id
			login: login
			login_lower: login.toLowerCase()
			type: "user"
		@updateUser user, _
		return user
	
	updateUser: (user, _) ->	
		api = "https://#{GITHUB_ALIAS}/users/#{user.data.login}"
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
	repository: (url) ->
		#url.substring(0, 4) == "http"
		url_working = url
		url_working = url_working.substring(0, url.length-1) if url[url.length-1]=='/'
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

	setProjectRating: (_) ->	
		console.log "start rating"
		qry = "START u=node:node_auto_index(type='user') WITH count(distinct u) as total_watchers
				START n=node(*) MATCH (n)<-[:watches]-(y) WITH count(*) as prj_watchers_count, n as n, 
				total_watchers as total_watchers
				SET n.rating = prj_watchers_count/total_watchers*100"

		@db.query qry, _
		console.log "end rating"

	parseLocations: (_) ->	
		console.log "start parse locations"
		qry = "START u=node:node_auto_index(type='user') WHERE HAS(u.location) and u.location<>''
				and (not has(u.city)) and (not has(u.country)) and (not has(u.state))
				return u limit 10000"

		i = 0
		users = @db.query qry, _	

		#only risk is yahoo blocking usage
		users.forEach_ _, 5, (_, r) ->
			try
				info = request.get "http://where.yahooapis.com/geocode?location=#{r.u.data.location}&flags=J", _

				try
					json = JSON.parse(info.body)
				catch e
					utils.logError info.body
					throw e

				if json.ResultSet.Found==0
					console.log "no info found for #{r.u.data.location}"
					r.u.data.location_parse = "fail"
				else					
					r.u.data.city = json.ResultSet.Results[0].city
					r.u.data.state = json.ResultSet.Results[0].state
					r.u.data.country = json.ResultSet.Results[0].country
					r.u.save _
					i = i+1
					#console.log i
					console.log "#{r.u.data.country} - #{r.u.data.city}"
			catch e
				utils.logError "#{e} + #{r.u.data.location}"

	canonizeLocations: (_) ->
		qry = 	"START  n=node(*) WHERE HAS(n.country) 
		AND n.country='The Netherlands'
		SET n.country='Netherlands'"
		res = @db.query qry, _

		qry = 	"START  n=node(*) WHERE HAS(n.country) 
		AND n.country='Republic of Latvia'
		SET n.country='Latvia'"
		res = @db.query qry, _	

		qry = 	"START  n=node(*) WHERE HAS(n.country) 
		AND n.country='Republic of Lithuania'
		SET n.country='Lithuania'"
		res = @db.query qry, _	

	canonizeCompanies: (_) ->
		qry = 	"START  n=node(*) WHERE HAS(n.company) 
		AND (n.company='Yahoo! Inc.' OR n.company='Yahoo' OR n.company='yahoo')
		SET n.company='Yahoo!'"

		res = @db.query qry, _	

		qry = 	"START  n=node(*) WHERE HAS(n.company) 
		AND n.company='Mozilla Corporation'
		SET n.company='Mozilla'"

		res = @db.query qry, _	

		qry = 	"START  n=node(*) WHERE HAS(n.company) 
		AND n.company='Twitter, Inc.'
		SET n.company='Twitter'"

		res = @db.query qry, _	

		qry = 	"START  n=node(*) WHERE HAS(n.company) 
		AND n.company='Nodejitsu, Inc.'
		SET n.company='Nodejitsu'"

		res = @db.query qry, _

		qry = 	"START  n=node(*) WHERE HAS(n.company) 
		AND n.company='GitHub, Inc.'
		SET n.company='GitHub'"

		res = @db.query qry, _

		qry = 	"START  n=node(*) WHERE HAS(n.company) 
		AND n.company='Github'
		SET n.company='GitHub'"

		res = @db.query qry, _	

	canonizeCompaniesCaps: (_) ->	
		qry = 	"START  n=node(*) WHERE HAS(n.company) 
		AND n.company =~ /(?i)nodejitsu/
		SET n.company='Nodejitsu'"

		res = @db.query qry, _	

		qry = 	"START  n=node(*) WHERE HAS(n.company) 
		AND n.company='hp'
		SET n.company='HP'"

		res = @db.query qry, _	


exports.DataLoader = DataLoader

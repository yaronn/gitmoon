fs = require('fs')

exports.findNode = (db, name, platform, _) ->	
	qry = "START n=node:node_auto_index(name={name})
		   WHERE HAS(n.platform) AND n.platform={platform}
		   RETURN n"
	params = {name: name, platform: platform}
	res = db.query qry, params, _		
	if res.length>0
		return res[0].n
	null	

exports.addNewProject = (db, name, platform, _) ->				
	proj = db.createNode
		name: name
		name_lower: name.toLowerCase()
		description: ""
		type: 'project'		
		platform: platform
		forks: 0
		repository: ""
		github_last_update: 0		
		stale: true

	proj.save _	
	proj

exports.logError = (err) ->
	red   = '\u001b[31m';
	blue  = '\u001b[34m';
	reset = '\u001b[0m';
	console.log red + err + reset	
	fs.appendFileSync "errors.log", err	


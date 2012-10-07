DataLoader = require('./loader').DataLoader
NpmStrategy = require('./npm').NpmStrategy
NugetStrategy = require('./nuget').NugetStrategy
NpmStrategy = require('./npm').NpmStrategy
db_url = "http://localhost:7474/"
neo4j = require 'neo4j'
db = new neo4j.GraphDatabase db_url
utils = require './ex_utils'

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

applyOnAllNodes: (_, func) ->
	applyOnNodes _, null, func

makeAllStale: (_) ->
		qry = 	"START n=node(*) WHERE n.type='project' SET n.stale=true"
		res = db.query qry, _


#we need to create at least one node so that node_auto_index is created and available for query
initDb = (_) ->
	db.query "CREATE n = {name : 'dummy' }", _

###
# add field to node
applyOnNodes _, "code_ref", (r, _) ->
	tmp = r.data.project_used_id
	console.log tmp
###

###
qry = "START n=node:node_auto_index(type='code_ref') SET n.project_used_name=n.project_used_name"
res = db.query qry, _
console.log res
###

#cleanDb _
#makeAllStale _

try
	#cleanDb _
	#initDb _	
	l = new NugetStrategy()	
	dl = new DataLoader l ,db, _
	#dl.registerLoader _		
	dl.updatePackageManager 5, _	
	dl.updateGithub 2, _
	dl.postProcessData _
catch e
	utils.logError e

neo4j = require('neo4j');
db = new neo4j.GraphDatabase('http://localhost:7474')

cleanDb = (_) ->
	qry = "START n = node(*)
	       MATCH n-[r]-()
	       DELETE n, r"
	db.query qry, _

	qry = "START n = node(*)
	       DELETE n"
	db.query qry, _

addDepends = (name1, name2, _) ->
	n1 = db.getIndexedNode 'node_auto_index', 'name', name1, _
	n2 = db.getIndexedNode 'node_auto_index', 'name', name2, _
	n1.createRelationshipTo n2, 'depends_on', {}, _

addWatch = (login, project, _) ->
	n1 = db.getIndexedNode 'node_auto_index', 'login', login, _
	n2 = db.getIndexedNode 'node_auto_index', 'name', project, _
	n1.createRelationshipTo n2, 'watches', {}, _

addNode = (_, data) ->
	node = db.createNode data
	node.save _
	node

addCodeSnippet = (_, project_using, project_used, relativeFileName, code) ->
	project_used_node = db.getIndexedNode 'node_auto_index', 'name', project_used, _
	project_using_node = db.getIndexedNode 'node_auto_index', 'name', project_using, _

	node = addNode _,
		type: 'code_ref'		
		code: code
		relativeFileName: relativeFileName
		project_used_id: project_used_node.id
		project_using_id: project_using_node.id
		project_used_name: project_used_node.data.name
		project_using_name: project_using_node.data.name
		project_used_repository: project_used_node.data.repository	

############
#start
############

cleanDb _

addNode _,
	name: "ws.js"
	name_lower: "ws.js"
	description: "a ws-* module for node.js. written in pure javascript!"
	type: 'project'
	version: '0.0.14'
	forks: 2
	repository: "git://github.com/yaronn/ws.js.git"
	github_last_update: 0,
	stale: false

addNode _,
	name: "wcf.js"
	name_lower: "wcf.js"
	description: "a wcf module for node.js. written in pure javascript!"
	type: 'project'
	version: '0.0.12'
	forks: 6
	repository: "git://github.com/yaronn/wcf.js.git"
	github_last_update: 0,
	stale: false

addNode _,
	name: "xml-crypto"
	name_lower: "xml-crypto"
	description: "an xml encryption module for node.js"
	type: 'project'
	version: '0.0.1'
	forks: 2
	repository: "git://github.com/yaronn/xml-crypto.git"
	github_last_update: 0,
	stale: false

addNode _,
	name: "xmldom"
	name_lower: "xmldom"
	description: "xml dom model for node.js"
	type: 'project'
	version: '0.1.2'
	forks: 25
	repository: "https://github.com/jindw/xmldom.git"
	github_last_update: 0,
	stale: false

addDepends 'ws.js', 'xmldom'
addDepends 'ws.js', 'xml-crypto'
addDepends 'xml-crypto', 'xmldom'
addDepends 'wcf.js', 'ws.js'

addNode _,
	id: 1
	login: "yaronn"		
	login_lower: "yaronn"		
	type: 'user'	
	blog: "http://webservices20.blogspot.com/"
	gravatar_id: "646403d51a0d50d498f0347270087623"
	company: "HP"
	email: "yaronn01@gmail.com"
	followers: 5
	following: 10
	bio: "a blogger and devloper. http://webservices20.blogspot.com"
	public_repos: 5
	name: "Yaron Naveh"
	location: "Israel"
	avatar_url: "https://secure.gravatar.com/avatar/646403d51a0d50d498f0347270087623?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-140.png"	
	last_update: Date.now()

addNode _,
	id: 2
	login: "jindw"	
	login_lower: "jindw"			
	type: 'user'	

addNode _,
	id: 3
	login: "mike"
	login_lower: "mike"		
	type: 'user'

addNode _,
	id: 4
	login: "john"
	login_lower: "john"		
	type: 'user'	

addWatch 'yaronn', 'ws.js', _
addWatch 'yaronn', 'wcf.js', _
addWatch 'yaronn', 'xml-crypto', _
addWatch 'jindw', 'xmldom', _
addWatch 'mike', 'wcf.js', _
addWatch 'john', 'wcf.js', _
addWatch 'john', 'xml-crypto', _

addCodeSnippet _, 
	'ws.js' 
	'xmldom'
	"/test/test.js"
	"xmldom  = app.resource('projects', require('./service/project'));\n
	random = app.resource('users/random', require('./service/random_user'));\n
	xmldom .add random\n
	app.use(express.static('./site'));\n",

addCodeSnippet _, 
	'xml-crypto' 
	'xmldom'
	"/lib/file.js"
	" if  (name) {\n
	    //ERROR: qry += ' AND n.name =~ /xmldom /'\n
	    qry += ' AND n.name =~ {name}'\n
	    params.name = '123'\n
	  }\n
\n
	  qry += '123'\n
	  qry +=    'RETURN n\n' +
	            'ORDER BY n.name_lower\n'
	  \n
	  var skip = req.query['$skip']\n
\n
	  if (skip) {\n"



##******************************

for i in [1..25]
	addNode _,
		name: "s#{i}"
		name_lower: "xmldom"
		description: "xml dom model for node.js"
		type: 'project'
		version: '0.1.2'
		forks: 25
		repository: "https://github.com/jindw/xmldom.git"
		github_last_update: 0,
		stale: false
	addDepends "s#{i}", "xmldom"

	addNode _,
		id: i
		login: "mike#{i}"
		login_lower: "mike"		
		type: 'user'
	
	addWatch "mike#{i}", 'xmldom', _

	addCodeSnippet _, 
		'ws.js' 
		'xmldom'
		"/test/test#{i}.js"
		"#{i}xmldom  = app.resource('projects', require('./service/project'));\n
		random = app.resource('users/random', require('./service/random_user'));\n
		xmldom .add random\n
		app.use(express.static('./site'));\n",

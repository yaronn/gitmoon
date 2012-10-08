fs = require 'fs'
path = require 'path'
utils = require '../data-loader/utils.js'
#config = require './config'
#neo4j = require 'neo4j'
#db = new neo4j.GraphDatabase {url: config.neo4j, proxy: config.proxy}

crunch = (files, dest, _) ->
	res = ""

	files.forEach_ _, 1, (_, f) ->			
		name = path.basename(f)
		#res += "\n\n/*====#{name}===*/\n\n"
		
		res += "\n\n"

		res += fs.readFileSync("./site/" + f)

	#console.log res
	fs.writeFileSync dest, res

crunch_html = (_) ->
	crunch_file = "./site/crunch.html"	
	if fs.existsSync(crunch_file)
		fs.unlink crunch_file, _			
	html_crunch = ""
	files = utils.walk "./site", _	
	files.forEach_ _, 1, (_, f) ->
		ext = path.extname f
		name = path.basename(f)	
		if ext==".html" and name!="index.html" and name!="test.html"					
			name_no_ext = name.substring(0, name.length - ext.length)
			#console.log "crunching #{name_no_ext}"			
			html_crunch += "\n\n<!-- ====#{name}==== -->\n\n"		
			html_crunch += "\n\n<script type='text/template' id='tpl_#{name_no_ext}'>\n"
			html_crunch += fs.readFileSync(f)
			html_crunch += "\n</script>"

	res = html_crunch;
	fs.writeFileSync crunch_file, res

crunch_project_cache = (platform, _) ->
	res = db.query "START n=node:node_auto_index(type='project')
					WHERE HAS(n.platform) AND n.platform='#{platform}'
					WITH n.name as name, n.name_lower as name_lower, count(*) as count
					RETURN name ORDER BY name_lower", _
	arr = []
	arr.push i.name for i in res
	fs.writeFileSync "./site/projects-"+platform+".json", JSON.stringify(arr)


scripts = [
	"lib/jquery-1.7.2.min.js",
	"lib/underscore-min.js",
	"lib/backbone-min.js",
	"lib/backbone.analytics.js",
	"lib/backbone.paginator.js",
	"lib/bootstrap-tab.js",
	"lib/bootstrap-tooltip.js",
	"lib/bootstrap-button.js",
	"lib/bootstrap-typeahead.js",
	"js/utils.js",
	"js/views/defaultView.js",
	"js/views/header.js",
	"js/views/home.js",
	"js/views/listView.js",
	"js/views/projectView.js",
	"js/views/projectMasterView.js",
	"js/views/projectListView.js",
	"js/views/projectListItemView.js",
	"js/views/projectUserListItemView.js",
	"js/views/projectUserListView.js",
	"js/views/depProjectListView.js",
	"js/views/depProjectListItemView.js",
	"js/views/sampleCodeListView.js",
	"js/views/sampleCodeListItemView.js",
	"js/views/similarProjectListView.js",
	"js/views/similarProjectListItemView.js",	
	"js/models/project.js",
	"js/models/user.js",
	"js/models/projectUser.js",
	"js/models/depProject.js",
	"js/models/pagedList.js",
	"js/models/codeSample.js",
	"js/models/similarProject.js",
	"js/views/sampleCodeMasterView.js",
	"js/views/projectUsersMasterView.js",
	"js/views/depProjectMasterView.js",
	"components/listview/item_model.js",
	"components/listview/item_view.js",
	"components/listview/list_model.js",
	"components/listview/list_view.js",
	"lib/venn.js",		
	"compare/base_view.js",
	"compare/compare_view.js",
	"compare/my_map_view.js",
	"compare/venn_view.js",
	"compare/depends_view.js",
	"compare/total_network_view.js",
	"compare/random_code_view.js",
	"compare/random_user_view.js",
	"compare/companies_view.js",
	"compare/projectMiniView.js",
	"components/map/map_model.js",
	"components/map/map_view.js",
	"lib/raphael-min.js"

	##"js/main.js" not cruncing main.js b/c in ie8 for some reason if we crunch it 
	##the app seems to work but once we enter the project page if we click on the home link it will stack
]

css = ["css/bootstrap.css", "css/styles.css"]

crunch scripts, "./site/crunch.js", _
crunch css, "./site/crunch.css", _
crunch_html _
#crunch_project_cache "nuget", _

fs = require 'fs'
path = require 'path'
utils = require '../data-loader/utils.js'

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
	html_crunch = ""
	script_crunch = ""
	files = utils.walk "./site/tpl", _
	
	files.forEach_ _, 1, (_, f) ->			
		name = path.basename(f)
		name_no_ext = name.substring(0, name.length-5)
		
		html_crunch += "\n\n<!-- ====#{name}==== -->\n\n"		
		html_crunch += "\n\n<script type='text/template' id='tpl_#{name_no_ext}'>\n"
		html_crunch += fs.readFileSync(f)
		html_crunch += "\n</script>"

		script_crunch += "\n\nwindow['#{name_no_ext}'].prototype.template = _.template($('#tpl_#{name_no_ext}').html())"

	res = html_crunch;
	res += "\n\n<script>\n#{script_crunch}\n
					startApp()
				</script>"
	res += "\n\n</body></html>"
	#console.log res

	index = fs.readFileSync "./site/index_partial.html"
	res = index + "\n\n" + res
	fs.writeFileSync "./site/index.html", res


scripts = [
	"lib/jquery-1.7.2.min.js",
	"lib/underscore-min.js",
	"lib/backbone-min.js",
	"lib/backbone.analytics.js",
	"lib/backbone.paginator.js",
	"lib/bootstrap-tab.js",
	"lib/bootstrap-tooltip.js",
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
	"js/models/codeSample.js"
	"js/models/similarProject.js"
	##"js/main.js" not cruncing main.js b/c in ie8 for some reason if we crunch it 
	##the app seems to work but once we enter the project page if we click on the home link it will stack
]

css = ["css/bootstrap.css", "css/styles.css"]

crunch scripts, "./site/crunch.js", _
crunch css, "./site/crunch.css", _
# crunch_html _

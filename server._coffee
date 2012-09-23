require('date-utils');
connect = require 'connect'
express = require 'express'
Resource = require 'express-resource'
app = express.createServer()
app.use(connect.compress());
fs = require 'fs'
require 'express-streamline'
config = require './common/config'

proj = app.resource 'projects', require('./service/project')
proj_users = app.resource 'users', require('./service/proj_users')
proj.add proj_users
deps = app.resource 'dep_projects', require('./service/dep_projects')
proj.add deps
similar_projects = app.resource 'similar_projects', require('./service/similar_projects')
proj.add similar_projects
sample_code = app.resource 'sample_code', require('./service/sample_code')
proj.add sample_code
sample_code_using_projects = app.resource 'sample_code_using_projects', require('./service/sample_code_using_projects')
proj.add sample_code_using_projects

app.get '/projects/:project/sample_code/count', (req, res, _) ->		
	require('./service/sample_code').getCodeSamplesCount req, res, _

app.get '/projects/:project/users/companies', (req, res, _) ->		
	require('./service/proj_users').projectUsersCompanies req, res, _

app.get '/projects/:project/users/countries', (req, res, _) ->		
	require('./service/proj_users').projectUsersCountries req, res, _

app.get '/projects/:project/users/us_states', (req, res, _) ->		
	require('./service/proj_users').projectUsersUSStates req, res, _

app.get '/projects/:project/users/dep_projects', (req, res, _) ->		
	require('./service/proj_users').projectUsersByDepProject req, res, _

app.get '/projects/:project/users/count', (req, res, _) ->		
	require('./service/proj_users').projectUserCount req, res, _



app.use express.static('./site', { maxAge: 60000*0.5 }) #half hour cache

app.error (err, req, res, next) ->
    console.log("error: " + err)
    date = new Date().toFormat("YYYY-MM-DD HH24:MI:SS")
    fs.appendFileSync("error.log", "#{date}: error in #{req.url}: #{err}\n")
    res.end("error")

port = config.port || 3000
app.listen port
console.log "listening on port #{port}"
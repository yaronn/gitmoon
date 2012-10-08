utils = require './utils'
inj = require './injection'
neo4j = require 'neo4j'
config = require '../common/config'
db = utils.db

exports.index = (req, res, _) ->
  code = req.query.$code ? ""
  using_project_name = req.query.using_project_name ? ""
  key = utils.getKeyPfx(req) + "sample_code_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}_#{code}_#{using_project_name}"
  utils.handleRequestCache res, req, key, getCodeSamples, _ 

getCodeSamples = (req, _) ->   
  result = ""  
  prj_name = inj.sanitizeString req.params.project
  qry = "START c=node:node_auto_index(project_used_name='#{prj_name}')\n"               	
  qry += "WHERE 1=1\n"

  params = {}
  code = req.query['$code']  

  if (code)
    code = inj.sanitizeString code
    code = utils.encodeStringCypher(code)    
    qry += "AND c.code =~ /(?s)(?i).*?#{code}.*?/\n"
    params.code = ".*?" + code + ".*?"  

  using_project_name = req.query['using_project_name']

  console.log "using_project_name: #{using_project_name}"
  if (using_project_name)
    using_project_name = inj.sanitizeString using_project_name
    using_project_name = utils.encodeStringCypher(using_project_name)    
    qry += "AND c.project_using_name = '#{using_project_name}'\n"
    params.using_project_name = using_project_name    

  qry +=    'RETURN distinct c as code_sample\n' +
   	   		'ORDER BY ID(c)\n'
  
  _skip = req.query['$skip']

  if (_skip)
    _skip = inj.ensureInt _skip
    qry += "SKIP #{_skip}\n"
    params._skip = parseInt(_skip)

  top = req.query['$top']  
  if (top)
    top = inj.ensureInt top
    qry += "LIMIT #{top}\n"
    params.top = parseInt(top)
    
  ##console.log(qry)
  ##console.log(params)

  start = utils.startTiming()  
  samples = db.query qry, params, _  
  utils.endTiming(start, "getCodeSamples main query")

  start = utils.startTiming()  
  all_samples = []    
  samples.forEach_ _, (_, c) ->         
    absolute = ""
    repo = c.code_sample.data.project_used_repository ? ""
    if repo!=""
      absolute = "#{c.code_sample.data.project_used_repository}/blob/master#{c.code_sample.data.relativeFileName}"    
      absolute = absolute.replace "git://", "http://"
      absolute = absolute.replace ".git", ""

    code_sample =
        relativeFileName: c.code_sample.data.relativeFileName
        absoluteLink: absolute
        usingProjectName: c.code_sample.data.project_using_name
        usedProjectName: c.code_sample.data.project_used_name        
        code: c.code_sample.data.code
        var_name: c.code_sample.data.var_name ? ""
    
    all_samples.push code_sample
  utils.endTiming(start, "getCodeSamples loop query")
  JSON.stringify(all_samples, null, 4)  

exports.getCodeSamplesCount = (req, res, _) ->  
  res.writeHead 200, {"Content-Type": "text/plain"}
  key = utils.getKeyPfx(req) + "sample_code_#{req.params.project}_count"
  utils.handleRequestCache res, req, key, getCodeSamplesCountInternal, _ 

getCodeSamplesCountInternal = (req, _) ->
  getCodeSamplesCountInternalByProject(req.params.project).toString()

getCodeSamplesCountInternalByProject = (project, _) ->
  prj_name = inj.sanitizeString project
  qry = "START c=node:node_auto_index(project_used_name='#{prj_name}') RETURN count(*) as count"
  start = utils.startTiming()  
  data = db.query qry, {}, _  
  utils.endTiming(start, "getCodeSamplesCountInternal")
  data[0].count

exports.getRandomCodeSamples = (req, res, _) ->  
  res.writeHead 200, {"Content-Type": "application/json"}
  random = utils.random 4
  key = utils.getKeyPfx(req) + "random_code_#{req.query.project1}_#{req.query.project2}_#{random}"
  utils.handleRequestCache res, req, key, getRandomCodeSamplesInternal, _ 


getRandomCodeSamplesInternal = (req, _) ->
  sample1 = getRandomCodeSampleForProject req.query.project1, _
  sample2 = getRandomCodeSampleForProject req.query.project2, _
  JSON.stringify {project1sample: sample1, project2sample: sample2}

getRandomCodeSampleForProject = (project, _) ->
  prj_name = inj.sanitizeString project
  count = getCodeSamplesCountInternalByProject project, _  
  if count>0
    i = utils.random count-1
    qry = "START c=node:node_auto_index(project_used_name='#{project}')
           RETURN c.var_name as var_name, c.project_using_name as project_using_name, c.code as code
           SKIP #{i} LIMIT 1"
    start = utils.startTiming()  
    data = db.query qry, {}, _  
    utils.endTiming(start, "getCodeSamplesCountInternalByProject")
    data[0]
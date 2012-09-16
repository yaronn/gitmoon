utils = require './utils'
inj = require './injection'
neo4j = require 'neo4j'
config = require '../common/config'
db = new neo4j.GraphDatabase config.neo4j

exports.index = (req, res, _) ->
  code = req.query.$code ? ""
  key = "sample_code_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}_#{code}"
  utils.handleRequestCache res, req, key, getCodeSamples, _ 
  
getCodeSamples = (req, _) -> 
  result = ""  
  prj_name = inj.sanitizeString req.params.project
  qry = "START c=node:node_auto_index(project_used_name='#{prj_name}')\n"               	

  params = {}
  code = req.query['$code']

  if (code)
    code = inj.sanitizeString code
    code = utils.encodeStringCypher(code)    
    qry += "WHERE c.code =~ /(?s)(?i).*?#{code}.*?/\n"
    params.code = ".*?" + code + ".*?"  
  
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
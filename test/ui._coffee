assert = require 'assert'
webdriver = require 'wd'

run_on_prod = process.env.production


if run_on_prod
  b = webdriver.remote "ondemand.saucelabs.com" 
    ,80 
    ,"yaronn01"
    , "daa47681-6117-4d8b-a6b7-fe52adc65a58"
else
  b = webdriver.remote()

host = if run_on_prod then "www.gitmoon.com:3001" else "localhost:3000"

###
describe 'Project', () ->
  beforeEach (_) ->
    b.init _

  afterEach (_) ->
     b.quit _

  describe 'Users', () ->
    it 'should find a user on search', (_) ->      
      b.get "http://#{host}/#project/Accessor", _      
      b.setImplicitWaitTimeout 20000, _      
      users = b.elementByPartialLinkText "Users", _      
      b.clickElement users, _
      search = b.elementsById "search", _
      b.type search[1], "JC", _
      name = b.elementByLinkText "JC (jevgen)", _
      throw new Error("name was null") if name==null      

  describe 'Users', () ->
    it 'should find a user on search', (_) ->      
      b.get "http://#{host}/#project/ws.js", _      
      b.setImplicitWaitTimeout 20000, _
      users = b.elementByPartialLinkText "Users", _
      b.clickElement users, _
      search = b.elementsById "search", _
      b.type search[1], "yaron", _
      try
        name = b.elementByLinkText "Yaron Naveh (yaronn)", _
      catch e
        throw "could not find name"      
###

describe 'Compare', () ->
  beforeEach (_) ->
    b.init _

  afterEach (_) ->
     b.quit _

  describe 'Two projects', () ->
    it 'should compare two projects', (_) ->      
      b.get "http://#{host}/#compare/redis/mongodb", _            
      b.setImplicitWaitTimeout 20000, _            
      project2_desc = b.elementsByCssSelector "#project2_div div div", _            
      desc = project2_desc[1].text _      
      throw new Error("desc does not contain mongodb") if desc.indexOf("Mongo DB")==-1

assert = require 'assert'
webdriver = require 'wd'

run_on_prod = process.env.run_on_prod


if run_on_prod
  b = webdriver.remote "ondemand.saucelabs.com" 
    ,80 
    ,"yaronn01"
    , "daa47681-6117-4d8b-a6b7-fe52adc65a58"
else
  b = webdriver.remote()

host = if run_on_prod then "www.gitmoon.com" else "localhost:3000"

describe 'Site', () ->
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
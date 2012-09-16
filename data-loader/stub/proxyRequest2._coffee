events = new require 'events'
url = require 'url'
http = require 'http'
request = require('request')#.defaults 'proxy':'http://web-proxy.israel.hp.com:8080/'
fs = require 'fs'

class ProxyRequest extends events.EventEmitter

  constructor: () ->
    events.EventEmitter.call this

  send: (paused, req, res, url_str, _) =>    
    self = this
    u = url.parse url_str            
    options = 
      uri: url_str
      method: req.method
      headers:
        "connection": "close"
        #'Authorization': 'Basic ' + new Buffer("[user]" + ':' + "[pass]").toString('base64')
      encoding: null #ensured response is not encoded like string
    console.log options
    
    proxy_response = request options, _    
    res.writeHead proxy_response.statusCode, proxy_response.headers    
    res.write proxy_response.body, 'binary'    
    res.end()            
    canned =
      statusCode: proxy_response.statusCode
      headers: proxy_response.headers
      body: proxy_response.body    
    this.emit "response", canned


    req.on 'data', (chunk, _) =>
      proxy_request.write chunk, 'binary'

    req.on 'end', (_) =>
      proxy_request.end()
    
    paused.resume()

exports.ProxyRequest = ProxyRequest
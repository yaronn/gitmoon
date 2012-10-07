exports.neo4j = if (process.env.production or process.env.staging) then 'http://10.252.79.119:7474/' else 'http://localhost:7474/'#'http://ec2-50-112-34-145.us-west-2.compute.amazonaws.com:7474/'
exports.proxy = ''#http://web-proxy.israel.hp.com:8080/'
console.log "neo4j db: #{module.exports.neo4j}"

#if !process.env.staging
exports.memcached = '127.0.0.1:11211'

exports.port = if process.env.production then 3000 else 3001
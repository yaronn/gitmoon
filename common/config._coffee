exports.neo4j = if process.env.production then 'http://10.252.129.197:7474/' else 'http://ec2-54-245-26-197.us-west-2.compute.amazonaws.com:7474/'
console.log "neo4j db: #{module.exports.neo4j}"
#exports.neo4j = 'http://localhost:7474/'
exports.memcached = '127.0.0.1:11211'
exports.port = 3000
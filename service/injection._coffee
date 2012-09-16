
exports.sanitizeString = (str) ->
  str_working = str
  str_working = str_working.replace /[\/]/g, "\\/"
  str_working = str_working.replace /(\s+|^)(and|or|delete|create|with|set )(\s+|$)/gi, ""
  str_working

exports.ensureInt = (str) ->
  return parseInt(str)
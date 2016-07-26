'use strict';

module.exports = demodelize;

function demodelize(data){
  if (typeof data === 'function') return;
  if (data === null             ) return null;
  if (typeof data === 'string'  ) return data;
  if (typeof data === 'number'  ) return data;
  if (typeof data === 'boolean' ) return data;

  if (data instanceof Array) {
    return data.filter(function(data){
      return typeof data !== 'function'
    })
    .map(demodelize)
  }
  if (typeof data === 'object') {
    var res = {};
    for (var i in data) {
      if (i === '_events') continue;
      if (i === '_eventsCount') continue;
      if (i === '_maxListeners') continue;
      if (i === 'domain') continue;
      if (typeof data[i] === 'function') continue;
      res[i] = demodelize(data[i]);
    }
    return res;
  }
  else return data;
}

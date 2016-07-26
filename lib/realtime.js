'use strict';

var flow = require('flow');
var map = require('event-stream').map;
var WebSocketStream = require('websocket-stream');

/**
 * inserted, updated, saved, deleted
 *
 * Stream = Model.inserted();
 */
module.exports = {
  inserted: createRealtimeMethods('inserted'),
  updated: createRealtimeMethods('updated'),
  saved: createRealtimeMethods('saved'),
  deleted: createRealtimeMethods('deleted')
};

function createRealtimeMethods(name){
  return function(){
    var url = this.req.url.cd(name);
    url.protocol = 'ws';
    return WebSocketStream(url.href)
    .pipe(map(function(data, next){
      next(null, flow(String, JSON.parse)(data));
    }));
  };
}


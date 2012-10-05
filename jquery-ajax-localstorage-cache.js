// http://github.com/mattg/jquery-ajax-localstorage-cache

$.ajaxPrefilter(function(options, originalOptions, jqXHR) {

  // Cache it ?
  if (typeof localStorage === 'undefined' || !options.localCache) { return; }

  var hourstl = options.cacheTTL || 5;
  var cacheKey = options.cacheKey || options.url.replace(/jQuery.*/, '') + options.type + options.data;
  var preventExpiration = options.preventExpiration || false;
  
  // isCacheValid is a function to validate cache
  if (options.isCacheValid && !options.isCacheValid()) {
    localStorage.removeItem(cacheKey);
  }
  // if there's a TTL that's expired, flush this item
  var ttl = localStorage.getItem(cacheKey + 'cachettl');
  if (preventExpiration === false && ttl && ttl < +new Date()) {
    ttl = 'expired';
  }
  
  var value;
  if (ttl !== 'expired') {
    value = localStorage.getItem(cacheKey);
  }
  if (value) {
    //In the cache? So get it, apply success callback & abort the XHR request
    // parse back to JSON if we can.
    if (options.dataType.indexOf('json') === 0) { value = JSON.parse(value); }
    options.success(value);
    // Abort is broken on JQ 1.5 :(
    jqXHR.abort();
  } else {

    //If it not in the cache, we change the success callback, just put data on localstorage and after that apply the initial callback
    if (options.success) {
      options.realsuccess = options.success;
    }
    options.success = function(data) {
      var strdata = data;
      if (this.dataType.indexOf('json') === 0) { strdata = JSON.stringify(data); }
      localStorage.setItem(cacheKey, strdata);
      // store timestamp
      if (!ttl || ttl === 'expired') {
        localStorage.setItem(cacheKey  + 'cachettl', + new Date() + 1000 * 60 * 60 * hourstl);
      }
      if (options.realsuccess) { options.realsuccess(data); }
    };

    // Check for cached data if request fails, run success if there is a value, run error if there is not
    if (options.error) {
      options.realerror = options.error;
    }
    options.error = function(jqXHR, textStatus, errorThrown) {
      value = localStorage.getItem(cacheKey);
      if (value) {
        //In the cache? So get it, apply success callback & abort the XHR request
        // parse back to JSON if we can.
        if (options.dataType.indexOf('json') === 0) { value = JSON.parse(value); }
        if (options.realsuccess) { options.realsuccess(value); }
        // Abort is broken on JQ 1.5 :(
        jqXHR.abort();
      } else {
        if (options.realerror) { options.realerror(jqXHR, textStatus, errorThrown); }
      }
    };
    
  }
});

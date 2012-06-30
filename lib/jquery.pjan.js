/*!
* Plugin: PJAN (html5 history.pushState + ajax + json) for jquery
* Version: 1.0 Alpha
* Author: Willin Wang && Welefen
* Author URI: http://www.willin.org
*/
(function($) {
    var Util = {
        support : {
            pjan : window.history && window.history.pushState && window.history.replaceState && !navigator.userAgent.match(/(iPod|iPhone|iPad|WebApps\/.+CFNetwork)/),
            storage : !!window.localStorage
        },
        toInt : function(obj) {
            return parseInt(obj);
        },
        stack : {},
        getTime : function() {
            return new Date * 1;
        },
        // 获取URL不带hash的部分,切去掉pjan=true部分
        getRealUrl : function(url) {
            url = (url || '').replace(/\#.*?$/, '');
            url = url.replace('?pjan=true', '').replace('&pjan=true', '');
            return url;
        },
        // 获取url的hash部分
        getUrlHash : function(url) {
            return url.replace(/^[^\#]*(?:\#(.*?))?$/, '$1');
        },
        // 获取本地存储的key
        getLocalKey : function(src) {
            var s = 'pjan_' + encodeURIComponent(src);
            return {
                data : s + '_data',
                time : s + '_time',
                title : s + '_title'
            };
        },
        // 清除所有的cache
        removeAllCache : function() {
            if(!Util.support.storage)
                return;
            for(var name in localStorage) {
                if((name.split('_') || [ '' ])[0] === 'pjan') {
                    delete localStorage[name];
                }
            }
        },
        // 获取cache
        getCache : function(src, time, flag) {
            var item, vkey, tkey, tval;
            time = Util.toInt(time);
            if( src in Util.stack) {
                item = Util.stack[src], ctime = Util.getTime();
                if((item.time + time * 1000) > ctime) {
                    return item;
                } else {
                    delete Util.stack[src];
                }
            } else if(flag && Util.support.storage) {// 从localStorage里查询
                var l = Util.getLocalKey(src);
                vkey = l.data;
                tkey = l.time;
                item = localStorage.getItem(vkey);
                if(item) {
                    tval = Util.toInt(localStorage.getItem(tkey));
                    if((tval + time * 1000) > Util.getTime()) {
                        return {
                            data : item,
                            title : localStorage.getItem(l.title)
                        };
                    } else {
                        localStorage.removeItem(vkey);
                        localStorage.removeItem(tkey);
                        localStorage.removeItem(l.title);
                    }
                }
            }
            return null;
        },
        // 设置cache
        setCache : function(src, data, title, flag) {
            var time = Util.getTime(), key;
            Util.stack[src] = {
                data : data,
                title : title,
                time : time
            };
            if(flag && Util.support.storage) {
                key = Util.getLocalKey(src);
                localStorage.setItem(key.data, data);
                localStorage.setItem(key.time, time);
                localStorage.setItem(key.title, title);
            }
        },
        // 清除cache
        removeCache : function(src) {
            src = Util.getRealUrl(src || location.href);
            delete Util.stack[src];
            if(Util.support.storage) {
                var key = Util.getLocalKey(src);
                localStorage.removeItem(key.data);
                localStorage.removeItem(key.time);
                localStorage.removeItem(key.title);
            }
        }
    };
    // pjan
    var pjan = function(options) {
        options = $.extend({
            selector : '',
            container : '',
            callback : function() {
            },
            fitler : function() {
            }
        }, options);
        if(!options.container || !options.selector) {
            throw new Error('selector & container options must be set');
        }
        $('body').delegate(options.selector, 'click', function(event) {
            if(event.which > 1 || event.metaKey) {
                return true;
            }
            var $this = $(this), href = $this.attr('href');
            // 过滤
            if( typeof options.filter === 'function') {
                if(options.filter.call(this, href, this) === true) {
                    return true;
                }
            }
            if(href === location.href) {
                return true;
            }
            // 只是hash不同
            if(Util.getRealUrl(href) == Util.getRealUrl(location.href)) {
                var hash = Util.getUrlHash(href);
                if(hash) {
                    location.hash = hash;
                    options.callback && options.callback.call(this, {
                        type : 'hash',
                        hash : hash
                    });
                }
                return true;
            }
            event.preventDefault();
            options = $.extend(true, options, {
                url : href,
                element : this
            });
            // 发起请求
            pjan.request(options);
        });
    };
    pjan.xhr = null;
    pjan.options = {};
    pjan.state = {};

    // 默认选项
    pjan.defaultOptions = {
        timeout : 2000,
        element : null,
        cache : 24 * 3600, // 缓存时间, 0为不缓存, 单位为秒
        storage : true, // 是否使用localstorage将数据保存到本地
        url : '', // 链接地址
        push : true, // true is push, false is replace, null for do nothing
        show : '', // 展示的动画
        title : '', // 标题
        titleSuffix : '', // 标题后缀
        type : 'GET',
        data : {
            pjan : true
        },
        dataType : 'html',
        callback : null, // 回调函数
        // for jquery
        beforeSend : function(xhr) {
            $(pjan.options.container).trigger('pjan.start', [xhr, pjan.options]);
            xhr && xhr.setRequestHeader('X-pjan', true);
        },
        error : function() {
            pjan.options.callback && pjan.options.callback.call(pjan.options.element, {
                type : 'error'
            });
            location.href = pjan.options.url;
        },
        complete : function(xhr) {
            $(pjan.options.container).trigger('pjan.end', [xhr, pjan.options]);
        }
    };
    // 展现动画
    pjan.showFx = {
        "_default" : function(data, callback, isCached) {
            //this.html(data);
            callback && callback.call(this, data, isCached);
        },
        fade : function(data, callback, isCached) {
            var $this = this;
            if(isCached) {
                //$this.html(data);
                callback && callback.call($this, data, isCached);
            } else {
                this.fadeOut(500, function() {
                    //$this.html(data).fadeIn(500, function() {
                        callback && callback.call($this, data, isCached);
                    //});
                });
            }
        }
    }
    // 展现函数
    pjan.showFn = function(showType, container, data, fn, isCached) {
        var fx = null;
        if( typeof showType === 'function') {
            fx = showType;
        } else {
            if(!( showType in pjan.showFx)) {
                showType = "_default";
            }
            fx = pjan.showFx[showType];
        }
        fx && fx.call(container, data, function() {
            var hash = location.hash;
            if(hash != '') {
                location.href = hash;
                //for FF
                if(/Firefox/.test(navigator.userAget)) {
                    history.replaceState($.extend({}, pjan.state, {
                        url : null
                    }), document.title);
                }
            } else {
                window.scrollTo(0, 0);
            }
            fn && fn.call(this, data, isCached);
        }, isCached);
    }
    // success callback
    pjan.success = function(data, isCached) {
        // isCached default is success
        if(isCached !== true) {
            isCached = false;
        }
        if((data || '').indexOf('<html') != -1) {
            pjan.options.callback && pjan.options.callback.call(pjan.options.element, {
                type : 'error'
            });
            location.href = pjan.options.url;
            return false;
        }
        var title = pjan.options.title, el;
        if(!title) {
            var matches = data.match(/<title>(.*?)<\/title>/);
            if(matches) {
                title = matches[1];
            }
            if(!title && pjan.options.element) {
                el = $(pjan.options.element);
                title = el.attr('title') || el.text();
            }
        }
        if(title) {
            if(title.indexOf(pjan.options.titleSuffix) == -1) {
                title += pjan.options.titleSuffix;
            }
            document.title = title;
        }
        pjan.state = {
            container : pjan.options.container,
            timeout : pjan.options.timeout,
            cache : pjan.options.cache,
            storage : pjan.options.storage,
            show : pjan.options.show,
            title : title,
            url : pjan.options.oldUrl
        };
        var query = $.param(pjan.options.data);
        if(query != "") {
            pjan.state.url = pjan.options.url + (/\?/.test(pjan.options.url) ? "&" : "?") + query;
        }
        if(pjan.options.push) {
            if(!pjan.active) {
                history.replaceState($.extend({}, pjan.state, {
                    url : null
                }), document.title);
                pjan.active = true;
            }
            history.pushState(pjan.state, document.title, pjan.options.oldUrl);
        } else if(pjan.options.push === false) {
            history.replaceState(pjan.state, document.title, pjan.options.oldUrl);
        }
        pjan.options.showFn && pjan.options.showFn(data, function() {
            pjan.options.callback && pjan.options.callback.call(pjan.options.element, {
                type : isCached ? 'cache' : 'success',
                data : data
            });
        }, isCached);
        // 设置cache
        if(pjan.options.cache && !isCached) {
            Util.setCache(pjan.options.url, data, title, pjan.options.storage);
        }
    };

    // 发送请求
    pjan.request = function(options) {
        options = $.extend(true, pjan.defaultOptions, options);
        var cache, container = $(options.container);
        options.oldUrl = options.url;
        options.url = Util.getRealUrl(options.url);
        if($(options.element).length) {
            cache = Util.toInt($(options.element).attr('data-pjan-cache'));
            if(cache) {
                options.cache = cache;
            }
        }
        if(options.cache === true) {
            options.cache = 24 * 3600;
        }
        options.cache = Util.toInt(options.cache);
        // 如果将缓存时间设为0，则将之前的缓存也清除
        if(options.cache === 0) {
            Util.removeAllCache();
        }
        // 展现函数
        if(!options.showFn) {
            options.showFn = function(data, fn, isCached) {
                pjan.showFn(options.show, container, data, fn, isCached);
            };
        }
        pjan.options = options;
        pjan.options.success = pjan.success;
        if(options.cache && ( cache = Util.getCache(options.url, options.cache, options.storage))) {
            options.beforeSend();
            options.title = cache.title;
            pjan.success(cache.data, true);
            options.complete();
            return true;
        }
        if(pjan.xhr && pjan.xhr.readyState < 4) {
            pjan.xhr.onreadystatechange = $.noop;
            pjan.xhr.abort();
        }
        pjan.xhr = $.ajax(pjan.options);
    };

    // popstate event
    var popped = ('state' in window.history), initialURL = location.href;
    $(window).bind('popstate', function(event) {
        var initialPop = !popped && location.href == initialURL;
        popped = true;
        if(initialPop)
            return;
        var state = event.state;
        if(state && state.container) {
            if($(state.container).length) {
                var data = {
                    url : state.url || location.href,
                    container : state.container,
                    push : null,
                    timeout : state.timeout,
                    cache : state.cache,
                    storage : state.storage
                };
                pjan.request(data);
            } else {
                window.location = location.href;
            }
        }
    });

    // not support
    if(!Util.support.pjan) {
        pjan = function() {
            return true;
        };
        pjan.request = function(options) {
            if(options && options.url) {
                location.href = options.url;
            }
        };
    }
    // pjan bind to $
    $.pjan = pjan;
    $.pjan.util = Util;

    // extra
    if($.inArray('state', $.event.props) < 0) {
        $.event.props.push('state')
    }

})(jQuery);
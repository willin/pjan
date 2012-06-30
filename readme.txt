说明：

PJAN是在Pjax基础上加入JSON支持的插件，原作者Welefen。

1.0版本详细文章：http://blog.willin.org/frontend/pjan-alpha

作者：长岛冰泪 http://www.willin.org

示例代码：
jQuery(document).ready(function(w){
    var $page_title='';
    w.pjan({
        selector: 'a',//选择器。可用jQuery筛选语法。必填。
        container: '#tmpholder', //内容替换的容器，没什么实际用处。必填。
        show: 'fade', //展现的动画，支持默认和fade, 可以自定义动画方式，这里为自定义的function即可。
        cache: 60, //使用缓存，单位秒，0或flase取消。
        storage: true, //是否使用本地存储。
        titleSuffix: '- by Willin PJAN', //标题后缀
        filter: function(href){
            if(href.indexOf('.png') >-1 || href.indexOf('.jpg') >-1 || href.indexOf('.gif') >-1 || href.indexOf('.rar') >-1 || href.indexOf('.zip') >-1 || href.indexOf('.7z') >-1){
                return true;//True表示过滤不用pjan
            }
          
        },
        beforeSend:function(){
            //Loader动画开始
        },
        callback: function(status){
          
            var type = status.type;
            switch(type){
                 case 'success':  //正常
                 case 'cache':
                    var json=w.parseJSON(status.data);
                    //手动jQuery('sth').html(json.data.sth);
                    // Animate动画
                    }
                 break; //读取缓存
                 case 'hash':
                     // Animate动画
                     break; //只是hash变化
                 case 'error':
                   
                 break; //发生异常
            }
            //Loader动画结束
        }
    });
});


˵����

PJAN����Pjax�����ϼ���JSON֧�ֵĲ����ԭ����Welefen��

����jQuery.PJAX�����֧�����Ʋ���http://www.welefen.com/pjax-version-1-1-and-contain-kissy.html

ʾ�����룺
jQuery(document).ready(function(w){
    var $page_title='';
    w.pjan({
        selector: 'a',//ѡ����������jQueryɸѡ�﷨�����
        container: '#tmpholder', //�����滻��������ûʲôʵ���ô������
        show: 'fade', //չ�ֵĶ�����֧��Ĭ�Ϻ�fade, �����Զ��嶯����ʽ������Ϊ�Զ����function���ɡ�
        cache: 60, //ʹ�û��棬��λ�룬0��flaseȡ����
        storage: true, //�Ƿ�ʹ�ñ��ش洢��
        titleSuffix: '- by Willin PJAN', //�����׺
        filter: function(href){
            if(href.indexOf('.png') >-1 || href.indexOf('.jpg') >-1 || href.indexOf('.gif') >-1 || href.indexOf('.rar') >-1 || href.indexOf('.zip') >-1 || href.indexOf('.7z') >-1){
                return true;//True��ʾ���˲���pjan
            }
          
        },
        beforeSend:function(){
            //Loader������ʼ
        },
        callback: function(status){
          
            var type = status.type;
            switch(type){
                 case 'success':  //����
                 case 'cache':
                    var json=w.parseJSON(status.data);
                    //�ֶ�jQuery('sth').html(json.data.sth);
                    // Animate����
                    }
                 break; //��ȡ����
                 case 'hash':
                     // Animate����
                     break; //ֻ��hash�仯
                 case 'error':
                   
                 break; //�����쳣
            }
            //Loader��������
        }
    });
});


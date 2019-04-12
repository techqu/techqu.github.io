/**
 * @base color:
 * 	success: #71bc57
 *	warning: #FFB15B
 *	danger:  #FF4949
 */

+function ($) {
    'use strict';

    $.feedbackMessage = function(options){
        /**
         * @param message { String }: 要显示的信息
         * @param type { String ['success','warning','danger']}: 要显示的提示信息的类型
         * @param showTime { Number }: 要显示的信息时间毫秒数
         */

        var defaults = {
            message  : 'message',
            type     : 'success',
            showTime : 3000
        };


        //add by yeguo
        // you can pass 3 string
        if(arguments && arguments.length && arguments.length>1){
            if(arguments[0]){
                options.message = arguments[0];
            }
            if(arguments[1]){
                options.type = arguments[1];
            }
            if(arguments[2]){
                options.showTime = arguments[2];
            }
        }
        //add end

        var options   = $.extend(defaults, options);
        var bgStyle   = 'position: fixed;top: -100px;left: 0;text-align: center;';
        var textStyle = 'color: #fff';

        createMessage(options.type, options.message);

        function createMessage(type,message){
            $('.fb-message').remove();
            $('body').append('<div class="fb-message"><span class="fb-message-text">' + message + '</span></div>')

            $('.fb-message').css({
                'position': 'fixed',
                'top': '-100px',
                'left': '0',
                'width': '100%',
                'height': '40px',
                'lineHeight': '40px',
                'opacity': '0.95',
                'textAlign': 'center',
                'zIndex': '10000'
            });
            $('.fb-message-text').css({
                'color': '#fff',
                'font-size' : '16px'
            });

            switch(options.type){
                case 'warning':
                    $('.fb-message').css({
                        'backgroundColor': '#FFB15B'
                    });
                    break;
                case 'danger':
                    $('.fb-message').css({
                        'backgroundColor': '#FF4949'
                    });
                    break;
                case 'success':
                default:
                    $('.fb-message').css({
                        'backgroundColor': '#71bc57'
                    });
            }

            $('.fb-message').animate({
                'top': '0'
            },300);
            setTimeout(function(){
                $('.fb-message').fadeOut('fast');
            },options.showTime);
        }
    };

    $.message = {
        error : function(message , showTime) {
            $.feedbackMessage({
                message : message ,
                type :  'danger',
                showTime : showTime || 8000
            });
        },
        success : function(message , showTime) {
            $.feedbackMessage({
                message : message ,
                type :  'success',
                showTime : showTime || 3000
            });
        },
        warning : function(message , showTime) {
            $.feedbackMessage({
                message : message ,
                type :  'warning',
                showTime : showTime || 5000
            });
        }
    };

}(jQuery);

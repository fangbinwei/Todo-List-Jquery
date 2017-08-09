;(function(){
    'use strict';

    var $form_add_task = $('.add-task'),
        $body = $('body'),
        $window = $(window),
        $task_detail = $('.task-detail'),
        $task_detail_mask = $('.task-detail-mask'),
        $update_form = $('.task-detail form'),
        $task_detail_content = $('.task-detail .content'),
        $task_detail_content_input = $('.task-detail [name=content]'),
        $msg = $('.msg'),
        $msg_content = $('.msg .msg-content'),
        $msg_confirm = $('.msg .confirmed'),
        $alerter = $('.alerter'),
        $delete_trigger,
        $detail_trigger,
        $task_item,
        $check_box_complete,
        task_list = [];

    init();


    //弹出框
    function pop(arg) {
        if (!arg){
            console.error('pop title is required');
        }

        var conf = {},
            $box,
            $mask,
            $title,
            $content,
            $confirm,
            $cancel,
            dfd,
            confirmed,
            timer;

        dfd = $.Deferred();

        //对传入数据做简单判断
        if (typeof arg === 'string'){
            conf.title = arg;
        }else if(arg === "object") {
            conf = $.extend(conf, arg)
        }else {
            return;
        }

        //弹出框的html css
        $box = $('<div>' +
            '<div class="pop-title">' + conf.title + '</div>' +
            '<div class="pop-content"></div>' +
            '<div><button style="margin-right: 5px" type="button" class="confirm">确定</button>' +
            '<button type="button" class="cancel">取消</button></div>' +
            '</div>')
            .css({
                position: 'fixed',
                width: 300,
                height: 'auto',
                padding: '15px 10px',
                background: '#ffffff',
                'border-radius': 3,
                'box-shadow': '0 1px 2px rgba(0,0,0,0.5)',
                'text-align': 'center'
            });

        $mask = $('<div></div>')
            .css({
                position: 'fixed',
                top: 0,
                bottom: 0,
                right: 0,
                left: 0,
                background: 'rgba(0,0,0,0.5)'
            });

        $title = $box.find('.pop-title').css({
            padding: '5px 10px',
            'font-weight': 900,
            'font-size' : '1.2rem'
        });
        $content = $box.find('.pop-content').css({
            padding: '5px 10px'
        });

        $confirm = $box.find('button.confirm');
        $cancel = $box.find('button.cancel');

        //监听"确定"事件
        $confirm.on('click', onConfirm);
        function onConfirm () {
            confirmed = true;
        }

        //监听"取消"事件
        $cancel.on('click', onCancel);
        $mask.on('click', onCancel);
        function onCancel() {
            confirmed = false;
        }

        //监听confirmed是否发生变化
        timer = setInterval(function () {
            if (confirmed !== undefined){
                //resolve传回confirmed的值
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismissPop();
            }
        }, 50);

        //弹出框居中
        $window.on('resize', function () {
            adjustBoxPosition();
        });

        $body.append($mask);
        $body.append($box);

        //触发resize时间,让弹出框初始化居中
        $window.resize();

        return dfd.promise();

        function adjustBoxPosition() {
            var window_width = $window.width(),
                window_height = $window.height(),
                box_width = $box.width(),
                box_height = $box.height(),
                move_x,
                move_y;

            move_x = (window_width - box_width)/2;
            move_y = (window_height - box_height)/2 - 20;
            $box.css({
                left: move_x,
                top: move_y
            });
            console.log('ww, wh, bw,bh', window_width, window_height, box_width,box_height)
        }

        //移除弹出框
        function dismissPop() {
            $mask.remove();
            $box.remove();
        }
    }

    //添加任务事件
    function addTaskFormSubmit(e) {
        var new_task = {};
        //禁用默认行为
        e.preventDefault();
        //获取task的value
        var $input = $(this).find('input[name=content]');
        new_task.content =$input.val();
        if(!new_task.content){
            return;
        }

        if(addTask(new_task)){
            $input.val('');
            $input.focus();
        }
    }

    //监听提醒框点击事件
    function listenMsgEvent() {
        $msg_confirm.on('click',function () {
            hideMsg();
        })
    }

    //查找并监听删除事件
    function listenTaskDelete() {
        $delete_trigger.on('click',function(){
            var $task_item = $(this).parent().parent();
            var index = $task_item.data('index');
            pop('确定删除?')
                .then(function (r) {
                    r ? deleteTask(index) : null;
                });
        });
    }

    //监听 打开task详情
    function listenTaskDetail() {
        $detail_trigger.on('click', function () {
            var $task_item = $(this).parent().parent();
            var index = $task_item.data('index');
            showTaskDetail(index);
        });

        $task_item.on('dblclick', function (e) {
            if($(e.target).is('.task-item')){
                var index = $(this).data('index');
                showTaskDetail(index);
            }
        });
    }

    //监听任务complete事件
    function listenCheckboxComplete() {
        $check_box_complete.on('click', function () {
            var $this = $(this);
            // var is_complete = $this.is(':checked');
            var index = $this.parent().parent().data('index');
            if (task_list[index].complete){
                updateTask(index, {complete: false});
            }else {
                updateTask(index,{complete: true});
            }
        });
    }

    //添加任务
    function addTask(new_task) {
        task_list.unshift(new_task);
        refreshTaskList();
        return true;
    }

    //查看task详情
    function showTaskDetail(index) {
        renderTaskDetail(index);
        $task_detail.fadeIn('fast');
        $task_detail_mask.fadeIn('fast');

        function renderTaskDetail(index) {
            if(index === undefined || !task_list[index]) return;

            //读取并设置Content description date
            var content = task_list[index].content;
            var desc = task_list[index].desc;
            var date = task_list[index].remind_date;
            $task_detail_content.show();
            $task_detail_content_input.hide();

            $task_detail_content.text(content);
            $task_detail.find('[name=content]').val(content);
            $task_detail.find('textarea').val(desc);
            $task_detail.find('[name=remind-date]').val(date);


            //添加双击更改Content事件 (注意不要重复绑定)
            $task_detail_content.off('dblclick').on('dblclick',function () {
                $task_detail_content_input.show();
                $task_detail_content_input.focus();
                $task_detail_content.hide();
            });

            //添加更新事件 (注意不要重复绑定,因为每次点开detail 都会绑定)
            $update_form.off('submit').on('submit',function (e) {
                e.preventDefault();
                var remind_date_last,
                    data = {};

                remind_date_last = task_list[index].remind_date;
                data.content = $(this).find('[name=content]').val();
                data.desc = $(this).find('[name=desc]').val();
                data.remind_date = $(this).find('[name=remind-date]').val();

                //更改过提醒时间后,进行重新提醒
                if (remind_date_last !== data.remind_date){
                    data.informed = false;
                }

                updateTask(index, data);
                console.log('date_last', remind_date_last);
                console.log('task_list',task_list[index]);
                hideTaskDetail();
            });
        }
    }

    //更新task详情
    function updateTask(index, data) {
        if(index === undefined || !task_list[index]) return;
        task_list[index] = $.extend({},task_list[index],data);
        refreshTaskList();
    }

    //隐藏task 详情
    function hideTaskDetail() {
        $task_detail.fadeOut('fast');
        $task_detail_mask.fadeOut('fast');
    }

    //删除任务
    function deleteTask(index) {
        //如果index或者不存在 则返回
        if(index===undefined||!task_list[index]) return;
        task_list.splice(index,1);

        //更新localStorage
        refreshTaskList();
    }

    //初始化渲染
    function init(){
        //    添加jQuery 的datetimepicker
        $('#remind-date').datetimepicker();

        task_list = store.get('task_list') || [];
        if(task_list){
            renderTaskList();
        }

        //监听任务添加时间
        $form_add_task.on('submit', addTaskFormSubmit);
        // 监听mask点击事件, 点击mask退出任务详情界面
        $task_detail_mask.on('click', hideTaskDetail);

        taskRemindCheck();
        listenMsgEvent();
    }

    //监听任务提醒时间是否到达
    function taskRemindCheck() {
        var current_timestamp,
            task_timestamp;
        var itl = setInterval(function () {
            for(var i = 0; i< task_list.length; i++){
                var item = task_list[i];
                if (!item.remind_date || item.informed){
                    continue;
                }
                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remind_date)).getTime();
                if(current_timestamp > task_timestamp){
                    updateTask(i, {informed: true});
                    showMsg(item.content);
                }
            }
        }, 300);

    }

    //显示提醒框
    function showMsg(msg) {
        if (!msg){
            return;
        }

        var add_msg = msg + '</br>' + $msg_content.html();
        $msg_content.html(add_msg);
        $msg.slideDown();
        $alerter[0].play();

    }

    //隐藏提醒框
    function hideMsg() {
        $msg.slideUp();
        $msg_content.html('');

    }

    //添加或删除任务后重新进行渲染,并更新localStorage
    function refreshTaskList() {
        store.set('task_list', task_list);
        renderTaskList();
    }

    //渲染全部task模板
    function renderTaskList() {
        var $task_list = $('.task-list');
        $task_list.html('');
        var complete_items = [];
        for(var i = 0; i < task_list.length; i++){
            var item = task_list[i];
            if(item.complete){
                complete_items[i] = item;
            }else {
                var $task = renderTaskItem(item, i);
                $task_list.append($task);
            }
        }

        for (var j = 0; j < complete_items.length; j++){
            if (!complete_items[j]) continue;
            $task = renderTaskItem(complete_items[j], j);
            $task.addClass('completed');
            $task_list.append($task);
        }


        $delete_trigger = $('.action.delete');
        $detail_trigger = $('.action.detail');
        $task_item  = $('.task-item');
        $check_box_complete = $('.task-list .complete');

        //监听动态生成的 "删除" "详细" checkbox的点击事件
        listenTaskDelete();
        listenTaskDetail();
        listenCheckboxComplete();


    }

    //渲染单条task模板
    function renderTaskItem(data, index) {
        var list_item =
            '<li class="task-item" data-index="' + index+ '">' +
            '<span><input class="complete"  type="checkbox"' + (data.complete ? "checked": "") + '></span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="action-button">'+
            (data.informed ? '<span class="informed">已提醒</span>' : "") +
            '<span class="action delete">删除</span>' +
            '<span class="action detail">详细</span>' +
            '</li>' +
            '</span>';
        return $(list_item);
    }
})();

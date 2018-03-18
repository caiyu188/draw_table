/*
 *公司: 深圳品创软件
 *功能:表格拖拽、排序
 */
;(function($, window, document, undefined){

    // our plugin constructor
    var DragTable = function(elem, options){
        this.elem = elem;
        this.$elem = $(elem);
        this.options = options;
    };

    // the plugin prototype
    DragTable.prototype = {
        defaults: {
            //排序标记
            is_asc: true,
            offset_x :0,
            is_drag:false,
            is_move:false,
            select_index:0,
            temp_data_form:null,
            temp_data_to:null,
        },

        //初始化
        init: function() {
            var self = this;
            self.is_drag = false;
            // Introduce defaults that can be extended either
            // globally or using an object literal.
            this.config = $.extend({}, this.defaults, this.options );

            self.$table = this.$elem.find('table');
            self.addDragFragment();

            //mouse down
            self.$table.find('th').each(function () {
                $(this).attr('onselectstart','return false;');
                $(this).attr('ondrag','return false;');
            });
            self.$table.find('th').mousedown(function(e){
                if(self.is_drag){
                    return;
                }
                if($(this).hasClass('no_drag')){
                    //标记不移动
                    return;
                }
                var is_msie = /msie/.test(navigator.userAgent.toLowerCase()) ;
                //只响应左键
                //if((!$.browser.msie && e.button == 0) || ($.browser.msie && e.button == 1))
                if((! is_msie && e.button == 0) || (is_msie && e.button == 1)) {
                    //left click
                }else if(e.button == 2) {
                    //right click
                    return;
                }

                //移动 选择的
                self.$drag_box.css({width:$(this).width()+"px",display:'block'}) ;
                self.offset_x = e.clientX-$(this).offset().left;

                //save form data
                self.getFormData($(this).index());
                //move
                var elem_x = self.$elem.offset().left;
                var tx = e.clientX-elem_x-self.offset_x;

                self.moveDragBox(tx);
                //drag start
                self.is_drag = true;
                self.is_move = false ;
                e.stopPropagation();
            }).mouseenter(function(evt){
                if($(this).hasClass('no_drag')){
                    //标记不移动
                    //$(this).css({'cursor':'not-allowed'});
                    $(this).css({'cursor':'default'});
                    return;
                }else{
                    $(this).css({'cursor':'move'})
                }
                evt.stopPropagation();
            });


            //mouse move
            $(document).mousemove (function(e){
                //判断左键为按下状态 只响应左键
                if(self.is_drag==false){
                    //mouse down 才执行
                    return ;
                }
                //禁止选择文本
                //window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();

                self.is_move = true ;
                var e=e||window.event;
                var target = e.target||e.srcElement;
                var thW = target.offsetWidth;
                //offset x
                var elem_x = self.$elem.offset().left;
                var tx = e.clientX-elem_x-self.offset_x;

                if(self.is_move){
                    //移动后处理列对换
                    //var tx = 0;
                    var th = self.$table.find('tr').eq(0);
                    var box_x = e.clientX;
                    th.find('th').each(function(){
                        var mx = $(this).offset().left;
                        if(box_x > mx && box_x < mx+ $(this).width() ){
                            var target_index = $(this).index();
                            if($(this).hasClass('no_drag')){
                                self.$drag_box.css({'cursor':'not-allowed'});
                            }else{
                                self.$drag_box.css({'cursor':'move'});
                            }
                        }
                    });
                }

                //move
                self.moveDragBox(tx);
                e.stopPropagation();
            });

            //mouse down
            $(document).mouseup(function(e){
                if(self.is_move){

                    //移动后处理列对换
                    var tx = 0;
                    var th = self.$table.find('tr').eq(0);
                    //var box_x = self.$drag_box.offset().left;
                    var box_x = e.clientX;
                    th.find('th').each(function(){
                        var mx = $(this).offset().left;
                        if(box_x > mx && box_x < mx+ $(this).width() ){
                            var target_index = $(this).index();
                            if($(this).hasClass('no_drag')){

                            }else{
                                //$(this).css({'border':'2px solid #f00'});
                                self.setTargetData(target_index);
                            }
                        }
                    });

                }
                //stop drag
                self.$drag_box.css({display:'none'}) ;
                self.is_drag = false;
                e.stopPropagation();
                self.is_move = false ;
            });

            //移动窗口停止事件
            $(document).mouseleave(function(e){
                //stop drag
                self.$drag_box.css({display:'none'}) ;
                self.is_drag = false;
                e.stopPropagation();
                self.is_move = false ;
                //self.stopDrag();
            })


            return this;
        },

        stopDrag:function(){
            self = this;
            //stop drag
            self.$drag_box.css({display:'none'}) ;
            self.is_drag = false;
            self.is_move = false ;
        },

        //列数据对换
        setTargetData:function(index){
            var self = this;
            var i = 0;
            if(index!= self.select_index){
                self.temp_data_to = [];
                self.$table.find('tr').each(function(){
                    var td = $(this).find('td,th');
                    //目标数据保存
                    var one = td.eq(index).html();
                    self.temp_data_to.push(one);
                    //写入来源数据
                    td.eq(index).html(td.eq(self.select_index).html());
                    td.eq(self.select_index).html( self.temp_data_to[i]);
                    i++ ;
                })
            }
        },

        //取出已选择的列
        getFormData:function(index){
            var self = this;
            //复制表格数据
            self.$drag_box.html("<ul></ul>");
            var box_table = self.$drag_box.find('ul');
            //box_table.find('tr').each(function(){
            //$(this).remove();
            //});
            //box_table.html('');
            self.temp_data_form = [];
            self.select_index = index;
            self.$table.find('tr').each(function(){
                var td = $(this).find('td,th');
                if(td.length>0){

                    var one = td.eq(index).prop("outerHTML");
                    var td_height = td.eq(index).parent().height();
                    if(td_height<43 && td_height>40){
                        td_height = 42.4;
                    }
                    //console.log(td_height)
                    var td_line_height = $(this).css('line-height');
                    var text_align = $(this).css('text-align');
                    //console.log('text_align:',$(this).get(0).style,self.$table.css('text-align') );
                    //text-align:"+text_align+" ;
                    box_table.append("<li style='height:"+ td_height +"px;' onselectstart='return false;' ondrag='return false' class='"+td.get(index).tagName.toLowerCase()+"'>"+td.eq(index).html()+"</li>")
                    self.temp_data_form.push(td.eq(index).html())
                }
            });
            var th_line_height = self.$table.find('th').css('line-height');
            var td_line_height = self.$table.find('td').css('line-height');
            //var td_height = self.$table.find('td').height()+0.4;
            //console.log(td_height)
            var th_border = '2px solid #e3cc8f';
            //var td_border = '1px solid #dde6f0';
            var td_border = '0';

            box_table.find('.th').css({'line-height':th_line_height, 'border-bottom':th_border});
            box_table.find('.td').css({'line-height':td_line_height,'border-bottom':td_border});
        },

        //移动当前列
        moveDragBox:function(tx){
            var self = this;
            var max_w = self.$table.width() - self.$drag_box.width();
            if( tx > max_w ){
                tx = max_w ;
            }else if(tx<0){
                tx = 0;
            }
            self.$drag_box.css({top:0,left:tx+"px"}) ;
        },

        //创建拖拽层
        addDragFragment: function() {
            var self = this;
            self.$elem.append('<div id="drag_box"><table></table></div>');
            //拖拽层
            self.$drag_box = this.$elem.find('#drag_box');

        },

        //处理排序
        thClick: function(e) {
            var self = this;
            e.preventDefault();
        },

    };

    DragTable.defaults = DragTable.prototype.defaults;

    $.fn.dragTable = function(options) {
        return this.each(function() {
            new DragTable(this, options).init();
        });
    };

})( jQuery, window , document );

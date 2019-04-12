/**
 * 带时分秒的时间控件选择器
 * @author
 */
Ext.define('baseUx.form.datetime.DateTimePicker', {
        extend: 'Ext.picker.Date',
        alias: 'widget.datetimepicker',
        alternateClassName: 'Ext.DateTimePicker',
        renderTpl: [
            '<div id="{id}-innerEl" role="grid">',
            '<div role="presentation" class="{baseCls}-header">',
            // the href attribute is required for the :hover selector to work in IE6/7/quirks
            '<a id="{id}-prevEl" class="{baseCls}-prev {baseCls}-arrow" href="#" role="button" title="{prevText}" hidefocus="on" ></a>',
            '<div class="{baseCls}-month" id="{id}-middleBtnEl">{%this.renderMonthBtn(values, out)%}</div>',
            // the href attribute is required for the :hover selector to work in IE6/7/quirks
            '<a id="{id}-nextEl" class="{baseCls}-next {baseCls}-arrow" href="#" role="button" title="{nextText}" hidefocus="on" ></a>',
            '</div>',
            '<table id="{id}-eventEl" class="{baseCls}-inner" cellspacing="0" role="grid">',
            '<thead role="presentation"><tr role="row">',
            '<tpl for="dayNames">',
            '<th role="columnheader" class="{parent.baseCls}-column-header" title="{.}">',
            '<div class="{parent.baseCls}-column-header-inner">{.:this.firstInitial}</div>',
            '</th>',
            '</tpl>',
            '</tr></thead>',
            '<tbody role="presentation"><tr role="row">',
            '<tpl for="days">',
            '{#:this.isEndOfWeek}',
            '<td role="gridcell" id="{[Ext.id()]}">',
            // the href attribute is required for the :hover selector to work in IE6/7/quirks
            '<a role="button" hidefocus="on" class="{parent.baseCls}-date" href="#"></a>',
            '</td>',
            '</tpl>',
            '</tr></tbody>',
            '</table>',
            '<tpl if="showToday">',
            '<div id="{id}-footerEl" role="presentation" style="background-color:#D9E5F3;border-top:1px solid #99BCE8;">',
            '<table class="{baseCls}-inner" cellspacing="0" role="grid">',
            '<tr role="row">',
            '<td colspan="1">',
            '{%this.renderHour(values, out)%}',
            '</td>',
            '<td colspan="1">',
            '{%this.renderMinute(values, out)%}',
            '</td>',
            '<td colspan="1">',
            '{%this.renderSecond(values, out)%}',
            '</td>',
            '</tr>',
            '<tr role="row"><td colspan="3" align="center">{%this.renderOkBtn(values, out)%}&nbsp;&nbsp;{%this.renderTodayBtn(values, out)%}</td></tr>',
            '</table>',
            '</div>',
            '</tpl>',
            '</div>',
            {
                firstInitial: function(value) {
                    return value.substr(0,1);
                },
                isEndOfWeek: function(value) {
                    // convert from 1 based index to 0 based
                    // by decrementing value once.
                    value--;
                    var end = value % 7 === 0 && value !== 0;
                    return end ? '</tr><tr role="row">' : '';
                },
                longDay: function(value){
                    return Ext.Date.format(value, this.longDayFormat);
                },
                renderHour: function(values, out) {
                    //out.push('<font style="float:left;">&nbsp</font>');
                    Ext.DomHelper.generateMarkup(values.$comp.hour.getRenderTree(), out);
                },
                renderMinute: function(values, out) {
                    //out.push('<font  style="float : left;font-weight:bold;">&nbsp:&nbsp&nbsp</font>');
                    Ext.DomHelper.generateMarkup(values.$comp.minute.getRenderTree(), out);
                },
                renderSecond: function(values, out) {
                    //out.push('<font style="float : left;font-weight:bold;">&nbsp:&nbsp&nbsp</font>');
                    Ext.DomHelper.generateMarkup(values.$comp.second.getRenderTree(), out);
                },
                renderTodayBtn: function(values, out) {
                    Ext.DomHelper.generateMarkup(values.$comp.todayBtn.getRenderTree(), out);
                },
                renderOkBtn: function(values, out) {
                    Ext.DomHelper.generateMarkup(values.$comp.okBtn.getRenderTree(), out);
                },
                renderMonthBtn: function(values, out) {
                    Ext.DomHelper.generateMarkup(values.$comp.monthBtn.getRenderTree(), out);
                }
            }
        ],
        /**
         * 创建时分秒控件
         */
        beforeRender: function () {
            var me = this;
            me.hour = Ext.create('Ext.form.field.Number', {
                minValue: 0,
                maxValue: 23,
                width: 60
            });

            me.minute = Ext.create('Ext.form.field.Number', {
                minValue: 0,
                maxValue: 59,
                width: 60
            });

            me.second = Ext.create('Ext.form.field.Number', {
                minValue: 0,
                maxValue: 59,
                width: 60
            });
            me.okBtn = new Ext.button.Button({
                text: 'OK',
                handler: function () {
                    me.fireEvent('select', me, me.getValue());
                    me.onSelect();
                }
            });

            me.callParent();
        },

        /**
         * 渲染时分秒控件
         */
        finishRenderChildren: function () {
            this.callParent();
            /**--------------------------------------*/
            this.hour.finishRender();
            this.minute.finishRender();
            this.second.finishRender();
            this.okBtn.finishRender();
            /**--------------------------------------*/
        },
        /**
         * Update the contents of the picker
         * @private
         * @param {Date} date The new date
         * @param {Boolean} forceRefresh True to force a full refresh
         */
        update : function(date, forceRefresh){
            var me = this;
            /**-----------设置时分秒----------------*/
            date.setHours(me.hour.getValue());
            date.setMinutes(me.minute.getValue());
            date.setSeconds(me.second.getValue());
            /**-----------设置时分秒----------------*/

            me.callParent(arguments);
        },
        getValue:function() {
            var me = this;
            var value=me.callParent(arguments);
            value.setHours(me.hour.getValue());
            value.setMinutes(me.minute.getValue());
            value.setSeconds(me.second.getValue());
            return value;
        }
    },
    function(){
        var proto = this.prototype;
        Ext.Date.dayNames = [
            "日",
            "一",
            "二",
            "三",
            "四",
            "五",
            "六"
        ];
        proto.dayNames = Ext.Date.dayNames;

        proto.format = Ext.Date.defaultFormat;
    }
);
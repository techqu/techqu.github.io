Ext.define('idbcloud.form.field.text', {
    extend:'Ext.form.field.Trigger',
    alias: 'widget.idbtextfield',
    trigger1Cls: Ext.baseCSSPrefix + 'form-clear-trigger',
    isNull:false,
    onTriggerClick: function() {
        this.isNull=true;
        this.setValue(null);
    },
    onRender: function() {
        var me = this;
        me.callParent(arguments);
        me.triggerEl.elements[0].dom.title='设置为 NULL';
    },
    getValue:function() {
        var value=this.callParent();
        if (this.isNull && value==='') {
            return null;
        }else{
            return value;
        }
    },
    setValue:function(value) {
        this.isNull=(value==null);
        this.callParent(arguments);
    },
    listeners:{
        dirtychange:function( o, isDirty, eOpts){
            //this.isNull=false;
        }
    }
});
Ext.define('idbcloud.form.field.date', {
    extend:'Ext.form.field.Date',
    alias: 'widget.idbdatefield',
    format: 'Y-m-d',
    onExpand: function() {
        var me = this;
        var value=  new Date();
        if (me.getValue()){
            value=new Date(Date.parse(me.getValue().replace(/-/g,   "/")));
        }
        me.picker.setValue(value);
    },
    getValue:function() {
        var me = this;
        return me.getRawValue();
    }
});
Ext.define('idbcloud.form.field.bit', {
    extend:'Ext.form.field.ComboBox',
    alias: 'widget.idbbitfield',
    store: Ext.create('Ext.data.Store', {
        fields: ['value'],
        data : [
            {"value":"0"},
            {"value":"1"}
        ]
    }),
    queryMode: 'local',
    displayField: 'value',
    valueField: 'value'
});



Ext.define('idbcloud.form.field.textarea', {
    extend:'Ext.form.field.TextArea',
    alias: ['widget.idbtextarea'],
    requires: ['Ext.dom.Helper', 'Ext.util.ClickRepeater', 'Ext.layout.component.field.Trigger'],
    alternateClassName: ['Ext.form.TriggerField', 'Ext.form.TwinTriggerField', 'Ext.form.Trigger'],
    trigger1Cls: Ext.baseCSSPrefix + 'form-clear-trigger',
    isNull:false,
    onTriggerClick: function() {
        this.isNull=true;
        this.setValue(null);
    },
    getValue:function() {
        if (this.isNull) {
            return null;
        }else{
            return this.callParent();
        }
    },
    setValue:function(value) {
        this.isNull=(value==null);
        this.callParent(arguments);
    },
    childEls: [
        { name: 'triggerCell', select: '.' + Ext.baseCSSPrefix + 'trigger-cell' },
        { name: 'triggerEl', select: '.' + Ext.baseCSSPrefix + 'form-trigger' },
        'triggerWrap',
        'inputCell'
    ],
    triggerBaseCls: Ext.baseCSSPrefix + 'form-trigger',
    triggerWrapCls: Ext.baseCSSPrefix + 'form-trigger-wrap',
    triggerNoEditCls: Ext.baseCSSPrefix + 'trigger-noedit',
    hideTrigger: false,
    editable: true,
    readOnly: false,
    repeatTriggerClick: false,
    autoSize: Ext.emptyFn,
    monitorTab: true,
    mimicing: false,
    triggerIndexRe: /trigger-index-(\d+)/,
    extraTriggerCls: '',
    componentLayout: 'triggerfield',
    initComponent: function() {
        this.wrapFocusCls = this.triggerWrapCls + '-focus';
        this.callParent(arguments);
    },

    getSubTplMarkup: function(values) {
        var me = this,
            childElCls = values.childElCls, // either '' or ' x-foo'
            field = me.callParent(arguments);
        return '<table id="' + me.id + '-triggerWrap" class="' + Ext.baseCSSPrefix + 'form-trigger-wrap' + childElCls + '" cellpadding="0" cellspacing="0"><tbody><tr>' +
            '<td height="78px" id="' + me.id + '-inputCell" class="' + Ext.baseCSSPrefix + 'form-trigger-input-cell' + childElCls + '">' + field + '</td>' +
            me.getTriggerMarkup() +
            '</tr></tbody></table>';
    },

    getSubTplData: function(){
        var me = this,
            data = me.callParent(),
            readOnly = me.readOnly === true,
            editable = me.editable !== false;

        return Ext.apply(data, {
            editableCls: (readOnly || !editable) ? ' ' + me.triggerNoEditCls : '',
            readOnly: !editable || readOnly,
            fieldStyle:'height:100%;z-index:9999'
        });
    },

    getLabelableRenderData: function() {
        var me = this,
            triggerWrapCls = me.triggerWrapCls,
            result = me.callParent(arguments);

        return Ext.applyIf(result, {
            triggerWrapCls: triggerWrapCls,
            triggerMarkup: me.getTriggerMarkup()
        });
    },

    getTriggerMarkup: function() {
        var me = this,
            i = 0,
            hideTrigger = (me.readOnly || me.hideTrigger),
            triggerCls,
            triggerBaseCls = me.triggerBaseCls,
            triggerConfigs = [],
            unselectableCls = Ext.dom.Element.unselectableCls,
            style = 'width:' + me.triggerWidth + 'px;' + (hideTrigger ? 'display:none;' : ''),
            cls = me.extraTriggerCls + ' ' + Ext.baseCSSPrefix + 'trigger-cell ' + unselectableCls;

        // TODO this trigger<n>Cls API design doesn't feel clean, especially where it butts up against the
        // single triggerCls config. Should rethink this, perhaps something more structured like a list of
        // trigger config objects that hold cls, handler, etc.
        // triggerCls is a synonym for trigger1Cls, so copy it.
        if (!me.trigger1Cls) {
            me.trigger1Cls = me.triggerCls;
        }

        // Create as many trigger elements as we have trigger<n>Cls configs, but always at least one
        for (i = 0; (triggerCls = me['trigger' + (i + 1) + 'Cls']) || i < 1; i++) {
            triggerConfigs.push({
                tag: 'td',
                valign: 'bottom',
                title:'设置为 NULL',
                cls: cls,
                style: style,
                cn: {
                    cls: [Ext.baseCSSPrefix + 'trigger-index-' + i, triggerBaseCls, triggerCls].join(' '),
                    role: 'button'
                }
            });
        }
        triggerConfigs[0].cn.cls += ' ' + triggerBaseCls + '-first';

        return Ext.DomHelper.markup(triggerConfigs);
    },

    disableCheck: function() {
        return !this.disabled;
    },

    // @private
    beforeRender: function() {
        var me = this,
            triggerBaseCls = me.triggerBaseCls,
            tempEl;

        /**
         * @property {Number} triggerWidth
         * Width of the trigger element. Unless set explicitly, it will be
         * automatically calculated through creating a temporary element
         * on page. (That will be done just once per app run.)
         * @private
         */
        if (!me.triggerWidth) {
            tempEl = Ext.getBody().createChild({
                style: 'position: absolute;',
                cls: Ext.baseCSSPrefix + 'form-trigger'
            });
            Ext.form.field.Trigger.prototype.triggerWidth = tempEl.getWidth();
            tempEl.remove();
        }

        me.callParent();

        if (triggerBaseCls != Ext.baseCSSPrefix + 'form-trigger') {
            // we may need to change the selectors by which we extract trigger elements if is triggerBaseCls isn't the value we
            // stuck in childEls
            me.addChildEls({ name: 'triggerEl', select: '.' + triggerBaseCls });
        }

        // these start correct in the fieldSubTpl:
        me.lastTriggerStateFlags = me.getTriggerStateFlags();
    },

    onRender: function() {
        var me = this;

        me.callParent(arguments);

        me.doc = Ext.getDoc();
        me.initTrigger();
    },
    getTriggerWidth: function() {
        var me = this,
            totalTriggerWidth = 0;

        if (me.triggerWrap && !me.hideTrigger && !me.readOnly) {
            totalTriggerWidth = me.triggerEl.getCount() * me.triggerWidth;
        }
        return totalTriggerWidth;
    },

    setHideTrigger: function(hideTrigger) {
        if (hideTrigger != this.hideTrigger) {
            this.hideTrigger = hideTrigger;
            this.updateLayout();
        }
    },
    setEditable: function(editable) {
        if (editable != this.editable) {
            this.editable = editable;
            this.updateLayout();
        }
    },
    setReadOnly: function(readOnly) {
        var me = this,
            old = me.readOnly;

        me.callParent(arguments);
        if (readOnly != old) {
            me.updateLayout();
        }
    },

    // @private
    initTrigger: function() {
        var me = this,
            triggerWrap = me.triggerWrap,
            triggerEl = me.triggerEl,
            disableCheck = me.disableCheck,
            els, eLen, el, e, idx;

        if (me.repeatTriggerClick) {
            me.triggerRepeater = new Ext.util.ClickRepeater(triggerWrap, {
                preventDefault: true,
                handler: me.onTriggerWrapClick,
                listeners: {
                    mouseup: me.onTriggerWrapMouseup,
                    scope: me
                },
                scope: me
            });
        } else {
            me.mon(triggerWrap, {
                click: me.onTriggerWrapClick,
                mouseup: me.onTriggerWrapMouseup,
                scope: me
            });
        }

        triggerEl.setVisibilityMode(Ext.Element.DISPLAY);
        triggerEl.addClsOnOver(me.triggerBaseCls + '-over', disableCheck, me);

        els  = triggerEl.elements;
        eLen = els.length;

        for (e = 0; e < eLen; e++) {
            el = els[e];
            idx = e+1;
            el.addClsOnOver(me['trigger' + (idx) + 'Cls'] + '-over', disableCheck, me);
            el.addClsOnClick(me['trigger' + (idx) + 'Cls'] + '-click', disableCheck, me);
        }

        triggerEl.addClsOnClick(me.triggerBaseCls + '-click', disableCheck, me);

    },

    // @private
    onDestroy: function() {
        var me = this;
        Ext.destroyMembers(me, 'triggerRepeater', 'triggerWrap', 'triggerEl');
        delete me.doc;
        me.callParent();
    },

    // @private
    onFocus: function() {
        var me = this;
        me.callParent(arguments);
        if (!me.mimicing) {
            me.bodyEl.addCls(me.wrapFocusCls);
            me.mimicing = true;
            me.mon(me.doc, 'mousedown', me.mimicBlur, me, {
                delay: 10
            });
            if (me.monitorTab) {
                me.on('specialkey', me.checkTab, me);
            }
        }
    },

    // @private
    checkTab: function(me, e) {
        if (!this.ignoreMonitorTab && e.getKey() == e.TAB) {
            this.triggerBlur();
        }
    },
    getTriggerStateFlags: function () {
        var me = this,
            state = 0;

        if (me.readOnly) {
            state += 1;
        }
        if (me.editable) {
            state += 2;
        }
        if (me.hideTrigger) {
            state += 4;
        }
        return state;
    },
    onBlur: Ext.emptyFn,

    // @private
    mimicBlur: function(e) {
        if (!this.isDestroyed && !this.bodyEl.contains(e.target) && this.validateBlur(e)) {
            this.triggerBlur(e);
        }
    },

    // @private
    triggerBlur: function(e) {
        var me = this;
        me.mimicing = false;
        me.mun(me.doc, 'mousedown', me.mimicBlur, me);
        if (me.monitorTab && me.inputEl) {
            me.un('specialkey', me.checkTab, me);
        }
        Ext.form.field.Trigger.superclass.onBlur.call(me, e);
        if (me.bodyEl) {
            me.bodyEl.removeCls(me.wrapFocusCls);
        }
    },
    validateBlur: function(e) {
        return true;
    },
    onTriggerWrapClick: function() {
        var me = this,
            targetEl, match,
            triggerClickMethod,
            event;

        event = arguments[me.triggerRepeater ? 1 : 0];
        if (event && !me.readOnly && !me.disabled) {
            targetEl = event.getTarget('.' + me.triggerBaseCls, null);
            match = targetEl && targetEl.className.match(me.triggerIndexRe);

            if (match) {
                triggerClickMethod = me['onTrigger' + (parseInt(match[1], 10) + 1) + 'Click'] || me.onTriggerClick;
                if (triggerClickMethod) {
                    triggerClickMethod.call(me, event);
                }
            }
        }
    },
    onTriggerWrapMouseup: Ext.emptyFn
});


Ext.define('idbcloud.form.field.mixEditor', {
    extend:'Ext.form.field.TextArea',
    alias: ['widget.mixEditor'],
    requires: ['Ext.dom.Helper', 'Ext.util.ClickRepeater', 'Ext.layout.component.field.Trigger'],
    alternateClassName: ['Ext.form.TriggerField', 'Ext.form.TwinTriggerField', 'Ext.form.Trigger'],
    trigger1Cls: Ext.baseCSSPrefix + 'form-clear-trigger',
    isNull:false,
    ccKeyValue:'',
//
    onTriggerClick: function() {
        this.isNull=true;
        this.setValue(null);
    },
    getValue:function() {
        if (this.isNull) {
            return null;
        }else{

            return this.callParent();
        }
    },
    setValue:function(value) {
        this.isNull=(value==null);
        this.callParent(arguments);
    },
    childEls: [
        { name: 'triggerCell', select: '.' + Ext.baseCSSPrefix + 'trigger-cell' },
        { name: 'triggerEl', select: '.' + Ext.baseCSSPrefix + 'form-trigger' },
        'triggerWrap',
        'inputCell'
    ],
    triggerBaseCls: Ext.baseCSSPrefix + 'form-trigger',
    triggerWrapCls: Ext.baseCSSPrefix + 'form-trigger-wrap',
    triggerNoEditCls: Ext.baseCSSPrefix + 'trigger-noedit',
    hideTrigger: false,
    editable: true,
    readOnly: false,
    repeatTriggerClick: false,
    autoSize: Ext.emptyFn,
    monitorTab: true,
    mimicing: false,
    triggerIndexRe: /trigger-index-(\d+)/,
    extraTriggerCls: '',
    componentLayout: 'triggerfield',
    initComponent: function() {
        this.wrapFocusCls = this.triggerWrapCls + '-focus';
        this.callParent(arguments);
    },

    getSubTplMarkup: function(values) {
        var me = this,
            childElCls = values.childElCls, // either '' or ' x-foo'
            field = me.callParent(arguments);

        var newField=field.replace('style="','style="overflow: hidden;"')

        return '<table id="' + me.id + '-triggerWrap" class="' + Ext.baseCSSPrefix +
            'form-trigger-wrap' + childElCls + '" cellpadding="0" cellspacing="0"><tbody><tr>' +
            '<td height="19px" id="' + me.id + '-inputCell" class="' + Ext.baseCSSPrefix +
            'form-trigger-input-cell' + childElCls + '">' + newField + '</td>' +
            me.getTriggerMarkup() +
            '</tr></tbody></table>';
    },

    getSubTplData: function(){
        var me = this,
            data = me.callParent(),
            readOnly = me.readOnly === true,
            editable = me.editable !== false;

        return Ext.apply(data, {
            editableCls: (readOnly || !editable) ? ' ' + me.triggerNoEditCls : '',
            readOnly: !editable || readOnly,
            fieldStyle:'height:100%;z-index:9999'
        });
    },

    getLabelableRenderData: function() {
        var me = this,
            triggerWrapCls = me.triggerWrapCls,
            result = me.callParent(arguments);

        return Ext.applyIf(result, {
            triggerWrapCls: triggerWrapCls,
            triggerMarkup: me.getTriggerMarkup()
        });
    },
    //清空按钮
    getTriggerMarkup: function() {
        var me = this,
            i = 0,
            hideTrigger = (me.readOnly || me.hideTrigger),
            triggerCls,
            triggerBaseCls = me.triggerBaseCls,
            triggerConfigs = [],
            unselectableCls = Ext.dom.Element.unselectableCls,
            style = 'width:' + me.triggerWidth + 'px;' + (hideTrigger ? 'display:none;' : ''),
            cls = me.extraTriggerCls + ' ' + Ext.baseCSSPrefix + 'trigger-cell ' + unselectableCls;

        // TODO this trigger<n>Cls API design doesn't feel clean, especially where it butts up against the
        // single triggerCls config. Should rethink this, perhaps something more structured like a list of
        // trigger config objects that hold cls, handler, etc.
        // triggerCls is a synonym for trigger1Cls, so copy it.
        if (!me.trigger1Cls) {
            me.trigger1Cls = me.triggerCls;
        }

        // Create as many trigger elements as we have trigger<n>Cls configs, but always at least one
        for (i = 0; (triggerCls = me['trigger' + (i + 1) + 'Cls']) || i < 1; i++) {
            triggerConfigs.push({
                tag: 'td',
                valign: 'bottom',
                title:"清空",
                cls: cls,
                style: style,
                cn: {
                    cls: [Ext.baseCSSPrefix + 'trigger-index-' + i, triggerBaseCls, triggerCls].join(' '),
                    role: 'button'
                }
            });
        }
        triggerConfigs[0].cn.cls += ' ' + triggerBaseCls + '-first';
        return Ext.DomHelper.markup(triggerConfigs);
    },

    disableCheck: function() {
        return !this.disabled;
    },

    // @private
    beforeRender: function() {
        var me = this,
            triggerBaseCls = me.triggerBaseCls,
            tempEl;

        /**
         * @property {Number} triggerWidth
         * Width of the trigger element. Unless set explicitly, it will be
         * automatically calculated through creating a temporary element
         * on page. (That will be done just once per app run.)
         * @private
         */
        if (!me.triggerWidth) {
            tempEl = Ext.getBody().createChild({
                style: 'position: absolute;',
                cls: Ext.baseCSSPrefix + 'form-trigger'
            });
            Ext.form.field.Trigger.prototype.triggerWidth = tempEl.getWidth();
            tempEl.remove();
        }

        me.callParent();

        if (triggerBaseCls != Ext.baseCSSPrefix + 'form-trigger') {
            // we may need to change the selectors by which we extract trigger elements if is triggerBaseCls isn't the value we
            // stuck in childEls
            me.addChildEls({ name: 'triggerEl', select: '.' + triggerBaseCls });
        }

        // these start correct in the fieldSubTpl:
        me.lastTriggerStateFlags = me.getTriggerStateFlags();
    },

    onRender: function() {
        var me = this;

        me.callParent(arguments);

        me.doc = Ext.getDoc();
        me.initTrigger();
    },
    getTriggerWidth: function() {
        var me = this,
            totalTriggerWidth = 0;

        if (me.triggerWrap && !me.hideTrigger && !me.readOnly) {
            totalTriggerWidth = me.triggerEl.getCount() * me.triggerWidth;
        }
        return totalTriggerWidth;
    },

    setHideTrigger: function(hideTrigger) {
        if (hideTrigger != this.hideTrigger) {
            this.hideTrigger = hideTrigger;
            this.updateLayout();
        }
    },
    setEditable: function(editable) {
        if (editable != this.editable) {
            this.editable = editable;
            this.updateLayout();
        }
    },
    setReadOnly: function(readOnly) {
        var me = this,
            old = me.readOnly;

        me.callParent(arguments);
        if (readOnly != old) {
            me.updateLayout();
        }
    },

    // @private
    initTrigger: function() {
        var me = this,
            triggerWrap = me.triggerWrap,
            triggerEl = me.triggerEl,
            disableCheck = me.disableCheck,
            els, eLen, el, e, idx;

        if (me.repeatTriggerClick) {
            me.triggerRepeater = new Ext.util.ClickRepeater(triggerWrap, {
                preventDefault: true,
                handler: me.onTriggerWrapClick,
                listeners: {
                    mouseup: me.onTriggerWrapMouseup,
                    scope: me
                },
                scope: me
            });
        } else {
            me.mon(triggerWrap, {
                click: me.onTriggerWrapClick,
                mouseup: me.onTriggerWrapMouseup,
                scope: me
            });
        }

        triggerEl.setVisibilityMode(Ext.Element.DISPLAY);
        triggerEl.addClsOnOver(me.triggerBaseCls + '-over', disableCheck, me);

        els  = triggerEl.elements;
        eLen = els.length;

        for (e = 0; e < eLen; e++) {
            el = els[e];
            idx = e+1;
            el.addClsOnOver(me['trigger' + (idx) + 'Cls'] + '-over', disableCheck, me);
            el.addClsOnClick(me['trigger' + (idx) + 'Cls'] + '-click', disableCheck, me);
        }

        triggerEl.addClsOnClick(me.triggerBaseCls + '-click', disableCheck, me);

    },

    // @private
    onDestroy: function() {
        var me = this;
        Ext.destroyMembers(me, 'triggerRepeater', 'triggerWrap', 'triggerEl');
        delete me.doc;
        me.callParent();
    },

    // @private
    onFocus: function() {
        var me = this;
        me.callParent(arguments);
        if (!me.mimicing) {
            me.bodyEl.addCls(me.wrapFocusCls);
            me.mimicing = true;
            me.mon(me.doc, 'mousedown', me.mimicBlur, me, {
                delay: 10
            });
            if (me.monitorTab) {
                me.on('specialkey', me.checkTab, me);
            }
        }
    },

    // @private
    checkTab: function(me, e) {
        if (!this.ignoreMonitorTab && e.getKey() == e.TAB) {
            this.triggerBlur();
        }
    },
    getTriggerStateFlags: function () {
        var me = this,
            state = 0;

        if (me.readOnly) {
            state += 1;
        }
        if (me.editable) {
            state += 2;
        }
        if (me.hideTrigger) {
            state += 4;
        }
        return state;
    },
    onBlur: Ext.emptyFn,

    // @private
    mimicBlur: function(e) {
        if (!this.isDestroyed && !this.bodyEl.contains(e.target) && this.validateBlur(e)) {
            this.triggerBlur(e);
        }
    },

    // @private
    triggerBlur: function(e) {
        var me = this;
        me.mimicing = false;
        me.mun(me.doc, 'mousedown', me.mimicBlur, me);
        if (me.monitorTab && me.inputEl) {
            me.un('specialkey', me.checkTab, me);
        }
        Ext.form.field.Trigger.superclass.onBlur.call(me, e);
        if (me.bodyEl) {
            me.bodyEl.removeCls(me.wrapFocusCls);
        }
    },
    validateBlur: function(e) {
        return true;
    },
    onTriggerWrapClick: function() {
        var me = this,
            targetEl, match,
            triggerClickMethod,
            event;

        event = arguments[me.triggerRepeater ? 1 : 0];
        if (event && !me.readOnly && !me.disabled) {
            targetEl = event.getTarget('.' + me.triggerBaseCls, null);
            match = targetEl && targetEl.className.match(me.triggerIndexRe);

            if (match) {
                triggerClickMethod = me['onTrigger' + (parseInt(match[1], 10) + 1) + 'Click'] || me.onTriggerClick;
                if (triggerClickMethod) {
                    triggerClickMethod.call(me, event);
                }
            }
        }
    },
    onTriggerWrapMouseup: Ext.emptyFn
});



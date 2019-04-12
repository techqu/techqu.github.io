CodeMirror.commands.autocomplete = function (cm) {
    CodeMirror.showHint(cm, CodeMirror.hint.sql);
};
Ext.define('Ext.ux.form.field.CodeMirror', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.codemirror',
    alternateClassName: 'Ext.form.CodeMirror',

    value:null,
    name:null,
    readOnly:false,
    initComponent : function(){
        var me = this;

        me.addEvents(
            'keyevent'
        );

        me.callParent(arguments);
        me.on('resize', function(o, width, height, oldWidth, oldHeight, eOpts) {
            if (me.editor) {
                document.getElementById(me.editorInnerId).style.height=height;
                me.editor.refresh();
            }
        }, me);

    },

    finishRenderChildren: function () {
        this.callParent();
    },

    onRender: function() {
        var me = this;
        me.inputEl = document.createElement('textarea');
        document.body.appendChild(me.inputEl);
        me.editor = CodeMirror.fromTextArea(me.inputEl, {
            lineNumbers: true,
            matchBrackets: true,
            fixedGutter:false,
            readOnly:me.readOnly,
            styleActiveLine: true,
            autofocus: true,
            hintOptions: {
            	tables: {
            		tableName: {columnName: null}
            	}
            },
            mode: getCmMode(_DB_TYPE),
            escape: true, //是否对表和列默认添加转义符
            extraKeys: {
                "Ctrl-Space": "autocomplete",
                "F6": "autocomplete",
                "F8":function(){
                	 executeSQL();
                },
                "F9":function(){
                	formatSql();
               }
            },
            indentUnit: 4,
            onKeyEvent:function(editor, event){
                event.cancelBubble = true; // fix suggested by koblass user on Sencha forums (http://www.sencha.com/forum/showthread.php?167047-Ext.ux.form.field.CodeMirror-for-Ext-4.x&p=862029&viewfull=1#post862029)
                me.fireEvent('keyevent', me, event);
            }
        });
        me.editor.on("change", function(cm, change) {
        	if (change.origin == "+input") {
        		var text = change.text;
        		if (!ignoreToken(text)) {
        			setTimeout(function() { cm.execCommand("autocomplete"); }, 20);
        		}
        	}
        });
        if (me.value) {
            me.editor.setValue(me.value);
        }
        me.editorInnerId=Ext.id();
        me.editor.display.input.parentNode.parentNode.id=me.editorInnerId;
        me.editor.display.wrapper.style.height="100%";//DOCTYPE HTML5 兼容
        me.contentEl=me.editorInnerId;
        me.callParent(arguments);
        me.rendered = true;
    },

    setValue: function(value){
        var me = this;
        me.rawValue = value;
        if(me.editor)
            me.editor.setValue(value);
        return me;
    },

    getSubmitValue: function(){
        var me = this;
        return me.getValue();
    },

    getValue: function(){
        var me = this;

        if(me.editor)
            return me.editor.getValue();
        else
            return null;
    },

    onDestroy: function(){
        var me = this;
        if(me.rendered){
            try {
                Ext.EventManager.removeAll(me.editor);
                for (prop in me.editor) {
                    if (me.editor.hasOwnProperty(prop)) {
                        delete me.editor[prop];
                    }
                }
            }catch(e){}
        }
        me.callParent();
    }
});

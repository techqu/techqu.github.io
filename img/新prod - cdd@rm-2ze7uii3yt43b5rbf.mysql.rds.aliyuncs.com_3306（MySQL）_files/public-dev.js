Ext.ns('IDB');


Array.prototype.EACH_END = "$$$^&*!$$$";
Array.prototype.each = function(fn , scope) {
    var len = this.length;
    for(var i = 0 ; i < len ; i++) {
        var result = fn.call(scope || this, this[i] , i);
        if(result === this.EACH_END) {
            break;
        }
    }
};
Array.prototype.contains = function(v) {
    var len = this.length;
    for(var i = 0 ; i < len ; i++) {
        if(this[i] === v) {
            return true;
        }
    }
    return false;
};
String.prototype.contains = function(str) {
    return this.indexOf(str) !== -1;
};
String.prototype.startsWith = function (str){
    return this.slice(0, str.length) === str;
};
String.prototype.filterNull = function() {
    if(this == 'null') {
        return null;
    }
    return this;
};
function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    return s.join("");
}

var commons_tools = {
    getSizeName:function(size , fixed) {
        size = size*1;
        if(size) {
            fixed = fixed || 0;
            if(size < 1024) {
                return size.toFixed(fixed) + "B";
            }
            if(size < 1024 * 1024) {
                return (parseFloat(size) / 1024).toFixed(fixed) + "KB";
            }
            if(size < 1024 * 1024 * 1024) {
                return (parseFloat(size) / 1024 / 1024).toFixed(fixed) + "MB";
            }
            if(size < 1024 * 1024 * 1024 * 1024) {
                return (parseFloat(size) / 1024 / 1024 / 1024).toFixed(fixed) + "GB";
            }
            return (parseFloat(size) / 1024 / 1024 / 1024 / 1024).toFixed(fixed) + "TB";
        }else {
            return "0B";
        }
    },
    numberWithCommas: function (num) {//将整数1234567转换为1,234,567
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
};
var objectTypeMap = {
    table : $pub.table,
    view : $pub.view,
    progobjs: $main.title.programmingObject
};

var objectDisplayTypeMap = {
    table : $pub.table,
    view : $pub.view,
    func : $pub.function,
    'function' : $pub.function,
    func_scalar: $pub.function,
    func_table: $pub.function,
    func_view: $pub.function,
    function_scalar: $pub.function,
    function_table: $pub.function,
    function_view: $pub.function,
    proc : $pub.procedure,
    procedure: $pub.procedure,
    event : $pub.event,
    trigger : $pub.trigger
};

var operationMap = {
    'create' : $pub.new,
    'change' : $pub.modify,
    'delete' : $pub.delete
};
var renderSize = function(v) {
    if(v >= 1024 * 1024 * 1024) {
        return (v / 1024 / 1024 / 1024).toFixed(2) + "G";
    }else if(v >= 1024 * 1024) {
        return (v / 1024 / 1024).toFixed(2) + "M";
    }else if(v >= 1024) {
        return (v / 1024).toFixed(0) + "K";
    }else {
        return v + "B";
    }
};
var getObjectCNameByEName = function(name) {
    return objectDisplayTypeMap[name];
};
function downLoadFileByURL(url) {
    var iframeEle = document.createElement("iframe");
    iframeEle.src = url;
    iframeEle.style.display = "none";
    document.body.appendChild(iframeEle);
}
String.prototype.htmlDecode = function() {
    return Ext.util.Format.htmlDecode(this);
};
String.prototype.htmlEncode = function() {
    return Ext.util.Format.htmlEncode(this);
};
String.prototype.replaceAll = function(reallyDo, replaceWith, ignoreCase) {
    if (!RegExp.prototype.isPrototypeOf(reallyDo)) {
        return this.replace(new RegExp(reallyDo, (ignoreCase ? "gi": "g")), replaceWith);
    } else {
        return this.replace(reallyDo, replaceWith);
    }
};
String.prototype.byteLength = function () {
    var l = 0;
    for (var i = 0; i < this.length; i++) {
        c = this.charCodeAt(i);
        if (c < 256) {
            l = l + 1;
        } else {//汉字
            l = l + 2;
        }
    }
    return l;
};
Ext.define('IDB.FormPanel' , {
    extend:'Ext.form.Panel',
    config:{
        //border:true,
        buttonAlign:'center',
        timeout:120,
        defaults:{
            autoFitErrors:false,//自动调整错误提示时候的宽度
            labelSeparator:' : ',
            labelWidth:80,
            allowBlank:false,
            labelAlign:'right',
            xtype:'textfield',
            msgTarget:'side'
        }
    },
    constructor:function(config) {
        config = config || {};
        var defaults = null;
        if(config.defaults) {
            defaults = config.defaults;
            Ext.applyIf(defaults, this.config.defaults);
        }
        Ext.applyIf(config, this.config);
        if(defaults) {
            Ext.apply(config.defaults, defaults);
        }
        this.callParent([config]);
    },
    submit:function(config) {
        if(config.submitCallBack) {
            if(!config.success) {
                config.success = function(thiz, response) {
                    config.submitCallBack.call(this , thiz , response , true);
                }
            }
            if(!config.failure) {
                config.failure = function(thiz, response) {
                    config.submitCallBack.call(this , thiz , response , false);
                }
            }
        }
        this.callParent([config]);
    }
});

Ext.define('IDB.TabPanel' , {
    extend:'Ext.tab.Panel',
    config:{
        activeTab:0
    },
    constructor:function(config) {
        config = config || {};
        Ext.applyIf(config, this.config);
        this.callParent([config]);
    }
});

Ext.define('IDB.JsonStore' , {
    extend:'Ext.data.Store',
    config:{
        proxy:{
            type:'ajax',
            reader:{
                root:'root'
            }
        }
    },
    constructor:function(config) {
        config = config || {};
        Ext.applyIf(config, this.config);
        this.callParent([config]);
    }
});
Ext.define('IDB.CommonBoxStore' , {
    extend:'Ext.data.Store',
    autoLoad:true,
    autoDestroy:true,
    config:{
        proxy:{
            type:'ajax',
            reader:{
                root:'root',
                idProperty:'data'
            }
        },
        fields:['data' , 'label'],
        listeners:{
            beforeload:function(store , operation , opts) {
                if(operation.params && !operation.params.panelKey) {
                    operation.params.panelKey = getPaneKey();
                }else if(!operation.params) {
                    operation.params = {panelKey:getPaneKey()}
                }
                if(!operation.params.dbName && store.dbName) {
                    operation.params.dbName = store.dbName;
                }
            }
        }
    },
    constructor:function(config) {
        config = config || {};
        Ext.applyIf(config , this.config);
        if(config.url) {
            var nowUrl =  config.url;
            if(nowUrl.indexOf("panelKey") == -1) {
                if(nowUrl.indexOf("?") != -1) {
                    nowUrl += '&';
                }else {
                    nowUrl += '?';
                }
                nowUrl += 'panelKey=' + getPaneKey();
            }
            config.proxy.url = nowUrl;
        }
        this.callParent([config]);
    }
});
Ext.define('IDB.CommonBox' , {
    extend:'Ext.form.field.ComboBox',
    type:'idbCombo',
    config:{
        listConfig:{
            emptyText: $pub.pleaseSelect,
            maxHeigh:400
        },
        triggerAction:'all',
        displayField:'label',
        valueField:'data',
        queryMode:'local',
        forceSelection:true,
        typeAhead:true,
        xtype:'combo'
    },
    defaultListeners: {
        select:function(combo,record,eOpts) {
            combo.selectCallBack(combo , record);
        }
    },
    selectCallBack:function(combo,record) {},
    constructor:function(config) {
        config = config || {};
        Ext.applyIf(config , this.config);
        if(!config.store && config.url) {
            config.store = new IDB.CommonBoxStore({url:config.url});
        }
        if(!config.listeners) {
            config.listeners = this.defaultListeners;
        }else {
            Ext.applyIf(config.listeners , this.defaultListeners);
        }
        var me = this;
        this.callParent([config]);

        this.store.on('load' , function() {
            if(config.loadSelectFirst) {
                me.loadSelect(me);
            }
            if(config.loadCallBack) {
                config.loadCallBack.call(me , me);
            }
        });
    },
    loadSelect:function(combo) {
        combo.selectFirst();
    },
    selectFirst:function() {
        if(this.store.getCount() > 0) {
            var record = this.store.first();
            if(record) {
                this.setValue(record.get('data'));
            }
        }
    }
});

Ext.define('IDB.TreeStore' , {
    extend:'Ext.data.TreeStore',
    constructor:function(config) {
        var defaultConfig = {
            autoLoad:true,
            root:{
                text: $pub.rootNode,expanded: true
            },
            proxy:{
                type:'ajax',
                reader:{
                    type: 'json' ,
                    root:'root'
                }
            }
        };
        config = config || {};
        Ext.applyIf(config , defaultConfig);
        if(config.url && !config.proxy.url) {
            config.proxy.url = config.url;
        }
        this.callParent([config]);
    },
    listeners:{
        beforeload:function(store , operation , opts) {
            if(operation.params && !operation.params.panelKey) {
                operation.params.panelKey = getPaneKey();
            }else {
                operation.params = {panelKey:getPaneKey()}
            }
            if(!operation.params.dbName && store.dbName) {
                operation.params.dbName = store.dbName;
            }
            if(!operation.params.tableGroupName && store.tableGroupName) {
                operation.params.tableGroupName = store.tableGroupName;
            }
        }
    }
});
Ext.define('IDB.Window' , {
    extend:'Ext.window.Window',
    constructor:function(config) {
        var defaultConfig = {
            modal:true,layout:'fit',closable:false,buttonAlign:'center'
        };
        Ext.applyIf(config , defaultConfig);
        this.callParent([config]);
        this.show();
    }
});
Ext.define('Ext.ux.grid.column.RadioColumn', {
    extend: 'Ext.grid.column.CheckColumn',

    alternateClassName: 'Ext.ux.RadioColumn',

    alias: 'widget.radiocolumn',

    /**
     * @cfg {String} groupField
     *
     * Name of the field used for radio groups. If left undefined, this will default to the store's
     * {@link Ext.data.Store#groupField}, and if this is undefined as well, then the whole data set
     * will be considered as one and only group.
     */
    groupField: undefined,

    /**
     * @cfg {Boolean}
     *
     * True to allow unchecking an item by click on it when it is selected. If left to false, then
     * an item can only be deselected by selecting another one in the group.
     */
    allowUncheck: false,

    renderer : function(value, meta) {
        var cssPrefix = Ext.baseCSSPrefix,
            cls = [
                cssPrefix + 'form-radio', // for radio image
                cssPrefix + 'form-field' // for disabled style
            ];

        if (this.disabled) {
            meta.tdCls += ' ' + this.disabledCls;
        }
        if (value) {
            meta.tdCls += ' ' + cssPrefix + 'form-cb-checked';
        }

        return '<img class="' + cls.join(' ') + '" src="' + Ext.BLANK_IMAGE_URL + '"/>';
    },

    initComponent: function() {
        this.addEvents(
            /**
             * @event
             *
             * Fires when the selected row in a group changes. This
             *
             * @param {Ext.ux.grid.column.RadioColumn} this RadioColumn
             * @param {Integer} rowIndex The selected row index.
             * @param {Ext.data.Record} selectedRecord The selected record.
             * @param {Mixed} group Value of the {@link #groupField}. If `groupField` is not defined,
             * this will be `undefined`.
             */
            'radiocheckchange'
        );

        this.callParent(arguments);

        this.on({
            scope: this,
            checkchange: this.onCheckChange,
            beforecheckchange: this.onBeforeCheckChange
        });
    },

    // private
    onBeforeCheckChange: function(col, index, checked) {
        if (!checked && !this.allowUncheck) {
            return false;
        }
    },

    // private
    onCheckChange: function(col, index, checked) {

        if (!checked) {
            return;
        }

        var dataIndex = this.dataIndex,
            grid = this.up('tablepanel'),
            store = grid.getStore(),
            record = store.getAt(index),
            groupField = this.groupField || store.groupField,
            group = groupField && record.get(groupField) || undefined,
            groupItems = group
                ? store.query(groupField, group).items
                : store.getRange(),
            i = groupItems.length,
            r;

        while (i--) {
            r = groupItems[i];
            if (r !== record) {
                r.set(dataIndex, false);
            }
        }

        this.fireEvent('radiocheckchange', this, index, record, group);
    }
});
var wsAjax = function(config) {
    var timeoutValue = config.timeout || (3600000 * 4);
    if(!config.params) {
        config.params = {panelKey:getPaneKey()};
    }else if(!config.params.panelKey) {
        config.params.panelKey = getPaneKey();
    }
    if(!config.params) {
        config.params = {panelKey:getPaneKey() , token:getUserToken()}
    }else {
        if(!config.params.panelKey) {
            config.params.panelKey = getPaneKey();
        }
        if(!config.params.token) {
            config.params.token = getUserToken();
        }
    }
    if(config.url && !config.onlyUrl && config.url.indexOf("onlyUrl=true") === -1) {
        if(url_namespace) {
            config.url = "/" + url_namespace + config.url;
        }
    }
    config.params.serverName = window.location.host;
    config.params.protocol = window.location.protocol;
    var successMethod = config['success'];
    var failureMethod = config['failure'];
    var result = {};
    var init_result = result;
    var url = "ws://" + window.location.host + "/websocket/wsMockLongAjax";
    var startTime = 0 , times = 0;
    var ws = new DMSWebSocket(url , {
        onmessage : function(evt) {
            consoleLog("第(" + (++times) + ")次 = " + evt.data);
            var json = JSON.parse(evt.data);
            if(json.type === 'data') {
                result = json;
                //ws.close();//关闭连接
                ws.send(JSON.stringify({type:'heartbeat' , status:'end'}));
                setTimeout(function() {
                    if(!ws.isClosed()) {
                        //result = {success:false,failure:true,root:$ws.netWorkFailure};
                        ws.close();
                    }
                } , 1000 * 12);
            }else if(json.type === 'heartbeat') {
                var now = new Date().getTime();
                if(now - startTime > timeoutValue) {
                    ws.close();
                }else if(json['status'] === 'ok') {
                    ws.send(JSON.stringify({type:'heartbeat',status:'ok'}));
                }
            }
        },
        onclose : function(evt) {
            if(result === init_result) {
                result = {success:false,failure:true,root:$ws.netWorkFailure}
            }
            if(successMethod) {
                successMethod.call(this , {responseText:jsonEncode(result)});
            }
        },
        onerror : function(evt) {
            ws.close();
            if(failureMethod) {
                failureMethod.call(this);
            }
        },
        onopen : function(evt) {
            startTime = new Date().getTime();
            ws.send(JSON.stringify({
                url:config.url,
                data:config.params
            }));
        },
        onSessionInvaild:function() {
            result = {success:false,failure:true,root:$system.websocket.sessionFailure};
            ws.close();
        }
    });
};
Ext.Ajax.timeout = 120000;
var ajax = function(config) {
    if(!config.params) {
        config.params = {panelKey:getPaneKey()};
    }else if(!config.params.panelKey) {
        config.params.panelKey = getPaneKey();
    }
    Ext.Ajax.request(config);
};
var ajaxLongTime = function(config) {
    if(!config['getDataUrl']) {
        return console.log('can not the address...');
    }
    if(!config['endCode']) {
        config['endCode'] = "END";
    }
    if(!config['times']) {
        config['times'] = 0;
    }
    if(!config['params']) {
        config['params'] = {};
    }
    if(!config['maxTimes']) {
        config['maxTimes'] = 1000;
    }
    if(!config['keyProperty']) {
        config['keyProperty'] = "id";
    }
    config['times'] = config['times'] + 1;
    if(config['times'] > config['maxTimes']) {
        var mock_result = {success:false , root:$ws.tooManyTimes};
        if(config['successCallBack']) {
            return config['successCallBack'].call(this , JSON.stringify(mock_result));
        }else {
            return config['success'].call(this , JSON.stringify(mock_result));
        }
    }
    var endCode = config['endCode'];
    if(config['success'] && !config['successCallBack']) {
        config['successCallBack'] = config['success'];
        config['success'] = function(resp) {
            var json = jsonDecode(resp.responseText);
            if(json.success) {
                if(json.code === endCode || json.code == 'ERROR') {
                    config['successCallBack'].call(this , resp);
                }else {
                    if(!config['startTime']) {
                        config['startTime'] = new Date().getTime();
                    }
                    if(config['notifyData']) {
                        var timeDelay = (new Date().getTime() - config['startTime']);
                        if(timeDelay > 0) {
                            config['notifyTime'].call(this , timeDelay);
                        }
                        config['notifyData'].call(this , resp , timeDelay)
                    }
                    var timeout = config['times'] * 1000;
                    var maxTimeout = config['maxRequestTimeout'];
                    if(!maxTimeout) {
                        maxTimeout = 20000;
                    }
                    if(timeout > maxTimeout){
                        timeout = maxTimeout;
                    }
                    timeout = timeout / 200;
                    var tmpTimes = 0;
                    var tmpFunction = function() {
                        tmpTimes++;
                        if(tmpTimes >= timeout) {
                            config['url'] = config['getDataUrl'];
                            if(config['times'] == 1) {
                                config['params'][config['keyProperty']] = json.root[config['keyProperty']];
                            }
                            ajaxLongTime(config);
                        }else {
                            if(config['notifyTime']) {
                                var timeDelay = (new Date().getTime() - config['startTime']);
                                if(timeDelay > 0) {
                                    config['notifyTime'].call(this , timeDelay);
                                }
                            }
                            setTimeout(tmpFunction , 200);
                        }
                    };
                    setTimeout(tmpFunction , 200);
                }
            }else {
                config['successCallBack'].call(this , resp);
            }
        }
    }
    ajax(config);
};
function jsonDecode(v , defaultV) {
    if(!v) {
        return defaultV;
    }
    return Ext.JSON.decode(v);
}
function jsonEncode(json) {return Ext.JSON.encode(json);}
function jsonToString(json) {
    if(Ext.isIE) {
        return jsonEncode(json);
    }else {
        return JSON.stringify(json);
    }
}

var createWrapperPanel = function(panel , config) {
    var nowConfig = {
        layout:'fit',
        items:[panel]
    };
    if(config) {
        Ext.applyIf(config , nowConfig);
    }else {
        config = nowConfig;
    }
    return new Ext.Panel(config);
};
var jsVersion = jsVersion;
var panelKey = panelKey;
var object_type = object_type;
var getPaneKey = function() {
    var panelKeyStart = '';
    if(object_type && object_type != 'null') {
        panelKeyStart = object_type + "_";
    }
    if(panelKey && panelKey != 'null') {
        return panelKeyStart + panelKey;
    }
    return panelKeyStart + "0";
};
function getFrameHtml(url) {
    return '<iframe scrolling="auto" frameborder="0" width="100%" height="100%" src="' + url + '"></iframe>';
}
function getFrameHtmlWithId(url,id) {
    return '<iframe scrolling="auto" frameborder="0" width="100%" height="100%" src="' + url + '" id="' + id + '"></iframe>';
}


var IDBUtil = {};

IDBUtil.showErrorMsgBox = function(title, text, errMsgList){
	var allmsgs = "";
	if(errMsgList){
		for(var i = 0; i < errMsgList.length; ++i){
			allmsgs += errMsgList[i] + "<br/>";
		}
	}
	Ext.Msg.alert(title, text + "<br/>"  + allmsgs);
};
var isLogConsole = false;
var consoleLog = function(msg) {
    if(isLogConsole) {
        console.log(msg);
    }
};

IDBUtil.isEmptyString = function(msg){
	if( (!msg) || (!Ext.util.Format.trim(msg))){
		return true;
	}

	return false;
};

var TabUtil = {
		
};

TabUtil.calculateExistingObjPreId = function(nowDBName, objectName, objectType){
	if(objectName) {
		objectName = objectName.replaceAll('"', 'this is quoto!');
	}
	
	var preId = nowDBName + "_" + objectName + "_" + objectType;
	return preId;
};


var mysql_base_type_array = [
    {data:'tinyint' , label:'tinyint'},
    {data:'smallint' , label:'smallint'},
    {data:'mediumint' , label:'mediumint'},
    {data:'int' , label:'int'},
    {data:'bigint' , label:'bigint'},
    {data:'integer' , label:'integer'},
    {data:'float' , label:'float'},
    {data:'real' , label:'real'},
    {data:'double' , label:'double'},
    {data:'decimal' , label:'decimal'},
    {data:'bit' , label:'bit'},
    {data:'serial' , label:'serial'},
    {data:'boolean' , label:'boolean'},
    {data:'bool' , label:'bool'},
    {data:'date' , label:'date'},
    {data:'datetime' , label:'datetime'},
    {data:'timestamp' , label:'timestamp'},
    {data:'time' , label:'time'},
    {data:'year' , label:'year'},
    {data:'char' , label:'char'},
    {data:'varchar' , label:'varchar'},
    {data:'tinytext' , label:'tinytext'},
    {data:'text' , label:'text'},
    {data:'mediumtext' , label:'mediumtext'},
    {data:'longtext' , label:'longtext'},

    {data:'binary' , label:'binary'},
    {data:'varbinary' , label:'varbinary'},
    {data:'tinyblob' , label:'tinyblob'},
    {data:'blob' , label:'blob'},
    {data:'mediumblob' , label:'mediumblob'},
    {data:'longblob' , label:'longblob'}
];
var columnTypeArray = mysql_base_type_array.concat([
    {data:'enum' , label:'enum'},
    {data:'set' , label:'set'},

    {data:'linestring' , label:'linestring'},
    {data:'polygon' , label:'polygon'},
    {data:'geometry' , label:'geometry'},
    {data:'multipoint' , label:'multipoint'},
    {data:'multilinestring' , label:'multilinestring'},
    {data:'multipolygon' , label:'multipolygon'},
    {data:'geometrycollection' , label:'geometrycollection'}
]);
Ext.Ajax.on("beforerequest" , function(conn , options) {
    if(options.url && !options.onlyUrl && options.url.indexOf("onlyUrl=true") == -1) {
        if(url_namespace) {
            options.url = "/" + url_namespace + options.url;
        }
    }
});
Ext.Ajax.on("requestexception", function (conn, response, options) {
    var responseText = response.responseText;
    if(responseText && responseText.charAt(0) !== '{' && responseText.charAt(0) !== '[') {//如果不是JSON，则直接退出
        if(responseText.indexOf("Request Entity Too Large") !== -1)  {
            var d = new Ext.util.DelayedTask(function(){
                Ext.Msg.alert($pub.prompt, $import.msg.uploadFileOutOfLimit.format("8"));
            });
            d.delay(200);
        }
    }
});
Ext.Ajax.on("requestcomplete", function (conn, response, options) {
    var responseText = response.responseText;
    if(responseText && responseText.charAt(0) !== '{' && responseText.charAt(0) !== '[') {//如果不是JSON，则直接退出
        if(responseText.indexOf("Request Entity Too Large") !== -1)  {
            var d = new Ext.util.DelayedTask(function(){
                Ext.Msg.alert($pub.prompt, $import.msg.uploadFileOutOfLimit.format("8"));
            });
            d.delay(200);
        }
        return;
    }
    try {
        var json = jsonDecode(responseText);
        if(!json.success) {
            var errorCode = json.errorCode;
            if(errorCode === 'NOT_LOGIN' || errorCode === 'NOT_FIND_LOGIN_DO' || errorCode === 'EX_ERROR_TOKEN') {
                try {
                    if (window.parent && window.parent != window) {
                        window.parent.sessionOutCallBack($pub.sessionInvalid + '！ERROR_CODE = ' + errorCode);
                    } else {
                        sessionOutCallBack($pub.sessionInvalid + '！ERROR_CODE = ' + errorCode);
                    }
                }catch(e) {
                    sessionOutCallBack($pub.sessionInvalid + '！ERROR_CODE = ' + errorCode);
                }
            }else if(errorCode === 'EX_ERROR_TOKEN') {
                alert(json.root);
            }else if(errorCode == 'DEMO_MORE_LIMIT'){
                if (window.parent && window.parent != window) {
                    window.parent.demoMoreLimitCallBack(json.root);
                } else {
                    demoMoreLimitCallBack(json.root);
                }
            }
        }

    }catch(e) {}

});
var getUserToken = function() {
    if(user_token && user_token !== 'null') {
        return user_token;
    }
    try {
        if (window.parent && window.parent !== window && window.parent.user_token) {
            return window.parent.user_token;
        }
        if (window.parent && window.parent.parent && window.parent.parent.user_token) {
            return window.parent.parent.user_token;
        }
    }catch(e) {}
};
Ext.Ajax.on('beforerequest' , function(conn,options,Opts) {
    if(!options.method) {
        options.method = 'POST';
    }
    if(!options.params) {
        options.params = {panelKey:getPaneKey() , token:getUserToken()}
    }else {
        if(!options.params.panelKey) {
            options.params.panelKey = getPaneKey();
        }
        if(!options.params.token) {
            options.params.token = getUserToken();
        }
    }
});


var SimpleMap = function(data) {
    this.key_prefix = "key_";
    this.data = data || {};
    this.get = function(key) {
        return this.data[this.key_prefix + key] || '';
    };
    this.put = function(key , v) {
        this.data[this.key_prefix + key] = (v || null);
    };
    this.putSimpleKey = function(key) {
        this.data[this.key_prefix + key] = "";
    };
    this.remove = function(key) {
        delete this.data[this.key_prefix + key];
    };
    this.removeAll = function() {
        this.data = [];
    };
    this.contains = function(key) {
        return this.data[this.key_prefix + key] !== undefined;
    };
    this.getKeys = function() {
        var array = [];
        for(var p in this.data) {
            array.push(p.substring(this.key_prefix.length));
        }
        array.sort();
        return array;
    }
};
var timeoutAsynchronousAjax = function(option , sleepTime) {
    tmpAsynchronousOption = option;
    setTimeout("timeoutAsynchronousAjaxDoing()" , sleepTime);
};
var tmpAsynchronousOption = null;
var timeoutAsynchronousAjaxDoing = function() {
    asynchronousAjax(tmpAsynchronousOption);
};
//params、url、success、failure、retryUrl
var asynchronousAjax = function(option) {
    if(option.cancel)  {
        return ;
    }
    if(!option.startTryTime) {
        option.startTryTime = new Date().getTime();
    }
    if(option.onlyUrl === undefined) {
        option.onlyUrl = false;
    }
    ajax({
        url:option.url,
        timeout:3600000 * 24,
        onlyUrl:option.onlyUrl,
        params:option.params,
        success:function (response, options) {
            var json = Ext.decode(response.responseText);
            if(json.success) {
                if(option.runningCallBack) {//自定义回调
                    var result = option.runningCallBack.call(this , json , options , option);
                    if(result === undefined || result) {
                        option.url = option.retryUrl;
                        if(option.sleepTime) {
                            timeoutAsynchronousAjax(option , option.sleepTime);
                        }else {
                            timeoutAsynchronousAjax(option , 200);//重试获取数据
                        }
                    }else {
                        option.success.call(this , response , options , option);
                    }
                }else {
                    json = json.root;
                    if(json.ready) {
                        option.success.call(this , response , options);
                    }else {
                        option.url = option.retryUrl;
                        option.params.asynchronousKey = json.asynchronousKey;
                        if(!option.tryTime) {
                            option.tryTime = 1;
                        }else {
                            option.tryTime = option.tryTime + 1;
                        }
                        if(!option.userConfigTime) {
                            var timeDelay = new Date().getTime() - option.startTryTime;
                            var stepStart = 60;
                            if(timeDelay >= 600000) {
                                stepStart = 10000;
                            }else if(timeDelay >= 300000) {
                                stepStart = 5000;
                            }else if(timeDelay >= 20000) {
                                stepStart = 2000;
                            }else if(timeDelay >= 10000) {
                                stepStart = 1000;
                            }else if(timeDelay >= 5000) {
                                stepStart = 500;
                            }
                            option.params.maxTryTime = 30000;
                            option.params.stepStart = stepStart;
                        }
                        asynchronousAjax(option);//重试获取数据
                    }
                }
            }else {
                option.success.call(this , response , options);
            }
        },
        failure:function (response, options) {
            if(option.failure) {
                option.failure.call(this , response , options);
            }
        }
    });
};

var public_fun = {
    showReConnectWindow: function () {
        Ext.getBody().mask($pub.loading);
        var _client_token = getLocalStorage(local_storage_key_name);
        if(!_client_token){
        	_client_token = '';
        }
        ajax({
            url: '/getReconectInfo.do?dbType=' + now_db_type+'&clientToken='+_client_token,
            onlyUrl:true,
            success: function (resp) {
                Ext.getBody().unmask();
                var json = jsonDecode(resp.responseText);
                if (json.success) {
                    gLogin.loginformwin = getLoginFormWindow(json);
                }else if(json.errorCode == 'PORTAL_NOT_LOGIN' && json.redirect) {
                    Ext.Msg.confirm($pub.prompt, $pub.sessionInvalid, function(v) {
                        if(v == 'yes') {
                            window.location = json.redirect;
                        }
                    });
                }
            },
            failure: function (resp) {
                Ext.getBody().unmask();
                Ext.Msg.alert('Status', $pub.networkError);
            }
        });
    },
    setInstanceOtherName:function() {
        var value = filterNullStr(instance_other_name) || '';
        var form = new IDB.FormPanel({
            items:[{
                fieldLabel: $pub.instanceAlias, width:450,
                maxLength:32,
                margin: '5 0 0 0',
                value:value,
                name:'otherName',
                blankText: $system.controller.instanceAliasCannotEmpty,
                maxLengthText: $system.controller.instanceAliasLimitLength
            }]
        });
        var win = new IDB.Window({
            title: $pub.setInstanceAlias ,width:500,height:105,items:[form],
            buttons:[{
                text: $pub.confirm, handler:function() {
                    if(form.isValid()) {
                        var params = form.getValues();
                        ajax({
                            onlyUrl:true,
                            url:'/userConfig/setInstanceOtherName.do',
                            params:params,
                            success:function(resp) {
                                var json = jsonDecode(resp.responseText);
                                if(json.success) {
                                    $.feedbackMessage({
                                        type: 'success',
                                        message: $system.controller.instanceAliasSetSuccess
                                    });
                                    instance_other_name = json.root;
                                    setDocumentTitle(json.root);//后台返回真正的别名，会过滤特殊字符
                                    win.close();
                                }else {
                                    $.feedbackMessage({
                                        type: 'danger',
                                        message: json.root
                                    });
                                }
                            }
                        });
                    }
                }
            },{
                text: $pub.cancel, handler:function() {win.close();}
            }]
        });
    },
    toPage:function(url) {
        window.open(url);
    }
};
var filterNullStr = function(str) {
    return (str === 'null') ? null : str;
};
var filterNullStrToEmpty = function(str) {
    return (str === 'null') ? "" : str;
};
var confirmSetInstanceTitle = function() {
    Ext.Msg.confirm($pub.prompt, $system.controller.firstLoginSetAlias, function(v) {
        if(v === 'yes') {
            public_fun.setInstanceOtherName();
        }
    });
};
var setDocumentTitle = function(otherName) {
    var title = connect_user + "@" + connect_ip + ":" + connect_port + "（" + now_db_type + "）";
    if(now_db_type == 'ADS'){
        title = connect_ip + ":" + connect_port + "（" + now_db_type + "）";
        if(typeof(now_db_name) != "undefined" && now_db_name){
            title = "[" + now_db_name + "]" + title;
        }
    }
    if(otherName && otherName !== 'null') {
        title = otherName + " - " + title;
    }
    document.title = title;
};

var isNoZeroEmpty = function(_value){
	if (_value === null || _value === NaN || _value === undefined) {
		return true;
	}
	return false;
};
var getConnStr = function() {
    try {
        if (window.parent && window.parent !== window && window.parent.connect_ip) {
            return window.parent.connect_ip + ":" + window.parent.connect_port;
        }
    }catch(e) {}
    return connect_ip + ":" + connect_port;
};
var getDBVersion = function() {
    try {
        if (window.parent && window.parent !== window && window.parent.db_version) {
            return window.parent.db_version;
        }
    }catch(e) {}
    return db_version;
};
var maskBodyOrWin = function(msg , win) {
    if(win) {
        win.getEl().mask(msg);
    }else {
        Ext.getBody().mask(msg);
    }
};
var unMaskBodyOrWin = function(msg , win) {
    if(win) {
        win.getEl().unmask();
    }else {
        Ext.getBody().unmask();
    }
};

var tpl_tools = {
    SimpleTPL : function(content) {
        this.tokens = [];
        this.openToken = "{{";
        this.endToken = "}}";

        this.init = function() {
            var startIndex = 0;
            var length = content.length;
            while(startIndex < (length - 1)) {
                var index = content.indexOf(this.openToken , startIndex);
                if(index !== -1) {
                    this.tokens.push({type:'simple',content:content.substring(startIndex , index)});
                    startIndex = index;
                    index = content.indexOf(this.endToken , startIndex);
                    if(index !== -1) {
                        this.tokens.push({type:'token',content:content.substring(startIndex + 2 , index)});
                        startIndex = index + 2;
                    }else {
                        this.tokens.push({type:'simple',content:content.substring(startIndex)});
                        break;
                    }
                }else {
                    this.tokens.push({type:'simple',content:content.substring(startIndex)});
                    break;
                }
            }
        };
        this.getRealContent = function(json) {
            var content = '';
            this.tokens.each(function(row) {
                if(row.type === 'token') {
                    var curObj = json;
                    var names = row.content.split(".");
                    names.each(function(row) {
                        curObj = curObj[row];
                        if(curObj === undefined) {
                            curObj = "";
                            return this.EACH_END;
                        }
                    });
                    content += curObj;
                }else {
                    content += row.content;
                }
            });
            return content;
        };

        this.init();
    }
};

var PayOptions = {
    checkPay : function(moduleName , callBack) {
        Ext.getBody().mask($pub.loading);
        ajax({
            url:'/system/check-pay.do',
            params:{moduleName:moduleName},
            success:function(resp) {
                Ext.getBody().unmask();
                var json = jsonDecode(resp.responseText);
                if(json.success) {
                    var object = json.root;
                    var content = '';
                    if(object['canOption']) {
                        if(object.alert) {
                            object['alertContent'].each(function(row) {
                                content += "&nbsp;\u25C6&nbsp;" + row + "<br/><br/>";
                            });
                            Ext.Msg.alert($pub.prompt , content , function() {
                                callBack.call(this);
                            });
                        }else {
                            callBack.call(this);
                        }
                    }else {
                        object['alertContent'].each(function(row) {
                            content += "&nbsp;\u25C6&nbsp;" + row + "<br/><br/>";
                        });
                        Ext.Msg.alert($pub.prompt , content);
                    }
                }else {
                    $.message.error(json.root);
                }
            }
        });
    }
};
var sys_config = {
    USER_COOKIE_KEY : "__DMS_USER_LOGIN_COOKIE_KEY__",
    NOT_LOGIN : "NOT_LOGIN",

    DATE_TIME_FORMAT : "yyyy-MM-dd hh:mm:ss",
    DATE_FORMAT : "yyyy-MM-dd",
    TIME_FORMAT:"hh:mm:ss"

};
var session_tools = {
    getCookiesString : function() {
        return document.cookie;
    },
    getCookies : function() {
        var cookies = session_tools.getCookiesString();
        var kv = {};
        var array = cookies.split(";");
        array.each(function(row) {
            var rowContent = row.split("=" , 2);
            kv[rowContent[0].trim()] = rowContent[1].trim();
        });
        return kv;
    },
    getCookie : function(name) {
        var cookies = session_tools.getCookies();
        return cookies[name];
    },
    removeCookie : function(name) {
        var cookie = session_tools.getCookie(name);
        if(cookie) {
            document.cookie = name + "=;expires=" + (new Date().toGMTString());
        }
    },
    addCookie : function(name , cookie , date) {
        if(date) {
            document.cookie = name + "=" + cookie + ";expires=" + (date.toGMTString());
        }else {
            document.cookie = name + "=" + cookie;
        }
    },
    getUserCookie : function() {
        return session_tools.getCookie(sys_config.USER_COOKIE_KEY);
    },
    getLoginToken : function() {
        return getUserToken();
    }
};
var DMSWebSocket = function(url , properties) {
    if(!url) {
        return alert($ws.nourl);
    }
    if(window.location.protocol.startsWith("https") && url.startsWith("ws:")) {
        url = "wss:" + url.substring(3);
    }
    if(url.indexOf("?") !== -1) {
        url += "&";
    }else {
        url += "?";
    }

    url += sys_config.USER_COOKIE_KEY + "=" + encodeURIComponent(session_tools.getUserCookie() || '')
        + '&token=' + session_tools.getLoginToken();
    var ws;
    if ('WebSocket' in window) {
        ws = new WebSocket(url);
    }else if('MozWebSocket' in window) {
        ws = new MozWebSocket(url);
    }else {
        alert($pub.lowBrowserVersion);
    }

    ws.binaryType = 'arraybuffer';
    var dms_ws = this;
    var closed = false;
    this.onMessage = properties.onmessage || function(json) {};
    this.onClose = properties.onclose || function(evt) {};
    this.onOpen = properties.onopen || function(evt) {};
    this.onError = properties.onerror || function(evt) {};
    this.onSessionInvaild = properties.onSessionInvaild || function(data) {
            alert($pub.sessionInvalid);
        };
    this.close = function() {
        if(ws) {
            ws.close();
        }else {
            //pub_alert.alert_low_web();
        }
    };
    this.send = function(msg) {
        ws.send(msg);
    };
    this.sendBinary = function(bs) {
        if(ws) {
            if(dms_ws.isClosed()) {
                alert($ws.closed);
                return false;
            }
            ws.send(bs);
            return true;
        }else {
            alert($pub.sessionInvalid);
            return false;
        }
    };
    this.isClosed = function() {
        if(closed) {
            return true;
        }
        return ws.readyState === ws.CLOSED;
    };
    this.isOpen = function() {
        return ws.readyState === ws.OPEN;
    };
    if(ws) {
        ws.onclose = function(evt) {
            dms_ws.onClose(evt);
            closed = true;
        };
        ws.onerror = function(evt) {
            dms_ws.onError(evt);
        };
        ws.onmessage = function(evt) {
            var data = evt.data;
            var json = JSON.parse(evt.data);
            if(!json.success) {
                var errorCode = json['errorCode'];
                if(errorCode === 'NOT_LOGIN' || errorCode === 'NOT_FIND_LOGIN_DO' || errorCode === 'EX_ERROR_TOKEN') {
                    try {
                        if (window.parent && window.parent !== window) {
                            window.parent.sessionOutCallBack($pub.sessionInvalid + '！ERROR_CODE = ' + errorCode);
                        } else {
                            sessionOutCallBack($pub.sessionInvalid + '！ERROR_CODE = ' + errorCode);
                        }
                    }catch(e) {
                        sessionOutCallBack($pub.sessionInvalid + '！ERROR_CODE = ' + errorCode);
                    }
                    dms_ws.onSessionInvaild();
                }else if(errorCode === 'EX_ERROR_TOKEN') {
                    dms_ws.onSessionInvaild();
                }else {
                    dms_ws.onMessage(evt);
                }
            }else {
                dms_ws.onMessage(evt);
            }

        };
        ws.onopen = function(evt) {
            dms_ws.onOpen(evt);
        };
    }

};

function optimizationCloudDBA(type, flag) {

    // 先检验hdm是否支持
    if(flag == undefined || flag == false){
        // 临时代码，hdm灰度结束后下线
        ajax({
            url: '/performance/call-hdm-Performance.do',
            params: {type: type},
            async: false,
            success: function (resp1) {
                var json = jsonDecode(resp1.responseText);
                if (json.success) {
                    window.open(json.root);
                    return;
                }else{
		    if(type == 'diagnosis'){
                        $.message.warning("open the report error!");
                    }else{
                        optimizationCloudDBA(type, true);
                    }
                }
            },
            error:function(e){
		 optimizationCloudDBA(type, true);
            }
        });
    }else {
        var openWindow = window.open("/" + url_namespace + "/performance/to-performance-page.do?token=" + getUserToken());
        var time = new Date().getTime();
        ajax({
            url: '/performance/call-Performance.do',
            params: {type: type},
            success: function (resp1) {
                var json = jsonDecode(resp1.responseText);
                if (json.success) {
                    var time2 = new Date().getTime();
                    if (time2 - time > 2000) {
                        openWindow.location = json.root;
                    } else {
                        setTimeout(function () {
                            openWindow.location = json.root;
                        }, (2000 - (time2 - time)));
                    }
                } else {
                    openWindow.close();
                    var errMsg = json.root.root;
                    var attributes = json.root.attributes;
                    if (!attributes) {
                        $.message.warning(errMsg);
                        return;
                    }
                    var whiteList = attributes.WhiteList;
                    ajax({
                        url: '/system/third/checkServiceWhiteList.do',
                        onlyUrl: true,
                        params: {
                            errMsg: errMsg,
                            whiteList: whiteList
                        },
                        success: function (resp2) {
                            var jsonRes = jsonDecode(resp2.responseText);
                            if (jsonRes.success) {
                                Ext.Msg.confirm($pub.prompt, $pub.canNotCloudDBABlankReason + jsonRes.root, function (v) {
                                    if (v === 'yes') {
                                        ajax({
                                            url: '/system/third/setThirdWhiteList.do',
                                            onlyUrl: true,
                                            params: {whiteList: jsonRes.root},
                                            success: function (resp3) {
                                                var resJson = jsonDecode(resp3.responseText);
                                                if (resJson.success) {
                                                    $.message.warning($pub.blankSetupSubmitted);
                                                }
                                            }
                                        });
                                    }
                                });
                            } else {
                                $.message.error(jsonRes.root);
                            }
                        }
                    });
                }
            }
        });
    }
}




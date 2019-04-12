var connect_ip = connect_ip;
var connect_port = connect_port;
var db_instance_ha_type = db_instance_ha_type;
var connect_user = connect_user;
var db_version = db_version;
var db_version_num = db_version_num;
var db_charset = db_charset;
var console_panel , object_panel;
var user_token = user_token;
var isShowSessionOut = 0;
var isShowDemoLimt = 0;

var ECS_FLAG = ECS_FLAG;



Ext.define('DMS.ux.TabUserMenu', {
    alias: 'plugin.tabusermenu',
    mixins: {
        observable: 'Ext.util.Observable'
    },
    closeTabText: 'my Tab',
    constructor: function (config) {
        this.addEvents(
            'aftermenu',
            'beforemenu');
        this.menuItems = config.items;
        this.mixins.observable.constructor.call(this, config);
    },

    init : function(tabpanel){
        this.tabPanel = tabpanel;
        this.tabBar = tabpanel.down("tabbar");

        this.mon(this.tabPanel, {
            scope: this,
            afterlayout: this.onAfterLayout,
            single: true
        });
    },

    onContextMenu : function(event, target) {
        var me = this;
        var tab = me.tabBar.getChildByElement(target);
        var index = me.tabBar.items.indexOf(tab);
        me.item = me.tabPanel.getComponent(index);
        //console.log(me.item.title);
        //console.log(me.item.id);

        event.preventDefault();
        if(!this.menu) {
            this.menu = new Ext.menu.Menu({
                items:this.menuItems
            });
        }
        this.beforeShowMenu();
        this.menu.showAt(event.getXY());
    },
    onHideMenu: function () {
        var me = this;

        me.item = null;
        me.fireEvent('aftermenu', me.menu, me);
    },

    onClose : function() {
        this.tabPanel.remove(this.item);
    },

    onCloseOthers : function(){
        //this.doClose(true);
    },

    onCloseAll : function(){
        //this.doClose(false);
    },
    onBeforeDestroy : function(){
        Ext.destroy(this.menu);
        this.callParent(arguments);
    },

    onAfterLayout: function() {
        this.mon(this.tabBar.el, {
            scope: this,
            contextmenu: this.onContextMenu,
            delegate: '.x-tab'
        });
    },
    getLastActionTab:function() {
        return this.item;
    },
    hideMenu:function() {
        if(this.menu) {
            this.menu.hide();
        }
    },
    beforeShowMenu:function() {

    }
});

var gLogin = {};
var loginOut = function() {
    Ext.MessageBox.confirm($pub.confirm, $pub.exitConfirmTitle, function(btnid){
        if(btnid === 'yes') {
            window.onbeforeunload = null;
            storeTabs();
            window.location = '/logout.do?token=' + user_token;
        }
    });
};

var ecsLoginOut = function() {
    Ext.MessageBox.confirm($pub.confirm, $pub.exitConfirmTitle, function(btnid){
        if(btnid === 'yes') {
            window.onbeforeunload = null;
            storeTabs();
            window.location = '/ecsInstancelogout.do?token=' + user_token;
        }
    });
};

function getConsole(){
    return is4Service()
        ? "https://dms4service.console.aliyun.com/?hideTopbar=true&hideSidebar=true#"
        : "https://dms.console.aliyun.com/#";
}

function optionByDataKey(dataKey) {
    switch (dataKey) {
        case "table" :
            console_panel.addUrlPanel('/structure/table/tableBase.do', '', 'table', 'create');
            break;
        case "procedure":
            console_panel.addUrlPanel('/structure/procedure/procedure-page.do?funcprocType=PROCEDURE', '', 'proc', 'create');
            break;
        case "function":
            console_panel.addUrlPanel('/structure/function/function-page.do?funcprocType=FUNCTION', '', 'func', 'create');
            break;
        case "view":
            console_panel.addUrlPanel('/structure/view/viewBase.do', '', 'view', 'create');
            break;
        case "trigger":
            console_panel.addUrlPanel('/structure/trigger/createTrigger.do', '', 'trigger', 'create');
            break;
        case "user":
            console_panel.addUrlPanel('/management/user/toUserManagePage.do?showCreateWindow=true', $main.menu.manageUser, 'manage_user', 'manage_user');
            break;
        case "db":
            console_panel.addUrlPanel('/management/database/toManagePage.do?showCreateWindow=true', $main.menu.manageDB, 'manage_db', 'manage_db');
            break;
        case "event":
            console_panel.addUrlPanel('/structure/event/createEvent.do', '', 'event', 'create');
            break;
        case "tunninglist":
            console_panel.addUrlPanel('/tunning/tunningListPage.do' , $main.menu.optimizationList, 'tunninglist' , 'instance');
            break;
        case "datatrend":
            PayOptions.checkPay("DATA_TREND",function(){
                console_panel.addUrlPanel("/instance/dbDataTrend.do?dbName=information_schema&tableName=TABLE_STATISTICS&showAllDatabases=Y&token=" + user_token, $main.menu.dataTrend + '(' + $pub.instance + ')','dateStatistics' ,'instance','datatrend');
            });
            break;
        case "orzdba":
            console_panel.addUrlPanel('/instance/orzdba.do', $main.menu.realPerformance, 'orzdba', 'instance');
            break;
        case "processlist":
            console_panel.addUrlPanel('/instance/showprocesslist.do', $main.menu.instanceSession, 'showprocesslist', 'instance');
            break;
        case "locks":
            console_panel.addUrlPanel('/instance/locks.do', $main.menu.innoDBLock , 'locks', 'instance');
            break;
        case "tableSummaryPage":
            console_panel.addUrlPanel('/instance/tablesummary/gettablesummarypage.do', $main.menu.dataStat, 'tablesummary', 'instance');
            break;
        case "oneKeyClean":
            console_panel.addUrlPanel('/instance/oneKeyClean.do', $main.menu.oneKeyClear , 'oneKeyClean', 'instance');
            break;

        case "sqlWindow":
            console_panel.addTmpURLPanel('/data/multiSqlWindow.do', $main.menu.sqlWindow, 'sqlWindow');
            break;
        case "dSqlWindow":
            console_panel.addTmpURLPanel('/data/dsql-window.do' , $main.menu.dSqlWindow , "dSqlWindow");
            break;
        case "toDsqlConsole":
            if(typeof dsqlConsoleRedirectUrl != "undefined"  && dsqlConsoleRedirectUrl != ""){
                window.open(dsqlConsoleRedirectUrl,'_blank');
            }
            break;
        case "mlSqlWindow":
            console_panel.addTmpURLPanel('/data/ml-sql-window.do' , $main.menu.mlSqlWindow , "mlSqlWindow");
            break;
        case "sqlCommand":
            console_panel.addTmpURLPanel('/data/sqlCommand.do', $main.menu.sqlCommand , 'sqlCommand');
            break;
        case "export_mp":
            console_panel.addUrlPanel('/data/export/exportBaseView.do', 'export_base_view', 'export', 'export');
            break;
        case "import_mp":
            console_panel.addUrlPanel('/data/import/importBaseView.do', 'import_base_view', 'import', 'import');
            break;
        case "biReport":
            console_panel.addUrlPanel('/data/biReport/biReportBaseView.do', 'bireport_base_view', 'bireport', 'bireport');
            break;
        case "manage_db":
            console_panel.addUrlPanel('/management/database/toManagePage.do', $main.menu.manageDB, 'manage_db', 'manage_db');
            break;
        case "manage_user":
            console_panel.addUrlPanel('/management/user/toUserManagePage.do', $main.menu.manageUser, 'manage_user', 'manage_user');
            break;
        case "manage_binlog":
            console_panel.addUrlPanel('/management/binlog/toBinlogManagePage.do', $main.menu.manageLog, "manage_binlog", 'manage_binlog');
            break;
        case "manage_erchart":
            console_panel.addUrlPanel('/management/erchart/showErcharts.do', $main.menu.ERChart, "manage_erchart", 'manage_erchart');
            break;

        case "grant_user_instance":
            window.open(getConsole() + "/dms/user/config");
            break;
        case "audit_log":
            window.open(getConsole() + "/dms/audit/logs");
            break;
        case "grant_source_instance":
            window.open(getConsole() + "/dms/instance/permission");
            break;
        case "more_diagno":
            console_panel.addUrlPanel("/system/moreDiagno.do", $main.menu.rdsDiagnosisReport, "diagno", "more");
            break;
        case "more_status":
            console_panel.addUrlPanel("/system/moreStatus.do", $pub.instanceStatus, "status", "more");
            break;
        case "more_grant":
            console_panel.addUrlPanel("/system/moreGrant.do", $pub.grantInstance, "grant", "more");
            break;
        case "batch_table_option":
            console_panel.addUrlPanel('/structure/table/tableList.do', '', '', 'tableBatchOptr', object_panel.getNowDBName());
            break;
        case "show_dict":
            window.open('/mysql/dictionary/showdict.do?nowDBName=' + encodeURIComponent(object_panel.getNowDBName()) + "&token=" + user_token + "&panelKey=dictionary");
            break;
        case "closed-save-sql-window" : showSaveClosedSQLWindows();
            break;
        case "structure_compare":
            console_panel.addUrlPanel("/structure/compare/to-compare-page.do", $main.menu.tableStructureCompare, "structure_compare", 'more');
            break;
        case "generate":
            console_panel.addUrlPanel("/data/generate/generateBase.do", 'generate_base_view', 'generate', 'generate');
            break;
        case "data_track":
            console_panel.addUrlPanel("/data/track/trackBaseView.do", $main.menu.traceData, "data_track", 'more', '', '');
            break;
        case "db_clone" :
            console_panel.addUrlPanel("/data/clone-db/clone-db-page.do", $main.menu.clone, "db_clone", 'more');
            break;
        case "to_dbs_backup":
            if(typeof dbsRedirectUrl!="undefined"){
                window.open(dbsRedirectUrl + "&dbName=" + object_panel.getNowDBName(),'_blank');
            }
            break;
        case "to_dbs_restore":
            if(typeof dbsRedirectUrl!="undefined") {
                window.open(dbsRedirectUrl + "&dbName=" + object_panel.getNowDBName() + "&recover=true", '_blank');
            }
            break;
        case "optimization_all":
        case "performance_direction":
        case "sql_direction":
        case "storage_display":
        case "processlist_new":
        case "real_time":
        case "all_sql_ecs" :
        case "diagnosis":
            optimizationCloudDBA(dataKey);
            break;
    }
}

function encodeValue(value, meta, record) {
    return '<pre style="padding: 0;margin:0;font-family:新宋体,Lucida Console,monospace">' + value + '</pre>';
}
var USER_CLOSED_SQL_WINDOW_PANEL = null;
var showSaveClosedSQLWindows = function() {
    var store = new Ext.data.Store({
        autoLoad:true,
        fields:['id' , 'title' , 'instanceStr' , 'dbName' , 'sqlPrefix' , 'gmtCreate'],
        proxy:{
            type:'ajax',
            url:'/user-config/list-user-closed-window-sqls.do?onlyUrl=true',
            reader:{
                type:'json',
                root:'root'
            }
        }
    });
    var grid = new Ext.grid.Panel({
        emptyText:$main.msg.noDataInSavedCloseWindow,
        selType:'rowmodel',
        viewConfig:{ stripeRows:true, enableTextSelection:true},
        store:store,
        columns:[
            {xtype: 'rownumberer'},
            {text : $savedSQLWindow.colTitle.title , dataIndex:"title",  width:120},
            {text : $pub.dbName + "/" + $savedSQLWindow.colTitle.closeTime , dataIndex:"dbName",  width:220,renderer:function(v , c , row) {
                return $pub.dbName + "：" + v + "<div style='padding-top: 10px;'>" + $savedSQLWindow.colTitle.closeTime + "：" + row.get('gmtCreate') + "</div>"
            }},
            {text:$pub.sqlPrefix , dataIndex:'sqlPrefix',width:480,renderer:encodeValue},
            {text:$pub.option , width:120,renderer:function(v,c,row) {
                return '<a href="javascript:newSQLWindow()">' + $savedSQLWindow.button.openNewWindow + '</a> <a href="javascript:deleteSQLWindow()"> ' + $pub.delete + ' </a>'
            }}
        ],
        listeners:{
            itemdblclick:function(thiz,record) {
                newSQLWindow();
            }
        }
    });
    var win = USER_CLOSED_SQL_WINDOW_PANEL = new IDB.Window({
        height:520,width:1024,title:$savedSQLWindow.title.main,closable:true,
        items:[grid],
        getSelectedRow:function() {
            return grid.getSelectionModel().getSelection();
        },
        refreshData:function() {
            store.load();
        }
    });
};
var deleteSQLWindow = function() {
    if(USER_CLOSED_SQL_WINDOW_PANEL) {
        var rows = USER_CLOSED_SQL_WINDOW_PANEL.getSelectedRow();
        if(rows && rows.length > 0) {
            var row = rows[0];
            Ext.Msg.confirm($pub.prompt , $savedSQLWindow.title.deleteSQL , function(v) {
                if(v === 'yes') {
                    ajax({
                        url: '/user-config/delete-closed-window-sql-by-id.do',
                        onlyUrl: true,
                        params: {id: row.get('id')},
                        success: function(resp) {
                            var json = jsonDecode(resp.responseText);
                            if(json.success) {
                                $.message.success($pub.dropSuccess);
                                USER_CLOSED_SQL_WINDOW_PANEL.refreshData();
                            }else {
                                Ext.Msg.alert($pub.dropFailure , json.root);
                            }
                        }
                    });
                }
            });
        }
    }
};
var newSQLWindow = function() {
    if(USER_CLOSED_SQL_WINDOW_PANEL) {
        var rows = USER_CLOSED_SQL_WINDOW_PANEL.getSelectedRow();
        if(rows && rows.length > 0) {
            var row = rows[0];
            ajax({
                url:'/user-config/get-closed-window-sql-by-id.do',
                onlyUrl:true,
                params:{id:row.get('id')},
                success:function(resp) {
                    var json = jsonDecode(resp.responseText);
                    if(json.success) {
                        console_panel.addUrlPanel('/data/multiSqlWindow.do',
                            $main.menu.sqlWindow,
                            'sqlWindow' ,
                            'add' ,
                            row.get('dbName') ,
                            getSQLWindowParamsStr("sqlWindow" , json.root) ,
                            false ,
                            Ext.util.Format.htmlDecode(row.get('title'))
                        );
                        USER_CLOSED_SQL_WINDOW_PANEL.close();
                        USER_CLOSED_SQL_WINDOW_PANEL = null;
                    }else {
                        $.message.error(json.root);
                    }
                }
            });
        }else {
            $.message.waring($pub.selectOneRowOption);
        }
    }
};
var initPageHeader= function () {
    if(headerRegion === 'west') {
        return;
    }
    //用户的初始化处理
    function initUserCase(){
        var username= Ext.get("userName");
        if(username) {
            var userCaseAction = username.child(".userCaseAction");
            var fullName="";
            var shortName=Ext.get("instance_area").getHTML();
            //修改为鼠标滑动的效果
            username.hover(function(){
                //over func
                if(userCaseAction) {
                    userCaseAction.show();
                }
                fullName=Ext.get("instance_area").getAttribute("data-fullName")||Ext.get("instance_area").getHTML();
                shortName= Ext.get("instance_area").getHTML();
                Ext.get("instance_area").setHTML(fullName);

            },function(){
                //out func
                Ext.get("instance_area").setHTML(shortName);
                if(userCaseAction) {
                    userCaseAction.hide();
                }
            });
        }
    }
    initUserCase();

    //menu list events
    var menuList=Ext.select(".menus .list");
    Ext.Array.each(menuList.elements,function(dd,index){
        var d= Ext.get(dd);
        var menu=d.child(".detail-menu");
//      var bindOne= d.down("input.bindMenu");
        //change mouse hover effect
        d.hover(function(){
            if(!d.hasCls("mover")){
                d.addCls("mover");
                menu.show(0);
            }

        },function(){
            if(d.hasCls("mover")){
                d.removeCls("mover");
                menu.hide(0);
            }
        });
    });

    var lis=Ext.get("main_header_info_bar").select(".js-console");
    Ext.Array.each(lis.elements,function(one,index){

        var tep=Ext.get(one);
        tep.on('click',function(evt){

            var dataKey = Ext.get(one).getAttribute("data-key");
            if(dataKey) {
                optionByDataKey(dataKey);
            }
            Ext.select(".detail-menu").hide(200);
        });
    });
};

var sessionOutCallBack = function (htmlContent) {
    if (isShowSessionOut > 0) {
        return;
    }
    isShowSessionOut = 1;
    var win = new IDB.Window({
        title: $pub.prompt,
        height: 110,
        width: 400,
        html: htmlContent,
        buttons: [
            {
                text: $main.msg.toLoginPage, handler: function () {
                storeTabs();
                window.onbeforeunload = null;
                window.location = "/";
            }
            },
            {
                text: $pub.cancel, handler: function () {
                win.close()
            }
            }
        ]
    });
    win.on('beforedestroy', function () {
        isShowSessionOut = 0;
    });
};
//demo超出限制提示
var demoMoreLimitCallBack = function (root) {
    if(isShowDemoLimt >0){
        return;
    }
    isShowDemoLimt = 1;
    if(root.limitFlag == '2'){
        showTableLimit(root);
    }else{
        showSpaceLimit(root);
    }
};
var showTableLimit = function(root){
    var maxTable = root.maxTable , usedTable = root.usedTable, dbName=root.dbName;
    var tableStore = new Ext.data.Store({
        fields:['tableName' , 'size' , 'sizeName'],
        proxy: {
            url:'/demo/showTableSize.do?onlyUrl=true',
            type: 'ajax',
            reader: {
                root: 'root',
                idProperty:'tableName'
            }
        }
    });
    tableStore.load({params:{dbName:dbName}});
    var tableGrid = new Ext.grid.Panel({
        selType:'rowmodel',
        columns:[
            {text: $pub.tableName,  dataIndex: 'tableName' ,sortable:false ,width:360},
            {text: $pub.tableSize,  dataIndex: 'sizeName' ,sortable:false ,width:80}
        ],
        selModel:Ext.create('Ext.selection.CheckboxModel',{mode:"SIMPLE"}),
        store:tableStore
    });
    var win = DEMO_COLLECT_RESOURCE_WINDOW = new IDB.Window({
        title:$demo.collectTable.format(usedTable , maxTable),layout:'fit',closable:true,width:470,height:430,
        items:[tableGrid],
        buttons: [
            {text: $mainTree.menu.dropTable, handler: function () {
                if(tableGrid.selModel.getSelection().length <= 0){
                    Ext.Msg.alert($pub.prompt , $pub.selectOneRowOption);
                    return;
                }
                var tables = [];
                for(var i=0;i<tableGrid.selModel.getSelection().length;i++){
                    var record = tableGrid.selModel.getSelection()[i];
                    var tableName = record.get("tableName");
                    tables[i] = tableName;
                }
                var confirmContent =  $pub.confirmDropObject.format(tables.join('，'))
                Ext.Msg.confirm($pub.confirm , confirmContent , function(v) {
                    if(v === 'yes') {
                        truncateOrDropTable(tables, "drop");
                    }
                });
            }},
            {text: $pub.cancel, handler: function () {
                    win.close();
                }
            }
        ],
        refreshData:function(root) {
            DEMO_COLLECT_RESOURCE_WINDOW.setTitle($demo.collectTable.format(root.usedTable , root.maxTable));
            tableStore.load({params:{dbName:dbName}});
        }
    });
    win.on('beforedestroy', function () {
        isShowDemoLimt = 0;
    });
};

var DEMO_COLLECT_RESOURCE_WINDOW = null;
var showSpaceLimit = function(root) {

    var maxSize = root.maxSize , usedSize = root.usedSize, dbName=root.dbName;

    var store = new Ext.data.Store({
        fields:['tableName' , 'size' , 'sizeName'],
        proxy: {
            url:'/demo/showTableSize.do?onlyUrl=true',
            type: 'ajax',
            reader: {
                root: 'root',
                idProperty:'tableName'
            }
        }
    });
    store.load({params:{dbName:dbName}});
    var spaceGrid = new Ext.grid.Panel({
        selType:'rowmodel',
        columns:[
            {text: $pub.tableName,  dataIndex: 'tableName' ,sortable:false ,width:360},
            {text: $pub.tableSize,  dataIndex: 'sizeName' ,sortable:false ,width:80},
            {text: $pub.option,  dataIndex: '' ,sortable:false ,width:160,renderer:function(v,c,row) {
                return '<a href="javascript:truncateTable(\''+row.get('tableName')+'\',\'truncate\')" style="padding-left:10px;padding-right:20px;">' + $batch.truncate + '</a>' +
                       '<a href="javascript:truncateTable(\''+row.get('tableName')+'\',\'drop\')">' + $mainTree.menu.dropTable + '</a>'
            }}
        ],
        store:store
    });
    var win = DEMO_COLLECT_RESOURCE_WINDOW = new IDB.Window({
        title: $demo.collectSpace.format(usedSize , maxSize),layout:'fit',closable:true,width:630,height:430,
        items:[spaceGrid],
        refreshData:function(val1, val2) {
            DEMO_COLLECT_RESOURCE_WINDOW.setTitle($demo.collectSpace.format(root.usedSize , root.maxSize));
            store.load({params:{dbName:dbName}});
        },
    });
    win.on('beforedestroy', function () {
        isShowDemoLimt = 0;
    });
};
var truncateTable = function(tableName, optionType) {
    var tables = [];
    tables[0] = tableName;
    var confirmContent = optionType === 'drop' ? $pub.confirmDropObject.format(tableName) : $main.label.confirmTruncateTable
    Ext.Msg.confirm($pub.confirm , confirmContent , function(v) {
        if(v === 'yes') {
            truncateOrDropTable(tables, optionType);
        }
    });
};

var truncateOrDropTable = function(tableName, trackFlag) {
    Ext.getBody().mask($pub.processing);
    ajax({
        type : "POST",
        url : "/demo/truncateDB.do?onlyUrl=true",
        timeout : 3600000 * 24,
        params : {
            table : JSON.stringify(tableName),
            type : trackFlag
        },
        dataType : "json",
        success : function(data) {
            Ext.getBody().unmask();
            var json = jsonDecode(data.responseText);
            if (json.success) {
                DEMO_COLLECT_RESOURCE_WINDOW.refreshData(json.root);
                //Ext.Msg.alert($pub.prompt /*'提示'*/, "操作成功");
            }else{
                Ext.Msg.alert($pub.prompt /*'提示'*/, json.root);
            }
        },
        failure : function(data) {
            Ext.Msg.alert($pub.prompt /*'提示'*/, json.root);
        }
    })
};


var createVerifyCodePanel = function () {
    var verifycodepanel = Ext.create("Ext.panel.Panel", {
        border: false,
        id: 'reconn_verifycode_panel',
        style: 'margin: 6px 0',
        layout: 'column',
        defaults: {
            autoFitErrors: false,//自动调整错误提示时候的宽度
            labelSeparator: ' : ',
            labelWidth: 80,
            allowBlank: false,
            labelAlign: 'right',
            xtype: 'textfield',
            msgTarget: 'side'
        }
    });

    var txt = Ext.create("Ext.form.field.Text", {
        fieldLabel: $pub.verifyCode,
        name: 'verifycode',
        allowBlank: false,
        blankText: $pub.verifyCodeNotEmpty,
        labelWidth: 80,
        width: 150,
        labelAlign: 'right',
        listeners: {
            specialkey: function (field, e) {
                if (e.getKey() === Ext.EventObject.ENTER) {
                    gLogin.reconn();
                }
            }
        }

    });

    verifycodepanel.add(txt);
    var img = Ext.create('Ext.Img', {
        id: 'reconn_verifycode_img',
        src: "/getverifycode.do?r=" + Math.random(),
        style: 'height:21px; width: 100px; padding: 0px 0px 0px 20px; vertical-align: middle',
        listeners: {
            el: {
                click: function () {
                    img.setSrc("/getverifycode.do?r=" + Math.random());
                }
            }
        },
        renderTo: Ext.getBody()
    });

    verifycodepanel.add(img);
    var refreshbtn = Ext.create('Ext.Button', {
        text: $pub.refresh,
        style: 'width:80px; margin: 0 20px ',
        renderTo: Ext.getBody(),
        handler: function () {
            img.setSrc("/getverifycode.do?r=" + Math.random());
        }
    });
    verifycodepanel.add(refreshbtn);

    var formPanel = Ext.ComponentQuery.query("#reconnformpanel")[0];
    formPanel.insert(5 , verifycodepanel);
};

var checkVerifyCode = function () {
    var win = Ext.ComponentQuery.query("#reconnpopupwin")[0];

    win.setHeight(220);
    var theverifycodepanel = Ext.ComponentQuery.query('#reconn_verifycode_panel');
    if (theverifycodepanel && theverifycodepanel.length > 0) {
        theverifycodepanel = theverifycodepanel[0];

        var verifycodeimg = Ext.ComponentQuery.query('#reconn_verifycode_img')[0];
        verifycodeimg.setSrc("/getverifycode.do?r=" + Math.random());
    }
    else {
        createVerifyCodePanel();
    }
};

var buildIpPortItems = function (json , aloneLogin) {
    var items = [{
        xtype:'hidden',
        name:'ip'
    },{
        xtype:'hidden',
        name:'port'
    }];
    var specialKeyCallBack = function(field , e) {
        if (e.getKey() === Ext.EventObject.ENTER) {
            gLogin.reconn();
        }
    };
    if (aloneLogin) {
        items.push({
            xtype:'hidden',name:'dbType',value:'MySQL'
        },{
            fieldLabel: $pub.instanceStr,
            name: 'connect',
            blankText: $pub.instanceNotEmpty,
            listeners: {specialkey: specialKeyCallBack}
        });
    }else {
        var dataArray = [];
        Ext.each(json.connlist , function(row , i) {
            dataArray[i] = row;
            dataArray[i]['instance'] = row['domain'] + ":" + row['port'];
        });
        var store = Ext.create('Ext.data.Store', {
            fields: ['domain', 'port' , 'instance' , 'dbType'],
            data: dataArray
        });
        items.push({
            xtype:'combo',
            fieldLabel: $pub.instanceStr,
            labelAlign: 'right',
            inputId: 'connect',
            store: store,
            queryMode: 'local',
            displayField: 'instance',
            valueField: 'instance',
            matchFieldWidth: true,
            listeners: {
                change: function (thiz, newValue, oldValue, eOpts) {
                    var record = thiz.findRecord(thiz.valueField || thiz.displayField, newValue);
                    var index = thiz.store.indexOf(record);
                }
            }
        });
    }
    items.push({
        fieldLabel: $pub.userName,
        name: 'userName',
        blankText: $pub.userNameNotEmpty,
        listeners: {
            specialkey: specialKeyCallBack
        }
    });
    items.push({
        fieldLabel: $pub.password,
        inputType: 'password',
        name: 'password',
        id: 'reconnectpassword',
        blankText: $pub.passwordNotEmpty,
        listeners: {
            specialkey: specialKeyCallBack
        }
    });
    items.push({
        xtype:'checkboxfield',
        name:'remember',
        inputValue:'true',
        margin:"0 0 0 26",
        boxLabel:$pub.rememberPassword
    });
    items.push({
        name:'clientToken',
        xtype:'hidden'
    });
    return items;
};

gLogin.reconn = function () {
    var form = gLogin.formPanel;
    var connect = form.getForm().findField("connect");
    if(connect.getValue()) {
        var v = connect.getValue();
        if(v.indexOf(":") === -1) {
            return $.message.warning($login.msg.connectStrError);
        }
        var connectArray =  v.split(":");
        if(connectArray.length !== 2) {
            return $.message.warning($login.msg.connectStrError);
        }
        var ip = connectArray[0];
        var port = connectArray[1];
        if(isNaN(port)) {
            return $.message.warning($login.msg.portError);
        }
        form.getForm().findField("ip").setValue(ip);
        form.getForm().findField("port").setValue(port);
    }
    var loginURL = "/dologin.do?reconnect=true&onlyUrl=true";
    if (gLogin.formPanel.isValid()) {
        gLogin.formPanel.submit({
            url: loginURL,
            onlyUrl: true,
            waitMsg: login.logging,
            submitCallBack: function (panel, response, status) {
                var json = response.result;
                if (json.success) {
                    user_token = json.root.token;
                    loginSuccess();
                    gLogin.loginformwin.close();
                } else {
                    $.message.error(response.result.root.errmsg);
                    var reconnfailedcount = response.result.root.failedcount;
                    if (reconnfailedcount >= 3) {
                        checkVerifyCode();
                    }
                }
            }
        });
    }
};

var SimpleMap = function() {
    var object = {};
    var prefix = "k_";
    var simpleObject = "$$$";
    this.put = function(key , value) {
        object[prefix + key] = value;
    };
    this.putSimpleKey = function(key) {
        object[prefix + key] = simpleObject;
    };
    this.get = function(key) {
        return object[prefix + key];
    };
    this.getKeys = function() {
        var array = [];
        for(var p in object) {
            array.push(p.substring(prefix.length));
        }
        array.sort();
        return array;
    };
};
var getLoginFormWindow = function (json) {
    Ext.regModel('login_data_mode', {
        fields: ['ip' , 'port' , 'userName' , 'connect']
    });
    var aloneLogin = ((json['allowStandaloneLogin'] && json['defaultStandaloneLogin']));
    var instanceItems = buildIpPortItems(json , aloneLogin);

    var baseWidth = 520;
    gLogin.formPanel = new IDB.FormPanel({
        border: true,
        id: 'reconnformpanel',
        defaults: {
            width: baseWidth - 60,
            style: 'margin: 6px 0'
        },
        items: instanceItems,
        buttons: [
            {
                text: $pub.ok,
                handler: function () {
                    gLogin.reconn();
                }
            },
            {
                text: $pub.cancel,
                handler: function () {
                    win.close();
                }
            }
        ]
    });
    var record = Ext.ModelMgr.create({ip: connect_ip, port: connect_port,connect:(connect_ip + ":" + connect_port), userName: connect_user}, 'login_data_mode');
    gLogin.formPanel.loadRecord(record);
    var win = new IDB.Window({
        width: 520, height: 200, title: $pub.reconnect,
        id: 'reconnpopupwin',
        items: [gLogin.formPanel]
    });
    if(!aloneLogin && json['userRememberLogin'] && json['userRememberLogin'].length > 0) {
        var form = gLogin.formPanel.getForm();
        var instanceF = form.findField("connect");
        var userF = form.findField("userName");
        var passwordF = form.findField("password");
        var rememberF = form.findField("remember");
        var clientTokenF = form.findField("clientToken");
        var default_password_background =  "$$idb_password_by_background$$";
        var rememberMap = new SimpleMap();
        var userRememberLogin = json['userRememberLogin'];
        for(var i = 0 ; i < userRememberLogin.length ; i++) {
            var row = userRememberLogin[i];
            var instanceMap = rememberMap.get(row['instanceName']);
            if(!instanceMap) {
                instanceMap = new SimpleMap();
                rememberMap.put(row['instanceName'] , instanceMap);
            }
            instanceMap.putSimpleKey(row['dbUserName']);
        }
        var connectionMap = rememberMap.get(record.get("connect"));
        if(connectionMap && connectionMap.get(record.get("userName"))) {
            passwordF.setValue(default_password_background);
            rememberF.setValue(true);
            clientTokenF.setValue(getLocalStorage(local_storage_key_name));
        }
        var preInstanceName = record.get("connect");
        var resetPass = function() {
            passwordF.setValue('');
            rememberF.setValue(false);
        };
        var resetAll = function() {
            userF.setValue('');
            resetPass();
        };
        instanceF.on('select'  ,function() {
            if(preInstanceName !== instanceF.getValue()) {
                preInstanceName = instanceF.getValue();
                var connectionMap = rememberMap.get(preInstanceName);
                if(connectionMap) {
                    var keys = connectionMap.getKeys();
                    if(keys && keys.length > 0) {
                        userF.setValue(keys[0]);
                        passwordF.setValue(default_password_background);
                        rememberF.setValue(true);
                        clientTokenF.setValue(getLocalStorage(local_storage_key_name));
                    }else {
                        resetAll();
                    }
                }else {
                    resetAll();
                }
            }
        });
        userF.on('change' , function() {
            if(instanceF.getValue() && userF.getValue()) {
                var connectionMap = rememberMap.get(preInstanceName);
                if(connectionMap && connectionMap.get(Ext.String.trim(userF.getValue()))) {
                    passwordF.setValue(default_password_background);
                    rememberF.setValue(true);
                }else {
                    resetPass();
                }
            }else {
                resetPass();
            }
        });
    }
    if (json.failedcount && (json.failedcount >= 3)) {
        checkVerifyCode();
    }

    return win;
};
var loginSuccess = function () {
    ajax({
        url: '/system/findLoginInfo.do?token=' + getUserToken(),
        onlyUrl:true,
        success: function (response) {
            var json = jsonDecode(response.responseText);
            if (json.success) {
                var root = json.root;
                if(connect_ip !== root.ip || connect_port !== root.port || connect_user !== root.userName) {
                    connect_ip = root.ip;
                    connect_port = root.port;
                    connect_user = root.userName;
                    db_version = root.version;
                    db_charset = root.db_charset;
                    //storeDBVersion();//存储dbVersion
                    global_main_panel.resetTitle();
                    global_main_panel.refreshComponents();
                    Ext.get('welcome_page_id').dom.src = "/welcome.do?dbType=" + now_db_type + "&token=" + user_token;
                    console_panel.closeNotSQLPanel();
                }
            }
        }
    });
};
var global_main_panel;
var createWorkspacePanel = function () {
    initStoreTabs();
    var showConnectWindow = function () {
        getLoginFormWindow();
    };
    var showInstanceWindow = function () {
        var htmlCode = getFrameHtml('/instance/instanceBase.do');
        var win = new IDB.Window({
            width: 1024, height: 560, closable: true,
            maximizable: true,
            title: $pub.instance + ':【' + connect_ip + ":" + connect_port + "】 " + $pub.relatedInfo,
            items: [
                {
                    border: false, scripts: true, autoScroll: true,
                    discardUrl: true, nocache: true, timeout: 9000, scope: this, html: htmlCode
                }
            ]
        });
    };
    object_panel = createObjectSpacePanel();
    console_panel = createWorkspaceCenterPanel();
    var console_wrapper_panel = console_panel;
    if(firstPromotion) {
        var promotion_panel = new Ext.Panel({
            region:'north',collapsible:false,
            contentEl:'promotion_area_header',
            id:'promotion_area_header_ext_id',
            height:30
        });
        Ext.getElementById('promotion_area_header').style.display = "block";
        console_wrapper_panel = new Ext.Panel({
            layout:'border',region:'center',collapsible:false,
            items:[console_panel , promotion_panel]
        });
    }
    global_main_panel = new Ext.Panel({
        //frame: true,
        border: 0,
        layout: 'border',
        width:"auto",
        defaults: {
            split: true,
            collapsible: true
        },
        items: [
            createHeaderPanel(),
            object_panel ,
            console_wrapper_panel
        ],
        resetTitle: function () {
            if(canResetTitle()) {
                var instHATypeSpan = document.getElementById("instHAType");
                if (instHATypeSpan && db_instance_ha_type) {
                    instHATypeSpan.innerHTML = db_instance_ha_type;
                }
                var shortShow = "";
                if(demoEnv) {
                    shortShow = "dms_database_lab";
                }else {
                    if (connect_ip.length > 15) {
                        var instanceId = connect_ip.substring(0, connect_ip.indexOf('.'));
                        shortShow = instanceId.substring(0, 25);
                    } else {
                        shortShow = connect_ip;
                    }

                    if(connectByGateway) {
                        shortShow = "Gateway:(" + gatewayName + ") "  + shortShow
                    }
                }

                var instance = document.getElementById("instance_area");
                if(instance) {
                    instance.innerHTML=shortShow;
                    var dataN = document.createAttribute("data-fullName");
                    if(dataN) {
                        // dataN.nodeValue = connect_ip+":"+connect_port;
                        dataN.nodeValue = shortShow;
                        instance.attributes.setNamedItem(dataN);
                    }
                }
            }
        },
        refreshComponents: function () {
            object_panel.refreshDatabases();
        }
    });
    global_main_panel.resetTitle();
    return global_main_panel;
};

var canResetTitle = function() {
    return (system_name !== 'tae' && system_name !== 'demo');
};
/*
 *   header panel  页面头部
 **/
var createHeaderPanel = function () {
    if(headerRegion === 'west') {
        return Ext.Panel({
            id:'west-panel',
            region: 'west',
            width:51,
            contentEl: 'left-header',
            border: false,
            split: false,
            collapsible: false,
            baseCls:"fixHeightBug"
        });
    }else {
        return Ext.Panel({
            region: 'north',
            contentEl: 'header_div',
            border: false,
            split: false,
            collapsible: false,
            baseCls:"fixHeightBug",
            bodyStyle: {
                height:"300px"
            }
        })
    }
};

var resetTabTitle = function(preId,newTitle) {
    console_panel.resetTabTitle(preId , newTitle);
};
var init_store_tabs = {};
var initStoreTabs = function() {
    init_store_tabs = jsonDecode(
        SimpleStorageUtils.getByDefault("__DMS_INSTANCE_" + connect_ip + ":" + connect_port + "@" + connect_user , "{}")
    );
};
var isMetadataDB = function(dbName) {
    return dbName === 'mysql' || dbName === 'information_schema' || dbName === 'performance_schema' || dbName === 'sys';
};
var createObjectSpacePanel = function () {

    var tablePanel , viewPanel, progObjPanel;
    var workSpacePanel = new IDB.TabPanel({
        collapsible:false,
        items: []
    });
    var nowDBName = init_store_tabs['dbName'] || null , oldDBName = null, initedObjects = false;


    var onlyRefresh = function () {
        refreshTabPanel();
        refreshViewPanel();
        refreshProgObjPanel();
    };

    var refreshEvery = function () {
        if (nowDBName && oldDBName !== nowDBName) {
            oldDBName = nowDBName;//参数中携带dbName
            if (!tablePanel) {
                Ext.getBody().unmask();
                tablePanel = createTablePanel(nowDBName);
                workSpacePanel.add(tablePanel);
                workSpacePanel.setActiveTab(0);
            } else {
                refreshTabPanel();
            }
            if (!viewPanel) {
                viewPanel = createViewPanel(nowDBName);
                workSpacePanel.add(viewPanel);
            } else {
                refreshViewPanel();
            }


            if (!progObjPanel) {
                progObjPanel = createProgObjPanel(nowDBName);
                workSpacePanel.add(progObjPanel);
            }
            else {
                refreshProgObjPanel();
            }
        }else {
            Ext.getBody().unmask();
        }
    };

    var refreshTabPanel = function () {
        tablePanel.refreshByDBName(nowDBName);
    };

    var refreshViewPanel = function () {
        viewPanel.refreshByDBName(nowDBName);
    };


    var refreshProgObjPanel = function () {
        progObjPanel.refreshByDBName(nowDBName);
    };

    var dbCommon = null , forceSelectFirst = (nowDBName == null);
    var refreshStore = function () {
        Ext.getBody().mask($pub.refeshing);
        dbCommon.store.load();
    };
    return createWrapperPanel(workSpacePanel, {
        region: 'west', width: 220,
        title: $mainTree.title.main,
        split:true,
        header:false,
        collapsible:false,
        refreshDatabases: function () {
            forceSelectFirst = true;//切换数据库实例时才会调用
            dbCommon.store.load();
        },
        tbar: [
            dbCommon = new IDB.CommonBox({
                width: 165,
                loadSelectFirst: true,
                url: '/system/showDataBases.do',
                loadSelect:function(combo) {
                    var checkRow = (forceSelectFirst ? null : nowDBName);
                    forceSelectFirst = false;
                    combo.store.each(function(record) {
                        var data = record.get('data');
                        if(!checkRow && !isMetadataDB(data)) {
                            checkRow = data;
                        }
                    });
                    if(checkRow) {
                        combo.setValue(checkRow);
                    }else {
                        combo.selectFirst();
                    }
                    if(nowDBName) {
                        nowDBName = combo.getValue();
                    }
                },
                loadCallBack: function (combo) {
                    if (initedObjects) {
                        if (combo.store.find('data', nowDBName) !== -1) {//切换实例或库被改
                            combo.setValue(nowDBName);
                        } else {
                            nowDBName = combo.getValue();
                        }
                        onlyRefresh();
                    } else {
                        nowDBName = combo.getValue();
                        refreshEvery();
                        initedObjects = true;
                    }
                },
                selectCallBack: function (combo) {
                    nowDBName = combo.getValue();
                    refreshEvery();
                }
            }),
            {
                iconCls: 'fa fa-refresh', handler: function () {
                setTimeout(refreshStore, 100);
            }
            }
        ],
        getNowDBName: function () {
            return nowDBName || '';
        },
        refreshone: function (objecttype) {
            if (objecttype === objectTypeMap.table) {
                refreshTabPanel();
            }else if (objecttype === objectTypeMap.view) {
                refreshViewPanel();
            }else if (objecttype === objectTypeMap.progobjs) {
                refreshProgObjPanel();
            }
        },
        refreshTabPanel: function () {
            tablePanel.refreshByDBName(nowDBName);
        },
        refreshViewPanel: function () {
            viewPanel.refreshByDBName(nowDBName);
        },
        collapseCombo: function () {
            dbCommon.collapse();
            Ext.each(PUBLIC_RIGHT_MENUS, function (rightMenu) {
                rightMenu.hide();
            });
            if(TAB_RIGHT_MENU) {
                TAB_RIGHT_MENU.hideMenu();
            }
        },
        refreshTableChild:function(node) {
            tablePanel.refreshNodeCallBack(node);
        }
    });
};
var executeSQLWithCallback = function(_script , dbName , fn , otherName , maskWin) {
    maskBodyOrWin($pub.executingSQL + ':' + _script , maskWin);
    var url = '/structure/table/executeScriptByMainPanel' + (otherName || '') + '.do';
    var d = new Ext.util.DelayedTask(function() {
        wsAjax({
            url: url,
            timeout:3600000 * 12,
            params: {script: _script, dbName: dbName},
            success: function (resp) {
                unMaskBodyOrWin(maskWin);
                var json = jsonDecode(resp.responseText);
                if (json.success) {
                    if(fn) {
                        fn.call(this , json);
                    }else {
                        $.message.success($pub.sql + ':[' + _script  + ']' + $pub.executeSuccess + '!');
                    }
                }else {
                    $.message.error(json.root);
                }
            },
            failure: function (resp) {
                unMaskBodyOrWin(maskWin);
                $.message.error($pub.executeNetworkError);
            }
        });
    });
    d.delay(100);
};
var onlyExecuteSQL = function (content, panel, nowDBName, objectName, objectType, successMsg) {
    Ext.getBody().mask($pub.submittedJob);
    ajax({
        url: '/structure/table/executeScriptByMainPanel.do',
        params: {script: content, dbName: nowDBName},
        success: function (resp) {
            Ext.getBody().unmask();
            var json = jsonDecode(resp.responseText);
            if (json.success) {
                if (successMsg) {
                    $.message.success(successMsg);
                } else {
                    panel.refreshByDBName(nowDBName);
                    console_panel.closeByObject(nowDBName, objectName, objectType);
                }
            } else {
                $.message.error(json.root);
            }
        },
        failure: function (resp) {
            Ext.getBody().unmask();
            $.message.error($pub.executeNetworkError);
        }
    });
};
var createTablePanel = function (nowDbName) {
    var treeStore = new IDB.TreeStore({
        //autoLoad: false,
        dbName: nowDbName,
        fields:['id' , 'text' , 'expanded' , 'leaf' , 'iconCls' , 'children', 'treeType' , 'tableName' , 'realName' , 'realText'],
        url: '/system/showTablesTree.do'
    });
    var tmpRecord = null , expandNodeType = null , expandNodeName = null;
    treeStore.on('load', function () {
        tree.setLoading(false);
    });
    treeStore.on('beforeload' , function(store , operation) {
        if(operation.params) {
            if(!operation.params['type']) {
                operation.params['type'] = expandNodeType;
            }
            if(!operation.params['name']) {
                operation.params['name'] = expandNodeName;
            }
        }
    });
    var resetExpanded = function() {
        expandNodeType = null;
        expandNodeName = null;
    };

    var tableControlCallBack = function(start,end) {
        if (tmpRecord) {
            var tabName = tmpRecord.get('text');
            var sql = start + ' TABLE `' + tabName.replaceAll("`" , "``") + "`";
            if(end) {
                sql += " " + end;
            }
            Ext.Msg.confirm($pub.prompt , $pub.operationStart + sql + $pub.operationConfirm , function(v) {
                if(v === 'yes') {
                    executeSQLWithCallback(sql , tmpDBName);
                }
            });
        }
    };



    var isOpenDBS = false;
    var openDBSUrl = "";
    if(typeof dbsRedirectUrl!="undefined"){
        isOpenDBS = dbsRedirectUrl ? true  : false;
        openDBSUrl = dbsRedirectUrl;
    }

    var limitExportDB = getBidModuleLimitByModuleName('export_db');
    var isLimitExport = (limitExportDB === "OFF");
    //var isLimitAllExport = (limitAllExport == "1");
    var tableRightMenu = new Ext.menu.Menu({
        items: [{
            text: $mainTree.menu.sqlOptionData, handler: function () {
                if (tmpRecord) {
                    var tabName = tmpRecord.get('text');
                    console_panel.addUrlPanel('/data/multiSqlWindow.do', tabName, 'sqlWindow', 'query' , null , getSQLWindowParamsStr("sqlWindow" , ""));
                }
            }
        },{
            text: $mainTree.menu.openTable, handler: function () {
                if (tmpRecord) {
                    var tabName = tmpRecord.get('text');
                    console_panel.addUrlPanel('/data/queryTable.do', tabName, 'query_table', 'query_table');
                }
            }
        },{
            text: $mainTree.menu.dataPlan,menu:[{
                text: $mainTree.menu.autoBuildTestData ,handler:function() {
                    var result = console_panel.addUrlPanel("/data/generate/generateBase.do", 'generate_base_view', 'generate', 'generate', tmpDBName,
                        jsonToString({tableName: tmpRecord.get('text'), dbName: tmpDBName}));
                    if (result && result.old) {
                        var iframe = document.getElementById(result.old + "_iframe");
                        iframe.contentWindow.GenerateListPanel.addTableJob({tableName: tmpRecord.get('text'), dbName: tmpDBName}, null);
                    }
                }
            },{
                text:$main.menu.clone,handler:function() {
                    console_panel.addUrlPanel("/data/clone-db/clone-db-page.do", $main.menu.clone , "db_clone", 'more');
                }
            },{
                text:$main.menu.traceData , hidden: rdsFlag === "null" || connectByGateway,handler:function() {
                    if (tmpRecord) {
                        var tabName = tmpRecord.get('text');
                        var addResult = console_panel.addUrlPanel("/data/track/trackBaseView.do?" + encodeURI("schemaName=" + object_panel.getNowDBName() + "&tableName=" + tabName) + "&token=" + user_token, "数据追踪", "data_track", 'more', '', '');

                        if(addResult.old) {
                            var panel = Ext.getCmp(addResult.old);
                            var iframe = panel.el.down('iframe').dom;
                            iframe.contentWindow.showTrackAddJobDialog({
                                requestAddJobName : $main.label.traceTable + tabName,
                                requestAddJobSchemaName : object_panel.getNowDBName(),
                                requestAddJobTableName : tabName
                            });
                        }
                    }
                }
            },{
                text : $main.menu.dataTrend, hidden: rdsFlag === "null" || connectByGateway,menu:[
                    {
                        text: $main.title.tableDataTrend, handler:function() {
                        PayOptions.checkPay("DATA_TREND",function(){
                            if (tmpRecord) {
                                var tabName = tmpRecord.get('text');
                                console_panel.addUrlPanel("/instance/tableDataTrend.do?dbName="
                                + encodeURIComponent(object_panel.getNowDBName())
                                + "&tableName=" + encodeURIComponent(tabName)
                                + "&token=" + user_token, $main.menu.dataTrend + '(' + $pub.table + ':' + tabName + ')', 'dateStatistics', 'instance', 'datatrend');

                            }
                        });
                    }
                    },
                    {
                        text: $main.title.dbDataTrend, handler:function() {
                        PayOptions.checkPay("DATA_TREND",function(){
                            if (tmpRecord) {
                                var tabName = tmpRecord.get('text');
                                console_panel.addUrlPanel("/instance/dbDataTrend.do?dbName="
                                + encodeURIComponent(object_panel.getNowDBName())
                                + "&tableName=" + encodeURIComponent(tabName)
                                + "&token=" + user_token, $main.menu.dataTrend + '('+  $pub.db +':'+object_panel.getNowDBName()+')','dateStatistics' ,'instance','datatrend');


                            }
                        })
                    }
                    }
                ]
            },{
                text: $pub.bi, hidden: !biApiStart || connectByGateway, handler: function () {
                    if (tmpRecord) {
                        var tabName = tmpRecord.get('text');
                        window.open("/mysql/biAnalysisTable.do?dbName="
                        + encodeURIComponent(object_panel.getNowDBName())
                        + "&tableName=" + encodeURIComponent(tabName)
                        + "&token=" + user_token);
                    }
                }
            },{
                text: $main.menu.tableStructureCompare ,handler:function() {
                    console_panel.addUrlPanel("/structure/compare/to-compare-page.do?action=add", $main.menu.tableStructureCompare , "structure_compare", 'more');
                }
            }]
        } ,'-',{
                text: $mainTree.menu.createTable, handler: function () {
                console_panel.addUrlPanel('/structure/table/tableBase.do', '', 'table', 'create');
                }
        },{
                text: $mainTree.menu.editTable, handler: function () {
                if (tmpRecord) {
                    console_panel.addUrlPanel('/structure/table/tableBase.do', tmpRecord.get('text'), 'table', 'change');
                }
            }
        },'-', {
                text: $mainTree.menu.dropTable, handler: function () {
                if (tmpRecord) {
                    var tabName = tmpRecord.get('text');
                    Ext.Msg.confirm($pub.waring, $pub.confirmDropObject.format(' 【' + tabName + '】？'), function (v) {
                        if (v === 'yes') {
                            onlyExecuteSQL('drop table `' + String(tmpRecord.get('text')).replaceAll("`", "``") + "`", tree, tmpDBName, tmpRecord.get('text'), 'table');
                        }
                    });
                }
            }
        },{
                text: $mainTree.menu.truncateTable, handler: function () {
                    if (tmpRecord) {
                        var tabName = tmpRecord.get('text');
                        Ext.Msg.confirm($pub.waring, $main.label.confirmTruncateTable + ' 【' + tabName + '】？', function (v) {
                            if (v === 'yes') {
                                onlyExecuteSQL('truncate table `' + String(tmpRecord.get('text')).replaceAll("`", "``") + "`", tree, tmpDBName, tmpRecord.get('text'), 'table', $pub.title + '【' + tabName + '】' + $main.callback.truncateTable + '!');
                            }
                        });
                    }
                }
            },{
                text: $pub.renameTable, handler: function () {
                    if (tmpRecord) {
                        var tabName = tmpRecord.get('text');
                        var form = new IDB.FormPanel({
                            margin: '2 0 0 0',
                            items: [
                                {
                                    xtype: 'textfield',
                                    width: 460,
                                    name: 'toName',
                                    fieldLabel: $main.form.rename,
                                    labelWidth: 130,
                                    value: tabName
                                }
                            ],
                            buttons: [
                                {
                                    text: $pub.ok, handler: function () {
                                    var toName = form.getForm().findField('toName').getValue();
                                    if (!toName) {
                                        return $.message.warning($main.msg.targetTableNameNull);
                                    }
                                    if (toName === tabName) {
                                        return $.message.warning($main.msg.sameTableName);
                                    }
                                    onlyExecuteSQL('rename table `' + String(tabName).replaceAll("`", "``") + "` to `" + toName.replaceAll("`", "``") + "`", tree, tmpDBName, tmpRecord.get('text'), 'table');
                                    win.close();
                                }
                                },
                                {
                                    text: $pub.cancel, handler: function () {
                                    win.close();
                                }
                                }
                            ]
                        });
                        var win = new IDB.Window({
                            title: $pub.renameTable + '：[' + tabName + "]", items: [form], width: 500, height: 110
                        });
                    }
                }
        },{
                text: $main.title.createLike, handler: function () {
                    if (tmpRecord) {
                        var tabName = tmpRecord.get('text');
                        var form = new IDB.FormPanel({
                            margin: '2 0 0 0',
                            items: [
                                {
                                    xtype: 'textfield',
                                    name: 'toName',
                                    width: 460,
                                    fieldLabel: $main.title.targetTableName,
                                    labelWidth: 130,
                                    value: tabName
                                }
                            ],
                            buttons: [
                                {
                                    text: $pub.ok, handler: function () {
                                    var toName = form.getForm().findField('toName').getValue();
                                    if (!toName) {
                                        return $.message.warning($main.msg.targetTableNameNull);
                                    }
                                    if (toName === tabName) {
                                        return $.message.warning($main.msg.sameTableName);
                                    }
                                    onlyExecuteSQL('create table `' + toName.replaceAll("`", "``") + "` like `" + String(tabName).replaceAll("`", "``") + "`", tree, tmpDBName, tmpRecord.get('text'), 'table');
                                    win.close();
                                }
                                },
                                {
                                    text: $pub.cancel, handler: function () {
                                    win.close();
                                }
                                }
                            ]
                        });
                        var win = new IDB.Window({
                            title: $main.title.byTable + ': [' + tabName + '] ' + $main.title.createLike, items: [form], width: 500, height: 110
                        });
                    }
                }
        },{
                text: $main.menu.batchOptionTable , menu:[{
                    text: $mainTree.menu.batchDropTable , handler:function() {
                        dropTables(tmpDBName , Ext.getCmp('likeTableName').getValue());
                    }
                },{
                    text: $mainTree.menu.moreBatchOption , handler:function() {
                        console_panel.addUrlPanel('/structure/table/tableList.do', '', '', 'tableBatchOptr',tmpDBName);
                    }
                }]
            },
            '-',
            {
                text: $mainTree.menu.makeSQLTemplate , handler: function () {
                if (tmpRecord) {
                    var tabName = tmpRecord.get('text');
                    Ext.getBody().mask($pub.loading);
                    ajax({
                        url: '/structure/table/getMySQLTableStructureBase.do',
                        params: {tableName: tabName, dbName: tmpDBName, columns: 'true'},
                        success: function (resp) {
                            Ext.getBody().unmask();
                            var json = jsonDecode(resp.responseText);
                            if (json.success) {
                                showTableTemplateSQL(json.root);
                            } else {
                                $.message.error(json.root);
                            }
                        },
                        failure: function () {
                            Ext.getBody().unmask();
                            $.message.error($pub.executeNetworkError);
                        }
                    });
                }
            }
            },
            {
                text: $pub.tableOperation,
                menu:[{
                    text: $pub.optimizeTable,handler:function() {
                        tableControlCallBack('OPTIMIZE');
                    }
                },{
                    text: $pub.checkTable,menu:[{
                        text: $mainTree.menu.normal,handler:function() {
                            tableControlCallBack('CHECK');
                        }
                    },{
                        text: $mainTree.menu.quick,handler:function() {
                            tableControlCallBack('CHECK' , 'QUICK');
                        }
                    },{
                        text: $mainTree.menu.fast,handler:function() {
                            tableControlCallBack('CHECK' , 'FAST');
                        }
                    },{
                        text: $mainTree.menu.changed,handler:function() {
                            tableControlCallBack('CHECK' , 'CHANGED');
                        }
                    },{
                        text: $mainTree.menu.extended,handler:function() {
                            tableControlCallBack('CHECK' , 'EXTENDED');
                        }
                    }]
                },{
                    text: $pub.repairTable , menu:[{
                        text: $mainTree.menu.normal,handler:function() {
                            tableControlCallBack('REPAIR');
                        }
                    },{
                        text: $mainTree.menu.quick,handler:function() {
                            tableControlCallBack('REPAIR' , "QUICK");
                        }
                    },{
                        text: $mainTree.menu.extended,handler:function() {
                            tableControlCallBack('REPAIR' , "EXTENDED");
                        }
                    }]
                },{
                    text: $pub.analyzeTable,handler:function() {
                        tableControlCallBack('ANALYZE');
                    }
                }]
            },'-',
            {
                text:$main.menu.export,
                menu: [
                    {
                        text: $mainTree.menu.exportNowTable, hidden: isLimitExport, handler: function () {
                        if (limitExport === "1") {
                            return $.message.warning($main.msg.limitJST);
                        }
                        var result = console_panel.addUrlPanel('/data/export/exportBaseView.do', 'export_base_view', 'export', 'export', tmpDBName,
                            jsonToString({tableName: tmpRecord.get('text'), dbName: tmpDBName, exportType: 'table'}));
                        if (result && result.old) {
                            var iframe = document.getElementById(result.old + "_iframe");
                            iframe.contentWindow.addTableJob({tableName: tmpRecord.get('text'), dbName: tmpDBName, exportType: 'table'});
                        }
                    }
                    },
                    {
                        text: $mainTree.menu.exportNowDB, hidden: isLimitExport, handler: function () {
                        if (limitExport === "1") {
                            return $.message.warning($main.msg.limitJST);
                        }
                        var result = console_panel.addUrlPanel('/data/export/exportBaseView.do', 'export_base_view', 'export', 'export', tmpDBName,
                            jsonToString({exportType: 'db', dbName: tmpDBName}));
                        if (result && result.old) {
                            var iframe = document.getElementById(result.old + "_iframe");
                            iframe.contentWindow.addNewDBJob({exportType: 'db', dbName: tmpDBName});
                        }
                    }
                    },{
                        text: $main.menu.makeDocument + '（Word、Excel、PDF）',menu:[{
                            text : $mainTree.menu.makeWordDocument , handler:function() {
                                var url = "/mysql/dictionary/download-doc.do?nowDBName="
                                    + encodeURIComponent(tmpDBName) + "&token=" + user_token;
                                downLoadFileByURL(url);
                            }
                        },{
                            text : $mainTree.menu.makeExcelDocument ,handler:function() {
                                var url = "/mysql/dictionary/download-xls.do?nowDBName="
                                    + encodeURIComponent(tmpDBName) + "&token=" + user_token;
                                downLoadFileByURL(url);
                            }
                        },{
                            text : $mainTree.menu.makePdfDocument ,handler:function() {
                                var url = "/mysql/dictionary/download-pdf.do?nowDBName="
                                    + encodeURIComponent(tmpDBName) + "&token=" + user_token;
                                downLoadFileByURL(url);
                            }
                        },{
                            text : $mainTree.menu.OnlineBrowse,handler:function() {
                                window.open('/mysql/dictionary/showdict.do?nowDBName=' + encodeURIComponent(tmpDBName) + "&token=" + user_token + "&panelKey=dictionary");
                            }
                        }]
                    },{
                        text: $mainTree.menu.exportDDL,handler:function() {
                            exportAllStructure(tmpDBName);
                        }
                    }
                ]
            },

            {
                text:$main.menu.dbsBackupAndRestore + '<span style="color: red">（' + $simple.new + '）</span>',hidden: !isOpenDBS,
                menu: [
                    {
                        text: $main.menu.dbsBackup + '<span style="color: red">（' + $simple.new + '）</span>', handler: function () {
                        var tabName = "";
                        if (tmpRecord) {
                            tabName = tmpRecord.get('text');
                        }
                        window.open(openDBSUrl + "&dbName=" + tmpDBName + "&tableName=" + tabName,'_blank');
                    }
                    },
                    {
                        text: $main.menu.dbsRestore + '<span style="color: red">（' + $simple.new + '）</span>', handler: function () {
                        var tabName = "";
                        if (tmpRecord) {
                            tabName = tmpRecord.get('text');
                        }
                        window.open(openDBSUrl + "&dbName=" + tmpDBName + "&tableName=" + tabName + "&recover=true",'_blank');
                    }
                    }
                ]
            },




            '-',
            {
                text: $pub.refresh, handler: function () {
                if (tmpDBName) {
                    tree.refreshByDBName(tmpDBName);
                }
            }
            },
            {
                text: $mainTree.menu.objectInfo, handler: function () {
                if (tmpRecord) {
                    var tabName = tmpRecord.get('text');
                    Ext.getBody().mask($pub.loading);
                    ajax({
                        url: '/structure/table/getMySQLTableStructureBase.do',
                        params: {tableName: tabName, dbName: tmpDBName},
                        success: function (resp) {
                            Ext.getBody().unmask();
                            var json = jsonDecode(resp.responseText);
                            if (json.success) {
                                showTableObject(json.root);
                            } else {
                                return $.message.error(json.root);
                            }
                        },
                        failure: function () {
                            Ext.getBody().unmask();
                            $.message.error($pub.executeNetworkError);
                        }
                    });
                }
            }
            }
        ]
    });


    //tableRightMenu.add();



    var tableRightMenu2 = new Ext.menu.Menu({
        items: [
            {
                text: $mainTree.menu.createTable, handler: function () {
                console_panel.addUrlPanel('/structure/table/tableBase.do', '', 'table', 'create');
            }
            },
            {
                text: $mainTree.menu.objectInfo, handler: function () {
                if (tmpDBName) {
                    tree.refreshByDBName(tmpDBName);
                }
            }
            }
        ]
    });
    var nowRightMenuRecord = null , nowLeafRecord = null;
    var setNodeTextByChild = function(node) {
        var length = node.childNodes.length;
        node.set('text' , node.get('realText') + "（" + length + "）");
    };
    var refreshNowCallBack = function(node) {
        node = node || nowRightMenuRecord;
        expandNodeType = node.get('treeType');
        expandNodeName = node.get('tableName') || node.get('text');
        treeStore.load({
            node:node,
            callback:function() {
                setNodeTextByChild(node);
                node.expand();
            }
        });
    };
    var addColumnMenu =  {
        text: $tableEdit.addColumn, handler:function() {
            addNewColumn(tmpDBName ,nowRightMenuRecord , null);
        }
    };
    var columnGroupRightMenu = new Ext.menu.Menu({
        items:[
            addColumnMenu,{
                text: $pub.refresh, handler:function() {refreshNowCallBack();}
            }
        ]
    });
    var columnRightMenu = new Ext.menu.Menu({
        items:[
            addColumnMenu,{
                text: $tableEdit.editColumn, handler:function() {
                    addNewColumn(tmpDBName ,nowRightMenuRecord , nowLeafRecord.get('realName'));
                }
            },{
                text: $tableEdit.dropColumn, handler:function() {
                    deleteColumn(tmpDBName , nowRightMenuRecord , nowLeafRecord.get('realName'));
                }
            },{
                text: $pub.refresh, handler:function() {refreshNowCallBack();}
            }
        ]
    });
    var indexGroupMenu = new Ext.menu.Menu({
        items:[
            {
                text: $tableEdit.addIndex, handler:function() {
                addTableIndex(tmpDBName , nowRightMenuRecord , null);
            }
            },{
                text: $pub.refresh, handler:function() {refreshNowCallBack();}
            }
        ]
    });
    var indexMenu = new Ext.menu.Menu({
        items:[
            {
                text: $tableEdit.addIndex, handler:function() {
                addTableIndex(tmpDBName , nowRightMenuRecord , null);
            }
            },{
                text: $tableEdit.editIndex, handler:function() {
                    addTableIndex(tmpDBName , nowRightMenuRecord , nowLeafRecord.get('realName'));
                }
            },{
                text: $tableEdit.dropIndex, handler:function() {
                    deleteIndex(tmpDBName , nowRightMenuRecord , nowLeafRecord.get('realName'));
                }
            },{
                text: $pub.refresh, handler:function() {refreshNowCallBack();}
            }
        ]
    });
    PUBLIC_RIGHT_MENUS.push(tableRightMenu, tableRightMenu2 , columnGroupRightMenu , columnRightMenu , indexGroupMenu , indexMenu);
    var itemClickCallback = function(thiz , record , e) {
        var type = record.get('treeType');
        if(type === 'table')  {
            tmpRecord = record;
            tableRightMenu.showAt(e.getXY());
        }else if(type === 'column_group') {
            nowRightMenuRecord = record;
            columnGroupRightMenu.showAt(e.getXY());
        }else if(type === 'column') {
            nowLeafRecord = record;
            nowRightMenuRecord = record.parentNode;
            columnRightMenu.showAt(e.getXY());
        }else if(type === 'index_group') {
            nowRightMenuRecord = record;
            indexGroupMenu.showAt(e.getXY());
        }else if(type === 'index') {
            nowLeafRecord = record;
            nowRightMenuRecord = record.parentNode;
            indexMenu.showAt(e.getXY());
        }
    };
    var tmpDBName = nowDbName;
    var tree = new Ext.tree.Panel({
        store: treeStore,
        loadMask: true,
        emptyText: $pub.click + '<a href="javascript:console_panel.addUrlPanel(\'/structure/table/tableBase.do\', \'\', \'table\', \'create\');" style="font-weight: bold;color: #0000ff;">' + $mainTree.label.here + '</a>' + $mainTree.label.startCreateTable,
        title: $pub.table,
        rootVisible: false,
        refreshByDBName: function (dbName) {
            if(tree.loadMask && tree.loadMask.isVisible()) {
                // console.log('上一次搜索表名没有结束，忽略本次查询请求。');
                return;
            }
            tmpDBName = treeStore.dbName = dbName;
            tree.setLoading(true);
            resetExpanded();
            var likeTableName = Ext.getCmp('likeTableName').getValue();
            treeStore.load({
                params:{likeTableName:likeTableName},
                callback: function () {
                    Ext.getBody().unmask();
                }
            });
        },
        refreshNodeCallBack:function(node) {
            refreshNowCallBack(node);
        },
        tbar:[{
            xtype:'textfield',
            id:'likeTableName',
            emptyText:$main.tip.searchTableName,
            listeners:{
                change:function(thiz, newValue, oldValue, eOpts){
                    tree.refreshByDBName(tmpDBName);
                },
                specialkey:function(field , e) {
                    if(e.getKey() === e.ENTER) {
                        tree.refreshByDBName(tmpDBName);
                    }
                }
            }
        }],
        listeners: {
            itemclick: function (thiz, record, item, index, e) {
                itemClickCallback(thiz , record , e);
            },
            itemcontextmenu: function (thiz, record, item, index, e) {
                e.preventDefault();
                itemClickCallback(thiz , record , e);
            },
            containercontextmenu: function (thiz, e) {
                e.preventDefault();
                tableRightMenu2.showAt(e.getXY());
            },
            beforeitemexpand  : function(thiz , eOpts) {
                expandNodeType = thiz.get('treeType');
                expandNodeName = thiz.get('tableName') || thiz.get('text');
            },
            afteritemexpand:function(thiz) {
                var treeType = (thiz.get('treeType'));
                if(treeType === 'column_group' || treeType === 'index_group') {
                    setNodeTextByChild(thiz);
                }
            }
        }
    });
    return tree;
};
var exportAllStructure = function(dbName) {
    Ext.getBody().mask($pub.submitJob);
    asynchronousAjax({
        url:'/data/export/exportDbStructure.do',
        retryUrl:'/data/export/monitorExportJob.do',
        params:{dbName:dbName},
        userConfigTime:true,
        success:function(response , options , opts) {
            Ext.getBody().unmask();
            var json = jsonDecode(response.responseText);
            if(json.success) {
                var id = opts.params['id'];
                if(id) {
                    downLoadFileByURL("/mysql/data/export/downLoadAllFile.do?id=" + id  + "&token=" + getUserToken());
                }
            }else {
                $.message.error(json.root);
            }
        },
        failure:function (response, options) {
            Ext.getBody().unmask();
            $.message.error(content['nowLog']);
        },
        runningCallBack:function(json , options , opts) {
            var content = json.root;
            Ext.getBody().unmask();
            if(typeof content === 'string' || typeof content === 'number') {
                opts.params['id'] = content;
                Ext.getBody().mask($pub.submittedJob);
                return true;
            }else {
                var status =  content['exportStatus'];
                if(status === 'END') {
                    return false;
                }
                if(status === 'ERROR') {
                    $.message.error(content['nowLog']);
                    return false;
                }
                opts.sleepTime = 2000;
                Ext.getBody().mask($export.msg.exportedTabs + "：" + Ext.util.Format.htmlDecode(content['exportedTabs']) + "/" + Ext.util.Format.htmlDecode(content['exportTabNum']) + " " + (content['nowLog'] || ''));
                return true;
            }
        }
    });
};
var dropTables = function(dbName , likeTableName) {
    var store = new Ext.data.Store({
        fields:['id' , 'text'],
        proxy: {
            url:'/system/showTableAndSystemViews.do',
            type: 'ajax',
            reader: {
                root: 'root',
                idProperty:'id'
            }
        }
    });
    store.load({params:{dbName:dbName,likeTableName:likeTableName}});
    var grid = new Ext.grid.Panel({
        selType:'checkboxmodel',
        multiSelect:true,
        columns:[
            {text: $pub.tableName,  dataIndex: 'text' ,sortable:false ,flex:1}
        ],
        store:store
    });
    var reloadTables = function() {
        var likeTableName = Ext.getCmp('like_table_name_2').getValue();
        store.load({params:{dbName:dbName,likeTableName:likeTableName}});
    };
    var win = new IDB.Window({
        title: $main.title.batchDropTable + '：' + dbName,layout:'fit',closable:true,width:630,height:430,
        items:[grid],
        tbar:[$pub.tableName , {
            xtype:'textfield',
            id:'like_table_name_2',
            width:350,
            value:likeTableName,
            listeners:{
                specialkey:function(field,e) {
                    if(e.getKey() === e.ENTER) {
                        reloadTables();
                    }
                }
            }
        },{
            iconCls:'fa fa-refresh',handler:reloadTables
        }],
        buttons:[{
            text: $pub.ok, handler:function() {
                var selectionRows = grid.getSelectionModel().getSelection();
                if(!selectionRows || selectionRows.length === 0) {
                    return $.message.warning($pub.noTableSelected);
                }
                var selectRowArray = [];
                Ext.each(selectionRows , function(row) {
                    selectRowArray.push(row.get('text'));
                });
                dropTableDoing(selectRowArray,dbName,Ext.getCmp('like_table_name_2').getValue());
                win.close();
            }
        },{
            text: $pub.cancel, handler:function() {win.close()}
        }]
    });
};
var dropTableDoing = function(selectRowArray,dbName , likeTableName) {
    var dataArray = [];
    Ext.each(selectRowArray , function(table) {
        var sql = 'drop table `' + dbName.replaceAll("`" , "``") + "`.`" + table.replaceAll("`" , "``") + "`";
        dataArray.push({tableName:table,sql:sql,status:'wait'});
    });
    var store = new Ext.data.Store({
        fields:['tableName' , 'sql' , 'status'],
        data:dataArray
    });
    var grid = new Ext.grid.Panel({
        store:store,
        sortableColumns:false,
        deferRowRender:false,
        viewConfig:{ stripeRows:true, enableTextSelection:true},
        columns:[
            Ext.create('Ext.grid.RowNumberer', {width:30}),
            {text: $mainTree.menu.dropTable, dataIndex:"tableName", width:140},
            {text: $pub.executeSQL , dataIndex:"sql", width:500},
            {text: $pub.status , dataIndex:"status", width:70,renderer:function(v){
                if(v === 'wait') {
                    return '<img src="/share/images/icon/start.png" height="14"/></img>';
                }
                if(v === 'run') {
                    return '<img src="/share/images/icon/run.png" height="14"/></img>';
                }
                if(v === 'success') {
                    return '<img src="/share/images/icon/accept.png" height="14"/></img>';
                }
                if(v === 'error') {
                    return '<img src="/share/images/icon/error.png" height="14"/></img>';
                }
            }}
        ]
    });
    var dropBefore = function() {
        var records = [];
        store.each(function(record) {
            if(record.get('status') !== 'success') {
                records.push(record);
            }
        });
        dropDoing(0 , records);
    };
    var dropDoing = function(i,records) {
        var count = records.length;
        var record = records[i];
        i++;
        if(record.get("status") === 'success') {
            if(i < count) {
                dropDoing(i , records);
            }
            return;
        }
        record.set('status' , 'run');
        win.getEl().mask($pub.executingSQL + '：' + record.get('sql'));
        wsAjax({
            url: '/structure/table/dropTableByMainPanel.do',
            params: {script: record.get('sql'), dbName: dbName},
            success: function (resp) {
                win.getEl().unmask();
                var json = jsonDecode(resp.responseText);
                if (json.success) {
                    record.set('status' , 'success');
                    grid.store.commitChanges();
                    if(i < count) {
                        dropDoing(i , records);
                    }else {
                        resetInfo();
                    }
                } else {
                    record.set('status' , 'error');
                    grid.store.commitChanges();
                    if(i < count) {
                        Ext.Msg.confirm($pub.prompt, $pub.table + '：' + record.get('tableName') + $main.msg.dropError + "：" + json.root + "," + $main.msg.continueDrop + "?" , function(v) {
                            if(v === 'yes') {
                                dropDoing(i , records);
                            }else {
                                resetInfo();
                            }
                        });
                    }else {
                        resetInfo();
                        return $.message.warning($pub.table + '：' + record.get('tableName') + $main.msg.dropError + "：" + json.root);
                    }
                }
            },
            failure: function (resp) {
                win.getEl().unmask();
                record.set('status' , 'error');
                grid.store.commitChanges();
                if(i < count) {
                    Ext.Msg.confirm($pub.prompt, $pub.table + '：' + record.get('tableName') + $main.msg.dropError + "：" + json.root + "," + $main.msg.continueDrop + "?" , function(v) {
                        if(v === 'yes') {
                            dropDoing(i , records);
                        }else {
                            resetInfo();
                        }
                    });
                }
            }
        });
    };
    var resetInfo = function() {
        var notExecuteSQL = false;
        store.each(function(record) {
            if(!notExecuteSQL && record.get('status') !== 'success') {
                notExecuteSQL = true;
            }
        });
        if(notExecuteSQL) {
            Ext.getCmp('execute_drop_table_btn').setText($main.button.continueExecute);
        }else {
            Ext.getCmp('execute_drop_table_btn').hide();
            Ext.getCmp('recheck_drop_table_btn').setText($main.button.continueSelectTable);
        }
    };
    var win = new IDB.Window({
        title: $mainTree.msg.confirmDropList + selectRowArray.length,
        width:760,height:430,maximizable:true,closable:true,items:[grid],
        buttons:[{
            text: $main.button.startExecute, id:'execute_drop_table_btn',handler:dropBefore
        },{
            text: $pub.close, handler:function() {win.close()}
        },{
            text: $main.button.reselectTable, id:'recheck_drop_table_btn',handler:function() {
                dropTables(dbName , likeTableName);
                win.close();
            }
        }]
    });
    win.on('beforedestroy' , function() {
        object_panel.refreshTabPanel();
    });
};
var showTableTemplateSQL = function (prop) {
    var columns = prop['columns'] , tableName = prop['tableName'];
    var content = "/*------- INSERT SQL---------*/\n" +
        getInsertSQLByColumns(tableName, columns) +
        "/*------- UPDATE SQL---------*/\n" +
        getUpdateSQLByColumns(tableName, columns) +
        "/*------- SELECT SQL---------*/\n" +
        getSelectSQLByColumns(tableName, columns) +
        "/*------- CREATE SQL---------*/\n" +
        prop['createScript'];
    var sqlArea = new Ext.ux.form.field.CodeMirror({value: content, autoScroll: true});
    var win = new IDB.Window({
        title: $pub.table + '：[' + prop['tableName'] + "] " + $pub.baseInfo,
        width: 600, height: 340,
        items: [sqlArea],
        buttons: [
            {text: $pub.close, handler: function () {
                win.close();
            }}
        ]
    });
};
var getInsertSQLByColumns = function (tableName, columns) {
    var start = "insert into `" + tableName.replaceAll("`", "``") + "` (";
    var values = '\n values(';
    if (columns && columns.length > 0) {
        Ext.each(columns, function (row) {
            start += "`" + row['columnName'].replace("`", "``") + "`,";
            values += '<' + row['columnName'] + ">,";
        });
        start = start.substring(0, start.length - 1) + ")";
        values = values.substring(0, values.length - 1) + ");\n\n";
    }
    return start + values;
};
var getUpdateSQLByColumns = function (tableName, columns) {
    var sql = "update `" + tableName.replaceAll("`", "``") + "` SET ";
    if (columns && columns.length > 0) {
        Ext.each(columns, function (row) {
            sql += "\n    `" + row['columnName'].replace("`", "``") + "`=<value>,";
        });
        sql = sql.substring(0, sql.length - 1) + "\n  where xxx = xxx;\n\n";
    }
    return sql;
};
var getSelectSQLByColumns = function (tableName, columns) {
    var sql = "select ";
    if (columns && columns.length > 0) {
        Ext.each(columns, function (row) {
            sql += "\n    `" + row['columnName'].replace("`", "``") + "`,";
        });
        sql = sql.substring(0, sql.length - 1) + "\n  from `" + tableName.replaceAll("`", "``") + "`\n  where xxx = xxx;\n\n";
    }
    return sql;
};
var showTableObject = function (prop) {
    var innoDBTitle = "";
    if(prop['engine'] === 'InnoDB') {
        innoDBTitle = " （" + $pub.estimate + "）";
    }
    var array = [
        {data: $pub.db, label: prop['dbName']},
        {data: $pub.tableName, label: prop['tableName']},
        {data: $pub.rows, label: prop['rows'] + innoDBTitle},
        {data: $pub.dataCapacity, label: renderSize(prop['dataLength'])},
        {data: $pub.indexCapacity, label: renderSize(prop['indexLength'])},
        {data: $pub.comment, label: prop['comment']},
        {data: $pub.engine, label: prop['engine']},
        {data: $pub.characterSet, label: prop['charset']},
        {data: $pub.collation, label: prop['collate']},
        {data: $tableEdit.autoIncrementValue, label: prop['autoIncrement']},
        {data: $tableEdit.rowFormat, label: prop['rowFormat']},
        {data: $pub.optionSet, label: prop['createOption']},
        {data: $tableEdit.menu.partition, label: (prop['partitionContent'] ? $pub.yes : $pub.no)}
    ];
    var grid = new Ext.grid.Panel({
        selType: 'rowmodel',
        title: $pub.baseInfo,
        viewConfig: { stripeRows: true, enableTextSelection: true},
        columns: [
            {xtype: 'rownumberer'},
            {text: $pub.propertyName, dataIndex: 'data', sortable: false, flex: 1},
            {text: $pub.propertyValue, dataIndex: 'label', sortable: false, flex: 2}
        ],
        store: new Ext.data.Store({
            fields: ['data' , 'label'],
            data: array,
            proxy: {
                type: 'memory'
            }
        })
    });
    var sqlArea = new Ext.ux.form.field.CodeMirror({value: prop['createScript'], readOnly: true, autoScroll: true});
    var tabPanel = new Ext.tab.Panel({
        margin: '2 0 0 0', activeTab: 0, items: [grid, {
            title: $pub.createScript, autoScroll: true,
            layout: 'fit', items: [sqlArea]
        }]
    });
    var win = new IDB.Window({
        title: $pub.table + '：[' + prop['tableName'] + "] " + $pub.baseInfo,
        width: 600, height: 340,
        items: [tabPanel],
        buttons: [
            {text: $pub.close, handler: function () {
                win.close();
            }}
        ]
    });
};

var dropFuncProc = function (treeNode, rec) {
    var parentid = rec.parentNode.get("id");
    if (parentid === $pub.trigger) {
        var trgid = rec.get("text");
        Ext.MessageBox.confirm($pub.confirm, $pub.confirmDropObject.format($pub.trigger) + '：' + trgid, function (btn) {
            if (btn === 'yes') {
                ajax({
                    url: '/structure/trigger/dropTrigger.do',
                    params: {nowDBName: treeNode.dbName, objectName: trgid},
                    success: function (response) {
                        var json = jsonDecode(response.responseText);
                        if (json.success) {
                            $.message.success($pub.trigger + '：[' + trgid + '] ' + $pub.dropSuccess + '。');
                            setTimeout(function() {
                                object_panel.refreshone(objectTypeMap.progobjs);
                                console_panel.closeByObject(treeNode.dbName, trgid, 'trigger');
                            } , 50);
                        }
                    }
                });
            }
        });
    }
    else if (parentid === $pub.event) {
        var eventName = rec.get("text");
        Ext.MessageBox.confirm($pub.confirm, $pub.confirmDropObject.format($pub.event) + '：' + eventName, function (btn) {
            if (btn === 'yes') {
                ajax({
                    url: '/structure/event/dropEvent.do',
                    params: {nowDBName: treeNode.dbName, "eventName": eventName},
                    success: function (response) {
                        var json = jsonDecode(response.responseText);
                        if (json.success) {
                            $.message.success($pub.event + '：[' + eventName + '] ' + $pub.dropSuccess + '。');
                            setTimeout(function() {
                                object_panel.refreshone(objectTypeMap.progobjs);
                                console_panel.closeByObject(treeNode.dbName, eventName, 'event');
                            } , 50);
                        }
                    }
                });
            }
        });

    }
    else if ((parentid === $pub.function) || (parentid === $pub.procedure)) {
        var objid = rec.get("text");
        var typekey = '';
        var backendtype = '';
        var requestUri = '';
        if (parentid === $pub.function) {
            typekey = 'func';
            backendtype = 'FUNCTION';
            requestUri = '/structure/function/drop-function.do';
        }else {
            typekey = 'proc';
            backendtype = 'PROCEDURE';
            requestUri = '/structure/procedure/drop-procedure.do';
        }
        var prompttype = objectDisplayTypeMap[typekey];
        Ext.MessageBox.confirm($pub.confirm, $pub.confirmDropObject.format(prompttype) + '：' + treeNode.dbName + "." + objid, function (btn) {
            if (btn === 'yes') {
                ajax({
                    url: requestUri,
                    params: {funcprocType: backendtype, nowDBName: treeNode.dbName, objectName: objid},
                    success: function (response) {
                        var json = jsonDecode(response.responseText);
                        if (json.success) {
                            $.message.success(treeNode.dbName + "." + objid + ' ' + $pub.dropSuccess + '。');
                            setTimeout(function() {
                                object_panel.refreshone(objectTypeMap.progobjs);
                                console_panel.closeByObject(treeNode.dbName, objid, typekey);
                            } , 50);
                        }
                    }
                });
            }
        });
    }
};

var createProgObjPanel = function (nowDbName) {
    var treeStore = Ext.create('Ext.data.TreeStore', {
            dbName: nowDbName,
            proxy: {
                type: 'ajax',
                url: '/system/showProgramObjects.do'
            },
            listeners: {
                beforeload: function (store, operation, opts) {
                    if (operation.params && !operation.params.panelKey) {
                        operation.params.panelKey = getPaneKey();
                    } else {
                        operation.params = {panelKey: getPaneKey()};
                    }
                    if (!operation.params.dbName && store.dbName) {
                        operation.params.dbName = store.dbName;
                    }
                }
            }
        }
    );
    treeStore.on('load', function () {
        tree.setLoading(false);
    });

    treeStore.load();

    var showProcFuncView = function (record, action) {
        var tmpName = record.parentNode.get("id");
        switch(tmpName) {
            case $pub.trigger: console_panel.addUrlPanel('/structure/trigger/triggerBase.do', record.get('text'), 'trigger', action);break;
            case $pub.function: console_panel.addUrlPanel('/structure/function/function-page.do?funcprocType=FUNCTION', record.get('text'), 'func', action);break;
            case $pub.procedure: console_panel.addUrlPanel('/structure/procedure/procedure-page.do?funcprocType=PROCEDURE', record.get('text'), 'proc', action);break;
            case $pub.event: console_panel.addUrlPanel('/structure/event/getEventDetail.do', record.get('text'), 'event', action);break;
        }
    };

    var executeProcedure = function (record, action) {
        var tmpName = record.parentNode.get("id");
        var result = console_panel.addUrlPanel('/structure/procedure/procedure-page.do?funcprocType=PROCEDURE', record.get('text'), 'proc', action);
        if (result && result.old) {
            var iframe = document.getElementById(result.old + "_iframe");
            if(!iframe.contentWindow.action_fun.isExecute) {
                iframe.contentWindow.action_fun.executeProcedure();
            }else {
                $.message.warning($pub.executing);
            }
        }
    };

    var executeFunction = function (record, action) {
        var tmpName = record.parentNode.get("id");
        var result = console_panel.addUrlPanel('/structure/function/function-page.do?funcprocType=FUNCTION', record.get('text'), 'func', action);
        if (result && result.old) {
            var iframe = document.getElementById(result.old + "_iframe");
            if(!iframe.contentWindow.action_fun.isExecute) {
                iframe.contentWindow.action_fun.executeFunction();
            }else {
                $.message.warning($pub.executing);
            }
        }
    };

    /**
     * 树类的代码
     * @type {Ext.tree.Panel}
     */
    var tree = new Ext.tree.Panel({
        store: treeStore,
        title: $main.title.programmingObject,
        rootVisible: false,
        name: 'funcProcTrees',
        refreshByDBName: function (dbName) {
            treeStore.dbName = dbName;
            tree.setLoading(true);
            treeStore.load();
        },
        listeners: {
            itemcontextmenu: function (view, rec, node, index, e) {
                e.stopEvent();
                showMenu(rec , e);
            },
            itemclick: function (thiz, record , item, index, e) {
                showMenu(record , e);
            }
        }
    });

    var showMenu = function(rec , e) {
        var leaf = rec.get("leaf");
        var tmpName = null;
        var newCallBack = function() {
            switch(tmpName) {
                case $pub.trigger: console_panel.addUrlPanel('/structure/trigger/createTrigger.do', '', 'trigger', 'create');break;
                case $pub.function: console_panel.addUrlPanel('/structure/function/function-page.do?funcprocType=FUNCTION', '', 'func', 'create');break;
                case $pub.procedure: console_panel.addUrlPanel('/structure/procedure/procedure-page.do?funcprocType=PROCEDURE', '', 'proc', 'create');break;
                case $pub.event: console_panel.addUrlPanel('/structure/event/createEvent.do', '', 'event', 'create');break;
            }
        };
        var displayName, rightMenu;
        if (!leaf) {
            var itemId = tmpName = rec.get("id");
            displayName = "（" + itemId + "）";
            rightMenu = Ext.create('Ext.menu.Menu', {
                width: 60,
                plain: true,
                floating: true,
                items: [
                    {
                        text: $pub.build + displayName,
                        handler: newCallBack
                    },
                    {
                        text: $pub.refresh,
                        handler: function () {
                            object_panel.refreshone(objectTypeMap.progobjs);
                        }
                    }
                ]
            });
            rightMenu.showAt(e.getXY());
        }else {
            var parentId = tmpName = rec.parentNode.get("id");
            displayName = "（" + parentId + "）";
            rightMenu = Ext.create('Ext.menu.Menu', {
                width: 140,
                plain: true,
                floating: true,
                items: [
                    {
                        text: $pub.build + displayName,
                        handler: newCallBack
                    },
                    {
                        text: $pub.edit + displayName,
                        handler: function () {
                            showProcFuncView(rec, 'edit');
                        }
                    },
                    {
                        text: $pub.drop + displayName,
                        handler: function () {
                            dropFuncProc(treeStore, rec);
                        }
                    }
                ]
            });
            if(parentId === $pub.procedure) {
                rightMenu.insert(3 , {
                    text: $pub.execute + displayName,
                    handler:function () {
                        executeProcedure(rec, 'executeProcedure');
                    }
                });
            }else if(parentId === $pub.function) {
                rightMenu.insert(3 , {
                    text: $pub.execute + displayName,
                    handler:function () {
                        executeFunction(rec, 'executeFunction');
                    }
                });
            }
            rightMenu.showAt(e.getXY());
        }
    }
    return tree;
};


/**
 * 左侧树图的视图类
 * @type {Array}
 */
var PUBLIC_RIGHT_MENUS = [];
var createViewPanel = function (nowDbName) {
    var treeStore = new IDB.TreeStore({
        autoLoad: false,
        dbName: nowDbName,
        root: {text: $pub.viewList, expanded: true},
        url: '/system/showViews.do'
    });
    treeStore.on('load', function() {
        tree.setLoading(false);
    });
    var tmpRecord = null;
    var rightMenu = new Ext.menu.Menu({
        items: [
            {
                text: $pub.viewData, handler: function () {
                if (tmpRecord) {
                    console_panel.addUrlPanel('/data/multiSqlWindow.do', tmpRecord.get('text'), 'sqlWindow', 'query' , null,getSQLWindowParamsStr("sqlWindow" , ""));
                }
            }
            },
            {
                text: $mainTree.menu.createView, handler: function () {
                console_panel.addUrlPanel('/structure/view/viewBase.do', '', 'view', 'create');
            }
            },
            {
                text: $mainTree.menu.editView, handler: function () {
                if (tmpRecord) {
                    console_panel.addUrlPanel('/structure/view/viewBase.do', tmpRecord.get('text'), 'view', 'change');
                }
            }
            },
            {
                text: $mainTree.menu.dropView, handler: function () {
                if (tmpRecord) {
                    Ext.Msg.confirm($pub.waring, $pub.dropConfirm + '?', function (v) {
                        if (v === 'yes') {
                            onlyExecuteSQL('drop view `' + String(tmpRecord.get('text')).replaceAll("`", "``") + "`", tree, tmpName, tmpRecord.get('text'), 'view');
                        }
                    });
                }
            }
            },
            {
                text: $pub.refresh, handler: function () {
                tree.refreshByDBName(tmpName);
            }
            }
        ]
    });
    var rightMenu2 = new Ext.menu.Menu({
        items: [
            {
                text: $pub.build, handler: function () {
                console_panel.addUrlPanel('/structure/view/viewBase.do', '', 'view', 'create');
            }
            },
            {
                text: $pub.refresh, handler: function () {
                tree.refreshByDBName(tmpName);
            }
            }
        ]
    });
    PUBLIC_RIGHT_MENUS.push(rightMenu, rightMenu2);
    var tmpName = nowDbName;
    var tree = new Ext.tree.Panel({
        store: treeStore,
        title: $pub.view,
        rootVisible: false,
        refreshByDBName: function (dbName) {
            tmpName = treeStore.dbName = dbName;
            tree.setLoading(true);
            treeStore.load();
        },
        listeners: {
            itemclick: function (thiz, record, item, index, e) {
                tmpRecord = record;
                rightMenu.showAt(e.getXY());
            },
            itemcontextmenu: function (thiz, record, item, index, e) {
                e.preventDefault();
                tmpRecord = record;
                rightMenu.showAt(e.getXY());
            },
            containercontextmenu: function (thiz, e) {
                e.preventDefault();
                rightMenu2.showAt(e.getXY());
            }
        }
    });
    return tree;
};
var console_function = {
    appendObjectInfoForId: function (url, name, objectType, panelKey, operation, nowDBName, preId, params) {
        if (url.indexOf("?") === -1) {
            url += '?'
        } else {
            url += '&';
        }
        if (url_namespace) {url = "/" + url_namespace + url;}
        return url + 'objectName=' + (name ? encodeURIComponent(name) : '')
            + "&objectType=" + objectType
            + "&panelKey=" + panelKey
            + '&operation=' + operation
            + "&nowDBName=" + (nowDBName ? encodeURIComponent(nowDBName) : '')
            + "&tabId=" + (preId ? encodeURIComponent(preId) : '')
            + "&token=" + user_token
            + '&params=' + encodeURIComponent(params || '')
            + '&dbVersionNum=' + encodeURIComponent(db_version_num);
    }
};
var refreshTabCallBack = function (tabId, objectName, objectType, nowDBName, panelKey) {
    console_panel.changeUrlPanel('/structure/table/tableBase.do', objectName, objectType, 'change', tabId, panelKey, nowDBName);
    if (object_panel.getNowDBName() === nowDBName) {
        object_panel.refreshTabPanel();
    }
};
var refreshFunctionCallBack = function (tabId, objectName, objectType, nowDBName, panelKey) {
    console_panel.changeUrlPanel('/structure/function/function-page.do', objectName, objectType, 'change', tabId, panelKey, nowDBName);
    if (object_panel.getNowDBName() === nowDBName) {
        object_panel.refreshTabPanel();
    }
};
var refreshProcedureCallBack = function (tabId, objectName, objectType, nowDBName, panelKey) {
    console_panel.changeUrlPanel('/structure/procedure/procedure-page.do', objectName, objectType, 'change', tabId, panelKey, nowDBName);
    if (object_panel.getNowDBName() === nowDBName) {
        object_panel.refreshTabPanel();
    }
};
var closeTabCallBack = function (tabId, nowDBName) {
    console_panel.closeTab(tabId);
    if (object_panel.getNowDBName() === nowDBName) {
        object_panel.refreshTabPanel();
    }
};
var closeViewCallBack = function (tabId, nowDBName) {
    console_panel.closeTab(tabId);
    if (object_panel.getNowDBName() === nowDBName) {
        object_panel.refreshViewPanel();
    }
};
var refreshViewCallBack = function (tabId, objectName, objectType, nowDBName, panelKey) {
    console_panel.changeUrlPanel('/structure/view/viewBase.do', objectName, objectType, 'change', tabId, panelKey, nowDBName);
    if (object_panel.getNowDBName() === nowDBName) {
        object_panel.refreshViewPanel();
    }
};
var queryObjectCallBack = function (nowDBName, objectName) {
    console_panel.addUrlPanel('/data/queryTable.do', objectName, 'query_table', 'query_table' , nowDBName);
};
var getJSONValue = function (json, key) {
    return json[key] || '';
};
var welcomePanel = function () {
    return new Ext.Panel({
        id:'welcome_panel_id',
        title: $pub.welcomePage,
        html:getFrameHtmlWithId("/welcome.do?dbType=" + now_db_type + "&token=" + user_token , "welcome_page_id"),
        getObjectType:function() {return ""}
    });
};
var sql_window_sqls_keys = [];
var init_default_active_tab = null;
var getSQLWindowParamsStr = function(objectType , sql , oldParams) {
    if(objectType === 'sqlWindow' || objectType === 'dSqlWindow' || objectType === 'mlSqlWindow') {
        var tmpKey = "__dms_store_" + getUserToken() + "_" + uuid();
        sql_window_sqls_keys.push(tmpKey);
        SimpleStorageUtils.set(tmpKey , sql);
        var params = oldParams || {};
        params['temp_store_sql_key'] = tmpKey;
        return jsonToString(params);
    }
    return "";
};
var init_active_preId = null;
var init_tab_pre_map = new SimpleMap();
var initTabs = function(index) {
    var tabArray = init_store_tabs['tabArray'] || [];
    if(tabArray.length <= index) {
        if(init_active_preId) {
            setTimeout(function() {
                console_panel.activeId(init_active_preId);
            } , 100);
        }
        return;
    }

    var row = tabArray[index];
    var params = getSQLWindowParamsStr(row.objectType , row.sql , jsonDecode(row.params , {}));

    var object = console_panel.addUrlPanel(
        row.url,
        row.objectName,
        row.objectType,
        row.operation,
        row.nowDBName,
        params,
        true,
        row.title
    );
    if(row.activeTab === "true") {
        init_active_preId = object.preId;
    }
    init_tab_pre_map.put(object.preId , row.nowDBName);

    setTimeout(function() {
        initTabs(index + 1);
    } , 80);
};
var storeTabs = function() {
    var active = console_panel.getActiveTab().id;
    var defaultDBName = init_tab_pre_map.get(active) || object_panel.getNowDBName();
    var object = {dbName : defaultDBName};
    var tabArray = [];
    for(var p in  remember_tabs) {
        var row = remember_tabs[p];
        var preId = row['preId'];
        var objectType = row.objectType;
        var tab = remember_tabs[p];
        if(objectType === 'sqlWindow' || objectType == 'dSqlWindow' || objectType == 'mlSqlWindow') {
            var panel = Ext.getCmp(preId);
            if(!panel.preHtmlCode) {
                var iframeId = preId + "_iframe";
                var iframe = document.getElementById(iframeId);

                tab.nowDBName = iframe.contentWindow.nowDBName;
                tab.sql = iframe.contentWindow.getFullSqlText();
            }else {
                tab.sql = SimpleStorageUtils.get(tab['tmpKey']);
            }
            //console.log(panel.getTitle());
            //console.log(panel.title);
            tab.title = panel.title;
            if(row.operation !== 'add') {
                delete tab['objectName'];
            }
        }
        if(active === preId) {
            tab.activeTab = "true";
        }
        tabArray.push(tab);
    }
    object.tabArray = tabArray;
    SimpleStorageUtils.set("__DMS_INSTANCE_" + connect_ip + ":" + connect_port + "@" + connect_user, jsonToString(object));
    sql_window_sqls_keys.each(function(row) {
        SimpleStorageUtils.remove(row);
    });
};
var remember_tabs = {};
var rememberTab = function(preId,property) {
    if(isRememberTab(property['objectType'] , property['operation'])) {
        property['preId'] = preId;
        remember_tabs["preId_" + preId] = property;
    }
};
var deleteRememberTab = function(preId) {
    var key = "preId_" + preId;
    if(remember_tabs[key]) {
        delete remember_tabs[key];
    }
};
var isRememberTab = function(objectType , operation) {
    if(operation === 'add' && objectType === 'sqlWindow') {
        return true;
    }
    if(operation === 'add' && objectType === 'dSqlWindow') {
        return true;
    }
    if(operation === 'add' && objectType === 'mlSqlWindow') {
        return true;
    }
    return operation === 'manage_erchart' ||
        operation === 'query' || operation === 'query_table' ||
        objectType === 'orzdba' || objectType === 'showprocesslist' ||
        objectType === 'tablesummary' || objectType === 'diagnosis'
        || objectType === 'data_track';
};
var TAB_RIGHT_MENU = null;
var tab_actions = {
    force_close:false,
    pre_close_tab:null,
    setTitle:function(tabRightMenuBar) {
        var tab = tabRightMenuBar.getLastActionTab();
        var form = new IDB.FormPanel({
            region:'center',
            layout:'column',
            defaults:{margin: '2 2 2 0',width:660,columnWidth:1,labelWidth:90},
            items:[
                {
                    fieldLabel : $main.msg.displayName,
                    editable:false,
                    blankText : $main.msg.displayNameNotEmpty,
                    name:'displayName',
                    value:tab.title
                }
            ]
        });
        var win = new IDB.Window({
            width:450,height:130,
            title : $main.title.setDisplayName,layout:'fit',
            items:[form],
            buttons:[{
                text: $pub.ok,handler:function() {
                    if(form.isValid()) {
                        var field = form.getForm().findField('displayName');
                        tab.setTitle(field.getValue());
                        ajax({
                            url:'/system/simple/setTabTitle.do',
                            params:{setTitle:field.getValue()}
                        });
                        win.close();
                    }
                }
            },{
                text:$pub.cancel,handler:function() {
                    win.close();
                }
            }]
        });
    },
    closeConfirm:function() {
        tab_actions.pre_close_tab = null;
        if(TAB_CLOSE_CONFIRM_WIN) {
            TAB_CLOSE_CONFIRM_WIN.close();
        }
    },
    forceClosePre:function() {
        if(document.getElementById("close_sql_check").checked) {
            ajax({
                url:'/user-config/saveUserPreferConfig.do',
                onlyUrl:true,
                params:{closeSQLPanelDefault:"true" , closeSQLPanelAction:"close"},
                success:function(resp) {}
            });
        }
        tab_actions.forceClose();
    },
    saveBeforeClosePre:function() {
        if(document.getElementById("close_sql_check").checked) {
            ajax({
                url:'/user-config/saveUserPreferConfig.do',
                onlyUrl:true,
                params:{closeSQLPanelDefault:"true" , closeSQLPanelAction:"saveAndClose"},
                success:function(resp) {}
            });
        }
        tab_actions.saveBeforeClose();
    },
    forceClose:function() {
        tab_actions.force_close = true;
        console_panel.remove(tab_actions.pre_close_tab);
        tab_actions.closeConfirm();
    },
    saveBeforeClose:function() {
        var tab = tab_actions.pre_close_tab;
        var dbName = init_tab_pre_map.get(tab.id) || object_panel.getNowDBName();
        var sql;
        if(!tab.preHtmlCode) {
            var iframeId = tab.id + "_iframe";
            var iframe = document.getElementById(iframeId);

            dbName = iframe.contentWindow.nowDBName;
            sql = iframe.contentWindow.getFullSqlText();
        }else {
            sql = SimpleStorageUtils.get(tab.getTmpKey());
        }
        var data = {
            dbName:dbName,
            sqlContent:sql,
            title:tab.title
        };
        Ext.getBody().mask($savedSQLWindow.msg.saving);
        ajax({
            url:'/user-config/save-user-closed-window-sql.do',
            onlyUrl:true,
            params:data,
            success:function(resp) {
                Ext.getBody().unmask();
                var json = jsonDecode(resp.responseText);
                if(json.success) {
                    $.message.success($savedSQLWindow.msg.saveSuccess);
                    setTimeout(function() {
                        tab_actions.forceClose();
                    } , 300);
                }else {
                    $.message.error($savedSQLWindow.msg.saveFailure + json.root);
                }
            }
        });
    }
};
var getTabRightMenu = function() {
    var tabRightMenuBar = TAB_RIGHT_MENU = Ext.create('DMS.ux.TabUserMenu', {
        items: [{
            text:$mainTab.menu.defineTitle , id:'tab-menu-user-define-title',
            handler:function() {
                tab_actions.setTitle(tabRightMenuBar);
            }
        },{
            text : $mainTab.menu.backWelcomePage ,id:'tab-menu-first',
            handler:function() {
                console_panel.setActiveTab(0);
            }
        },{
            text: $mainTab.menu.switchTo ,id:'tab-menu-switch-tabs'
        }],
        beforeShowMenu:function() {
            var tab = tabRightMenuBar.getLastActionTab();
            if(tab.getObjectType() === 'sqlWindow') {
                Ext.getCmp('tab-menu-user-define-title').show();
            }else {
                Ext.getCmp('tab-menu-user-define-title').hide();
            }
            var items = console_panel.items.items;
            var menuArray = [];
            Ext.each(items , function(row) {
                var title = row.title;
                if(row.getObjectType() === 'sqlWindow' && row.title !== $main.menu.sqlWindow) {
                    title += '（' + $main.menu.sqlWindow + '）';
                }
                menuArray.push({
                    text:title,handler:function() {
                        console_panel.setActiveTab(row);
                    }
                });
            });
            Ext.getCmp('tab-menu-switch-tabs').setMenu(new Ext.menu.Menu({
                items:menuArray
            }))
        }
    });
    return tabRightMenuBar;
};
var TAB_CLOSE_CONFIRM_WIN = null;
var createWorkspaceCenterPanel = function () {
    var tabRightMenuBar = getTabRightMenu();

    var tmpNum = 1;
    var newOldKV = {} , oldNewKV = {} , tabs = 0;
    var tabPanel = new Ext.tab.Panel({
        id:"tobeNormal",
        margin:"5 0 0 5",
        activeTab: 0,
        minTabWidth: 90,
        maxTabWidth: 160,
        collapsible: false,
        region: 'center',
        bodyStyle: "border-top:1px solid #ddd;z-index: 8;border-left:1px solid #ddd;",
        items: [
            welcomePanel()
        ],
        plugins:tabRightMenuBar,
        addTmpURLPanel: function (url, title, objectType) {
            var params = null;
            tabPanel.addUrlPanel(url, title, objectType, 'add' , null , getSQLWindowParamsStr(objectType , ""));
        },
        closeTab: function (oldPreId) {
            var remote = Ext.getCmp(oldPreId);
            if (remote) {
                tabPanel.remove(remote);
            }
        },
        closeByObject: function (dbName, objectName, objectType) {
            var preId = TabUtil.calculateExistingObjPreId(dbName, objectName, objectType);
            var remote = Ext.getCmp(preId);
            if (remote) {
                tabPanel.remove(remote);
            }
            if (newOldKV[preId]) {
                remote = Ext.getCmp(newOldKV[preId]);
                if (remote) {
                    tabPanel.remove(remote);
                }
            }
        },
        saveOldNewPanelIdMap: function (oldPreId, newpreid) {
            var oldRelative = oldNewKV[oldPreId];
            if (oldRelative) {
                newOldKV[oldRelative] = null;
            }
            newOldKV[newpreid] = oldPreId;
            oldNewKV[oldPreId] = newpreid;
        },

        resetTabTitle:function(preId,newTitle) {
            var remote = Ext.getCmp(preId);
            if (remote && tabPanel.getEl(remote)) {
                remote.setTitle(newTitle);
            }
        },
        changeUrlPanel: function (url, objectName, objectType, operation, oldPreId, panelId, nowDBName) {
            var preId , title;
            preId = nowDBName + "_" + objectName + "_" + objectType;
            title = (objectType === 'table' || objectType === 'func' || objectType === 'proc' ? $pub.edit : '') + getObjectCNameByEName(objectType) + ':' + objectName;
            var remote = Ext.getCmp(oldPreId);
            if (remote && tabPanel.getEl(remote)) {
                if (oldPreId !== preId) {
                    var oldRelative = oldNewKV[oldPreId];
                    if (oldRelative) {
                        newOldKV[oldRelative] = null;
                    }
                    newOldKV[preId] = oldPreId;
                    oldNewKV[oldPreId] = preId;
                }
                remote.setTitle(title);
                Ext.get(oldPreId + "_iframe").dom.src = console_function.appendObjectInfoForId(url, objectName, objectType, panelId, operation, nowDBName, oldPreId);
            }
        },
        closeNotSQLPanel:function() {
            var items = tabPanel.items.items;
            var removeItem = [];
            Ext.each(items , function(row) {
                if(row && row.id) {
                    var id = row.id;
                    if(id !== 'welcome_panel_id') {
                        if(id.indexOf("query") === -1 && id.indexOf("sqlWindow") === -1 && id.indexOf("sqlCommand") === -1) {
                            removeItem.push(row);
                        }else {
                            var iFrame = document.getElementById(id + "_iframe");
                            iFrame.contentWindow.instanceChangeCallBack();
                        }
                    }
                }
            });
            Ext.each(removeItem , function(item) {
                tabPanel.remove(item);
            });
        },
        addUrlPanel: function (url, objectName, objectType, operation, nowDBName, params , lazyLoad , setTitle) {
            var preId, title;
            nowDBName = nowDBName || object_panel.getNowDBName();
            if (operation === 'add') {
                preId = 'new_' + (tmpNum++) + "_" + objectType;
                title = setTitle || objectName;
            } else if (operation === 'tableBatchOptr') {
                preId = 'new_' + nowDBName;
                title = $main.menu.batchOptionTable + '(' + nowDBName + ')';
            } else if (operation === 'query') {
                preId = 'new_' + (tmpNum++) + "_" + objectType;
                title = setTitle || $main.menu.sqlWindow;
            }else if(operation === "query_table") {
                preId = 'query_table_' + "_" + nowDBName + "_" + objectName;
                title = $pub.table + '：' + objectName;
            } else if (operation === 'create') {
                preId = 'new_' + (tmpNum++) + "_" + objectType;//新增一个窗口
                title = operationMap[operation] + "：" + getObjectCNameByEName(objectType);
            } else if (operation === 'export' || operation === 'import') {
                preId = objectName + "_" + objectType;
                title = (operation === 'export' ? $main.menu.export : $main.menu.import);
            } else if (operation === 'bireport') {
                preId = objectName + "_" + objectType;
                title = $pub.report;
            } else if (operation === 'manage_erchart' ) {
                preId = 'new_' + objectType;
                title = $main.menu.ERChart + '：' + nowDBName;
            } else if (operation === 'instance' || operation === 'grant' || operation === 'audit' || operation.substring(0 , 6) === 'manage' || operation === 'more') {
                preId = objectName + "_" + objectType;
                title = objectName;
            } else if(operation === 'datatrend'){
                title = objectName;
                preId = objectName + "_" + objectType;
            } else if (operation === 'generate') {
                preId = objectName + "_" + objectType;
                title = $mainTree.menu.autoBuildTestData;
            } else {
                preId = TabUtil.calculateExistingObjPreId(nowDBName, objectName, objectType);
                title = (objectType === 'table' || objectType === 'proc' || objectType === 'func' ? $pub.edit : '') + getObjectCNameByEName(objectType) + '：' + objectName;
            }
            if (!tabPanel.containsIdPanel(preId) && !tabPanel.containsRelativeIdPanel(preId)) {
                if (tabs >= 19) {
                    return $.message.warning($main.msg.toManyWindows);
                }
                ajax({
                    url: '/system/getNewPanelId.do',
                    onlyUrl: true,
                    success: function (response) {
                        var json = jsonDecode(response.responseText);
                        if (json.success) {
                            var panelId = json.root;
                            var iframeId = preId + "_iframe";
                            var realURL = console_function.appendObjectInfoForId(url, objectName, objectType, panelId, operation, nowDBName, preId, params);
                            var htmlCode = getFrameHtmlWithId(realURL, iframeId);

                            var tmpKey = null;
                            try {
                                if(params && objectType === 'sqlWindow') {
                                    var parsered_params = jsonDecode(params);
                                    if(parsered_params.temp_store_sql_key) {
                                        tmpKey = parsered_params.temp_store_sql_key;
                                    }
                                }
                            } catch(e) {}

                            var remote = new Ext.Panel({
                                id: preId, panelKey: panelId, border: false, title: title, closable: true, scripts: true, autoScroll: false,
                                discardUrl: true, nocache: true, timeout: 9000, scope: this, preHtmlCode : htmlCode,
                                tabConfig:{
                                    tooltip:title
                                },
                                getObjectType:function() {
                                    return objectType;
                                },
                                getTmpKey:function() {
                                    return tmpKey;
                                }
                            });
                            tabPanel.add(remote);
                            if(!lazyLoad) {
                                tabPanel.lazyLoad(remote);
                                tabPanel.setActiveTab(remote);
                            }
                            rememberTab(preId,{
                                url:url,
                                objectName:objectName,
                                objectType:objectType,
                                operation:operation,
                                nowDBName:nowDBName,
                                params:params,
                                tmpKey:tmpKey
                            });
                            tabs++;
                            remote.on('beforedestroy', function () {
                                tabs--;
                                deleteRememberTab(preId);
                                var iframe = document.getElementById(iframeId);
                                if(tmpKey) {
                                    SimpleStorageUtils.remove(tmpKey);
                                }

                                try {
                                    ajax({
                                        url: '/system/removePanelKey.do',
                                        onlyUrl: true,
                                        params: {panelKey: iframe.contentWindow.getPaneKey()}
                                    });
                                    if (Ext.isIE) {//IE浏览器内存泄露
                                        iframe.contentWindow.document.write('');
                                        iframe.contentWindow.close();
                                    }
                                }catch(e) {}

                            });
                        }
                    }
                });
                return {preId : preId};
            } else {
                if (newOldKV[preId]) {
                    tabPanel.activeId(newOldKV[preId]);
                } else {
                    tabPanel.activeId(preId);
                }
                return {old: preId};
            }
        },
        containsIdPanel: function (id) {
            var remote = Ext.getCmp(id);
            return (remote && tabPanel.getEl(remote));
        },
        containsRelativeIdPanel: function(id) {
            if (newOldKV[id]) {
                return tabPanel.containsIdPanel(newOldKV[id]);
            }
            return false;
        },
        activeId: function (id) {
            var remote = Ext.getCmp(id);
            tabPanel.setActiveTab(remote);
        },
        lazyLoad : function(card) {
            if(card.preHtmlCode != null) {
                card.html = card.preHtmlCode;
                card.preHtmlCode = null;
            }
        },
        listeners:{
            beforetabchange:function(tab , newCard , oldCard , opts) {
                tabPanel.lazyLoad(newCard);
            },
            beforeremove:function(thiz, tab, epts) {
                if(tab_actions.force_close || tab.getObjectType() !== 'sqlWindow') {
                    tab_actions.force_close = false;
                    tab_actions.pre_close_tab = null;
                    return true;
                }else {
                    tab_actions.pre_close_tab = tab;
                    if(userConfigObject && userConfigObject['closeSQLPanelDefault'] === 'true') {
                        if(userConfigObject['closeSQLPanelAction'] === 'saveAndClose') {
                            tab_actions.saveBeforeClose();
                        }else {
                            tab_actions.forceClose();
                        }
                    }else {
                        var msg = "<div style='margin-top: 15px;padding-left: 6px;;font-size: 14px;font-weight: bold'>" + $savedSQLWindow.label.selectOption +"</div>";
                        msg += '<div style="padding-top: 10px;padding-left: 14px;font-size: 12px;"><li><b>' + $savedSQLWindow.label.onlyClose + '：</b>' + $savedSQLWindow.label.onlyCloseTip + '</div>';
                        msg += '<div style="padding-top: 10px;padding-left: 14px;font-size: 12px;"><b>' + $savedSQLWindow.label.closeAndSaveSQL + '：</b>' + $savedSQLWindow.label.closeAndSaveSQLTip + '</div>';
                        msg += '<div style="padding-top: 20px;padding-left: 14px;font-size: 12px;"><input id="close_sql_check" type="checkbox" value="yes"><span style="font-weight: bold;padding-left: 5px;">' + $savedSQLWindow.label.noTipNextTime + '</span></div>';
                        var buttons = '<div style="position:absolute; bottom:0;margin-bottom: 13px;width: 100%">' +
                            '<div style="float: right;margin-right: 10px;"><input type="button" value="' + $pub.cancel + '" onclick="tab_actions.closeConfirm()" class="button_class_2" style="width:80px;height: 28px;margin: 10px 0 0 10px;"/></div>' +
                            '<div style="float: right;margin-right: 10px;"><input type="button" value="' + $savedSQLWindow.label.closeAndSaveSQL + '" onclick="tab_actions.saveBeforeClosePre()" class="button_class_1" style="width:120px;height: 28px;margin: 10px 0 0 10px;"/></div>' +
                            '<div style="float: right;margin-right: 10px;"><input type="button" value="' + $savedSQLWindow.label.onlyClose + '" onclick="tab_actions.forceClosePre()" class="button_class_1" style="width:80px;height: 28px;margin: 10px 0 0 10px;"/></div>' +
                            '</div>';
                        var win = TAB_CLOSE_CONFIRM_WIN = new IDB.Window({
                            width:600,height:200,
                            title:$main.title.closeSQLWindow,
                            html: msg + buttons
                        });
                        win.showAt(240 , 100);
                    }
                    return false;
                }
            }
        }
    });
    return tabPanel;
};
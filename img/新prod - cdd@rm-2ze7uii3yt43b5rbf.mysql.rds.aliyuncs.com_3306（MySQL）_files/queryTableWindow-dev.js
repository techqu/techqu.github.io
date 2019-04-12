var baseUrl = '/data/queryTable/';
var nowExecuteSQL = '';
var nowDisplaySQL = '';
var v_tableStructure = v_tableStructure;
var v_columns = [];
var v_primaryKeys = [];
var v_setColumns = [];
var orderColumns = [];
var whereConditionColumns = [];
var whereConditionSQL = "";
var option_btn_ids = ['add_btn' , 'delete_btn' , 'commit_btn'];
var binaryToHex = false;
var isBigTable = false;
var all_tableSize = 0;
var isFirstOpen = true;
if(v_tableSize) {
    all_tableSize = v_tableSize['dataLength'] + v_tableSize['indexLength'];
    isBigTable = (all_tableSize > 512);
}
var instanceChangeCallBack = function() {}
var canEdit = function() {
    return v_primaryKeys.length !== 0;
};
var enableOptionButtons = function() {
    Ext.each(option_btn_ids , function(id) {
    	var _option_button = Ext.getCmp(id);
    	if(_option_button){
    		_option_button.enable();
    	}
    });
};
var disableOptionButtons = function() {
    Ext.each(option_btn_ids , function(id) {
    	var _option_button = Ext.getCmp(id);
    	if(_option_button){
    		_option_button.disable();
    	}
    });
};
var initStructure = function() {
    Ext.each(v_tableStructure , function(row) {
        v_columns.push(row['name']);
        if(row['primaryKey'] === 'true') {
            v_primaryKeys.push(row['name']);
            orderColumns.push({column:row['name'],order:'desc'});
        }
        whereConditionColumns.push({column:row['name'],computeMethod:'=',connectMethod:'and'})
    });
    if(!canEdit()) {
        disableOptionButtons();
        Ext.Msg.alert($pub.prompt , $openTable.msg.noPrimaryKeyTable);
    }
};
var getCountSQL = function() {
    var sql = "\n    select count(*) from `" + nowDBName.replaceAll("`","``") + '`.`' + objectName.replaceAll("`","``") + "`";
    if(whereConditionSQL) {
        sql += "\n    " + whereConditionSQL;
    }
    return sql;
};
var getNoLimitSQL = function() {
    var sql = "\n  select ";
    if(v_setColumns.length > 0) {
        Ext.each(v_setColumns , function(column) {
            sql += '`' + column.replaceAll('`', '``') + "`,";
        });
        sql = sql.substring(0 , sql.length - 1) + "\n    from `";
    }else {
        sql += "*\n    from `";
    }
    sql += nowDBName.replaceAll("`","``") + '`.`' + objectName.replaceAll("`","``") + "`";
    if(whereConditionSQL) {
        sql += "\n    " + whereConditionSQL;
    }
    var orderSQL = getOrderSQL();
    if(orderSQL) {
        sql += "\n    " + orderSQL;
    }
    return sql;
};
var initSQL = function() {
    var sql = getNoLimitSQL();
    nowExecuteSQL = sql;

    var pageSize = Ext.getCmp('query_table_page_size');
    var pageNum =  Ext.getCmp('query_table_page_num');
    pre_page_size = pageSize.getValue();
    pre_page_num =  pageNum.getValue();
    var nowNum = (pre_page_num - 1) * pre_page_size;
    sql += "\n    limit " + nowNum + "," + pre_page_size;
    nowDisplaySQL = sql;
};
Ext.onReady(function () {
    initStructure();
	var viewPort = Ext.create('Ext.Viewport', {
       layout:'border',items:[new Ext.Panel({
            region:'center',layout:'fit',
            items:[getTableResultPanel()]
        }), new Ext.TabPanel({
        	activeTab:0, headerStyle:'display:none', region:'east', width:300, collapsible:true, split:true, title: $openTable.fastOptArea, tabPosition:'top', removePanelHeader:true,
        	items:[{
        		title:$openTable.resultColumnSet, layout:'fit', items:[returnColumnSetting()]
        	},{
        		title:$openTable.whereSet, layout:'fit', items:[setWhereCondition()]
        	},{
        		title:$openTable.orderSet, layout:'fit', items:[setOrderByColumns()]
        	}]
        })]
    });
    queryResult();
});
var showCancelWindow = function(sql,inputPanelKey) {
    var win_cancel = new Ext.Window({
        width:500,
        height:160,
        layout:'absolute',
        title:$pub.pleaseWait,
        plain:true,
        bodyStyle:'padding:5px;',
        buttonAlign:'center',
        html:'<span style="margin: 20 0 0 10">' + $pub.executingSQL + '：</span><br/>  <span style="margin: 20 0 0 10;padding-top: 20px;"><pre>' + (sql || nowExecuteSQL) + "</pre></span>",
        modal:true,
        closable:false,
        buttons:[
            {
                text:$sqlWindow.button.cancel,
                handler:function () {
                    win_cancel.hide();
                    cancel(inputPanelKey);
                }
            }
        ]
    });
    win_cancel.show();
    return win_cancel;
};

function cancel(inputPanelKey) {
    ajax({
        url:baseUrl + 'cancel.do',
        waitMsg:$pub.pleaseWait,
        params:{
            event:"cancel",
            panelKey:(inputPanelKey || getPaneKey()), dbName:gridResult.currentDbName
        },
        failure:function (response) {

        },
        success:function (response) {
            var rs = Ext.decode(response.responseText);
        }
    });
}
function hasChangedResult() {
    if(canEdit()) {
        var deleteRecords = gridResult.getStore().getRemovedRecords();
        var editRecords = gridResult.getStore().getModifiedRecords();
        return  (deleteRecords.length + editRecords.length) > 0;
    }
    return false;
}
var queryResult = function() {
    if(hasChangedResult()) {
        Ext.Msg.confirm($pub.prompt , $openTable.msg.hasChangeNotSubmit , function(v) {
            if(v === 'yes') {
                queryResultDoingBefore();
            }
        });
    }else {
        queryResultDoingBefore();
    }
};
var queryResultDoingBefore = function() {
    var pageSize = Ext.getCmp('query_table_page_size');
    var pageNum =  Ext.getCmp('query_table_page_num');
    if(!pageSize.isValid()) {
        pageSize.setValue(pre_page_size);
    }
    if(!pageNum.isValid()) {
        pageNum.setValue(pre_page_num);
    }
    initSQL();
    queryResultDoing();
};
var queryResultDoing = function() {
    if(nowExecuteSQL) {
        var win_cancel = showCancelWindow();
        ajax({
            url:baseUrl + 'execute.do',
            params:{panelKey:getPaneKey(), dbName:nowDBName, sql:nowExecuteSQL , pageNumber:pre_page_num, rows:pre_page_size,binaryToHex:binaryToHex},
            success:function (response, options) {
                win_cancel.close();
                var rs = Ext.decode(response.responseText);
                if (rs.failure && rs.errorCode !== "NOT_FIND_LOGIN_DO") {
                    var errorMsg = rs.root;
                    Ext.Msg.show({
                        title:'执行出错',
                        msg:Ext.util.Format.htmlDecode(errorMsg),
                        buttons:Ext.Msg.OK,
                        icon:Ext.Msg.ERROR
                    });
                }else {
                    showResult(rs.root);
                    if (rs.root.dataOverflow) {
                        Ext.MessageBox.alert('警告','由于返回数据过大，剩余的数据未输出！');
                    }
                    if (isFirstOpen) {
                        isFirstOpen = false;
                        var isSystemDB = ['information_schema' , 'performance_schema' , 'mysql' , 'sys'].contains(nowDBName);
                        if (!isSystemDB && rs.root.rows === 0 && rs.root.data.length === 0) {
                            Ext.Msg.confirm($pub.prompt , $pub.nowTable + '[' + objectName + ']' + $buildData.guide , function(v) {
                                if(v === 'yes') {
                                    var result = window.parent.console_panel.addUrlPanel("/data/generate/generateBase.do", 'generate_base_view', 'generate', 'generate', nowDBName,
                                        jsonToString({tableName: objectName, dbName: nowDBName}));
                                    if (result && result.old) {
                                        var iframe = window.parent.document.getElementById(result.old + "_iframe");
                                        iframe.contentWindow.GenerateListPanel.addTableJob({tableName: objectName, dbName: nowDBName}, null);
                                    }
                                }
                            });
                        }
                    }
                }
            },
            failure:function() {win_cancel.close();}
        });
    }
};
function encodeValue(value, meta, record) {
    return '<pre style="padding: 0;margin:0;font-family:新宋体,Lucida Console,monospace">' + Ext.util.Format.htmlEncode(value) + '</pre>';
}
function isNull(value) {
    return (value == null);
}
var grid_fun = {
    findGridColumnNameByDBColumnName:function(dbColumnName) {
        var find = false , findColumnName = null;
        Ext.each(gridResult.metas , function(meta) {
            if(!find && meta['realName'] === dbColumnName) {
                findColumnName = meta['name'];
                find = true;
            }
        });
        return findColumnName;
    }
};
var row_fun = {
    checkPrimaryKeys:function(optionName) {
       if(v_primaryKeys.length > 0) {
           return true;
       }
       Ext.Msg.alert($pub.prompt , $sqlWindow.msg.noPrimaryOption + '：【' + optionName + '】。');
        return false;
    },
    getRowValue:function(key,row) {
        var realColumnName = grid_fun.findGridColumnNameByDBColumnName(key);
        var modified = row.modified;
        return modified[realColumnName] || row.get(realColumnName);
    },
    downloadBlob : function(colIndex) {
        var metaData = gridResult.metas[colIndex - 1];
        var metaDataColumnName = metaData['realName'];
        var selectedRows = gridResult.getSelectionModel().getSelection();
        if(selectedRows && selectedRows.length > 0 && row_fun.checkPrimaryKeys($pub.download + '[BLOB]')) {
            var v_primaryKeyValues = [] , selectedRow = selectedRows[0];
            Ext.each(v_primaryKeys , function(key) {
                v_primaryKeyValues.push(row_fun.getRowValue(key , selectedRow));
            });
            Ext.getBody().mask($pub.submittedJob);
            ajax({
                url:'/data/queryTable/exportBlob.do',
                timeout:(15 * 60 * 1000),
                params:{
                    dbName:nowDBName ,
                    tableName:objectName ,
                    columnName:metaDataColumnName ,
                    primaryKeys:v_primaryKeys,
                    primaryKeyValues:v_primaryKeyValues
                },
                success:function(resp) {
                    Ext.getBody().unmask();
                    var json = jsonDecode(resp.responseText);
                    if(json.success) {
                        downLoadFileByURL(json.root);
                    }else {
                        Ext.Msg.alert($pub.prompt , json.root);
                    }
                },
                failure:function() {
                    Ext.getBody().unmask();
                }
            });
        }
    },
    uploadBlob:function(colIndex) {
        var metaData = gridResult.metas[colIndex - 1];
        var metaDataColumnName = metaData['realName'];
        var selectedRows = gridResult.getSelectionModel().getSelection();
        if(selectedRows && selectedRows.length > 0 && row_fun.checkPrimaryKeys('上传BLOB')) {
            var items = [
                {
                    xtype:'filefield',
                    name:'file',
                    fieldLabel:$pub.attachment,
                    blankText:$sqlWindow.msg.noAttachment,
                    buttonText:$pub.selectFile
                },
                {name:'dbName',hidden:true,value:nowDBName},
                {name:'tableName',hidden:true,value:objectName},
                {name:'columnName',hidden:true,value:metaDataColumnName}
            ];
            Ext.each(v_primaryKeys , function(key) {
                items.push(
                    {name:'primaryKeys',hidden:true,value:key},
                    {name:'primaryKeyValues',hidden:true,value:row_fun.getRowValue(key , selectedRows[0])}
                );
            });

            var form = new IDB.FormPanel({
                defaults:{width:540,margin: '5 2 2 0',columnWidth:1},
                fileUpload:true,
                layout:'column',
                items:items
            });
            var win = new IDB.Window({
                width:520 , height:115 , title:$pub.uploadFile,
                items:[form],
                buttons:[
                    {
                        text:$pub.upload,handler:function() {
                            if(form.isValid()) {
                                form.getForm().submit({
                                    waitMsg: $pub.importing,
                                    timeout:10 * 60 * 1000,
                                    url:'/data/queryTable/importBlob.do?token=' + getUserToken(),
                                    success:function(fp,o) {
                                        var json = o.result;
                                        if(json.success) {
                                            queryResult();
                                            win.close();
                                        }else {
                                            Ext.Msg.alert($pub.error, json.root);
                                        }
                                    },
                                    failure:function(fp,o) {
                                        try {
                                            Ext.Msg.alert($pub.error , o.result.root);
                                        }catch(e) {
                                            Ext.Msg.alert($pub.error , jsonToString(o.result))
                                        }
                                    }
                                });
                            }
                        }
                    },{
                        text:$pub.cancel , handler:function() {win.close()}
                    }
                ]
            })
        }
    }
};
function isNewRecord(record) {
    var newRecords = gridResult.store.getNewRecords();
    return (newRecords && newRecords.indexOf(record) !== -1);
}
function rendererResultValue(value, meta, record, rowIndex, colIndex) {
    var columnName = 'COLUMN_' + colIndex;
    var metaData = gridResult.metas[colIndex - 1];
    var metaDataType = metaData['datatype'];

    if (!isNull(value) && (record.raw.hasOwnProperty(columnName) || record.data[columnName] !== '')) {
        if(v_primaryKeys.length > 0 && metaDataType.indexOf('BLOB') != -1 && !isNewRecord(record)) {
            return value + "<br/><a href='javascript:row_fun.downloadBlob("+ colIndex  +")'>" + $pub.download + "</a>" +
                                " <a href='javascript:row_fun.uploadBlob(" + colIndex + ")'>" + $pub.upload + "</a>";
        }
        return encodeValue(value, meta, record);
    } else {
        if(v_primaryKeys.length > 0 && metaDataType.indexOf('BLOB') != -1 && !isNewRecord(record)) {
            return '<i style=\"color:#E5E5E5;\">null</i>' + "<br/>" +
                " <a href='javascript:row_fun.uploadBlob(" + colIndex + ")'>" + $pub.upload + "</a>";
        }
        // NULL值背景显示白灰色
        return '<i style=\"color:#E5E5E5;\">null</i>';
    }
}
var showResult = function(result) {
    var store = Ext.create('Ext.data.Store', {
        fields:result.metas
    });
    for (var rec in result.data) {
        for (var key in result.data[rec]) {
            var value = result.data[rec][key];
            if ((key.substr(0, 7) === "COLUMN_") && (typeof value === 'string')) {
                var newWidth = value.byteLength() * 10+10;
                var colIndex = key.substr(7, 3);
                if (newWidth > 400) {
                    newWidth = 400;
                }
                if ((newWidth > result.displayColumns[colIndex].width)) {
                    result.displayColumns[colIndex].width = newWidth;
                }
            }
        }
    }
    var pageSize = Ext.getCmp('query_table_page_size').getValue();
    var pageNum =  Ext.getCmp('query_table_page_num').getValue();
    var startIndex = (pageNum - 1) * pageSize;
    result.displayColumns[0].renderer = function (value, metadata, record, rowIndex) {
        return rowIndex + 1 + startIndex;
    };
    gridResult.metas = result.metas;
    for (var i = 1; i < result.displayColumns.length; i++) {
        result.displayColumns[i].renderer = rendererResultValue;
        result.displayColumns[i].sortable = false;
    }
    gridResult.displayColumns = result.displayColumns;
    gridResult.data = result.data;
    gridResult.reconfigure(store, result.displayColumns);
    store.loadRawData(result.data, true);
    //搜狗 IE8内核有列行号有问题，需强制设置width
    var length = String(startIndex + 100).length;
    gridResult.getView().getHeaderCt(1).getHeaderAtIndex(0).setWidth(length * 10 + 8);
    moveRowResult('first');
    if(canEdit()) {
        enableOptionButtons();
        setColumnEditor();
    }
};
function moveRowResult(option) {
    var selectionModel = gridResult.getSelectionModel();
    if (option === 'first') {
        selectionModel.select(0);
    } else if (option === 'last') {
        selectionModel.select(gridResult.store.getCount() - 1);
    } else if (option === 'previous') {
        selectionModel.select(gridResult.store.indexOf(selectionModel.lastSelected) - 1);
    } else if (option === 'next') {
        selectionModel.select(gridResult.store.indexOf(selectionModel.lastSelected) + 1);
    }
}

var pageSizeArray = [
    {data:50},
    {data:100},
    {data:200}
];
var export_limit = false;
var isLimitExportUrl = false ,limitExportUrl = null;
var export_limit_rows = 0;
var export_limit_rows_name = "";
var isLimitAllExport = false;
if(window.parent) {
    if(window.parent.limitExport === "1" && window.parent.maxLimitRows) {
        export_limit = true;
        export_limit_rows = window.parent.maxLimitRows;
        export_limit_rows_name = window.parent.maxLimitRowsName;
    }
    if(window.parent.limitAllExport === "1") {
        isLimitAllExport = true;
    }
    if(window.parent.limitExportUrl) {
        isLimitExportUrl = true;
        limitExportUrl =  window.parent.limitExportUrl;
        isLimitAllExport = true;
    }
}
var gridResult;
var pre_page_num = 1 , pre_page_size = 100;
var getTableResultPanel = function() {
    Ext.define('ModelSqlResult', {
        extend:'Ext.data.Model',
        fields:[]
    });
    var storeSqlResult = Ext.create('Ext.data.Store', {
        model:'ModelSqlResult',
        pageSize:50,
        data:[]
    });
    var pageSizeStore = new Ext.data.Store({
        fields:['data'],
        data:pageSizeArray,
        proxy: {
            type: 'memory'
        }
    });
    var cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
        clicksToEdit:1
    });
    var export_menu = {
        text:$pub.exportData,handler:exportJob
    };
    if(isLimitExportUrl)  {
        export_menu = {
            text:$pub.exportData,
            menu:[{
                text:$export.msg.limit , handler:function() {
                    window.parent.onbeforeunload = null;
                    window.parent.location = limitExportUrl;
                }
            }]
        }
    }else if(export_limit) {
        export_menu = {
            text:$pub.exportData,
            hidden:isLimitAllExport,
            menu:[
                {
                    text: $pub.exportCSV + '（' + $pub.most + export_limit_rows_name + '）',handler:function() {
                        exportNow('csv');
                    }
                },
                {
                    text: $pub.exportSQL + '（' + $pub.most + export_limit_rows_name + '）',handler:function() {
                        exportNow('sql');
                    }
                }
            ]
        }
    }
    gridResult = Ext.create('Ext.grid.Panel', {
        store:storeSqlResult,
        region:'center',
        deferRowRender:false,
        sortableColumns:false,
        multiSelect:true,
        viewConfig:{ stripeRows:true, enableTextSelection:true},
        columns:[ Ext.create('Ext.grid.RowNumberer', {width:30,renderer: function (value, metadata, record, rowIndex) {
            return rowIndex + 1;
        }})],
        plugins:[
            cellEditing
        ],
        listeners:{
        }
    });
    return new Ext.Panel({
        layout:'fit',
        items:[gridResult],
        bbar:[{
            text:$pub.firstPage , handler:function() {
                if(setFirstPage()) {
                    queryResult();
                }
            }
        },{
            text:$pub.prePage,handler:function() {
                if(nextPage(-1)) {
                    queryResult();
                }
            }
        }, $pub.currentPage + '：',{
            xtype:'numberfield',
            allowDecimals:false,
            id:'query_table_page_num',
            width:80,
            minValue:1,
            value:pre_page_num,
            negativeText:$pub.noNegative,
            nanText:$pub.invalidNumber
        },{
            text:'GO',handler:function() {
                queryResult();
            }
        },{
            text:$pub.nextPage , handler:function() {
                if(nextPage(1)) {
                    queryResult();
                }
            }
        },
            $pub.perPage + '：',
            {
                xtype:'combo',
                id:'query_table_page_size',
                triggerAction:'all',
                displayField:'data',
                valueField:'data',
                queryMode:'local',
                forceSelection:false,
                editable:false,
                width:80,
                typeAhead:true,
                value:pre_page_size,
                store:pageSizeStore,
                allowBlank:false,
                listeners:{
                    select:function() {
                        queryResult();
                    }
                }
            },'-',{
                text:$pub.new ,iconCls:'add',disabled:true,id:'add_btn',handler:function() {
                    cellEditing.completeEdit();
                    addRecord();
                }
            },{
                text:$pub.delete ,iconCls:'delete',disabled:true,id:'delete_btn',handler:function() {
                    cellEditing.completeEdit();
                    deleteRecord();
                }
            },{
                text:$pub.submitChange,iconCls:'accept',disabled:true,id:'commit_btn',handler:function() {
                    cellEditing.completeEdit();
                    showEditDataSql();
                }
            }],
        tbar:[{
            text:$pub.refresh,iconCls:'fa fa-refresh',handler:queryResult
        },{
            text:$pub.rowDetail,handler:showRowContent
        },{
            text:$pub.allRows,handler:showRowCount
        },export_menu,{
            text:$openTable.tplSQL,
            menu:[
                {
                    text:'Insert SQL',handler:showInsertSQLByRow
                },{
                    text:'Update SQL',handler:showUpdateSQLByRow
                }
            ]
        },{
            xtype:'checkboxfield',
            id:'binaryToHex',
            boxLabel:$openTable.binary,
            listeners:{
                change:function(thiz,newValue,oldValue) {
                    binaryToHex = newValue;
                    queryResult();
                }
            }
        }]
    });
    //cellEditing.completeEdit();
};
var showUpdateSQLByRow = function() {
    var selectionRow = gridResult.getSelectionModel().getSelection()[0];
    var sql = "update `" + objectName.replaceAll("`" , "``") + "` set\n";
    var whereSQL = "where ";
    if(!selectionRow) {
        Ext.each(v_columns , function(v) {
            sql += "\t`" + v.replaceAll("`" , "``") + "`=<" + v + ">,\n";
        });
        if(v_primaryKeys.length > 0) {
            Ext.each(v_primaryKeys , function(v) {
                whereSQL += "`" + v.replaceAll("`" , "``") + "`=<" + v + "> and ";
            });
            whereSQL = whereSQL.substring(0 , whereSQL.length - 4);
        }
    }else {
        for (var i = 0; i < selectionRow.fields.items.length; i ++) {
            var field = selectionRow.fields.items[i];
            if (field.name.substr(0, 7) === "COLUMN_") {
                var name = field.label;
                var data = selectionRow.data[field.name];
                var valueString = getFieldValueStr(data , field.datatype);
                sql += "\t`" + name.replaceAll("`" , "``") + "`=" + valueString + ",\n";
                if(v_primaryKeys.length > 0 && v_primaryKeys.indexOf(name.toLowerCase()) != -1) {
                    whereSQL += "`" + name.replaceAll("`" , "``") + "`=" + valueString + " and ";
                }
            }
        }
        if(whereSQL.length > "where ".length) {
            whereSQL = whereSQL.substring(0 , whereSQL.length - 4);
        }
    }
    sql = sql.substring(0 , sql.length - 2) + "\n\t " + whereSQL;
    showTemplateSQL(sql,'Update SQL ' + $pub.tpl);
};
var showInsertSQLByRow = function() {
    var selectionRow = gridResult.getSelectionModel().getSelection()[0];
    var sql = "insert into `" + objectName.replaceAll("`" , "``") + "` (";
    var values = "";
    if(!selectionRow) {
        Ext.each(v_columns , function(v) {
            sql += "`" + v.replaceAll("`" , "``") + "`,";
            values += "<" + v + ">";
        });
        sql = sql.substring(0 , sql.length - 1) + ")\nvalues(" + values + ")";
    }else {
        for (var i = 0; i < selectionRow.fields.items.length; i ++) {
            var field = selectionRow.fields.items[i];
            if (field.name.substr(0, 7) === "COLUMN_") {
                var name = field.label;
                var data = selectionRow.data[field.name];
                sql += "`" + name.replaceAll("`" , "``") + "`,";
                values += getFieldValueStr(data , field.datatype) + ",";
            }
        }
        sql = sql.substring(0 , sql.length - 1) + ")\nvalues(" + values.substring(0 , values.length - 1) + ")";
    }
    showTemplateSQL(sql,'Insert SQL ' + $pub.tpl);
};
var showTemplateSQL = function(content,title) {
    var sqlArea = new Ext.ux.form.field.CodeMirror({value: content, autoScroll: true});
    var win = new IDB.Window({
        title: $pub.table + '：[' + objectName + "]" + title,
        width: 600, height: 340,
        items: [sqlArea],
        buttons: [
            {text: $pub.close , handler: function () {
                win.close();
            }}
        ]
    });
};
var setFirstPage = function() {
    var pageNum = Ext.getCmp('query_table_page_num');
    if(pageNum.isValid() && pageNum.getValue() == 1) {
        Ext.Msg.alert($pub.prompt , $sqlWindow.page.alreadyFirstPage);
        return false;
    }
    pageNum.setValue(1);
    return true;
};
var nextPage = function(num) {
    var pageNum = Ext.getCmp('query_table_page_num');
    var nowNum = 0;
    if(!pageNum.isValid()) {
        nowNum = pre_page_num + num;
    }else {
        nowNum = pageNum.getValue() + num;
    }
    if(nowNum > 0) {
        pageNum.setValue(nowNum);
        return true;
    }else {
        Ext.Msg.alert($pub.prompt , $sqlWindow.page.alreadyFirstPage);
        return false;
    }
};
var showRowCount = function() {
    if(isBigTable) {
        Ext.Msg.confirm($pub.prompt , $openTable.msg.bigTable + '：' + all_tableSize + 'MB，' + $openTable.msg.confirmBigTableCount , function(v) {
            if(v === 'yes') {
                executeCount();
            }
        });
    }else {
        executeCount();
    }
};
var temp_id = 1;
var executeCount = function() {
    var panelKey = getPaneKey() + (temp_id++);
    var sql = getCountSQL();
    var win_cancel = showCancelWindow(sql , panelKey);
    ajax({
        url:baseUrl + 'executeCount.do',
        params:{panelKey:panelKey, dbName:nowDBName, sql:sql, rows:pre_page_size},
        success:function(resp) {
            win_cancel.close();
            var json = jsonDecode(resp.responseText);
            if(json.success) {
                 Ext.Msg.alert('Count Result' , $pub.allRows + '：' + json.root + "<br/>" + $openTable.msg.executedSQL + "：" + sql);
            }
        },
        failure:function() {win_cancel.close()}
    });
};
var showRowContent = function() {
    var dataStore = new Ext.data.Store({
        fields:["columnName", "columnValue", "dataType"]
    });
    var selectionRow = gridResult.getSelectionModel().getSelection()[0];
    if(!selectionRow) {
        return Ext.Msg.alert($pub.prompt , $pub.selectOneRowOption);
    }
    var setStoreData = function() {
        selectionRow = gridResult.getSelectionModel().getSelection()[0];
        dataStore.removeAll();
        for (var i = 0; i < selectionRow.fields.items.length; i ++) {
            var field = selectionRow.fields.items[i];
            if (field.name.substr(0, 7) === "COLUMN_") {
                dataStore.add({
                    columnName:field.label,
                    columnValue:selectionRow.data[field.name],
                    dataType:getDataTypeStr(field.datatype, field.size)
                });
            }
        }
        updateRowResultStatus();
    };

    var grid = new Ext.grid.Panel({
        store:dataStore,
        region:'center',
        sortableColumns:false,
        deferRowRender:false,
        viewConfig:{ stripeRows:true, enableTextSelection:true},
        columns:[
            Ext.create('Ext.grid.RowNumberer', {width:30}),
            {text:$pub.columnName , dataIndex:"columnName", width:200},
            {text:$pub.value, dataIndex:"columnValue", width:500, renderer:rendererRowResultValue},
            {text:$pub.type, dataIndex:"dataType", width:200}
        ]
    });
    var win = new IDB.Window({
        title:$pub.rowDetail,
        items:[grid],
        width:964,
        height:420,
        maximizable:true,
        closable:true,
        buttons:[{
            text:$pub.firstRow,
            id:'bn_moveFirstRow',
            disabled:true,
            handler:function () {
                moveRowResult('first');
                setStoreData();
            }
        },{
            text:$pub.preRow,id:'bn_movePreviousRow',handler:function() {
                moveRowResult('previous');
                setStoreData();
            }
        },{
            text:$pub.nextRow,id:'bn_moveNextRow',handler:function() {
                moveRowResult('next');
                setStoreData();
            }
        },{
            text:$pub.lastRow,id:'bn_moveLastRow',handler:function() {
                moveRowResult('last');
                setStoreData();
            }
        }]
    });
    function updateRowResultStatus() {
        var selection = gridResult.getSelectionModel().getSelection()[0];
        if (selection) {
            var selectionId = gridResult.getStore().indexOf(selection);
            var isFirst = (selectionId <= 0);
            var isLast = (selectionId >= gridResult.store.getCount() - 1);
            if (isFirst) {
                Ext.getCmp('bn_moveFirstRow').disable();
                Ext.getCmp('bn_movePreviousRow').disable();
            } else {
                Ext.getCmp('bn_moveFirstRow').enable();
                Ext.getCmp('bn_movePreviousRow').enable();
            }
            if (isLast) {
                Ext.getCmp('bn_moveNextRow').disable();
                Ext.getCmp('bn_moveLastRow').disable();
            } else {
                Ext.getCmp('bn_moveNextRow').enable();
                Ext.getCmp('bn_moveLastRow').enable();
            }
        }
    }
    setStoreData();
};
function getDataTypeStr(dataType, size) {
    dataType = dataType + '(' + size + ')';
    return dataType.toLowerCase();
}
function rendererRowResultValue(value, meta, record, rowIndex, colIndex) {
    if (!isNull(value)) {
        return encodeValue(value, meta, record);
    } else {
        // NULL值背景显示白灰色
        return '<i style=\"color:#E5E5E5;\">null</i>';
    }
}
Array.prototype.indexOf = function(e) {
    for(var i = 0 ; i < this.length ; i ++) {
        if(this[i] === e) {
            return i;
        }
    }
    return -1;
};
var createColumnStore = function() {
    var columnArray = [];
    Ext.each(v_columns , function(column) {
        columnArray.push({data:column});
    });
    return new Ext.data.Store({
        fields:['data'],
        data:columnArray,
        proxy: {
            type: 'memory'
        }
    });
};
var returnColumnSetting = function() {

    var grid = new Ext.grid.Panel({
        selType:'checkboxmodel',
        multiSelect:true,
        columns:[
            {text: $pub.columnName,  dataIndex: 'data' ,sortable:false ,flex:1}
        ],
        store:createColumnStore(),
        callBackQueryResult:function(selectedData) {
            v_setColumns = selectedData;
            queryResult();
        },
        buttonAlign:'center',
        buttons:[
            {
                text:$pub.ok ,handler:function() {
                    var selectedData = grid.getSelectData();
                    if(selectedData.length === 0) {
                        Ext.Msg.confirm($pub.prompt , $openTable.msg.noSelectAnyColumn , function(v) {
                            if(v == 'yes') {
                                grid.callBackQueryResult(selectedData);
                            }
                        });
                    }else {
                        if(v_primaryKeys.length === 0) {//没有主键
                            grid.callBackQueryResult(selectedData);
                        }else {
                            var v_primary_copy = v_primaryKeys.slice(0);
                            Ext.each(selectedData , function(row) {
                                var index = v_primary_copy.indexOf(row);
                                if(index !== -1) {
                                    v_primary_copy.splice(index , 1);
                                }
                            });
                            if(v_primary_copy.length > 0) {
                                var primaryKeyStr = "";
                                Ext.each(v_primary_copy , function(row) {
                                    primaryKeyStr += row + ",";
                                });
                                Ext.Msg.alert($pub.prompt , $openTable.msg.selectPrimaryKey + '：[' + primaryKeyStr.substring(0 , primaryKeyStr.length - 1) + "]");
                            }else {
                                grid.callBackQueryResult(selectedData);
                            }
                        }
                    }
                }
            }
        ],
        getSelectData:function() {
            var selectedRows = grid.getSelectionModel().getSelection();
            var selectedArray = [];
            Ext.each(selectedRows , function(record) {
                selectedArray.push(record.get("data"));
            });
            return selectedArray;
        },
        listeners:{
            afterrender:function() {
                var preSelectRecords = [];
                if(v_setColumns.length > 0) {
                    grid.store.each(function(record) {
                        if(v_setColumns.indexOf(record.get("data")) !== -1) {
                            preSelectRecords.push(record);
                        }
                    });
                }else {
                    grid.store.each(function(record) {
                        preSelectRecords.push(record);
                    });
                }
                if(preSelectRecords.length > 0) {
                    grid.getSelectionModel().select(preSelectRecords);
                }
            }
        }
    });
    return grid;
};

var setOrderByColumns = function() {
    var columnStore = createColumnStore();
    var orderStore = new Ext.data.Store({
        fields:['data'],
        data:[{data:'asc'},{data:'desc'}],
        proxy: {
            type: 'memory'
        }
    });
    var cellEditing = new Ext.grid.plugin.CellEditing({
        clicksToEdit:1
    });
    var grid = new Ext.grid.Panel({
        selType:'rowmodel',
        plugins:[
            cellEditing
        ],
        columns:[
            {xtype: 'rownumberer'},
            {text: $openTable.orderColumn,  dataIndex: 'column' ,sortable:false ,flex:1, editor:{
                xtype:'combo',
                triggerAction:'all',
                displayField:'data',
                valueField:'data',
                queryMode:'local',
                forceSelection:true,
                typeAhead:true,
                store:columnStore,
                allowBlank:false
            }},
            {text: $openTable.orderMethod , dataIndex:'order' , sortable:false , width:120 ,editor:{
                xtype:'combo',
                triggerAction:'all',
                displayField:'data',
                valueField:'data',
                queryMode:'local',
                forceSelection:true,
                typeAhead:true,
                store:orderStore,
                allowBlank:false
            }}
        ],
        buttonAlign:"center",
        buttons:[
			{
			    text:$pub.ok,handler:function() {
			        var columns = getOrderColumns();
			        if(columns.length === 0) {
			            return Ext.Msg.confirm($pub.prompt , $openTable.msg.noOrder , function(v) {
			                if(v == 'yes') {
			                	Ext.getCmp("order_sql").setValue("");
			                    callBackQueryResult([]);
			                }
			            });
			        }else {
			        	var sql = getOrderSQL(columns);
			        	if (sql && sql.length > 0) {
			        		Ext.getCmp("order_sql").setValue(sql);
			        	} else {
			        		Ext.getCmp("order_sql").setValue("");
			        	}
			            callBackQueryResult(columns);
			        }
			    }
			},
            {
                text:'<img src="/share/js/ext_2/resources/ext-theme-neptune/images/btn/iconfont-iconjia.png" height="15">',width:40,handler:function() {
                    grid.store.add({order:'asc'});
                    selectLast();
                }
            },
            {
                text:'<img src="/share/js/ext_2/resources/ext-theme-neptune/images/btn/iconfont-jian.png" height="15">',width:40,handler:function() {
                    var selectedRows = grid.getSelectionModel().getSelection();
                    if(!selectedRows || selectedRows.length == 0) {
                        Ext.Msg.alert($pub.prompt , $pub.selectOneRowOption);
                        return;
                    }
                    Ext.each(selectedRows , function(row) {
                        grid.store.remove(row);
                    });
                    grid.getView().refresh();
                    selectLast();
                }
            }
        ],
        store:new Ext.data.Store({
            fields:['column','order'],
            data:orderColumns[0] ? orderColumns[0] : [],
            proxy: {
                type: 'memory'
            }
        }),
        listeners:{
            afterrender:function() {
               grid.store.add({order:'asc'});
            }
        }
    });
    var selectLast = function() {
        var selectedRows = grid.getSelectionModel().getSelection();
        if(grid.store.getCount() > 0) {//没有人为选中的
            grid.getSelectionModel().select(grid.store.last());
        }
    };
    var getOrderColumns = function() {
        var columns = [];
        grid.store.each(function(record) {
           if(Ext.String.trim(record.get("column"))) {
               columns.push(record.data);
           }
        });
        return columns;
    };
    var callBackQueryResult = function(columns) {
        orderColumns = columns;
        queryResult();
    };
    
    var board = new Ext.Panel({
    	height:100,
    	layout:'border',
    	defaults:{
    		collapsible:false,
    		split:true,
    		bodyStyle:'padding:0px'
    	},
    	items:[{
    		xtype:'codemirror',
    		id:'order_sql',
    		name:'order',
    		border:0,
    		readOnly:true,
    		region:'center',
    		value:'',
    	}]
    });
    var res = new Ext.Panel({
    	layout:'border',
    	defaults:{
    		collapsible:false,
    		split:true,
    		bodyStyle:'padding:0px'
    	},
    	items:[{
    		region:'center',layout:'fit',items:[grid],
    	},{
    		region:'south',layout:'fit',items:[board],
    	}]
    });
    
    return res;
};

var getOrderSQL = function(v_orderColumns) {
    var realOrderColumns = v_orderColumns || orderColumns;
    if(realOrderColumns.length == 0) {
        return "";
    }
    var orderSQL = "order by ";
    Ext.each(realOrderColumns , function(row) {
        orderSQL += "`" + row['column'].replaceAll("`" , "``") + "` " + row['order'] + ",";
    });
    return orderSQL.substring(0 , orderSQL.length -1);
};
var compareMethods = [
    {data:'=' , label:$pub.equal},
    {data:'in' , label:'in'},
    {data:'!=' , label:$pub.notEqual},
    {data:'<' , label:$pub.less},
    {data:'<=' , label:$pub.lessOrEqual},
    {data:'>' , label:$pub.greater},
    {data:'>=' , label:$pub.greaterOrEqual},
    {data:'like' , label:'like'},
    {data:'like begin' , label:$pub.likePrefix , realData:'like'},
    {data:'not like' , label:'not like'},
    {data:'not like begin' , label:$pub.notLikePrefix,realData:'not like'},
    {data:'is null' , label:$pub.nullValue},
    {data:'is not null' , label:$pub.notNullValue}
];
var compareMethodMap = {};
for(var i = 0 ; i < compareMethods.length ;i++) {
    var row = compareMethods[i];
    compareMethodMap[row['data']] = row['realData'] || row['data'];
}
var createCompareMethodStore = function() {
    return new Ext.data.Store({
        fields:['data' , 'label' , 'realData'],
        data:compareMethods,
        proxy: {
            type: 'memory'
        }
    });
};
var createConnectMethodStore = function() {
    return new Ext.data.Store({
        fields:['data' , 'label'],
        data:[
            {data:'and'},
            {data:'or'}
        ],
        proxy: {
            type: 'memory'
        }
    });
};
var getCopyWhereConditionColumn = function() {
    var copyWhereConditionColumns = [];
    Ext.each(whereConditionColumns , function(row) {
        var newRow = {};
        Ext.apply(newRow , row);
        copyWhereConditionColumns.push(newRow);
    });
    return copyWhereConditionColumns;
};
var whereConditionPanel = null;
var setWhereCondition = function() {
    var columnStore = createColumnStore();
    var compareMethodStore = createCompareMethodStore();
    var connectMethodStore = createConnectMethodStore();
    var cellEditing = new Ext.grid.plugin.CellEditing({
        clicksToEdit:1
    });
    var selectLast = function() {
        var selectedRows = grid.getSelectionModel().getSelection();
        if(grid.store.getCount() > 0) {//没有人为选中的
            grid.getSelectionModel().select(grid.store.last());
        }
    };

    var grid = whereConditionPanel = new Ext.grid.Panel({
        selType:'rowmodel',
        plugins:[
            cellEditing
        ],
        columns:[
            {text: $openTable.condition,  dataIndex: 'column' ,sortable:false, width:110, editor:{
                xtype:'combo',
                triggerAction:'all',
                displayField:'data',
                valueField:'data',
                queryMode:'local',
                forceSelection:true,
                typeAhead:true,
                store:columnStore,
                allowBlank:false
            }},
            {text: $openTable.relative,  dataIndex: 'computeMethod' ,sortable:false ,width:60, editor:{
                xtype:'combo',
                triggerAction:'all',
                displayField:'label',
                valueField:'data',
                queryMode:'local',
                forceSelection:true,
                editable:false,
                typeAhead:true,
                store:compareMethodStore,
                allowBlank:false,
                listeners:{
                    select:function() {

                    }
                }
            },renderer:function(v) {
                if(v) {
                    var record = grid.compareMethodStore.findRecord("data" , v);
                    return record.get("label");
                }
                return v;
            }},{
                text: $pub.value,dataIndex: 'values' ,sortable:false ,width:130,editor:{
                    xtype:'textfield'
                },
                renderer:function(v,css,row) {
                    var data = row.data;
                    if(data['computeMethod'] === 'in') {
                        return v + '<a href="javascript:whereConditionPanel.editColumnValue()">' + $pub.valueList + '</a>';
                    }
                    return v;
                }
            },{
                text:$openTable.connector,dataIndex:'connectMethod',sortable:false,width:70, editor:{
                    xtype:'combo',
                    triggerAction:'all',
                    displayField:'data',
                    valueField:'data',
                    queryMode:'local',
                    forceSelection:true,
                    editable:false,
                    typeAhead:true,
                    store:connectMethodStore,
                    allowBlank:false
                }
            }
        ],
        buttonAlign:"center",
        buttons:[{
        	text:$pub.ok,width:40,handler:function() {
                var filterColumns = grid.getFilterColumns();
                if(filterColumns.length == 0) {
                    whereConditionSQL = "";
                    Ext.getCmp("where_sql").setValue("");
                    whereConditionColumns = [];
                    queryResult();
                }else {
                    var conditionSQLObject = getWhereConditionSQL(filterColumns , compareMethodStore);
                    if(conditionSQLObject.status) {
                        whereConditionSQL = conditionSQLObject.whereCondition;
                        if (whereConditionSQL && whereConditionSQL.length > 0) {
                            Ext.getCmp("where_sql").setValue(whereConditionSQL);
                        } else {
                        	Ext.getCmp("where_sql").setValue("");
                        }
                        whereConditionColumns = filterColumns;
                        queryResult();
                    }
                }
            }
        },{
        	text:'<img src="/share/js/ext_2/resources/ext-theme-neptune/images/btn/iconfont-iconjia.png" height="15">',width:10,handler:function() {
                grid.store.add({computeMethod:'=',connectMethod:'and'});
                selectLast();
            }
        },{
        	text:'<img src="/share/js/ext_2/resources/ext-theme-neptune/images/btn/iconfont-jian.png" height="15">',width:10,handler:function() {
                var selectedRows = grid.getSelectionModel().getSelection();
                if(!selectedRows || selectedRows.length === 0) {
                    Ext.Msg.alert($pub.prompt , $pub.selectOneRowOption);
                    return;
                }
                Ext.each(selectedRows , function(row) {
                    grid.store.remove(row);
                });
                grid.getView().refresh();
                selectLast();
            }
        }],
        store:new Ext.data.Store({
            fields:['column','computeMethod','values','connectMethod'],
            data:getCopyWhereConditionColumn(),
            proxy: {
                type: 'memory'
            }
        }),
        listeners:{
            afterrender:function() {
                grid.store.add({computeMethod:'=',connectMethod:'and'});
            },
            beforeEdit:function(grid,e) {
                var computeMethod =  e.record.get('computeMethod');
                if((computeMethod == 'in' || computeMethod == 'is null' || computeMethod == 'is not null') && e.column.dataIndex == "values") {
                    return false;
                }
                return true;
            }
        },
        editColumnValue:function() {
            var row = grid.getSelectionModel().getSelection()[0];
            editColumnValuePanel(row);
        },
        getFilterColumns:function() {
            var columnArray = [];
            grid.store.each(function(record) {
                if(record.get('column')) {
                    columnArray.push(record.data);
                }
            });
            return columnArray;
        }
    });
    grid.compareMethodStore = compareMethodStore;

    var editColumnValuePanel = function(row) {
        var values = row.get("values");
        var valueArray = splitValues(values);
        var valueRowsData = [];
        Ext.each(valueArray , function(row) {
            valueRowsData.push({value:row});
        });
        var columnGrid = new Ext.grid.Panel({
            selType:'rowmodel',
            plugins:[
                new Ext.grid.plugin.CellEditing({
                    clicksToEdit:1
                })
            ],
            columns:[
                {xtype: 'rownumberer'},
                {
                    text: $pub.value,dataIndex: 'value' ,sortable:false ,flex:1,editor:{
                        xtype:'textfield'
                    }
                }
            ],
            store:new Ext.data.Store({
                fields:['value'],
                data:valueRowsData,
                proxy: {
                    type: 'memory'
                }
            }),
            listeners:{
                afterrender:function() {
                    columnGrid.store.add({});
                }
            }
        });
        var selectLast2 = function() {
            var selectedRows = columnGrid.getSelectionModel().getSelection();
            if(columnGrid.store.getCount() > 0) {//没有人为选中的
                columnGrid.getSelectionModel().select(columnGrid.store.last());
            }
        };
        var windowInner = new IDB.Window({
            title:$openTable.msg.inputValues ,height:450,width:450,closable:true,items:[columnGrid],
            buttons:[{
                text:'<img src="/share/js/ext_2/resources/ext-theme-neptune/images/btn/iconfont-iconjia.png" height="15">',width:40,handler:function() {
                    columnGrid.store.add({});
                    selectLast2();
                }
            },{
                text:'<img src="/share/js/ext_2/resources/ext-theme-neptune/images/btn/iconfont-jian.png" height="15">',width:40,handler:function() {
                    var selectedRows = columnGrid.getSelectionModel().getSelection();
                    if(!selectedRows || selectedRows.length === 0) {
                        Ext.Msg.alert($pub.prompt , $pub.selectOneRowOption);
                        return;
                    }
                    Ext.each(selectedRows , function(row) {
                        columnGrid.store.remove(row);
                    });
                    columnGrid.getView().refresh();
                    selectLast2();
                }
            },{
                text:$pub.prompt,handler:function() {
                    var values = '';
                    columnGrid.store.each(function(record) {
                        if(record.get("value")) {
                            values += "'" + record.get("value").replaceAll("'" , "''") + "',";
                        }
                    });
                    if(values.length > 0) {
                        values = values.substring(0 , values.length - 1);
                    }
                    row.set('values' , values);
                    windowInner.close();
                }
            },{
                text:$pub.cancel , handler:function() {
                    windowInner.close();
                }
            }]
        });
    };
    var board = new Ext.Panel({
    	height:100,
    	layout:'border',
    	defaults:{
    		collapsible:false,
    		split:true,
    		bodyStyle:'padding:0px'
    	},
    	items:[{
    		xtype:'codemirror',
    		id:'where_sql',
    		name:'where',
    		border:0,
    		readOnly:true,
    		region:'center',
    		value:'',
    	}]
    });
    var res = new Ext.Panel({
    	layout:'border',
    	defaults:{
    		collapsible:false,
    		split:true,
    		bodyStyle:'padding:0px'
    	},
    	items:[{
    		region:'center',layout:'fit',items:[grid],
    	},{
    		region:'south',layout:'fit',items:[board],
    	}]
    });
    return res;
};
var getWhereConditionSQL = function(columns,compareMethodStore) {
    var initWhereCondition = "where ";
    var whereCondition = initWhereCondition , preConnect = "";
    var status = true;
    Ext.each(columns , function(row) {
        if(!status) {
            return ;
        }
        var values = row['values'] , computeMethod = row['computeMethod'];
        if(!values && computeMethod != 'is null' && computeMethod != 'is not null') {
            /*Ext.Msg.alert('提示' , '对列：[' + row['column'] + "]的[" + compareMethodStore.findRecord("data" , computeMethod).get("label") + "]匹配操作未输入任何值");
             status = false;*/
            return;
        }
        whereCondition += preConnect + " `" + row['column'].replaceAll("`" , "``") + "` " + compareMethodMap[computeMethod];
        if(computeMethod == "=" || computeMethod == '!=') {
            if(values.charAt(0) != "'" && values.charAt(0) != '"' && values.substring(0 , 2) != '0x') {
                values = "'" + values.replaceAll("'" , "''") + "'";
            }
            whereCondition += values;
        }else if(computeMethod == '>' || computeMethod == '<' || computeMethod == '>=' || computeMethod == '<=') {
            whereCondition += values;
        }else if(computeMethod == 'like' || computeMethod == 'not like') {
            if(values.charAt(0) == "'" || values.charAt(0) == '"') {
                values = values.substring(1 , values.length - 1);
            }
            whereCondition += "'%" + values + "%'";
        }else if(computeMethod == 'like begin' || computeMethod == 'not like begin') {
            if(values.charAt(0) == "'" || values.charAt(0) == '"') {
                values = values.substring(1 , values.length - 1);
            }
            whereCondition += "'" + values + "%'";
        }else if(computeMethod == 'in') {
            whereCondition += "(" + values + ")";
        }
        whereCondition += "\n      ";
        preConnect = row['connectMethod'];
    });
    if(whereCondition == initWhereCondition) {
        whereCondition = "";
    }
    return {whereCondition:whereCondition , status:status};
};
var splitValues = function(values) {
    var valueArray = [];
    if(values) {
        var beginIndex = 0;
        var comm1 = false , comm2 = false;
        var valueLength = values.length;
        for(var i = 0 ; i < valueLength ; i++) {
            var c = values.charAt(i);
            if(comm1 && c == "'") {
                if((i + 1) < valueLength && values.charAt(i + 1) != "'") {
                    comm1 = false;
                }else {
                    i++;
                }
            }else if(comm2 && c == "\"") {
                if((i + 1) < valueLength && values.charAt(i + 1) != "\"") {
                    comm2 = false;
                }else {
                    i++;
                }
            }else if(c == "\\" && (comm1 || comm2)) {
                i++;
            }else if(!comm1 && !comm2) {
                if(c == "'") {
                    comm1 = true;
                }else if(c == "\"") {
                    comm2 = true;
                }else if(c == ',') {
                    valueArray.push(clearData(values.substring(beginIndex , i)));
                    beginIndex = i + 1;
                }
            }
        }
        if(beginIndex != valueLength) {
            valueArray.push(clearData(values.substring(beginIndex , valueLength)));
        }
    }
    return valueArray;
};
var clearData = function(data) {
    if(data) {
        if(data.charAt(0) == "'") {
            data = data.substring(1 , data.length - 1);
            data = data.replaceAll("''" , "'");
            data = data.replaceAll("\\'" , "'");
        }else if(data.charAt(0) == "\"") {
            data = data.substring(1 , data.length - 1);
            data = data.replaceAll("\"\"" , "\"");
            data = data.replaceAll("\\\"" , "\"");
        }
    }
    return data;
};
var fileTypeArray2 = [
    {data:'CSV' , label:'CSV'},
    {data:'SQL_Insert' , label:'SQL_Insert'}
];
var fileCharsetTypeArray = [
    {data:'utf8'},
    {data:'gbk'}
];
var rowsLimitArray = [
    {data:'10000' , label:$pub.tenThousand},
    {data:'50000' , label:$pub.fiftyThousand},
    {data:'100000' , label:$pub.hundredThousand},
    {data:'200000' , label:$pub.towHundredThousand},
    {data:'500000' , label:$pub.fiveHundredThousand},
    {data:'1000000' , label:$pub.million},
    {data:'2000000' , label:$pub.towMillion},
    {data:'5000000' , label:$pub.fiveMillion}
];
var exportNow = function(format) {
    var sql = getNoLimitSQL();
    openPostWindow(baseUrl + 'export.do?format=' + format + '&panelKey=export&tableName=' + objectName + '&dbName=' + nowDBName + '&rows=' + export_limit_rows + '&_nocache=' + Math.random() + "&token=" + getUserToken(), sql, "_blank");
};
function openPostWindow(url, sql, name) {
    var tempForm = document.createElement("form");
    tempForm.id = "tempForm1";
    tempForm.method = "post";
    tempForm.action = '/mysql' + url;
    tempForm.target = name;
    var hideInput = document.createElement("input");
    hideInput.type = "hidden";
    hideInput.name = "sql";
    hideInput.value = sql;
    tempForm.appendChild(hideInput);
    document.body.appendChild(tempForm);
    tempForm.submit();
    document.body.removeChild(tempForm);
}
var exportJob = function() {
    var sql = getNoLimitSQL();
    /*if(window.parent && window.parent.limitExport == "1" && window.parent.maxLimitRows) {
         return exportNow(sql);
    }*/
    var form = new IDB.FormPanel({
        region:'center',
        layout:'column',
        defaults:{margin: '2 2 2 0',width:500,columnWidth:1,labelWidth:100},
        items:[
            {
                columnWidth:.5,
                width:230,
                fieldLabel:$pub.fileType,
                editable:false,
                blankText:$export.msg.fileTypeNull,
                xtype:'combo',
                name:'fileType',
                triggerAction:'all',
                displayField:'label',
                valueField:'data',
                queryMode:'local',
                forceSelection:true,
                typeAhead:true,
                value:'CSV',
                store:new Ext.data.Store({
                    fields:['data' , 'label'],
                    data:fileTypeArray2
                })
            },{
                columnWidth:.5,
                fieldLabel:$pub.fileCharacterSet,
                editable:false,
                blankText:$export.msg.fileCharacterSetNull,
                xtype:'combo',
                name:'fileCharset',
                triggerAction:'all',
                displayField:'data',
                valueField:'data',
                queryMode:'local',
                value:'gbk',
                forceSelection:true,
                typeAhead:true,
                store:new Ext.data.Store({
                    fields:['data'],
                    data:fileCharsetTypeArray
                })
            },
            {
                xtype:'checkboxgroup',
                fieldLabel:$pub.option,
                id:'check_option',
                columns:1,
                items:[
                    {
                        name:'compressInsert',
                        inputValue:'Y',
                        hidden:true,
                        checked:true,
                        boxLabel:$export.mysqlInsertCompress
                    },
                    {
                        name:'enableCsvTitleRow',
                        inputValue:'Y',
                        checked:true,
                        boxLabel:$export.containsCSVFirstRow
                    }
                ]
            },
            {
                fieldLabel:$export.limitRows,
                editable:false,
                xtype:'combo',
                name:'tableRowsLimit',
                triggerAction:'all',
                displayField:'label',
                valueField:'data',
                queryMode:'local',
                value:'200000',
                forceSelection:true,
                typeAhead:true,
                store:new Ext.data.Store({
                    fields:['data' , 'label'],
                    data:rowsLimitArray
                })
            },
            {
                fieldLabel:$pub.db,
                name:'dbName',
                blankText:$export.msg.dbNull,
                readOnly:true,
                value:nowDBName
            },
            {
                fieldLabel:'执行SQL',
                xtype:'textarea',
                height:90,
                maxLength:20000,
                emptyText:$export.msg.inputSQL,
                maxLengthText:$export.msg.sqlLengthLimit,
                minLength:8,
                minLengthText:$export.msg.sqlLengthTowShort,
                name:'sql',
                value:Ext.String.trim(sql),
                allowBlank:false,
                blankText:$export.msg.sqlNull
            },
            {
                fieldLabel:$pub.desc,
                xtype:'textarea',
                height:60,
                maxLength:1024,
                maxLengthText:$export.msg.descTooLong,
                name:'createDesc',
                allowBlank:true
            }
        ]
    });
    var fileTypeField = form.getForm().findField('fileType');
    var setExportCreateScript = function() {
        if(fileTypeField.getValue() === 'SQL_Insert') {
            form.getForm().findField('compressInsert').show();
            form.getForm().findField('enableCsvTitleRow').hide();
        }else {
            form.getForm().findField('compressInsert').hide();
            form.getForm().findField('enableCsvTitleRow').show();
        }
    };
    var submitTO = function() {
        if(form.isValid()) {
            var params = form.getValues();
            params['exportMode'] = "sql";
            params['exportMethod'] = 'data';
            Ext.apply(params , advanceWindow.getAdvanceValues());
            win.getEl().mask($pub.submitJob);
            ajax({
                url:'/data/export/saveExportJobByQueryTable.do',
                params:params,
                success:function(resp) {
                    win.getEl().unmask();
                    var json = jsonDecode(resp.responseText);
                    if(json.success) {
                        showMonitor(json.root);
                        win.close();
                    }else {
                        Ext.Msg.alert($pub.error , json.root);
                    }
                },
                failure:function() {
                    win.getEl().unmask();
                }
            });
        }
    };
    fileTypeField.on('select' , setExportCreateScript);
    var win = new IDB.Window({
        title:$export.title.newSQLJob,
        width:850,
        height:420,
        closable:true,
        layout:'fit',
        items:[form],
        buttons:[{
            text:$pub.seniorOption,handler:function() {
                advanceWindow.show();
            }
        },{
            text:$pub.ok,handler:submitTO
        },{
            text:$pub.cancel,handler:function() {
                win.close();
            }
        }]
    });
    var advanceWindow = createAdvanceWindow();
    win.on('beforedestroy' , function() {
        advanceWindow.close();
    });
};
var createAdvanceWindow = function() {
    var form = new IDB.FormPanel({
        defaults:{
            bodyPadding:5,
            padding:'0 5 0 5',
            xtype:'fieldset',
            width:520,
            defaults:{
                autoFitErrors:false,//自动调整错误提示时候的宽度
                labelSeparator:' : ',
                labelWidth:80,
                width:500,
                labelAlign:'right',
                xtype:'textfield'
            }
        },
        items:[
            {
                title:$export.dataOption,
                items:[
                    {xtype:'checkboxfield',name:'exportBlob',inputValue:'Y',hiddenLabel:true,checked:false,boxLabel:$export.blob},
                    {xtype:'checkboxfield',name:'exportBinary',inputValue:'Y',hiddenLabel:true,checked:true,boxLabel:$export.binary},
                    {xtype:'checkboxfield',name:'exportClob',inputValue:'Y',hiddenLabel:true,checked:true,boxLabel:$export.text}
                ]
            }
        ]
    });
    var win = new Ext.window.Window({
        height:220 , width:600 , title:$pub.seniorOption,
        modal:true,layout:'fit',closable:false,buttonAlign:'center',items:[form],
        buttons:[{
            text:$pub.ok,handler:function() {
                win.hide();
            }
        }],
        getAdvanceValues:function() {
            return form.getValues();
        }
    });
    return win;
};
var showMonitor = function(id) {
    ajax({
        url:'/data/export/monitorExportJob.do?id='+id + "&firstTime=Y",
        success:function(resp) {
            var json = jsonDecode(resp.responseText);
            if(json.success) {
                showMonitorDoing(json.root , id);
            }else {
                Ext.Msg.alert($pub.prompt , json.root);
            }
        }
    });
};
var showMonitorDoing = function(json , id) {
    if(json['exportStatus'] === 'END' && json['exportMode'] !== 'sql') {
        return showDetail(id);
    }
    var use = getProcess(json);
    var sql = json['sql'];
    var processBar = new Ext.ProgressBar({
        width:500,height:45,text:$export.nowProcess + '：' + use + "%" , paddingTop:5,region:'north'
    });
    processBar.updateProgress(parseFloat(use)/100 , $export.nowProcess +'：' + use + "%<br/>" + $export.allRows + "：" + json['nowRows'] , true);
    var win = new IDB.Window({
        title:$export.refreshRate,
        layout:'border',
        width:680,
        height:450,
        items:[{
            region:'north',height:50,border:false,layout:'fit',items:[processBar],id:'processBarArea'
        },{
            html:$pub.detail,region:'center',layout:'fit',border:false,baseCls:'log_content',id:'oneTableLog',xtype:'container'
        }],
        buttons:[{
            text:$pub.close,handler:function() {
                win.close();
            }
        },{
            hidden:true,
            id:'monitor_download_file',
            text:$pub.downloadFile , handler:function() {
                downloadAllFile(id);
            }
        }]
    });
    var nowLogContentDom = Ext.getCmp('oneTableLog').el.dom;
    nowLogContentDom.innerHTML = "<pre>" + getMonitorBaseInfoByRow(json , new Date()) + (json['log'] || '') + "</pre>";
    var task = {
        interval:2000,
        run:function() {
            var date = new Date();
            ajax({
                url:'/data/export/monitorExportJob.do?id='+id,
                success:function(resp) {
                    var json = jsonDecode(resp.responseText);
                    if(json.success) {
                        json = json.root;
                        json['sql'] = sql;
                        var use = getProcess(json);
                        processBar.updateProgress(parseFloat(use)/100 , $export.nowProcess + '：' + use + "%<br/>已导出总行数：" + json['nowRows'] , true);
                        nowLogContentDom.innerHTML = "<pre>" + getMonitorBaseInfoByRow(json , new Date()) + (json['log'] || '') + "</pre>";
                        nowLogContentDom.scrollTop = nowLogContentDom.scrollHeight;
                        if(json['exportStatus'] == 'END') {
                            Ext.TaskManager.stop(task);
                            win.setTitle($pub.detail);
                            Ext.getCmp('monitor_download_file').show();
                            downloadAllFile(id);
                        }else if(json['exportStatus'] == 'ERROR') {
                            Ext.TaskManager.stop(task);
                            win.setTitle($pub.checkErrorInfo);
                            Ext.getCmp('processBarArea').hide();
                        }
                    }else {
                        Ext.Msg.alert('提示' , json.root);
                    }
                }
            });
        }
    };
    if(json['exportStatus'] != 'ERROR') {
        Ext.TaskManager.start(task);
        win.on('beforedestroy' , function() {
            Ext.TaskManager.stop(task);
        });
    }else {
        win.setTitle($pub.checkErrorInfo);
        Ext.getCmp('processBarArea').hide();
    }
};
var getMonitorBaseInfoByRow = function(row , date) {
    if(row['exportMode'] === 'sql') {
        return '======================================================================\n' +
            '     ' + $pub.nowStatus + '：' + Ext.util.Format.htmlDecode(row['statusName']) +  "\n" +
            '     ' + $pub.refreshTime + '：' + Ext.util.Format.date(date , 'Y-m-d H:i:s') + '\n' +
            '     ' + Ext.util.Format.htmlDecode(row['nowLog'] || $pub.waitingExecute) +  "\n" +
            '     ' + $pub.sqlScript + '：\n' +
            '     ' + String(row['sql']).replaceAll("\n" , "\n     ") + '\n' +
            '======================================================================\n';
    }
    /*return '======================================================================\n' +
        '     当前状态：' + Ext.util.Format.htmlDecode(row['statusName']) +  "\n" +
        '     已导出表：' + Ext.util.Format.htmlDecode(row['exportedTabs'])  + " / " + Ext.util.Format.htmlDecode(row['exportTabNum']) +  "\n" +
        '     刷新时间：' + Ext.util.Format.date(date , 'Y-m-d H:i:s') + '\n' +
        '     ' + Ext.util.Format.htmlDecode(row['nowLog'] || '等待执行....') +  "\n" +
        '======================================================================\n';*/
    return '======================================================================\n' +
        '     ' + $pub.nowStatus + '：' + Ext.util.Format.htmlDecode(row['statusName']) +  "\n" +
        '     ' + $export.tables + '：' + Ext.util.Format.htmlDecode(row['exportedTabs'])  + " / " + Ext.util.Format.htmlDecode(row['exportTabNum']) +  "\n" +
        '     ' + $pub.refreshTime + '：' + Ext.util.Format.date(date , 'Y-m-d H:i:s') + '\n' +
        '     ' + Ext.util.Format.htmlDecode(row['nowLog'] || $pub.waitingExecute) +  "\n" +
        '======================================================================\n';
};
var getProcess = function(data) {
    var use = 0;
    if(data['exportStatus'] === 'END') {
        return 100;
    }
    if(data['preRows'] && data['exportStatus'] !== 'END') {
        use = ((parseFloat(data['nowRows']) / parseInt(data['preRows'])) * 100).toFixed(0);
        if(use >= 100) {
            use = 99;
        }
    }else {
        use = ((parseFloat(data['completeSize']) / parseInt(data['exportTabSize'])) * 100).toFixed(0);
    }
    return use;
};
var downloadAllFile = function(id) {
    downLoadFileByURL("/mysql/data/export/downLoadAllFile.do?id=" + id + "&token=" + getUserToken());
};
function isNumberDataType(dataType) {
    return (dataType.indexOf('INT') >= 0 || dataType == 'REAL' || dataType == 'FLOAT' || dataType == 'DOUBLE' || dataType == 'NUMBER' || dataType == 'NUMERIC');
}
function isBitDataType(dataType) {
    return (dataType === 'BIT');
}
function isStringDataType(dataType) {
    return (dataType.indexOf('CHAR') >= 0 || dataType.indexOf('TEXT') >= 0);
}
function addRecord() {
    var fields = gridResult.store.model.getFields();
    var newRecord = gridResult.store.add({'__new':1})[0];// 在最后一个位置插入
    gridResult.getView().scrollBy(0, 10000000);
    gridResult.getView().refresh();
    gridResult.getSelectionModel().select(gridResult.store.getCount() - 1);
    //设置默认值
    for (var i = 0; i < fields.length; i++) {
        if (gridResult.editTableName == fields[i].tableName && gridResult.editDbName == fields[i].dbName) {
            var columnName = fields[i].realName;
            var defaultValue = getColumnDefaultValue(columnName);
            if (defaultValue != undefined) {
                newRecord.set(fields[i].name, defaultValue);
            }
        }
    }
}
function deleteRecord() {
    var selection = gridResult.getSelectionModel().getSelection();
    if (selection.length <= 0) {
        Ext.MessageBox.alert($pub.prompt, $pub.selectOneRowOption);
        return;
    }
    for (var i = 0; i < selection.length; i++) {
        gridResult.store.remove(selection[i]);
    }
}
function setColumnEditor() {
    var dbName = nowDBName;
    var tableName = objectName;
    var fields = gridResult.store.model.getFields();
    var columns = gridResult.columnManager.getColumns();
    for (var i = 0; i < columns.length; i ++) {
        var column = columns[i];
        if (i > 0) {
            for (var j = 0; j < fields.length; j ++) {
                var field = fields[j];
                if (field.name == column.dataIndex) {
                    if (!field.readOnly && field.tableName == tableName && field.dbName == dbName) {
                        if (isNumberDataType(field.datatype) && !Ext.isIE) {
                            column.setEditor({xtype:'numberfield', decimalPrecision:20});
                        } else if (field.datatype == 'DATE') {
                            column.setEditor('idbdatefield');
                        } else if (field.datatype == 'DATETIME' || field.datatype == 'TIMESTAMP') {
                            column.setEditor('datetimefield');
                        } else if (field.datatype.indexOf('BLOB') >= 0) {
                            //blob暂时不支持编辑
                            column.setEditor(null);
                        } else if (field.size >= 10000) {
                            column.setEditor('idbtextarea');
                        } else {
                            column.setEditor('mixEditor');
                        }
                    }
                }
            }
        }
    }
}
function getDeleteRecordSql(tableName) {
    var allSql = new Array();
    var records = gridResult.getStore().getRemovedRecords();
    for (var i = 0; i < records.length; i++) {
        var whereStr = '';
        var oldColumns = records[i].modified;
        var newColumns = records[i].data;
        for (var j = 0; j < records[i].fields.length; j++) {
            var field = records[i].fields.items[j];
            var columnName = field.name;
            var rowIndex = gridResult.getStore().indexOf(records[i]);
            var realName = field.realName;
            if (realName && v_primaryKeys.length > 0 && v_primaryKeys.indexOf(realName) != -1) {
                if (whereStr != '') {
                    whereStr = whereStr + ' and ';
                }
                var pkOldValue = oldColumns[columnName];
                if (pkOldValue == undefined) {
                    pkOldValue = records[i].data[columnName];
                }
                if (isNoZeroEmpty(pkOldValue)) {
                    Ext.Msg.alert($pub.prompt, $sqlWindow.page.the + (rowIndex + 1) + $pub.row + $pub.primaryKey + '[' + field.realName + ']' + $pub.notNull);
                    return;
                }
                whereStr = whereStr + '`' + field.realName + "`=" + getFieldValueStr(pkOldValue, field.datatype);
            }
        }
        var sql = 'delete from ' + tableName + ' where ' + whereStr + ';';
        allSql.push({rowIndex:rowIndex, type:'D', sql:sql});
    }
    return allSql;
}
function getInsertRecordSql(tableName) {
    var allSql = new Array();
    var records = gridResult.getStore().getModifiedRecords();
    for (var i = 0; i < records.length; i++) {
        var sql = '';
        var oldColumns = records[i].modified;
        var newColumns = records[i].getChanges();
        if (records[i].raw.__new == 1) {
            var insertColumnNames = '';
            var insertColumnValues = '';
            var rowIndex = gridResult.getStore().indexOf(records[i]);
            for (var j = 0; j < records[i].fields.length; j++) {
                var field = records[i].fields.items[j];
                var columnName = field.name;
                if (oldColumns[columnName] != undefined) {
                    if (insertColumnNames != '') {
                        insertColumnNames = insertColumnNames + ',';
                        insertColumnValues = insertColumnValues + ',';
                    }
                    insertColumnNames = insertColumnNames + '`' + field.realName + '`';
                    insertColumnValues = insertColumnValues + getFieldValueStr(newColumns[columnName], field.datatype);
                }
            }
            if (insertColumnNames != '') {
                sql = 'insert ' + tableName + '(' + insertColumnNames + ') values(' + insertColumnValues + ');';
                allSql.push({rowIndex:rowIndex, type:'I', sql:sql});
            }
        }
    }
    return allSql;
}
function getUpdateRecordSql(tableName) {
    var allSql = new Array();
    var records = gridResult.getStore().getModifiedRecords();
    for (var i = 0; i < records.length; i++) {
        var sql = '' , field , columnName;
        var oldColumns = records[i].modified;
        var newColumns = records[i].getChanges();
        if (records[i].raw.__new != 1) {
            for (var j = 0; j < records[i].fields.length; j++) {
                field = records[i].fields.items[j];
                columnName = field.name;
                if (oldColumns[columnName] != undefined) {
                    if (sql != '') {
                        sql = sql + ',';
                    }
                    sql = sql + '`' + field.realName + "`=" + getFieldValueStr(newColumns[columnName], field.datatype);
                }
            }
            if (sql != '') {
                var whereStr = '';
                var rowIndex = gridResult.getStore().indexOf(records[i]);
                for (var k = 0; k < records[i].fields.length; k++) {
                    field = records[i].fields.items[k];
                    columnName = field.name;
                    var realName = field.realName;
                    if (realName && v_primaryKeys.length > 0 && v_primaryKeys.indexOf(realName) != -1) {
                        if (whereStr != '') {
                            whereStr = whereStr + ' and ';
                        }
                        var pkOldValue = oldColumns[columnName];
                        if (pkOldValue == undefined) {
                            pkOldValue = records[i].data[columnName];
                        }
                        if (isNoZeroEmpty(pkOldValue)) {
                            Ext.Msg.alert($pub.prompt, $sqlWindow.page.the + (rowIndex + 1) + $pub.row + $pub.primaryKey + '[' + field.realName + ']' + $pub.notNull);
                            return;
                        }
                        whereStr = whereStr + '`' + field.realName + "`=" + getFieldValueStr(pkOldValue, field.datatype);
                    }
                }
                sql = 'update ' + tableName + ' set ' + sql + ' where ' + whereStr + ';';
                allSql.push({rowIndex:rowIndex, type:'U', sql:sql});
            }
        }
    }
    return allSql;
}

function showEditDataSql() {
    var tableName = "`" + objectName.replaceAll("`" , "``") + "`";
    var allSql = new Array();
    var deleteSql = getDeleteRecordSql(tableName);
    var insertSql = getInsertRecordSql(tableName);
    var updateSql = getUpdateRecordSql(tableName);
    allSql = allSql.concat(deleteSql, insertSql, updateSql);
    if (allSql.length == 0) {
        return Ext.MessageBox.alert($pub.prompt, $sqlWindow.msg.noChanged);
    }
    var allSqlText = new Array();
    for (var i = 0; i < allSql.length; i++) {
        allSqlText.push(allSql[i].sql);
    }
    var title = $sqlWindow.title.changeDetail;
    if (deleteSql.length > 0) {
        title = title + 'delete:' + deleteSql.length + $pub.row + ' ;'
    }
    if (insertSql.length > 0) {
        title = title + 'insert:' + insertSql.length + $pub.row + '；'
    }
    if (updateSql.length > 0) {
        title = title + 'update:' + updateSql.length + $pub.row + '；'
    }
    var win = Ext.create('Ext.window.Window', {
        title: title + $sqlWindow.title.changeExecuteSQL,
        id:'win_change_sql',
        height:300,
        width:800,
        modal:true,
        maximizable:true,
        layout:'fit',
        items:{  // Let's put an empty grid in just to illustrate fit layout
            xtype:'codemirror',
            readOnly:true,
            value:allSqlText.join("\n")
        },
        buttonAlign:'center',
        buttons:[
            {text:$pub.ok, handler:function () {
                postChange(allSql);
            }},
            {text:$pub.cancel, handler:function () {
                win.close();
            }}
        ]
    }).show();
}
function postChange(allSql) {
    var loadMask = new Ext.LoadMask(Ext.getCmp('win_change_sql'), {
        msg:$pub.submitJob,
        removeMask:true
    });
    loadMask.show();
    var jsonAllSql = Ext.encode(allSql);
    Ext.Ajax.request({
        url:baseUrl + 'postChange.do',
        params:{panelKey:getPaneKey(), dbName:nowDBName, sql:jsonAllSql},
        method:'POST',
        timeout:600000,
        success:function (response, options) {
            loadMask.hide();
            var rs = Ext.decode(response.responseText);
            if (rs.failure) {
                Ext.MessageBox.alert($pub.error, rs.root);
            } else {
                var records = gridResult.getStore().getNewRecords();
                for (var i = 0; i < records.length; i++) {
                    if (records[i].raw.__new == 1) {
                        records[i].raw.__new = 0;
                    }
                }
                for (var i = 0; i < rs.root.length; i++) {
                    var record = gridResult.getStore().getAt(rs.root[i].rowIndex);
                    var fields = gridResult.store.model.getFields();
                    for (var j = 0; j < fields.length; j++) {
                        if (fields[j].isAutoIncrement && !record.get(fields[j].name)) {
                            record.set(fields[j].name, rs.root[i].lastInsertId);
                            break;
                        }
                    }
                }
                gridResult.store.commitChanges();
                Ext.getCmp('win_change_sql').close();
            }
        },
        failure:function (response, options) {
            loadMask.hide();
            Ext.MessageBox.alert($pub.error, $pub.executeNetworkError);
        }
    });
}
function getColumnDefaultValue(columnName) {
	if(gridResult && gridResult.editTableColumnsMeta){
		for (var i = 0; i < gridResult.editTableColumnsMeta.length; i++) {
			var column = gridResult.editTableColumnsMeta[i];
			if (columnName.toLowerCase() === column.FIELD.toLowerCase()) {
				return column.DEFAULT;
			}
		}
	}
}
var lTrimZero = function(value) {
    var index = 0;
    for(; index < value.length ; index++) {
        if(value.charCodeAt(index) != 0) {
            break;
        }
    }
    if(index != 0) {
        return value.substring(index);
    }
    return value;
};
function getFieldValueStr(value, dataType) {
    if (value == null) {
        return null
    }else if(value == "CURRENT_TIMESTAMP" && dataType == "TIMESTAMP") {
        return value;
    }else if(dataType.indexOf("BINARY") != -1 && value.substring(0 , 2) == '0x') {
        if(value == "0x") {
            return "''";
        }else {
            return value;
        }
    }else if(dataType == 'BINARY') {
        return "'" + lTrimZero(value) + "'";
    }else if (value === '' && !isStringDataType(dataType)) {
        return null;
    } else if (isNumberDataType(dataType)) {
        return value;
    } else if (isBitDataType(dataType)) {
        return 'b\'' + value + '\'';
    } else {
        return "'" + value.replaceAll('\\\\', '\\\\').replaceAll('\'', '\\\'') + "'";
    }
}
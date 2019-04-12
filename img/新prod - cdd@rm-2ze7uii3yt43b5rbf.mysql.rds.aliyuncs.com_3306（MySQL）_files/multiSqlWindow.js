var EXPORT_MAX_ROWS_NAME = '1万条';
var baseUrl = '/data/sqlWindow/';
var tplActionUrl = '/tpl/';
var dbList;

function getDbListValue() {
	return dbList.getValue();
}
function getTableColumnUrl() {
	return "/system/autoCompleteTableColumns.do";
}
function getParamType() {
	return "column_group";
}
var resultTabPanel;
var dblinkTips;
var dblinkNoTipsKey = 'dblink_no_tips';
var pageSizeArray = [
    {data:50},
    {data:100},
    {data:200}
];

// Tuning SQL button
var turningSQLItem;
// Tunning tab panel
var g_result_index = 0;
var SQL_TYPE_SELECT = "1";
var SQL_TYPE_SELECT_FOR_UPDATE = "2";
var SQL_TYPE_SHOW = "6";
var SQL_TYPE_EXPLAIN = "11";
var MAX_ROWS = 3000;
var EXPORT_MAX_ROWS = 10000;
var EXPORT_MAX_ROWS_NAME = $pub.tenThousandRow;
var parentPanelKey = null;

var SQL_EXPORT_MORE = null;
var initMaxRows = function() {
    if(window.parent) {
        var SQL_EXPORT = window.parent.getBidModuleLimitByModuleName('sql_export');
        SQL_EXPORT_MORE = window.parent.getBidModuleLimitByModuleName('sql_export_more');
        if(SQL_EXPORT) {
            var json = JSON.parse(SQL_EXPORT);
            EXPORT_MAX_ROWS = parseInt(json['rows']);
            if(MAX_ROWS > EXPORT_MAX_ROWS) {
                MAX_ROWS = EXPORT_MAX_ROWS;
            }
            EXPORT_MAX_ROWS_NAME = json['name'];
        }
    }
};
initMaxRows();


var isLimitExport = false, isLimitAllExport = false;
var isLimitExportUrl = false ,limitExportUrl = null;
if(window.parent) {
    if(window.parent.limitExport === "1") {
        isLimitExport = true;
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
function isQuery(sqlType) {
    return [SQL_TYPE_SELECT , SQL_TYPE_SELECT_FOR_UPDATE , SQL_TYPE_SHOW , SQL_TYPE_EXPLAIN].contains(sqlType);
}
/*************common function zc**************/
var lTrimZero = function(value) {
    var index = 0;
    for(; index < value.length ; index++) {
        if(value.charCodeAt(index) !== 0) {
            break;
        }
    }
    if(index !== 0) {
        return value.substring(index);
    }
    return value;
};
/*************common function begin**************/
Ext.define('ModelSqlPlan', {
    extend:'Ext.data.Model',
    fields:["ID", "SELECT_TYPE", "TABLE", "TYPE", "POSSIBLE_KEYS", "KEY", "KEY_LEN", "REF", "ROWS", "EXTRA"]
});
function getSql() {
    var sql = Ext.getCmp("tx_sql").getValue();
    var selectSql = Ext.getCmp("tx_sql").editor.getSelection();
    if (selectSql !== '') {
        sql = selectSql;
    }
    return sql;
}
function getFullSqlText() {
   return Ext.getCmp("tx_sql").getValue();
}
function focusInput() {
    var sqlArea = Ext.getCmp('tx_sql');
    sqlArea.editor.focus();
    var endLines = sqlArea.editor.lineCount();
    var lastLength = sqlArea.editor.getLine(endLines - 1).length;
    sqlArea.editor.setCursor(endLines - 1, lastLength);  //光标移到最后
}
function encodeValue(value, meta, record) {
    return '<pre style="padding: 0;margin:0;font-family:新宋体,Lucida Console,monospace">' + Ext.util.Format.htmlEncode(value) + '</pre>';
}
function isNull(value) {
    return (value == null);
}
function isNumberDataType(dataType) {
    dataType = String(dataType).toUpperCase();
    return (dataType.indexOf('INT') >= 0 || dataType.indexOf('REAL') == 0 || dataType.indexOf('FLOAT') == 0 || dataType.indexOf('DOUBLE') == 0 || dataType.indexOf('NUMBER') == 0 || dataType.indexOf('NUMERIC') == 0);
}
function isBitDataType(dataType) {
    return (dataType === 'BIT');
}
function isStringDataType(dataType) {
    return (dataType.indexOf('CHAR') >= 0 || dataType.indexOf('TEXT') >= 0 || dataType == "TIMESTAMP");
}
function getFieldValueStr(value, dataType) {
    if (value == null) {
        return null
    }else if(value === "CURRENT_TIMESTAMP" && dataType === "TIMESTAMP") {
        return value;
    }else if(dataType.indexOf("BINARY") !== -1 && value.substring(0 , 2) === '0x') {
        if(value === "0x") {
            return "''";
        }else {
            return value;
        }
    }else if(dataType === 'BINARY') {
        return "'" + lTrimZero(value) + "'";
    }else if (value === '' && !isStringDataType(dataType)) {
        return null;
    } else if (isNumberDataType(dataType)) {
        return value;
    } else if (isBitDataType(dataType)) {
        return 'b\'' + value + '\'';
    } else {
        return "'" + String(value).replaceAll('\\\\', '\\\\').replaceAll('\'', '\\\'') + "'";
    }
}
/*************common function end**************/

/*****/
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
function getMetaTables(gridInput) {
    var grid = (gridInput);
    var result = new Array(); var map = new SimpleMap();
    var fields = grid.metadata;
    if (!fields) {
    	return result;
    }
    for (var i = 0; i < fields.length; i ++) {
        var field = fields[i];
        if (field.name.substr(0, 7) === "COLUMN_") {
            if (field.tableName !== '' && field.dbName !== 'information_schema' && field.dbName !== 'performance_schema') {
                var key = field.dbName + "$$" + field.tableName;
                if (result.length === 0) {
                    result.push({tableName:field.tableName, dbName:field.dbName});
                    map.put(key);
                } else {
                    for (var j = 0; j < result.length; j ++) {
                        if (!map.contains(key)) {
                            result.push({tableName:field.tableName, dbName:field.dbName});
                            map.put(key);
                        }
                    }
                }
            }
        }
    }
    return result;
}
function exportResult(format,result_index) {
    var postData = {};
    var _gridResult = Ext.getCmp('result_' + result_index);
    var tables = getMetaTables(_gridResult);
    var tableName = 'xxxxxx';
    var dbName = 'xxxxxx';
    if (tables.length > 0) {
        tableName = tables[0].tableName;
        dbName = tables[0].dbName;
    }

    var sql = _gridResult.sql;
    var store = _gridResult.store;
    if(store.getTotalCount() > 0) {
        var record = store.getAt(0);
        var data = jsonToString(record.data);
        if(data.length * 1.5 > 10240) {
            return submitNewSQLJob({
                fileType:format,
                fileCharset:'utf8',
                compressInsert:'N',
                enableCsvTitleRow:'Y',
                tableRowsLimit:EXPORT_MAX_ROWS,
                dbName:dbName,
                sql:sql,
                createDesc:$sqlWindow.msg.sqlExport + EXPORT_MAX_ROWS_NAME + $sqlWindow.msg.asyncExportJob
            });
        }
    }
    Ext.getBody().mask($sqlWindow.msg.submittedJob);
    wsAjax({
        url:baseUrl + 'export.do?format=' + format + '&panelKey=export&=' + '&rows=' + EXPORT_MAX_ROWS + '&_nocache=' + Math.random() + "&token=" + getUserToken(),
        params:{sql:sql,dbName:_gridResult.dbName,tableName:tableName},
        success:function(resp) {
            Ext.getBody().unmask();
            var data = jsonDecode(resp.responseText);
            if(data.success) {
                downLoadFileByURL(data.root);
            }else {
                Ext.Msg.alert($export.msg.exportFailure , data.root);
            }
        },
        failure:function() {
            Ext.getBody().unmask();
            alert($pub.executeNetworkError)
        }
    });
    //openPostWindow(baseUrl + 'export.do?format=' + format + '&panelKey=export&tableName=' + tableName + '&dbName=' + _gridResult.dbName + '&rows=' + EXPORT_MAX_ROWS + '&_nocache=' + Math.random() + "&token=" + getUserToken(), sql, "_blank");
}
function exportMoreData(result_index) {
	var _gridResult = Ext.getCmp('result_' + result_index);
    addNewSQLJob(_gridResult.dbName , _gridResult.sql);
}
/*****/

/**********template begin****************/
//template store
var treeTplStore = new IDB.TreeStore({
  autoLoad:false,
  url:tplActionUrl + 'queryChildrenById.do'
});
treeTplStore.on('load', function () {
  treeTpl.setLoading(false);
});
//template tree panel
var treeTpl = new Ext.tree.Panel({
  store:treeTplStore,
  loadMask:true,
  rootVisible:false,
  enableDD:true,
  viewConfig:{
      plugins:{
          ptype:'treeviewdragdrop',
          ddGroup:'sqlText',
          enableDrop:false
      }
  },
  listeners:{
      itemdblclick:function (thiz, record) {
          if (record.get('leaf')) {
              var id = 0 - record.get('id');
              appendTplContentById(id);
          }
      }
  }
});
Ext.define('ModelTplQueryResult', {
  extend:'Ext.data.Model',
  fields:["ID", "NAME", "QTIP"]
});
var storeTplQueryResult = Ext.create('Ext.data.Store', {
  model:'ModelTplQueryResult',
  pageSize:50,
  data:[],
  proxy:{
      type:'ajax',
      url:tplActionUrl + '/queryTplListByName.do',
      reader:{
          type:'json',
          root:'root'
      }
  }
});
var gridTplQueryResult = Ext.create('Ext.grid.Panel', {
  region:'center',
  width:'100%',
  store:storeTplQueryResult,
  border:false,
  loadMask:true,
  columns:[
      {header:'查询结果', width:240, dataIndex:'NAME'}
  ],
  viewConfig:{
      plugins:{
          ptype:'gridviewdragdrop',
          ddGroup:'sqlText',
          enableDrop:false
      }
  },
  listeners:{
      itemdblclick:function () {
          var selected = gridTplQueryResult.getSelectionModel().getSelection()[0];
          if (!selected) {
              Ext.Msg.alert($pub.prompt, $pub.selectOneRowOption);
          } else {
              appendTplContentById(selected.get('ID'));
          }
      }
  }
});

var tabPanelTpl = new Ext.TabPanel({activeTab:0, headerStyle:'display:none',
  tbar:[
      {xtype:'textfield', id:'tx_TplQueryText', width:120, enableKeyEvents:true, listeners:{
          keypress:function (o, event) {
              if (event.keyCode === 13) {
                  queryTpl();
              }
          }
      }},
      {text:$pub.select, handler:queryTpl}
  ],
  region:'east', width:200, collapsible:true, split:true, title:$sqlWindow.title.template, tabPosition:'bottom', removePanelHeader:true,
  items:[
      {title:$sqlWindow.tab.templateNavigation , layout:'fit', items:[treeTpl]},
      {title:$sqlWindow.tab.templateSearchResult , layout:'fit', items:[gridTplQueryResult]}
  ]
});
function appendTplContentById(id) {
  Ext.Ajax.request({
      url:tplActionUrl + 'queryTplContentById.do',
      params:{
          id:id
      },
      success:function (response) {
          var rs = Ext.decode(response.responseText);
          if (rs.success) {
              if (!rs.root) {
                  Ext.MessageBox.alert($pub.prompt, $sqlWindow.msg.noTemplate);
              } else {
                  var sql = Ext.getCmp("tx_sql").getValue();
                  Ext.getCmp("tx_sql").setValue(sql + '\n' + rs.root);
              }
          }
      }
  });
}
function queryTpl() {
  var name = Ext.String.trim(Ext.getCmp('tx_TplQueryText').getValue());
  if (name === '') {
      Ext.Msg.alert($pub.prompt, $sqlWindow.msg.inputSearchTemplate)
  } else {
      storeTplQueryResult.load({
          params:{
              name:name
          }
      });
      tabPanelTpl.setActiveTab(1);
  }

}
/**********template end****************/



/************user sql begin******************/
var userPreTitle = '';
var deleteUserSQL = function() {
    var selectedRows = userSQLGrid.getSelectionModel().getSelection();
    if(selectedRows && selectedRows.length > 0) {
        var id = selectedRows[0].get('id');
        Ext.Msg.confirm($pub.prompt , $userSql.msg.confirmDelete , function(v) {
            if(v === 'yes') {
                userSQLWindow.getEl().mask($pub.deleting);
                ajax({
                    url:'/userConfig/deleteUserSQL.do',
                    onlyUrl:true,
                    params:{id:id},
                    success:function(resp) {
                        userSQLWindow.getEl().unmask();
                        var json = jsonDecode(resp.responseText);
                        if(json.success) {
                            userSQLGrid.store.load();
                        }else {
                            Ext.Msg.alert($pub.prompt , json.root);
                        }
                    },
                    failure:function() {
                        userSQLWindow.getEl().unmask();
                    }
                });
            }
        });
    }
};
var editUserSQL = function() {
    var selectedRows = userSQLGrid.getSelectionModel().getSelection();
    if(selectedRows && selectedRows.length > 0) {
        var row = selectedRows[0];
        var id = row.get('id');
        userSQLWindow.getEl().mask($pub.loading);
        ajax({
            url:'/userConfig/getUserSQLContentById.do',
            onlyUrl:true,
            params:{id:id},
            success:function(resp) {
                userSQLWindow.getEl().unmask();
                var json = jsonDecode(resp.responseText);
                if(json.success) {
                    saveUserSQL('edit' , function() {
                        userSQLGrid.store.load();
                    },row , json.root);
                }else {
                    Ext.Msg.alert($pub.prompt , json.root);
                }
            },
            failure:function() {userSQLWindow.getEl().unmask()}
        });

    }
};
var userSQLGrid , userSQLWindow;
var manageUserSQL = function() {
    var store = new Ext.data.Store({
        autoLoad:true,
        fields:['id' , 'sqlTitle' , 'userInstance' , 'dbUserName' , 'dbName' , 'userSqlPrefix' , 'sqlScope'],
        proxy:{
            type:'ajax',
            url:'/user-config/getUserSQLs.do?onlyUrl=true',
            reader:{
                type:'json',
                root:'root'
            }
        }
    });
    var grid = userSQLGrid = new Ext.grid.Panel({
        emptyText:$userSql.msg.saveFirstSQL,
        selType:'rowmodel',
        viewConfig:{ stripeRows:true, enableTextSelection:true},
        store:store,
        columns:[
            {xtype: 'rownumberer'},
            {text:$pub.title , dataIndex:"sqlTitle",  width:120},
            {text:$pub.prefix , dataIndex:'userSqlPrefix',width:340},
            {text:$userSql.useScope ,dataIndex:'tmp',width:200,renderer:function(v,c,row) {
                var sqlScope = row.get('sqlScope');
                if(sqlScope === 'all') {
                    return $userSql.allDB;
                }else if(sqlScope === 'instance') {
                    return $pub.instance + '：' + row.get('userInstance');
                }else if(sqlScope === 'db') {
                    return $pub.db + '：' + row.get('dbName') + "（" + row.get('userInstance') + "）";
                }
            }},
            {text : $pub.option,width:80,renderer:function(v,c,row) {
                return '<a href="javascript:editUserSQL()">' + $pub.edit + ' </a> <a href="javascript:deleteUserSQL()">' + $pub.delete + '</a>'
            }}
        ],
        listeners:{
            itemdblclick:function(thiz,record) {
                var id = record.get("id");
                userSQLWindow.getEl().mask($pub.loading);
                ajax({
                    url:'/userConfig/getUserSQLContentById.do',
                    onlyUrl:true,
                    params:{id:id},
                    success:function(resp) {
                        userSQLWindow.getEl().unmask();
                        var json = jsonDecode(resp.responseText);
                        if(json.success) {
                            addSQLValueForSelection(json.root);
                            win.close();
                        }else {
                            Ext.Msg.alert($pub.prompt , json.root);
                        }
                    },
                    failure:function() {userSQLWindow.getEl().unmask()}
                });
            }
        }
    });
    var win = userSQLWindow = new IDB.Window({
        title:$sqlWindow.menu.manageMySQL,height:400,width:790,
        items:[grid],
        buttons:[{
            text:$pub.new,handler:function() {
                saveUserSQL('add',function() {
                    grid.store.load();
                });
            }
        },{
            text:$pub.close , handler:function() {win.close()}
        }]
    });
};
var saveUserSQL = function(option,fn,editRecord,editSql) {
    var sqlText = getSql();
    // set support user sql option
    var isOnUserSQL = true ;
    if('off' === supportUserSQLS) {
    	isOnUserSQL = false;
    }
    var nowDB = {name:'sqlScope',inputValue:'db',boxLabel:$userSql.nowDB};
    var items = [];
    if(isOnUserSQL) {
    	items = [
             {name:'sqlScope',inputValue:'all',boxLabel:$userSql.allDB,checked:true},
             {name:'sqlScope',inputValue:'instance',boxLabel:$pub.nowInstance},
             nowDB
    	];
    }else {
    	items = [
                 {name:'sqlScope',inputValue:'instance',boxLabel:$pub.nowInstance,checked:true},
                 nowDB
        	];
    }
    var form = new IDB.FormPanel({
        defaults:{
            bodyPadding:5,
            padding:'0 5 0 5',
            autoFitErrors:false,//自动调整错误提示时候的宽度
            labelSeparator:' : ',
            labelWidth:80,
            width:550,
            labelAlign:'right',
            xtype:'textfield',
            allowBlank:false
        },
        items:[{
            xtype:'hiddenfield',
            name:'id'
        },{
            fieldLabel:$pub.title,
            name:'sqlTitle',
            id:'sqlTitle',
            maxLength:128,
            value:userPreTitle
        },{
            xtype:'radiogroup',
            fieldLabel:$userSql.useScope,
            columns:3,
            items:items
        },{
            xtype:'textarea',
            name:'userSql',
            fieldLabel:'SQL',
            height:270,
            value:sqlText
        }]
    });
    var saveUrl =  ((option === 'edit') ? '/userConfig/editUserSQL.do' : '/userConfig/addUserSQL.do');
    var optionText = ((option === 'edit') ? $pub.edit : $pub.add);
    if(editRecord) {
        form.loadRecord(editRecord);
        form.getForm().findField('sqlTitle').setValue(Ext.util.Format.htmlDecode(editRecord.get('sqlTitle')));
        form.getForm().findField('userSql').setValue(editSql);
    }
    var win = new IDB.Window({
        height:420,width:600,title:optionText + $sqlWindow.menu.mySQL ,items:[form],
        buttons:[{
            text:optionText,handler:function() {
                if(form.isValid()) {
                    var values = form.getValues();
                    values.dbName = nowDBName;
                    win.getEl().mask($userSql.msg.savingSQL);
                    ajax({
                        url:saveUrl,
                        onlyUrl:true,
                        params:values,
                        success:function(resp) {
                            win.getEl().unmask();
                            var json = jsonDecode(resp.responseText);
                            if(json.success) {
                                Ext.Msg.alert($pub.prompt , $pub.saveSuccess);
                                if(fn) {
                                    fn.call(this);
                                }
                                win.close();
                            }else {
                                Ext.Msg.alert($pub.error , json.root);
                            }
                        },
                        failure:function(resp) {
                            win.getEl().unmask();
                        }
                    });
                }
            }
        },{
            text : $pub.close,handler:function() {
                userPreTitle = Ext.getCmp('sqlTitle').getValue() || userPreTitle;
                win.close();
            }
        }]
    });
    Ext.getCmp('sqlTitle').focus(false , 100);
};
var addSQLValueForSelection = function(addSql,execute) {
    addSql = Ext.String.trim(addSql);
    if(addSql.charAt(addSql.length - 1) !== ';') {
        addSql += ';';
    }
    var sqlArea = Ext.getCmp('tx_sql');
    var oldValue = sqlArea.getValue();
    var beforeLines = sqlArea.editor.lineCount();
    sqlArea.setValue(oldValue + "\n" + addSql + "\n");
    var endLines = sqlArea.editor.lineCount();
    var lastLength = sqlArea.editor.getLine(endLines - 1).length;
    focusInput();
    sqlArea.editor.setSelection({line:beforeLines,ch:0} , {line:(endLines - 1),ch:lastLength});
    if(execute) {
        executeSQL();
    }
};
/************user sql end******************/
var nowMsgContent = '';
var addMsgPanelContent = function(content) {
    if(!nowMsgContent) {
        nowMsgContent = content;
    }else {
        nowMsgContent += "\n\n\n\n" + content;
    }
    var dom = Ext.getCmp('execute_msg_area').el.dom;
    dom.innerHTML = '<pre>' + nowMsgContent + '</pre>';
    dom.scrollTop = dom.scrollHeight;
};
var clearMsgPanelContent = function() {
    nowMsgContent = '';
    var dom = Ext.getCmp('execute_msg_area').el.dom;
    dom.innerHTML = '';
};
var clearTabPanelResult = function() {
    var items = resultTabPanel.items;
    if(items.length > 1) {
        for(var i = items.length - 1 ; i > 0 ; i--) {
            resultTabPanel.remove(i,true);
        }
    }
};

//执行
var executeSQL = function() {
    var sqlText = Ext.String.trim(getSql());
    if (sqlText === "") {
        Ext.MessageBox.alert($pub.prompt, $sqlWindow.msg.inputSQL);
        return;
    }
    g_result_index = 0;
    resultWarning = false;
    isCancel = false;
    clearTabPanelResult();
    clearMsgPanelContent();
    Ext.getBody().mask($sqlWindow.msg.splittingSQL);
    ajax({
        url:'/data/splitSQL.do',
        params:{sqlText:sqlText},
        success:function(resp) {
            Ext.getBody().unmask();
            var json = jsonDecode(resp.responseText);
            if(json.success) {
                var data = json.root;
                var sqlArray  = data.sqlList;
                var timeDelay = data.timeDelay;
                addMsgPanelContent('\n\n' + $sqlWindow.msg.splitSQLEnd +'（' + sqlArray.length + " rows），" + $sqlWindow.msg.splitTimeDelay +"（" + timeDelay + "ms.）");
                executeSQLDoing(sqlArray , 0);
            }else {
                Ext.Msg.alert($pub.prompt , json.root);
            }
        },
        failure:function(resp) {
            Ext.getBody().unmask();
            Ext.Msg.alert($pub.prompt , resp.responseText);
        }
    });
};
var trySetTabPanelToResult = function() {
    var items = resultTabPanel.items;
    if(items.length > 1) {
        resultTabPanel.setActiveTab(1);
    }
};
var resultWarning = false;
function showResult(sql , result) {
    var resultType = result['resultType'];
    if(resultType === 'tooManyResult' || result['displayColumns'].length < 1) {
        resultWarning = true;
    }else{
    	showResultSet(result , sql , resultType);
    }
}
function isNewRecord(grid, record) {
	var newRecords = grid.store.getNewRecords();
	return (newRecords && newRecords.indexOf(record) !== -1);
}
function rendererResultValue(value, meta, record, rowIndex, colIndex, store, view, result_index) {
	var columnName = 'COLUMN_' + colIndex;
    var grid = Ext.getCmp('result_' + result_index);
    var metaData = grid.metadata[colIndex - 1];
    var v_primaryKeys = grid.editTablePrimaryKeys;
    var metaDataType = metaData['dataType'];

    if (!isNull(value) && (record.raw.hasOwnProperty(columnName) || record.data[columnName] !== '')) {
        if(v_primaryKeys && v_primaryKeys.length > 0 && metaDataType.indexOf('BLOB') !== -1 && !isNewRecord(grid, record)) {
            return value + "<br/><a href='javascript:row_fun.downloadBlob("+ result_index + "," + colIndex  +")'>" + $pub.download + "</a>" +
                " <a href='javascript:row_fun.uploadBlob("+ result_index + "," + colIndex + ")'>" + $pub.upload + "</a>";
        }
        return encodeValue(value, meta, record);
    } else {
        if(v_primaryKeys && v_primaryKeys.length > 0 && metaDataType.indexOf('BLOB') !== -1 && !isNewRecord(grid, record)) {
            return '<i style=\"color:#E5E5E5;\">null</i>' + "<br/>" +
                " <a href='javascript:row_fun.uploadBlob("+ result_index + "," + colIndex + ")'>" + $pub.upload + "</a>";
        }
        // NULL值背景显示白灰色
        return '<i style=\"color:#E5E5E5;\">null</i>';
    }
}
var row_fun = {
	checkPrimaryKeys: function(gridResult, optionName) {
		var v_primaryKeys = gridResult.editTablePrimaryKeys;
		if (v_primaryKeys.length > 0) {
			return true;
		}
		Ext.Msg.alert($pub.prompt, $sqlWindow.msg.noPrimaryOption + '：【' + optionName + '】。');
		return false;
	},
	getRowValue: function(gridResult, key, row) {
		var realColumnName = grid_fun.findGridColumnNameByDBColumnName(gridResult, key);
		var modified = row.modified;
		return modified[realColumnName] || row.get(realColumnName);
	},
	downloadBlob: function(result_index, colIndex) {
		var gridResult = Ext.getCmp('result_' + result_index);
		var v_primaryKeys = gridResult.editTablePrimaryKeys;
        var metaData = gridResult.metadata[colIndex - 1];
        var metaDataColumnName = metaData['realName'];
        var selectedRows = gridResult.getSelectionModel().getSelection();
        if(selectedRows && selectedRows.length > 0 && row_fun.checkPrimaryKeys(gridResult, $pub.download + '[BLOB]')) {
            var v_primaryKeyValues = [] , selectedRow = selectedRows[0];
            Ext.each(v_primaryKeys , function(key) {
                v_primaryKeyValues.push(row_fun.getRowValue(gridResult, key , selectedRows[0]));
            });
            Ext.getBody().mask($pub.exporting);
            ajax({
                url:'/data/queryTable/exportBlob.do',
                timeout:(15 * 60 * 1000),
                params:{
                    dbName:metaData.dbName ,
                    tableName:metaData.tableName ,
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
	uploadBlob:function(result_index, colIndex) {
		var gridResult = Ext.getCmp('result_' + result_index);
        var metaData = gridResult.metadata[colIndex - 1];
        var metaDataColumnName = metaData['realName'];
        var selectedRows = gridResult.getSelectionModel().getSelection();
        if(selectedRows && selectedRows.length > 0 && row_fun.checkPrimaryKeys(gridResult, $pub.upload + '[BLOB]')) {
            var items = [
                {
                    xtype:'filefield',
                    name:'file',
                    fieldLabel : $pub.attachment,
                    blankText : $sqlWindow.msg.noAttachment,
                    buttonText : $pub.selectFile
                },
                {name:'dbName',hidden:true,value:metaData.dbName},
                {name:'tableName',hidden:true,value:metaData.tableName},
                {name:'columnName',hidden:true,value:metaDataColumnName}
            ];
            var v_primaryKeys = gridResult.editTablePrimaryKeys;
            Ext.each(v_primaryKeys , function(key) {
                items.push(
                    {name:'primaryKeys',hidden:true,value:key},
                    {name:'primaryKeyValues',hidden:true,value:row_fun.getRowValue(gridResult, key ,selectedRows[0])}
                );
            });

            var form = new IDB.FormPanel({
                defaults:{width:540,margin: '5 2 2 0',columnWidth:1},
                fileUpload:true,
                layout:'column',
                items:items
            });
            var win = new IDB.Window({
                width:520 , height:115 , title : $pub.uploadFile,
                items:[form],
                buttons:[
                    {
                        text : $pub.upload , handler:function() {
                        if(form.isValid()) {
                            form.getForm().submit({
                                waitMsg: $pub.importing,
                                timeout:10 * 60 * 1000,
                                url:'/data/sqlWindow/importBlob.do?token=' + getUserToken(),
                                success:function(fp,o) {
                                    var json = o.result;
                                    if(json.success) {
                                        selectedRows[0].set(grid_fun.findGridColumnNameByDBColumnName(gridResult, metaDataColumnName) , '[BLOB]');
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
}
var grid_fun = {
	findGridColumnNameByDBColumnName: function(gridResult, dbColumnName) {
		var find = false, findColumnName = null;
		Ext.each(gridResult.metadata, function(meta) {
			if (!find && meta['realName'] === dbColumnName) {
				findColumnName = meta['name'];
				find = true;
			}
		});
		return findColumnName;
	}
};
function rendererRowResultValue(value, meta, record, rowIndex, colIndex) {
    if (!isNull(value)) {
        return encodeValue(value, meta, record);
    } else {
        // NULL值背景显示白灰色
        return '<i style=\"color:#E5E5E5;\">null</i>';
    }
}
function showResultSet(result , sql , resultType) {
    var res_index = ++g_result_index;
    for (var i = 1; i < result.displayColumns.length; i++) {
        result.displayColumns[i].renderer = function(value, meta, record, rowIndex, colIndex,store,view) {
            return rendererResultValue(value, meta, record, rowIndex, colIndex,store,view , res_index);
        };
    }
    resetDisplayColumns(result);
    var store = Ext.create('Ext.data.Store', {
        fields:result.metadata
    });
    var cellEditor = Ext.create('Ext.grid.plugin.CellEditing', {
        clicksToEdit:1
    });
    var grid = Ext.create('Ext.grid.Panel' , {
        title:$pub.result + "(" + res_index + ")",
        id:'result_' + res_index,
        itemId:'result_' + res_index,
        sortableColumns:false,
        multiSelect:true,
        tabConfig:{
            tooltip:"SQL:" + sql.htmlEncode()
        },
        store:store,
        viewConfig:{ stripeRows:true, enableTextSelection:true},
        columns:result.displayColumns,
        plugins:[
            cellEditor
        ],
        tbar:getResultActionBar(resultType , result , {result_index:res_index , cellEditor:cellEditor}),
        bbar:getResultBBar(resultType , result , {result_index:res_index , cellEditor:cellEditor}),
        listeners:{
            afterrender:function() {
                moveRowResult("first" , grid);
                if(result['canEdit'] && !grid.columnEditor) {
                    setColumnEditor(grid);
                    grid.columnEditor = true;
                }
            }
        },
        displayEdit:function() {

        }
    });
    grid.result_index = res_index;
    grid.now_page_index = 1;
    grid.now_page_size = 100;
    grid.sql = sql;
    grid.dbName = nowDBName;
    grid.metadata = result.metadata;
    if(result['canEdit']) {
        grid.editTablePrimaryKeys = result.editTablePrimaryKeys;
        grid.editTableName = result.editTableName;
        grid.editDbName = result.editDbName;
    }
    grid.columnEditor = false;
    store.loadRawData(result.data, true);
    resultTabPanel.add(grid);
}
var executeSQLDoing = function(sqlArray , index) {
    if(index >= sqlArray.length) {
        addMsgPanelContent("");
        if(!resultWarning) {
            trySetTabPanelToResult();
        }
        return;
    }
    var sql = sqlArray[index];
    //console.log(sql);
    var newDBName = nowDBName;
    if (sql.slice(0, 3).toLowerCase() === 'use') {
        newDBName = cleanSql(sql.slice(3)).toLowerCase();
    }

    cancelWindow.items.get(0).setText($pub.executingSQL + "：<br/><br/>" + sql.htmlEncode(), false);
    cancelWindow.show();
    var realSQL = sql;//.htmlDecode();
    wsAjax({
        timeout:3600000 * 24,
        url:baseUrl + 'multiExecute.do',
        params:{panelKey:getPaneKey(), dbName:nowDBName, sql:realSQL , pageIndex:1 , pageSize:100 , resultIndex:g_result_index},
        success:function(resp) {
            var json = jsonDecode(resp.responseText);
            var panelMsg;
            if(json.success) {
                if(newDBName && newDBName !== nowDBName) {
                    dbList.setValue(newDBName.replaceAll('`','').replaceAll('"',''));
                    nowDBName = dbList.getValue();
                }
                panelMsg = json.root['msg'];
                showResult(sql ,json.root);
                addMsgPanelContent("【" + $pub.executeSQL + "：(" + (index + 1) + ")】\n\n<span style='font-size: 12px;font-weight: bold;'>" + sql.htmlEncode() + "</span>\n\n" + panelMsg);
                cancelWindow.hide();

                if(!isCancel) {
                	executeSQLDoing(sqlArray , index + 1);
                }
            }else {
                var msg = $sqlWindow.msg.executeFailure + "：<br/>" + sql.htmlEncode() + "<br/><br/>" + $pub.failReason +"：" + json.root;
                panelMsg = $pub.executeFailure + "，" + $pub.failReason +"：" + json.root;
                addMsgPanelContent("【" + $pub.executeSQL + "：(" + (index + 1) + ")】\n\n<span style='font-size: 12px;font-weight: bold;'>" + sql.htmlEncode() + "</span>\n\n" + panelMsg);
                cancelWindow.hide();

                if(index < sqlArray.length - 1) {
                     msg += "<br/><br/>" + $sqlWindow.msg.continueExecute;
                     Ext.Msg.confirm($pub.error , msg , function(v) {
                         if(v === 'yes') {
                        	 isCancel = false;
                        	 executeSQLDoing(sqlArray , index + 1);
                         }
                     });
                }else {
                    Ext.Msg.alert($pub.error , msg);
                }
            }
        },
        failure:function(resp) {
        	 cancelWindow.hide();
            Ext.Msg.alert(resp.responseText);
        }
    });
};


var resetDisplayColumns = function(result) {
    for (var rec in result.data) {
        for (var key in result.data[rec]) {
            var value = result.data[rec][key];
            if ((key.substr(0, 7) === "COLUMN_") && (typeof value === 'string')) {
                var newWidth = value.byteLength() * 10;
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
    for (var i = 1; i < result.displayColumns.length; i ++) {
    	result.displayColumns[i].text = result.displayColumns[i].text.htmlEncode();
    }
};
function getResultActionBar(resultType,result,initConfig) {
    var barConfig = [{
        text:$pub.rowDetail , handler:function() {
            showRowContent(initConfig.result_index);
        }
    }];
    var _result_index = initConfig.result_index;
    var cellEditor = initConfig.cellEditor;
    if(result['canEdit']) {
        barConfig.push({
            text : $pub.new , iconCls:'add',id:'add_icon_' + _result_index,handler:function() {
                cellEditor.completeEdit();
                addRecord(_result_index);
            }
        },{
            text : $pub.delete , iconCls:'delete',id:'del_icon_' + _result_index,handler:function() {
                cellEditor.completeEdit();
                deleteRecord(_result_index);
            }
        },{
            text : $pub.submitChange , iconCls:'accept',id:'accept_icon_' + _result_index,handler:function() {
                cellEditor.completeEdit();
                showEditDataSql(_result_index);
            }
        });
    }

    //查询
    if(isQuery(result['sqlType'])) {
        barConfig.push({
                text:$pub.exportData,
                id:'bn_export_' + _result_index,
                iconCls:'export',
                hidden:isLimitAllExport,
                disabled:!isQuery(result['sqlType']),
                menu:[
                    {
                        text:$pub.exportMoreData,
                        hidden:(SQL_EXPORT_MORE === 'OFF'),
                        handler:function() {
                        exportMoreData(_result_index);
                    }
                    },{
                        text:$pub.exportCSV +'（' + $pub.most + EXPORT_MAX_ROWS_NAME + '）',
                        handler:function () {
                            exportResult('csv',_result_index);
                        }
                    },
                    {
                        text: $pub.exportSQL + '（' + $pub.most + EXPORT_MAX_ROWS_NAME +  '）',
                        handler:function () {
                            exportResult('sql',_result_index);
                        }
                    }
                ]
            },
            {
                text:$pub.exportData , hidden:!isLimitExportUrl,
                menu:[{
                    text : $export.msg.limit , handler:function() {
                        window.parent.onbeforeunload = null;
                        window.parent.location = limitExportUrl;
                    }
                }]
            }
        );
        var tmpEditDbName = result['editDbName'];
        var tmpEditTableName = result['editTableName'];
        var isEmptyResult = result['data']['length'] === 0;
        var isValidDbTable = tmpEditDbName && tmpEditTableName;
        var isSystemDB = ['information_schema' , 'performance_schema' , 'mysql' , 'sys'].contains(tmpEditDbName);
        if (isEmptyResult && isValidDbTable && !isSystemDB) {
            barConfig.push(
                {
                    text : $buildData.title, id:'gen_icon_' + _result_index, tooltip: $pub.nowTable + '[' + tmpEditTableName + ']' + $buildData.guide, iconCls:'datagen', handler:function() {
                        var result = window.parent.console_panel.addUrlPanel("/data/generate/generateBase.do", 'generate_base_view', 'generate', 'generate', tmpEditDbName,
                            jsonToString({tableName: tmpEditTableName, dbName: tmpEditDbName}));
                        if (result && result.old) {
                            var iframe = window.parent.document.getElementById(result.old + "_iframe");
                            iframe.contentWindow.GenerateListPanel.addTableJob({tableName: tmpEditTableName, dbName: tmpEditDbName}, null);
                        }
                    }
                }
            );
        } else {
            barConfig.push(
                {
                    text : $bi.button.create, hidden:!biApiStart, id:'rpt_icon_' + _result_index,
                    tooltip:$bi.button.createTip, iconCls:'quickbi', handler:function() {
                        generateReport(_result_index);
                    }
                }
            );
        }
    }
    if(resultType !== 'metadata') {
        if(result['canEdit']) {
            barConfig.push({
                xtype:'label',
                text:'【' + $sqlWindow.status.canEditData +'】'
            });
        }else {
            barConfig.push({
                xtype:'label',
                text:'【' + $sqlWindow.status.canNotEditData + '】：' + result['canNotEditReason']
            });
        }
    }
    return barConfig;
}
function getResultBBar(resultType,result,initConfig) {
	var _result_index = initConfig.result_index;
    var barConfig = [];
    if(resultType === 'metadata') {
        barConfig.push('【' + $sqlWindow.msg.base + '】：' +  $sqlWindow.msg.metadata);
    }else {
        var cellEditor = initConfig.cellEditor;
        var pageSizeStore = new Ext.data.Store({
            fields:['data'],
            data:pageSizeArray,
            proxy: {
                type: 'memory'
            }
        });
        barConfig.push({
            iconCls:'page_first' , toolTip:$pub.firstPage , handler:function() {
                if(setFirstPage(initConfig.result_index)) {
                    getPageResult(initConfig.result_index);
                }
            }
        },{
            iconCls:'page_prev' , toolTip : $pub.prePage , handler:function() {
                if(nextPage(-1 , initConfig.result_index)) {
                    getPageResult(initConfig.result_index);
                }
            }
        },$pub.currentPage + "：",{
            xtype:'numberfield',
            allowDecimals:false,
            id:'page_num_' + initConfig.result_index,
            width:50,
            minValue:1,
            value:1,
            negativeText : $pub.noNegative,
            nanText : $pub.invalidNumber
        },{
            text:'GO',handler:function() {
                var grid = Ext.getCmp('result_' + initConfig.result_index);
                var pageNum = Ext.getCmp('page_num_' + initConfig.result_index);
                if(!pageNum.isValid()) {
                    pageNum.setValue(grid.now_page_index);
                }
                getPageResult(initConfig.result_index);
            }
        },{
            iconCls:'page_next' , toolTip:$pub.nextPage , handler:function() {
                if(nextPage(1 , initConfig.result_index)) {
                    getPageResult(initConfig.result_index);
                }
            }
        }, $pub.perPage + '：',
            {
                xtype:'combo',
                id:'page_size_' + initConfig.result_index,
                triggerAction:'all',
                displayField:'data',
                valueField:'data',
                queryMode:'local',
                forceSelection:false,
                editable:false,
                width:65,
                typeAhead:true,
                value:100,
                store:pageSizeStore,
                allowBlank:false,
                listeners:{
                    select:function() {
                        getPageResult(initConfig.result_index);
                    }
                }
            },'-');

        //能否编辑时，消息显示的是不一样的
        barConfig.push({
            xtype:'label',
            id:'result_msg_' + initConfig.result_index,
            text:"【" + $sqlWindow.msg.base + "】：" + result['msg']
        });
    }
    return barConfig;
}
function moveRowResult(option,grid) {
    var selectionModel = grid.getSelectionModel();
    if (option === 'first') {
        selectionModel.select(0);
    } else if (option === 'last') {
        selectionModel.select(grid.store.getCount() - 1);
    } else if (option === 'previous') {
        selectionModel.select(grid.store.indexOf(selectionModel.lastSelected) - 1);
    } else if (option === 'next') {
        selectionModel.select(grid.store.indexOf(selectionModel.lastSelected) + 1);
    }
}
function getPageResult(result_index) {
    var grid = Ext.getCmp('result_' + result_index);
    var pageNum = Ext.getCmp('page_num_' + result_index);
    var pageSize = Ext.getCmp("page_size_" + result_index);
    var page_num = pageNum.getValue();
    var page_size = pageSize.getValue();

    Ext.getBody().mask($sqlWindow.page.getting + '（' + page_num + "）" + $sqlWindow.page.pageData + "<br/><br/>" + grid.sql.htmlEncode());
    ajax({
        url: '/data/executePage.do',
        params:{sql:grid.sql, dbName:grid.editDbName , pageIndex:page_num , pageSize:page_size , resultIndex:result_index},
        success:function(resp) {
            Ext.getBody().unmask();
            var json = jsonDecode(resp.responseText);
            var panelMsg;
            if(json.success) {
                grid.now_page_index = page_num;
                grid.now_page_size = page_size;
                panelMsg = json.root['msg'];
                showPageResult(json.root , grid , page_num , page_size);
            }else {
                pageNum.setValue(grid.now_page_index);
                pageSize.setValue(grid.now_page_size);
                panelMsg = $pub.executeFailure + "，" + $pub.failReason + "：" + json.root;
                Ext.Msg.alert($pub.error , json.root);
            }
            Ext.getCmp('result_msg_' + result_index).setText(panelMsg);
            addMsgPanelContent("【" + $sqlWindow.page.get +"（" + grid.now_page_index +"）" + $sqlWindow.page.pageData +"】\n\n<span style='font-size: 12px;font-weight: bold;'>" + grid.sql + "</span>\n\n" + panelMsg);
        },
        failure:function(resp) {
            Ext.getBody().unmask();
            Ext.Msg.alert($pub.prompt , resp.responseText);
        }
    });
}
function showPageResult(result , grid , page_num , page_size) {
    var startIndex = (page_num - 1) * page_size;
    result.displayColumns[0].renderer = function (value, metadata, record, rowIndex) {
        return rowIndex + 1 + startIndex;
    };
    for (var i = 1; i < result.displayColumns.length; i ++) {
    	result.displayColumns[i].renderer = function(value, meta, record, rowIndex, colIndex, store, view) {
    		return rendererResultValue(value, meta, record, rowIndex, colIndex, store, view, g_result_index);
    	}
    }
    resetDisplayColumns(result);
    var store = Ext.create('Ext.data.Store', {
        fields:grid.metadata
    });
    grid.reconfigure(store , result.displayColumns);
    store.loadRawData(result.data, true);
    var length = String(startIndex + 100).length;
    grid.getView().getHeaderCt(1).getHeaderAtIndex(0).setWidth(length * 10 + 8);
    moveRowResult("first" , grid);
    if(grid.editTableName) {
        setColumnEditor(grid);
        edit_option_fun.enableEditIcons(grid.result_index);
    }
}

//消息 tab输出框
var createResultMessagePanel = function() {
    return new Ext.tab.Panel({
        region:'center',
        tabPosition:'top',
        activeTab:0,
        items:[
            {
                title: $sqlWindow.msg.base,
                xtype:'container',
                border:false,
                autoScroll:true,
                baseCls:'execute_msg_content',
                id:'execute_msg_area'
            }
        ],
        listeners:{
            beforerender: function(thiz, eOpts ) {
                if (dsqlStart && (nowEnv == 'DMS_RDS' || nowEnv == 'DMS_BUC' || nowEnv == 'DMS_NET' || nowEnv == 'DMS_ECS')) {
                    var bar = thiz.getTabBar();
                    bar.html = '<div id="linkTip" style="float: right;"></div><div style="float: right;margin-right: 15px;margin-top: 7px;"><a href="javascript:openDSql()" style="color: #0066CC">' +
                        $dsql.link.dsqlLink + '</a></div>';
                }
            },
            afterrender: function(thiz, eOpts ) {
                if (dsqlStart && (nowEnv == 'DMS_RDS' || nowEnv == 'DMS_BUC' || nowEnv == 'DMS_NET' || nowEnv == 'DMS_ECS')) {
                    var hideTips = SimpleStorageUtils.get(dblinkNoTipsKey) == '1';
                    if (!hideTips) {
                        dblinkTips = Ext.create('Ext.tip.ToolTip', {
                            target: 'linkTip',
                            anchor: 'bottom',
                            width: 200,
                            anchorOffset: 50,
                            closable: true,
                            autoHide: false,
                            autoDestroy: false,
                            style: 'background-color: #73777A;',
                            html: '<span style="color: #FFFFFF;letter-spacing: 1px;line-height:14pt;font-size: 14px;">' + $dsql.msg.tipsMsg + '</span><br/><br/>' +
                            '<input id="notipsCheckbox" type="checkbox" onclick="dsqlNoTips()"/><span style="color: #FFFFFF;letter-spacing: 1px;"> ' + $dsql.msg.notips + '</span>'
                        });
                    }
                }
            }
        }
    });
};

Ext.onReady(function () {
    init();
});
if(window.parent) {
    parentPanelKey = window.parent.getPaneKey();
}
//初始化DB列表
var initDBList = function() {
    dbList = new IDB.CommonBox({
        width:165,
        loadSelectFirst:true,
        url:'/system/showDataBases.do?panelKey=' + (parentPanelKey || getPaneKey()),
        loadCallBack:function (combo) {
            if (nowDBName) {
                if(dbList.store.find('data' , nowDBName) !== -1) {
                    dbList.setValue(nowDBName);
                }else {
                    dbList.selectFirst();
                    nowDBName = combo.getValue();
                }
            } else {
                nowDBName = combo.getValue();
            }
        },
        selectCallBack:function (combo) {
            nowDBName = combo.getValue();
            updateTableOptionsObject(nowDBName);
        },
        listConfig:{
            getInnerTpl:function () {
                return '<div title="{data}">{data}</div>';
            }
        }
    });
};

function setTableOptionsObject(comboValue) {
	var tmpNowDBName = comboValue ? comboValue : nowDBName;
	ajax({//发送同步请求
		async:false,
		url:getTableColumnUrl(),
        params:{dbName:tmpNowDBName},
        success:function(resp) {
        	var json = jsonDecode(resp.responseText);
        	if (json.success) {
        		var jsonData = json.root;
        		var databaseData = jsonData.databases;
        		CM_NOW_DATABASE = tmpNowDBName;
        		var tableData = jsonData.tables;
        		var databaseResObj = {};
        		var tableResObj = {};
        		for (var i = 0; i < databaseData.length; i ++) {
        			databaseResObj[databaseData[i].databaseName] = null;
        		}
        		for (var i = 0; i < tableData.length; i ++) {
        			var tmpName = tableData[i].tableName;
        			var tmpComment = tableData[i].tableComment;
        			tableResObj[tmpName] = {"__cm__comment":tmpComment};
        		}
        		CM_TABLES = tableResObj;
        		databaseResObj[CM_NOW_DATABASE] = CM_TABLES;
        		CM_DATABASES = databaseResObj;
        		Ext.getCmp('tx_sql').editor.setOption('hintOptions', {databases:databaseResObj, tables:tableResObj});
        	}
        }
    });
};

function updateTableOptionsObject(comboValue) {
	var tmpNowDBName = comboValue ? comboValue : nowDBName;
	if (tmpNowDBName && CM_DATABASES.hasOwnProperty(tmpNowDBName)) {
		CM_NOW_DATABASE = tmpNowDBName;
		if (CM_DATABASES[CM_NOW_DATABASE]) {
			CM_TABLES = CM_DATABASES[CM_NOW_DATABASE];
		} else {
			ajax({
				async:false,
				url:getTableColumnUrl(),
				params:{type:"table_group", dbName:tmpNowDBName},
				success:function(resp) {
					var json = jsonDecode(resp.responseText);
					if (json.success) {
						var tableData = json.root;
						var tableResObj = {};
						for (var i = 0; i < tableData.length; i ++) {
							var tmpName = tableData[i].tableName;
							var tmpComment = tableData[i].tableComment;
							tableResObj[tmpName] = {"__cm__comment":tmpComment};
						}
						CM_TABLES = tableResObj;
						CM_DATABASES[CM_NOW_DATABASE] = CM_TABLES;
					}
				}
			});
		}
	}
}

function setUserPromptPrefer(newValue) {
	ajax({
		async:true,
		url:"/userConfig/saveUserPreferConfig.do?onlyUrl=true",
		params:{"inputSqlAutoComplete":newValue},
		success:function(resp) {}
	});
}

function dsqlNoTips() {
    var isChecked = $("#notipsCheckbox").is(':checked');
    if (isChecked) {
        SimpleStorageUtils.set(dblinkNoTipsKey, '1');
    } else {
        SimpleStorageUtils.remove(dblinkNoTipsKey);
    }
}

function openDSql() {
    if (dsqlConsoleNew && dsqlConsoleRedirectUrl != '') {
        window.open(dsqlConsoleRedirectUrl, '_blank');
    } else {
        parent.console_panel.addTmpURLPanel('/data/dsql-window.do', $main.menu.dSqlWindow, "dSqlWindow");
    }
}

function init() {
    Ext.QuickTips.init();
    initDBList();
    resultTabPanel = createResultMessagePanel();

    var containsTab = false;
    if(nowTableName) {
        //initSQL = "select * from `" + nowTableName.replaceAll("`" , "``") + "` limit 0,50";
        containsTab = true;
    }

    Ext.create('Ext.Viewport', {
        layout:{
            type:'border',
            padding:0
        },
        defaults:{
            split:true
        },
        items:[tabPanelTpl, {region:'center', layout:'border',
            items:[
                {
                    id:'pnl_top',
                    region:'north',
                    border:0,
                    layout:'fit',
                    split:true,
                    height:100,
                    minHeight:60,
                    tbar:[
                        {
                            text: $pub.execute + '(F8)',
                            id:'bn_Execute',
                            xtype:'button',
                            iconCls:'execute',
                            handler:function () {
                               executeSQL();
                            }
                        },
                        {
                            text:$diagnosis.sql,
                            iconCls:'tunning',
                            hidden:!performanceSQL,
                            handler:function() {
                                var sqlText = Ext.String.trim(getSql());
                                if (!sqlText) {
                                    return Ext.MessageBox.alert($pub.prompt, $sqlWindow.msg.inputSQL);
                                }
                                var tmpId = "perf_" + new Date().getTime();
                                var win = new IDB.Window({
                                    width:900,height:490,title:$diagnosis.sql,closable:true,
                                    html:getFrameHtmlWithId('/mysql/performance/to-performance-page.do?type=sql&token=' + getUserToken() , tmpId)
                                });
                                var time = new Date().getTime();
                                ajax({
                                    url:'/performance/call-sql-performance.do',
                                    params:{
                                        sqlText:sqlText,
                                        dbName:nowDBName
                                    },
                                    success:function(resp1) {
                                        var frame = document.getElementById(tmpId);
                                        var json = jsonDecode(resp1.responseText);
                                        if(json.success) {
                                            var time2 = new Date().getTime();
                                            if(time2 - time > 2000) {
                                                frame.src = json.root;
                                            }else {
                                                setTimeout(function() {
                                                    frame.src = json.root;
                                                } , (2000 - (time2 - time)));
                                            }
                                        } else {
                                            win.close();
                                            var errMsg = json.root.root;
                                            var whiteList = json.root.attributes.WhiteList;
                                            ajax({
                                                url:'/system/third/checkServiceWhiteList.do',
                                                onlyUrl: true,
                                                params:{
                                                    errMsg: errMsg,
                                                    whiteList: whiteList
                                                },
                                                success: function(resp2) {
                                                    var jsonRes = jsonDecode(resp2.responseText);
                                                    if (jsonRes.success) {
                                                        Ext.Msg.confirm($pub.prompt , $pub.canNotCloudDBABlankReason +  jsonRes.root, function(v) {
                                                            if(v === 'yes') {
                                                                ajax({
                                                                    url: '/system/third/setThirdWhiteList.do',
                                                                    onlyUrl: true,
                                                                    params: {whiteList: jsonRes.root},
                                                                    success: function(resp3) {
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
                        },
                        {
                            text: $pub.format,
                            xtype:'button',
                            iconCls:'format',
                            handler:function () {
                                formatSql();
                            }
                        },
                        {
                            text:$pub.plan,
                            xtype:'button',
                            iconCls:'format',
                            handler:function () {
                            	showSqlPlan();
                            }
                        },
                        {xtype:'label', text: $pub.db + '：'},
                        dbList,
                        {
                            iconCls:'fa fa-refresh',
                            handler:function () {
                                var selectValue = dbList.getValue();
                                dbList.store.load({callback:function (records, operation, success) {
                                    if (success) {
                                        dbList.setValue(selectValue);
                                    }
                                }});
                            }
                        },
                        {
                            text:$sqlWindow.menu.mySQL,
                            menu:new Ext.menu.Menu({
                                listeners:{
                                    beforeshow:function() {
                                        setChildMenu();
                                    }
                                },
                                items:[{
                                    text:$sqlWindow.menu.addMySQL , handler:function() {
                                        PayOptions.checkPay('USER_SQL' , function() {
                                            saveUserSQL('add' , '');
                                        });
                                    }
                                },{
                                    text:$sqlWindow.menu.selectMySQL , id:'checkUserSQL',hidden:true
                                },{
                                    text:$sqlWindow.menu.manageMySQL , handler:function() {
                                        PayOptions.checkPay('USER_SQL' , function() {
                                            manageUserSQL();
                                        });
                                    }
                                }]
                            })
                        },
                        {
                        	xtype:'checkboxfield',
                            id:'sqlPrompt',
                            boxLabel : $sqlWindow.title.autoTip,
                            checked: onlyInputPrompt,
                            listeners:{
                                change:function(thiz,newValue,oldValue) {
                                	onlyInputPrompt = newValue;
                                	setUserPromptPrefer(newValue);
                                }
                            }
                        }
                    ],
                    items:[
                        {
                            xtype:'codemirror',
                            id:'tx_sql',
                            name:'test',
                            border:0,
                            value:'SELECT * FROM ',
                            listeners:{
                                keyevent:function (o, event) {
                                    if (event.keyCode === 119 && event.type === 'keyup') {// F8
                                        executeSQL();
                                    } else if (event.keyCode === 120 && event.type === 'keyup') {// F9
                                        formatSql();
                                    }
                                },
                                resize:function (o, width, height, oldWidth, oldHeight, eOpts) {
                                }
                            }
                        }
                    ]
                },
                resultTabPanel
            ]
        }
        ]
    });
    if (useAutoCompletion) {//AutoComplete开关
    	setTableOptionsObject();//初始化表(AutoComplete)
    }
    initQuery();
    focusInput();
    var sqlTextTarget = new Ext.dd.DropTarget(Ext.getCmp('tx_sql').getEl(), {group:'sqlText'});

    /*
    if(containsTab) {
        executeSQL();
    }*/
    if (document.body.clientHeight > 600) {
        Ext.getCmp('pnl_top').setHeight(200);
    } else if (document.body.clientHeight > 500) {
        Ext.getCmp('pnl_top').setHeight(150);
    }
    var setSQLById = function(id) {
        Ext.getBody().mask($pub.loading);
        ajax({
            url:'/userConfig/getUserSQLContentById.do',
            onlyUrl:true,
            params:{id:id},
            success:function(resp) {
                Ext.getBody().unmask();
                var json = jsonDecode(resp.responseText);
                if(json.success) {
                    addSQLValueForSelection(json.root);
                }else {
                    Ext.Msg.alert($pub.error , json.root);
                }
            },
            failure:function() {Ext.getBody().unmask();Ext.Msg.alert($pub.prompt , $sqlWindow.msg.sqlLoadError);}
        })
    };
    var setChildMenu = function() {
        ajax({
            url:'/userConfig/getUserTopSQLTitles.do',
            onlyUrl:true,
            params:{dbName:nowDBName},
            success:function(resp) {
                var json = jsonDecode(resp.responseText);
                if(json.success) {
                    var items = [];
                    Ext.each(json.root , function(row) {
                        items.push({
                            text:row['sqlTitle'],handler:function() {
                                setSQLById(row.id);
                            }
                        }) ;
                    });
                    if(items.length > 0) {
                        Ext.getCmp('checkUserSQL').show();
                        Ext.getCmp('checkUserSQL').setMenu(new Ext.menu.Menu({
                            items:items
                        }));
                    }else {
                        Ext.getCmp('checkUserSQL').hide();
                        Ext.getCmp('checkUserSQL').setMenu(new Ext.menu.Menu({
                            items:[]
                        }));
                    }
                }
            }
        });
    };
    if (dblinkTips) {
        dblinkTips.showBy('linkTip','br-tr');
    }
}

function setColumnEditor(grid) {
    var dbName = grid.editDbName;
    var tableName = grid.editTableName;
    var fields = grid.store.model.getFields();
    var columns = grid.columnManager.getColumns();
    for (var i = 0; i < columns.length; i ++) {
        var column = columns[i];
        if (i > 0) {
            for (var j = 0; j < fields.length; j ++) {
                var field = fields[j];
                if (field.name === column.dataIndex) {
                    if (!field.readOnly && field.tableName === tableName && field.dbName === dbName) {
                        if (isNumberDataType(field.dataType) && !Ext.isIE) {
                            column.setEditor({xtype:'numberfield', decimalPrecision:20});
                        } else if (field.dataType === 'DATE') {
                            column.setEditor('idbdatefield');
                        } else if (field.dataType === 'DATETIME') {
                            column.setEditor('datetimefield');
                        } else if (field.dataType.indexOf('BLOB') >= 0) {
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

var nextPage = function(num , result_index) {
    var grid = Ext.getCmp('result_' + result_index);
    var pageNum = Ext.getCmp('page_num_' + result_index);
    var nowNum = 0;
    if(!pageNum.isValid()) {
        nowNum = grid.now_page_index + num;
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
var setFirstPage = function(result_index) {
    var grid = Ext.getCmp('result_' + result_index);
    var pageNum = Ext.getCmp('page_num_' + result_index);
    if(pageNum.isValid() && pageNum.getValue() === 1) {
        Ext.Msg.alert($pub.prompt , $sqlWindow.page.alreadyFirstPage);
        return false;
    }
    pageNum.setValue(1);
    return true;
};
var edit_option_fun = {
	    disableEditIcons:function(result_index) {
	        Ext.getCmp('add_icon_' + result_index).disable();
	        Ext.getCmp('del_icon_' + result_index).disable();
	        Ext.getCmp('accept_icon_' + result_index).disable();
	    },
	    enableEditIcons:function(result_index) {
	        Ext.getCmp('add_icon_' + result_index).enable();
	        Ext.getCmp('del_icon_' + result_index).enable();
	        Ext.getCmp('accept_icon_' + result_index).enable();
	    },
	    disableEditor:function(result_index) {
	        var grid = Ext.getCmp('result_' + result_index);
	        var columns = grid.columnManager.getColumns();
	        for (var i = 0; i < columns.length; i ++) {
	            var column = columns[i];
	            column.setEditor(null);
	        }
	    },
	    disableGridEdit:function(result_index) {
	        edit_option_fun.disableEditor(result_index);
	        edit_option_fun.disableEditIcons(result_index);
	    }
	};

var showRowContent = function(result_index) {
    var grid = Ext.getCmp('result_' + result_index);
    var dataStore = new Ext.data.Store({
        fields:["columnName", "columnValue", "dataType"]
    });
    var selectionRow = grid.getSelectionModel().getSelection()[0];
    if(!selectionRow) {
        return Ext.Msg.alert($pub.prompt , $pub.selectOneRowOption);
    }
    var setStoreData = function() {
        selectionRow = grid.getSelectionModel().getSelection()[0];
        dataStore.removeAll();
        for (var i = 0; i < selectionRow.fields.items.length; i ++) {
            var field = selectionRow.fields.items[i];
            if (field.name.substr(0, 7) === "COLUMN_") {
                dataStore.add({
                    columnName:field.label,
                    columnValue:selectionRow.data[field.name],
                    dataType:getDataTypeStr(field.dataType, field.size)
                });
            }
        }
        updateRowResultStatus();
    };
    var contentGrid = new Ext.grid.Panel({
        store:dataStore,
        region:'center',
        sortableColumns:false,
        deferRowRender:false,
        viewConfig:{ stripeRows:true, enableTextSelection:true},
        columns:[
            Ext.create('Ext.grid.RowNumberer', {width:40}),
            {text:$pub.columnName, dataIndex:"columnName", width:200},
            {text:$pub.value, dataIndex:"columnValue", width:500, renderer:rendererRowResultValue},
            {text:$pub.type, dataIndex:"dataType", width:200}
        ]
    });
    var win = new IDB.Window({
        title:$pub.rowDetail,
        items:[contentGrid],
        width:964,
        height:420,
        maximizable:true,
        closable:true,
        buttons:[{
            text:$pub.firstRow,
            id:'bn_moveFirstRow',
            disabled:true,
            handler:function () {
                moveRowResult('first' , grid);
                setStoreData();
            }
        },{
            text:$pub.preRow,id:'bn_movePreviousRow',handler:function() {
                moveRowResult('previous' , grid);
                setStoreData();
            }
        },{
            text:$pub.nextRow,id:'bn_moveNextRow',handler:function() {
                moveRowResult('next' , grid);
                setStoreData();
            }
        },{
            text:$pub.lastRow,id:'bn_moveLastRow',handler:function() {
                moveRowResult('last' , grid);
                setStoreData();
            }
        }]
    });
    function updateRowResultStatus() {
        var selection = grid.getSelectionModel().getSelection()[0];
        if (selection) {
            var selectionId = grid.getStore().indexOf(selection);
            var isFirst = (selectionId <= 0);
            var isLast = (selectionId >= grid.store.getCount() - 1);
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
function addRecord(result_index) {
    var grid = Ext.getCmp('result_' + result_index);
    var fields = grid.store.model.getFields();
    var newRecord = grid.store.add({'__new':1})[0];// 在最后一个位置插入
    grid.getView().scrollBy(0, 10000000);
    grid.getView().refresh();
    grid.getSelectionModel().select(grid.store.getCount() - 1);
    //设置默认值
    for (var i = 0; i < fields.length; i++) {
        if (grid.editTableName === fields[i].tableName && grid.editDbName === fields[i].dbName) {
            var columnName = fields[i].realName;
            var defaultValue = getColumnDefaultValue(columnName , grid);
            if (defaultValue !== undefined) {
                newRecord.set(fields[i].name, defaultValue);
            }
        }
    }
}
function getDataTypeStr(dataType, size) {
    dataType = dataType + '(' + size + ')';
    return dataType.toLowerCase();
}
function getColumnDefaultValue(columnName,grid) {
	return "";

}
function deleteRecord(result_index) {
    var grid = Ext.getCmp('result_' + result_index);
    var selection = grid.getSelectionModel().getSelection();
    if (selection.length <= 0) {
        Ext.MessageBox.alert($pub.prompt, $pub.selectOneRowOption);
        return;
    }
    for (var i = 0; i < selection.length; i++) {
        grid.store.remove(selection[i]);
    }
}
function generateReport(result_index) {
    var grid = Ext.getCmp('result_' + result_index);
    var sql = grid.sql;
    var metadata = grid.metadata;
    var blobFlag = false;
    var columnArray = [];
    for (var i = 0; i < metadata.length; i ++) {
        var field = metadata[i];
        var metaDataType = field['dataType'];
        if (metaDataType.indexOf('BLOB') !== -1) {
            blobFlag = true;
        } else {
            columnArray[i] = {
                name: field.label,
                type: metaDataType
            };
        }
    }
    if (!sql || !columnArray || columnArray.length < 2) {
        return Ext.Msg.alert($pub.prompt, $sqlWindow.msg.towColumnsNotBLOB);
    }
    ajax({
        url:'/data/biReport/createBIReport.do',
        params:{dbName: grid.dbName},
        success:function(resp) {
            var json = jsonDecode(resp.responseText);
            if(json.success) {
                var data = json.root;
                var form = new Ext.form.Panel({
                    items: [{
                        xtype: "textfield",
                        name: 'sql',
                        value: encodeURIComponent(sql)
                    }, {
                        xtype: "textfield",
                        name: 'columns',
                        value: encodeURIComponent(JSON.stringify(columnArray))
                    }]
                });
                var panel = Ext.create('Ext.panel.Panel', {
                    region: 'center',
                    flex: 1,
                    html: '<iframe id="sql_iframe" name="sql_iframe" style="width: 100%; height: 100%;" frameborder="0"></iframe>'
                });
                form.getForm().doAction('standardsubmit', {
                    url: data,
                    method: 'POST',
                    target: 'sql_iframe'
                });
                var title = "<span style='font-size:15px'>" + $sqlWindow.title.bi + "</span>";
                if (blobFlag) {
                    title += " <span style='color:red;'>(" + sqlWindow.msg.biNotSupportBLOB + ")</span>";
                }
                var win = new IDB.Window({
                    title: title,
                    items:[panel],
                    width:850,
                    height:550,
                    maximizable:true,
                    closable:true,
                    buttons:[{
                        text: $pub.close,
                        handler: function() {
                            win.close();
                        }
                    }]
                });
            }else {
                Ext.Msg.alert($pub.prompt , json.root);
            }
        }
    });
}
var update_sql_fun = {
    deleteSQL:function(tableName , grid) {
        var allSql = new Array();
        var primaryKeys = grid.editTablePrimaryKeys;
        var records = grid.getStore().getRemovedRecords();
        Ext.each(records , function(record) {
            var whereStr = '';
            var oldValues = record.modified;
            var fields = record.fields;
            var rowIndex = grid.getStore().indexOf(records);
            Ext.each(fields.items , function(field) {
                var columnName = field.name;
                var realName = field.realName;
                if (realName && primaryKeys.length > 0 && primaryKeys.indexOf(realName) !== -1) {
                    if (whereStr !== '') {
                        whereStr = whereStr + ' and ';
                    }
                    var pkOldValue = oldValues[columnName];
                    if (pkOldValue === undefined) {
                        pkOldValue = record.data[columnName];
                    }
                    if (isNoZeroEmpty(pkOldValue)) {
                        Ext.Msg.alert($pub.prompt, $sqlWindow.page.the + (rowIndex + 1) + $pub.row + $pub.primaryKey + '[' + field.realName + ']' + $pub.notNull);
                        return;
                    }
                    whereStr = whereStr + '`' + field.realName + "`=" + getFieldValueStr(pkOldValue, field.dataType);
                }
            });
            var sql = 'delete from ' + tableName + ' where ' + whereStr + ';';
            allSql.push({rowIndex:rowIndex, type:'D', sql:sql});
        });
        return allSql;
    },
    insertSQL:function(tableName , grid) {
        var allSql = new Array();
        var records = grid.getStore().getModifiedRecords();
        Ext.each(records , function(record) {
            var sql = '';
            var oldValues = record.modified;
            var newValues = record.getChanges();
            if (record.raw.__new === 1) {
                var insertColumnNames = '';
                var insertColumnValues = '';
                var rowIndex = grid.getStore().indexOf(record);
                Ext.each(record.fields.items , function(field) {
                    var columnName = field.name;
                    if (oldValues[columnName] !== undefined) {
                        if (insertColumnNames !== '') {
                            insertColumnNames = insertColumnNames + ',';
                            insertColumnValues = insertColumnValues + ',';
                        }
                        insertColumnNames = insertColumnNames + '`' + field.realName.replaceAll("`" , "``") + '`';
                        insertColumnValues = insertColumnValues + getFieldValueStr(newValues[columnName], field.dataType);
                    }
                });
                if (insertColumnNames !== '') {
                    sql = 'insert ' + tableName + '(' + insertColumnNames + ') values(' + insertColumnValues + ');';
                    allSql.push({rowIndex:rowIndex, type:'I', sql:sql});
                }
            }
        });
        return allSql;
    },
    updateSQL:function(tableName , grid) {
        var allSql = new Array();
        var records = grid.getStore().getModifiedRecords();
        var primaryKeys = grid.editTablePrimaryKeys;
        Ext.each(records , function(record) {
            var sql = '' , whereStr = '';
            var oldValues = record.modified;
            var newValues = record.getChanges();
            if (record.raw.__new !== 1) {
                var rowIndex = grid.getStore().indexOf(record);
                Ext.each(record.fields.items , function(field) {
                    var columnName = field.name;
                    var realName = field.realName;
                    if (oldValues[columnName] !== undefined) {//set
                        if (sql !== '') {
                            sql = sql + ',';
                        }
                        sql = sql + '`' + field.realName + "`=" + getFieldValueStr(newValues[columnName], field.dataType);
                    }

                    if (realName && primaryKeys.length > 0 && primaryKeys.indexOf(realName) !== -1) {//where
                        if (whereStr !== '') {
                            whereStr = whereStr + ' and ';
                        }
                        var pkOldValue = oldValues[columnName];
                        if (pkOldValue === undefined) {
                            pkOldValue = record.data[columnName];
                        }
                        if (isNoZeroEmpty(pkOldValue)) {
                            Ext.Msg.alert($pub, $sqlWindow.page.the + (rowIndex + 1) + $pub.row + $pub.primaryKey + '[' + field.realName + ']' + $pub.notNull);
                            return;
                        }
                        whereStr = whereStr + '`' + field.realName.replaceAll("`" , "``") + "`=" + getFieldValueStr(pkOldValue, field.dataType);
                    }
                });
                if (sql !== '') {
                    sql = 'update ' + tableName + ' set ' + sql + ' where ' + whereStr + ';';
                    allSql.push({rowIndex:rowIndex, type:'U', sql:sql});
                }
            }
        });
        return allSql;
    }
};

function showEditDataSql(result_index) {
    var grid = Ext.getCmp('result_' + result_index);
    var tableName = "`" + grid.editDbName.replaceAll("`" , "``") + "`.`" + grid.editTableName.replaceAll("`" , "``") + "`";
    var deleteSql = update_sql_fun.deleteSQL(tableName , grid);
    var insertSql = update_sql_fun.insertSQL(tableName , grid);
    var updateSql = update_sql_fun.updateSQL(tableName , grid);
    var allSql = new Array();
    allSql = allSql.concat(deleteSql, insertSql, updateSql);
    if (allSql.length === 0) {
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
                postChange(allSql , grid , win);
            }},
            {text:$pub.cancel, handler:function () {
                win.close();
            }}
        ]
    }).show()
}
function postChange(allSql,grid,win) {
    Ext.getBody().mask($pub.submitJob);
    var jsonAllSql = Ext.encode(allSql);
    ajax({
        url:'/data/sqlWindow/postChange.do',
        params:{panelKey:getPaneKey(), dbName:nowDBName, sql:jsonAllSql},
        method:'POST',
        timeout:600000,
        success:function (response, options) {
            Ext.getBody().unmask();
            var rs = jsonDecode(response.responseText);
            if (rs.failure) {
                Ext.MessageBox.alert($pub.error, rs.root);
            }else {
                var root = rs.root;
                var disableEdit = false;
                if(root.hasError) {
                    var msg = "" , baseMsg = $sqlWindow.msg.executeError + "：<br/>" + root.errorSQL + "<br/><br/>" + $pub.errorReason + "：<br/>" + root.errorMsg;
                    if(root.successCount) {
                        msg = "<span style='font-weight: bold;color: red;'>【" + $pub.beCareful + "】</span>：" + $sqlWindow.msg.executedPartOfSQL + "（" + root.successCount + $pub.row + "）" + $sqlWindow.msg.confirmRefreshPage;
                        disableEdit = true;
                        win.close();
                        Ext.Msg.confirm($pub.error , baseMsg + "<br/><br/>" + msg , function(v) {
                            if(v === 'yes') {
                                getPageResult(grid.result_index);
                            }else {
                                hasSuccessRowCallback(grid,root,disableEdit,win);
                            }
                        });
                    }else {
                        Ext.Msg.alert($pub.error , baseMsg);
                    }
                }
                if(!root.hasError) {
                    hasSuccessRowCallback(grid,root,disableEdit,win);
                }
            }
        },
        failure:function (response, options) {
            Ext.getBody().unmask();
            Ext.MessageBox.alert($pub.error, $pub.executeNetworkError);
        }
    });
}
function hasSuccessRowCallback(grid,root,disableEdit,win) {
    var records = grid.getStore().getNewRecords();
    Ext.each(root.lastInsertIds , function(row) {
        var record = grid.getStore().getAt(row.rowIndex);
        if (record.raw.__new === 1) {
            record.raw.__new = 0;
        }
        var fields = grid.store.model.getFields();
        for (var j = 0; j < fields.length; j++) {
            if (fields[j].autoIncrement && !record.get(fields[j].name)) {
                record.set(fields[j].name, row.lastInsertId);
                break;
            }
        }
    });
    if(disableEdit) {
        edit_option_fun.disableGridEdit(grid.result_index);
    }else {
        grid.store.commitChanges();
    }
    win.close();
}
function formatSql() {
    var sql = getSql();
    var result = formatsql(sql);
    if(Ext.getCmp("tx_sql").editor.getSelection()) {
    	var cursorBegin = Ext.getCmp("tx_sql").editor.getCursor(true);
    	var cursorEnd = Ext.getCmp("tx_sql").editor.getCursor(false);
    	var resultSplit = result.split("\n");
    	var splitLength = resultSplit.length
    	var newCursorEnd =  CodeMirror.Pos(cursorBegin.line + splitLength - 1, resultSplit[splitLength - 1].length);
        Ext.getCmp("tx_sql").editor.replaceSelection(result);
        Ext.getCmp("tx_sql").editor.setSelection(cursorBegin, newCursorEnd);
    }else {
        Ext.getCmp("tx_sql").setValue(result);
    }
}

var showSqlPlan = function() {
	var sqlText = Ext.String.trim(getSql());
    if (sqlText === "") {
        Ext.MessageBox.alert($pub.prompt , $sqlWindow.msg.inputPlanSQL);
        return;
    }

    var _explain_tab = new Ext.tab.Panel({
        region:'center',
        tabPosition:'top',
        activeTab:0,
        id:'explain_plan'
    });

    Ext.getBody().mask($sqlWindow.msg.splittingSQL);
    ajax({
        url:'/data/splitSQL.do',
        params:{sqlText:sqlText},
        success:function(resp) {
            Ext.getBody().unmask();
            var json = jsonDecode(resp.responseText);
            if(json.success) {
                var data = json.root;
                var sqlArray  = data.sqlList;
                var timeDelay = data.timeDelay;
                for(var _tt =0;_tt<sqlArray.length;_tt++){
                	 _explain_tab.add(explain_one_sql(sqlArray[_tt],_tt));
                	 _explain_tab.setActiveTab(0);
                }
            }else {
                Ext.Msg.alert($pub.prompt , json.root);
            }
        },
        failure:function(resp) {
            Ext.getBody().unmask();
            Ext.Msg.alert($pub.prompt , resp.responseText);
        }
    });


    var explain_one_sql = function(_one_sql,_index){
    	if(_one_sql){
            _one_sql =_one_sql;
    	}

    	 var _storeSqlPlan = Ext.create('Ext.data.Store', {
    	        model:'ModelSqlPlan',
    	        pageSize:50,
    	        data:[],
    	        proxy:{
    	            type:'ajax',
    	            url:baseUrl + 'getSqlPlan.do',
    	            reader:{
    	                type:'json',
    	                root:'root'
    	            }
    	        }
    	    });
    	    var getSqlPlan = function() {
    	        if (_one_sql) {
    	            _storeSqlPlan.load({
    	                params:{
    	                    panelKey:getPaneKey(), dbName:nowDBName, sql:_one_sql
    	                }
    	            });
    	        }
    	    };
    	    getSqlPlan();
    	    var _gridSqlPlan = Ext.create('Ext.grid.Panel', {
    	        store:_storeSqlPlan,
    	        region:'center',
    	        id:'one_sql_explain_' + _index,
    	        title:$pub.plan + (_index + 1),
    	        tabConfig:{
    	            tooltip:"SQL:" + _one_sql
    	        },
    	        deferRowRender:false,
    	        sortableColumns:false,
    	        viewConfig:{ stripeRows:true, enableTextSelection:true},
    	        columns:[
    	            {text:"ID", dataIndex:"ID", align:'right', width:30},
    	            {text:"SELECT_TYPE", dataIndex:"SELECT_TYPE", width:120},
    	            {text:"TABLE", dataIndex:"TABLE", width:120},
    	            {text:"TYPE", dataIndex:"TYPE", width:60},
    	            {text:"POSSIBLE_KEYS", dataIndex:"POSSIBLE_KEYS", width:200},
    	            {text:"KEY", dataIndex:"KEY", width:150},
    	            {text:"KEY_LEN", dataIndex:"KEY_LEN", align:'right', width:80},
    	            {text:"REF", dataIndex:"REF", width:100},
    	            {text:"ROWS", dataIndex:"ROWS", align:'right', width:100},
    	            {text:"EXTRA", dataIndex:"EXTRA", width:300}
    	        ]
    	    });
    	    return _gridSqlPlan;
    }

    var win = new IDB.Window({
        title:$pub.plan ,
        items:[_explain_tab],
        width:964,
        height:420,
        maximizable:true,
        closable:true,
        buttons:[]
    });

    win.show();
};
var localStoredSQL = null ,localStoredSQLKey = null;
var initLocalStoredSQL = function() {
    if(other_params) {
        other_params = jsonDecode(other_params);
        var key = localStoredSQLKey = other_params['temp_store_sql_key'];
        localStoredSQL = SimpleStorageUtils.get(key);
        window.onbeforeunload = function(e) {
            var nowValue = SimpleStorageUtils.get(key);
            if(nowValue || nowValue === "") {
                SimpleStorageUtils.set(key , getFullSqlText());
            }
        };
    }
};


function initQuery() {
    initLocalStoredSQL();
    if(localStoredSQL) {
        Ext.getCmp('tx_sql').setValue(localStoredSQL);
    }else if (operation === 'query' && objectName) {
        var sql = 'SELECT * FROM `' + nowDBName.replace("`","``") + '`.`' + objectName.replace("`","``") + "`" + getInitWhereCondition() + " LIMIT 0,50;";
        Ext.getCmp('tx_sql').setValue(sql);
        executeSQL();
    }
}
function getInitWhereCondition() {
    if(v_primaryKeys.length > 0) {
        var orderSQL = " ORDER BY ";
        Ext.each(v_primaryKeys , function(row) {
            orderSQL += "`" + row.replace("`","``") + "`" + " DESC ,";
        });
        return orderSQL.substring(0 , orderSQL.length - 1);
    }
    return "";
}


// Cancel功能

var isCancel = false;

var cancelWindow = new Ext.Window({
    width:500,
    height:200,
    layout:'absolute',
    title:$pub.pleaseWait,
    overflowY : 'scroll',
    plain:true,
    bodyStyle:'padding:5px;',
    buttonAlign:'center',
    items:[
        {
            x:20,
            y:20,
            xtype:'label',
            text:$sqlWindow.msg.executingSQL
        }
    ],
    modal:true,
    closable:false,
    closeAction:'hide',
    buttons:[
        {
            text:$sqlWindow.button.cancel,
            handler:function () {
            	isCancel = true;
            	cancelWindow.hide();
                cancel();
            }
        }
    ]
});
function cancel() {
    Ext.Ajax.request({
        url:baseUrl + 'cancel.do',
        waitMsg:$pub.pleaseWait,
        params:{
            event:"cancel",
            panelKey:getPaneKey(), dbName:nowDBName
        }
    });
}





/**************/

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
var submitNewSQLJob = function(params) {
    var advanceWindow = createAdvanceWindow();
    params['exportMode'] = "sql";
    params['exportMethod'] = 'data';
    Ext.apply(params , advanceWindow.getAdvanceValues());
    advanceWindow.close();
    Ext.getBody().mask($pub.submitJob);
    ajax({
        url:'/data/export/saveExportJobBySqlWindow.do',
        params:params,
        success:function(resp) {
            Ext.getBody().unmask();
            var json = jsonDecode(resp.responseText);
            if(json.success) {
                showMonitor(json.root);
            }else {
                Ext.Msg.alert($pub.prompt , json.root);
            }
        },
        failure:function() {
            Ext.getBody().unmask();
        }
    });
};
  var addNewSQLJob = function(dbName,sql) {
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
                fieldLabel:$pub.optionSet,
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
                        boxLabel : $export.containsCSVFirstRow
                    }
                ]
            },
            {
                fieldLabel:$export.limitResultRows,
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
                value:dbName
            },
            {
                fieldLabel:$pub.executeSQL,
                xtype:'textarea',
                height:90,
                maxLength:20000,
                emptyText:$export.msg.inputSQL,
                maxLengthText:$export.msg.sqlLengthLimit,
                minLength:8,
                minLengthText:$export.msg.sqlLengthTowShort,
                name:'sql',
                value:sql,
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
                url:'/data/export/saveExportJob.do',
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
            text:$pub.close ,handler:function() {
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
        width:500,height:45,text:$export.nowProcess + '：' + use + "%" , paddingTop:5,region:'north' , margin:'3 12 3 12'
    });
    processBar.updateProgress(parseFloat(use)/100 , $export.nowProcess + '：' + use + "%&nbsp;&nbsp;&nbsp;&nbsp;" + $export.allRows + "：" + json['nowRows'] , true);
    var win = new IDB.Window({
        title : $export.refreshRate,
        layout:'border',
        width:680,
        height:450,
        items:[{
            region:'north',height:30,border:false,layout:'fit',items:[processBar],id:'processBarArea'
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
                        processBar.updateProgress(parseFloat(use)/100 , $export.nowProcess + '：' + use + "%<br/>" + $export.allRows + "：" + json['nowRows'] , true);
                        nowLogContentDom.innerHTML = "<pre>" + getMonitorBaseInfoByRow(json , new Date()) + (json['log'] || '') + "</pre>";
                        nowLogContentDom.scrollTop = nowLogContentDom.scrollHeight;
                        if(json['exportStatus'] === 'END') {
                            Ext.TaskManager.stop(task);
                            win.setTitle($pub.detail);
                            Ext.getCmp('monitor_download_file').show();
                            downloadAllFile(id);
                        }else if(json['exportStatus'] === 'ERROR') {
                            Ext.TaskManager.stop(task);
                            win.setTitle($pub.checkErrorInfo);
                            Ext.getCmp('processBarArea').hide();
                        }
                    }else {
                        Ext.Msg.alert($pub.prompt , json.root);
                    }
                }
            });
        }
    };
    if(json['exportStatus'] !== 'ERROR') {
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
        /*return '======================================================================\n' +
            '     当前状态：' + Ext.util.Format.htmlDecode(row['statusName']) +  "\n" +
            '     刷新时间：' + Ext.util.Format.date(date , 'Y-m-d H:i:s') + '\n' +
            '     ' + Ext.util.Format.htmlDecode(row['nowLog'] || '等待执行....') +  "\n" +
            '     SQL语句：\n' +
            '     ' + String(row['sql']).replaceAll("\n" , "\n     ") + '\n' +
            '======================================================================\n';*/

        return '======================================================================\n' +
            '     ' + $pub.nowStatus + '：' + Ext.util.Format.htmlDecode(row['statusName']) +  "\n" +
            '     ' + $pub.refreshTime + '：' + Ext.util.Format.date(date , 'Y-m-d H:i:s') + '\n' +
            '     ' + Ext.util.Format.htmlDecode(row['nowLog'] || $pub.waitingExecute) +  "\n" +
            '     ' + $pub.sqlScript + '：\n' +
            '     ' + String(row['sql']).replaceAll("\n" , "\n     ") + '\n' +
            '======================================================================\n';
    }
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

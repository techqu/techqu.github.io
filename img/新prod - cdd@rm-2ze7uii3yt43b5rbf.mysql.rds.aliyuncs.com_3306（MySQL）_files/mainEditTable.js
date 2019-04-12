var db_version_num = db_version_num;
var dbVersion5_6 = dbVersion5_6;
var isMoreOrEqual5_6Version = (db_version_num >= dbVersion5_6);
var colFun = {
   isNumberType : function(type) {
       return ['boolean' , 'bool' , 'tinyint' , 'smallint' , 'mediumint' , 'int' , 'integer' , 'bigint'].contains(type);
   },
    isFloatNumberType : function(type) {
       return ['real' , 'double' , 'float' , 'numeric' , 'decimal'].contains(type);
    },
    isCharType : function(type) {
       return ['char' , 'varchar'].contains(type);
    },
    isTextType : function(type) {
       return ['tinytext' , 'text' , 'mediumtext' , 'longtext'].contains(type);
    },
    isSetType : function(type) {
        return type === 'set';
    },
    isEnumType : function(type) {
        return type === 'enum';
    },
    isTimestamp : function(type) {
        return type === 'timestamp';
    },
    isDatetime : function(type) {
        return type === 'datetime';
    },
    isOnDefaultTimestamp : function(type) {
        return colFun.isTimestamp(type) || (isMoreOrEqual5_6Version && colFun.isDatetime(type));
    },
    isNoDefaultFieldType : function(type) {
       return ['tinyblob' , 'blob' , 'mediumblob' , 'longblob' , 'linestring' , 'polygon' , 'geometry' , 'multipoint',
                'multilinestring' , 'multipolygon' , 'geometrycollection'
       ].contains(type);
    }
};
var tempStore = {};
var getKey = function(keyEnd) {
    var conn = getConnStr() , dbVersion = getDBVersion();
    return conn + "_" + db_version + "_" + keyEnd;
};
var getValueByKey = function(keyEnd) {
    var key = getKey(keyEnd);
    if(window.localStorage) {
        var value = window.localStorage.getItem(key);
        return value ? jsonDecode(value) : value;
    }
    return tempStore[key];
};
var saveKeyValue = function(keyEnd,value) {
    var key = getKey(keyEnd);
    if(window.localStorage) {
        window.localStorage.setItem(key , jsonToString(value));
    }else {
        tempStore[key] = value;
    }
};
var saveCharsetToStore = function(charsetArray) {
    saveKeyValue('charset' , charsetArray);
};
var saveCharsetCollations = function(charsetCollections) {
    saveKeyValue("charsetCollations" , charsetCollections);
};
var getCharsetByStore = function() {
    return getValueByKey("charset");
};
var getCharsetCollations = function() {
    return getValueByKey("charsetCollations");
};
Ext.define('ColumnEditRecord', {
    extend: 'Ext.data.Model',
    fields: [
        'id','columnName' , 'oldColumnName' , 'columnType' , 'length' , 'scale' ,'nullable' , 'primaryKey',
        'defaults','comments' ,//扩展信息
        'autoIncrement' , 'unsigned' , 'zerofill',//数字专用
        'charset','collate','binary',//字符专用
        'values','defaultsEnumValue','defaultSetValue','onUpdateTimestamp'
    ]
});
Ext.define('IndexEditRecord', {
    extend: 'Ext.data.Model',
    fields: [
        'name' , 'oldIndexName' , 'type' , 'method' , 'columns'
    ]
});
var deleteColumn = function(nowDBName,nowRightMenuRecord,columnName) {
    var tableName = nowRightMenuRecord.get('tableName');
    var sql = "alter table `" + tableName.replaceAll("`" , "``") + "` DROP COLUMN `" + columnName.replaceAll("`" , "``") + "`";
    Ext.Msg.confirm($pub.prompt, $pub.confirmDropObject.format($pub.column) + '：' + tableName + "." + columnName + "？" , function(v) {
        if(v === 'yes') {
            executeSQLWithCallback(sql , nowDBName , function() {
                object_panel.refreshTableChild(nowRightMenuRecord);
            } , "DelCol");
        }
    });
};
var deleteIndex = function(nowDBName , nowRightMenuRecord , indexName) {
    var tableName = nowRightMenuRecord.get('tableName');
    var sql = "alter table `" + tableName.replaceAll("`" , "``") + "` DROP";
    var msg = '';
    if(indexName === 'PRIMARY') {
        sql += ' PRIMARY KEY';
        msg += $pub.confirmDropObject.format(tableName) + ' ' + $pub.primaryKey + '？';
    }else {
        sql += ' KEY `' + indexName.replaceAll('`' , "``") + "`";
        msg += $pub.confirmDropObject.format($pub.index) + '：' + tableName + "." + indexName + "？"
    }
    Ext.Msg.confirm($pub.prompt , msg , function(v) {
        if(v === 'yes') {
            executeSQLWithCallback(sql , nowDBName , function() {
                object_panel.refreshTableChild(nowRightMenuRecord);
            } , "DelIndex");
        }
    });
};
var addNewColumn = function(nowDBName,nowRightMenuRecord,columnName) {
    var charsetArray = getCharsetByStore();
    var charsetCollations = getCharsetCollations();
    if(charsetArray && charsetCollations) {
        addNewColumnDoing(charsetArray , charsetCollations , nowRightMenuRecord,columnName,nowDBName);
    }else {
        Ext.getBody().mask($main.msg.getCharacterSet);
        ajax({
            url:'/system/showAllCollations.do',
            success:function(resp) {
                Ext.getBody().unmask();
                var json = jsonDecode(resp.responseText);
                if(json.success) {
                    var array = json.root;
                    var charsetArray = [] , charsetMap = {} , charsetCollections = {};
                    Ext.each(array , function(row) {
                        var charset = row.charset;
                        if(!charsetMap[charset]) {
                            charsetMap[charset] = "1";
                            charsetArray.push({data:charset});//添加字符集
                        }
                        var collations = charsetCollections[charset];
                        if(!collations) {
                            collations = [];
                            charsetCollections[charset] = collations;
                        }
                        var collation = row['collation'];
                        collations.push({data:collation});
                    });
                    saveCharsetToStore(charsetArray);
                    saveCharsetCollations(charsetCollections);
                    addNewColumnDoing(charsetArray , charsetCollections , nowRightMenuRecord,columnName,nowDBName);
                }else {
                    Ext.Msg.alert($pub.prompt , $main.msg.getCharacterSetFailure + '：' + json.root);
                }
            },
            failure:function() {
                Ext.getBody().unmask();
            }
        });
    }
};
var getEnumDataArrayByValue = function(v) {
    if(!v) return [];
    var array = v.split(',');//值当中不允许存在逗号
    var valueArray = [];
    Ext.each(array , function(row) {
        row = row.replaceAll("''" , "'");
        if(row.charAt(0) === '\'') {
            valueArray.push({data:row.substring(1 , row.length - 1)});
        }else {
            valueArray.push({data:row});
        }
    });
    return valueArray;
};
var appendGridRows = function(rows,grid,appendRow) {
    for(var i = 0 ; i < rows ; i++) {
        grid.store.add(appendRow || {});
    }
};
var removeSelectedRows = function(grid) {
    var selectedRows = grid.getSelectionModel().getSelection();
    if(!selectedRows || selectedRows.length === 0) {
        Ext.Msg.alert($pub.prompt , $pub.selectOneRowOption);
        return;
    }
    Ext.each(selectedRows , function(row) {
        grid.store.remove(row);
    });
    grid.getView().refresh();
};
var showValuesPanelWindow = function(field , callBackFun) {
    var existsValues = field.getValue();
    var existsValueArray = getEnumDataArrayByValue(existsValues);
    existsValueArray.push({});
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
            {text: $pub.valueList,  dataIndex: 'data' ,sortable:false ,flex:1, editor:{xtype:'textfield',allowBlank:false}}
        ],
        store:new Ext.data.Store({
            fields:['data'],
            data:existsValueArray,
            proxy: {
                type: 'memory'
            }
        })
    });
    var win = new IDB.Window({
        height:400 , width:400 , title : $pub.valueList, items:[grid],
        buttons:[
            {
                text:'+',width:40,handler:function() {
                cellEditing.completeEdit();
                appendGridRows(1 , grid);
            }
            },
            {
                text:'-',width:40,handler:function() {
                cellEditing.completeEdit();
                removeSelectedRows(grid);
            }
            },
            {
                text: $pub.save, handler:function() {
                cellEditing.completeEdit();
                var result = '' , error = false , setValue = {};
                grid.store.each(function(row) {
                    var v = row.get('data');
                    if(!error && v) {
                        if(v.indexOf(',') !== -1) {
                            Ext.Msg.alert($pub.prompt , $pub.data + '：' + v + $pub.containsComma);
                            error = true;
                        }
                        if(!setValue[v]) {
                            setValue[v] = "1";
                            if(v.indexOf('\'') !== -1) {
                                v = v.replaceAll("'","''");
                            }
                            result += '\'' + v + '\',';
                        }
                    }
                });
                if(result.length > 0) {
                    result = result.substring(0 , result.length - 1);
                }
                field.setValue(result);
                if(callBackFun) {
                    callBackFun.call(this);
                }
                win.close();
            }
            },
            {
                text: $pub.cancel, handler:function() {cellEditing.completeEdit();win.close();}
            }
        ]
    });
};
var addNewColumnDoing = function(charsetArray , charsetCollections , nowRightMenuRecord,columnName,nowDBName) {
    var columnTypeStore = new Ext.data.Store({
        fields:['data' , 'label'],
        data:columnTypeArray
    });
    var columnDefaultsStore = new Ext.data.Store({
        fields:['data' , 'label'],
        data:[{data:'',label:''},{data:'$empty_string$',label:'Empty String'}]
    });
    var isEnumValue = false;
    var form = new IDB.FormPanel({
        defaults:{
            width:450,
            labelWidth:100,
            allowBlank:true
        },
        items:[{
            padding:'3 0 3 0',
            fieldLabel: $pub.columnName,
            blankText: $tableEdit.msg.columnNameCannotBeEmpty,
            allowBlank:false,
            name:'columnName'
        },{
            fieldLabel: $pub.columnType,
            name:'columnType',
            emptyText: $tableEdit.msg.columnTypeCannotBeEmpty,
            xtype:'combo',
            triggerAction:'all',
            displayField:'label',
            valueField:'data',
            queryMode:'local',
            forceSelection:true,
            typeAhead:true,
            store:columnTypeStore,
            allowBlank:false,
            value:'varchar',
            listeners:{
                select:function(thiz,records) {
                    typeControl(records[0].get('data'));
                }
            }
        },{
            fieldLabel: $pub.length,
            name:'length',
            xtype:'numberfield',
            allowDecimals:false,
            minValue:0,
            negativeText: $pub.noNegative,
            nanText: $pub.invalidNumber
        },{
            fieldLabel: $tableEdit.scale,
            hidden:true,
            name:'scale',
            xtype:'numberfield',
            allowDecimals:false,
            minValue:0,
            negativeText: $pub.noNegative,
            nanText: $pub.invalidNumber
        },{
            fieldLabel: $pub.nullable,
            xtype:'checkboxfield',
            checked:true,
            inputValue:'true',
            name:'nullable'
        },{
            xtype:'panel',
            border:false,
            hidden:true,
            id:'values_check_panel',
            padding:'3 0 3 0',
            //width:605,
            layout:{
                type:'hbox'
            },
            items:[{
                fieldLabel: $pub.valueList,
                xtype:'textfield',
                name:'values',
                labelWidth:100,
                labelAlign:'right',
                flex:1,
                readOnly:true
            },{
                xtype:'button',
                text:'...',
                handler:function() {
                    var field = realForm.findField('values');
                     if(isEnumValue) {
                         showValuesPanelWindow(field , fillEnumValuesToSelect);
                     }else {
                         showValuesPanelWindow(field);
                     }
                }
            }]
        },{
            xtype:'panel',
            border:false,
            hidden:true,
            padding:'3 0 3 0',
            id:'set_value_panel',
            layout:{
                type:'hbox'//,align: 'stretch'
            },
            items:[{
                fieldLabel: $tableEdit.defaultValue,
                xtype:'textfield',
                name:'defaultSetValue',
                labelWidth:100,
                labelAlign:'right',
                flex:1,
                readOnly:true
            },{
                xtype:'button',
                text:'...',handler:function() {
                    var valueField = realForm.findField('values');
                    var defaultSetValueField = realForm.findField('defaultSetValue');
                    showSetValueFieldWindow(valueField , defaultSetValueField);
                }
            }]
        },{
            padding:'3 0 3 0',
            fieldLabel: $tableEdit.defaultValue,
            name:'defaults',
            xtype:'combo',
            triggerAction:'all',
            displayField:'label',
            valueField:'data',
            queryMode:'local',
            hidden:true,
            forceSelection:false,
            typeAhead:true,
            store:columnDefaultsStore
        },{
            fieldLabel: $tableEdit.defaultValue,
            xtype:'combo',
            name:'defaultsEnumValue',
            triggerAction:'all',
            displayField:'data',
            valueField:'data',
            queryMode:'local',
            hidden:true,
            forceSelection:true,
            typeAhead:true,
            store:new Ext.data.Store({
                fields:['data'],
                data:[]
            })
        },{
            xtype:'checkboxgroup',
            fieldLabel: $tableEdit.numberOption,
            id:'number_checkbox_group',
            columns:3,
            hidden:true,
            items:[
                {boxLabel: $tableEdit.unsigned, name:'unsigned', inputValue:'true'},
                {boxLabel:'ZEROFILL', name:'zerofill', inputValue:'true'},
                {boxLabel: $tableEdit.autoIncrement, name:'autoIncrement', inputValue:'true'}
            ]
        },{
            fieldLabel: $pub.characterSet,
            xtype:'combo',
            name:'charset',
            triggerAction:'all',
            displayField:'data',
            valueField:'data',
            queryMode:'local',
            hidden:true,
            forceSelection:true,
            typeAhead:true,
            store:new Ext.data.Store({
                fields:['data'],
                data:charsetArray
            })
        },{
            fieldLabel: $pub.collation,
            hidden:true,
            name:'collate',
            xtype:'combo',
            triggerAction:'all',
            displayField:'data',
            valueField:'data',
            queryMode:'local',
            forceSelection:true,
            typeAhead:true,
            store:new Ext.data.Store({
                fields:['data'],
                data:[]
            })
        },{
            fieldLabel: $tableEdit.binary,
            hidden:true,
            xtype:'checkboxfield',
            inputValue:'true',
            name:'binary'
        },{
            fieldLabel: $pub.optionSet,
            boxLabel: $tableEdit.onUpdateTimestamp,
            hidden:true,
            xtype:'checkboxfield',
            inputValue:'true',
            name:'onUpdateTimestamp'
        },{
            fieldLabel: $pub.comment,
            xtype:'textarea',
            height:55,
            name:'comments'
        },{
            name:'primaryKey',
            xtype:'hidden'
        }]
    });
    var realForm = form.getForm();
    var typeSetLength = function(type , equalType , defaultLength) {
        if(type === equalType) {
            var f = realForm.findField('length');
            if(!f.getValue()) {
                f.setValue("32");
            }
        }
    };
    var fillEnumValuesToSelect = function(v) {
        var values = realForm.findField('values');
        var selectData = getEnumDataArrayByValue(values.getValue());
        var defaultsEnumValueField = realForm.findField('defaultsEnumValue');
        defaultsEnumValueField.store.loadData(selectData);
        if(v) {
            defaultsEnumValueField.setValue(v);
        }
    };
    var notHideFields = {
        columnName : "1",
        columnType : "1",
        length:"1",
        nullable:"1",
        comments:"1"
    };
    var showArray = function(array)  {
        Ext.each(array , function(row) {
            realForm.findField(row).show();
        });
    };

    var charsetField = realForm.findField('charset');
    var collateField = realForm.findField('collate');
    var processCharsetCollate = function(charset) {
        if(charset) {
            var collations = charsetCollections[charset];
            collateField.store.loadData(collations);
        }
    };
    var typeControl = function(type) {
        typeSetLength(type , 'varchar' , "32");
        typeSetLength(type , 'int' , "11");
        var checkboxGroup = Ext.getCmp('number_checkbox_group');//数字选项
        var valuesCheckPanel = Ext.getCmp('values_check_panel');//列信息选项
        var setValuePanel = Ext.getCmp('set_value_panel');//set选择

        var allFields = realForm.getFields();
        allFields.each(function(field) {
            var name = field.getName();
            if(name && !field.hidden && !notHideFields[name]) {
                field.hide();
            }
        });
        checkboxGroup.hide();
        valuesCheckPanel.hide();
        setValuePanel.hide();
        isEnumValue = false;
        var showCharset = true , defaultTimestamp = false;
        if(colFun.isNumberType(type)) {
            checkboxGroup.show();
            showArray(['defaults' , 'unsigned' , 'zerofill' , 'autoIncrement']);
            showCharset = false;
        }else if(colFun.isFloatNumberType(type)) {
            checkboxGroup.show();
            showArray(['defaults' , 'unsigned' , 'zerofill' , 'scale']);
            showCharset = false;
        }else if(colFun.isCharType(type)) {
            showArray(['defaults' , 'charset' , 'collate' , 'binary']);
        }else if(colFun.isOnDefaultTimestamp(type)) {
            showArray(['defaults' , 'onUpdateTimestamp']);
            columnDefaultsStore.add({data:'CURRENT_TIMESTAMP',label:'CURRENT_TIMESTAMP'});
            defaultTimestamp = true;
        }else if(colFun.isTextType(type)) {
            showArray(['charset' , 'collate']);
        }else if(colFun.isSetType(type)) {
            valuesCheckPanel.show();
            setValuePanel.show();
            showArray(['values' , 'defaultSetValue' , 'charset' , 'collate']);
        }else if(colFun.isEnumType(type)) {
            valuesCheckPanel.show();
            isEnumValue = true;
            fillEnumValuesToSelect(realForm.findField('defaultsEnumValue').getValue());
            showArray(['values' , 'defaultsEnumValue' , 'charset' , 'collate']);
        }else if(!colFun.isNoDefaultFieldType(type)) {
            showArray(['defaults']);
            showCharset = false;
        }

        if(showCharset) {
            processCharsetCollate(charsetField.getValue());
        }
        if(!defaultTimestamp) {
            var index = columnDefaultsStore.find('data' , 'CURRENT_TIMESTAMP');
            if(index >= 0) {
                columnDefaultsStore.removeAt(index);
            }
        }

        charsetField.on('select' , function() {
            processCharsetCollate(charsetField.getValue());
        });
    };
    var title = '' , option = '' , tableName = nowRightMenuRecord.get('tableName');
    if(columnName) {
        title = $tableEdit.editColumn + "：[" + tableName + "." + columnName + "]";
        option = 'AlterCol';
    }else {
        title = $pub.table + "：[" + tableName + "]" + " " + $tableEdit.addColumn;
        option = 'AddCol';
    }
    var win = new IDB.Window({
        width:500,height:370,items:[form],title:title,closable:true,
        buttons:[{
            text: $pub.save, handler:function() {
                if(form.isValid()) {
                    var values = realForm.getValues();
                    values.dbVersionNum = db_version_num;
                    values.tableName = tableName;
                    values.dbName = nowDBName;
                    values.oldColumnName = columnName;
                    Ext.getBody().mask($pub.buildingScript);
                    ajax({
                        url:'/structure/table/showColumnsChangeScript.do',
                        params:values,
                        success:function(resp) {
                            Ext.getBody().unmask();
                            var json = jsonDecode(resp.responseText);
                            if(json.success) {
                                showExecuteSQL(json.root[0] , nowDBName , option , win , nowRightMenuRecord);
                            }else {
                                Ext.Msg.alert($pub.error, json.root);
                            }
                        },failure:function() {
                            Ext.getBody().unmask();
                        }
                    });
                }
            }
        },{
            text: $pub.cancel, handler:function() {win.close();}
        }]
    });
    if(columnName) {
        Ext.getBody().mask($pub.loadingMetadata);
        ajax({
            url:'/structure/table/showOneColumn.do',
            params:{dbName:nowDBName,tableName:tableName,columnName:columnName},
            success:function(resp) {
                Ext.getBody().unmask();
                var json = jsonDecode(resp.responseText);
                if(json.success) {
                    var record = new ColumnEditRecord(json.root);
                    form.loadRecord(record);
                    typeControl(realForm.findField('columnType').getValue());
                    form.isValid();
                }else {
                    Ext.Msg.alert($pub.error, json.root , function() {
                        win.close();
                    });
                }
            },
            failure:function(resp) {
                Ext.getBody().unmask();
                win.close();
            }
        })
    }else {
        typeControl(realForm.findField('columnType').getValue());
        form.isValid();
    }

};
var showExecuteSQL = function(content,nowDBName,option , parentWindow , nowRightMenuRecord) {
    var sqlArea = new Ext.ux.form.field.CodeMirror({value: content, autoScroll: true,readOnly:true});
    var win = new IDB.Window({
        title: $pub.operationStart,
        width: 600, height: 340,
        items: [sqlArea],
        buttons: [
            {
                text:$pub.execute , handler:function() {
                   var callBack = function() {
                       if(parentWindow) {
                           parentWindow.close();
                       }
                       if(nowRightMenuRecord) {
                           object_panel.refreshTableChild(nowRightMenuRecord);
                       }
                       win.close();
                   };
                   executeSQLWithCallback(content , nowDBName , callBack , option);
                }
            },{
                text: $pub.close, handler: function () {
                win.close();
            }}
        ]
    });
};

var showSetValueFieldWindow = function(valueField , defaultSetValueField) {
    var existsValues = valueField.getValue();
    var defaultValue = defaultSetValueField.getValue();

    var defaultValueMap = {};
    if(defaultValueMap) {
        var tmpArray = defaultValue.split(",");
        Ext.each(tmpArray , function(row) {
            row = row.replaceAll("''" , "'");
            if(row.charAt(0) === '\'') {
                row = row.substring(1 , row.length - 1)
            }
            defaultValueMap[row] = "1";
        });
    }
    var existsValueArray = getEnumDataArrayByValue(existsValues);
    var cellEditing = new Ext.grid.plugin.CellEditing({
        clicksToEdit:1
    });
    var grid = new Ext.grid.Panel({
        selType:'checkboxmodel',
        multiSelect:true,
        plugins:[
            cellEditing
        ],
        columns:[
            {text: $pub.valueList,  dataIndex: 'data' ,sortable:false ,flex:1, editor:{xtype:'textfield',allowBlank:false}}
        ],
        store:new Ext.data.Store({
            fields:['data'],
            data:existsValueArray,
            proxy: {
                type: 'memory'
            }
        }),
        listeners:{
            afterrender:function() {
                var preSelectRecords = [];
                grid.store.each(function(record) {
                    if(defaultValueMap[record.get('data')]) {
                        preSelectRecords.push(record);
                    }
                });
                if(preSelectRecords.length > 0) {
                    grid.getSelectionModel().select(preSelectRecords);
                }
            }
        }
    });

    var win = new IDB.Window({
        height:400 , width:400 , title : $tableEdit.valueListOrNull , items:[grid],
        buttonAlign:'center',
        buttons:[
            {
                text: $pub.save, handler:function() {
                cellEditing.completeEdit();
                var selectedRows = grid.getSelectionModel().getSelection();
                var result = '';
                Ext.each(selectedRows , function(record) {
                    var v = record.get('data');
                    if(v) {
                        result += v + ',';
                    }
                });
                if(result.length > 0) {
                    result = result.substring(0 , result.length - 1);
                }
                defaultSetValueField.setValue(result);
                win.close();
            }
            },
            {
                text:'NULL',handler:function() {defaultSetValueField.setValue('NULL');win.close();}
            },
            {
                text: $pub.cancel, handler:function() {win.close();}
            }
        ]
    });
};
var addTableIndex = function(nowDBName , nowRightMenuRecord , indexName) {
    var tableName = nowRightMenuRecord.get('tableName');
    Ext.getBody().mask($pub.loading);
    ajax({
        url:'/system/showTablesTree.do',
        params:{type:'column_group',name:tableName,dbName:nowDBName},
        success:function(resp) {
            Ext.getBody().unmask();
            var json = jsonDecode(resp.responseText);
            if(json.success) {
                var columns = [];
                Ext.each(json.root , function(row) {
                    columns.push({data:row['realName']});
                });
                if(indexName) {
                    addTableIndexLoadIndex(nowDBName , tableName , nowRightMenuRecord , indexName , columns);
                }else {
                    addTableIndexDoing(columns , tableName , nowDBName , nowRightMenuRecord , indexName);
                }
            }else {
                Ext.Msg.alert($pub.error, json.root);
            }
        },
        failure:function() {
            Ext.getBody().unmask();
        }
    });
};

var addTableIndexLoadIndex = function(nowDBName , tableName , nowRightMenuRecord , indexName , columns) {
    Ext.getBody().mask($pub.loading);
    ajax({
        url:'/structure/table/showOneIndex.do',
        params:{dbName:nowDBName,tableName:tableName,indexName:indexName},
        success:function(resp) {
            Ext.getBody().unmask();
            var json = jsonDecode(resp.responseText);
            if(json.success) {
                addTableIndexDoing(columns , tableName , nowDBName , nowRightMenuRecord , indexName , json.root);
            }else {
                Ext.Msg.alert($pub.prompt , json.root);
            }
        },
        failure:function() {
            Ext.getBody().unmask();
        }
    });
};
var addTableIndexDoing = function(columns,tableName,dbName , nowRightMenuRecord , indexName , indexData) {
    var indexTypeStore = new Ext.data.Store({
        fields:['data' , 'label'],
        data:[
            {"data" : "NORMAL" , "label" : "Normal"},
            {"data" : "UNIQUE" , "label" : "Unique"},
            {"data" : "FULLTEXT" , "label" : "Full Text"},
            {"data" : "PRIMARY" , "label" : $pub.primaryKey}
        ]
    });
    var indexMethodStore = new Ext.data.Store({
        fields:['data' , 'label'],
        data:[
            {"data" : "" , label : "--"},
            {"data" : "BTREE" , "label" : "BTREE"},
            {"data" : "HASH" , "label" : "HASH"}
        ]
    });
    var form = new IDB.FormPanel({
        height:120 ,
        region:'north',
        defaults:{
            width:450,
            labelWidth:120,
            allowBlank:true
        },
        items:[

            {
                fieldLabel: $tableEdit.indexName.title,
                padding:'3 0 3 0',
                allowBlank:false,
                blankText: $tableEdit.msg.indexNameCannotBeEmpty,
                name:'name'
            },{
                fieldLabel: $tableEdit.indexType,
                xtype:'combo',
                name:'type',
                triggerAction:'all',
                displayField:'label',
                valueField:'data',
                queryMode:'local',
                forceSelection:true,
                value:'NORMAL',
                typeAhead:true,
                store:indexTypeStore,
                listeners:{
                    select:function(thiz,records) {
                        var v = records[0].get('data');
                        typeControl(v);
                    }
                }
            },{
                fieldLabel: $tableEdit.indexMethod,
                xtype:'combo',
                name:'method',
                triggerAction:'all',
                displayField:'label',
                valueField:'data',
                queryMode:'local',
                forceSelection:true,
                value:'BTREE',
                typeAhead:true,
                store:indexMethodStore
            }
        ]
    });
    var realForm = form.getForm();
    var typeControl = function(v) {
        var indexName = realForm.findField('name');
        var indexMethod = realForm.findField('method');
        if(v === 'PRIMARY') {
            indexName.disable();
            indexMethod.disable();
        }else if(v === 'FULLTEXT') {
            indexName.enable();
            indexMethod.disable();
        }else {
            indexName.enable();
            indexMethod.enable();
        }
    };
    var selectStore = new Ext.data.Store({
        fields:['data'],
        data:columns,
        proxy: {
            type: 'memory'
        }
    });
    var cellEditing = new Ext.grid.plugin.CellEditing({
        clicksToEdit:1
    });
    var grid = new Ext.grid.Panel({
        title: $tableEdit.containsColumns,
        margin:'1 0 0 0',
        region:'center',
        selType:'rowmodel',
        viewConfig:{ stripeRows:true, enableTextSelection:true},
        plugins:[
            cellEditing
        ],
        columns:[
            {xtype: 'rownumberer'},
            {text: $pub.columnName,  dataIndex: 'data' ,sortable:false ,flex:1, editor:{
                xtype:'combo',
                triggerAction:'all',
                displayField:'data',
                valueField:'data',
                queryMode:'local',
                forceSelection:true,
                typeAhead:true,store:selectStore,allowBlank:false
            }},
            {text: $tableEdit.prefixLength , dataIndex:'length' , sortable:false , width:120 ,editor:{
                xtype:'numberfield',allowDecimals:false,
                minValue:0,
                negativeText: $pub.noNegative,
                nanText: $pub.invalidNumber
            }}
        ],
        store:new Ext.data.Store({
            fields:['data','length'],
            data:[],
            proxy: {
                type: 'memory'
            }
        }),
        listeners:{
            afterrender:function(grid) {
                appendGridRows(1 , grid);
            }
        }
    });
    if(indexData) {
        var record = new IndexEditRecord(indexData);
        form.loadRecord(record);
        var indexColumnStr = indexData.columns;
        var indexColumnArray = getIndexColumnArrayByDefine(indexColumnStr , columns);
        grid.store.loadData(indexColumnArray);
        typeControl(indexData.type);
    }

    var win = new IDB.Window({
        height:460 ,
        width:500 ,
        closable:true,
        title : $tableEdit.addIndex,
        layout:'border',
        items:[form,grid],
        buttonAlign:'center',
        buttons:[
            {
                text:'+',width:40,handler:function() {
                    appendGridRows(1 , grid);
                }
            },
            {
                text:'-',width:40,handler:function() {
                    removeSelectedRows(grid);
                }
            },
            {
                text: $pub.save, handler:function() {
                    cellEditing.completeEdit();
                    if(form.isValid()) {
                        var v = '' , columnsSet = {};
                        grid.store.each(function(row) {
                            var value = row.get('data');
                            var length = row.get('length');
                            if(value && !columnsSet[value]) {
                                columnsSet[value] = '1';
                                v += row.get('data');
                                if(length) {
                                    v += '(' + length + ')';
                                }
                                v += ',';
                            }
                        });
                        if(v) {
                            v = v.substring(0 , v.length - 1);
                        }else {
                            return Ext.Msg.alert($pub.prompt , $tableEdit.msg.selectOneIndexAtLeast);
                        }
                        var params = realForm.getValues();
                        params.columns = v;
                        params.tableName = tableName;
                        params.dbName = dbName;
                        params.oldIndexName = indexName;
                        Ext.getBody().mask($pub.buildingScript);
                        ajax({
                            url:'/structure/table/showIndexesChangeScript.do',
                            params:params,
                            success:function(resp) {
                                Ext.getBody().unmask();
                                var json = jsonDecode(resp.responseText);
                                var option = (indexName ? "AlterIndex" : "AddIndex");
                                if(json.success) {
                                    showExecuteSQL(json.root[0] , dbName , option , win , nowRightMenuRecord);
                                }else {
                                    Ext.Msg.alert($pub.error, json.root);
                                }
                            },
                            failure:function() {
                                Ext.getBody().unmask();
                            }
                        });
                    }
                }
            },{
                text: $pub.cancel, handler:function() {
                    win.close();
                }
            }
        ]
    });
};
var convertColumnArrayToMap = function(columnArray) {
    var map = {};
    Ext.each(columnArray , function(row) {
        map[row['data']] = "1";
    });
    return map;
};
var getIndexColumnArrayByDefine = function(v,columnArray) {
    if(!v) return [];
    var map = convertColumnArrayToMap(columnArray);
    var array = v.split(',');
    var valueArray = [];
    Ext.each(array , function(row) {
        var begin = row.indexOf("(") , end = row.indexOf(")");
        if(begin !== - 1 && end !== -1)  {
            var columnName = Ext.String.trim(row.substring(0 , begin));
            if(map[columnName]) {
                var length = row.substring(begin + 1 , end);
                valueArray.push({data:columnName , length : length});
            }
        }else {
            if(map[row]) {
                valueArray.push({data:row});
            }
        }
    });
    return valueArray;
};
function cleanSql(sql) {
    sql = Ext.String.trim(sql);
    if (sql.slice(-1) == ';') {
        sql = sql.slice(0, sql.length - 1);
    }
    return sql;
}

function splitSql(istr, delimiter) {
    var sqlList = new Array();
    var i = 0;
    var pos1 = 0;
    var curr_status;
    if (!delimiter) {
        delimiter = ';';
    }
    var delimiterLength = delimiter.length;
    var lastSqlPos=0;
    while (i < istr.length) {
        if (istr.charAt(i) == "\\") {
            i++;
        } else if (curr_status == "string") {
            if (istr.charAt(i) == "'") {
                if (istr.charAt(i + 1) == "'") {
                    i++;
                } else {
                    curr_status = null;
                }
            }
        } else if (curr_status == "string1") {
            if (istr.charAt(i) == "\"") {
                if (istr.charAt(i + 1) == "\"") {
                    i++;
                } else {
                    curr_status = null;
                }
            }
        } else if (curr_status == "word") {
            if (istr.charAt(i) == "`") {
                if (istr.charAt(i + 1) == "`") {
                    i++;
                } else {
                    curr_status = null;
                }
            }
        } else if ((curr_status == "comment")) {
            if (istr.charAt(i) == '\n') {
                curr_status = null;
                //sqlList.push(Ext.String.trim(istr.slice(lastSqlPos, i + 1)));
                //i++;
                lastSqlPos = i;
            }
        } else if ((curr_status == "comment1")) {
            if ((istr.charAt(i) == "*") && (istr.charAt(i + 1) == "/")) {
                curr_status = null;
                i++;
                //sqlList.push(Ext.String.trim(istr.slice(lastSqlPos, i + 1)));
                i++;
                //lastSqlPos = i + 1;
            }
        } else if (istr.charAt(i) == "'") {
            curr_status = 'string';
        } else if (istr.charAt(i) == "`") {
            curr_status = 'word';
        } else if (istr.charAt(i) == "\"") {
            curr_status = 'string1';
        } else if (istr.charAt(i) == "#") {
            curr_status = 'comment';
        } else if ((istr.charAt(i) == "/") && (istr.charAt(i + 1) == "*")) {
            curr_status = 'comment1';
            i++;
        }else if((istr.charAt(i) == "-") && (istr.charAt(i + 1) == "-")) {
            curr_status = 'comment';
            i++;
        } else if ((istr.slice(i,i+9).toLowerCase() == "delimiter")) {
            if (Ext.String.trim(istr.slice(lastSqlPos,i+10).toLowerCase()) == "delimiter") {
                var enterPos=istr.indexOf('\n',i+9);
                if (enterPos>0) {
                    delimiter=Ext.String.trim(istr.slice(i+9,enterPos));
                    if (!delimiter) {
                        delimiter=';';
                    }
                    delimiterLength = delimiter.length;
                    var sql = Ext.String.trim(istr.slice(i, enterPos));
                    sqlList.push(sql);
                    i=enterPos;
                    lastSqlPos = enterPos + 1;
                    pos1 = i;
                }else {
                    delimiter=Ext.String.trim(istr.substring(i+9));
                    if (!delimiter) {
                        delimiter=';';
                    }
                    delimiterLength = delimiter.length;
                    var sql = Ext.String.trim(istr.substring(i));
                    sqlList.push(sql);
                    i=istr.length;
                    lastSqlPos = i;
                    pos1 = i;
                }
            }/*else {
                alert(Ext.String.trim(istr.slice(lastSqlPos,i+10).toLowerCase()));
            }*/
        } else if(istr.substr(i, 6).toLowerCase() == "create" && istr.substr(i, 160).toLowerCase().match(/create[  ]+[ \w]+?[  ]+function[  ]+.*?[  ]+as[  ]+\$\$/)) {

            var $$PosBegin = istr.indexOf('$$', i + 15);
            if ($$PosBegin > 0) {
                var $$PosEnd = istr.indexOf('$$', $$PosBegin + 2);
                if($$PosEnd > 0) {
                    var semiColonAfter$$End = istr.indexOf(';', $$PosEnd + 2);
                    if(semiColonAfter$$End < 0) {
                        semiColonAfter$$End = istr.length - 1;
                    }
                    var nextPos = semiColonAfter$$End + 1;
                    var functionDeclaration = istr.substring(i, nextPos);
                    sqlList.push(functionDeclaration);
                    i = nextPos;
                    lastSqlPos = i;
                    pos1 = i;
                }
            }
        } else if (istr.slice(i, i + delimiterLength) == delimiter) {
            if (delimiter == ';') {
                var sql = Ext.String.trim(istr.slice(pos1, i + 1));
            } else {
                var sql = Ext.String.trim(istr.slice(pos1, i));
            }
            sqlList.push(sql);
            i = i + delimiterLength;
            lastSqlPos = i;
            pos1 = i;
        }
        i++;
    }
    var sql = Ext.String.trim(istr.slice(pos1, i + 1));
    if (sql) {
        sqlList.push(sql);
        lastSqlPos=i;
    }
    return sqlList;
}
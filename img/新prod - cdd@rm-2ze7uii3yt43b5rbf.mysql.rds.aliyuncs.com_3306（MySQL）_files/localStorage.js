/* add for local storage*/
var local_storage_key_name = "___DMS_CLIENT_LOGIN_TOKEN___";
function readLocalStorageCookie(key) { 
    var arr,reg=new RegExp("(^| )"+key+"=([^;]*)(;|$)");
 
    if(arr=document.cookie.match(reg))
 
        return unescape(arr[2]); 
    else 
        return null; 
} 
function writeLocalStorageCookie(key,value) { 
	var Days = 365;
	var exp = new Date();
	exp.setTime(exp.getTime() + Days*24*60*60*1000);
	document.cookie = key + "="+ escape (value) + ";expires=" + exp.toGMTString();
} 
function removeLocalStorageCookie(key) 
{ 
    var exp = new Date(); 
    exp.setTime(exp.getTime() - 1); 
    var cval=readLocalStorageCookie(key); 
    if(cval!=null) 
        document.cookie= key + "="+cval+";expires="+exp.toGMTString(); 
} 

function setLocalStorage(key,value,way) {
	if(window.localStorage){
		if("addReplaceDuplicate" == way || ("addIgnoreDuplicate" == way && localStorage.getItem(key) == null)){
			 localStorage.setItem(key,value);
		}
		return localStorage.getItem(key);
	}else{
		if("addReplaceDuplicate" == way || ("addIgnoreDuplicate" == way && readLocalStorageCookie(key) == null)){
			writeLocalStorageCookie(key,value);
		}
		return readLocalStorageCookie(key);
	}
}
function getLocalStorage(key){
	var _res;
	if(window.localStorage){
		_res =  localStorage.getItem(key);
	}else{
		_res =  readLocalStorageCookie(key);
	}
	if(!_res){
		return "";
	}
	return _res;
}
//添加本地存储
function addLocalStorage(key,value){
	//如果重复，就不要去覆盖了
	return setLocalStorage(key,value,"addIgnoreDuplicate");
}
//删除本地存储
function delLocalStorage(key){
	if(window.localStorage){
		if(localStorage.getItem(key) != null){
			 localStorage.removeItem(key);
		}
	}else{
		removeLocalStorageCookie(key);
	}
}
var SimpleStorageUtils = {
    set : function(key , value) {
        if(localStorage) {
            localStorage.setItem(key , value);
        }
    },
    get : function(key) {
        if(localStorage) {
            return localStorage.getItem(key);
        }else {
            return null;
        }
    },
    getByDefault : function(key , defaultV) {
        if(localStorage) {
            return localStorage.getItem(key) || defaultV;
        }else {
            return defaultV;
        }
    },
    remove : function(key) {
        if(localStorage) {
            return localStorage.removeItem(key);
        }
    }
};

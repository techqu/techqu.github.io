
 本文介绍了常用的JDK的命令行工具

<!--more-->
内容出自：
{{< douban 9787111421900>}}
## 一、jps:虚拟机进程状况工具

jsp命令格式：
```bash
jps [options]  [hostid]
```
## 二、jstat：虚拟机统计信息监视工具

jstat命令格式为：
```bash
jstat[option vmid [interval[s|ms] [count]]]
```

如果是本地虚拟机进程，VMID与LVMID是一致的，如果是远程虚拟机进程，那VMID的格式应当是：
```bash
[protocol：][//]lvmid[@hostname[：port]/servername]
```
参数interval和count代表查询间隔和次数，如果省略这两个参数，说明只查询一次。

假设需要每250毫秒查询一次进程2764垃圾收集状况，一共查询20次，
那命令应当是：
```bash
jstat -gc 2764 250 20
```

jstat各参数含义：
![jstat-options](/img/jstat-options.png)


```bash
#jstat执行样例：结果如图
jstat -gcutil 2764
```
![jstat-gcutil](/img/jstat-gcutil.png)


## 三、jinfo：java配置信息工具
## 四、jmap：java内存映像工具
## 五、jhat：虚拟机堆转储快照分析工具
## 六、jstack：Java堆栈跟踪工具
## 七、HSDIS：JIT生成代码反汇编

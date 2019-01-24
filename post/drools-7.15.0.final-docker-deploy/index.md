基于 Drools 可以构建一个全面的业务自动化平台，用于业务规则管理，业务资源优化和复杂事件处理（CEP）。组织或企业可以将复杂的决策逻辑整合到业务线应用程序中，并在市场条件发生变化时快速更新基础业务规则，有效提高业务的能力
<!--more-->

## 一、docker尝鲜
1.拉取基础镜像，命令如下：

  ```shell
  docker run -p 8080:8080 -p 8001:8001 -d --name drools-workbench jboss/drools-workbench-showcase:7.15.0.Final
  docker run -p 8180:8080 -d --name kie-server --link drools-workbench:kie_wb jboss/kie-server-showcase:7.15.0.Final
  ```
2.已经可以访问了，http://localhost:8080/drools-wb


## 二、实践问题

### 1.drools中文规则乱码问题

由于我使用的是7.15.0版本，dockerfile中默认添加了JVM的文件编码格式`-Dfile.encoding=UTF-8`,所以没有此问题了。

### 2.容器时区问题

由于docker中默认是零时区，需要在dockerfile中设置容器的时区，内容如下
```Dockerfile
RUN ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo 'Asia/Shanghai' > /etc/timezone
```

### 3.drools规则持久化保存

由于Docker默认设置，一旦移除了容器，该容器中的数据也将被删除,如果需要删除并创建新的工作台容器，则会出现问题。

默认情况下，工作台容器的内部GIT根目录位于 `/opt/jboss/wildfly/bin/.niogit`，因此您可以通过使用docker 的 volumne 机制来使此目录在docker中保持不变：

挂载目录，centos下创建`/home/myuser/web_git/mygit`，修改文件夹及其子文件夹文件权限，命令如下：

```shell
chomd -R 777 home/;
```
```shell
# Use -v :
docker run -p 8080:8080 -p 8001:8001 -v /home/myuser/wb_git:/opt/jboss/wildfly/bin/.niogit:Z -d --name drools-workbench jboss/drools-workbench-showcase:7.15.0.Final
```

如上面的命令，现在你的workbench git存储库将在你的本地文件系统路径 `/home/myuser/wb_git` 中持久化。 因此，如果您删除此容器并使用相同的共享卷启动一个新容器，您也可以在新工作台的容器中找到所有数据。


## 三、完整部署流程

完整的dockerfile如下

```dockerfile
From jboss/drools-workbench-showcase:7.15.0.Final

####JVM最大堆内存调大#####
ENV JAVA_OPTS -Xms256m -Xmx4096m -Djava.net.preferIPv4Stack=true -Dfile.encoding=UTF-8

# Added files are chowned to root user, change it to the jboss one.
USER root

###docker容器时间同步配置####
RUN ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo 'Asia/Shanghai' > /etc/timezone

```

1.构建镜像，命令如下：
```shell
##--rm :设置镜像成功后删除中间容器；
docker build -rm -t drools-workbench:MyTag .
```
2.启动镜像，命令如下：
```shell
docker run -p 8080:8080 -p 8001:8001 -v /home/myuser/wb_git:/opt/jboss/wildfly/bin/.niogit:Z -d --name drools-workbench drools-workbench:MyTag
```
3.浏览器访问，http://localhost:8080/drools-wb


>参考资料：

>   - [jboss/drools-workbench-showcase](https://hub.docker.com/r/jboss/drools-workbench-showcase)

>   - [jboss/kie-server-showcase](https://hub.docker.com/r/jboss/kie-server-showcase)

>   - [Drools 官方 Document](https://docs.jboss.org/drools/release/7.16.0.Final/drools-docs/html_single/index.html)
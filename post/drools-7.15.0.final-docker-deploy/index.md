


关于drools的相关介绍就不再赘述了，关于drools网上的资料都很少，或者都有些老了，最近折腾了一下，记录下安装部署的过程，希望能节省下大家的时间。
<!--more-->

## 一、快速部署
1.拉取基础镜像，命令如下：

  ```shell
  docker run -p 8080:8080 -p 8001:8001 -d --name drools-workbench jboss/drools-workbench-showcase:7.15.0.Final
  docker run -p 8180:8080 -d --name kie-server --link drools-workbench:kie_wb jboss/kie-server-showcase:7.15.0.Final
  ```
2.[点击访问](http://localhost:8080/drools-wb)，账号密码：admin/admin


## 二、问题

### 1.drools中文规则乱码问题

由于我使用的是7.15.0版本，dockerfile中默认添加了JVM的文件编码格式`-Dfile.encoding=UTF-8`,所以没有此问题了。

### 2.容器时区问题

由于docker中默认是零时区，需要在dockerfile中设置容器的时区，内容如下
```Dockerfile
RUN ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo 'Asia/Shanghai' > /etc/timezone
```

### 3.drools规则持久化保存

由于Docker默认设置，一旦移除了容器，该容器中的数据也将被删除,如果需要删除并创建新的工作台容器，则会出现问题。

默认情况下，工作台容器的内部GIT根目录位于 `/opt/jboss/wildfly/bin/.niogit`，因此你可以通过使用docker 的 volumne 机制来使此目录在docker中保持不变：

挂载目录，centos下创建`/home/myuser/web_git/mygit`，修改文件夹及其子文件夹文件权限，命令如下：

```shell
chmod -R 777 home/;
```
```shell
# Use -v :
docker run -p 8080:8080 -p 8001:8001 -v /home/myuser/wb_git:/opt/jboss/wildfly/bin/.niogit:Z -d --name drools-workbench jboss/drools-workbench-showcase:7.15.0.Final
```

如上面的命令，现在你的workbench git存储库将在你的本地文件系统路径 `/home/myuser/wb_git` 中持久化。 因此，如果你删除此容器并使用相同的共享卷启动一个新容器，你也可以在新工作台的容器中找到所有数据。

### 4.drools规则源文件如何拿到

比如我想下载 MySpace 空间中的 Mortgages 项目的源代码，使用ssh协议通过git下载即可，地址在 `MySpace-> Mortgages -> 设置  -> General Settings `的URL参数中。


如下图所示：

![drools-git-ssh](/img/drools-git-ssh.png)

```
git clone ssh://admin@localhost:8001/MySpace/example-Mortgages
```

用户名密码就是登陆workbench的用户名密码

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

### 1.构建镜像，命令如下：
```shell

docker build  -t drools-workbench:MyTag .
```
### 2.启动镜像，命令如下：
```shell
docker run -p 8080:8080 -p 8001:8001 -v /home/myuser/wb_git:/opt/jboss/wildfly/bin/.niogit:Z -d --name drools-workbench drools-workbench:MyTag
```
### 3.浏览器访问，http://localhost:8080/drools-wb


>参考资料：

>   - [jboss/drools-workbench-showcase](https://hub.docker.com/r/jboss/drools-workbench-showcase)

>   - [jboss/kie-server-showcase](https://hub.docker.com/r/jboss/kie-server-showcase)

>   - [Drools 官方 Document](https://docs.jboss.org/drools/release/7.16.0.Final/drools-docs/html_single/index.html)
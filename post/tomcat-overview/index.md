


## Tomcat Server的组成部分
### 1.1 – Server

A Server element represents the entire Catalina servlet container. (Singleton)

### 1.2 – Service

<!--more-->
A Service element represents the combination of one or more Connector components that share a single Engine

Service是这样一个集合：它由一个或者多个Connector组成，以及一个Engine，负责处理所有Connector所获得的客户请求

### 1.3 – Connector

一个Connector将在某个指定端口上侦听客户请求，并将获得的请求交给Engine来处理，从Engine处获得回应并返回客户。

TOMCAT有两个典型的Connector，一个直接侦听来自browser的http请求，一个侦听来自其它WebServer的请求

- Coyote Http/1.1 Connector 在端口8080处侦听来自客户browser的http请求
- Coyote JK2 Connector 在端口8009处侦听来自其它WebServer(Apache)的servlet/jsp代理请求

 

### 1.4 – Engine

- The Engine element represents the entire request processing machinery associated with a particular Service
- It receives and processes all requests from one or more Connectors
- and returns the completed response to the Connector for ultimate transmission back to the client

- Engine下可以配置多个虚拟主机Virtual Host，每个虚拟主机都有一个域名
- 当Engine获得一个请求时，它把该请求匹配到某个Host上，然后把该请求交给该Host来处理
- Engine有一个默认虚拟主机，当请求无法匹配到任何一个Host上的时候，将交给该默认Host来处理

### 1.5 – Host

 

- 代表一个Virtual Host，虚拟主机，每个虚拟主机和某个网络域名Domain Name相匹配
- 每个虚拟主机下都可以部署(deploy)一个或者多个Web App，每个Web App对应于一个Context，有一个Context path
- 当Host获得一个请求时，将把该请求匹配到某个Context上，然后把该请求交给该Context来处理
- 匹配的方法是“最长匹配”，所以一个path==”"的Context将成为该Host的默认Context，所有无法和其它Context的路径名匹配的请求都将最终和该默认Context匹配

### 1.6 – Context

- 一个Context对应于一个Web Application，一个Web Application由一个或者多个Servlet组成
- Context在创建的时候将根据配置文件$CATALINA_HOME/conf/web.xml和$WEBAPP_HOME/WEB-INF/web.xml载入Servlet类
- 当Context获得请求时，将在自己的映射表(mapping table)中寻找相匹配的Servlet类
- 如果找到，则执行该类，获得请求的回应，并返回

## Tomcat Server的结构图
![tomcat-server-structure](/img/tomcat-server-structure.gif)

## Tomcat处理一个http请求的过程


假设来自客户的请求为：

  http://localhost:8080/wsota/wsota_index.jsp

1. 请求被发送到本机端口8080，被在那里侦听的Coyote HTTP/1.1 Connector获得
  1.  Connector的主要任务是负责接收浏览器的发过来的 tcp 连接请求，创建一个 Request 和 Response 对象分别用于和请求端交换数据，然后会产生一个线程来处理这个请求并把产生的 Request 和 Response 对象传给处理这个请求的线程
2. Connector把该请求交给它所在的Service的Engine来处理，并等待来自Engine的回应
3. Engine获得请求localhost/wsota/wsota_index.jsp，匹配它所拥有的所有虚拟主机Host
4. Engine匹配到名为localhost的Host（即使匹配不到也把请求交给该Host处理，因为该Host被定义为该Engine的默认主机）
5. localhost Host获得请求/wsota/wsota_index.jsp，匹配它所拥有的所有Context
6. Host匹配到路径为/wsota的Context（如果匹配不到就把该请求交给路径名为”"的Context去处理）
7. path=”/wsota”的Context获得请求/wsota_index.jsp，在它的mapping table中寻找对应的servlet
8. Context匹配到URL PATTERN为*.jsp的servlet，对应于JspServlet类
9. 构造HttpServletRequest对象和HttpServletResponse对象，作为参数调用JspServlet的doGet或doPost方法
10. Context把执行完了之后的HttpServletResponse对象返回给Host
11. Host把HttpServletResponse对象返回给Engine
12. Engine把HttpServletResponse对象返回给Connector
13. Connector把HttpServletResponse对象返回给客户browser

## SpringMVC和Servlet区别对比

Servlet：性能最好，处理Http请求的标准。

SpringMVC：开发效率高（好多共性的东西都封装好了，是对Servlet的封装，核心的DispatcherServlet最终继承自HttpServlet）

这两者的关系，就如同MyBatis和JDBC，一个性能好，一个开发效率高，是对另一个的封装。


### 请求说明：
![tmp-servlet-process](/img/tmp-servlet-process.png)
一个请求进来经过前端控制器Dispatcher Servlet，这是前端的核心。一个请求的URL进来，经过Dispatcher Servlet转发，首先转发到Handler Mapping，

②Handler Mapping的作用就是完成对URL到Controller组件的映射，然后通过Dispatcher Servlet从Handlermapping查找处理request的Controller。

③ controller处理request请求后并返回ModelAndView对象，Controller是是springmvc中负责处理request的组件，ModelAndView是封装结果视图的组件。其后面的步骤就是将视图结果返回给客户端。

总结：上图除了Dispatcherservlet以外其他的都是相互独立，所有请求都经过这个核心控制器进行转发控制。   

### 总结：
 spring框架已经是java web开发很主流的框架，这个框架有很多优点当然也有它的不足之处，比于之前的servlet，它一定程度上简化了开发人员的工作，使用servlet的话需要每个请求都去在web.xml中配置一个servlet节点，而Spring 中的DispatcherServlet他会拦截所有的请求，进一步去查找有没有合适的处理器，一个前端控制器就可以。

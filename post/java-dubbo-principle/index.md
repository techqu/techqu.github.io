
<!--more-->

## 一、Duboo基本概念解释

[Dubbo](http://dubbo.apache.org) (incubating) |ˈdʌbəʊ| 是一款高性能、轻量级的开源Java RPC框架，它提供了三大核心能力：面向接口的远程方法调用，智能容错和负载均衡，以及服务自动注册和发现。

因此，dubbo除了可以提供服务之外，还可以实现软负载均衡。它还提供了两个功能Monitor 监控中心和调用中心。这两个是可选的，需要单独配置。

Dubbo的架构图如下：

![dubbo-architecture](/img/dubbo-architecture.png)

我们解释以下这个架构图：

如上图所示，一个抽象出来的基本框架，consumer和provider是框架中必然存在的，Registry做为全局配置信息管理模块，推荐生产环境使用Registry，可实时推送现存活的服务提供者，Monitor一般用于监控和统计RPC调用情况、成功率、失败率等情况，让开发及运维了解线上运行情况。

应用执行过程大致如下：

- 服务提供者启动，根据协议信息绑定到配置的IP和端口上，如果已有服务绑定过相同IP和端口的则跳过
- 注册服务信息至注册中心
- 客户端启动，根据接口和协议信息订阅注册中心中注册的服务，注册中心将存活的服务地址通知到客户端，当有服务信息变更时客户端可以通过定时通知得到变更信息
- 在客户端需要调用服务时，从内存中拿到上次通知的所有存活服务地址，根据路由信息和负载均衡机制选择最终调用的服务地址，发起调用
- 通过filter分别在客户端发送请求前和服务端接收请求后，通过异步记录一些需要的信息传递到monitor做监控或者统计


## 二、dubbo原理

官方文档：http://dubbo.apache.org/zh-cn/docs/dev/design.html

![dubbo-framework.jpg](/img/dubbo-framework.jpg)

1. 首先把这张图拆分成三块，首先是服务端剖去网络传输模块，也就是大图中的右上角。

2. 客户端模块与服务端模块比较类似，只是刚好反过来，一个是暴露服务，一个是引用服务，然后客户端多出路由和负载均衡。

3. 从exchange往下都是算网络传输，包括做序列化、反序列化，使用Netty等IO框架发送接收消息等逻辑

### I、初始化过程细节： 
上图中的第一步start，就是将服务装载容器中，然后准备注册服务。和Spring中启动过程类似，spring启动时，将bean装载进容器中的时候，首先要解析bean。所以dubbo也是先读配置文件解析服务。 



### 解析服务： 

入口就是各种dubbo配置项的解析，`<dubbo:xxx />`都是spring namespace，可以看到dubbo jar包下META-INF里面的spring.handlers，自定义的spring namespace处理器。
对于spring不太熟的同学可以先了解下这个功能，入口都在这里，解析成功后每个`<dubbo:xxx />`配置项都对应一个spring实例。

1. 基于`dubbo.jar`内的`Meta-inf/spring.handlers`配置，spring在遇到dubbo名称空间时，会回调`DubboNamespaceHandler`类。 
 
2. 所有的dubbo标签，都统一用`DubboBeanDefinitionParser`进行解析，基于一对一属性映射，将XML标签解析为Bean对象。 

源码截图： 
在ServiceConfig.export 或者ReferenceConfig.get 初始化时，将Bean对象转会为url格式，将所以Bean属性转成url的参数。 

然后将URL传给Protocol扩展点，基于扩展点的Adaptive机制，根据URL的协议头，进行不同协议的服务暴露和引用。 

### 暴露服务：



#### a、 只暴露服务端口

在没有使用注册中心的情况，这种情况一般适用在开发环境下，服务的调用这和提供在同一个IP上，只需要打开服务的端口即可。 
即，当配置 or 
ServiceConfig解析出的URL的格式为： 
`Dubbo：//service-host/com.xxx.TxxService?version=1.0.0 `
基于扩展点的Adaptiver机制，通过URL的“dubbo：//”协议头识别，直接调用DubboProtocol的export（）方法，打开服务端口。

#### b、向注册中心暴露服务：

和上一种的区别：需要将服务的IP和端口一同暴露给注册中心。 
ServiceConfig解析出的url格式为： 
`registry://registry-host/com.alibaba.dubbo.registry.RegistryService?export=URL.encode(“dubbo://service-host/com.xxx.TxxService?version=1.0.0”)`

基于扩展点的Adaptive机制，通过URL的“`registry：//`”协议头识别，调用RegistryProtocol的export方法，将export参数中的提供者URL先注册到注册中心，再重新传给Protocol扩展点进行暴露： 
`Dubbo：//service-host/com.xxx.TxxService?version=1.0.0`

### 引用服务：

#### a、直接引用服务：

在没有注册中心的，直连提供者情况下， 
ReferenceConfig解析出的URL格式为： 
Dubbo：//service-host/com.xxx.TxxService?version=1.0.0

基于扩展点的Adaptive机制，通过url的“dubbo：//”协议头识别，直接调用DubboProtocol的refer方法，返回提供者引用。

#### b、从注册中心发现引用服务：

此时，ReferenceConfig解析出的URL的格式为： 
registry://registry-host/com.alibaba.dubbo.registry.RegistryService?refer=URL.encode(“consumer://consumer-host/com.foo.FooService?version=1.0.0”)

基于扩展点的Apaptive机制，通过URL的“registry：//”协议头识别，就会调用RegistryProtocol的refer方法，基于refer参数总的条件，查询提供者URL，如： 
Dubbo：//service-host/com.xxx.TxxService?version=1.0.0

基于扩展点的Adaptive机制，通过提供者URL的“dubbo：//”协议头识别，就会调用DubboProtocol的refer（）方法，得到提供者引用。 
然后RegistryProtocol将多个提供者引用，通过Cluster扩展点，伪装成单个提供这引用返回。

## 三、远程调用细节：

服务提供者暴露一个服务的详细过程：

![java-dubbo-rpc-01](/img/java-dubbo-rpc-01.png)


上图是服务提供者暴露服务的主过程： 
首先ServiceConfig类拿到对外提供服务的实际类ref，然后将ProxyFactory类的getInvoker方法使用ref生成一个AbstractProxyInvoker实例，到这一步就完成具体服务到invoker的转化。接下来就是Invoker转换到Exporter的过程。 

Dubbo处理服务暴露的关键就在Invoker转换到Exporter的过程，下面我们以Dubbo和rmi这两种典型协议的实现来进行说明： 

Dubbo的实现： 

Dubbo协议的Invoker转为Exporter发生在DubboProtocol类的export方法，它主要是打开socket侦听服务，并接收客户端发来的各种请求，通讯细节由dubbo自己实现。 

Rmi的实现： 

RMI协议的Invoker转为Exporter发生在RmiProtocol类的export方法，他通过Spring或Dubbo或JDK来实现服务，通讯细节由JDK底层来实现。

服务消费者消费一个服务的详细过程

![java-dubbo-rpc-02](/img/java-dubbo-rpc-02.png)

上图是服务消费的主过程： 

首先ReferenceConfig类的init方法调用Protocol的refer方法生成Invoker实例。接下来把Invoker转为客户端需要的接口

--------------------- 

> 原文：https://blog.csdn.net/chao_19/article/details/51764150 

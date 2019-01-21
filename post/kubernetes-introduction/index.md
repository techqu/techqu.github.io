首先，Kubernetes项目要解决的问题是什么？

编排？调度？容器云？还是集群管理？

对于大多数用户来说，他们希望Kubernetes项目带来的体验是确定的：现在我有了应用的容器镜像，请帮我在一个给定的集群上把这个应用运行起来。更进一步地说，我还希望Kubernetes能给我提供路由网关、水平扩展、监控、备份、灾难恢复等一系列运维能力。这不就是经典Paas（比如，Cloud Foundry）项目的能力吗?

<!--more-->
而且，有了Docker之后，我根本不需要什么Kubernetes、Paas，只要用Docker公司的Compose+Swarm项目，就完全可以很方便地DIY这些功能了!

所以说，如果Kubernetes项目，只是停留在拉取用户镜像、运行容器，以及常见的运维功能的话，那么别说跟“原生”的Docker Swarm项目竞争了，哪怕跟经典的Paas项目相比也难有什么优势可言


Kubernetes项目正式依托着Borg项目的理论优势，才在短短几个月内迅速站稳了脚跟，进而确定了一个如图所示的全局架构：

![kubernetes](/img/k8s-architecture.png)

我们可以看到，Kubernetes 项目的架构，跟它的原型项目 Borg 非常类似，都由 Master 和 Node 两种节点组成，而这两种角色分别对应着控制节点和计算节点。

其中，控制节点，即 Master 节点，由三个紧密协作的独立组件组合而成，它们分别是负责 API 服务的 **kube-apiserver**、负责调度的 **kube-scheduler**，以及负责容器编排的 **kube-controller-manager**。整个集群的持久化数据，则由 kube-apiserver 处理后保存在 Etcd 中。

//TODO
未完待续。。。


所以说，Kubernetes 项目的本质，是为用户提供一个具有普遍意义的容器编排工具。

不过，更重要的是，Kubernetes 项目为用户提供的不仅限于一个工具。它真正的价值，乃在于提供了一套基于容器构建分布式系统的基础依赖。



Kubernetes项目核心功能“全景图”

![kubernetes-features](/img/k8s-features.png)

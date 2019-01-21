 全文出自《深入理解java虚拟机》第三章。 垃圾收集器与内存分配策略。包含三部分内容：如何判断哪些对象需要回收，如何回收和一些常见的垃圾收集器。

<!--more-->

### 一、如何判断哪些对象需要回收？
1. 引用计数法（缺陷：互相引用，无法回收）
2. 可达性分析算法
    - 可作为GC Roots的对象
        - 虚拟机栈（栈帧中的本地变量表）中引用的对象
        - 方法区中类静态属性引用的对象
        - 方法区中常量引用的对象
        - 本地方法栈中JNI（即一般说的Native方法）引用的对象
- 引用的几种
    - 强引用
    - 软引用
    - 弱引用
    - 虚引用

### 二、如何回收（垃圾收集算法）
#### 1.标记-清除算法（Mark-Sweep）
1. 标记出所有需要回收的对象，在标记完成后统一回收所有被标记的对象
2. 在标记完成后统一回收所有被标记的对象

缺点：

1. 一个是效率问题，标记和清除两个过程的效率都不高；
2. 另一个是空间问题，标记清除之后会产生大量不连续的内存碎片，空间碎片太多可能会导致以后在程序运行过程中
需要分配较大对象时，无法找到足够的连续内存而不得不提前触发另一次垃圾收集动作。

![mark-sweep](/img/mark-sweep.png)

#### 2.复制算法（Copying）

1. 将可用内存按容量划分为大小相等的两块，每次只使用其中的一块。
2. 当这一块的内存用完了，就将还存活着的对象复制到另外一块上面，然后再把已使用过的内存空间一次清理掉。

**优点：**这样使得每次都是对整个半区进行内存回收，内存分配时也就不用考虑内存碎片等
复杂情况，只要移动堆顶指针，按顺序分配内存即可，实现简单，运行高效。只是这种算法的代价是将内存缩小为
了原来的一半，未免太高了一点。

**缺点：**复制收集算法在对象存活率较高时就要进行较多的复制操作，效率将会变低

![copying](/img/copying.png)


#### 3.标记-整理算法（Mark-Compact）
1. 标记
2. 让所有存活的对象都向一端移动，然后直接清理掉端边界以外的内存

![mark-compact](/img/mark-compact.png)

#### 4.分代收集算法（Generational Collection）
1. 根据对象存活周期的不同将内存划分为几块。
2. 一般是把Java堆分为新生代和老年代，这样就可以根据各个年代的特点采用最适当的收集算法。
3. 在新生代中，每次垃圾收集时都发现有大批对象死去，只有少量存活，那就选用复制算法，只需要付出少量存活对象的复制成本就可以完成收集。
4. 老年代中因为对象存活率高、没有额外空间对它进行分配担保，就必须使用“标记—清理”或者“标记—整理”算法来进行回收。


### 三、Minor GC、Major GC和Full GC之间的区别

1. Minor GC：只回收新生代，所有的 Minor GC 都会触发“（stop-the-world）”
2. Major GC：只回收永久代
3. Full GC： 回收整个堆。相当于 Minor GC + Major GC

### 四、垃圾收集器

![类加载过程](/img/gc.jpeg)



#### 1.Serial收集器
1. 简单高效。
1. 单线程、stop the world（停止所有工作线程）。
1. 适合client模式的虚拟机

#### 2.Serial Old 收集器
1. Serial收集器的老年代版本，单线程，使用标记-整理算法。
2. 主要是Client模式下的虚拟机使用。
3. 如果在Server模式下，那么它主要还有两大用途：
    - 一种用途是在JDK 1.5以及之前的版本中与Parallel Scavenge收集器搭配使用[1]，
    - 另一种用途就是作为CMS收集器的后备预案，在并发收集发生Concurrent Mode Failure时使用。

![serial-old](/img/serial-old.png)
#### 3.ParNew收集器
1. Serial收集器的多线程版本
2. 单CPU不如Serial
3. **Server模式下新生代首选**,目前只有它能与CMS收集器配合工作
4. 使用-XX：+UseConcMarkSweepGC选项后的默认新生代收集器，也可以使用-XX：+UseParNewGC选项来强制指定它。
5. -XX：ParallelGCThreads：限制垃圾收集的线程数。

![parNew-serial-old](/img/parNew-serial-old.png)
#### 4. Parallel Scavenge收集器
1. 吞吐量优先”收集器
2. 新生代收集器，复制算法，并行的多线程收集器,这些和ParNew收集器都一样,不同：关注点不同。又叫“吞吐量优先”收集器
3. 目标是达到一个可控制的吞吐量（Throughput）。而CMS等收集器的关注点是尽可能地缩短垃圾收集时用户线程的停顿时间。
4. 吞吐量=运行用户代码时间/（运行用户代码时间+垃圾收集时间），虚拟机总共运行了100分钟，其中垃圾收集花掉1分钟，那吞吐量就是99%。
5. 两个参数用于精确控制吞吐量:
-XX：MaxGCPauseMillis是控制最大垃圾收集停顿时间
-XX：GCTimeRatio直接设置吞吐量大小
-XX：+UseAdaptiveSizePolicy:动态设置新生代大小、Eden与Survivor区的比例、晋升老年代对象年龄
6. 并行（Parallel）：指多条垃圾收集线程并行工作，但此时用户线程仍然处于等待状态。
7. 并发（Concurrent）：指用户线程与垃圾收集线程同时执行（但不一定是并行的，可能会交替执行），用户
程序在继续运行，而垃圾收集程序运行于另一个CPU上。

#### 5.Parallel Old收集器
1. Parallel Scavenge收集器的老年代版本，使用多线程和“标记-整理”算法。
2. 在注重吞吐量以及CPU资源敏感的场合，都可以优先考虑Parallel Scavenge加Parallel Old收集器。

![parallel-scavenge-old](/img/parallel-scavenge-old.png)
---

#### 6.CMS（Concurrent Mark Sweep） 收集. 
1. 以获取最短回收停顿时间为目标的收集器。
2. 非常符合互联网站或者B/S系统的服务端上，重视服务的响应速度，希望系统停顿时间最短的应用
3. 基于“标记—清除”算法实现的
4. CMS收集器的内存回收过程是与用户线程一起并发执行的
5. 它的运作过程分为4个步骤，包括：
       - 初始标记，“Stop The World”，只是标记一下GC Roots能直接关联到的对象，速度很快
       - 并发标记，并发标记阶段就是进行GC RootsTracing的过程
       - 重新标记，Stop The World”，是为了修正并发标记期间因用户程序继续运作而导致标记产生变动的那一部分对象的标记记录，但远比并发标记的时间短
       - 并发清除（CMS concurrent sweep）
6. 优点：并发收集、低停顿
7. 缺点：
           - 对CPU资源非常敏感。
           - 无法处理浮动垃圾，可能出现“Concurrent Mode Failure”失败而导致另一次Full GC的产生。
           - 一款基于“标记—清除”算法实现的收集器
           
![concurrent-mark-sweep](/img/concurrent-mark-sweep.png)
       
            
#### 7.G1（Garbage-First）收集器
1. 当今收集器技术发展的最前沿成果之一
2. G1是一款面向服务端应用的垃圾收集器。
3. 优点：
       - 并行与并发：充分利用多CPU、多核环境下的硬件优势
       - 分代收集：不需要其他收集器配合就能独立管理整个GC堆
       - 空间整合：“标记—整理”算法实现的收集器，局部上基于“复制”算法不会产生内存空间碎片            
       - 可预测的停顿：能让使用者明确指定在一个长度为M毫秒的时间片段内，消耗在垃圾收集上的时间不得超过N毫秒
4. G1收集器的运作大致可划分为以下几个步骤：
       - 初始标记：标记一下GC Roots能直接关联到的对象，需要停顿线程，但耗时很短
       - 并发标记：是从GC Root开始对堆中对象进行可达性分析，找出存活的对象，这阶段耗时较长，但可与用户程序并发执行
       - 最终标记：修正在并发标记期间因用户程序继续运作而导致标记产生变动的那一部分标记记录
       - 筛选回收：对各个Region的回收价值和成本进行排序，根据用户所期望的GC停顿时间来制定回收计划
       
![g1](/img/g1.png)

    
#### 8.垃圾收集器参数总结

   收集器设置：
   
    -XX:+UseSerialGC:年轻串行（Serial），老年串行（Serial Old）
    -XX:+UseParNewGC:年轻并行（ParNew），老年串行（Serial Old）
    -XX:+UseConcMarkSweepGC:年轻并行（ParNew），老年串行（CMS），备份（Serial Old）
    -XX:+UseParallelGC:年轻并行吞吐（Parallel Scavenge），老年串行（Serial Old）
    -XX:+UseParalledlOldGC:年轻并行吞吐（Parallel Scavenge），老年并行吞吐（Parallel Old）
    
   收集器参数：
    
    -XX:ParallelGCThreads=n:设置并行收集器收集时使用的CPU数。并行收集线程数。
    -XX:MaxGCPauseMillis=n:设置并行收集最大暂停时间
    -XX:GCTimeRatio=n:设置垃圾回收时间占程序运行时间的百分比。公式为1/(1+n)
    -XX:+CMSIncrementalMode:设置为增量模式。适用于单CPU情况。
    -XX:ParallelGCThreads=n:设置并发收集器年轻代收集方式为并行收集时，使用的CPU数。并行收集线程数。


![gc-options-1](/img/gc-options-1.png)
![gc-options-2](/img/gc-options-2.png)

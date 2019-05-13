
<!--more-->

在Java中，保存数据有两种比较简单的数据结构：数组和链表。数组的特点是：寻址容易，插入和删除困难；而链表的特点是：寻址困难，插入和删除容易。上面我们提到过，常用的哈希函数的冲突解决办法中有一种方法叫做链地址法，其实就是将数组和链表组合在一起，发挥了两者的优势，我们可以将其理解为链表的数组。


**静态成员变量**

- HashMap中size表示当前共有多少个KV对
- capacity表示当前HashMap的容量是多少，默认值是16，每次扩容都是成倍的。
- loadFactor是装载因子，当Map中元素个数超过loadFactor* capacity的值时，会触发扩容。
- loadFactor* capacity可以用threshold表示。


```java
/**
  * 默认初始大小，值为16，要求必须为2的幂
  */
 static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16
 
 /**
  * 最大容量，必须不大于2^30
  */
 static final int MAXIMUM_CAPACITY = 1 << 30;

/**
 * 默认加载因子，值为0.75
 */
static final float DEFAULT_LOAD_FACTOR = 0.75f;

/**
 * hash冲突默认采用单链表存储，当单链表节点个数大于8时，会转化为红黑树存储
 */
static final int TREEIFY_THRESHOLD = 8;

/**
 * hash冲突默认采用单链表存储，当单链表节点个数大于8时，会转化为红黑树存储。
 * 当红黑树中节点少于6时，则转化为单链表存储
 */
static final int UNTREEIFY_THRESHOLD = 6;

/**
 * hash冲突默认采用单链表存储，当单链表节点个数大于8时，会转化为红黑树存储。
 * 但是有一个前提：要求数组长度大于64，否则不会进行转化
 */
static final int MIN_TREEIFY_CAPACITY = 64;
```


当我们要对一个链表数组中的某个元素进行增删的时候，首先要知道他应该保存在这个链表数组中的哪个位置，即他在这个数组中的下标。而hash()方法的功能就是根据Key来定位其在HashMap中的位置。HashTable、ConcurrentHashMap同理。


在上代码之前，我们先来做个简单分析。我们知道，hash方法的功能是根据Key来定位这个K-V在链表数组中的位置的。也就是hash方法的输入应该是个Object类型的Key，输出应该是个int类型的数组下标。如果让你设计这个方法，你会怎么做？

其实简单，我们只要调用Object对象的hashCode()方法，该方法会返回一个整数，然后用这个数对HashMap或者HashTable的容量进行取模就行了。没错，其实基本原理就是这个，只不过，在具体实现上，由两个方法`int hash(Object k)`和`int indexFor(int h, int length)`来实现。但是考虑到效率等问题，HashMap的实现会稍微复杂一点。

>hash ：该方法主要是将Object转换成一个整型。

>indexFor ：该方法主要是将hash生成的整型转换成链表数组中的下标。


**HashMap In Java 7**

```java
final int hash(Object k) {
   int h = hashSeed;
   if (0 != h && k instanceof String) {
       return sun.misc.Hashing.stringHash32((String) k);
   }

   h ^= k.hashCode();
   h ^= (h >>> 20) ^ (h >>> 12);
   return h ^ (h >>> 7) ^ (h >>> 4);
}

static int indexFor(int h, int length) {
   return h & (length-1);
}
```

前面我说过，indexFor方法其实主要是将hash生成的整型转换成链表数组中的下标。那么`return h & (length-1);`是什么意思呢？其实，他就是取模。Java之所有使用位运算(&)来代替取模运算(%)，最主要的考虑就是效率。


>位运算(&)效率要比代替取模运算(%)高很多，主要原因是位运算直接对内存数据进行操作，不需要转成十进制，因此处理速度非常快。

>原理是：**X % 2^n = X & (2^n - 1)**

所以，`return h & (length-1);`只要保证length的长度是2^n的话，就可以实现取模运算了。而HashMap中的length也确实是2的倍数，初始值是16，之后每次扩充为原来的2倍。



### 哈希冲突

两个不同的键值，在对数组长度进行按位与运算后得到的结果相同，这不就发生了冲突吗。那么如何解决这种冲突呢，来看下Java是如何做的。

其中的主要代码部分如下：

```java
h ^= k.hashCode();
h ^= (h >>> 20) ^ (h >>> 12);
return h ^ (h >>> 7) ^ (h >>> 4);
```

这段代码是为了对key的hashCode进行扰动计算，防止不同hashCode的高位不同但低位相同导致的hash冲突。**简单点说，就是为了把高位的特征和低位的特征组合起来，降低哈希冲突的概率，也就是说，尽量做到任何一位的变化都能对最终得到的结果产生影响。**


**HashMap In Java 7**

```java
private int hash(Object k) {
   // hashSeed will be zero if alternative hashing is disabled.
   return hashSeed ^ k.hashCode();
}
```

而HashTable中也没有indexOf方法，取而代之的是这段代码：
```java
int index = (hash & 0x7FFFFFFF) % tab.length;
```
也就是说，HashMap和HashTable对于计算数组下标这件事，采用了两种方法。HashMap采用的是位运算，而HashTable采用的是直接取模。

>为啥要把hash值和0x7FFFFFFF做一次按位与操作呢，主要是为了保证得到的index的的二进制的第一位为0（一个32位的有符号数和0x7FFFFFFF做按位与操作，其实就是在取绝对值。），也就是为了得到一个正数。因为有符号数第一位0代表正数，1代表负数。

至此，我们看完了Java 7中HashMap和HashTable中对于hash的实现，我们来做个简单的总结。

HashMap默认的初始化大小为16，之后每次扩充为原来的2倍。

HashTable默认的初始大小为11，之后每次扩充为原来的2n+1。

当哈希表的大小为素数时，简单的取模哈希的结果会更加均匀，所以单从这一点上看，HashTable的哈希表大小选择，似乎更高明些。因为hash结果越分散效果越好。

在取模计算时，如果模数是2的幂，那么我们可以直接使用位运算来得到结果，效率要大大高于做除法。所以从hash计算的效率上，又是HashMap更胜一筹。

但是，HashMap为了提高效率使用位运算代替哈希，这又引入了哈希分布不均匀的问题，所以HashMap为解决这问题，又对hash算法做了一些改进，进行了扰动计算。



## 参考文章：

- [彻底理解HashMap的元素插入原理](https://mp.weixin.qq.com/s?src=11&timestamp=1556189793&ver=1568&signature=n-rCQjLgj0xxhoHvKm79lCUYC8otDb0oq0lQzSmLVEdlzwDoraWwLZP0YmNaB-*1MmGkAOVJhhjinpf2slMhp-YfKVSAd2ijgcPVZNnCoN65DVz6ijkbJBPPZrPbN4c5&new=1)
- [全网把Map中的hash()分析的最透彻的文章，别无二家。](http://mp.weixin.qq.com/s?__biz=MzI3NzE0NjcwMg==&mid=2650120877&idx=1&sn=401bb7094d41918f1a6e142b6c66aaac&chksm=f36bbf8cc41c369aa44c319942b06ca0f119758b22e410e8f705ba56b9ac6d4042fe686dbed4&scene=21#wechat_redirect)
- [关于HashMap容量的初始化，还有这么多学问。](http://mp.weixin.qq.com/s?__biz=MzI3NzE0NjcwMg==&mid=2650121359&idx=1&sn=c63d62be1a36db675c62e341044f10e0&chksm=f36bb9aec41c30b8b369428db1286d3de9bc04675057cde49632f3ba50db2d0a69451d6ec080&scene=21#wechat_redirect)
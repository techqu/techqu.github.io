
如果是可重复读隔离级别，事务T启动的时候会创建一个视图read-view，之后事务T执行期间，即使有其他事务修改了数据，事务T看到的仍然跟在启动时看到的一样。也就是说，一个在可重复读隔离级别下执行的事务，好像与世无争，不受外界影响。

但是，一个事务要更新一行，如果刚好有另外一个事务拥有这一行的行锁，它又不能这么超然了，会被锁住，进入等待状态。问题是，既然进入了等待状态，那么等到这个事务自己获取到行锁要更新数据的时候，它读到的值又是什么呢？

<!--more-->

举个例子，下面是一个只有两行的表的初始化语句

```sql
mysql> CREATE TABLE `t` (
  `id` int(11) NOT NULL,
  `k` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

insert into t(id, k) values(1,1),(2,2);

```

|事务A|事务B|事务C|
| --- | --- | --- |
|start transaction with consistent snapshot;||
| | start transaction with consistent snapshot;||
|||update t set k=k+1 where id=1;|
||update t set k=k+1 where id=1; select k from t where id=1;||
|select k from t where id=1; commit;|||
||commit;||

`begin/start transaction`命令并不是一个事务的起点，在执行到它们之后的第一个操作 InnoDB 表的语句，事务才真正启动成功。 这时候你想要马上启动一个事务，可以使用 `start transaction with consistent snapshot` 这个命令。

- 第一种启动方式，一致性视图是在执行第一个快照读语句时创建的;
- 第二种启动方式，一致性视图在执行`start transaction with consistent snapshot`时创建的

在这个例子里，事务C没有显式地使用`begin/commit`，表示这个update语句本身就是一个事务，语句完成的时候会自动提交。

事务B在更新了行之后查询；

事务A在一个只读事务中查询，并且时间顺序上是在事务B的查询之后。

这时，如果我告诉你事务B查到的K的值是3，而事务A查到的k的值是1，你是不是有点晕。

### MySQL里有两个“视图”概念：

- 一个是view。是用于查询语句定义的虚拟表。
- 另一个是InnoDB在实现MVCC时用到的一致性读视图，即`consistent read view`，用于支持读提交和可重复读隔离级别的实现。

### 快照在MVCC里是如何实现的

**InnoDB利用了“所有数据都有多个版本”的这个特性，实现了“秒级创建快照”的能力。**

> 如果事务B在更新之前查询一次数据，这个查询返回的k的值确实是1.

> 但是，当它要去更新数据的时候，就不能在历史版本上更新了，否则事务C的更新就丢失了。

> 所以，这里就用到了这样一条规则：**更新数据都是先读后写的，而这个读，只能读当前的值，称为“当前读（current read）”**, 其实，除了update语句外，select语句如果加锁，也是当前读。



```sql

# 读锁 （S锁，共享锁）
mysql> select k from t where id=1 lock in share mode;

# 写锁（X锁，排他锁）
mysql> select k from t where id=1 for update;
```

另一种情况

|事务A|事务B|事务C'|
| --- | --- | --- |
|start transaction with consistent snapshot;||
| | start transaction with consistent snapshot;||
|||start transaction with consistent snapshot;update t set k=k+1 where id=1;|
||update t set k=k+1 where id=1; select k from t where id=1;||
|select k from t where id=1; commit;||commit;|
||commit;||

事务C'的不同是，更新后并没有马上提交，在它提交前，事务B的更新语句先发起了。这时事务C'虽然还没有提交，但是新的版本已经生成了，并且是当前的最新版本。那么事务B的更新语句会怎么处理呢？

这时候，两阶段锁协议上场了。事务C'还没有提交，也就是说最新的版本上的写锁还没释放。而事务B是当前读，必须要读最新的版本，而且必须加锁，因此就被锁住了，必须等到事务C'释放这个锁，才能继续它的当前读。

到这里，我们就把一致性读、当前读和行锁就串起来了。

### 事务的可重复读的能力是怎么实现的？

可重复读的核心就是一致性读（consistent read）；而事务更新数据的时候，只能用当前读。如果当前的记录的行锁被其他事务占用的话，就需要进入锁等待。

读提交的逻辑和可重复读的逻辑类似，他们最主要的区别是：

- 在可重复读隔离级别下，只需要在事务开始的时候创建一致性视图，之后事务里的其他查询都共用这个一致性视图；
- 在读提交隔离级别下，每一个语句执行前都会重新算出一个新的视图。


### 读提交隔离级别下，事务A和事务B的查询语句查到的k，应该是多少？

注意：我们用的还是事务C的逻辑直接提交，而不是事务C'，即上面第一个表格

事务A的查询语句的视图数组是在执行这个语句的时候创建的。

事务A查询语句返回结果k=2，事务B查询语句返回结果k=3



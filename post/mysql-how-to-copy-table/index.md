本文源自极客时间-《MySQL实战45讲-41|如何快速复制一张表》，介绍了表复制的三种方法，并且分别比较了他们的优缺点和局限性。
<!--more-->


```sql
create database db1;
use db1;

create table t(id int primary key, a int, b int, index(a))engine=innodb;
delimiter ;;
  create procedure idata()
  begin
    declare i int;
    set i=1;
    while(i<=1000)do
      insert into t values(i,i,i);
      set i=i+1;
    end while;
  end;;
delimiter ;
call idata();

create database db2;
create table db2.t like db1.t

```

## mysqldump 方法

```shell

mysqldump -h$host -P$port -u$user --add-locks=0 --no-create-info --single-transaction  --set-gtid-purged=OFF db1 t --where="a>900" --result-file=/client_tmp/t.sql

```

这条命令中，主要参数含义如下：

1. –single-transaction 的作用是，在导出数据的时候不需要对表 db1.t 加表锁，而是使用 `START TRANSACTION WITH CONSISTENT SNAPSHOT `的方法；
2. –add-locks 设置为 0，表示在输出的文件结果里，不增加" LOCK TABLES 
3. –no-create-info 的意思是，不需要导出表结构；
4. –set-gtid-purged=off 表示的是，不输出跟 GTID 相关的信息；
5. –result-file 指定了输出文件的路径，其中 client 表示生成的文件是在客户端机器上的。
6. -skip-extend-insert 不拼接成一条大的insert语句

然后，你可以通过下面这条命令，将这些 INSERT 语句放到 db2 库里去执行

```shell

mysql -h127.0.0.1 -P13000  -uroot db2 -e "source /client_tmp/t.sql"

```

需要说明的是，source并不是SQL语句，而是一个客户端命令。

1. 打开文件，默认以分号为结尾读取一条条的SQL语句；
2. 将SQL语句发送到服务端执行

也就是说，服务端执行的并不是这个“source t.sql”语句，而是 INSERT 语句。所以，不论是在慢查询日志（slow log），还是bin log，记录的都是这些要被真正执行的 INSERT 语句。

## 导出 CSV 文件

```sql

select * from db1.t where a>900 into outfile '/server_tmp/t.csv';

```

```sql
load data infile '/server_tmp/t.csv' into table db2.t;
```

## 物理拷贝方法

能不能直接把db1.t表的frm文件和ibd文件拷贝到db2的目录下？

不能，因为，一个InnoDB表，除了包含这两个物理文件外，还需要在数据字典中注册。直接拷贝这两个文件的话，因为数据字典中没有db2.t这个表，系统是不会识别和接受他们的。

MySQL 5.6 版本引入了**可传输表空间（transport tablespace）**的方法，可以通过导出+导入表空间的方式,实现物理拷贝表的功能。

假设我们现在的目标是在db1库下，复制一个跟表t相同的表r，具体的执行步骤如下：

1. 执行 `create table r like t`,创建一个相同表结构的空表；
2. 执行 `alter table r discard tablespace`,这时候 r.ibd 文件会被删除
3. 执行 `flush table t for export`,这时候db1目录下会生成一个t.cfg文件
4. 在db1目录下执行 `cp t.cfg r.cfg ; cp t.ibd r.ibd` 这两个命令（这里需注意，拷贝得到的两个文件MySQL进程要有读写权限）；
5. 执行 `unlock tables`,这时候t.cfg文件会被删除；
6. 执行`alter table r import tablespace`，将这个r.ibd文件作为表的新的表空间，由于这个文件的数据内容和t.ibd是相同的，所以表r中就有了和表t相同的数据

![mysql-transport-tablespace](/img/mysql-transport-tablespace.jpg)
## 小结

三种方式优越点对比

1. **物理拷贝的方式速度最快**，尤其对于大表拷贝来说是最快的方法。如果出现误删表的情况，用备份恢复出误删之前的临时库，然后再把临时库中的表拷贝到生产库上，是恢复数据最快的方法。但是，这种方法的使用也有一定的**局限性**：
  - 必须是全表拷贝，不能只拷贝部分数据；
  - 需要到服务器上拷贝数据，在用户无法登录数据库主机的场景下无法使用；
  - 由于是通过拷贝物理文件实现的，源表和目标表都是使用 InnoDB 引擎时才能使用。

2. 用 mysqldump 生成包含 INSERT 语句文件的方法，可以在 where 参数增加过滤条件，来实现只导出部分数据。这个方式的不足之一是，**不能使用 join 这种比较复杂的 where 条件写法。**
3. 用 `select … into outfile` 的方法是最灵活的，支持所有的 SQL 写法。但，这个方法的缺点之一就是，**每次只能导出一张表的数据，而且表结构也需要另外的语句单独备份**。

我们在写数据库设计文档的时候，会需要对数据库表进行设计的编写，手动写的话会很费时间费精力，尤其是如果有大量的表需要写的时候，就更加浪费时间了。下面就让我给大家讲一个简单方法。
我的是在Navicat中导出的数据库表。
<!--more-->


## 1、首先在Navicat中点击查询，然后编写一下代码

```sql
SELECT
COLUMN_NAME 列名,
COLUMN_TYPE 数据类型,
COLUMN_KEY 主键,
COLUMN_COMMENT 注释
FROM
information_schema.`COLUMNS`
WHERE
TABLE_SCHEMA='数据库名'
AND
table_name='表名'
```
## 2、运行，查看结果
## 3、导出，选择word或excel格式，下一步，即可
## 4、然后选择输出路径，以及为文档命名
## 5、这样就导出了一个数据库设计表
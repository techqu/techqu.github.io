
>今天看 guns 项目的 application.properties 文件，发现了`spring.profiles.active = @profiles.active@`的写法，查了好些资料终于搞明白了。原来是在集成maven和Spring boot的profile功能时用的，那么如何集成呢？

<!--more-->
#### 前提
- maven 支持 profile 功能，当使用 maven profile 打包时，可以打包指定目录和指定文件，且可以修改文件中的变量。

- spring boot 也支持 profile 功能，只要在`application.properties`文件中指定`spring.profiles.active=xxx` 即可，其中xxx是一个变量，当maven打包时，修改这个变量即可。

####  步骤一：配置 maven 的 profile

```xml
<!-- 不同环境查找不同配置文件 -->
    <profiles>
        <profile>
            <id>dev</id>
            <properties>
                <profiles.active>dev</profiles.active>
                <maven.test.skip>true</maven.test.skip>
            </properties>
            <activation>
                <activeByDefault>true</activeByDefault>
            </activation>
        </profile>
        <profile>
            <id>sit</id>
            <properties>
                <profiles.active>sit</profiles.active>
                <maven.test.skip>true</maven.test.skip>
            </properties>
        </profile>
        <profile>
            <id>prod</id>
            <properties>
                <profiles.active>prod</profiles.active>
                <maven.test.skip>true</maven.test.skip>
                <scope.jar>provided</scope.jar>
            </properties>
        </profile>
    
    </profiles>
```

其中`profiles.active`是我们定义的一个变量，可通过 mvn 命令指定

在`pom.xml`中配置可修改可访问资源文件

```xml
<resources>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
                <excludes>
                    <exclude>application-dev.properties</exclude>
                    <exclude>application-sit.properties</exclude>
                    <exclude>application-prod.properties</exclude>
                </excludes>
            </resource>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
                <includes>
                    <include>application-${profiles.active}.properties</include>
                    <include>application.properties</include>
                </includes>
            </resource>
        </resources>
```

其中  `${profiles.active}`是上面profile中指定的变量

 

#### 步骤二： 配置springboot的profile

这是通过`spring.profiles.active`，在`application.properties`中指定
　　
```
spring.profiles.active = @profiles.active@
```


 

#### 步骤三：打包命令：

```sh
mvn clean package -Dmaven.test.skip=true -P prod -e
```
这样就可以一步指定profile了，是不是很方便

{{% admonition tip tip %}}

Maven官方文档：[Introduction to Build Profiles](http://maven.apache.org/guides/introduction/introduction-to-profiles.html)
{{% /admonition %}}


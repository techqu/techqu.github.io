
不得不说 SpringBoot 太复杂了，我本来只想研究一下 SpringBoot 最简单的 HelloWorld 程序是如何从 main 方法一步一步跑起来的，但是这却是一个相当深的坑。你可以试着沿着调用栈代码一层一层的深入进去，如果你不打断点，你根本不知道接下来程序会往哪里流动。这个不同于我研究过去的 Go 语言、Python 语言框架，它们通常都非常直接了当，设计上清晰易懂，代码写起来简单，里面的实现同样也很简单。但是 SpringBoot 不是，它的外表轻巧简单，但是它的里面就像一只巨大的怪兽，这只怪兽有千百只脚把自己缠绕在一起，把爱研究源码的读者绕的晕头转向。

但是这 Java 编程的世界 SpringBoot 就是老大哥，你却不得不服。即使你的心中有千万头草泥马在奔跑，但是它就是天下第一。如果你是一个学院派的程序员，看到这种现象你会怀疑人生，你不得不接受一个规则 —— 受市场最欢迎的未必就是设计的最好的，里面夹杂着太多其它的非理性因素。

经过了一番痛苦的折磨，我还是把 SpringBoot 的运行原理摸清楚了，这里分享给大家。
<!--more-->
## Hello World
首先我们看看 SpringBoot 简单的 Hello World 代码，就两个文件 HelloControll.java 和 Application.java，运行 Application.java 就可以跑起来一个简单的 RESTFul Web 服务器了。

### 项目目录
![springboot-demo-project](/img/springboot-demo-project.png)

### pom文件

![springboot-demo-maven](/img/springboot-demo-maven.jpg)

### java代码
```java
// HelloController.java
package hello;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
public class HelloController {

    @RequestMapping("/")
    public String index() {
        return "Greetings from Spring Boot!";
    }

}

// Application.java
package hello;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

}
```
 这时候访问 `http://localhost:8080` 就可以了

 但是问题来了，在 Application 的 main 方法里我压根没有任何地方引用 HelloController 类，那么它的代码又是如何被服务器调用起来的呢？这就需要深入到 SpringApplication.run() 方法中看个究竟了。
 
 不过即使不看代码，我们也很容易有这样的猜想，**SpringBoot 肯定是在某个地方扫描了当前的 package，将带有 RestController 注解的类作为 MVC 层的 Controller 自动注册进了 Tomcat Server。**

还有一个让人不爽的地方是 SpringBoot 启动太慢了，一个简单的 Hello World 启动居然还需要长达 5 秒，要是再复杂一些的项目这样龟漫的启动速度那真是不好想象了。

再抱怨一下，这个简单的 HelloWorld 虽然 pom 里只配置了一个 maven 依赖，但是传递下去，它一共依赖了 36 个 jar 包，其中以 spring 开头的 jar 包有 15 个。说这是依赖地狱真一点不为过。


![springboot-demo-maven-jars](/img/springboot-demo-maven-jars.jpg)

## SpringBoot 的堆栈
了解 SpringBoot 运行的最简单的方法就是看它的调用堆栈，下面这个启动调用堆栈还不是太深，我没什么可抱怨的。

![springboot-demo-tomcatwebserver](/img/springboot-demo-tomcatwebserver.jpg)

```java
public class TomcatServer {

  @Override
  public void start() throws WebServerException {
  ...
  }

}
```

接下来再看看运行时堆栈，看看一个 HTTP 请求的调用栈有多深,绝大多数都是 Tomcat 的调用堆栈，跟 SpringBoot 相关的只有不到 10 层。

![springboot-demo-helloController](/img/springboot-demo-helloController.jpg)

## 探索 ClassLoader

SpringBoot 还有一个特色的地方在于打包时它使用了 FatJar 技术将所有的依赖 jar 包一起放进了最终的 jar 包中的 BOOT-INF/lib 目录中，当前项目的 class 被统一放到了 BOOT-INF/classes 目录中。

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

这不同于我们平时经常使用的 maven shade 插件，将所有的依赖 jar 包中的 class 文件解包出来后再密密麻麻的塞进统一的 jar 包中。下面我们将 springboot 打包的 jar 包解压出来看看它的目录结构。
```
├── BOOT-INF
│   ├── classes
│   │   └── hello
│   └── lib
│       ├── classmate-1.3.4.jar
│       ├── hibernate-validator-6.0.12.Final.jar
│       ├── jackson-annotations-2.9.0.jar
│       ├── jackson-core-2.9.6.jar
│       ├── jackson-databind-2.9.6.jar
│       ├── jackson-datatype-jdk8-2.9.6.jar
│       ├── jackson-datatype-jsr310-2.9.6.jar
│       ├── jackson-module-parameter-names-2.9.6.jar
│       ├── javax.annotation-api-1.3.2.jar
│       ├── jboss-logging-3.3.2.Final.jar
│       ├── jul-to-slf4j-1.7.25.jar
│       ├── log4j-api-2.10.0.jar
│       ├── log4j-to-slf4j-2.10.0.jar
│       ├── logback-classic-1.2.3.jar
│       ├── logback-core-1.2.3.jar
│       ├── slf4j-api-1.7.25.jar
│       ├── snakeyaml-1.19.jar
│       ├── spring-aop-5.0.9.RELEASE.jar
│       ├── spring-beans-5.0.9.RELEASE.jar
│       ├── spring-boot-2.0.5.RELEASE.jar
│       ├── spring-boot-autoconfigure-2.0.5.RELEASE.jar
│       ├── spring-boot-starter-2.0.5.RELEASE.jar
│       ├── spring-boot-starter-json-2.0.5.RELEASE.jar
│       ├── spring-boot-starter-logging-2.0.5.RELEASE.jar
│       ├── spring-boot-starter-tomcat-2.0.5.RELEASE.jar
│       ├── spring-boot-starter-web-2.0.5.RELEASE.jar
│       ├── spring-context-5.0.9.RELEASE.jar
│       ├── spring-core-5.0.9.RELEASE.jar
│       ├── spring-expression-5.0.9.RELEASE.jar
│       ├── spring-jcl-5.0.9.RELEASE.jar
│       ├── spring-web-5.0.9.RELEASE.jar
│       ├── spring-webmvc-5.0.9.RELEASE.jar
│       ├── tomcat-embed-core-8.5.34.jar
│       ├── tomcat-embed-el-8.5.34.jar
│       ├── tomcat-embed-websocket-8.5.34.jar
│       └── validation-api-2.0.1.Final.jar
├── META-INF
│   ├── MANIFEST.MF
│   └── maven
│       └── org.springframework
└── org
    └── springframework
        └── boot
```

**这种打包方式的优势在于最终的 jar 包结构很清晰，所有的依赖一目了然。** 如果使用 maven shade 会将所有的 class 文件混乱堆积在一起，是无法看清其中的依赖。而最终生成的 jar 包在体积上两也者几乎是相等的。

在运行机制上，使用 FatJar 技术运行程序是需要对 jar 包进行改造的，它还需要自定义自己的 ClassLoader 来加载 jar 包里面 lib 目录中嵌套的 jar 包中的类。我们可以对比一下两者的 MANIFEST[^1] 文件就可以看出明显差异

[^1]: MANIFEST.MF：这个 manifest 文件定义了与扩展和包相关的数据。单词“manifest”的意思是“显示”,打开Java的JAR文件我们经常可以看到文件中包含着一个META-INF目录，这个目录下会有一些文件，其中必有一个MANIFEST.MF，这个文件描述了该Jar文件的很多信息

```
// Generated by Maven Shade Plugin
Manifest-Version: 1.0
Implementation-Title: gs-spring-boot
Implementation-Version: 0.1.0
Built-By: qianwp
Implementation-Vendor-Id: org.springframework
Created-By: Apache Maven 3.5.4
Build-Jdk: 1.8.0_191
Implementation-URL: https://projects.spring.io/spring-boot/#/spring-boot-starter-parent/gs-spring-boot
Main-Class: hello.Application

// Generated by SpringBootLoader Plugin
Manifest-Version: 1.0
Implementation-Title: gs-spring-boot
Implementation-Version: 0.1.0
Built-By: qianwp
Implementation-Vendor-Id: org.springframework
Spring-Boot-Version: 2.0.5.RELEASE
Main-Class: org.springframework.boot.loader.JarLauncher
Start-Class: hello.Application
Spring-Boot-Classes: BOOT-INF/classes/
Spring-Boot-Lib: BOOT-INF/lib/
Created-By: Apache Maven 3.5.4
Build-Jdk: 1.8.0_191
Implementation-URL: https://projects.spring.io/spring-boot/#/spring-boot-starter-parent/gs-spring-boot
 ```

 SpringBoot 将 jar 包中的 Main-Class 进行了替换，换成了 JarLauncher。还增加了一个 Start-Class 参数，这个参数对应的类才是真正的业务 main 方法入口。我们再看看这个 JarLaucher 具体干了什么
 ```java
 public class JarLauncher{
    ...
  static void main(String[] args) {
    new JarLauncher().launch(args);
  }

  protected void launch(String[] args) {
    try {
      JarFile.registerUrlProtocolHandler();
      ClassLoader cl = createClassLoader(getClassPathArchives());
      launch(args, getMainClass(), cl);
    }
    catch (Exception ex) {
        ex.printStackTrace();
        System.exit(1);
    }
  }

  protected void launch(String[] args, String mcls, ClassLoader cl) {
        Runnable runner = createMainMethodRunner(mcls, args, cl);
        Thread runnerThread = new Thread(runner);
        runnerThread.setContextClassLoader(classLoader);
        runnerThread.setName(Thread.currentThread().getName());
        runnerThread.start();
  }

}

class MainMethodRunner {
  @Override
  public void run() {
    try {
      Thread th = Thread.currentThread();
      ClassLoader cl = th.getContextClassLoader();
      Class<?> mc = cl.loadClass(this.mainClassName);
      Method mm = mc.getDeclaredMethod("main", String[].class);
      if (mm == null) {
        throw new IllegalStateException(this.mainClassName
                        + " does not have a main method");
      }
      mm.invoke(null, new Object[] { this.args });
    } catch (Exception ex) {
      ex.printStackTrace();
      System.exit(1);
    }
  }
}
```

从源码中可以看出 JarLaucher 创建了一个特殊的 ClassLoader，然后由这个 ClassLoader 来另启一个单独的线程来加载 MainClass 并运行。

又一个问题来了，当 JVM 遇到一个不认识的类，BOOT-INF/lib 目录里又有那么多 jar 包，它是如何知道去哪个 jar 包里加载呢？我们继续看这个特别的 ClassLoader 的源码


```java
class LaunchedURLClassLoader extends URLClassLoader {
  ...
  private Class<?> doLoadClass(String name) {
    if (this.rootClassLoader != null) {
      return this.rootClassLoader.loadClass(name);
    }

    findPackage(name);
    Class<?> cls = findClass(name);
    return cls;
  }

}
```

这里的 rootClassLoader 就是双亲委派模型里的 ExtensionClassLoader ，JVM 内置的类会优先使用它来加载。如果不是内置的就去查找这个类对应的 Package。


```java
private void findPackage(final String name) {
    int lastDot = name.lastIndexOf('.');
    if (lastDot != -1) {
        String packageName = name.substring(0, lastDot);
        if (getPackage(packageName) == null) {
            try {
                definePackage(name, packageName);
            } catch (Exception ex) {
                // Swallow and continue
            }
        }
    }
}

private final HashMap<String, Package> packages = new HashMap<>();

protected Package getPackage(String name) {
    Package pkg;
    synchronized (packages) {
        pkg = packages.get(name);
    }
    if (pkg == null) {
        if (parent != null) {
            pkg = parent.getPackage(name);
        } else {
            pkg = Package.getSystemPackage(name);
        }
        if (pkg != null) {
            synchronized (packages) {
                Package pkg2 = packages.get(name);
                if (pkg2 == null) {
                    packages.put(name, pkg);
                } else {
                    pkg = pkg2;
                }
            }
        }
    }
    return pkg;
}

private void definePackage(String name, String packageName) {
  String path = name.replace('.', '/').concat(".class");
  for (URL url : getURLs()) {
    try {
      if (url.getContent() instanceof JarFile) {
        JarFile jf= (JarFile) url.getContent();
        if (jf.getJarEntryData(path) != null && jf.getManifest() != null) {
          definePackage(packageName, jf.getManifest(), url);
          return null;
        }
      }
    } catch (IOException ex) {
        // Ignore
    }
  }
  return null;
}
```

ClassLoader 会在本地缓存包名和 jar包路径的映射关系，如果缓存中找不到对应的包名，就必须去 jar 包中挨个遍历搜寻，这个就比较缓慢了。不过同一个包名只会搜寻一次，下一次就可以直接从缓存中得到对应的内嵌 jar 包路径。

深层 jar 包的内嵌 class 的 URL 路径长下面这样，使用感叹号 ! 分割
```
jar:file:/workspace/springboot-demo/target/application.jar!/BOOT-INF/lib/snakeyaml-1.19.jar!/org/yaml/snakeyaml/Yaml.class
```

不过这个定制的 ClassLoader 只会用于打包运行时，在 IDE 开发环境中 main 方法还是直接使用系统类加载器加载运行的。

不得不说，SpringbootLoader 的设计还是很有意思的，它本身很轻量级，代码逻辑很独立没有其它依赖，它也是 SpringBoot 值得欣赏的点之一。

## HelloController 自动注册
还剩下最后一个问题，那就是 HelloController 没有被代码引用，它是如何注册到 Tomcat 服务中去的？它靠的是注解传递机制。

![spring-web-bind-annotation](/img/spring-web-bind-annotation.jpg)

SpringBoot 深度依赖注解来完成配置的自动装配工作，它自己发明了几十个注解，确实严重增加了开发者的心智负担，你需要仔细阅读文档才能知道它是用来干嘛的。

Java 注解的形式和功能是分离的，它不同于 Python 的装饰器是功能性的，Java 的注解就好比代码注释，本身只有属性，没有逻辑，注解相应的功能由散落在其它地方的代码来完成，需要分析被注解的类结构才可以得到相应注解的属性。

那注解是又是如何传递的呢？

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

@ComponentScan
public @interface SpringBootApplication {
...
}

public @interface ComponentScan {
    String[] basePackages() default {};
}
```

首先 main 方法可以看到的注解是 SpringBootApplication，这个注解又是由ComponentScan 注解来定义的，ComponentScan 注解会定义一个被扫描的包名称，如果没有显示定义那就是当前的包路径。SpringBoot 在遇到 ComponentScan 注解时会扫描对应包路径下面的所有 Class，根据这些 Class 上标注的其它注解继续进行后续处理。当它扫到 HelloController 类时发现它标注了 RestController 注解。

```
@RestController
public class HelloController {
...
}

@Controller
public @interface RestController {
}
```
而 RestController 注解又标注了 Controller 注解。SpringBoot 对 Controller 注解进行了特殊处理，它会将 Controller 注解的类当成 URL 处理器注册到 Servlet 的请求处理器中，在创建 Tomcat Server 时，会将请求处理器传递进去。HelloController 就是如此被自动装配进 Tomcat 的。

扫描处理注解是一个非常繁琐肮脏的活计，特别是这种用注解来注解注解（绕口）的高级使用方法，这种方法要少用慎用。SpringBoot 中有大量的注解相关代码，企图理解这些代码是乏味无趣的没有必要的，它只会把你的本来清醒的脑袋搞晕。SpringBoot 对于习惯使用的同学来说它是非常方便的，但是其内部实现代码不要轻易模仿，那绝对算不上模范 Java 代码。




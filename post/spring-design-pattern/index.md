关于设计模式，如果使用得当，将会使我们的代码更加简洁，并且更具扩展性。本文主要讲解Spring中如何使用策略模式，工厂方法模式以及Builder模式。
<!--more-->

### 1. 策略模式（Strategy）

关于策略模式的使用方式，在Spring中其实比较简单，从本质上讲，策略模式就是一个接口下有多个实现类，而每种实现类会处理某一种情况。我们以发奖励为例进行讲解，比如我们在抽奖系统中，有多种奖励方式可供选择，比如积分，虚拟币和现金等。在存储时，我们必然会使用一个类似于type的字段用于表征这几种发放奖励的，那么这里我们就可以使用多态的方式进行奖励的发放。比如我们抽象出一个PrizeSender的接口，其声明如下：
```java
public interface PrizeSender {

  /**
   * 用于判断当前实例是否支持当前奖励的发放
   */
  boolean support(SendPrizeRequest request);

  /**
   * 发放奖励
   */
  void sendPrize(SendPrizeRequest request);

}
```

该接口中主要有两个方法：support()和sendPrize()，其中support()方法主要用于判断各个子类是否支持当前类型数据的处理，而sendPrize()则主要是用于进行具体的业务处理的，比如这里奖励的发放。下面就是我们三种不同类型的奖励发放的具体代码：
```java
// 积分发放
@Component
public class PointSender implements PrizeSender {

  @Override
  public boolean support(SendPrizeRequest request) {
    return request.getPrizeType() == PrizeTypeEnum.POINT;
  }

  @Override
  public void sendPrize(SendPrizeRequest request) {
    System.out.println("发放积分");
  }
}
// 虚拟币发放
@Component
public class VirtualCurrencySender implements PrizeSender {

  @Override
  public boolean support(SendPrizeRequest request) {
    return PrizeTypeEnum.VIRTUAL_CURRENCY == request.getPrizeType();
  }

  @Override
  public void sendPrize(SendPrizeRequest request) {
    System.out.println("发放虚拟币");
  }
}
// 现金发放
@Component
public class CashSender implements PrizeSender {

  @Override
  public boolean support(SendPrizeRequest request) {
    return PrizeTypeEnum.CASH == request.getPrizeType();
  }

  @Override
  public void sendPrize(SendPrizeRequest request) {
    System.out.println("发放现金");
  }
}
```
这里可以看到，在每种子类型中，我们只需要在support()方法中通过request的某个参数来控制当前request是否是当前实例能够处理的类型，如果是，则外层的控制逻辑就会将request交给当前实例进行处理。关于这个类的设计，有几个点需要注意：

使用`@Component`注解对当前类进行标注，将其声明为Spring容器所管理的一个bean；
声明一个返回boolean值的类似于`support()`的方法，通过这个方法来控制当前实例是否为处理目标request的实例；
声明一个类似于`sendPrize()`的方法用于处理业务逻辑，当然根据各个业务的不同声明的方法名肯定是不同的，这里只是一个对统一的业务处理的抽象；
无论是`support()`方法还是`sendPrize()`方法，都需要传一个对象进行，而不是简简单单的基本类型的变量，这样做的好处是 **后续如果要在Request中新增字段，那么就不需要修改接口的定义和已经实现的各个子类的逻辑；**

### 2. 工厂方法模式

上面我们讲解了如何使用Spring来声明一个策略模式，那么如何为不同的业务逻辑来注入不同的bean呢，或者说外层的控制逻辑是什么样的，这里我们就可以使用工厂方法模式了。所谓的工厂方法模式，就是定义一个工厂方法，通过传入的参数，返回某个实例，然后通过该实例来处理后续的业务逻辑。一般的，工厂方法的返回值类型是一个接口类型，而选择具体子类实例的逻辑则封装到了工厂方法中了。通过这种方式，来将外层调用逻辑与具体的子类的获取逻辑进行分离。如下图展示了工厂方法模式的一个示意图：

工厂方法模式

可以看到，工厂方法将具体实例的选择进行了封装，而客户端，也就是我们的调用方只需要调用工厂的具体方法获取到具体的事例即可，而不需要管具体的实例实现是什么。上面我们讲解了Spring中是如何使用策略模式声明处理逻辑的，而没有讲如何选择具体的策略，这里我们就可以使用工厂方法模式。如下是我们声明的一个PrizeSenderFactory：

```java
@Component
public class PrizeSenderFactory {

  @Autowired
  private List<PrizeSender> prizeSenders;

  public PrizeSender getPrizeSender(SendPrizeRequest request) {
    for (PrizeSender prizeSender : prizeSenders) {
      if (prizeSender.support(request)) {
        return prizeSender;
      }
    }

    throw new UnsupportedOperationException("unsupported request: " + request);
  }
}
```
这里我们声明一个了一个工厂方法`getPrizeSender()`，其入参就是SendPrizeRequest，而返回值是某个实现了`PrizeSender`接口的实例，可以看到，通过这种方式，我们将具体的选择方式下移到了具体的子类中的，因为当前实现了`PrizeSender`的bean是否支持当前request的处理，是由具体的子类实现的。在该工厂方法中，我们也没有任何与具体子类相关的逻辑，也就是说，该类实际上是可以动态检测新加入的子类实例的。这主要是通过`Spring`的自动注入来实现的，主要是因为我们这里注入的是一个`List<PrizeSender>`，也就是说，如果有新的`PrizeSender`的子类实例，只要其是Spring所管理的，那么都会被注入到这里来。下面就是我们编写的一段用于测试的代码来模拟调用方的调用：

```java
@Service
public class ApplicationService {

  @Autowired
  private PrizeSenderFactory prizeSenderFactory;

  public void mockedClient() {
    SendPrizeRequest request = new SendPrizeRequest();
    request.setPrizeType(PrizeTypeEnum.POINT);  // 这里的request一般是根据数据库或外部调用来生成的
    PrizeSender prizeSender = prizeSenderFactory.getPrizeSender(request);
    prizeSender.sendPrize(request);
  }
}
```

在客户端代码中，首先通过`PrizeSenderFactory`获取一个PrizeSender实例，然后通过其`sendPrize()`方法发放具体的奖励，通过这种方式，将具体的奖励发放逻辑与客户端调用进行了解耦。而且根据前面的讲解，我们也知道，如果新增了一种奖励方式，我们只需要声明一个新的实现了PrizeSender的bean即可，而不需要对现有代码进行任何修改。


### 3. Builder模式

关于Builder模式，我想使用过lombok的同学肯定会说builder模式非常的简单，只需要在某个bean上使用@Builder注解进行声明即可，lombok可以自动帮我们将其声明为一个Builder的bean。关于这种使用方式，本人不置可否，不过就我的理解，这里主要有两个点我们需要理解：

- Builder模式就其名称而言，是一个构建者，我更倾向于将其理解为通过一定的参数，通过一定的业务逻辑来最终生成某个对象。如果仅仅只是使用lombok的这种方式，其本质上也还是创建了一个简单的bean，这个与通过getter和setter方式构建一个bean是没有什么大的区别的；
- 在Spring框架中，使用设计模式最大的问题在于如果在各个模式bean中能够注入Spring的bean，如果能够注入，那么将大大的扩展其使用方式。因为我们就可以真的实现通过传入的简单的几个参数，然后结合Spring注入的bean进行一定的处理后，以构造出我们所需要的某个bean。显然，这是lombok所无法实现的；

关于Builder模式，我们可以以前面奖励发放的SendPrizeRequest的构造为例进行讲解。在构造request对象的时候，必然是通过前台传如的某些参数来经过一定的处理，最后生成一个request对象。那么我们就可以使用Builder模式来构建一个SendPrizeRequest。这里假设根据前台调用，我们能够获取到prizeId和userId，那么我们就可以创建一个如下的SendPrizeRequest：

```java
public class SendPrizeRequest {

  private final PrizeTypeEnum prizeType;
  private final int amount;
  private final String userId;

  public SendPrizeRequest(PrizeTypeEnum prizeType, int amount, String userId) {
    this.prizeType = prizeType;
    this.amount = amount;
    this.userId = userId;
  }

  @Component
  @Scope("prototype")
  public static class Builder {

    @Autowired
    PrizeService prizeService;

    private int prizeId;
    private String userId;

    public Builder prizeId(int prizeId) {
      this.prizeId = prizeId;
      return this;
    }

    public Builder userId(String userId) {
      this.userId = userId;
      return this;
    }

    public SendPrizeRequest build() {
      Prize prize = prizeService.findById(prizeId);
      return new SendPrizeRequest(prize.getPrizeType(), prize.getAmount(), userId);
    }
  }

  public PrizeTypeEnum getPrizeType() {
    return prizeType;
  }

  public int getAmount() {
    return amount;
  }

  public String getUserId() {
    return userId;
  }
}
```
这里就是使用Spring维护一个Builder模式的示例，具体的 维护方式就是在Builder类上使用`@Component`和`@Scope`注解来标注该Builder类，这样我们就可以在Builder类中注入我们所需要的实例来进行一定的业务处理了。关于该模式，这里有几点需要说明：

在Builder类上必须使用`@Scope`注解来标注该实例为`prototype`类型，因为很明显，我们这里的Builder实例是有状态的，无法被多线程共享；
在`Builder.build()`方法中，我们可以通过传入的参数和注入的bean来进行一定的业务处理，从而得到构建一个SendPrizeRequest所需要的参数；
Builder类必须使用static修饰，因为在Java中，如果内部类不用static修饰，那么该类的实例必须依赖于外部类的一个实例，而我们这里本质上是希望通过内部类实例来构建外部类实例，也就是说内部类实例存在的时候，外部类实例是还不存在的，因而这里必须使用static修饰；
根据标准的Builder模式的使用方式，外部类的各个参数都必须使用final修饰，然后只需要为其声明getter方法即可。
       上面我们展示了如何使用Spring的方式来声明一个Builder模式的类，那么我们该如何进行使用呢，如下是我们的一个使用示例：

```java
@Service
public class ApplicationService {

  @Autowired
  private PrizeSenderFactory prizeSenderFactory;

  @Autowired
  private ApplicationContext context;

  public void mockedClient() {
    SendPrizeRequest request = newPrizeSendRequestBuilder()
        .prizeId(1)
        .userId("u4352234")
        .build();

    PrizeSender prizeSender = prizeSenderFactory.getPrizeSender(request);
    prizeSender.sendPrize(request);
  }

  public Builder newPrizeSendRequestBuilder() {
    return context.getBean(Builder.class);
  }
}
```

上述代码中，我们主要要看一下`newPrizeSendRequestBuilder()`方法，在Spring中，如果一个类是多例类型，也即使用`@Scope("prototype")`进行了标注，那么每次获取该bean的时候就必须使用`ApplicationContext.getBean()`方法获取一个新的实例，至于具体的原因，读者可查阅相关文档。我们这里就是通过一个单独的方法来创建一个Builder对象，然后通过流式来为其设置prizeId和userId等参数，最后通过build()方法构建得到了一个SendPrizeRequest实例，通过该实例来进行后续的奖励发放。

### 4. 单例（Singleton）
保证一个类仅有一个实例，并提供一个访问它的全局访问点。

Spring中的单例模式完成了后半句话，即提供了全局的访问点BeanFactory。但没有从构造器级别去控制单例，这是因为Spring管理的是是任意的Java对象。

### 5. 工厂方法（Factory Method）
定义一个用于创建对象的接口，让子类决定实例化哪一个类。Factory Method使一个类的实例化延迟到其子类。

Spring中的FactoryBean就是典型的工厂方法模式。

### 6. 适配器（Adapter）
将一个类的接口转换成客户希望的另外一个接口。Adapter模式使得原本由于接口不兼容而不能一起工作的那些类可以一起工作。

![spring-aop-MethodInterceptor](/img/spring-aop-MethodInterceptor.png)

Spring中在对于AOP的处理中有Adapter模式的例子，由于Advisor链需要的是MethodInterceptor（拦截器）对象，
所以每一个Advisor中的Advice都要适配成对应的MethodInterceptor对象。Spring提供了对应的适配器来适配这个问题,分别是`MethodBeforeAdviceAdapter`和`AfterReturningAdviceAdapter`和`ThrowsAdviceAdapter`。

![spring-advisorAdapter](/img/spring-advisorAdapter.png)

适配器模式属于结构性模式，它为两个不同接口之间互通提供了一种手段

### 7.包装器（Decorator）

动态地给一个对象添加一些额外的职责。就增加功能来说，Decorator模式相比生成子类更为灵活。

![spring-decorator](/img/spring-decorator.png)

Spring中用到的包装器模式在类名上有两种表现：一种是类名中含有Wrapper，另一种是类名中含有Decorator。基本上都是动态地给一个对象添加一些额外的职责。

### 8. 代理（Proxy）

为其他对象提供一种代理以控制对这个对象的访问。

从结构上来看和Decorator模式类似，但Proxy是控制，更像是一种对功能的限制，而Decorator是增加职责。

AOP实现的关键在于AOP框架自动创建的AOP代理，

AOP代理主要分为静态代理和动态代理，静态代理的代表为AspectJ；而动态代理则以Spring AOP为代表
Spring AOP使用的动态代理，所谓的动态代理就是说AOP框架不会去修改原来原来的对象，而是在需要的时候重新生成一个代理对象，这个代理对象包含了目标对象的全部方法，并且在指定的切点做了了处理，而且最终还是回调原对象的方法。

动态代理主要有两种方式，JDK动态代理和CGLIB动态代理。JDK动态代理通过反射来接收被代理的类，并且要求被代理的类必须实现一个接口。JDK动态代理的核心是InvocationHandler接口和Proxy类。

如果目标类没有实现接口，那就要选择使用CGLIB来动态代理目标类。
CGLIB会让生成的代理类继承当前对象，并在代理类中对代理方法进行强化处理(前置处理、后置处理等)。
在CGLIB底层底层实现是通过ASM字节码处理框架来转换字节码并生成新的代理类

注意，CGLIB是通过继承的方式做的动态代理，因此如果某个类被标记为final，那么它是无法使用CGLIB做动态代理的。


在Spring Aop框架中，MethodInterceptor接口被用来拦截指定的方法，对方法进行增强。

### 9. 观察者（Observer）

定义对象间的一种一对多的依赖关系，当一个对象的状态发生改变时，所有依赖于它的对象都得到通知并被自动更新。

Spring中Observer模式常用的地方是listener的实现。如`ApplicationListener`。

ApplicationContext事件机制是观察者设计模式的实现，通过`ApplicationEvent`类和`ApplicationListener`接口，可以实现ApplicationContext事件处理。

 如果容器中有一个ApplicationListener Bean，每当ApplicationContext发布ApplicationEvent时，ApplicationListener Bean将自动被触发。这种事件机制都必须需要程序显示的触发。

其中spring有一些内置的事件，当完成某种操作时会发出某些事件动作。比如监听ContextRefreshedEvent事件，当所有的bean都初始化完成并被成功装载后会触发该事件，实现`ApplicationListener<ContextRefreshedEvent>`接口可以收到监听动作，然后可以写自己的逻辑。

同样事件可以自定义、监听也可以自定义，完全根据自己的业务逻辑来处理。

### 10.模板方法（Template Method）

定义一个操作中的算法的骨架，而将一些步骤延迟到子类中。Template Method使得子类可以不改变一个算法的结构即可重定义该算法的某些特定步骤。

Template Method模式一般是需要继承的。这里想要探讨另一种对Template Method的理解。Spring中的JdbcTemplate，在用这个类时并不想去继承这个类，因为这个类的方法太多，但是我们还是想用到JdbcTemplate已有的稳定的、公用的数据库连接，那么我们怎么办呢？

我们可以把变化的东西抽出来作为一个参数传入JdbcTemplate的方法中。但是变化的东西是一段代码，而且这段代码会用到JdbcTemplate中的变量。怎么办？

那我们就用回调对象吧。在这个回调对象中定义一个操纵JdbcTemplate中变量的方法，我们去实现这个方法，就把变化的东西集中到这里了。然后我们再传入这个回调对象到JdbcTemplate，从而完成了调用。这可能是Template Method不需要继承的另一种实现方式吧。

### 11.小结

看到这，一定会有人说，装饰器模式和代理模式、适配器模式、模板方法模式看起来好像啊，有什么区别么？

**装饰器**：原来的方法（编码）已经不能满足新需求了，需要对其进行扩展（设计、测试），理论上我们可以对原方法无限地装饰下去，比如我们可以在"设计"之前再加个"需求分析"，在"测试"之后再加个"部署实施"等等。也可以去掉某些装饰器。

**适配器**：原来的接口已经不兼容了，适配器在原对象和目标对象中间，通过对原对象兼容的那个接口，通过转换，调用目标对象那个不兼容的接口。举个不恰当的例子，一个英国人去买饭，听不懂中国服务员说什么（接口不兼容），这时候来了一个翻译（适配器），他能与英国人交流（接口适配成功），然后翻译不干活，而是通过中国服务员的活动，将结果再返回给英国人。

**代理**：你们要实现什么功能我不管，我只负责调用该调用的方法。有点类似前台MM，你们干什么我不管，你就告诉我你找谁，我给你找去。

**模板方法**：如果说装饰器是在原有的方法上扩展很多方法，那么模板方法模式就是将原来很多固定的方法抽出到父类里。一个是加法，一个是减法





[Spring框架中的设计模式（一）](http://blog.didispace.com/spring-design-partern/)
Spring框架中的设计模式（二）
Spring框架中的设计模式（三）
Spring框架中的设计模式（四）
Spring框架中的设计模式（五）
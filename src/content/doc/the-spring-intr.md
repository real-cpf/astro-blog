---
title: 'Spring'
description: 'Serde Syn quote 分析文档'
pubDate: 'Sep 24 2023'
heroImage: '/blog-placeholder-2.jpg'
score: 99
subject: 'web'
---

## Spring IoC and Bean

> [The org.springframework.beans and org.springframework.context packages are the basis for Spring Framework’s IoC container.](https://docs.spring.io/spring-framework/reference/core/beans/introduction.html) The BeanFactory interface provides an advanced configuration mechanism capable of managing any type of object. ApplicationContext is a sub-interface of BeanFactory. It adds:
> + Easier integration with Spring’s AOP features
> + Message resource handling (for use in internationalization)
> + Event publication
> + Application-layer specific contexts such as the WebApplicationContext for use in web applications.


![The Spring IoC container](https://docs.spring.io/spring-framework/reference/_images/container-magic.png)


#### Create Config Get Beans
```java
ApplicationContext context1 = new ClassPathXmlApplicationContex("services.xml");
ApplicationContext context2 = new GenericGroovyApplicationContext("services.groovy");
ApplicationContext context3 = FileSystemXmlApplicationContext("")
```

```java
        ApplicationContext context = new ClassPathXmlApplicationContext("services.xml");

        // getBean
        DemoEntity entity1 = context.getBean("entity1", DemoEntity.class);

        System.out.println(entity1);

        DemoEntity entityAlias = context.getBean("entityAlias",DemoEntity.class);
        System.out.println(entityAlias);
        assert entity1 == entityAlias;
    

```

#### XML config attrs

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:p="http://www.springframework.org/schema/p"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd">

        <!-- factory-method -> public static factory method  -->
    <bean id="entity2" class="tech.realcpf.spring.dto.DemoEntity" factory-method="createInstance">
        <property name="name" value="jiacheng.liu"/>
        <property name="age" value="25"/>
    </bean>


    <!-- use    xmlns:p="http://www.springframework.org/schema/p"-->
    <bean id="entity3" class="tech.realcpf.spring.dto.DemoEntity"
        destroy-method="destroy"
        p:name="jc.liu"
        p:age="89">
        <!-- additional collaborators and configuration for this bean go here -->
    </bean>

    <!-- constructor-arg -->
    <bean id="entity1" class="tech.realcpf.spring.dto.DemoEntity">
        <constructor-arg type="java.lang.String" value="by constructor" name="name" index="0"></constructor-arg>
        <constructor-arg type="java.lang.Integer" value="123" name="age" index="1"></constructor-arg>
    </bean>

    <alias name="entity1" alias="entityAlias"></alias>

    <!-- depends-on  other beans -->
   <bean id="beanOne" class="ExampleBean" depends-on="manager"/>
<!--    <bean id="manager" class="ManagerBean" />-->

    <!-- lazy-init  -->
   <bean id="lazy" class="com.something.ExpensiveToCreateBean" lazy-init="true"/>
<!--    <bean name="not.lazy" class="com.something.AnotherBean"/>-->

    <!-- init method -->
   <bean id="exampleInitBean" class="examples.ExampleBean" init-method="init"/>
   <!-- scope -->
   <bean id="exampleInitBean" class="examples.ExampleBean" scope="prototype"/>
</beans>
```

![prototype](https://docs.spring.io/spring-framework/reference/_images/prototype.png)

---

![singleton](https://docs.spring.io/spring-framework/reference/_images/singleton.png)

#### BeanPostProcessor

```java

    private static final BeanPostProcessor beanPostProcessor = new BeanPostProcessor() {
        @Override
        public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
            return BeanPostProcessor.super.postProcessBeforeInitialization(bean, beanName);
        }

        @Override
        public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
            System.out.println("Bean '" + beanName + "' created : " + bean.toString());
            return BeanPostProcessor.super.postProcessAfterInitialization(bean, beanName);
        }
    };

    // PropertyOverrideConfigurer
    // PropertySourcesPlaceholderConfigurer
    
    private static final BeanFactoryPostProcessor beanFactoryPostProcessor = new BeanFactoryPostProcessor() {
        @Override
        public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {

        }
    };


```


#### Spring SPI

```text

通过 resources/META-INF/spring.factories 作为SPI的配置文件
内容如下：
org.springframework.context.ApplicationContextInitializer=\
tech.realcpf.spring.DemoApplicationContextInitializer
org.springframework.context.ApplicationListener=\
tech.realcpf.spring.DemoApplicationListener


如果用spring-boot，再spring-boot3之后配置文件改成
 resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 作为SPI的配置文件
内容则是一个类一行

其中 org.springframework.boot.autoconfigure.AutoConfiguration 是Interface名

```

## Spring Aop

> https://docs.spring.io/spring-framework/reference/core/aop-api/pointcuts.html

#### Proxy - ProxyFactoryBean

```java
        ApplicationContext context =
                new ClassPathXmlApplicationContext("aopdemo.xml");
        IDemoModel model = (IDemoModel) context.getBean("demoModelProxy");

        System.out.println(model.hello("jc.liu"));
```

```xml

<bean id="demoModelProxy"
   class="org.springframework.aop.framework.ProxyFactoryBean">
       <property name="proxyInterfaces">
           <list>
               <value>tech.realcpf.spring.aop.IDemoModel</value>
           </list>
       </property>

       <property name="target" ref="demoModelImpl">

       </property>

       <property name="interceptorNames">
           <list>
                <value>demoModelArgs</value> <!-- impl MethodBeforeAdvice -->
               <value>demoModelReturn</value> <!-- impl AfterReturningAdvice -->
           </list>
       </property>
   </bean>

```

#### Auto Proxy - BeanNameAutoProxyCreator

```java
  ApplicationContext context =
                new ClassPathXmlApplicationContext("aopdemo.xml");
        IDemoModel demoModel = context.getBean(IDemoModel.class);
        System.out.println(demoModel.hello("jc.liu"));

```


```xml

 <bean class="org.springframework.aop.framework.autoproxy.BeanNameAutoProxyCreator">
                <property name="interceptorNames">
                    <list>
                        <value>demoModelArgs</value>
                        <value>demoModelReturn</value>
                    </list>
                </property>

        <!--        for auto match-->
        <property name="beanNames" value="*Model"></property>
    </bean>

```

#### Aspectj

```java

    // call before
    @Before("tech.realcpf.spring.aop.aj.SystemArchitecture.service()")
    public void callBefore(JoinPoint joinPoint) {
        System.out.println("Before : " + Arrays.toString(joinPoint.getArgs()));
    }


    // call after
    @AfterReturning(pointcut = "tech.realcpf.spring.aop.aj.SystemArchitecture.service()",
            returning = "result")
    public void logResult(Object result) {
        System.out.println("after :" + result);
    }

    @Pointcut("execution(* tech.realcpf.spring.aop.aj..*(..))")
    public void service() {}

```

```xml

    <!-- enable aspectj -->
    <aop:aspectj-autoproxy/>
    
```

## Spring EL

> https://docs.spring.io/spring-framework/reference/core/expressions/evaluation.html

#### [更多的语法语义](https://docs.spring.io/spring-framework/reference/core/expressions/language-ref.html)

```java
    static class Simple {
        public List<Boolean> booleans = new ArrayList<>();
    }

    ExpressionParser parser = new SpelExpressionParser();
    Expression exp = parser.parseExpression("'Hello World'.concat('!')");
    String message = (String) exp.getValue();
    System.out.println(message);
    System.out.println(
        parser.parseExpression("'hello'.bytes.length").getValue()
    );

    Simple simple = new Simple();
    simple.booleans.add(false);
    EvaluationContext context = SimpleEvaluationContext.forReadOnlyDataBinding().build();

    parser.parseExpression("booleans[0]")
            .setValue(context,simple,"true");
    assert simple.booleans.get(0);


```



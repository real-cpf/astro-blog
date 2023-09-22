---
title: 'Akka'
description: 'akka常用文档'
pubDate: 'Sep 19 2023'
heroImage: '/blog-placeholder-2.jpg'
score: 99
subject: 'akka'
---

# Akka (Actor)

> https://akka.io/


## 基本用法 创建、传递消息


### 创建

```java
import akka.actor.AbstractActor;
import akka.actor.Props;

import java.time.Duration;

public class DemoRev extends AbstractActor {
    public DemoRev(){
        // 设置接收消息的超时时间
        getContext().setReceiveTimeout(Duration.ofSeconds(10));
    }
    /**
     * 用于创建ActorRef
    **/
    public static Props props(){
        return Props.create(DemoRev.class, DemoRev::new);
    }
    @Override
    public Receive createReceive() {
        return receiveBuilder()
                .match(String.class ,//如果是string类型
                r->{
                    System.out.println("rev :" + r);
                    getSender().tell("rev done",getSelf());
                }).match(Integer.class, // 如果是Interger类型
                r->{
                    getSender().tell("give me more!",getSelf());
                }).matchAny(a->{ // 其他
                    System.out.println("any");
                }).build();
    }
}


```

### 传递消息

```java
       ActorSystem system = ActorSystem.create("linux");
       // 创建
        ActorRef p1 = system.actorOf(DemoRev.props());
        ActorRef s1 = system.actorOf(DemoSend.props());
        // s1 -> p1
        p1.tell("hello",s1);
        system.terminate();
```


### Inbox 消息

```java

        ActorSystem system = ActorSystem.create("linux");
        ActorRef p1 = system.actorOf(DemoRev.props());

        final Inbox inbox = Inbox.create(system);
        // inbox也是一个actor
        inbox.send(p1,"hello");

        System.out.println(inbox.receive(Duration.ofSeconds(1)));
        system.terminate();

```

### 周期性消息

```java
import akka.actor.AbstractActorWithTimers;

import java.time.Duration;

public class DemoTimer extends AbstractActorWithTimers {
    private static Object TICK_KEY = "TickKey";

    private static final class FirstTick {}

    private static final class Tick {}

    public DemoTimer(){
        // 相当于settimeout
        getTimers().startSingleTimer(TICK_KEY,new FirstTick(), Duration.ofMillis(500));
    }

    @Override
    public Receive createReceive() {
        return receiveBuilder().match(
                FirstTick.class,
                message -> {
                    // 周期执行
                    getTimers().startPeriodicTimer(TICK_KEY,new Tick(),Duration.ofSeconds(1));
                }
        ).match(Tick.class,message -> {
            System.out.println(message);
        }).build();
    }
}



```

## 生命周期

```java
import akka.actor.AbstractActor;
import akka.actor.Props;

public class StartStopActor1 extends AbstractActor {
    static Props props() {
        return Props.create(StartStopActor1.class, StartStopActor1::new);
    }
    // 启动hock
    @Override
    public void preStart() throws Exception {
        System.out.printf("start %s \n",getSelf().path().toSerializationFormat());
        getContext().actorOf(StartStopActor2.props(),"second");
    }
    // 停止hock
    @Override
    public void postStop() throws Exception {
        System.out.printf("stop %s \n",getSelf().path().toSerializationFormat());
    }

    /*

    也可以用信号停止
     victim.tell(akka.actor.PoisonPill.getInstance(), ActorRef.noSender());
    */

    @Override
    public Receive createReceive() {
        return receiveBuilder()
                .matchEquals("stop",s->{
                    getContext().stop(getSelf());
                }).build();
    }
}

```

## Receive

```java
// 支持动态改变receive方法
      public Receive createReceive() {
        return receiveBuilder()
            .matchEquals(
                "init",
                m1 -> {
                  initializeMe = "Up and running";
                  getContext()
                      .become(
                          receiveBuilder()
                              .matchEquals(
                                  "U OK?",
                                  m2 -> {
                                    getSender().tell(initializeMe, getSelf());
                                 })
                              .build());
                })
            .build();
```

## ask , pipie

```java


import akka.actor.ActorRef;
import akka.actor.ActorSystem;
import scala.Tuple2;
import tech.realcpf.sendrev.DemoRev;
import tech.realcpf.sendrev.DemoSend;

import static akka.pattern.Patterns.ask;
import static akka.pattern.Patterns.pipe;

import java.time.Duration;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

public class AskDemo {
    public static void main(String[] args) {
        ActorSystem system = ActorSystem.create("sys");
        ActorRef actorA = system.actorOf(DemoRev.props());
        ActorRef actorB = system.actorOf(DemoRev.props());
        ActorRef actorC = system.actorOf(DemoRev.props());
        CompletableFuture<Object> future1 =
                ask(actorA,"hi A", Duration.ofMillis(1000)).toCompletableFuture();
        CompletableFuture<Object> future2 =
                ask(actorB,"hi B", Duration.ofMillis(1000)).toCompletableFuture();

        CompletableFuture<Tuple2<String,String>> transformed =
                CompletableFuture.allOf(future1,future2)
                        .thenApply(v->{
                           String x = (String) future1.join();
                           String s = (String) future2.join();
                           return new Tuple2(x,s);
                        });

        pipe(transformed,system.dispatcher()).to(actorC);

        system.terminate();
    }
}

```
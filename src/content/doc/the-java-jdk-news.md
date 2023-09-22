---
title: 'Jdk News'
description: 'JdkNews 文档'
pubDate: 'Sep 19 2023'
heroImage: '/blog-placeholder-2.jpg'
score: 99
subject: 'jdknews'
---


### VirtualThread Thread.yield() 从jdk测试里摘抄

```java
var list = new CopyOnWriteArrayList<String>();

        var threadsStarted = new AtomicBoolean();

        var threadA = Thread.ofVirtual().unstarted(() -> {
            while (!threadsStarted.get()) {
                Thread.onSpinWait();
            }

            list.add("A");
            Thread.yield();
            list.add("A");
        });

        var threadB = Thread.ofVirtual().unstarted(() -> {
            list.add("B");
        });


        threadA.start();
        threadB.start();


        threadsStarted.set(true);


        threadA.join();
        threadB.join();
        assert  list.stream().collect(Collectors.joining(",")) == List.of("A", "B", "A").stream().collect(Collectors.joining(","));

```

### ScopedValue，StructuredTaskScope


> [JEP 429: Scoped Values (Incubator)](https://openjdk.org/jeps/429)
> 代码用的java版本是 openjdk 22-internal ,SOURCE=".:git:ad34be1f329e"

### isBound, get
```java

        // get
        ScopedValue<String> name = ScopedValue.newInstance();
        String result = ScopedValue.getWhere(name, "duke", ()->{
            // 在这个scope里是inbound的
            System.out.println(name.isBound());
            // 所以这个scope里才能get到值
            return name.get();
        });
        System.out.println(result);
        System.out.println(name.isBound());

```

### 几个开启scope的方法`runWhere`,`callWhere`,`getWhere`

```java

        ScopedValue<String> v1 = ScopedValue.newInstance();
        ScopedValue.runWhere(v1,"new v1 run",()->{
            System.out.println(v1.get());
        });
        ScopedValue.callWhere(v1,"new v1 call",()->{
            System.out.println(v1.get());
            return v1.get();
        });

        ScopedValue.getWhere(v1,"new v1 get",() ->{
            System.out.println(v1.get());
            return v1.get();
        });

        assert "default" == v1.orElse("default");

        ScopedValue.runWhere(v1,"the",()->{
            assert "the" ==  v1.orElse(null);
        });

```

### scope嵌套

```java
        ScopedValue<String> v1 = ScopedValue.newInstance();
        ScopedValue.runWhere(v1,"v1 leve1",()->{
            assert v1.isBound();
            assert "v1 leve1" == v1.get();
            ScopedValue.runWhere(v1,"v1 leve2",()->{
                assert v1.isBound();
                assert "v1 leve2" == v1.get();
            });
            assert v1.isBound();
            assert "v1 leve1" == v1.get();
        });

```

### 多值
```java
        ScopedValue<String> name = ScopedValue.newInstance();
        ScopedValue<Integer> age = ScopedValue.newInstance();
        ScopedValue.where(name,"my name")
                .where(age,22)
                .run(()->{
                    assert name.isBound();
                    assert age.isBound();
                    System.out.println(name.get());
                    System.out.println(age.get());

                });
```
## StructuredTaskScope 的PreviewFeature的版本，与19release的版本略有不同
> 对了 如果一些没有relase的版本的代码片段在IDEA上无法运行，就直接java XXX 吧，java已经可以直接执行java文件了， 加上`--enable-preview --source 22`即可

### fork with virtual thread

```java

   Set<Thread> threads = ConcurrentHashMap.newKeySet();
    try (var scope = new StructuredTaskScope<Object>("v",
                                    // 通过虚拟线程创建100个fork非常快
                                        Thread.ofVirtual().factory())) {
      for (int i = 0; i < 100; i++) {
        scope.fork(() -> {
          threads.add(Thread.currentThread());
          return null;
        });
      }
      scope.join();
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    }
    assert 100 == threads.size();
    assert 100 == threads.stream().filter(t->t.isVirtual()).count();

```


### ShutdownOnSuccess

```java

// 源码处
            if (subtask.state() == Subtask.State.SUCCESS) {
                // task succeeded
                T result = subtask.get();
                Object r = (result != null) ? result : RESULT_NULL;
                if (FIRST_RESULT.compareAndSet(this, null, r)) {
                    // 确认是第一个成功的就shutdown
                    super.shutdown();
                }
            } 
// 比如 

try(var scope = new StructuredTaskScope.ShutdownOnSuccess<>()) {
      StructuredTaskScope.Subtask<Object> f1 = scope.fork(()->{
        return "1";
      });
      StructuredTaskScope.Subtask<Object> f2 = scope.fork(()->{
        TimeUnit.SECONDS.sleep(1);
        return "2";
      });
      System.out.println(f1.state());
      System.out.println(f2.state());
      scope.join();
      System.out.println("join");
      System.out.println(f1.state());
      System.out.println(f2.state());
      // get会报错，因为其中一个成功后其他的已经取消了
//      System.out.println(f1.get());
//      System.out.println(f2.get());

      System.out.println(scope.result());

    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    } catch (ExecutionException e) {
      throw new RuntimeException(e);
    }
```

### 自定义scope handle

```java
public static class MyScopeException extends RuntimeException {}

  public static class MyScope extends StructuredTaskScope<String> {
    private final Collection<String> oks = new ConcurrentLinkedDeque<>();
    private final Collection<Throwable> errs = new ConcurrentLinkedDeque<>();

    @Override
    protected void handleComplete(Subtask<? extends String> subtask) {
      switch (subtask.state()){
        case UNAVAILABLE : throw new IllegalStateException("");
        case SUCCESS : this.oks.add(subtask.get());break;
        case FAILED : this.errs.add(subtask.exception());break;
        default : {}break;
      }
    }

    public MyScopeException errors(){
      MyScopeException exception = new MyScopeException();
      errs.forEach(exception::addSuppressed);
      return exception;
    }

    public String myResult(){
      return oks.stream().findFirst().orElseThrow(this::errors);
    }
  }


```

### 使用自定义的scope

```java

try(var scope = new MyScope()) {
      scope.fork(()->{
        TimeUnit.SECONDS.sleep(1);
        return "1";
      });
      scope.fork(()->{
        return "2";
      });

      scope.join();

      System.out.println(scope.myResult());
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    }
```
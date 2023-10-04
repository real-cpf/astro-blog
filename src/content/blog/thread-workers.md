---
title: 'async , sync ,block ,non block'
description: 'This is a new architectural paradigm'
pubDate: 'Sep 24 2023'
heroImage: '/convers/blog/back-06.png'
score: 1
---


目前有reactor、peactor

以及终极的actor



下面是我个人的一种简单的异步分治模型

参照排序算法的多run的模型

对可分解的耗时IO任务进行拆分

每个独立的子任务

称之为run

而一个worker每次work()可以运行一个或多个run

未完成的worker继续push回queue

反复迭代

```java
while(worker = queue.poll() != null) {

   runAsync(woker.work())

​        .whenComplete((cworker)=>{

​          if(cworker.notdone()){

​             queue.push(worker)

​         }

​       })

​    }
```




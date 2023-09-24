---
title: 'Pong Function Service Framework'
description: 'This is a new architectural paradigm'
pubDate: 'Sep 24 2023'
heroImage: '/blog-placeholder-4.jpg'
score: 1
---
## Write Before All Start

在同一个Linux Host上的不同Container作为不同的函数进程

在这些Container直接采用Unix Domain Socket或者其他base Linux 内核的通信方式进行消息交换

对于外部网络通过一个统一的Exchange的Container进行处理与交换

Host内部提供一个Func-Router的Container作为路由对外部请求进行转发到不同的Func的Container

提供State-Conf-Center对于各个组件的Container进行统一的Func分发和状态、配置管理

而Router和各个Func的Container直接交换的是什么呢？

含义是逻辑函数，载体是DSL或者WASM二进制流

各个Func如何执行这些DSL、WASM呢？

通过Func的配置中心进行函数预加载，然后通过逻辑函数进行实际调用

![Design](/sub/design-container-host.drawio.png)


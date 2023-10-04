---
title: 'UDS Pong'
description: 'An inter-container messaging mechanism that does not require a TCPIP network.'
pubDate: 'Sep 24 2023'
heroImage: '/convers/blog/back-08.png'
score: 1
---


[introduction](#introduction)

[介绍](#介绍)

[contact](#contact)

[dev log](#dev-log)



## introduction

+ An inter-container messaging mechanism that does not require a TCPIP network.
  The underlying protocol is Unix DomainSocket,
  The non-blocking threading model relies on the Netty Event Loop,
  The message plan has a simple structure that is customized.
  Fast and efficient analysis,
  Meet the needs of KV storage, direct forwarding and other features.

+ Implementation brief:
  Unsafe access native Epoll ctl as the primary non-blocking support,
  Epoll's EPOLLIN,EPOLLOUT,EPOLLRDHUP,EPOLLET,EPOLLERR is supported

+ Message specification

  | 1-2           | 3-6            | 7-bodylen |
  | ------------- | -------------- | --------- |
  | type num(u16) | body len (u32) | bytes     |

+ KV storage support:

  Extend Java memory through mmap to improve access efficiency.
  Supports per-block compression to reduce storage pressure.
  Support setting cache to optimize IO pressure.

## 介绍

+ 一种无需TCPIP网络的容器间的消息传递机制。
基础protocol是Unix DomainSocket，
非阻塞线程模型依赖Netty Event Loop，
消息规划采用自定义的简单结构，
解析迅速，高效，
满足kv存储，直接转发等多种feature。

+ 实现简介：
采用Unsafe 接入native Epoll ctl 作为主要的非阻塞支持，
支持了Epoll的EPOLLIN,EPOLLOUT,EPOLLRDHUP,EPOLLET,EPOLLERR

+ 消息规范

  | 1-2           | 3-6            | 7-bodylen |
  | ------------- | -------------- | --------- |
  | type num(u16) | body len (u32) | bytes     |

+ kv存储支持:

  通过mmap扩展java外存，提高存取效率。
  支持按块压缩，降低存储压力。
  支持设置缓存，优化io压力。



---
title: 'Protocol Translator'
description: ' 一个应用层协议翻译器'
pubDate: 'Sep 24 2023'
heroImage: '/blog-placeholder-4.jpg'
score: 1
---


## 第一版
 1. 在各个协议的decode的handler后添加转发
 2. 通过配置实现动态给pipline添加handler

## 第二版
 1. 构建soft的decode实现在尽可能取得需要的字段的情况下兼容多种协议

![chart flow](/sub/protcol-translator.png)

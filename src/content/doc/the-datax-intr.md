---
title: 'DataX'
description: 'dataX 分析文档'
pubDate: 'Sep 19 2023'
heroImage: '/convers/doc/datax-01.png'
score: 99
subject: 'db'
---

> [DataX](https://github.com/alibaba/DataX/blob/master/introduction.md) is a batch sync framework also an efficient and concise solution

![design](https://cloud.githubusercontent.com/assets/1067175/17879884/ec7e36f4-6927-11e6-8f5f-ffc43d6a468b.png)


### 这是一个极其简化的代码示例 `reader -> queue -> writer`

```java

import java.util.*;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class DemoTransport {

    // demo Exchanger 
    private class DemoExchanger {
        // 用于从reader到writer传输record的队列
        private final BlockingQueue<Object> queue = new ArrayBlockingQueue<>(128);
        // writer 
        private final Runnable writer = new Runnable() {
            private final int batchSize = 4;
            // record接收器
            private Object rev(){
                return doPoll();
            }
            @Override
            public void run() {
                System.out.println("writer:");
                Object o;
                // 写入批
                List<Object> batch = new ArrayList<>(batchSize);
                while (null != (o = rev())) {
                    batch.add(o);
                    if (batch.size() >= batchSize) {
                        batch.forEach(System.out::println);
                        batch.clear();
                    }
                }
                if (batch.size() >= batchSize) {
                    batch.forEach(System.out::println);
                    batch.clear();
                }
            }
        };

        // reader
        private final Runnable reader = new Runnable() {
            // record 发送器
            private void send(Object o){
                doPush(o);
            }
            @Override
            public void run() {
                Random random = new Random();
                int i = 0;
                System.out.println("reader:");
                // 生成数据
                while (true) {
                    if (i > 12) {
                        i = 0;
                    }
                    send(random.nextLong());
                    i++;
                }

            }
        };

        /**
         * reader push
         * @param o record
         */
        private void doPush(Object o) {
            try {
                queue.put(o);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(e);
            }
        }
        /**
         * writer poll
         * @return
         */
        private Object doPoll() {
            try {
                return queue.take();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(e);
            }
        }
        public void test(){
            
            Thread writerThread = new Thread(writer);
            Thread readerThread = new Thread(reader);
            //先启动writer 再启动reader
            writerThread.start();
            readerThread.start();

        }

    }
}

```

### reader

> https://github.com/alibaba/DataX/blob/master/dataxPluginDev.md

![datax_framework_new](https://cloud.githubusercontent.com/assets/1067175/17879884/ec7e36f4-6927-11e6-8f5f-ffc43d6a468b.png)

> 关于分片这里有一个可供参考的计算方法[ReaderSplitUtil](https://github.com/alibaba/DataX/blob/82680c4c634197bb4ba983866eb8b8e17d6bfd06/plugin-rdbms-util/src/main/java/com/alibaba/datax/plugin/rdbms/reader/util/ReaderSplitUtil.java#L16)

```java


import com.alibaba.datax.common.element.Column;
import com.alibaba.datax.common.element.Record;
import com.alibaba.datax.common.element.StringColumn;
import com.alibaba.datax.common.plugin.RecordSender;
import com.alibaba.datax.common.spi.Reader;
import com.alibaba.datax.common.util.Configuration;

import java.util.List;


public class DemoReader extends Reader{
    // job 
    // 需要实现的方法有
    // split(int i) 分片方法
    // init() 初始化
    // destroy() 销毁
    public static class Job extends Reader.Job{
        private Configuration originalConfig;
        @Override
        public List<Configuration> split(int i) {
            return null;
        }

        @Override
        public void init() {
            this.originalConfig = this.getPluginJobConf();
        }

        @Override
        public void destroy() {

        }
    }
    // Task
    // 需要实现的方法
    // startRead(RecordSender recordSender) reader的开始方法
    // 这里会生成Record 送往Writer
    // init() 初始化
    // destroy() 销毁
    public static class Task extends Reader.Task {
        private Configuration readerSliceConfig;
        @Override
        public void startRead(RecordSender recordSender) {
            Record record = recordSender.createRecord();
            //
            Column column = new StringColumn("");
            record.addColumn(column);

            recordSender.sendToWriter(record);
        }

        @Override
        public void init() {
            this.readerSliceConfig = super.getPeerPluginJobConf();
            // init
        }

        @Override
        public void destroy() {

        }
    }
}

```

### writer


```java

import com.alibaba.datax.common.element.Record;
import com.alibaba.datax.common.plugin.RecordReceiver;
import com.alibaba.datax.common.spi.Writer;
import com.alibaba.datax.common.util.Configuration;

import java.util.List;

public class DemoWriter extends Writer {
    // init split destroy
    public static class Job extends Writer.Job{
        private Configuration originalConfig;

        @Override
        public List<Configuration> split(int i) {
            return null;
        }

        @Override
        public void init() {
            this.originalConfig = this.getPluginJobConf();
        }

        @Override
        public void destroy() {

        }
    }
    // startWrite init destroy
    public static class Task extends Writer.Task {
        private Configuration writerSliceConfig;
        @Override
        public void startWrite(RecordReceiver recordReceiver) {
            Record record = recordReceiver.getFromReader();
            String s = record.getColumn(0).asString();

        }

        @Override
        public void init() {
            this.writerSliceConfig = super.getPluginJobConf();
        }

        @Override
        public void destroy() {

        }
    }
}


```

### transform


---
title: 'Kafka'
description: 'kafka 文档'
pubDate: 'Sep 19 2023'
heroImage: '/blog-placeholder-2.jpg'
score: 99
subject: 'kafka'
---

### 查看Topic
```java

   private static void testCreateTopic() {

    /**
     * bin/kafka-topics.sh --create \
     *     --bootstrap-server localhost:9092 \
     *     --replication-factor 1 \
     *     --partitions 1 \
     *     --topic streams-wordcount-output \
     *     --config cleanup.policy=compact
     */
        Properties props = new Properties();
        props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

        try (Admin admin = Admin.create(props)) {
            String topicName = "create-topic-with-java";
            int partitions = 1;
            short replicationFactor = 1;
            // Create a compacted topic
            CreateTopicsResult result = admin.createTopics(Collections.singleton(
                    new NewTopic(topicName, partitions, replicationFactor)
                            .configs(Collections.singletonMap(TopicConfig.CLEANUP_POLICY_CONFIG,
                                    TopicConfig.CLEANUP_POLICY_COMPACT))));

            // Call values() to get the result for a specific topic
            KafkaFuture<Void> future = result.values().get(topicName);

            // Call get() to block until the topic creation is complete or has failed
            // if creation failed the ExecutionException wraps the underlying cause.
            future.get();
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

    }

```
### 创建Topic
```java
    /**
     * bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe
     */
    private static void testTopicDescribe() {

        /*
        bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe
        */
        Properties props = new Properties();
        props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

        try (Admin admin = Admin.create(props)) {
             ListTopicsResult result = admin.listTopics();
            result.namesToListings().whenComplete(((stringTopicListingMap, throwable) -> {

                for (Map.Entry<String, TopicListing> entity:stringTopicListingMap.entrySet()) {
                    System.out.println(entity.getKey());
                    System.out.println(entity.getValue().topicId());
                    System.out.println(entity.getValue().name());
                    System.out.println(entity.getValue());

                    System.out.println("------------------------------------------");
                }
            }));
        } catch (Throwable e) {
            throw new RuntimeException(e);
        }

    }

```
### 删除Topic

```java

    private static void testTopicDelete() {


        Properties props = new Properties();
        props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

        try (Admin admin = Admin.create(props)) {

            TopicCollection topicCollection = TopicCollection.ofTopicNames(
                    Collections.singleton("create-topic-with-java"));
            DeleteTopicsResult result = admin.deleteTopics(topicCollection);
            result.all().whenComplete((r,t) ->{
               if (t != null) {
                   t.printStackTrace();
               }
                System.out.println("delete done!");
            });
        } catch (Throwable e) {
            throw new RuntimeException(e);
        }

        
    }

```

### 基本消费者代码

```java


    private static void testAutoConsumer(){

        // 配置属性
        Properties props = new Properties();
        props.setProperty("bootstrap.servers", "localhost:9092");
        props.setProperty("group.id", "test");
        props.setProperty("enable.auto.commit", "true");
        props.setProperty("auto.commit.interval.ms", "1000");
        props.setProperty("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        
        try(KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props)) {
            // 订阅
            consumer.subscribe(Arrays.asList("quickstart-events"));
            while (true) {
                // 拉取
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
                for (ConsumerRecord<String, String> record : records)
                    System.out.printf("offset = %d, key = %s, value = %s%n", record.offset(), record.key(), record.value());
            }
        }

    }

```
### 更详细的消费控制

```java
 private static void testManualConsumer() {
        
        Properties props = new Properties();

        props.setProperty("bootstrap.servers", "localhost:9092");
        props.setProperty("group.id", "test");
        props.setProperty("enable.auto.commit", "false");
        props.setProperty("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);

        consumer.subscribe(Arrays.asList("quickstart-events"), new ConsumerRebalanceListener() {
            @Override
            public void onPartitionsRevoked(Collection<TopicPartition> collection) {
                for (TopicPartition part:collection) {
                    // 获取offset 可以自行处理
                    Long currOffset = consumer.position(part);
                    // we can save the offset in own db
                }
            }

            @Override
            public void onPartitionsAssigned(Collection<TopicPartition> collection) {

//                consumer.seekToBeginning(collection);
                for (TopicPartition part:collection) {
                    // get offset from own db
                    // 可以从自己的系统取得offset 以达将offset与业务系统进行关联
                    Long currOffset = 0L;
                    consumer.seek(part,currOffset);
                }

            }
        });
        // 按照批去
        final int minBatchSize = 10;

        List<ConsumerRecord<String, String>> buffer = new ArrayList<>();
        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
            for (ConsumerRecord<String, String> record : records) {
                buffer.add(record);
            }
            if (buffer.size() >= minBatchSize) {
                printThis(buffer);
                // 手动提交
                consumer.commitAsync();
                buffer.clear();
            }
        }

    }

```

### 指定分区
```java
         // 指定分区
        String topic = "foo";
        TopicPartition partition0 = new TopicPartition(topic, 0);
        TopicPartition partition1 = new TopicPartition(topic, 1);
        consumer.assign(Arrays.asList(partition0, partition1));
```

### 基本生产者

```java

        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("linger.ms", 1);
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");


        try(Producer<String, String> producer = new KafkaProducer<>(props)){
            for (int i = 0; i < 100; i++) {
                producer.send(new ProducerRecord<String, String>("quickstart-events", Integer.toString(i), Integer.toString(i)));
            }
            producer.flush();
        }

```

### 事务

```java
    private static void testTransactions(){

        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("transactional.id", "my-transactional-id");
        try(Producer<String, String> producer = new KafkaProducer<>(props, new StringSerializer(), new StringSerializer())) {
            producer.initTransactions();

            producer.beginTransaction();
            for (int i = 0;i<10;i++){
                producer.send(new ProducerRecord<>("quickstart-events",Integer.toString(i),Integer.toString(i)));
            }
            producer.commitTransaction();
        } catch (ProducerFencedException | OutOfOrderSequenceException | AuthorizationException e) {

        } catch (KafkaException e) {

        }
        
    }


```

### Stream 基本结构

```java
  // 属性配置
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "streams-wordcount");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

        // stream 构建器
        final StreamsBuilder builder = new StreamsBuilder();

        // builder.stream("Source-Topic").xxx.xxx.to("Sink-Topic")
        builder.<String, String>stream("streams-plaintext-input")
               .flatMapValues(value -> Arrays.asList(value.toLowerCase(Locale.getDefault()).split("\\W+")))
               .groupBy((key, value) -> value)
               .count(Materialized.<String, Long, KeyValueStore<Bytes, byte[]>>as("counts-store"))
               .toStream()
               .to("streams-wordcount-output", Produced.with(Serdes.String(), Serdes.Long()));

        final Topology topology = builder.build();
        final KafkaStreams streams = new KafkaStreams(topology, props);
        final CountDownLatch latch = new CountDownLatch(1);

        // attach shutdown handler to catch control-c
        Runtime.getRuntime().addShutdownHook(new Thread("streams-shutdown-hook") {
            @Override
            public void run() {
                streams.close();
                latch.countDown();
            }
        });

        try {
            streams.start();
            latch.await();
        } catch (Throwable e) {
            System.exit(1);
        }
        System.exit(0);
    }
```

### Processor

```java


public class WorldCountProcessor implements Processor<String,String,String,String> {
    private KeyValueStore<String,Integer> keyValueStore;

    @Override
    public void process(Record<String,String> record) {
        
        final String[] words =
                record.value().toUpperCase(Locale.ROOT).split("\\W+");
        for (final String word:words) {
            final Integer oldValue = keyValueStore.get(word);
            if (oldValue == null) {
                keyValueStore.put(word,1);
            }else {
                keyValueStore.put(word,oldValue + 1);
            }
        }

    }

    @Override
    public void close() {

    }

    @Override
    public void init(ProcessorContext context) {
        context.schedule(Duration.ofSeconds(1),
                PunctuationType.STREAM_TIME,
                timestamp ->{
                    try(final KeyValueIterator<String,Integer> iter = keyValueStore.all()) {
                        while (iter.hasNext()) {
                            final KeyValue<String,Integer> entry = iter.next();
                            context.forward(new Record(entry.key,entry.value.toString(),timestamp));
                        }
                    }
                });
        keyValueStore = context.getStateStore("Counts");
    }
}


```

### Topology use Processor

```java
   Topology builder = new Topology();
        final StoreBuilder<KeyValueStore<String, Long>> countsStoreBuilder =
                Stores
                        .keyValueStoreBuilder(
                                Stores.persistentKeyValueStore("Counts"),
                                Serdes.String(),
                                Serdes.Long()
                        );
        builder.addSource("Source","source-topic")
                .addProcessor("Processor", () -> new WorldCountProcessor(),"Source")
                .addStateStore(countsStoreBuilder,"Process")
                .addSink("Sink","sink-topic","Process");

```

### Kafka 设计思想

> https://kafka.apache.org/documentation/#design

#### [Poll or Push](https://kafka.apache.org/documentation/#design_pull)


#### [Message Format](https://kafka.apache.org/documentation/#messageformat)

#### log 文件
![log_file](https://kafka.apache.org/35/images/kafka_log.png)



### [Test Driver](https://kafka.apache.org/35/documentation/streams/developer-guide/testing)
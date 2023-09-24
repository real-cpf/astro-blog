---
title: 'Netty'
description: 'netty 分析文档'
pubDate: 'Sep 19 2023'
heroImage: '/blog-placeholder-2.jpg'
score: 99
subject: 'network'
---

#### EventLoopGroup

> EventLoopGroup 如名是EventLoop的Group 用于管理EventLoop。EventLoopGroup可以理解为一个线程池，其中的线程（EventLoop）负责处理事件和任务。


#### selectable 
```java
     // single thread pool
        NioEventLoopGroup group = new NioEventLoopGroup(1);
        // loop one
        NioEventLoop loop = (NioEventLoop) group.next();
        try {

            Channel channel = new NioServerSocketChannel();
            loop.register(channel).syncUninterruptibly();
            channel.bind(new InetSocketAddress(0)).syncUninterruptibly();
            // config selector
            SocketChannel selectableChannel = SocketChannel.open();
            selectableChannel.configureBlocking(false);
            selectableChannel.connect(channel.localAddress());

            final CountDownLatch latch = new CountDownLatch(1);
            // register key
            loop.register(selectableChannel, SelectionKey.OP_CONNECT, new NioTask<SocketChannel>() {
                @Override
                public void channelReady(SocketChannel ch, SelectionKey key) {
                    latch.countDown();
                }

                @Override
                public void channelUnregistered(SocketChannel ch, Throwable cause) {
                }
            });

            latch.await();

            selectableChannel.close();
            channel.close().syncUninterruptibly();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        } finally {
            group.shutdownGracefully();
        }
   
```

#### full param group and new task queue

```java
   final AtomicBoolean called = new AtomicBoolean();

        NioEventLoopGroup group = new NioEventLoopGroup(
                1, // 线程数
                new ThreadPerTaskExecutor(new DefaultThreadFactory(NioEventLoopGroup.class)), // Executor
                DefaultEventExecutorChooserFactory.INSTANCE, SelectorProvider.provider(), // selector
                DefaultSelectStrategyFactory.INSTANCE, RejectedExecutionHandlers.reject(), // 拒绝策略
                new EventLoopTaskQueueFactory() { // task queue factory
                    @Override
                    public Queue<Runnable> newTaskQueue(int maxCapacity) {
                        called.set(true);
                        return new LinkedBlockingQueue<Runnable>(maxCapacity);
                    }
                });

        final NioEventLoop loop = (NioEventLoop) group.next();

        try {
            loop.submit(new Runnable() {
                @Override
                public void run() {
                    // do some
                }
            }).syncUninterruptibly();
            assert true == called.get();
        } finally {
            group.shutdownGracefully();
        }
```

#### delay await cancel

```java
   EventLoopGroup group = new NioEventLoopGroup(1);

        final EventLoop el = group.next();
        // schedule
        Future<?> future = el.schedule(() -> {
            try {
                TimeUnit.SECONDS.sleep(10);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }, Long.MAX_VALUE, TimeUnit.MILLISECONDS);
        
        // await
        assert false == future.awaitUninterruptibly(100);
        // cancel
        assert true == future.cancel(true);

        group.shutdownGracefully();


```


#### Channel

> Channel是网络传输中的实体，它代表了一个开放的连接，可以进行数据的读写操作。

#### channel init

```java
final String A = "a";
        final String B = "B";
        // inbound handler
        ChannelHandler handler = new ChannelInboundHandlerAdapter() {
            @Override
            public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
                ctx.fireChannelRead(A);
                ctx.fireChannelRead(B);
            }
        };

        // channel
        EmbeddedChannel channel = new EmbeddedChannel(
                new ChannelInitializer<Channel>() {
                    @Override
                    protected void initChannel(Channel channel) throws Exception {
                        channel.pipeline().addLast(handler);
                    }
                }
        );

        assert handler == channel.pipeline().firstContext().handler();

        assert true ==  channel.writeInbound("C");

        assert true == channel.finish();

        assert A.equals(channel.readInbound());

        assert B.equals(channel.readInbound());

```

#### Scheduling

```java
        EmbeddedChannel ch = new EmbeddedChannel(new ChannelInboundHandlerAdapter());
        final CountDownLatch latch = new CountDownLatch(2);
        // future
        Future future = ch.eventLoop().schedule(new Runnable() {
            @Override
            public void run() {
                System.out.println("future");
                latch.countDown();
            }
        }, 1, TimeUnit.SECONDS);
        // 监听future完成
        future.addListener(new FutureListener() {
            @Override
            public void operationComplete(Future future) throws Exception {
                System.out.println("operationComplete");
                latch.countDown();
            }
        });

        // run pending schedule task
        long next = ch.runScheduledPendingTasks();

        System.out.println(next);
        assert next > 0;
        TimeUnit.NANOSECONDS.sleep(TimeUnit.NANOSECONDS.toMillis(next) + 66);
        assert  ch.runScheduledPendingTasks() == -1;
        System.out.println(next);
        latch.await();

```


#### ByteBuf

> ByteBuf作为java NIO中ByteBuffer的Netty版，其语义与ByteBuffer相同，只是操作方式更加丰富

#### 基本操作

```java
        ByteBuf buf = Unpooled.buffer(128);
        List<Object> objects = new LinkedList<>();
        objects.add(buf.capacity());
        objects.add(buf.isReadable());
        objects.add(buf.isDirect());
        objects.add(buf.isReadable());
        objects.forEach(System.out::println);

        buf.writeByte('a');
        buf.writeByte('b');
        buf.writeByte('c');
        System.out.println(buf.writerIndex());
        System.out.println(buf.readerIndex());
        System.out.println(buf.readableBytes());

        assert 'a' == buf.readByte();
        assert 'b' == buf.readByte();
        assert 'c' == buf.readByte();

        buf.readerIndex(0);
        buf.slice(0,3);

        buf.release();


```

## ByteProcess 


```java
 ByteBuf buf = Unpooled.buffer(128);
        buf.writeCharSequence("abc d \re \n f \b c! ?", StandardCharsets.UTF_8);
        int i = 0;
        int last = 0;

        while (-1 != (i = buf.forEachByte(b -> b != 'c'))) {
            if (i > last) {
                byte[] bytes = new byte[i - last];
                buf.readBytes(buf,i,last);
                System.out.println(new String(bytes));
                buf.readerIndex(i + 1);
            }
            last = i;
        }

        buf.readerIndex(0);
        buf.forEachByte(ByteProcessor.FIND_LF);
       
```

## UnPooled 


```java
 byte[] bytes1 = "hello".getBytes(StandardCharsets.US_ASCII);
        byte[] space = " ".getBytes(StandardCharsets.US_ASCII);
        byte[] bytes2 = "world".getBytes(StandardCharsets.US_ASCII);
        ByteBuf buf = Unpooled.wrappedBuffer(bytes1,space,bytes2);
        int len = bytes1.length + bytes2.length + space.length;
        byte[] helloWorld = new byte[len];
        buf.readBytes(helloWorld,0,len);
        System.out.println(new String(helloWorld));

        buf.readerIndex(0);

        ByteBuf buf3_14 = Unpooled.copyFloat(3.14f);

        ByteBuf buf2 = Unpooled.wrappedBuffer(buf,buf3_14);

        buf2.readerIndex(len);
        assert "3.14" == buf2.readFloat() + "";

```


#### ByteToMessage,MessageToByte,MessageToMessage

> 串行的数据流的编码解码


#### ByteToMessage

```java

 // xxxx\r\nxxx\r\n
        ByteToMessageDecoder decoder = new ByteToMessageDecoder() {
            @Override
            protected void decode(
                ChannelHandlerContext channelHandlerContext, // 上下文 
                ByteBuf byteBuf, // 数据buffer
                List<Object> list // 传给下一层的对象
                ) throws Exception {
                while (byteBuf.isReadable()) {
                    int crlfIndex = byteBuf.forEachByte(ByteProcessor.FIND_CRLF);
                    if (crlfIndex == -1) {
                        break;
                    }
                    byte[] bytes = new byte[crlfIndex - byteBuf.readerIndex()];
                    byteBuf.readBytes(bytes,0,crlfIndex - byteBuf.readerIndex());
                    byteBuf.readerIndex(crlfIndex);
                    byteBuf.readShort();
                    list.add(new String(bytes));
                }
            }
        };
        EmbeddedChannel channel = new EmbeddedChannel(decoder);
        channel.writeInbound(Unpooled.wrappedBuffer("hello\r\nworld\r\n".getBytes(StandardCharsets.UTF_8)));
        assert "hello" == (String) channel.readInbound();
        assert "world" == (String) channel.readInbound();
   

```

## MessageToMessage

```java
 ByteToMessageDecoder decoder = new ByteToMessageDecoder() {
            @Override
            protected void decode(
                    ChannelHandlerContext channelHandlerContext, // 上下文
                    ByteBuf byteBuf, // 数据buffer
                    List<Object> list // 传给下一层的对象
            ) throws Exception {
                while (byteBuf.isReadable()) {
                    int crlfIndex = byteBuf.forEachByte(ByteProcessor.FIND_CRLF);
                    if (crlfIndex == -1) {
                        break;
                    }
                    byte[] bytes = new byte[crlfIndex - byteBuf.readerIndex()];
                    byteBuf.readBytes(bytes,0,crlfIndex - byteBuf.readerIndex());
                    byteBuf.readerIndex(crlfIndex);
                    byteBuf.readShort();
                    list.add(new String(bytes));
                }
            }
        };

        MessageToMessageDecoder decoderM2M = new MessageToMessageDecoder() {
            @Override
            protected void decode(ChannelHandlerContext channelHandlerContext, Object o, List list) throws Exception {
                if (o instanceof String) {
                    list.add(String.format("[%s]",o));
                }
            }
        };

        EmbeddedChannel channel = new EmbeddedChannel(decoder);
        channel.pipeline().addLast(decoderM2M);

        channel.writeInbound(Unpooled.wrappedBuffer("hello\r\nworld\r\n".getBytes(StandardCharsets.UTF_8)));
        assert "[hello]" == (String) channel.readInbound();
        assert "[world]" == (String) channel.readInbound();
    
```

## Replaying

```java

// replaying 可以用在一个Message再传输时不在同一时间到达的情况
        ReplayingDecoder<Void> replayingDecoder = new ReplayingDecoder<Void>() {
            @Override
            protected void decode(ChannelHandlerContext channelHandlerContext, ByteBuf in, List<Object> out) throws Exception {
                ByteBuf msg = in.readBytes(in.bytesBefore((byte) '\n'));
                out.add(msg);
                in.skipBytes(1);
            }
        };
        EmbeddedChannel ch = new EmbeddedChannel(replayingDecoder);

        ch.writeInbound(Unpooled.wrappedBuffer(new byte[]{'A'}));
        assert Objects.isNull(ch.readInbound());
        ch.writeInbound(Unpooled.wrappedBuffer(new byte[]{'B'}));
        assert Objects.isNull(ch.readInbound());
        ch.writeInbound(Unpooled.wrappedBuffer(new byte[]{'C'}));
        assert Objects.isNull(ch.readInbound());
        // 直到 \n 传到才完成一个Message的decode
        ch.writeInbound(Unpooled.wrappedBuffer(new byte[]{'\n'}));

        ByteBuf buf = Unpooled.wrappedBuffer(new byte[] { 'A', 'B', 'C' });
        ByteBuf buf2 = ch.readInbound();

        assert buf.toString(StandardCharsets.UTF_8).equals(buf2.toString(StandardCharsets.UTF_8));

        buf2.release();
        buf.release();

        ch.finish();


```

## Codec

```java

// codec 同时有decode和encode
        ByteToMessageCodec<Integer> codec = new ByteToMessageCodec<Integer>() {
            @Override
            protected void encode(ChannelHandlerContext ctx, Integer msg, ByteBuf out) {
                out.writeInt(msg);
            }

            @Override
            protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) {
                if (in.readableBytes() >= 4) {
                    out.add(in.readInt());
                }
            }
        };
        ByteBuf buffer = Unpooled.buffer();
        buffer.writeInt(1);
        buffer.writeByte('0');

        EmbeddedChannel ch = new EmbeddedChannel(codec);
        assert ch.writeInbound(buffer);
        ch.pipeline().remove(codec);
        assert ch.finish();
        assert Integer.compare(1, (Integer) ch.readInbound()) == 0;


```



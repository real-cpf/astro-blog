---
title: 'Actix'
description: 'actix常用文档'
pubDate: 'Sep 24 2023'
heroImage: '/convers/doc/actix-01.webp'
score: 99
subject: 'rust'
---

#### Actor 创建并发送和接收消息

```rust

struct MyActor{
    count:usize
}

///
/// Actor 
impl Actor for MyActor {
    // 每个actor都有一个context
    type Context = Context<Self>;
}

#[derive(Message)]
#[rtype(result = "usize")]
struct Ping(usize);



impl Handler<Ping> for MyActor {
    type Result = usize;

    ///
    /// 接受Ping类型的消息 然后返回usize
    fn handle(&mut self, msg: Ping, ctx: &mut Self::Context) -> Self::Result {
        self.count += msg.0;
        self.count
    }
}


```

#### 发送，接收处理
```rust

#[actix::test]
async fn test1(){
    // 开启新的actor并且返回地址也就近似于akka 中的 ActorRef
    let addr = MyActor { count:10}.start();

    // send 然后handler处理返回
    let res = addr.send(Ping(10)).await;

    print!("Res : {}\n",res.unwrap());

    let id = System::current().id();

    print!("id:{} will stop",id);

    System::current().stop();
}
```

#### 生命周期函数

```rust
///
/// 生命周期有 
/// + Started
/// + Running
/// + Stopping
/// + Stopped
///
/// 重写生命周期函数started,stopped
impl Actor for MineActor {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        println!("started");
    }
    fn stopped(&mut self, ctx: &mut Self::Context) {
        println!("stopped")
    }
}



```

#### 可Response的Message

```rust

///
/// 为了可以返回Responses 我们为Responses实现MessageResponse
impl<A,M> MessageResponse<A,M> for Responses
where A:Actor,
        M:Message<Result = Responses> {
    fn handle(self, ctx: &mut <A as Actor>::Context, tx: Option<actix::dev::OneshotSender<<M as Message>::Result>>) {
        if let Some(tx) = tx {
            tx.send(self);
        }
    }
}

```

### 两个Actor互相发的结构
```rust

use actix::prelude::*;
use std::time::Duration;

#[derive(Message)]
#[rtype(result = "()")]
struct Ping {
    pub id: usize,
}

struct Game {
    counter: usize,
    name: String,
    // 给其他actor发送
    recipient: Recipient<Ping>,
}

impl Actor for Game {
    type Context = Context<Game>;
}

impl Handler<Ping> for Game {
    type Result = ();

    fn handle(&mut self, msg: Ping, ctx: &mut Context<Self>) {
        self.counter += 1;

        if self.counter > 10 {
            System::current().stop();
        } else {
            println!("[{0}] Ping received {1}", self.name, msg.id);

            ctx.run_later(Duration::new(0, 100), move |act, _| {
                // 给recipient发 在这个例子里就是 另一个Game Actor
                act.recipient.do_send(Ping { id: msg.id + 1 });
            });
        }
    }
}

```

### 示例互啄术
```rust

///
/// game 互啄
fn main() {
    let mut system = System::new();
    let addr = system.block_on(async {
        Game::create(|ctx| {
            // game1 的 addr
            let addr = ctx.address();

            // game2
            let addr2 = Game {
                counter: 0,
                name: String::from("Game 2"),
                // game1 的 recipient
                recipient: addr.recipient(),
            }
            .start();

            // game2 先发送
            addr2.do_send(Ping { id: 10 });

            Game {
                counter: 0,
                name: String::from("Game 1"),
                recipient: addr2.recipient(),
            }
        });
    });

    system.run();
}

```


#### Arbiter

```rust
    let sys = System::new();

    let exec = async {
        TheActor.start();
    };

    // 使用Arbiter管理Actor
    let arbiter = Arbiter::new();

    Arbiter::spawn(&arbiter, exec);


    System::current().stop();

    sys.run();
```

#### SyncArbiter

```rust

use actix::prelude::*;

struct MySyncActor;

impl Actor for MySyncActor {
    type Context = SyncContext<Self>;
}
// 线程数2则可以有同时两个Actor在处理
let addr = SyncArbiter::start(2, || MySyncActor);

```
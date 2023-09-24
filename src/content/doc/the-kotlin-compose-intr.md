---
title: 'Compose'
description: 'Compose 分析文档'
pubDate: 'Sep 19 2023'
heroImage: '/blog-placeholder-2.jpg'
score: 99
subject: 'ui'
---



#### 启动入口

```kotlin

/*
 main函数运行

 */
fun main() =
    //An entry point for the Compose application.
    // 启动函数
    application {
        // window
    Window(title = "first demo",
        onCloseRequest = ::exitApplication,
        ) {
        // window > 组件
        App()
    }
}


```

#### 组件

```kotlin

/**
 * @Composable 组件注解 给函数加上注解就代表一个页面组件
 * @Preview 可以借助IDEA上的插件进行组件预览
 */
@Composable
@Preview
fun App() {

    // 计算 状态 当值变化并需要页面变得时会重新运行相关作用域代码的这个组件
    var text by remember { mutableStateOf("Hello, World!") }
    println("app scope")
    MaterialTheme {
        Button(onClick = {
            text = "Hello, Desktop!"
        }) {
            println("text scope")
            Text(text)
        }
    }
}
```

#### Idea 预览效果

![image1](/image/kotlin-compose-img-1.png)


#### 自定义组件

```kotlin

@Composable
fun MyPart(color:Color, // 属性
           onClick:() -> Unit, // 事件
           context:@Composable ()->Unit // 内部Context
){
    Box(modifier = Modifier.background(color).padding(10.dp)
        .clickable(true,onClick={
        onClick()
    })){
        context()
    }
}

// 像其他组件一样使用

@Composable
@Preview
fun App() {
    var text by remember { mutableStateOf("Hello, World!") }
    MaterialTheme {
        // 自定义组件
        MyPart(Color.Red, onClick = {
            text = "my part onclick"
        }){
            Text(text)
        }
    }

}

```



#### 鼠标事件

```kotlin


@Composable
@Preview
fun DemoEvent(){
    var color by remember { mutableStateOf(Color(0,0,0)) }
    var text by remember { mutableStateOf("0,0") }
    @OptIn(ExperimentalComposeUiApi::class)
    Box(
        modifier = Modifier
            .wrapContentSize(Alignment.Center)
            .fillMaxSize()
            .background(color=color)
            .onPointerEvent(PointerEventType.Move) { // 鼠标事件
                // it 可以获取事件属性

                val position = it.changes.first().position
                color = Color(
                    position.x.toInt() % 256, // x 座标映射到256
                    position.y.toInt() % 256, // y 座标 映射到256
                    0)

                text = "${position.x},${position.y}"

            }.onPointerEvent(PointerEventType.Scroll){
                println("${it.changes.first().scrollDelta.x},${it.changes.first().scrollDelta.y}")
            }
    ){
        Text(text=text)
    }
}

```
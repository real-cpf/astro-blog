---
title: 'Serde Syn quote'
description: 'Serde Syn quote 分析文档'
pubDate: 'Sep 24 2023'
heroImage: '/convers/doc/serde-syn-quote-01.webp'
score: 99
subject: 'rust'
---

## serde
> Serde is a framework for serializing and deserializing Rust data structures efficiently and generically.

> 仅依赖syn ,quote ,proc-macro2

#### 基本操作

```rust

use serde::{Deserialize, Serialize};
// 主要是 Serialize，Deserialize 这两个宏
#[derive(Serialize, Deserialize, Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let point = Point { x: 1, y: 2 };

    // Convert the Point to a JSON string.
    let serialized = serde_json::to_string(&point).unwrap();

    // Prints serialized = {"x":1,"y":2}
    println!("serialized = {}", serialized);

    // Convert the JSON string back to a Point.
    let deserialized: Point = serde_json::from_str(&serialized).unwrap();

    // Prints deserialized = Point { x: 1, y: 2 }
    println!("deserialized = {:?}", deserialized);
}
```

#### Deserialize

```rust
// 以该结构为例子
#[derive(Serialize,Debug)]
struct Duration{
    secs:usize,
    nanos:usize,
}

// 方便反序列化
impl Duration {
    fn new(secs:usize,nanos:usize) -> Duration{
        return Duration {
            secs:secs,
            nanos:nanos,
        }
    }
}

// 实现反序列化

impl<'de> Deserialize<'de> for Duration {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        enum Field { Secs, Nanos }

        // This part could also be generated independently by:
        //
        //    #[derive(Deserialize)]
        //    #[serde(field_identifier, rename_all = "lowercase")]
        //    enum Field { Secs, Nanos }
        // 给每个字段实现反序列化
        impl<'de> Deserialize<'de> for Field {
            fn deserialize<D>(deserializer: D) -> Result<Field, D::Error>
            where
                D: Deserializer<'de>,
            {

                struct FieldVisitor;
                // visitor用于处理基本类型
                impl<'de> Visitor<'de> for FieldVisitor {
                    type Value = Field;

                    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                        formatter.write_str("`secs` or `nanos`")
                    }

                    fn visit_str<E>(self, value: &str) -> Result<Field, E>
                    where
                        E: de::Error,
                    {
                        match value {
                            "secs" => Ok(Field::Secs),
                            "nanos" => Ok(Field::Nanos),
                            _ => Err(de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }

                // 处理字段名
                deserializer.deserialize_identifier(FieldVisitor)
            }
        }

        struct DurationVisitor;

        impl<'de> Visitor<'de> for DurationVisitor {
            type Value = Duration;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("struct Duration")
            }
            // 针对序列
            fn visit_seq<V>(self, mut seq: V) -> Result<Duration, V::Error>
            where
                V: SeqAccess<'de>,
            {
                let secs = seq.next_element()?
                    .ok_or_else(|| de::Error::invalid_length(0, &self))?;
                let nanos = seq.next_element()?
                    .ok_or_else(|| de::Error::invalid_length(1, &self))?;
                Ok(Duration::new(secs, nanos))
            }
            // 常见的反序列化map
            fn visit_map<V>(self, mut map: V) -> Result<Duration, V::Error>
            where
                V: MapAccess<'de>,
            {
                let mut secs = None;
                let mut nanos = None;
                while let Some(key) = map.next_key()? {
                    match key {
                        Field::Secs => {
                            if secs.is_some() {
                                return Err(de::Error::duplicate_field("secs"));
                            }
                            secs = Some(map.next_value()?);
                        }
                        Field::Nanos => {
                            if nanos.is_some() {
                                return Err(de::Error::duplicate_field("nanos"));
                            }
                            nanos = Some(map.next_value()?);
                        }
                    }
                }
                let secs = secs.ok_or_else(|| de::Error::missing_field("secs"))?;
                let nanos = nanos.ok_or_else(|| de::Error::missing_field("nanos"))?;
                Ok(Duration::new(secs, nanos))
            }
        }

        const FIELDS: &'static [&'static str] = &["secs", "nanos"];
        deserializer.deserialize_struct("Duration", FIELDS, DurationVisitor)
    }
}

// 最后测试
    let d = Duration{secs:123,nanos:345};
    let ds = serde_json::to_string(&d).unwrap();
    println!("{}",ds);
    let dd:Duration = serde_json::from_str(&ds).unwrap();
    println!("{:#?}",dd);


```


## quote
> This crate provides the quote! macro for turning Rust syntax tree data structures into tokens of source code.
> The idea of quasi-quoting is that we write code that we treat as data. 

#### 基本类型
```rust
    let u = 12usize;
    let i = -38i32;
    let f = 3.1415926f64;
    let c = '\r';
    let s = "\r\nhello\tworld\r\n";

    assert_eq!(
        "12usize - 38i32 3.1415926f64 '\\r' \"\\r\\nhello\\tworld\\r\\n\"",
        quote! {
          #u #i #f #c #s
        }
        .to_string()
    );
    macro_rules! m {
        ($literal:literal) => {
            quote!($literal)
        };
    }

    let expected = "- false";
    assert_eq!(expected, m!(-false).to_string());
```
#### 重复、循环
```rust
    let f0 = format_ident!("World");
    let f1 = format_ident!("Hello{x}", x = f0);
    assert_eq!("HelloWorld",f1.to_string());
    // ident not impl f64
    let f2 = format_ident!("Hello{x}", x = 4050usize);

    assert_eq!("Hello4050",f2.to_string());
    let num: u32 = 10;

    let octal = format_ident!("Id_{:o}", num);
    assert_eq!(octal, "Id_12");

    let binary = format_ident!("Id_{:b}", num);
    assert_eq!(binary, "Id_1010");

    let lower_hex = format_ident!("Id_{:x}", num);
    assert_eq!(lower_hex, "Id_a");

    let upper_hex = format_ident!("Id_{:X}", num);
    assert_eq!(upper_hex, "Id_A");

```

#### 注释
```rust

  let token1 = quote!{
    /* comment */
  };
  let token2 = quote!{
    // comment 
  };

  assert_eq!(token1.to_string(),token2.to_string())

```

## syn
> Syn is a parsing library for parsing a stream of Rust tokens into a syntax tree of Rust source code.

#### syn::File 
```rust
    let mut file = File::open(&filename).expect("Unable to open file");

    let mut src = String::new();
    file.read_to_string(&mut src).expect("Unable to read file");

    let ast = syn::parse_file(&src).unwrap();
    if let Some(shebang) = ast.shebang {
        println!("{}", shebang);
    }
    println!("{} items", ast.items.len());
```

#### DeriveInput for proc_macro_derive 
```rust
#[proc_macro_derive(HeapSize)]
pub fn derive_heap_size(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    // Parse the input tokens into a syntax tree.
    let input = parse_macro_input!(input as DeriveInput);

    // Used in the quasi-quotation below as `#name`.
    let name = input.ident;

    // Add a bound `T: HeapSize` to every type parameter T.
    let generics = add_trait_bounds(input.generics);
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    // Generate an expression to sum up the heap size of each field.
    let sum = heap_size_sum(&input.data);

    let expanded = quote! {
        // The generated impl.
        ...
    };

    // Hand the output tokens back to the compiler.
    proc_macro::TokenStream::from(expanded)
}

```

#### fold 可以在语法转换时hook

```rust
impl Fold for Args {
    // 处理expr类型时
    fn fold_expr(&mut self, e: Expr) -> Expr {
        match e {
            Expr::Assign(e) => {
                if self.should_print_expr(&e.left) {
                    self.assign_and_print(*e.left, &e.eq_token, *e.right)
                } else {
                    Expr::Assign(fold::fold_expr_assign(self, e))
                }
            }
            Expr::Binary(e) if is_assign_op(e.op) => {
                if self.should_print_expr(&e.left) {
                    self.assign_and_print(*e.left, &e.op, *e.right)
                } else {
                    Expr::Binary(fold::fold_expr_binary(self, e))
                }
            }
            _ => fold::fold_expr(self, e),
        }
    }
    // 处理stmt类型
    fn fold_stmt(&mut self, s: Stmt) -> Stmt {
        match s {
            Stmt::Local(s) => {
                if s.init.is_some() && self.should_print_pat(&s.pat) {
                    self.let_and_print(s)
                } else {
                    Stmt::Local(fold::fold_local(self, s))
                }
            }
            _ => fold::fold_stmt(self, s),
        }
    }
}


```
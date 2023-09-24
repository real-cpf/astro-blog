---
title: 'Jdbc'
description: 'jdbc'
pubDate: 'Sep 19 2023'
heroImage: '/blog-placeholder-2.jpg'
score: 99
subject: 'db'
---

### 表结构、列信息获取
```java


    private static void testTableStruct() {
        try (Connection connection = DriverManager.getConnection("");
             PreparedStatement preparedStatement = connection.prepareStatement("select * from table where 1=2")) {
            final ResultSetMetaData metaData = preparedStatement.getMetaData();
            int columnCount = metaData.getColumnCount();
            IntStream.rangeClosed(1, columnCount).forEach(i -> {
                try {
                    String colName = metaData.getColumnName(i);
                    String colTypeName = metaData.getColumnTypeName(i);
                    int colType = metaData.getColumnType(i);
                    metaData.getPrecision(i);
                    metaData.getScale(i);
                    metaData.isAutoIncrement(i);
                    metaData.isDefinitelyWritable(i);
                    metaData.isReadOnly(i);
                    metaData.isWritable(i);
                } catch (SQLException e) {
                    throw new RuntimeException(e);
                }
            });
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
```
### 查询
```java
    private static void testQuery() {
        try (Connection connection = DriverManager.getConnection("");
             PreparedStatement statement = connection.prepareStatement("");
             ResultSet rs = statement.executeQuery()) {
            int colCount = rs.getMetaData().getColumnCount();
            while (rs.next()) {

                for (int i = 0; i < colCount; i++) {
                    final int type = rs.getMetaData().getColumnType(i);
                    switch (type) {
                        case Types.VARBINARY: {

                        }
                        break;
                        case Types.INTEGER: {

                        }
                        break;
                        default: {
                        }
                        break;
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

```
### 事务
```java

    private static void testTransaction() throws SQLException {
        Connection connection = DriverManager.getConnection("");
        try (connection;
             PreparedStatement statement = connection.prepareStatement("");) {
            connection.setAutoCommit(false);
            connection.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
            statement.executeUpdate();
            connection.commit();

        } catch (Exception e) {
            connection.rollback();
            e.printStackTrace();
        } finally {
            connection.setAutoCommit(true);
        }
    }
```

### spi demo

```java
// the driver interface 
public interface MyDriver {
    String format();
    String who();
}
// the driver of my impl
public class TheDriver implements MyDriver{

    @Override
    public String format() {
        return "mydriver://realcpf";
    }

    @Override
    public String who() {
        return "realcpf";
    }
}
// SPI config file
// src\main\resources\META-INF\services\tech.realcpf.jdbc.MyDriver -> tech.realcpf.jdbc.TheDriver
```
### 加载方式
```java

import java.sql.DriverManager;
import java.util.Iterator;
import java.util.ServiceLoader;

public class DemoSpi {


    class MyDriverManager {
        private  volatile boolean initFlag = false;
        public void init() {
            if (initFlag) {
                return;
            }
            
            ServiceLoader<MyDriver> serviceLoader = ServiceLoader.load(MyDriver.class);

            Iterator<MyDriver> driverIterator = serviceLoader.iterator();
            while (driverIterator.hasNext()) {
                MyDriver driver = driverIterator.next();
                System.out.println(driver.who() + ":" + driver.format());
            }

        }

    }

}

```
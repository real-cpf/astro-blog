---
title: 'Excelize'
description: 'Excelize 文档'
pubDate: 'Sep 19 2023'
heroImage: '/blog-placeholder-2.jpg'
score: 99
subject: 'document'
---


### 设置单元格的值
```go

func DemoExcelCreate() {
	fmt.Println("hello")

	f := excelize.NewFile()

	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	sheetName := "MySheet"

	index, err := f.NewSheet(sheetName)
	if err != nil {
		fmt.Println(err)
	}

	// 设置指定单元格的值 需要 sheetName 座标
	f.SetCellValue(sheetName, "A2", "Hello World")
	f.SetCellValue(sheetName, "B2", 100)

	f.SetActiveSheet(index)

	if err := f.SaveAs("tmp/excelize.xlsx"); err != nil {
		fmt.Println(err)
	}

}

```

### 读取单元格的值
```go

func DemoExcelRead() {

	f, err := excelize.OpenFile("tmp/excelize.xlsx")

	if err != nil {
		fmt.Println(err)
		return
	}
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	sheetName := "MySheet"

	// 读取指定单元格的值 需要 sheetName 座标
	cell, err := f.GetCellValue(sheetName, "B2")
	if err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println(cell)

	// 也可以获取整个sheet的数据
	rows, err := f.GetRows(sheetName)
	if err != nil {
		fmt.Println(err)
		return
	}

	// 便利表格
	for _, row := range rows {
		for _, colCell := range row {
			fmt.Print(colCell, "\t")
		}
		fmt.Println()
	}

}
```
### 在Libre Office中创建chart图如下
![excel-series](/image/excel-series-1.png)
### 根据表格数据创建chart
```go   

func DemoMakeChart() {
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	data := [][]interface{}{
		{nil, "Apple", "Orange", "Pear"}, {"Small", 2, 3, 3},
		{"Normal", 5, 2, 4}, {"Large", 6, 7, 8},
	}

	index, err := f.NewSheet("DemoSheet")
	if err != nil {
		fmt.Println(err)
		return
	}
	f.SetActiveSheet(index)

	for idx, row := range data {
		// 坐标到单元格名称将 [X， Y] 坐标转换为单元格
		cell, err := excelize.CoordinatesToCellName(1, idx+1)
		if err != nil {
			fmt.Println(err)
			return
		}
		// 设置一行数据
		f.SetSheetRow("DemoSheet", cell, &row)
	}

	chartSeries := []excelize.ChartSeries{
		{
			Name:       "DemoSheet!$A$2",
			Categories: "DemoSheet!$B$1:$D$1", // 和图里对应
			Values:     "DemoSheet!$B$2:$D$2",
		},
		{
			Name:       "DemoSheet!$A$3",
			Categories: "DemoSheet!$B$1:$D$1",
			Values:     "DemoSheet!$B$3:$D$3",
		},
		{
			Name:       "DemoSheet!$A$4",
			Categories: "DemoSheet!$B$1:$D$1",
			Values:     "DemoSheet!$B$4:$D$4",
		},
	}

	if err := f.AddChart("DemoSheet", "E1", &excelize.Chart{
		Type:   excelize.Col3DClustered,
		Series: chartSeries,
		Title: excelize.ChartTitle{
			Name: "My Demo 3D Chart",
		},
	}); err != nil {
		fmt.Println(err)
	}

	if err := f.SaveAs("tmp/abc.xlsx"); err != nil {
		fmt.Println(err)
	}

}
// 插入图片
func DemoInsertImg() {
	f, err := excelize.OpenFile("tmp/excelize.xlsx")
	if err != nil {
		fmt.Println(err)
		return
	}
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()
	// 插入图片
	if err := f.AddPicture("Sheet1", "A2", "image.png", nil); err != nil {
		fmt.Println(err)
		return
	}
	// 在工作表中插入图片，并设置图片的缩放比例
	if err := f.AddPicture("Sheet1", "D2", "image.jpg",
		&excelize.GraphicOptions{ScaleX: 0.5, ScaleY: 0.5}); err != nil {
		fmt.Println(err)
		return
	}
	// 在工作表中插入图片，并设置图片的打印属性
	enable, disable := true, false
	if err := f.AddPicture("Sheet1", "H2", "image.gif",
		&excelize.GraphicOptions{
			PrintObject:     &enable,
			LockAspectRatio: false,
			OffsetX:         15,
			OffsetY:         10,
			Locked:          &disable,
		}); err != nil {
		fmt.Println(err)
		return
	}
	// 保存文件
	if err = f.Save(); err != nil {
		fmt.Println(err)
	}
}

func DemoTemplate1() {
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	index, err := f.NewSheet("Sheet1")
	if err != nil {
		fmt.Println(err)
	}
	f.SetActiveSheet(index)

	row := []interface{}{"col1", "col2", "col3"}
	f.SetSheetRow("Sheet1", "A1", &row)

	if err := f.SaveAs("Book1.xlsx"); err != nil {
		fmt.Println(err)
	}

}


```

### 代码生成

> Excelize的代码设计规整，文档详细，完全可以通过规则生成代码，下面是一个小例子，还会继续完善

<iframe src="/calc/excelize.html" frameborder="0" style="width: 100rem;height: 100rem;"></iframe>
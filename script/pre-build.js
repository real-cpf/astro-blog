// 导入fs模块
import {readdirSync,readFileSync, writeFileSync}
 from "node:fs"
import { stringify } from "node:querystring";

// 定义一个函数，用于获取文件的第一行
function getFirstLineOfFile(filePath,key) {
    // 使用 readFile 方法读取文件内容
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // 获取文件的第一行
    const theHeadPart = fileContent.split('---\n')[1];
    const resultPart = theHeadPart.split('\n').filter((l)=>l.startsWith(key))[0];
    return resultPart.split('\'')[1];

}

// 定义一个函数，用于扫描文件并获取第一行
function scanFiles(where) {
    // 获取 data 目录下的所有文件路径
    const filePaths = readdirSync(where);
    
    // 定义一个空数组用于存储文件的第一行
    const lines = [];
    
    // 遍历文件路径
    filePaths.forEach(filePath => {
        // 如果文件以 md 结尾，则获取其第一行并添加到数组中
        if (filePath.endsWith('.md')) {
            const v = getFirstLineOfFile(where +'/' +filePath,'subject');
            lines.push({"subject":v});
        }
    });
    
    return lines;
}

// 调用扫描文件的函数
const docPath = './src/content/doc'
const subjects = scanFiles(docPath);
writeFileSync('./src/matedata/subject-data.json',JSON.stringify({"data":subjects}))
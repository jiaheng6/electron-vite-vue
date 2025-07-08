import {ipcMain, dialog, ipcRenderer} from 'electron'
import {query, insert, remove, paginate} from '../sqlite3'
import {v4 as uuidv4} from "uuid";
import { FileHandler } from './fileManage'
import chat from './modelChat'

async function readFileTop(startLie:number, endLine:number) {
    return new Promise(async (resolve, reject) => {
        console.log('--27--❀---> 打开文件')
        const fileHandler = new FileHandler();
        console.log('--30--❀---> ', fileHandler)
        const {canceled, filePaths} = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{name: 'Log Files', extensions: ['log']}]
        });
        if (!canceled && filePaths.length > 0) {
            const filePath = filePaths[0];
            // const content = fs.readFileSync(filePath, 'utf-8');
            const text = await fileHandler.readLines(filePath, startLie, endLine)
            resolve(text)
        } else {
            reject(`File content doesn't exist`)
        }
    })
}

export function registerDatasetHandlers() {
    ipcMain.handle('dataset:query', async () => {
        return await query('dataset')
    })

    ipcMain.handle('dataset:paginate', async (_, {page, size}) => {
        return await paginate('dataset', page, size)
    })

    ipcMain.handle('dataset:add', async (_, data) => {
        return await insert('dataset', {
            id: uuidv4(),
            is_active: false,
            ...data
        })
    })

    ipcMain.handle('dataset:delete', async (_, id) => {
        return await remove('dataset', {id})
    })

    // 通过读取前n条记录，大模型生成分割规则
    ipcMain.handle('log:askForReg', async () => {
        let top20Text = await readFileTop(0, 50);
        const codeText = `/**
         * 通用日志解析器
         * @param {string} logText - 原始日志文本
         * @param {RegExp} regex - 日志段匹配正则表达式，比如const STANDARD_LOG_REGEX = /^(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}\\+\\d{2}:\\d{2})\\s+(\\w+)\\s+([^\\s]+)\\s+(\\[[^\\]]+\\])\\s+(\\[[^\\]]+\\])\\s*(.*(?:\\n\\s+.*)*)/;
         * @param {string[]} fieldNames - 字段名数组，与正则捕获组顺序对应。比如：const STANDARD_FIELDS = ['timestamp', 'level', 'logger', 'thread', 'source', 'rawMessage', 'extend'];
         * @returns {Array} 解析后的日志对象数组
         */
        async parseLogs(logText: string, regex: string, fieldNames: string[]) {
            return new Promise((resolve, reject) => {
                try {
                    console.log('parseLogs--19--❀---> ', regex, fieldNames)
                    const regexObj = new RegExp(regex);
                    const globalRegex = regexObj.global ? regexObj : new RegExp(regexObj.source, (regexObj.flags || '') + 'g');
        
                    const lines = logText.split('\\n');
                    let result = [];
                    for (const line of lines) {
                        const matches = Array.from(line.matchAll(globalRegex), match => {
                            const entry = {};
                            fieldNames.forEach((field, index) => {
                                if (field && match[index + 1]) {
                                    entry[field] = match[index + 1]?.trim();
                                }
                            });
                            return entry;
                        });
                        result = result.concat(matches);
                    }
                    resolve(result);
                } catch (e) {
                    reject(e)
                }
            })
        }`
        const returnText = `{STANDARD_LOG_REGEX: '',STANDARD_FIELDS: ''}`
        let promptText = `下面是一段日志文件：${top20Text}。根据给出的一段日志内容，分析日志的格式和分割方式，返回一段正则表达式，用以分割所有日志内容（注意一段完整的日志，可能有多行组成。仔细识别，按照规律分段。不要遗漏任何内容！！！如果某段内容不知道如何划分，可以用extend字段储存）。我会根据分割标识正则表达式，使用分割的js代码循环对每一行日志内容进行分割。代码为：${codeText}。为了保证代码的正常执行，注意：不要返回多余的内容，比如不要携带markdown那种\`\`\`json标识，直接返回一个普通的json字符串，格式如下${returnText}，以便我可以直接运行JSON.parse进行格式化。`
        let res = await chat(promptText)
        try {
            let { STANDARD_LOG_REGEX, STANDARD_FIELDS } = JSON.parse(res)
            let fileHandler = new FileHandler();
            return await fileHandler.parseLogs(top20Text, STANDARD_LOG_REGEX, STANDARD_FIELDS);
        } catch (e) {
            return e
        }
    })
}

import {ipcMain, dialog, ipcRenderer} from 'electron'
import {query, insert, remove, paginate, createTableIfNotExists, batchInsert, tableExists, dropTable} from '../sqlite3'
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

async function readFileAll() {
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
            const text = await fileHandler.readFile(filePath)
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
        let top20Text = await readFileAll();
        const codeText = ``
        const returnText = ``
        // let promptText = `下面是一段日志文件：${top20Text}。根据给出的一段日志内容，提取日志，每一段有一个时间戳，返回一段正则表达式，用以分割所有日志内容（注意一段完整的日志，可能有多行组成。仔细识别，按照规律用时间戳分段。）。我会根据分割标识正则表达式，使用分割的js代码循环对每一行日志内容进行分割。代码为：${codeText}。为了保证代码的正常执行，注意：不要返回多余的内容，比如不要携带markdown那种\`\`\`json标识，直接返回一个普通的json字符串，格式如下${returnText}，以便我可以直接运行JSON.parse进行格式化。`
        let fileHandler = new FileHandler();
        let _list = await fileHandler.parseLogs(top20Text)
        await loadInDataBase(_list)
        // 7
        return {
            originText: top20Text,
            list: _list
        };
    })

    function loadInDataBase (data: Record<string, any>) {
        return new Promise(async (resolve, reject) => {
            try {
                const uuid = uuidv4().replaceAll('-', '');
                console.log('--87--❀---> ', uuid)
                const tableName = `log_${uuid}`;
                await createTableIfNotExists(tableName, {
                    id: {
                        type: 'INTEGER',
                        primaryKey: true,
                        autoIncrement: true,
                        notNull: true,
                    },
                    timestamp: {
                        type: 'TIMESTAMP',
                        notNull: true
                    },
                    content: {
                        type: 'TEXT',
                        notNull: true,
                    }
                })
                const batchSize = 1000;
                for (let i = 0; i < data.length; i += batchSize) {
                    const batch = data.slice(i, i + batchSize);
                    await batchInsert(tableName, batch);
                }
                await batchInsert('log_history', [{
                    table_name: tableName,
                }])
                resolve('success')
            } catch (e) {
                reject(e)
            }
            // 创建一个表，用来存储fileHandler.parseLogs转换出来的记录，包含自增的id，timestamp,content，表名用`log_${uuid}`
            // 把转换处理完成的数组批量存储进入表
            // 创建成功之后，在log_history表，把表名存进去，以便后续删除
        })
    }

    ipcMain.handle('log:clearAllLog', async () => {
        try {
            let all_logs = await query('log_history')
            for (const log of all_logs) {
                let is_exist = await tableExists(log.table_name)
                if (is_exist) {
                    // 删除指定的日志表
                    await dropTable(log.table_name)
                    // 从日志记录表里面，删除指定的记录
                    await remove('log_history', {
                        id: log.id
                    })
                }
            }
            return {
                data: all_logs,
                msg: '清理完成'
            }
        } catch (e) {
            return {
                data: [],
                msg: e
            }
        }
    })
}

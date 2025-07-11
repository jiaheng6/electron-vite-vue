import {ipcMain, dialog, ipcRenderer} from 'electron'
import fs from 'node:fs'
import {
    query,
    insert,
    remove,
    paginate,
    createTableIfNotExists,
    batchInsert,
    tableExists,
    dropTable,
    rawQuery
} from '../sqlite3'
import {v4 as uuidv4} from "uuid";
import {FileHandler} from './fileManage'
import chat from './modelChat'
import moment from "moment";

async function readFileTop(startLie: number, endLine: number) {
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

    ipcMain.handle('log:askForReg', async (event) => {
        const fileHandler = new FileHandler();
        const {canceled, filePaths} = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{name: 'Log Files', extensions: ['log']}]
        });

        if (canceled || filePaths.length === 0) {
            return {
                originText: '',
                list: []
            };
        }

        const filePath = filePaths[0];
        const chunkSize = 5000;
        let offset = 0;
        let allText = '';
        let allParsedLogs = [];
        const totalLines = await fileHandler.countLines(filePath);
        let timeStr = moment().format('YYYY_MM_DD_HH_mm_ss')
        const tableName = `log_${timeStr}`;
        // 先把表名存储到历史表里面，避免处理失败或者前端问题，没有记录到这张表
        await insert('log_history', {
            table_name: tableName,
        });

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
        });

        while (true) {
            const chunkText = await fileHandler.readLines(filePath, offset, offset + chunkSize);
            if (!chunkText || chunkText.length === 0) break;

            allText += chunkText;
            const parsedChunk = await fileHandler.parseLogs(chunkText);
            allParsedLogs = allParsedLogs.concat(parsedChunk);
            console.log('--130--❀---> ')
            if (parsedChunk) {
                console.log('--132--❀---> ')
                try {
                    await batchInsert(tableName, parsedChunk);
                } catch (e) {
                    console.log('批量插入失败', e)
                    console.log('--137--❀---> ', parsedChunk)
                }
            }
            console.log('--135--❀---> ')
            const progress = Math.min(Math.round((offset / totalLines) * 100), 100);
            event.sender.send('log-insert-chunk', {
                tableName,
                batch: parsedChunk,
                progress
            });

            offset += chunkSize;
        }

        return {
            data: tableName,
            msg: '加载完成'
        };
    })

    ipcMain.handle('log:clearAllLog', async () => {
        try {
            let all_logs = await query('log_history')
            for (const log of all_logs) {
                let is_exist = await tableExists(log.table_name)
                if (is_exist) {
                    await dropTable(log.table_name)
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

    ipcMain.handle('log:deleteLog', async (_, table_name) => {
        let is_exist = await tableExists(table_name)
        if (is_exist) {
            await dropTable(table_name)
            await remove('log_history', {
                table_name: table_name
            })
        }
    })

    ipcMain.handle('log:query', async (event, {tableName, startTime, endTime, searchText, sortType}) => {
        try {
            const exists = await tableExists(tableName);
            if (!exists) {
                return {
                    data: [],
                    msg: '记录不存在，请重新载入'
                };
            }

            let sql = 'SELECT timestamp, content FROM ' + tableName + ' WHERE 1=1';
            const params = [];

            if (startTime) {
                sql += ' AND timestamp >= ?';
                params.push(startTime);
            }

            if (endTime) {
                sql += ' AND timestamp <= ?';
                params.push(endTime);
            }

            if (searchText) {
                sql += ' AND content LIKE ?';
                params.push('%' + searchText + '%');
            }

            if (sortType) {
                sql += ' ORDER BY timestamp ' + (sortType === 'ascend' ? 'ASC' : 'DESC');
            }

            const result = await rawQuery(sql, params);
            return {
                data: result,
                msg: '查询成功'
            };
        } catch (e) {
            return {
                data: [],
                msg: e.message
            };
        }
    })
}

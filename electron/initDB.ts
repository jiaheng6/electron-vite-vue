import {createTableIfNotExists, query, insert, batchInsert, executeSql} from "./sqlite3";
import { v4 as uuidv4 } from 'uuid';
// 初始化数据库和数据表
export default async function initDB () {


    await createTableIfNotExists("dataset", {
        id: {
            type: 'TEXT',
            primaryKey: true,
            notNull: true,
            description: '唯一标识符'
        },
        name: {
            type: 'TEXT',
            notNull: true,
            description: '数据集名称'
        },
        description: {
            type: 'TEXT',
            description: '数据集描述'
        },
        path: {
            type: 'TEXT',
            notNull: true,
            description: '代码库路径'
        },
        git_svn: {
            type: 'TEXT',
            notNull: true,
            default: 'git',
            description: "版本库类型，git还是svn"
        },
        language: {
            type: 'TEXT',
            notNull: true,
            description: '编程语言'
        },
        char_length: {
            type: 'INTEGER',
            default: 0,
            description: '字符长度'
        },
        document_count: {
            type: 'INTEGER',
            default: 0,
            description: '文档数量'
        },
        model_id: {
            type: 'INTEGER',
            foreignKey: {
                table: 'model',
                column: 'id'
            },
            description: '关联模型ID'
        },
        is_active: {
            type: 'BOOLEAN',
            default: true,
            description: '是否激活'
        }
    })


    await createTableIfNotExists('encryption', {
        id: {
            type: 'INTEGER',
            primaryKey: true,
            autoIncrement: true,
            notNull: true,
        },
        user_id: {
            type: 'INTEGER',
            notNull: true,
            foreignKey: {
                table: 'user',
                column: 'id'
            }
        },
        password_hash: {
            type: 'TEXT',
            notNull: true
        },
        salt: {
            type: 'TEXT',
            notNull: true
        }
    })

    await createTableIfNotExists('chat_history', {
        id: {
            type: 'INTEGER',
            primaryKey: true,
            autoIncrement: true,
            notNull: true,
        },
        user_id: {
            type: 'INTEGER',
            notNull: true,
            foreignKey: {
                table: 'user',
                column: 'id'
            }
        },
        message: {
            type: 'TEXT',
            notNull: true
        },
        timestamp: {
            type: 'TIMESTAMP',
            default: 'CURRENT_TIMESTAMP'
        }
    })

    await createTableIfNotExists('model', {
        id: {
            type: 'INTEGER',
            primaryKey: true,
            autoIncrement: true,
            notNull: true,
        },
        name: {
            type: 'TEXT',
            notNull: true
        },
        provider: {
            type: 'TEXT',
            notNull: true
        },
        config: {
            type: 'TEXT'
        }
    })



    // let list = []
    // for(let i = 0; i < 100; i++) {
    //     // await insert('user', { name: 'John', age: i })
    //     list.push({
    //         name: 'John',
    //         age: i
    //     })
    // }
    // // console.log('initDB--113--❀---> ', new Date().getTime().toString())
    // await batchInsert('user', list)
    // console.log('initDB--117--❀---> ', new Date().getTime().toString())
    // let row = await query('user')
    // console.log('initDB--118--❀---> ', row)
    await executeSql(`VACUUM;`) // 整理数据库内容并释放未使用的空间
}



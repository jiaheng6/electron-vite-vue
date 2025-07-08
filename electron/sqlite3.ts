import {app} from 'electron'
import path from 'node:path'
import sqlite3 from 'sqlite3'

const TAG = '[sqlite3]'
let database: Promise<sqlite3.Database>

export function getSqlite3(filename = path.join(app.getPath('userData'), 'database.sqlite3')) {
    return database ??= new Promise<sqlite3.Database>((resolve, reject) => {
        console.log('--10--❀---> ', filename)
        const db = new (sqlite3.verbose().Database)(filename, error => {
            if (error) {
                console.log(TAG, 'sqlite3 init failed :(')
                console.log(TAG, error)
                reject(error)
            } else {
                console.log(TAG, 'sqlite3 init success :)')
                console.log(TAG, filename)
                resolve(db)
            }
        })
    })
}

export async function createTableIfNotExists(tableName: string, schema: Record<string, {
    type: string,
    primaryKey?: boolean,
    foreignKey?: { table: string, column: string },
    description?: string,
    notNull?: boolean,
    autoIncrement?: boolean,
    unique?: boolean,
    default?: string | number | boolean
}>) {
    const db = await getSqlite3()
    return new Promise<boolean>((resolve, reject) => {
        db.get(`SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                  AND name = ?`, [tableName], async (err, row) => {
            if (err) {
                reject(err)
                return
            }

            if (row) {
                resolve(false)
                return
            }

            const columns = Object.entries(schema)
                .map(([name, {
                    type,
                    primaryKey,
                    foreignKey,
                    description,
                    notNull,
                    autoIncrement,
                    unique,
                    default: defaultValue
                }]) => {
                    let columnDef = `${name} ${type}`
                    if (primaryKey) {
                        columnDef += ' PRIMARY KEY'
                    }
                    if (autoIncrement) {
                        columnDef += ' AUTOINCREMENT'
                    }
                    if (foreignKey) {
                        columnDef += ` REFERENCES ${foreignKey.table}(${foreignKey.column})`
                    }
                    if (notNull) {
                        columnDef += ' NOT NULL'
                    }
                    if (unique) {
                        columnDef += ' UNIQUE'
                    }
                    if (defaultValue !== undefined) {
                        columnDef += ` DEFAULT ${defaultValue}`
                    }
                    if (description) {
                        columnDef += ` /* ${description} */`
                    }
                    return columnDef
                })
                .join(', ')

            db.run(`CREATE TABLE ${tableName}
            (
                ${columns},
                created_at TEXT DEFAULT ( datetime ( 'now', 'localtime' )),
                updated_at TEXT DEFAULT ( datetime ( 'now', 'localtime' )),
                is_delete BOOLEAN DEFAULT false
            )`, (createErr) => {
                if (createErr) {
                    reject(createErr)
                } else {
                    resolve(true)
                }
            })
        })
    })
}

export async function insert(table: string, data: Record<string, any>) {
    const db = await getSqlite3()
    const columns = Object.keys(data).join(', ')
    const placeholders = Object.keys(data).map(() => '?').join(', ')
    const values = Object.values(data)
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO ${table} (${columns})
                VALUES (${placeholders})`, values, function (err) {
            if (err) reject(err)
            else resolve(this.lastID)
        })
    })
}

export async function update(table: string, data: Record<string, any>, where: Record<string, any>) {
    const db = await getSqlite3()
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
    const values = [...Object.values(data), ...Object.values(where)]
    return new Promise((resolve, reject) => {
        db.run(`UPDATE ${table}
                SET ${setClause}
                WHERE ${whereClause}`, values, function (err) {
            if (err) reject(err)
            else resolve(this.changes)
        })
    })
}

export async function remove(table: string, where: Record<string, any>) {
    const db = await getSqlite3()
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
    const values = Object.values(where)
    return new Promise((resolve, reject) => {
        db.run(`DELETE
                FROM ${table}
                WHERE ${whereClause}`, values, function (err) {
            if (err) reject(err)
            else resolve(this.changes)
        })
    })
}

export async function query(table: string, where?: Record<string, any>) {
    const db = await getSqlite3()
    let sql = `SELECT *
               FROM ${table}`
    let values: any[] = []
    if (where) {
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
        values = Object.values(where)
        sql += ` WHERE ${whereClause}`
    }
    return new Promise((resolve, reject) => {
        db.all(sql, values, (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
        })
    })
}

export async function rawQuery(sql: string, params: any[] = []) {
    const db = await getSqlite3()
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
        })
    })
}

export async function batchInsert(table: string, dataArray: Record<string, any>[]) {
    const db = await getSqlite3()
    const columns = Object.keys(dataArray[0]).join(', ')
    const placeholders = dataArray.map(() =>
        `(${Object.keys(dataArray[0]).map(() => '?').join(', ')})`
    ).join(', ')
    const values = dataArray.flatMap(data => Object.values(data))

    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO ${table} (${columns}) VALUES ${placeholders}`, values, function (err) {
            if (err) reject(err)
            else resolve(this.lastID)
        })
    })
}

export async function tableExists(tableName: string) {
    const db = await getSqlite3()
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            [tableName],
            (err, row) => {
                if (err) reject(err)
                else resolve(!!row)
            }
        )
    })
}

export async function transaction(callback: (db: sqlite3.Database) => Promise<void>) {
    const db = await getSqlite3()
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION')
            callback(db)
                .then(() => {
                    db.run('COMMIT', (err) => {
                        if (err) reject(err)
                        else resolve()
                    })
                })
                .catch(err => {
                    db.run('ROLLBACK', () => reject(err))
                })
        })
    })
}

export async function executeSql(sql: string, params: any[] = []) {
    const db = await getSqlite3()
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err)
            } else {
                resolve({
                    changes: this.changes,
                    lastID: this.lastID
                })
            }
        })
    })
}
// 分页查询
export async function paginate(table: string, page: number, pageSize: number, where?: Record<string, any>) {
    const db = await getSqlite3()
    let sql = `SELECT *
               FROM ${table}`
    let countSql = `SELECT COUNT(*) as total
                    FROM ${table}`
    let values: any[] = []

    if (where) {
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
        values = Object.values(where)
        sql += ` WHERE ${whereClause}`
        countSql += ` WHERE ${whereClause}`
    }

    sql += ` LIMIT ? OFFSET ?`
    values.push(pageSize, (page - 1) * pageSize)

    const [rows, total] = await Promise.all([
        new Promise((resolve, reject) => {
            db.all(sql, values, (err, rows) => {
                if (err) reject(err)
                else resolve(rows)
            })
        }),
        new Promise((resolve, reject) => {
            db.get(countSql, where ? values.slice(0, -2) : [], (err, row: { total: number }) => {
                if (err) reject(err)
                else resolve(row.total)
            })
        })
    ])

    return {
        data: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(Number(total) / pageSize)
    }
}

export async function dropTable(tableName: string) {
    const db = await getSqlite3()
    return new Promise((resolve, reject) => {
        db.run(`DROP TABLE IF EXISTS ${tableName}`, (err) => {
            if (err) reject(err)
            else resolve(true)
        })
    })
}

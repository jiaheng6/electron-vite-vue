import fs from 'fs';
import path from 'path';
import readline from 'node:readline';

export class FileHandler {
    constructor() {
    }


    formatTimestamp(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            fractionalSecondDigits: 3
        }).replace(/\//g, '-');
    }
    async parseLogs(logText) {
        return new Promise((resolve, reject) => {
            try {
                // 正则表达式匹配时间戳和内容
                const logRegex = /(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{2}:\d{2})\s+(?<content>[\s\S]*?)(?=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{2}:\d{2}|$)/g;

                const logs = [];
                let match;

                while ((match = logRegex.exec(logText)) !== null) {
                    const { timestamp, content } = match.groups;

                    logs.push({
                        timestamp: this.formatTimestamp(timestamp),
                        content: `${timestamp} ${content.trim()}`
                    });
                }
                resolve(logs);
            } catch (e) {
                reject(e);
            }
        });
    }


    /**
     * 读取文件内容
     * @param {string} filePath 文件路径
     * @returns {Promise<string>} 返回文件内容的Promise
     * @example
     * const content = await fileHandler.readFile('./test.txt');
     */
    async readFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    /**
     * 写入文件内容（覆盖）
     * @param {string} filePath 文件路径
     * @param {string} content 要写入的内容
     * @returns {Promise<void>} 写入完成的Promise
     * @example
     * await fileHandler.writeFile('./test.txt', 'Hello World');
     */
    async writeFile(filePath, content) {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, content, 'utf8', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 追加内容到文件末尾
     * @param {string} filePath 文件路径
     * @param {string} content 要追加的内容
     * @returns {Promise<void>} 追加完成的Promise
     * @example
     * await fileHandler.appendFile('./test.txt', '\nNew Line');
     */
    async appendFile(filePath, content) {
        return new Promise((resolve, reject) => {
            fs.appendFile(filePath, content, 'utf8', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 读取文件指定位置的字符
     * @param {string} filePath 文件路径
     * @param {number} position 字符位置（从0开始）
     * @returns {Promise<string|null>} 返回字符或null（如果位置超出范围）
     * @example
     * const char = await fileHandler.readCharAt('./test.txt', 5);
     */
    async readCharAt(filePath, position) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) reject(err);
                else resolve(data[position] || null);
            });
        });
    }

    /**
     * 读取文件指定范围的片段
     * @param {string} filePath 文件路径
     * @param {number} start 起始位置（包含）
     * @param {number} end 结束位置（包含）
     * @returns {Promise<string>} 返回文件片段的Promise
     * @example
     * const chunk = await fileHandler.readChunk('./test.txt', 10, 20);
     */
    async readChunk(filePath, start, end) {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filePath, {
                start,
                end,
                encoding: 'utf8'
            });
            let data = '';
            stream.on('data', chunk => data += chunk);
            stream.on('end', () => resolve(data));
            stream.on('error', reject);
        });
    }

    async readLines(filePath, startLine, endLine) {
        return new Promise((resolve, reject) => {
            const lines = [];
            let currentLine = 1;
            const stream = fs.createReadStream(filePath, {
                encoding: 'utf8'
            });
            const rl = readline.createInterface({
                input: stream,
                crlfDelay: Infinity
            });
            rl.on('line', (line) => {
                if (currentLine >= startLine && currentLine <= endLine) {
                    lines.push(line);
                }
                currentLine++;
                if (currentLine > endLine) {
                    rl.close();
                }
            });
            rl.on('close', () => {
                resolve(lines.join('\n'));
            });
            rl.on('error', reject);
        });
    }

    /**
     * 检查文件是否存在
     * @param {string} filePath 文件路径
     * @returns {Promise<boolean>} 返回布尔值表示文件是否存在
     * @example
     * const exists = await fileHandler.fileExists('./test.txt');
     */
    async fileExists(filePath) {
        return new Promise((resolve) => {
            fs.access(filePath, fs.constants.F_OK, (err) => {
                resolve(!err);
            });
        });
    }

    /**
     * 获取文件状态信息
     * @param {string} filePath 文件路径
     * @returns {Promise<fs.Stats>} 返回文件状态对象
     * @example
     * const stats = await fileHandler.getFileStats('./test.txt');
     */
    async getFileStats(filePath) {
        return new Promise((resolve, reject) => {
            fs.stat(filePath, (err, stats) => {
                if (err) reject(err);
                else resolve(stats);
            });
        });
    }

    /**
     * 创建目录（递归创建）
     * @param {string} dirPath 目录路径
     * @returns {Promise<void>} 创建完成的Promise
     * @example
     * await fileHandler.createDirectory('./new-folder/sub-folder');
     */
    async createDirectory(dirPath) {
        return new Promise((resolve, reject) => {
            fs.mkdir(dirPath, {recursive: true}, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 读取目录内容
     * @param {string} dirPath 目录路径
     * @returns {Promise<string[]>} 返回目录下的文件和子目录列表
     * @example
     * const files = await fileHandler.readDirectory('./folder');
     */
    async readDirectory(dirPath) {
        return new Promise((resolve, reject) => {
            fs.readdir(dirPath, (err, files) => {
                if (err) reject(err);
                else resolve(files);
            });
        });
    }

    /**
     * 删除文件
     * @param {string} filePath 文件路径
     * @returns {Promise<void>} 删除完成的Promise
     * @example
     * await fileHandler.deleteFile('./test.txt');
     */
    async deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 删除目录（递归删除）
     * @param {string} dirPath 目录路径
     * @returns {Promise<void>} 删除完成的Promise
     * @example
     * await fileHandler.deleteDirectory('./folder');
     */
    async deleteDirectory(dirPath) {
        return new Promise((resolve, reject) => {
            fs.rmdir(dirPath, {recursive: true}, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 复制文件
     * @param {string} source 源文件路径
     * @param {string} destination 目标文件路径
     * @returns {Promise<void>} 复制完成的Promise
     * @example
     * await fileHandler.copyFile('./source.txt', './dest.txt');
     */
    async copyFile(source, destination) {
        return new Promise((resolve, reject) => {
            fs.copyFile(source, destination, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 重命名/移动文件
     * @param {string} oldPath 原路径
     * @param {string} newPath 新路径
     * @returns {Promise<void>} 操作完成的Promise
     * @example
     * await fileHandler.renameFile('./old.txt', './new.txt');
     */
    async renameFile(oldPath, newPath) {
        return new Promise((resolve, reject) => {
            fs.rename(oldPath, newPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 监视文件变化
     * @param {string} filePath 文件路径
     * @param {function} callback 变化回调函数
     * @returns {fs.FSWatcher} 返回文件监视器对象
     * @example
     * await fileHandler.watchFile('./test.txt', (eventType, filename) => {
     *   console.log(`File changed: ${eventType} ${filename}`);
     * });
     */
    async watchFile(filePath, callback) {
        return fs.watch(filePath, {encoding: 'utf8'}, (eventType, filename) => {
            callback(eventType, filename);
        });
    }

    /**
     * 获取文件扩展名
     * @param {string} filePath 文件路径
     * @returns {string} 文件扩展名（包含点）
     * @example
     * const ext = await fileHandler.getFileExtension('./test.txt'); // '.txt'
     */
    async getFileExtension(filePath) {
        return path.extname(filePath);
    }

    /**
     * 获取文件名（包含扩展名）
     * @param {string} filePath 文件路径
     * @returns {string} 文件名
     * @example
     * const name = await fileHandler.getFileName('./path/test.txt'); // 'test.txt'
     */
    async getFileName(filePath) {
        return path.basename(filePath);
    }

    /**
     * 获取文件所在目录路径
     * @param {string} filePath 文件路径
     * @returns {string} 目录路径
     * @example
     * const dir = await fileHandler.getDirectoryPath('./path/test.txt'); // './path'
     */
    async getDirectoryPath(filePath) {
        return path.dirname(filePath);
    }

    /**
     * 拼接路径
     * @param {...string} paths 路径片段
     * @returns {string} 拼接后的路径
     * @example
     * const fullPath = await fileHandler.joinPaths('./path', 'to', 'file.txt'); // './path/to/file.txt'
     */
    async joinPaths(...paths) {
        return path.join(...paths);
    }
}

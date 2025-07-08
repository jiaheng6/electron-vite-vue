import { net } from 'electron';

const netRequest = (option: any) => {
    return new Promise((resolve, reject) => {
        const request = net.request(option);
        let data = {};
        request.on('response', (response) => {
            response.on('data', (chunk) => {
                data = chunk;
            });
            response.on('end', () => {
                if (response.statusCode !== 200) {
                    reject({response: {status: response.statusCode, data: data}});
                }
                resolve(data);
            });
        });
        request.end();
    });
};

/**
 * 基础网络请求方法
 * @param {string} url - 请求地址
 * @param {any} data - 请求数据
 * @param {string} [method='post'] - 请求方法，默认为post
 * @returns {Promise<any>} 返回Promise对象，包含响应数据
 * @example
 * // 示例1: 发送POST请求
 * baseRequest('https://api.example.com', { key: 'value' })
 *   .then(data => console.log(data))
 *   .catch(err => console.error(err));
 *
 * // 示例2: 发送GET请求
 * baseRequest('https://api.example.com', null, 'get')
 *   .then(data => console.log(data))
 *   .catch(err => console.error(err));
 */
export const baseRequest = (url: any, data: any, method = 'post') => {
    const option = {url, data, method};
    return netRequest(option);
};

import { OpenAI } from "@llamaindex/openai";

export default async function chat(text: string) {
    return new Promise(async (resolve, reject) => {
        // 初始化OpenAI客户端
        const openai = new OpenAI({
            apiKey: "sk-10ee646390d2489db5be4bbf4bcc5e38", // 可以是任意字符串，如果私有部署不需要验证
            baseURL: "https://maas.hikvision.com.cn/v1", // 你的私有部署URL
            headers: {
                "Authorization": "Bearer sk-10ee646390d2489db5be4bbf4bcc5e38"
            },
            model: "DeepSeek-V3-0324-1874024892354772993"
        });

        try {
            // 调用聊天接口
            const response = await openai.chat({
                model: "DeepSeek-V3-0324-1874024892354772993", // 你的私有模型名称
                messages: [
                    { role: "system", content: "用中文和指定的格式回答我的问题。" },
                    { role: "user", content: text }
                ],
                temperature: 0.7,
            });
            resolve(response.message.content)
        } catch (error) {
            console.error("调用API出错:", error);
            reject(error);
        }
    })
}

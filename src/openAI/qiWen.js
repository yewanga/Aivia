import OpenAI from "openai";

export const openai = new OpenAI({
    apiKey: 'sk-4b8f6b8e94514f50b8e9da6b55aa921f',
    dangerouslyAllowBrowser: true,
    baseURL: "https://dashscope.aliyuncs.com/api/v2/apps/protocols/compatible-mode/v1"
});

// async function main() {
//     // 第一轮对话
//     const response1 = await openai.responses.create({
//         model: "qwen3.5-plus",
//         input: "我的名字是张三，请记住。"
//     });
//     console.log(`第一轮回复: ${response1.output_text}`);
//
//     // 第二轮对话 - 使用 previous_response_id 关联上下文，响应id有效期为7天
//     const response2 = await openai.responses.create({
//         model: "qwen3.5-plus",
//         input: "你还记得我的名字吗？",
//         previous_response_id: response1.id
//     });
//     console.log(`第二轮回复: ${response2.output_text}`);
// }

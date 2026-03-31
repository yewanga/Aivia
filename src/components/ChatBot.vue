<template>
  <div class="assistant-container">
    <!-- 顶部标题 -->
    <div class="header">
      <h1>智慧小助手</h1>
      <p class="subtitle">请上传Excel文件（仅表头），然后描述需要填充的内容</p>
    </div>

    <!-- 对话框区域 -->
    <div class="chat-container">
      <!-- 对话消息区域 -->
      <div class="chat-messages" ref="chatMessages">
        <div v-for="(message, index) in messages" :key="index" class="chat-message" :class="message.role">
          <div v-if="message.role === 'assistant'" class="message-content">
            <div class="message-header">
              <span class="message-icon">🤖</span>
              <span class="message-time">{{ formatTime(message.time) }}</span>
            </div>
            <div class="message-text">{{ message.content }}</div>

            <!-- 上传区域（当需要上传文件时显示） -->
            <div v-if="message.showUpload" class="upload-area">
              <el-upload
                  class="upload-demo"
                  :http-request="handleUpload"
                  :show-file-list="false"
                  accept=".xlsx, .xls"
                  :before-upload="beforeUpload"
                  :disabled="isProcessing"
              >
                <el-button type="primary" :disabled="isProcessing">
                  {{ isProcessing ? '处理中...' : '上传Excel文件（仅表头）' }}
                </el-button>
              </el-upload>
              <p class="upload-tip">请上传包含表头的Excel文件</p>
            </div>

            <!-- 数据预览（当有生成内容时显示） -->
            <div v-if="message.data && message.data.length > 0" class="data-preview">
              <div class="data-header">生成的数据预览（前3条）：</div>
              <div class="data-table">
                <table>
                  <thead>
                  <tr>
                    <th v-for="(header, idx) in headers" :key="idx">{{ header }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="(row, idx) in message.data.slice(0, 3)" :key="idx">
                    <td v-for="(cell, cellIdx) in row" :key="cellIdx">{{ cell }}</td>
                  </tr>
                  </tbody>
                </table>
                <div v-if="message.data.length > 3" class="data-footer">
                  ... 共 {{ message.data.length }} 条数据
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="message.role === 'user'" class="message-content">
            <div class="message-header">
              <span class="message-icon">👤</span>
              <span class="message-time">{{ formatTime(message.time) }}</span>
            </div>
            <div class="message-text">{{ message.content }}</div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            placeholder="描述需要填充的内容，例如：生成5条销售数据，按部门合并，部门名称相同则合并行"
            :disabled="isProcessing"
            @keyup.enter="handleSend"
        />
        <div class="input-actions">
          <el-button
              type="primary"
              @click="handleSend"
              :disabled="!userInput.trim() || isProcessing"
          >
            {{ isProcessing ? '生成中...' : '发送' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import * as XLSX from 'xlsx';
import { ElMessage } from 'element-plus';
import {openai} from "@/openAI/qiWen.js";

// ⚠️ 重要：以下API Key仅用于演示，实际项目必须使用后端代理！
// 请勿在生产环境中使用此API Key，否则会导致费用被刷！
// const DASHSCOPE_API_KEY = 'sk-4b8f6b8e94514f50b8e9da6b55aa921f'; // 请替换为您的实际API Key

// 状态管理
const messages = ref([]);
const userInput = ref('');
const isProcessing = ref(false);
const headers = ref([]);
const file = ref(null);
const chatMessages = ref(null);

// 初始化欢迎消息
onMounted(() => {
  addMessage('assistant', '你好！我是智慧小助手。请上传一个包含表头的Excel文件，然后描述需要填充的内容，我可以生成一个Excel。例如：生成5条销售数据，按部门合并，部门名称相同则合并行');
});

// 添加消息到对话
const addMessage = (role, content, data = null, showUpload = false) => {
  messages.value.push({
    role,
    content,
    data,
    showUpload,
    time: new Date().getTime()
  });

  // 滚动到最新消息
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  });
};

// 检查文件类型
const beforeUpload = (file) => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  if (!isExcel) {
    ElMessage.error('仅支持上传Excel文件（.xlsx/.xls）');
    return false;
  }
  return true;
};

// 处理上传
const handleUpload = async ({ file: uploadedFile }) => {
  file.value = uploadedFile;
  try {
    // 读取Excel表头
    const data = new FileReader();
    data.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      // 提取表头（第一行）
      const headerRow = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[0];
      headers.value = headerRow;

      if (headers.value.length === 0) {
        ElMessage.error('Excel文件必须包含表头');
        return;
      }

      // 添加成功提示
      addMessage('assistant', `已成功提取表头：${headers.value.join(' | ')}。请描述需要填充的内容`);

      // 移除上传提示（因为已经上传成功）
      const lastMessage = messages.value[messages.value.length - 1];
      if (lastMessage.showUpload) {
        messages.value.pop();
        addMessage('assistant', `已成功提取表头：${headers.value.join(' | ')}。请描述需要填充的内容`);
      }

      ElMessage.success('表头提取成功！');
    };
    data.readAsArrayBuffer(uploadedFile);
  } catch (error) {
    ElMessage.error('文件解析失败: ' + error.message);
  }
};

// 发送消息
const handleSend = async () => {
  if (!userInput.value.trim() || isProcessing.value) return;

  // 添加用户消息
  const userContent = userInput.value.trim();
  addMessage('user', userContent);
  userInput.value = '';

  isProcessing.value = true;

  try {
    // //检查是否已上传Excel
    // if (headers.value.length === 0) {
    //   // 未上传Excel，提示上传
    //   addMessage('assistant', '请先上传Excel文件', null, true);
    //   return;
    // }

    // ⚠️ 前端直接调用大模型API（仅用于演示，不安全！）
    let assistantMessages = messages.value.filter(msg => msg.role === 'assistant')
    const response = await openai.responses.create({
      model: "qwen3.5-plus",
      input: userContent,
      previous_response_id: assistantMessages.length > 1 ? assistantMessages[assistantMessages.length - 1].data.id : null,
    });

    // 添加助手回复
    addMessage('assistant', `${response.output_text}`, response);

    // ElMessage.success('内容生成成功！');
  } catch (error) {
    addMessage('assistant', `生成失败: ${error.message}`);
  } finally {
    isProcessing.value = false;
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};
</script>

<style scoped>
.assistant-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 25px;
}

.header h1 {
  color: #1890ff;
  margin-bottom: 8px;
  font-size: 28px;
}

.subtitle {
  color: #595959;
  font-size: 14px;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

.chat-container {
  background: #f9fafb;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  height: 600px;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.chat-message {
  margin-bottom: 20px;
  max-width: 85%;
  line-height: 1.5;
}

.chat-message.user {
  margin-left: auto;
  background: #1890ff;
  color: white;
  border-radius: 18px 18px 0 18px;
}

.chat-message.assistant {
  margin-right: auto;
  background: #f5f7fa;
  border-radius: 18px 18px 18px 0;
}

.message-content {
  padding: 12px 15px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.message-icon {
  margin-right: 5px;
  font-size: 14px;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
}

.upload-area {
  margin-top: 10px;
  text-align: center;
}

.upload-tip {
  color: #666;
  font-size: 13px;
  margin-top: 8px;
}

.data-preview {
  margin-top: 15px;
  background: #f0f9ff;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
}

.data-header {
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.data-table {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  margin-top: 8px;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;
}

.data-table th, .data-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.data-table th {
  background: #f0f9ff;
  font-weight: 600;
}

.data-footer {
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 8px;
}

.chat-input {
  padding: 15px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #b4b4b4;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}
</style>
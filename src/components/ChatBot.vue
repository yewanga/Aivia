<template>
  <div class="chat-wrapper" :class="{ minimized: isMinimized }">
    <!-- 最小化状态：仅显示 AI 头像 -->
    <div v-if="isMinimized" class="minimized-avatar" @click="toggleMinimize">
      <el-avatar
          :size="50"
          :style="{ backgroundColor: '#67C23A', cursor: 'pointer' }"
          icon="ChatLineRound"
      />
      <!-- 可选：新消息红点 -->
      <el-badge
          v-if="hasNewMessage"
          is-dot
          class="new-message-badge"
      />
    </div>

    <!-- 正常聊天窗口 -->
    <div v-else class="chat-container">
      <!-- 右上角收缩按钮 -->
      <div class="header">
        <span class="title">🤖 表智助手</span>
        <el-button
            type="text"
            size="small"
            @click="toggleMinimize"
            style="margin-left: auto"
        >
          <el-icon><Fold /></el-icon>
        </el-button>
      </div>

      <!-- 上传区域 -->
      <div class="upload-area">
        <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleExcelUpload"
            accept=".xlsx,.xls"
        >
          <el-button type="primary" size="small" :icon="Upload">
            上传 Excel 表头
          </el-button>
        </el-upload>
        <el-tag v-if="tableHeaders.length > 0" size="small" type="success" style="margin-left: 12px">
          已加载 {{ tableHeaders.length }} 个字段
        </el-tag>
        <el-tag v-else size="small" type="info" style="margin-left: 12px">未上传表格</el-tag>
      </div>

      <!-- 聊天区域 -->
      <el-scrollbar ref="scrollbarRef" class="chat-area">
        <div v-for="msg in messages" :key="msg.id" class="message-row">
          <el-row :type="msg.sender === 'user' ? 'flex' : undefined" :justify="msg.sender === 'user' ? 'end' : 'start'">
            <el-col :span="2" style="display: flex; align-items: center; justify-content: center;">
              <el-avatar
                  :icon="msg.sender === 'user' ? User : ChatLineRound"
                  size="small"
                  :style="{ backgroundColor: msg.sender === 'user' ? '#409EFF' : '#67C23A' }"
              />
            </el-col>
            <el-col :span="20">
              <div
                  class="bubble"
                  :class="{
                  'user-bubble': msg.sender === 'user',
                  'ai-bubble': msg.sender === 'ai'
                }"
              >
                <span v-if="msg.isTyping">{{ displayedText }}</span>
                <span v-else>{{ msg.content }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-scrollbar>

      <!-- 输入区域 -->
      <div class="input-area">
        <el-input
            v-model="inputText"
            placeholder="例如：表格有哪些字段？第3列叫什么？"
            @keyup.enter="sendMessage"
            clearable
            :disabled="sending"
        >
          <template #prefix>
            <el-icon><ChatLineSquare /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="sendMessage" :loading="sending" :icon="Promotion">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onBeforeUnmount, watch } from 'vue'
import * as XLSX from 'xlsx'
import {
  Upload,
  User,
  ChatLineSquare,
  ChatLineRound,
  Promotion,
  Fold
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// =============== 响应式状态 ===============
const isMinimized = ref(false)
const inputText = ref('')
const sending = ref(false)
const tableHeaders = ref([])
const typingInterval = ref(null)
const fullResponse = ref('')
const scrollbarRef = ref(null)
const hasNewMessage = ref(false) // 用于最小化时显示红点

const messages = reactive([
  {
    id: 1,
    sender: 'ai',
    content: '👋 你好！我是智能表格助手“表智”。请先上传 Excel 文件，我将自动读取表头并回答字段相关问题~',
    isTyping: false
  }
])

// 监听新消息（用于红点提示）
watch(messages, () => {
  const lastMsg = messages[messages.length - 1]
  if (lastMsg && lastMsg.sender === 'ai' && !isMinimized.value) {
    hasNewMessage.value = false
  }
})

// =============== 计算属性 ===============
const displayedText = computed(() => fullResponse.value)

// =============== 方法 ===============
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
  if (!isMinimized.value) {
    hasNewMessage.value = false // 展开时清除红点
    nextTick(() => scrollToBottom())
  }
}

const handleExcelUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })

      if (workbook.SheetNames.length === 0) {
        ElMessage.warning('Excel 文件不包含有效工作表')
        return
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

      if (json.length === 0) {
        ElMessage.error('Excel 文件为空')
        return
      }

      tableHeaders.value = json[0]
          .map(h => String(h || '').trim())
          .filter(h => h !== '')

      messages.push({
        id: Date.now(),
        sender: 'ai',
        content: `✅ 已成功解析 Excel 表头！共识别 ${tableHeaders.value.length} 个有效字段：\n` +
            tableHeaders.value.map((h, i) => `${i + 1}. ${h}`).join('\n'),
        isTyping: false
      })

      ElMessage.success(`成功加载 ${tableHeaders.value.length} 个字段`)
      scrollToBottom()
    } catch (err) {
      console.error('Excel 解析错误:', err)
      ElMessage.error('解析失败：请确认是标准 Excel 文件（.xlsx/.xls）')
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

const getAIResponse = (userMsg) => {
  const lower = userMsg.toLowerCase().trim()
  const headers = tableHeaders.value

  if (/表头|字段|列名|有哪些列|包含什么/.test(lower)) {
    if (headers.length === 0) {
      return '⚠️ 请先点击上方按钮上传 Excel 文件，我才能读取表头信息哦~'
    }
    return `📋 当前表格包含 ${headers.length} 个字段：\n` +
        headers.map((h, i) => `• 第${i + 1}列: ${h}`).join('\n')
  }

  if (/第(\d+)列/.test(lower)) {
    if (headers.length === 0) return '⚠️ 请先上传 Excel 文件'
    const match = lower.match(/第(\d+)列/)
    if (match) {
      const colIndex = parseInt(match[1], 10) - 1
      if (colIndex >= 0 && colIndex < headers.length) {
        return `🔍 第 ${colIndex + 1} 列的字段名是：**${headers[colIndex]}**`
      } else {
        return `❌ 表格只有 ${headers.length} 列，不存在第 ${colIndex + 1} 列`
      }
    }
  }

  if (/最后一列|最后.*字段/.test(lower)) {
    if (headers.length === 0) return '⚠️ 请先上传 Excel 文件'
    return `🔚 最后一列（第${headers.length}列）的字段名是：**${headers[headers.length - 1]}**`
  }

  if (/包含.*姓名|有.*邮箱|有没有.*电话/.test(lower)) {
    if (headers.length === 0) return '⚠️ 请先上传 Excel 文件'
    const keywordMap = {
      '姓名': /姓名|名字|名称/,
      '邮箱': /邮箱|邮件|email/,
      '电话': /电话|手机|联系方式|手机号/
    }
    for (const [key, regex] of Object.entries(keywordMap)) {
      if (lower.includes(key)) {
        const found = headers.find(h => regex.test(h.toLowerCase()))
        return found
            ? `✅ 找到包含"${key}"的字段：**${found}**`
            : `❌ 未找到包含"${key}"的字段`
      }
    }
  }

  if (/^你好|^hello/i.test(lower)) return '😊 你好！我是表格小助手，请上传 Excel 文件开始对话~'
  if (/名字|叫什么/.test(lower)) return '🤖 我叫“表智”，专注帮你理解表格结构！'
  if (/谢谢|感谢/.test(lower)) return '✨ 不客气！随时为你效劳~'
  if (/再见|拜拜/.test(lower)) return '👋 再见！需要时随时回来找我~'

  return headers.length > 0
      ? `💡 你可以问我：\n• “表格有哪些字段？”\n• “第3列叫什么？”\n• “包含姓名的字段是哪个？”`
      : `📎 请先上传 Excel 文件，我才能帮你分析表格结构哦！`
}

const sendMessage = () => {
  if (!inputText.value.trim() || sending.value) return

  messages.push({
    id: Date.now(),
    sender: 'user',
    content: inputText.value,
    isTyping: false
  })

  const userInput = inputText.value
  inputText.value = ''
  sending.value = true

  setTimeout(() => {
    const aiReply = getAIResponse(userInput)
    const aiMsg = {
      id: Date.now() + 1,
      sender: 'ai',
      content: '',
      isTyping: true
    }
    messages.push(aiMsg)

    // 如果当前最小化，标记有新消息
    if (isMinimized.value) {
      hasNewMessage.value = true
    }

    simulateTyping(aiReply, aiMsg)
  }, 400)
}

const simulateTyping = (fullText, msgObj) => {
  let index = 0
  fullResponse.value = ''
  if (typingInterval.value) clearInterval(typingInterval.value)

  typingInterval.value = setInterval(() => {
    if (index < fullText.length) {
      fullResponse.value += fullText[index]
      index++
    } else {
      clearInterval(typingInterval.value)
      msgObj.content = fullText
      msgObj.isTyping = false
      fullResponse.value = ''
      scrollToBottom()
    }
  }, 25)
}

const scrollToBottom = () => {
  nextTick(() => {
    const scrollbar = scrollbarRef.value
    if (scrollbar?.wrapRef) {
      scrollbar.wrapRef.scrollTop = scrollbar.wrapRef.scrollHeight
    }
  })
}

onBeforeUnmount(() => {
  if (typingInterval.value) clearInterval(typingInterval.value)
})
</script>

<style scoped>
/* 整体容器 */
.chat-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  transition: all 0.3s ease;
}

/* 最小化状态 */
.chat-wrapper.minimized {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.minimized-avatar {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.new-message-badge {
  position: absolute;
  top: 4px;
  right: 4px;
}

/* 正常聊天窗口 */
.chat-container {
  width: 380px;
  max-width: 95vw;
  height: 620px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fc;
  border-bottom: 1px solid #eee;
  font-weight: 600;
  color: #333;
}

.upload-area {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  background-color: #fafcff;
}

.chat-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #fafcff;
}

.message-row {
  margin-bottom: 16px;
}

.bubble {
  padding: 12px 16px;
  border-radius: 18px;
  word-break: break-word;
  max-width: 85%;
  line-height: 1.5;
  font-size: 14px;
}

.user-bubble {
  background: linear-gradient(135deg, #409eff, #5dade2);
  color: white;
  text-align: right;
  border-bottom-right-radius: 6px;
}

.ai-bubble {
  background-color: #ffffff;
  color: #333;
  border: 1px solid #ebeef5;
  border-bottom-left-radius: 6px;
}

.input-area {
  display: flex;
  padding: 12px;
  border-top: 1px solid #eee;
  gap: 10px;
  background-color: #fff;
}

.input-area .el-input {
  flex: 1;
}

.input-area .el-button {
  padding: 0 20px;
}
</style>
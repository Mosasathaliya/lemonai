<template>
    <div class="lemon-container">
        <div class="lemon-content">
            <!-- 主页面 -->
            <div class="lemon-main">
                <ChatHeader :title="currentChat.title" />
                <ChatMessages :messages="messages" />
                <div class="scroll-to-bottom" @click="scrollToBottom" v-if="isShowScrollToBottom">
                    <Down />
                </div>
                <div class="lemon-footer">
                    <div style="display: flex;align-items: center;">
                        <div><img style="width: 24px;height: 24px; margin-right: 5px;" src="@/assets/svg/mighty-agent-logo.svg" alt="Mighty Agent" /></div>
                        <span style="color: #34322d;font-size: .875rem;line-height: 1.25rem;">
                            <div v-if="playStatus!='running'">Mighty Agent{{ $t('task_finished') }}</div>
                            <div v-else>Mighty Agent{{ $t('task_playing') }}...</div>
                        </span>
                    </div>
                    <div>
                        <a-button v-if="playStatus!='running'" type="primary" @click="handleRestart">{{ $t('replay') }}</a-button>
                        <a-button v-else type="primary" @click="toResult">{{ $t('jump_to_result') }}</a-button>
                    </div>
                </div>
            </div>
            <!-- 实时预览文件-->
            <Preview class="preview" />
            <!--本地预览文件-->
            <LocalPreview class="preview" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

import Preview from '@/components/preview/index.vue'
import LocalPreview from '@/components/preview/fullPreview.vue'
import ChatHeader from '@/view/lemon/components/ChatHeader.vue'
import ChatMessages from '@/view/lemon/components/ChatMessages.vue'
import emitter from '@/utils/emitter';

import { useRoute } from 'vue-router';
const route = useRoute();

import { useChatStore } from '@/store/modules/chat';
const chatStore = useChatStore();
const isCollapsed = ref(false);

const currentChat = computed(() => chatStore.chat)
const messages = computed(() => chatStore.messages)
const playStatus = computed(() => chatStore.list.find((c) => c.conversation_id == route.params.id)?.status)

import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
}

let conversationId;
const init = async () => {
    // chatStore.messages = caseData;
    // 从路由中获取id
    conversationId = route.params.id;
    chatStore.playback(conversationId,500);
}
const handleRestart = () => {
    emitter.emit('fullPreviewVisable-close')
    chatStore.playback(conversationId,500);
};


const toResult = () => {
    chatStore.toResult();
};


const isShowScrollToBottom = ref(false);

onMounted(() => {
    //添加滚动事件监听
    init();
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return false;
    chatMessages.addEventListener('scroll', () => {
        if (chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight > 200) {
            isShowScrollToBottom.value = true;
        } else {
            isShowScrollToBottom.value = false;
        }
    })
})

const scrollToBottom = () => {
  const chatMessages = document.querySelector('.chat-messages');
  if(!chatMessages) return false;
  chatMessages.scrollTop = chatMessages.scrollHeight - chatMessages.clientHeight;
}




</script>

<style lang="scss" scoped>
.menu-switch {
    cursor: pointer;
}

.lemon-container {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100vh;
    background: var(--ma-app-background);
    padding: 20px;
}

.lemon-content {
    width: 100%;
    height: 100%;
    display: flex;
    overflow-y: auto;
    background: linear-gradient(180deg, rgba(16, 31, 63, 0.9) 0%, rgba(6, 13, 32, 0.92) 100%);
    border-radius: 24px;
    border: 1px solid rgba(76, 118, 208, 0.2);
    box-shadow:
        0 25px 60px rgba(6, 12, 29, 0.55),
        inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(18px);

    .lemon-main {
        min-width: 50%;
        padding-left: 1.75rem;
        padding-right: 1.75rem;
        max-width: 100%;
        width: 100%;
        overflow: hidden;
    }

    .preview {
        max-width: 50%;
        min-width: 50%;
        background: rgba(12, 24, 54, 0.65);
        border-left: 1px solid rgba(76, 118, 208, 0.18);
        box-shadow: inset 0 0 0 1px rgba(47, 107, 255, 0.08);
    }
}

@media screen and (max-width: 768px) {
    .preview {
        position: absolute;
        z-index: 999;
        margin: 0px;
        width: 100vw !important;
        height: 100vh !important;
        border-radius: 0px;
        max-width: 100vh !important;
        border: unset !important;
        box-shadow: unset !important;
    }
}

@media (min-width: 640px) {
  .lemon-main {
    max-width: 768px!important;
    min-width: 390px!important;
    margin-left: auto;
    margin-right: auto;
  }
}

.lemon-footer{
    position: sticky;
    bottom: 12px;
    padding-right: .75rem;
    padding-left: 1rem;
    padding-top: 9px;
    padding-bottom: 9px;
    background: rgba(18, 38, 79, 0.8);
    border:1px solid rgba(76, 118, 208, 0.25);
    border-radius: 1rem;
    box-shadow:
      0px 12px 32px rgba(6, 12, 29, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    display: flex;
    justify-content: space-between;
    color: var(--ma-text-primary);
}

:deep(.more-btn){
    display: none!important;
}
:deep(.share-btn){
    display: none!important;
}
</style>

<template>
  <div class="chat-header">
    <div class="header-left">
      <h1 class="chat-title">{{ title }}</h1>
    </div>

    <div class="header-right">
      <!-- <div class="share-btn" @click="$emit('share')">
        <Share />
        <span style="min-width: max-content;">{{ $t('lemon.chatHeader.share') }}</span>
      </div> -->
      <div class="search-file-btn btn ">
        <a-tooltip :title="$t('lemon.chatHeader.viewAllFiles')" placement="bottom" :arrow="false">
          <SearchFile @click="handleFileExplorer" />
        </a-tooltip>
      </div>
      <!-- <div class="collect-btn btn" @click="handleCollect" :class="{ 'favorite': isFavorite }">
        <a-tooltip :title="favoriteTitle" placement="bottom" :arrow="false">
          <Collect @click="$emit('collect')" />
        </a-tooltip>
      </div> -->
      <div class="more-btn btn" @click="handleMore">
        <a-tooltip :title="$t('lemon.chatHeader.moreOptions')" placement="bottom" :arrow="false">
          <More />
        </a-tooltip>
        <div class="more-menu" v-if="showMore">
          <div class="edit-name" @click="handleEditName">
            <Edit />
            <span>{{ $t('lemon.chatHeader.rename') }}</span>
            <div style="width: 16px; height: 16px;"></div>
          </div>
        </div>
      </div>
    </div>
    <a-modal 
      v-model:open="open" 
      :title="$t('lemon.chatHeader.editTitle')" 
      centered  
      :width="400" 
      class="edit-title-modal" 
      :footer="null"
    > 
      <span class="edit-title">{{ $t('lemon.chatHeader.enterNewTitle') }}</span>
      <a-input v-model:value="titleValue" class="edit-title-input" />
      <footer>
        <div class="footer-btn">
          <div class="cancel-btn" @click="handleCancel">{{ $t('lemon.chatHeader.cancel') }}</div>
          <div class="confirm-btn" @click="handleOk">{{ $t('lemon.chatHeader.confirm') }}</div>
        </div>
      </footer>
    </a-modal>
  </div>
</template>

<script setup>
import emitter from '@/utils/emitter'
import { ShareAltOutlined, ToolOutlined } from '@ant-design/icons-vue'
import workspaceService from '@/services/workspace'
import { useChatStore } from '@/store/modules/chat'
import Share from '@/assets/svg/share.svg'
import Collect from '@/assets/svg/collect.svg'
import SearchFile from '@/assets/svg/searchFile.svg'
import { useI18n } from 'vue-i18n'
import More from '@/assets/svg/more.svg'
import Edit from '@/assets/svg/edit.svg'
const { t } = useI18n()
import { ref, onMounted, onUnmounted, computed } from 'vue'

const handleTerminal = () => {
  emitter.emit('preview-close', false)
  emitter.emit('terminal-visible', true)
}
const handleFileExplorer = () => {
  emitter.emit('file-explorer-visible', true)
}

import { storeToRefs } from 'pinia'
const chatStore = useChatStore()
const { chat } = storeToRefs(chatStore)

const props = defineProps({
  title: {
    type: String,
    default: ''
  }
})

const titleValue = ref('')
const showMore = ref(false)

const isFavorite = computed(() => chat.value.is_favorite)
const favoriteTitle = computed(() => isFavorite.value ? t('lemon.chatHeader.unfavorite') : t('lemon.chatHeader.favorite'))
const handleCollect = () => {
  if (isFavorite.value) {
    chatStore.unfavorite()
  } else {
    chatStore.favorite()
  }
}
const handleMore = () => {
  showMore.value = !showMore.value
}

const open = ref(false)

const handleEditName = () => {
  open.value = true
  titleValue.value = chatStore.chat.title;
}

const handleOk = () => {
  open.value = false
  chatStore.updateConversationTitle(titleValue.value)
}

const handleCancel = () => {
  open.value = false
}

const handleClickOutside = (event) => {
  const moreBtn = document.querySelector('.more-btn');
  if (moreBtn && !moreBtn.contains(event.target)) {
    showMore.value = false;
  }
};

// 在组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// 在组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

defineEmits(['share'])

</script>

<style lang="scss" scoped>
.chat-header {
  padding-top: .75rem;
  padding-bottom: .25rem;
  background: rgba(12, 24, 54, 0.9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  gap: 4px;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(76, 118, 208, 0.25);
  box-shadow: 0 10px 35px rgba(5, 12, 28, 0.35);
}

.header-left {
  overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chat-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--ma-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI Variable Display, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: .5rem;

  .share-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 0;
    border-radius: 999px;
    gap: .25rem;
    align-items: center;
    padding: 0 .75rem;
    height: 2rem;
    cursor: pointer;
    border: 1px solid rgba(76, 118, 208, 0.25);
    background: rgba(22, 39, 82, 0.5);
    color: var(--ma-text-secondary);
    transition: all 0.2s ease;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: .65rem;
    padding: 6px;
    cursor: pointer;
    background: rgba(22, 39, 82, 0.55);
    border: 1px solid rgba(76, 118, 208, 0.28);
    color: var(--ma-text-secondary);
    transition: all 0.2s ease;

    svg {
      width: 18px;
      height: 18px;
    }
  }
}

.more-menu {
  position: absolute;
  right: -50px;
  top: 50px;
  background: var(--ma-surface-elevated);
  border-radius: .75rem;
  cursor: pointer;
  border: 1px solid var(--ma-border);
  min-width: max-content;
  box-shadow: var(--ma-shadow-soft);

  .edit-name {
    display: flex;
    align-items: center;
    gap: .75rem;
    border-radius: .75rem;
    padding: 12px 16px;
    cursor: pointer;
    color: var(--ma-text-primary);

    &:hover {
      background: rgba(47, 107, 255, 0.18);
      color: var(--ma-accent);
    }
  }
}

.favorite {
  color: var(--ma-accent) !important;
  svg {
    stroke: var(--ma-accent) !important;
    fill: var(--ma-accent) !important;
  }
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid rgba(76, 118, 208, 0.25);
  border-radius: 10px;
  background: rgba(22, 39, 82, 0.45);
  color: var(--ma-text-primary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: rgba(47, 107, 255, 0.2);
    color: var(--ma-accent);
  }

  i {
    font-size: 16px;
  }
}

.status-indicator {
  padding: 4px 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  background: rgba(29, 214, 255, 0.18);
  color: var(--ma-accent);
}

.edit-title {
  font-size: 13px;
  font-weight: 400;
  color: var(--ma-text-secondary);
}

.edit-title-input {
  margin-top: 10px;
}

.footer-btn {
  display: flex;
  padding-top: 1.25rem;
  gap: .5rem;
  justify-content: flex-end;

  .cancel-btn {
    cursor: pointer;
    font-size: 13px;
    font-weight: 400;
    color: var(--ma-text-secondary);
    font-size: .875rem;
    line-height: 1.25rem;
    padding-top: .5rem;
    padding-bottom: .5rem;
    padding-left: .75rem;
    padding-right: .75rem;
    border: 1px solid rgba(76, 118, 208, 0.3);
    border-radius: 10px;
    background: rgba(22, 39, 82, 0.35);
    transition: all 0.2s ease;
  }

  .confirm-btn {
    cursor: pointer;
    font-size: 13px;
    font-weight: 400;
    background: linear-gradient(135deg, var(--ma-primary-strong) 0%, var(--ma-secondary) 70%, var(--ma-accent) 100%);
    color: var(--ma-text-primary);
    font-size: .875rem;
    line-height: 1.25rem;
    padding-top: .5rem;
    padding-bottom: .5rem;
    padding-left: .75rem;
    padding-right: .75rem;
    border: 1px solid var(--ma-border-strong);
    border-radius: 10px;
    box-shadow: var(--ma-shadow-glow);
    transition: all 0.2s ease;
  }
}

@media screen and (max-width: 768px) {
  .chat-title {
    padding-inline-start: 1.75rem;
    width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .share-btn {
    outline: none !important;
    padding: 5px !important;
    width: 28px !important;
    height: 28px !important;
    display: flex !important;
    span {
      display: none;
    }
  }
  .more-menu {
    right: -10px !important;
    left: auto;
  }
}

@media (hover: hover) and (pointer: fine) {
  .share-btn:hover {
    background: rgba(47, 107, 255, 0.22);
    color: var(--ma-accent);
    box-shadow: var(--ma-shadow-glow);
  }
  .btn:hover {
    background: rgba(47, 107, 255, 0.22);
    color: var(--ma-accent);
    box-shadow: var(--ma-shadow-glow);
  }
  .confirm-btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--ma-shadow-glow);
  }
  .cancel-btn:hover {
    background: rgba(47, 107, 255, 0.18);
    color: var(--ma-accent);
    box-shadow: var(--ma-shadow-glow);
  }
}
</style>
<style lang="scss">
.edit-title-modal {
  .ant-modal-header {
    margin-bottom: 5px !important;
  }
  .ant-modal-content {
    border-radius: 20px !important;
  }
}
</style>

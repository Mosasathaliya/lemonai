<template>
  <div class="welcome-screen" @click="closeDropdown">
    <div class="welcome-mode">
      <span>{{ agent.name }}</span>
      <div class="dropdown-icon-wrapper" @click.stop="toggleDropdown">
        <CaretDownOutlined class="dropdown-icon" />
        <div v-if="showDropdown" class="dropdown-menu">
          <div class="menu-item" @click.stop="openEdit">
            <EditOutlined class="icon" /> Edit
          </div>
          <div class="menu-item" @click.stop="editKnowledge">
            <ReadOutlined class="icon" /> Knowledge
          </div>
          <!-- <div class="menu-item danger" @click.stop="confirmDelete(agent.id)">
            <DeleteOutlined class="icon" /> Delete
          </div> -->
        </div>
      </div>
    </div>


    <div class="welcome-content">
      <h1>{{ $t('lemon.welcome.greeting', { username }) }}</h1>
      <p>Create, train, and evolve your Mighty Agent.</p>
      <ChatInput @send="handleWelcomeInput" />
    </div>

    <KnowledgeModal ref="knowledgeModalRef" :agentId="null" />
    <AgentsEdit v-model:visible="editVisible" v-model:id="agent.id" />
   
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ChatInput from './ChatInput.vue';

import { CaretDownOutlined } from '@ant-design/icons-vue';
import { useChatStore } from '@/store/modules/chat';
import seeAgent from '@/services/see-agent';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import emitter from '@/utils/emitter';
import { storeToRefs } from 'pinia';
import { EditOutlined, DeleteOutlined, ReadOutlined } from '@ant-design/icons-vue'

const chatStore = useChatStore();
const router = useRouter();
const { t } = useI18n();
const { mode, agent } = storeToRefs(chatStore);
const props = defineProps({
  username: String
});

import KnowledgeModal from '@/view/agents/components/KnowledgeModal.vue';
import AgentsEdit from '@/view/agents/components/agentsEdit.vue'

const knowledgeModalRef = ref(null);
const editVisible = ref(false);

const editKnowledge = () => {
  console.log('editKnowledge');
  showDropdown.value = false;
  knowledgeModalRef.value.visible = true;
};

const openEdit = () => {
  showDropdown.value = false;
  editVisible.value = true;
};

const sampleClick = (item) => {
  emitter.emit('changeMessageText', item.content);
};

const handleWelcomeInput = async (value) => {
  const { text, files, mcp_server_ids,workMode } = value;
  const result = await chatStore.createConversation(text, mode.value);
  const { conversation_id } = result;
  if (conversation_id) {
    router.push(`/chat/${agent.value.id}/${conversation_id}`);
  }
  if (mode.value === 'chat') {
    await seeAgent.sendMessage(text, conversation_id, [], mcp_server_ids,workMode);
  } else {
    await seeAgent.sendMessage(text, conversation_id, files, mcp_server_ids,workMode);
  }
};

const handleModeTitle = computed(() => {
  return 'Agent';
});

const showDropdown = ref(false);

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const closeDropdown = () => {
  showDropdown.value = false;
};
</script>

<style lang="scss" scoped>
.welcome-screen {
  background: linear-gradient(205deg, rgba(12, 24, 54, 0.95) 0%, rgba(7, 14, 34, 0.96) 65%, rgba(3, 7, 20, 0.98) 100%);
  overflow: auto;
  height: 100%;
  padding: 0 36px 56px;
  color: var(--ma-text-primary);
}

.welcome-content {
  margin-top: 180px;
  margin-left: auto;
  margin-right: auto;
  max-width: 768px;
  width: 100%;
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  text-align: center;

  h1 {
    line-height: 42px;
    font-size: 34px;
    color: var(--ma-text-primary);
    margin: 0 !important;
    text-shadow: 0 12px 35px rgba(6, 136, 255, 0.35);
  }

  p {
    color: var(--ma-text-secondary);
    font-size: 26px;
    margin-bottom: 24px;
    letter-spacing: 0.02em;
  }
}

.welcome-mode {
  display: flex;
  align-items: center;
  position: relative;
  font-size: 16px;
  margin-top: 8px;
  color: var(--ma-text-primary);
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(20, 42, 88, 0.45);
  border: 1px solid rgba(76, 118, 208, 0.25);
  box-shadow: var(--ma-shadow-soft);
}

.dropdown-icon-wrapper {
  position: relative; // 作为 dropdown-menu 的定位基准
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  cursor: pointer;

  .dropdown-menu {
    position: absolute;
    top: 100%; // 紧挨着下拉 icon 下边
    left: 0;
    background: var(--ma-surface-elevated);
    border: 1px solid var(--ma-border);
    border-radius: 12px;
    padding: 6px 0;
    box-shadow: var(--ma-shadow-soft);
    z-index: 10;
    min-width: 140px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
    color: var(--ma-text-primary);
    transition: all 0.2s ease;

    &.danger {
      color: #ff4d4f;
    }

    &:hover {
      background: rgba(47, 107, 255, 0.22);
      color: var(--ma-accent);
    }


  }
}


.case-container {
  margin-top: 92px;
  padding: 0 2.5rem 100px;
}

.store {
  margin-top: 100px;

  ::v-deep(.card-grid) {
    max-height: unset;
  }
}

@media (max-width: 768px) {
  .case-container {
    padding-left: 2px !important;
    padding-right: 2px !important;
  }

  .welcome-screen{
      padding: 0 16px 36px;
      ::v-deep(.store .mobile-menu-btn) {
        display: none!important;
      }
      //main-content
      ::v-deep(.store .main-content) { 
        padding:0px;
      }
      //search-bar-wrapper
      ::v-deep(.store .search-bar-wrapper) {
        width: 100%;
        justify-content: space-between!important;
      }
  }
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;

  &::-webkit-scrollbar {
    display: none;
  }
}

.case-title {
  margin: 1.25rem 0;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--ma-text-muted);
}

.tab {
  padding: 8px 1.1rem;
  border-radius: 999px;
  border: 1px solid rgba(76, 118, 208, 0.25);
  color: var(--ma-text-secondary);
  font-size: 0.875rem;
  line-height: 1.25rem;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.2s ease;
  background: rgba(22, 39, 82, 0.35);

  &:hover {
    background: rgba(47, 107, 255, 0.22);
    color: var(--ma-accent);
    box-shadow: var(--ma-shadow-glow);
  }

  &.active {
    background: linear-gradient(135deg, var(--ma-primary-strong) 0%, var(--ma-secondary) 70%, var(--ma-accent) 100%);
    color: var(--ma-text-primary);
    font-weight: 600;
    border-color: var(--ma-border-strong);
    box-shadow: var(--ma-shadow-glow);
  }
}

@media screen and (max-width: 768px) {
  .welcome-header {
    height: 48px;
    position: sticky;
    top: 0;
    background: rgba(7, 14, 34, 0.9);
    z-index: 1;
    backdrop-filter: blur(12px);
  }

  .icon {
    display: none;
  }
}

.dropdown-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  cursor: pointer;
}

.dropdown-icon {
  font-size: 16px;
  color: var(--ma-text-secondary);
}

/* 适配 移动端 */
@media screen and (max-width: 768px) {
  .welcome-content {
    h1 {
      display: none;
    }

    p {
      font-size: 16px !important;
      text-align: center;
    }
  }
}
</style>

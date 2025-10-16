<template>
  <div class="about">
    <h2>{{ $t('setting.about.title') }}</h2>
    <div class="options-item">
      <div class="son">
        <div>
          <span>{{ $t('setting.about.lemonAI') }}</span>
          <span class="version">V{{ versionInfo.localVersion }}</span>
        </div>
        <div>
          <a-button @click="handleUpdate">{{ $t('setting.about.checkUpdate') }}</a-button>
        </div>
      </div>
      <div class="son">
        <div>
          <span>{{ $t('setting.about.officialWebsite') }}</span>
        </div>
        <div>
          <a-button @click="handleOpenMightyAgentPage">{{ $t('setting.about.view') }}</a-button>
        </div>
      </div>
      <div class="son">
        <div>
          <span>{{ $t('setting.about.feedback') }}</span>
        </div>
        <div>
          <a-button @click="handleIssuePage">{{ $t('setting.about.submitFeedback') }}</a-button>
        </div>
      </div>
      <!-- <div class="son last">
        <div>
          <span>{{ $t('setting.about.license') }}</span>
        </div>
        <div>
          <a-button>{{ $t('setting.about.view') }}</a-button>
        </div>
      </div> -->
    </div>
  </div>
  <a-modal :open="updateVisible" :footer="null" :closable="false" :centered="true">
    <div
      class="update-prompt"
      style="border-radius: 12px; text-align: center; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"
    >
      <h2 style="color: #d81b60; font-size: 24px; margin: 0 0 16px;">
        {{ $t('setting.about.newVersionReleased') }}
      </h2>
      <p style="color: #333; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
        {{ $t('setting.about.version') }}：<strong>V{{ versionInfo.localVersion }} --> </strong>
        <strong> V{{ versionInfo.latestVersion }}</strong>
      </p>
      <!-- TODO show update detail -->
      <div class="update-detail" style="display: flex;">
        <markdownRender :content="versionInfo.body" />
      </div>
      <div style="display: flex; justify-content: center; gap: 16px; padding: 10px;">
        <a-button @click="updateVisible = false;">
          {{ $t('setting.about.skipUpdate') }}
        </a-button>
        <a-button type="primary" @click="handleOpenReleasePage()">
          {{ $t('setting.about.viewDetails') }}
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import versionService from '@/services/version';
import { message } from 'ant-design-vue';
import markdownRender from '@/components/markdown/index.vue';

const { t } = useI18n();

const versionInfo = ref({
  localVersion: '0.4.0',
  latestVersion: '0.4.0',
  isLatest: true,
  updateUrl: 'https://github.com/yu-mengyun/vue-admin-template',
  message: 'the current version is the latest version',
});
const updateVisible = ref(false);

function handleUpdate() {
  if (versionInfo.value.isLatest) {
    message.success(t('setting.about.alreadyLatest'));
  } else {
    updateVisible.value = true;
  }
}

function handleOpenReleasePage() {
  window.open(versionInfo.value.updateUrl, '_blank');
}

function handleOpenMightyAgentPage() {
  // Open deployed app root by default
  window.open('/', '_blank');
}

function handleIssuePage() {
  window.open('https://github.com/hexdocom/lemonai/issues/new', '_blank');
}

onMounted(() => {
  versionService.getVersionInfo().then((res) => {
    console.log(res);
    versionInfo.value = res;
  });
});
</script>

<style scoped>
.about {
  padding: 16px;
  color: #333;
}

.options-item {
  padding: 16px;
  background-color: rgb(254, 254, 254);
  width: 100%;
  border: 1px solid #c6c6c6;
  border-radius: 10px;
  font-size: 15px;
  display: flex;
  flex-direction: column;

  .son {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 10px 0px;
    border-bottom: 1px solid #d4d4d4;
  }

  .last {
    border-bottom: none;
  }
}

@media screen and (max-width: 768px) {
  .about {
    padding: 16px;
  }

  .title {
    font-size: 2rem;
  }
}

.version {
  margin-left: 10px;
  color: #36deee;
  border-radius: 4px;
  /* background-color: #f7f7f7; */
}

.update-detail {
  width: 100%;
  max-height: 500px;
  overflow: auto;
  padding: 2px;
}
.update-detail::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* Mighty Agent theming overrides */
.about {
  background: linear-gradient(182deg, rgba(16, 33, 71, 0.9) 0%, rgba(8, 17, 37, 0.95) 100%);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(76, 118, 208, 0.22);
  box-shadow: 0 24px 50px rgba(6, 12, 29, 0.45);
  color: var(--ma-text-primary);
}

.about h2 {
  color: var(--ma-text-primary);
  text-shadow: 0 10px 28px rgba(6, 136, 255, 0.25);
}

.about .options-item {
  background: rgba(14, 28, 62, 0.6);
  border: 1px solid rgba(76, 118, 208, 0.18);
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.about .options-item .son {
  border-bottom: 1px solid rgba(76, 118, 208, 0.2);
}

.about .options-item .son:last-child {
  border-bottom: none;
}

.about .options-item span,
.about .version {
  color: var(--ma-text-secondary);
}

.about .options-item .version {
  color: var(--ma-accent);
}

.about :deep(.ant-btn) {
  background: linear-gradient(135deg, var(--ma-primary-strong) 0%, var(--ma-secondary) 70%, var(--ma-accent) 100%) !important;
  border-color: transparent !important;
  color: var(--ma-text-primary) !important;
  box-shadow: var(--ma-shadow-glow);
}

.about :deep(.ant-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 18px 40px rgba(32, 210, 255, 0.25) !important;
}
</style>



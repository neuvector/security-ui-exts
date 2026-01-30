<template>
  <div class="page">
    <div class="header-section">
      <div class="header-left">
        <div class="description">
          {{ t('imageScanner.vexManagement.description') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'VexManagement' };
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  padding: 0 100px 0 0;
  min-height: 100%;
}

.header-section {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  align-self: stretch;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 8px;
    flex: 1 0 0;
  }

  .description {
    max-width: 900px;
    align-self: stretch;
    color: var(--disabled-text);
    font-family: Lato;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 21px;
  }

  .header-btn {
    height: 40px;
  }
}
</style>

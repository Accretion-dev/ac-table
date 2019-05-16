<template>
  <div :class="prefixCls">
  </div>
</template>

<script>
const prefixCls = 'ac-tree-item'

export default {
  name: 'ac-tree-item',
  props: {
    tree: { type: Object, default () { return [] } }
  },
  computed: {
  },
  data () {
    return {
      prefixCls
    }
  },
  beforeCreate: function () {
    this.$options.components.acTreeItem = require('./ac-tree-item.vue').default
  }
}
</script>

<style lang="scss">
$pre: ac-tree-item;
.#{$pre} {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 800px;
}

</style>

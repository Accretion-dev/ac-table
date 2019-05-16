<template>
  <div :class="prefixCls">
    <ac-tree-item :tree="tree" />
  </div>
</template>

<script>
const prefixCls = 'ac-tree'
import acTreeItem from './ac-tree-item'

export default {
  name: 'ac-tree',
  components: {acTreeItem},
  props: {
    tree: { type: Object, default () { return {} } }
  },
  computed: {
  },
  data () {
    return {
      prefixCls
    }
  },
}
</script>

<style lang="scss">
$pre: ac-tree;
.#{$pre} {
  background: #76bcf9;
}

</style>

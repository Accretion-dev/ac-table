<template>
  <div :class="`${prefixCls}`">
  </div>
</template>

<script>
const prefixCls = 'ac-tree-filter-root'

export default {
  name: 'ac-tree-filter-root',
  components: {},
  props: {
  },
  data () {
    return {
      prefixCls,
    }
  },
  watch:{
  },
  computed: {
  },
  created() {
  },
  beforeDestroy() {
  },
  mounted () {
  },
  methods: {
  }
}
</script>

<style lang="scss">
$pre: ac-tree-filter-root;
.#{$pre} {
  box-sizing: border-box;
}
</style>

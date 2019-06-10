<template>
  <div :class="`${prefixCls}`" tabindex="0">
    <ac-tree-projection-item v-for="data of projections"
      :key="`${data.extra?'e__':'f__'}${data.path}`"
      :data="data"
    />
  </div>
</template>

<script>
const prefixCls = 'ac-tree-projection'
import acTreeProjectionItem from './ac-tree-projection-item'

export default {
  name: 'ac-tree-projection',
  components: {acTreeProjectionItem},
  props: {
    projections: {type: Array, required: true}
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
  mounted () {
  },
  methods: {
  }
}
</script>

<style lang="scss">
$pre: ac-tree-projection;
.#{$pre} {
  outline:none;
}
</style>

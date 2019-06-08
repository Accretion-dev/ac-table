<template>
  <div :class="`${prefixCls}`">
    <ac-tree-show-item v-for="data of show"
      :key="`${data.extra?'e__':'f__'}${data.path}`"
      :data="data"
    />
  </div>
</template>

<script>
const prefixCls = 'ac-tree-show'
import acTreeShowItem from './ac-tree-show-item'

export default {
  name: 'ac-tree-show',
  components: {acTreeShowItem},
  props: {
    show: {type: Array, required: true}
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
$pre: ac-tree-show;
.#{$pre} {
}
</style>

<template>
  <div :class="`${prefixCls}`">
    <span class="ac-unselectable">{{data.name}}</span>
  </div>
</template>

<script>
const prefixCls = 'ac-tree-show-item'

export default {
  name: 'ac-tree-show-item',
  props: {
    data: {type: Object, required: true}
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
$pre: ac-tree-show-item;
.#{$pre}:hover {
  background: #d8ffd7;
}
.#{$pre}-selected {
  background: #d8ffd775;
}
</style>

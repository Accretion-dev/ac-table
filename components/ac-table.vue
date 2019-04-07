
<template>
  <div :class="prefixCls">
    <h1> ac-table </h1>
    <p> ac-input here </p>
    <ac-input />
  </div>
</template>

<script>
const prefixCls = 'ac-table'
export default {
  name: 'ac-table',
  props: {
    data: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  data () {
    return {
      prefixCls
    }
  },
}
</script>

<style lang="scss" scoped>
$pre: ac-table;
.#{$pre} {
  white-space: nowrap;
}
</style>

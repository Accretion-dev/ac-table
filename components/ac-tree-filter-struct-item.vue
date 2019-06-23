<template>
  <span :class="`${prefixCls}`">
    <ac-input-cursor
      v-model="thisvalue"
      placeholder="root"
      ref='input'
      :border="false"
      :data="autocompleteData"
      :cursor.sync="cursor"
      :cursor-start.sync="cursorStart"
      :onfocus="testFocus('focus value')"
      @cursorMove="$emit('cursorMove', $event)"
    />
  </span>
</template>

<script>
const prefixCls = 'ac-tree-filter-struct-item'

function parser (value) {
  return {
    cursor (cursor) {
      if (
        (value.startsWith('"')&&value.endsWith('"')) ||
        (value.startsWith('"')&&value.endsWith('"'))
      ) {
        return {extract: value.slice(1,-1), range: null}
      } else {
        return {extract: value, range: null}
      }
    },
    complete (cursor, oldValue, newValue) {
      if (!oldValue) {
        return {value: newValue, cursor:cursor + newValue.length}
      } else {
        return {value: newValue, cursor:cursor-oldValue.length + newValue.length}
      }
    },
  }
}

export default {
  name: 'ac-tree-filter-struct-item',
  components: {},
  props: {
    value: {type: Object, required: true},
    tree:  {type: Object, required: true},
    parent: {type: String, default: ''},
  },
  data () {
    return {
      prefixCls,
      cursor: 0,
      cursorStart: 0,
      thisvalue: "",
      autocompleteData: {
        parser,
        data: []
      }
    }
  },
  watch:{
    thisvalue () {
    }
  },
  computed: {
    type () {
      if (this.value) {
        if (this.value.type) {
          return this.value.type
        } else {
          return 'value'
        }
      } else {
        return 'empty'
      }
    }
  },
  created() {
    let completeData = [
      {
        group: 'commands',
        format: 'string',
        always: false,
        data: [
          {data:'$js', description: "any validate\njs expression"},
        ]
      },
      {
        group: 'fields',
        format: 'string',
        always: false,
        data: this.getTreePaths(this.tree),
      }
    ]
    this.autocompleteData.data = completeData
  },
  beforeDestroy() {
  },
  mounted () {
  },
  methods: {
    cursorMove (data) {
      this.$refs.input.cursorMove(data)
    },
    testFocus (value) {
      return () => {
        console.log(value)
      }
    },
    getTreePaths (tree, paths) {
      if (!paths) paths = []
      if (tree.path) {
        paths.push({data: tree.path, description: tree.type})
      }
      if (tree.children) {
        for (let each of tree.children) {
          this.getTreePaths(each, paths)
        }
      }
      return paths
    }
  },
  beforeCreate: function () {
    this.$options.components.structItem = require('./ac-tree-filter-struct-item.vue').default
  },
}
</script>

<style lang="scss">
$pre: ac-tree-filter-struct-item;
.#{$pre} {
  box-sizing: border-box;
  flex: 1;
  display: inline-flex;
}
</style>

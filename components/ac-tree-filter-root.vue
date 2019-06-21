<template>
  <div :class="`${prefixCls}`">
    <ac-input-cursor
      v-model="data.string"
      placeholder="root"
      ref='input'
      :data="autocompleteData"
      :cursor.sync="cursor"
      :cursor-start.sync="cursorStart"
    />
  </div>
</template>

<script>
const prefixCls = 'ac-tree-filter-root'
import value from './ac-tree-filter-value'

function parser (value) {
  return {
    cursor (cursor) {
      return {extract: value, range: null}
    },
    complete (cursor, oldValue, newValue) {
      return {value: newValue, cursor:cursor-oldValue.length + newValue.length}
    },
  }
}

export default {
  name: 'ac-tree-filter-root',
  components: {},
  props: {
    value: {type: String, default: ''},
    tree:  {type: Object, required: true},
  },
  data () {
    return {
      prefixCls,
      cursor: 0,
      cursorStart: 0,
      data: {
        type: 'root',
        child: { },
        prefix: "",
        suffix: "",
        string: ""
      },
      autocompleteData: {
        parser,
        data: []
      }
    }
  },
  watch:{
  },
  computed: {
  },
  created() {
    let completeData = [
      {
        group: 'commands',
        format: 'string',
        always: false,
        data: [
          '$js',
        ]
      },
      {
        group: 'fields',
        format: 'string',
        always: false,
        data: this.getTreePaths(this.tree)
      }
    ]
    this.autocompleteData.data = completeData
  },
  beforeDestroy() {
  },
  mounted () {
  },
  methods: {
    getTreePaths (tree, paths) {
      if (!paths) paths = []
      paths.push(tree.path)
      if (tree.children) {
        for (let each of tree.children) {
          this.getTreePaths(each, paths)
        }
      }
      return paths
    }
  }
}
</script>

<style lang="scss">
$pre: ac-tree-filter-root;
.#{$pre} {
  box-sizing: border-box;
}
</style>

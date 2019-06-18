<template>
  <div
    :class="`${prefixCls}`"
    tabindex="0"
    @keydown="keydown"
  >
    <div :class="`${prefixCls}-tool-bar`">
      <span
        :class="`${prefixCls}-tools-button`"
        @click="add"
      > + </span>
    </div>
    <ac-tree-extra-field-item v-for="(data, index) of extraField"
      :key="data.path"
      :data="data"
      :index="index"
      :extra-field-state="extraFieldState"
    />
    <ac-tree-extra-field-item v-if="status.adding"
      ref="adding"
      :data="newData()"
      :extra-field-state="extraFieldState"
      :extra-field="extraField"
      @update="onupdate"
    />
  </div>
</template>

<script>
const prefixCls = 'ac-tree-extra-field'
import acTreeExtraFieldItem from './ac-tree-extra-field-item'

export default {
  name: 'ac-tree-extra-field',
  components: {acTreeExtraFieldItem},
  props: {
    extraField: {type: Array, required: true},
    extraFieldState: {type: Object, required: true},
  },
  data () {
    return {
      prefixCls,
      status: {
        adding: false
      }
    }
  },
  watch:{
  },
  computed: {
  },
  created() {
  },
  mounted () {
    let selected = this.extraFieldState.selected
    this.setSelected(selected, true)
  },
  methods: {
    newData () {
      return {
        name: "newField",
        path: "newField",
        type: 'string',
        arrayType: '',
        extraField: true,
        formatter: null,
        js: "v",
        func: "",
        status: {
          selected: false,
          noFirstNewline: false,
          noNewline: false,
        }
      }
    },
    add (event) {
      this.status.adding = !this.status.adding
      if (this.status.adding) {
        setTimeout(() => {
          this.$refs.adding.focus()
        },0)
      }
    },
    changeShow (key) {
      let children = this.$children.find(_ => _.$vnode.data.key===key)
      if (children) {
        children.changeShow()
      }
      this.$emit('update', {changeShow: true})
    },
    setSelected (key, status) {
      let children = this.$children.find(_ => _.$vnode.data.key===key)
      if (children) {
        children.changeSelect(status)
      }
    },
    changeSelect (status) {
      if (!this.extraField.length) return
      if (!status) {
        if (this.extraFieldtate.selected) {
          this.setSelected(this.extraFieldtate.selected, true)
        }
      } else {
        if (!this.extraFieldtate.selected) {
          this.extraFieldtate.selected = this.getKey(this.extraField[0])
          this.setSelected(this.extraFieldtate.selected, true)
          this.$emit('update', {changeSelect: true})
        } else {
          this.setSelected(this.extraFieldtate.selected, false)
          let index = this.extraField.findIndex(_ => this.getKey(_)===this.extraFieldtate.selected)
          if (index === -1) {
            index = 0
          } else {
            index = (index + status + this.extraField.length)%this.extraField.length
          }
          let key = this.getKey(this.extraField[index])
          this.extraFieldtate.selected = key
          this.setSelected(this.extraFieldtate.selected, true)
          this.$emit('update', {changeSelect: true})
        }
      }
    },
    moveSelect (status) {
      if (this.extraField.length<=1) return
      if (this.extraFieldtate.selected) {
        let oldIndex = this.extraField.findIndex(_ => this.getKey(_)===this.extraFieldtate.selected)
        let newIndex
        if (oldIndex === -1) {
          return
        } else {
          newIndex = (oldIndex + status + this.extraField.length)%this.extraField.length
        }
        let [deleted] = this.extraField.splice(oldIndex,1)
        this.extraField.splice(newIndex,0,deleted)
        this.$emit('update', {reorder: true})
      }
    },
    onupdate (change, value) {
      if (change.add) {
        this.$emit('update', change)
      }
      if (change.changeSelect) {
        if (this.extraFieldtate.selected) {
          this.setSelected(this.extraFieldtate.selected, false)
        }
        this.extraFieldtate.selected = this.getKey(change.changeSelect)
        this.changeSelect(0)
      }
      if (change.reorder) {
        let {start,end} = change.reorder
        let [deleted] = this.extraField.splice(start,1)
        this.extraField.splice(end,0,deleted)
        this.$emit('update', {reorder: true})
      }
    },
    updateNewline () {
      let obj = this.extraField.find(_ => this.getKey(_)===this.extraFieldtate.selected)
      if (!obj) return
      if (obj.extra) {
        // TODO: support extra
      } else {
        let path = obj.path
        this.$parent.$refs.tree.nodes[path].updateNewline()
      }
    },
    updateProNewline () {
      let obj = this.extraField.find(_ => this.getKey(_)===this.extraFieldtate.selected)
      if (!obj) return
      if (obj.extra) {
        // TODO: support extra
      } else {
        let path = obj.path
        this.$parent.$refs.tree.nodes[path].updateProNewline()
      }
    },
    keydown (event) {
      if (event.shiftKey) {
        switch (event.key) {
          case 'ArrowUp':
            event.preventDefault()
            this.moveSelect(-1)
            break
          case 'ArrowDown':
            event.preventDefault()
            this.moveSelect(1)
            break
          case 'N':
            event.preventDefault()
            this.updateProNewline()
            break
        }
      } else {
        switch (event.key) {
          case 'k':
          case 'ArrowUp':
            event.preventDefault()
            this.changeSelect(-1)
            break
          case 'j':
          case 'ArrowDown':
            event.preventDefault()
            this.changeSelect(1)
            break
          case 's':
            event.preventDefault()
            this.changeShow(this.extraFieldtate.selected)
            break
          case '-':
            event.preventDefault()
            let children = this.$children.find(_ => _.$vnode.data.key===this.extraFieldtate.selected)
            if (children) {
              this.$emit('update', {deleteProjection: children.data})
            }
            break
          case 'n':
            event.preventDefault()
            this.updateNewline()
            break
        }
      }
    },
  }
}
</script>

<style lang="scss">
$pre: ac-tree-extra-field;
.#{$pre} {
  outline:none;
  flex: 1;
}
.#{$pre}-tool-bar {
}
.#{$pre}-tools-button {
  padding: 0 0.5rem;
}
</style>

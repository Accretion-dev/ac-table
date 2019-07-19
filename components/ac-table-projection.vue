<template>
  <div
    :class="`${prefixCls}`"
    tabindex="0"
    @keydown="keydown"
  >
    <ac-table-projection-item v-for="(data, index) of projections"
      :key="getKey(data)"
      :data="data"
      :index="index"
      :projectionState="projectionState"
      @update="onupdate"
    />
  </div>
</template>

<script>
const prefixCls = 'ac-table-projection'
import acTableProjectionItem from './ac-table-projection-item'

export default {
  name: 'ac-table-projection',
  components: {acTableProjectionItem},
  props: {
    projections: {type: Array, required: true},
    projectionState: {type: Object, required: true},
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
    let selected = this.projectionState.selected
    this.setSelected(selected, true)
  },
  methods: {
    goToOrigin () {
      let key = this.projectionState.selected
      let child = this.$children.find(_ => _.$vnode.data.key===key)
      if (child) {
        let data = child.data
        this.$emit('update', {goToOrigin: data})
      }
    },
    getKey (data) {
      return `${data.extraField?'e__':'f__'}${data.path}`
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
      if (!this.projections.length) return
      if (status === undefined) { // reselect, e.g. at init
        if (this.projectionState.selected) {
          this.setSelected(this.projectionState.selected, true)
        }
      } else if (typeof(status)==='number') { // move updown
        if (!this.projectionState.selected) {
          this.projectionState.selected = this.getKey(this.projections[0])
          this.setSelected(this.projectionState.selected, true)
          this.$emit('update', {changeSelect: true})
        } else {
          this.setSelected(this.projectionState.selected, false)
          let index = this.projections.findIndex(_ => this.getKey(_)===this.projectionState.selected)
          if (index === -1) {
            index = 0
          } else {
            index = (index + status + this.projections.length)%this.projections.length
          }
          let key = this.getKey(this.projections[index])
          this.projectionState.selected = key
          this.setSelected(this.projectionState.selected, true)
          this.$emit('update', {changeSelect: true})
        }
      } else { // status is a project element
        let obj = status
        this.setSelected(this.projectionState.selected, false)
        let key = this.getKey(obj)
        this.projectionState.selected = key
        this.setSelected(this.projectionState.selected, true)
        this.$emit('update', {changeSelect: true})
      }
    },
    moveSelect (status) {
      if (this.projections.length<=1) return
      if (this.projectionState.selected) {
        let oldIndex = this.projections.findIndex(_ => this.getKey(_)===this.projectionState.selected)
        let newIndex
        if (oldIndex === -1) {
          return
        } else {
          newIndex = (oldIndex + status + this.projections.length)%this.projections.length
        }
        let [deleted] = this.projections.splice(oldIndex,1)
        this.projections.splice(newIndex,0,deleted)
        this.$emit('update', {reorder: true})
      }
    },
    onupdate (change) {
      if (change.changeSelect) {
        if (this.projectionState.selected) {
          this.setSelected(this.projectionState.selected, false)
        }
        this.projectionState.selected = this.getKey(change.changeSelect)
        this.changeSelect()
      }
      if (change.reorder) {
        let {start,end} = change.reorder
        let [deleted] = this.projections.splice(start,1)
        this.projections.splice(end,0,deleted)
        this.$emit('update', {reorder: true})
      }
    },
    updateNewline () {
      let obj = this.projections.find(_ => this.getKey(_)===this.projectionState.selected)
      if (!obj) return
      if (obj.extraField) {
        let path = obj.path
        this.$parent.$refs.extraField.nodes[path].updateNewline()
      } else {
        let path = obj.path
        this.$parent.$refs.tree.nodes[path].updateNewline()
      }
    },
    updateProNewline () {
      let obj = this.projections.find(_ => this.getKey(_)===this.projectionState.selected)
      if (!obj) return
      if (!obj.extraField) {
        let path = obj.path
        this.$parent.$refs.tree.nodes[path].updateProNewline()
      }
    },
    keydown (event) {
      if (event.shiftKey) {
        switch (event.key) {
          case 'K':
          case 'ArrowUp':
            event.preventDefault()
            this.moveSelect(-1)
            break
          case 'J':
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
            this.changeShow(this.projectionState.selected)
            break
          case '-':
            event.preventDefault()
            let children = this.$children.find(_ => _.$vnode.data.key===this.projectionState.selected)
            if (children) {
              this.$emit('update', {deleteProjection: children.data})
            }
            break
          case 'n':
            event.preventDefault()
            this.updateNewline()
            break
          case 'g':
            event.preventDefault()
            this.goToOrigin()
            break
        }
      }
    },
  }
}
</script>

<style lang="scss">
$pre: ac-table-projection;
.#{$pre} {
  outline:none;
  flex: 1;
}
</style>

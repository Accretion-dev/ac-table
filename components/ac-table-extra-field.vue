<template>
  <div
    :class="`${prefixCls}`"
    tabindex="0"
    @keydown="keydown"
  >
    <b>Extra fields</b>
    <div :class="`${prefixCls}-tool-bar`">
      <span
        :class="`${prefixCls}-tools-button`"
        @click="clickAdd"
      > + </span>
    </div>
    <ac-table-extra-field-item v-for="(thisdata, index) of extraField"
      :key="thisdata.path"
      :data="thisdata"
      :index="index"
      :extra-field-state="extraFieldState"
      :extra-field="extraField"
      :nodes="nodes"
      @update="onupdate"
    />
    <ac-table-extra-field-item v-if="status.adding"
      ref="adding"
      key="adding"
      :data="newData"
      :extra-field-state="extraFieldState"
      :extra-field="extraField"
      @update="onupdate"
    />
  </div>
</template>

<script>
/* comments:
 * do not use data.name as key in ac-table-extra-field-item
 *   because every time you change data.name, will redraw this component, cause update bugs
*/

const prefixCls = 'ac-table-extra-field'
import acTableExtraFieldItem from './ac-table-extra-field-item'

export default {
  name: 'ac-table-extra-field',
  components: {acTableExtraFieldItem},
  props: {
    extraField: {type: Array, required: true},
    extraFieldState: {type: Object, required: true},
  },
  data () {
    return {
      prefixCls,
      status: {
        adding: false
      },
      nodes: {},
      newData: {},
    }
  },
  watch:{
  },
  computed: {
  },
  created() {
    this.newData = this.genNewData()
  },
  mounted () {
    let selected = this.extraFieldState.selected
    this.setSelected(selected, true)
  },
  methods: {
    genNewData () {
      return {
        name: "newField",
        path: (new Date()).toISOString(), // uid
        type: 'string',
        arrayType: '',
        extraField: true,
        formatter: null,
        js: "v",
        func: "",
        status: {
          projection: false,
          tableProjection: false,
          editing: true,
          selected: false,
          noFirstNewline: false,
          noNewline: false,
        },
      }
    },
    clickAdd (event) {
      this.status.adding = !this.status.adding
      if (this.status.adding) {
        this.newData = this.genNewData()
        setTimeout(() => {
          this.$refs.adding.focus({ preventScroll: true })
        },0)
      } else {
        this.$el.focus({ preventScroll: true })
      }
    },
    changeProjection (key, only, prefix) {
      let child = this.$children.find(_ => _.$vnode.data.key===key)
      if (child) {
        if (prefix) {
          if (only) {
            this.$emit('update', {status: {projection: true, only: true}, prefix}, child)
          } else {
            if (child.data.status.tableProjection) {
              this.$emit('update', {status: {projection: false}, prefix}, child)
            } else {
              this.$emit('update', {status: {projection: true}, prefix}, child)
            }
          }
        } else {
          if (only) {
            this.$emit('update', {status: {projection: true, only: true}, prefix}, child)
          } else {
            if (child.data.status.projection) {
              this.$emit('update', {status: {projection: false}, prefix}, child)
            } else {
              this.$emit('update', {status: {projection: true}, prefix}, child)
            }
          }
        }
      }
    },
    setSelected (key, status) {
      let children = this.$children.find(_ => _.$vnode.data.key===key)
      if (children) {
        children.changeSelect(status)
      }
    },
    changeSelect (status) {
      if (!this.extraField.length) return
      if (status === undefined) { // reselect, e.g. at init
        if (this.extraFieldState.selected) {
          this.setSelected(this.extraFieldState.selected, true)
        }
      } else if (typeof(status)==='number') { // move updown
        if (!this.extraFieldState.selected) {
          this.extraFieldState.selected = this.extraField[0]
          this.setSelected(this.extraFieldState.selected, true)
          this.$emit('update', {changeSelect: true})
        } else {
          this.setSelected(this.extraFieldState.selected, false)
          let index = this.extraField.findIndex(_ => _.path===this.extraFieldState.selected)
          if (index === -1) {
            index = 0
          } else {
            index = (index + status + this.extraField.length)%this.extraField.length
          }
          let key = this.extraField[index].path
          this.extraFieldState.selected = key
          this.setSelected(this.extraFieldState.selected, true)
          this.$emit('update', {changeSelect: true})
        }
      } else { // status is a project element
        let obj = status
        this.setSelected(this.extraFieldState.selected, false)
        let key = status.path
        this.extraFieldState.selected = key
        this.setSelected(this.extraFieldState.selected, true)
        this.$emit('update', {changeSelect: true})
      }
    },
    moveSelect (status) {
      if (this.extraField.length<=1) return
      if (this.extraFieldState.selected) {
        let oldIndex = this.extraField.findIndex(_ => _.path===this.extraFieldState.selected)
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
    onupdate (change, origin) {
      if (change.add) {
        this.clickAdd()
      }
      if (change.changeSelect) {
        if (this.extraFieldState.selected) {
          this.setSelected(this.extraFieldState.selected, false)
        }
        this.extraFieldState.selected = change.changeSelect.path
        this.changeSelect()
      }
      if (change.reorder) {
        let {start,end} = change.reorder
        let [deleted] = this.extraField.splice(start,1)
        this.extraField.splice(end,0,deleted)
      }
      if (change.modify) {
        setTimeout(() => {
          if (this.$el) {
            this.$el.focus({ preventScroll: true })
          }
        })
      }
      this.$emit('update', change, origin)
    },
    updateNewline () {
      let obj = this.extraField.find(_ => _.path===this.extraFieldState.selected)
      if (!obj) return
      let path = obj.path
      this.nodes[path].updateNewline()
    },
    goToProjection (prefix) {
      let children = this.$children.find(_ => _.$vnode.data.key===this.extraFieldState.selected)
      if (children) {
        this.$emit('update', {goToProjection: children.data, prefix})
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
          case 'G':
            event.preventDefault()
            this.goToProjection('table')
            break
          case 'P':
            event.preventDefault()
            this.changeProjection(this.extraFieldState.selected, false, 'table')
            break
          case 'O':
            event.preventDefault()
            // put this function here because nodes is changing
            this.changeProjection(this.extraFieldState.selected, true, 'table')
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
          case 'd':
          case '-':
            event.preventDefault()
            let children = this.$children.find(_ => _.$vnode.data.key===this.extraFieldState.selected)
            if (children) {
              this.$emit('update', {deleted: children.data})
            }
            break
          case 'n':
            event.preventDefault()
            this.updateNewline()
            break
          case 'a':
            event.preventDefault()
            this.clickAdd()
            break
          case 'p':
            event.preventDefault()
            // put this function here because nodes is changing
            this.changeProjection(this.extraFieldState.selected, false)
            break
          case 'o':
            event.preventDefault()
            // put this function here because nodes is changing
            this.changeProjection(this.extraFieldState.selected, true)
            break
          case 'g':
            event.preventDefault()
            this.goToProjection()
            break
          case 'Enter':
            event.preventDefault()
            let child = this.$children.find(_ => _.data.path===this.extraFieldState.selected)
            if (child) child.dblclick()
            break
        }
      }
    },
  }
}
</script>

<style lang="scss">
$pre: ac-table-extra-field;
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

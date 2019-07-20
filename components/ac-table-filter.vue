<template>
  <div
    :class="`${prefixCls}`"
    tabindex="0"
    @keydown="keydown"
  >
    <b>Filters</b>
    <div :class="`${prefixCls}-tool-bar`">
      <span
        :class="`${prefixCls}-tools-button`"
        @click="clickAdd"
      > + </span>
    </div>
    <ac-table-filter-item v-for="(thisdata, index) of filter"
      :key="thisdata.name"
      :data="thisdata"
      :index="index"
      :filter-state="filterState"
      :filter="filter"
      :nodes="nodes"
      :tree="tree"
      :rawdata="rawdata"
      @update="onupdate"
    />
    <ac-table-filter-item v-if="status.adding"
      ref="adding"
      key="adding"
      :data="newData"
      :filter-state="filterState"
      :filter="filter"
      :tree="tree"
      :rawdata="rawdata"
      @update="onupdate"
    />
  </div>
</template>

<script>
/* comments:
 * do not use data.name as key in ac-table-extra-field-item
 *   because every time you change data.name, will redraw this component, cause update bugs
*/

const prefixCls = 'ac-table-filter'
import acTableFilterItem from './ac-table-filter-item'

export default {
  name: 'ac-table-filter',
  components: {acTableFilterItem},
  props: {
    filter: {type: Array, required: true},
    filterState: {type: Object, required: true},
    tree: {type: Object, required: true},
    rawdata: {type: Array, required: true},
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
    let selected = this.filterState.selected
    this.setSelected(selected, true)
  },
  methods: {
    genNewData () {
      return {
        name: "default",
        uid: (new Date()).toISOString(), // uid
        content: '',
        status: {
          editing: true,
          selected: false,
          use: true,
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
    changeUse () {
      let children = this.$children.find(_ => _.$vnode.data.key===this.filterState.selected)
      if (children) {
        children.changeUse(status)
      }
    },
    setSelected (key, status) {
      let children = this.$children.find(_ => _.$vnode.data.key===key)
      if (children) {
        children.changeSelect(status)
      }
    },
    changeSelect (status) {
      if (!this.filter.length) return
      if (status === undefined) { // reselect, e.g. at init
        if (this.filterState.selected) {
          this.setSelected(this.filterState.selected, true)
        }
      } else if (typeof(status)==='number') { // move updown
        if (!this.filterState.selected) {
          this.filterState.selected = this.filter[0]
          this.setSelected(this.filterState.selected, true)
          this.$emit('update', {changeSelect: true})
        } else {
          this.setSelected(this.filterState.selected, false)
          let index = this.filter.findIndex(_ => _.name===this.filterState.selected)
          if (index === -1) {
            index = 0
          } else {
            index = (index + status + this.filter.length)%this.filter.length
          }
          let key = this.filter[index].name
          this.filterState.selected = key
          this.setSelected(this.filterState.selected, true)
          this.$emit('update', {changeSelect: true})
        }
      } else { // status is a project element
        let obj = status
        this.setSelected(this.filterState.selected, false)
        let key = status.name
        this.filterState.selected = key
        this.setSelected(this.filterState.selected, true)
        this.$emit('update', {changeSelect: true})
      }
    },
    moveSelect (status) {
      if (this.filter.length<=1) return
      if (this.filterState.selected) {
        let oldIndex = this.filter.findIndex(_ => _.name===this.filterState.selected)
        let newIndex
        if (oldIndex === -1) {
          return
        } else {
          newIndex = (oldIndex + status + this.filter.length)%this.filter.length
        }
        let [deleted] = this.filter.splice(oldIndex,1)
        this.filter.splice(newIndex,0,deleted)
        this.$emit('update', {reorder: true})
      }
    },
    onupdate (change, origin) {
      if (change.add) {
        this.clickAdd()
      }
      if (change.changeSelect) {
        if (this.filterState.selected) {
          this.setSelected(this.filterState.selected, false)
        }
        this.filterState.selected = change.changeSelect.name
        this.changeSelect()
      }
      if (change.reorder) {
        let {start,end} = change.reorder
        let [deleted] = this.filter.splice(start,1)
        this.filter.splice(end,0,deleted)
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
            let children = this.$children.find(_ => _.$vnode.data.key===this.filterState.selected)
            if (children) {
              this.$emit('update', {deleted: children.data})
            }
            break
          case 'a':
            event.preventDefault()
            this.clickAdd()
            break
          case 'u':
            event.preventDefault()
            this.changeUse()
            break
          case 'Enter':
            event.preventDefault()
            let child = this.$children.find(_ => _.data.name===this.filterState.selected)
            if (child) child.dblclick()
            break
        }
      }
    },
  }
}
</script>

<style lang="scss">
$pre: ac-table-filter;
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

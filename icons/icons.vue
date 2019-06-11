<template>
  <span class="ac-table-icons" v-html="html"/>
</template>

<script>
import icons from './icons.json'

export default {
  name: 'ac-table-icons',
  props: {
    name: { type: String },
    size: { type: String, default: '32px' },
  },
  data () {
    return {
      icons
    }
  },
  computed: {
    html () {
      if (this.icons[this.name]) {
        let data = this.icons[this.name]
        data = data.replace('${height}', this.size)
        data = data.replace('${width}',  this.size)
        return data
      } else {
        return `<svg height="${this.size}" width="${this.size}"/>`
      }
    }
  },
  methods: {
  }
}
</script>

<style lang="scss">
.ac-table-icons {
  display: inline-flex;
}
</style>

import _ from 'lodash'

const testType = {
  date: _ => (!isNaN(Number(new Date(_))) && _.includes('T')),
  number: _ => typeof(_) === 'number',
  boolean: _ => typeof(_) === 'boolean',
  string: _ => typeof(_) === 'string',
}

class JsonAnalyser {
  constructor({typeSplit, struct, tree} = {}) {
    this.tree = tree
    if (!typeSplit) {
      this.typeSplit = '@'
    } else {
      this.typeSplit = typeSplit
    }
    if (struct) {
      return this.givenStruct(struct)
    }
  }
  makeTreeByStruct (struct, tree, path, name) {
    tree.type = struct.type
    tree.path = path
    tree.name = name
    if (tree.array) {
      tree.type = 'array'
      let child = {}
      tree.children = [child]
      this.makeTreeByStruct({
        type: struct.type,
        fields: struct.fields
      }, child, path, name)
    } else if (struct.fields) {
      tree.children = []
      for (let key in struct.fields) {
        let subtree = {}
        this.makeTreeByStruct(struct.fields[key], subtree, `${path}.${key}`, key)
        tree.children.push(subtree)
      }
    }
  }
  givenStruct (struct) {
    let tree = { root: true }
    makeTreeByStruct(struct, tree, '', '')
    this.tree = tere
    return tree
  }
  set(typeSplit) {
    if (!typeSplit) {
      this.typeSplit = '@'
    } else {
      this.typeSplit = typeSplit
    }
  }
  analysis(data) {
    let structTree = {
      type:'root',
      counts: { },
    }
    for (let eachdata of data) {
      this._analysis(eachdata, structTree)
    }
    let tree = JSON.parse(JSON.stringify(structTree))
    this._reanalysis(tree)
    this.tree = tree
    return {structTree, tree}
  }
  _analysis (object, tree) {
    if (object === null) {
      if (!('null' in tree.counts)) {
        tree.counts.null = 1
      } else {
        tree.counts.null += 1
      }
    } else if (typeof(object) === 'boolean') {
      if (!('boolean' in tree.counts)) {
        tree.counts.boolean = 1
      } else {
        tree.counts.boolean += 1
      }
    } else if (typeof(object) === 'number') {
      if (!('number' in tree.counts)) {
        tree.counts.number = 1
      } else {
        tree.counts.number += 1
      }
    } else if (typeof(object) === 'string') {
      if (isNaN(Number(new Date(object))) || !object.includes('T')) {
        if (!('string' in tree.counts)) {
          tree.counts.string = 1
        } else {
          tree.counts.string += 1
        }
      } else {
        if (!('date' in tree.counts)) {
          tree.counts.date = 1
        } else {
          tree.counts.date += 1
        }
      }
    } else if (Array.isArray(object)) {
      if (!('array' in tree.counts)) {
        tree.counts.array = 1
        tree.array = {counts:{}}
      } else {
        tree.counts.array += 1
      }
      for (let each of object) {
        this._analysis(each, tree.array)
      }
    } else {
      if (!('object' in tree.counts)) {
        tree.counts.object = 1
        tree.object = {}
      } else {
        tree.counts.object += 1
      }
      for (let key in object) {
        if (!(key in tree.object)) {
          tree.object[key] = {counts:{}}
        }
        this._analysis(object[key], tree.object[key])
      }
    }
  }
  _reanalysis (tree, path, name) {
    if (!path) path = ''
    if (!name) {
      name = ''
      tree.root = true
    }
    tree.path = path
    tree.name = name
    let keys = Object.keys(tree.counts)
    let mixed = true
    if (keys.length === 1) {
      let key = keys[0]
      tree.count = tree.counts[key]
      tree.type = key
      mixed = false
      delete tree.counts
    } else if (keys.length===2 && keys.includes('null')) {
      let key = keys[0] === 'null' ? keys[1] : keys[0]
      tree.count = tree.counts[key]
      tree.null = tree.counts.null
      tree.type = key
      mixed = false
      delete tree.counts
    }
    if (mixed) {
      tree.type = 'mixed'
      tree.children = []
      let total = _.sum(keys.filter(key => key!=='null').map(key => tree.counts[key]))
      tree.count = total
      tree.null = tree.counts.null
      for (let key of keys) {
        if (key === 'array') {
          let array = {
            type: key,
            array: tree.array,
            counts: {[key]:tree.counts[key]},
          }
          delete tree.array
          this._reanalysis(array, `${path}${this.typeSplit}${key}`, name)
          tree.children.push(array)
        } else if (key === 'object') {
          let keys = Object.keys(tree.object)
          for (let keykey of keys) {
            this._reanalysis(tree.object[keykey],`${path}${this.typeSplit}${key}.${keykey}`, keykey)
          }
          let thisObj = Object.assign(
            {children:keys.map(key => tree.object[key])},
            {
              name,
              path: `${path}${this.typeSplit}${key}`,
              type: key,
              count: tree.counts[key],
            }
          )
          tree.children.push(thisObj)
          delete tree.object
        } else if (key !== 'null') {
          tree.children.push({
            name,
            path: `${path}${this.typeSplit}${key}`,
            type: key,
            count: tree.counts[key],
          })
        }
      }
    } else {
      if (tree.array) {
        debugger
        this._reanalysis(tree.array, path, name)
        debugger
        tree.array.array = true
        tree.children = tree.array.children
        tree.arrayType = tree.array.type
        tree.arrayCounts = tree.array.counts
        delete tree.array
      } else if (tree.object) {
        let keys = Object.keys(tree.object)
        for (let key of keys) {
          this._reanalysis(tree.object[key], `${path}${tree.root?"":'.'}${key}`, key)
        }
        tree.children = keys.map(key => tree.object[key])
        delete tree.object
      }
    }
  }
  _getValueByPath (data, paths) {
    if (paths.length === 0) return data
    let [head, ...tail] = paths
    if (head.includes(this.typeSplit)) { // like blabla@object
      let [newhead, type] = head.split(this.typeSplit)
      if (Array.isArray(data)) {
        let value = data.filter(_ => typeof(_)==='object'&&newhead in _).map(_ => _[newhead]).filter(_ => testType[type](_))
        if (!value.length) {
          return undefined
        } else { // value is a array
          value =  _.flatten(value)
        }
        return this._getValueByPath(value, tail)
      } else {
        value = data[newhead]
        if (value === undefined) {
          return undefined
        } else {
          if (type in testType) {
            if (!testType[type](value)) {
              return undefined
            }
          } else {
            return undefined
          }
        }
        return this._getValueByPath(value, tail)
      }
    } else { // not like blabla@object
      if (Array.isArray(data)) {
        let value = data.filter(_ => typeof(_)==='object'&&head in _).map(_ => _[head])
        if (!value.length) {
          return undefined
        } else { // value is a array
          value =  _.flatten(value)
        }
        return this._getValueByPath(value, tail)
      } else {
        value = data[head]
        if (value === undefined) {
          return undefined
        }
        return this._getValueByPath(value, tail)
      }
    }
  }
  getValueByPath (data, path) {
    if (typeof(path) === 'string') {
      let paths = path.split('.')
      return this._getValueByPath(data, paths)
    } else if (Array.isArray(path)) {
      let map = { }
      for (let eachpath of path) {
        map[eachpath] = this.getValueByPath(data, eachpath)
      }
      return map
    }
  }
  _getTypeByPath (tree, paths) {
    if (paths.length === 0) return _.pick(tree, ['type', 'count', 'null', 'counts', 'arrayType', 'arrayCounts'])
    let [head, ...tail] = paths
    if (head.includes(this.typeSplit)) { // like blabla@object
      let [newhead, type] = head.split(this.typeSplit)
      if (tree.type === 'object') {
        let subtree = tree.children.find(_ => _.name === newhead)
        if (subtree === undefined || subtree.type !== type) {
          return undefined
        } else {
          return this._getTypeByPath(subtree, tail)
        }
      } else if (tree.type !== 'array' && tree.type !== 'mixed') { // and paths.length !== 0
        return undefined
      } else { // tree.type === array or tree.type === 'mixed'
        let subtree = tree.children && tree.children.find(_ => _.type === 'object')
        if (subtree === undefined || subtree.type !== type) {
          return undefined
        } else {
          return this._getTypeByPath(subtree, [...newhead, ...tail])
        }
      }
    } else { // head not like balbal@object
      if (tree.type === 'object') {
        let subtree = tree.children.find(_ => _.name === head)
        if (subtree === undefined) {
          return undefined
        } else {
          return this._getTypeByPath(subtree, tail)
        }
      } else if (tree.type !== 'array' && tree.type !== 'mixed') { // and paths.length !== 0
        return undefined
      } else { // tree.type === array or tree.type === 'mixed'
        let subtree = tree.children && tree.children.find(_ => _.type === 'object')
        if (subtree === undefined) {
          return undefined
        } else {
          return this._getTypeByPath(subtree, [...head, ...tail])
        }
      }
    }
  }
  getTypeByPath (path) {
    if (typeof(path) === 'string') {
      let paths = path.split('.')
      return this._getTypeByPath(this.tree, paths)
    } else if (Array.isArray(path)) {
      let map = { }
      for (let eachpath of path) {
        map[eachpath] = this.getTypeByPath(eachpath)
      }
      return map
    }
  }
}
export {
  JsonAnalyser
}

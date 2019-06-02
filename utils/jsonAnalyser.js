import _ from 'lodash'

const testType = {
  date: _ => (!isNaN(Number(new Date(_))) && _.includes('T')),
  number: _ => typeof(_) === 'number',
  boolean: _ => typeof(_) === 'boolean',
  string: _ => typeof(_) === 'string',
}

function haveNull(array) {
  if (array===null) {
    return true
  } else if (Array.isArray(array)) {
    return array.findIndex(_ => haveNull(_)) > -1
  }
}

class JsonAnalyser {
  constructor({typeDelimiter, struct, tree, arrayDelimiter} = {}) {
    this.tree = tree
    if (!typeDelimiter) {
      this.typeDelimiter = '@'
    } else {
      this.typeDelimiter = typeDelimiter
    }
    if (!arrayDelimiter) {
      this.arrayDelimiter = '>'
    } else {
      this.arrayDelimiter = typeDelimiter
    }
    this._arrayAuxDelimiter = '$%^&*('
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
  getType(data) {
    if (data === null) {
      return 'null'
    } else if (typeof(data) === 'boolean') {
      return 'boolean'
    } else if (typeof(data) === 'number') {
      return 'number'
    } else if (typeof(data) === 'string') {
      if (isNaN(Number(new Date(data))) || !data.includes('T')) {
        return 'string'
      } else {
        return 'date'
      }
    } else if (Array.isArray(data)) {
      return 'array'
    } else {
      return 'object'
    }
  }
  _analysis (object, tree) {
    let type = this.getType(object)
    switch (type) {
      case 'null':
        if (!('null' in tree.counts)) {
          tree.counts.null = 1
        } else {
          tree.counts.null += 1
        }
        break;
      case 'boolean':
        if (!('boolean' in tree.counts)) {
          tree.counts.boolean = 1
        } else {
          tree.counts.boolean += 1
        }
        break;
      case 'number':
        if (!('number' in tree.counts)) {
          tree.counts.number = 1
        } else {
          tree.counts.number += 1
        }
        break;
      case 'string':
        if (!('string' in tree.counts)) {
          tree.counts.string = 1
        } else {
          tree.counts.string += 1
        }
        break;
      case 'date':
        if (!('date' in tree.counts)) {
          tree.counts.date = 1
        } else {
          tree.counts.date += 1
        }
        break;
      case 'array':
        if (!('array' in tree.counts)) {
          tree.counts.array = 1
          tree.array = {counts:{}}
        } else {
          tree.counts.array += 1
        }
        for (let each of object) {
          this._analysis(each, tree.array)
        }
        break;
      case 'object':
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
        break;
      default:
        throw Error('should not be here, need debug')
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
          this._reanalysis(array, `${path}${this.typeDelimiter}${key}`, name)
          tree.children.push(array)
        } else if (key === 'object') {
          let keys = Object.keys(tree.object)
          for (let keykey of keys) {
            this._reanalysis(tree.object[keykey],`${path}${this.typeDelimiter}${key}.${keykey}`, keykey)
          }
          let thisObj = Object.assign(
            {children:keys.map(key => tree.object[key])},
            {
              name,
              path: `${path}${this.typeDelimiter}${key}`,
              type: key,
              count: tree.counts[key],
            }
          )
          tree.children.push(thisObj)
          delete tree.object
        } else if (key !== 'null') {
          tree.children.push({
            name,
            path: `${path}${this.typeDelimiter}${key}`,
            type: key,
            count: tree.counts[key],
          })
        }
      }
    } else {
      if (tree.array) {
        this._reanalysis(tree.array, `${path}${this.arrayDelimiter}`, name)
        tree.array.array = true
        tree.arrayType = tree.array.type
        tree.arrayCounts = tree.array.counts
        tree.children = [tree.array]
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
  _getValueByPath (data, paths, onlyObject) {
    if (paths.length === 0) return data
    let [head, ...tail] = paths
    const goodTypes = ['array', 'object', 'string', 'number', 'date', 'null']
    const goodTypeFlags = goodTypes.map(_ => `${this.typeDelimiter}${_}`)
    const fgoodTypes = ['array', 'object', 'string', 'number', 'date', 'null', 'inner']
    const fgoodTypeFlags = goodTypes.map(_ => `${this.typeDelimiter}${_}`)
    let thistype = this.getType(data)
    if (head.startsWith(this.typeDelimiter)) {
      let type = head.slice(1)
      if (type === 'inner') {
        if (thistype !== 'array') {
          return undefined
        } else {
          let result = data.map(_ => this._getValueByPath(_, tail, true))
          //if ( paths[paths.length-1][0]==='@' &&haveNull(result) ) debugger
          let __ = tail.filter(_ => _!=='@object')
          if (!(
              __.length===0 ||
              __.length===1 ||
              __.length===2&&!fgoodTypeFlags.includes(__[0])&&goodTypeFlags.includes(__[1])// .field@type
            )) {
            result = _.flatten(result)
          }
          result = result.filter(_ => _!==undefined)
          if (result.length) {
            return result
          } else {
            return undefined
          }
        }
      } else if (goodTypes.includes(type)){
        if (thistype === type) {
          return this._getValueByPath(data, tail)
        } else {
          return undefined
        }
      } else { // unknown type
        return undefined
      }
    }
    // paths.length > 0
    if (thistype === 'object') {
      let subdata = data[head]
      if (subdata === undefined) {
        return undefined
      } else {
        return this._getValueByPath(subdata, tail)
      }
    } else if (thistype === 'array') { // only good for nested object in array
      // array.next only alown [{}] not [[{}]]
      if (onlyObject) return undefined
      if (paths.length>2 || paths.length===2 && !goodTypeFlags.includes(paths[1])) { // debug here
        let result = data.map(_ => this._getValueByPath(_, paths))
        result = _.flatten(result)
        result = result.filter(_ => _!==undefined)
        if (result.length) {
          return result
        } else {
          return undefined
        }
      } else {
        let lastpath = paths[0]
        let lasttype = paths[1]
        let result = data.map(_ => {
          if (!Array.isArray(_) && _!==null && typeof(_) === 'object' && lastpath in _) {
            let output = _[lastpath]
            if (lasttype) {
              if (lasttype === '@'+this.getType(output)) {
                return output
              } else {
                return undefined
              }
            } else {
              return output
            }
          } else {
            return undefined
          }
        })
        result = result.filter(_ => _!==undefined)
        if (result.length) {
          return result
        } else {
          return undefined
        }
      }
    } else {
      return undefined
    }
  }
  getValueByPath (data, path, debug) {
    if (typeof(path) === 'string') {
      let paths = path.split('.')
      let newpaths = []
      for (let eachpath of paths) {
        if (eachpath.includes(this.arrayDelimiter)) {
          eachpath = eachpath.replace(
            new RegExp(`${this.arrayDelimiter}`, 'g'),
            `${this.typeDelimiter}inner`
          )
        }
        if (eachpath.includes(this.typeDelimiter)) {
          let eachpaths = eachpath.split(this.typeDelimiter)
          let newpath = [eachpaths[0], ...eachpaths.slice(1).map(_ => this.typeDelimiter+_)]
          newpaths = [...newpaths, ...newpath]
        } else {
          newpaths.push(eachpath)
        }
      }
      //console.log({path, newpaths})
      //if (path === 'aSNDAO.aS@array') debugger
      if (Array.isArray(data)) {
        if (debug) {
          return {data, result:data.map(_ => this._getValueByPath(_, newpaths))}
        } else {
          return data.map(_ => this._getValueByPath(_, newpaths))
        }
      } else {
        if (debug) {
          return {data, result:this._getValueByPath(data, newpaths)}
        } else {
          return this._getValueByPath(data, newpaths)
        }
      }
    } else if (Array.isArray(path)) {
      let map = { }
      for (let eachpath of path) {
        map[eachpath] = this.getValueByPath(data, eachpath, debug)
      }
      return map
    }
  }
  _getTypeByPath (tree, paths) {
    if (paths.length === 0) return _.pick(tree, ['array', 'type', 'count', 'null', 'path', 'counts', 'arrayType', 'arrayCounts', 'children'])
    let [head, ...tail] = paths
    if (head.includes(this.arrayDelimiter)) {
      head = head.replace(
        new RegExp(`${this.arrayDelimiter}`, 'g'),
        `${this.typeDelimiter}inner`
      )
      let heads = head.split(this.typeDelimiter)
      let newhead = [heads[0], ...heads.slice(1).map(_ => this.typeDelimiter+_)]
      return this._getTypeByPath(tree, [...newhead, ...tail])
    } else if (!head.startsWith(this.typeDelimiter) && head.includes(this.typeDelimiter)) {
      let heads = head.split(this.typeDelimiter)
      let newhead = [heads[0], ...heads.slice(1).map(_ => this.typeDelimiter+_)]
      return this._getTypeByPath(tree, [...newhead, ...tail])
    }
    //console.log({paths, head, tail})
    //debugger
    const goodTypes = ['array', 'object', 'string', 'number', 'date']
    if (head.startsWith(this.typeDelimiter)) {
      let type = head.slice(1)
      if (type === 'inner') {
        if (tree.type !== 'array') {
          return undefined
        } else {
          return this._getTypeByPath(tree.children[0], tail)
        }
      } else if (goodTypes.includes(type)){
        if (tree.type === 'mixed') {
          let subtree = tree.children.find(_ => _.type === type)
          if (!subtree) {
            return null
          } else {
            return this._getTypeByPath(subtree, tail)
          }
        } else {
          if (tree.type === type) {
            return this._getTypeByPath(tree, tail)
          } else {
            return undefined
          }
        }
      } else { // type in goodTypes
        return undefined
      }
    }
    if (tree.type === 'object') {
      let subtree = tree.children.find(_ => _.name === head)
      if (subtree === undefined) {
        return undefined
      } else {
        return this._getTypeByPath(subtree, tail)
      }
    } else if (tree.type === 'array') {
      if (tree.arrayType === 'object') {
        return  this._getTypeByPath(tree, [`${this.typeDelimiter}inner`, head, ...tail])
      } else if (tree.arrayType === 'mixed') {
        let subtree = tree.children.find(_ => _.type === 'object')
        if (subtree === undefined) {
          return undefined
        } else {
          return this._getTypeByPath(subtree, paths)
        }
      } else {
        return undefined
      }
    } else {
      return undefined
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

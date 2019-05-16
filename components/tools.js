function reanalysis (tree) {
  let keys = Object.keys(tree.counts)
  if (keys.length === 1) {
    let key = keys[0]
    tree.count = tree.counts[key]
    tree.type = key
    delete tree.counts
  } else if (keys.length===2 && keys.includes('null')) {
    let key = keys[0] === 'null' ? keys[1] : keys[0]
    tree.count = tree.counts[key]
    tree.null = tree.counts.null
    tree.type = key
    delete tree.counts
  }
  if (tree.array) {
    reanalysis(tree.array)
  }
  if (tree.object) {
    let keys = Object.keys(tree.object)
    for (let key of keys) {
      reanalysis(tree.object[key])
    }
  }
}

function analysis(object, tree) {
  if (object === null) {
    if (!('null' in tree.counts)) {
      tree.counts.null = 1
    } else {
      tree.counts.null += 1
    }
  } else if (typeof(object) === 'number') {
    if (!('number' in tree.counts)) {
      tree.counts.number = 1
    } else {
      tree.counts.number += 1
    }
  } else if (typeof(object) === 'string') {
    if (isNaN(Number(new Date(object)))) {
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
      analysis(each, tree.array)
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
      analysis(object[key], tree.object[key])
    }
  }
}

function analysisJson(data) {
  let structTree = {
    type:'root',
    counts: { },
  }
  for (let eachdata of data) {
    analysis(eachdata, structTree)
  }
  let tree = JSON.parse(JSON.stringify(structTree))
  reanalysis(tree)
  return {structTree, tree}
}

export {
  analysisJson
}

const ObjProto = Object.prototype;

export function hasOwnProp(obj, k) {
  return ObjProto.hasOwnProperty.call(obj, k);
}

function keys_(obj) {
  /* eslint-disable no-restricted-syntax */
  const arr = [];
  for (let k in obj) {
    if (hasOwnProp(obj, k)) {
      arr.push(k);
    }
  }
  return arr;
}

export {keys_ as keys};


export function extend(obj1, obj2) {
  obj1 = obj1 || {};
  keys_(obj2).forEach(k => {
    obj1[k] = obj2[k];
  });
  return obj1;
}

export {extend as _assign};

'use strict';

import path from 'path';
import {EmitterObj} from './object';


export default class Loader extends EmitterObj {
  resolve(from, to) {
    return path.resolve(path.dirname(from), to);
  }

  isRelative(filename) {
    return (filename.indexOf('./') === 0 || filename.indexOf('../') === 0);
  }
}

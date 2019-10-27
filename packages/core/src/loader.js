import {EmitterObj} from './object';

export class Loader extends EmitterObj {
  isRelative(filename) {
    return (filename.indexOf('./') === 0 || filename.indexOf('../') === 0);
  }
}

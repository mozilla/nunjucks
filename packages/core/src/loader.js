import {EmitterObj} from '@nunjucks/common';

export class Loader extends EmitterObj {
  isRelative(filename) {
    return (filename.indexOf('./') === 0 || filename.indexOf('../') === 0);
  }
}

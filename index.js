
const handler = {
  get: async (target, prop) => {
    const { begin, promise } = target[prop] || {};
    if (!begin) {
      return null;
    }
    if (!promise) {
      return null;
    }
    if (Date.now() - begin > target.expire) {
      return null;
    }
    try {
      return await promise;
    } catch (error) {
      return null;
    }
  },
  set: (target, prop, value) => {
    target[prop] = { begin: Date.now(), promise: value };
    return true;
  },
};

class Cache {
  constructor(expire = 60) {
    this.expire = expire * 1000;
    this.keyMap = {};
    this._initProxy();
  }
  static init() {
    return new Cache();
  }
  _initProxy() {
    this._proxy = new Proxy({ expire: this.expire }, handler);
  }
  /* eslint class-methods-use-this:  0 */
  _checkCb(parser) {
    if (typeof parser !== 'function') {
      return data => data;
    }
    return parser;
  }
  async setKey(key, func, ...args) {
    const wrappedFunc = ((...params) => func(...params))
      .bind(null, ...args);
    this.keyMap[key] = { func: wrappedFunc };
  }
  /**
   * 异步获取数据并缓存
   * @param {string} key - 缓存标识
   * @param {Promise<*>} asyncCall - 封装为promise的异步调用方法
   * @param {function(data):*} callback - func的后续处理函数
   * @returns {Promsie<*>} func请求并被缓存的数据
   */
  async get(key, asyncCall, callback) {
    const result = await this._proxy[key];
    const parse = this._checkCb(callback);
    if (!result) {
      const promise = Promise.resolve(asyncCall).then(data => parse(data));
      this._proxy[key] = promise;
    }
    return this._proxy[key];
  }
  // todo: 通过setkey设置后使用cache[key] 直接访问
  // 解决方法是为new cache再设置一层proxy
  async getByKey(key) {
    const { func } = this.keyMap[key];
    return this.get(key, func());
  }
  clear() {
    this._initProxy();
  }
}

module.exports = Cache;


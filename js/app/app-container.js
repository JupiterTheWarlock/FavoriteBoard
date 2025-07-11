/**
 * FavoriteBoard - 依赖注入容器
 * 负责：服务注册、依赖解析、生命周期管理
 * 
 * @author JupiterTheWarlock
 * @description 实现依赖注入模式，管理应用中所有服务的生命周期 🐱
 */

/**
 * 应用容器 - 依赖注入容器
 * 提供服务注册、依赖解析和单例管理功能
 */
class AppContainer {
  constructor() {
    // 服务定义存储
    this.services = new Map();      // Map<serviceName, ServiceDefinition>
    
    // 单例实例缓存
    this.instances = new Map();     // Map<serviceName, serviceInstance>
    
    // 循环依赖检测
    this.resolving = new Set();     // Set<serviceName>
    
    // 容器状态
    this.isDisposed = false;
    this.initializationOrder = [];
    
    console.log('📦 依赖注入容器初始化 🐱');
  }
  
  /**
   * 注册服务
   * @param {string} name - 服务名称
   * @param {Function|Object} ServiceClass - 服务类或服务定义
   * @param {Object} options - 注册选项
   * @param {boolean} options.singleton - 是否为单例 (默认true)
   * @param {Array<string>} options.dependencies - 依赖的服务名称列表
   * @param {Function} options.factory - 工厂函数
   * @param {Object} options.config - 服务配置
   */
  register(name, ServiceClass, options = {}) {
    this._checkDisposed();
    
    if (this.services.has(name)) {
      throw new Error(`喵~ 服务已经注册了: ${name}`);
    }
    
    if (!ServiceClass && !options.factory) {
      throw new Error(`喵~ 必须提供服务类或工厂函数: ${name}`);
    }
    
    const serviceDefinition = {
      ServiceClass: ServiceClass || null,
      singleton: options.singleton !== false, // 默认为单例
      dependencies: Array.isArray(options.dependencies) ? options.dependencies : [],
      factory: options.factory || null,
      config: options.config || {},
      initialized: false
    };
    
    this.services.set(name, serviceDefinition);
    
    console.log(`📦 注册服务: ${name} ${serviceDefinition.singleton ? '(单例)' : '(多例)'} 🐱`);
    
    return this;
  }
  
  /**
   * 获取服务实例
   * @param {string} name - 服务名称
   * @returns {Object} 服务实例
   */
  get(name) {
    this._checkDisposed();
    
    // 检查循环依赖
    if (this.resolving.has(name)) {
      const resolvingList = Array.from(this.resolving);
      throw new Error(`喵~ 检测到循环依赖: ${resolvingList.join(' -> ')} -> ${name}`);
    }
    
    // 单例检查
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }
    
    const serviceDefinition = this.services.get(name);
    if (!serviceDefinition) {
      throw new Error(`喵~ 服务未注册: ${name}`);
    }
    
    // 开始解析
    this.resolving.add(name);
    
    try {
      let instance;
      
      if (serviceDefinition.factory) {
        // 使用工厂函数创建
        console.log(`🏭 使用工厂创建服务: ${name} 🐱`);
        instance = serviceDefinition.factory(this, serviceDefinition.config);
      } else {
        // 解析依赖
        const dependencies = serviceDefinition.dependencies.map(dep => {
          console.log(`🔗 解析依赖: ${name} -> ${dep} 🐱`);
          return this.get(dep);
        });
        
        // 创建实例
        console.log(`🛠️ 创建服务实例: ${name} 🐱`);
        instance = new serviceDefinition.ServiceClass(this, ...dependencies);
      }
      
      if (!instance) {
        throw new Error(`喵~ 服务实例创建失败: ${name}`);
      }
      
      // 单例缓存
      if (serviceDefinition.singleton) {
        this.instances.set(name, instance);
      }
      
      // 记录初始化顺序
      if (!this.initializationOrder.includes(name)) {
        this.initializationOrder.push(name);
      }
      
      // 调用初始化方法
      if (typeof instance.init === 'function' && !serviceDefinition.initialized) {
        console.log(`🚀 初始化服务: ${name} 🐱`);
        const initResult = instance.init();
        
        // 处理异步初始化
        if (initResult && typeof initResult.then === 'function') {
          initResult.catch(error => {
            console.error(`❌ 服务初始化失败: ${name}`, error);
          });
        }
        
        serviceDefinition.initialized = true;
      }
      
      console.log(`✅ 服务创建成功: ${name} 🐱`);
      return instance;
      
    } catch (error) {
      console.error(`❌ 服务创建失败: ${name}`, error);
      throw error;
    } finally {
      this.resolving.delete(name);
    }
  }
  
  /**
   * 批量注册服务
   * @param {Object} definitions - 服务定义对象
   */
  registerBatch(definitions) {
    this._checkDisposed();
    
    console.log(`📦 批量注册 ${Object.keys(definitions).length} 个服务 🐱`);
    
    for (const [name, definition] of Object.entries(definitions)) {
      try {
        if (typeof definition === 'function') {
          // 简单类注册
          this.register(name, definition);
        } else {
          // 完整定义注册
          this.register(name, definition.class, definition.options);
        }
      } catch (error) {
        console.error(`❌ 批量注册失败: ${name}`, error);
        throw error;
      }
    }
    
    console.log('✅ 批量注册完成 🐱');
    return this;
  }
  
  /**
   * 检查服务是否已注册
   * @param {string} name - 服务名称
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name);
  }
  
  /**
   * 检查服务实例是否已创建
   * @param {string} name - 服务名称
   * @returns {boolean}
   */
  hasInstance(name) {
    return this.instances.has(name);
  }
  
  /**
   * 获取所有已注册的服务名称
   * @returns {Array<string>}
   */
  getRegisteredServices() {
    return Array.from(this.services.keys());
  }
  
  /**
   * 获取服务的依赖关系
   * @param {string} name - 服务名称
   * @returns {Array<string>}
   */
  getDependencies(name) {
    const serviceDefinition = this.services.get(name);
    return serviceDefinition ? [...serviceDefinition.dependencies] : [];
  }
  
  /**
   * 获取容器状态信息
   * @returns {Object}
   */
  getStatus() {
    return {
      registeredServices: this.services.size,
      createdInstances: this.instances.size,
      initializationOrder: [...this.initializationOrder],
      isDisposed: this.isDisposed
    };
  }
  
  /**
   * 销毁容器和所有服务实例
   */
  dispose() {
    if (this.isDisposed) {
      return;
    }
    
    console.log('🗑️ 开始销毁容器 🐱');
    
    // 按照创建顺序的逆序销毁服务
    const disposeOrder = [...this.initializationOrder].reverse();
    
    for (const serviceName of disposeOrder) {
      try {
        const instance = this.instances.get(serviceName);
        if (instance && typeof instance.dispose === 'function') {
          console.log(`🗑️ 销毁服务: ${serviceName} 🐱`);
          instance.dispose();
        }
      } catch (error) {
        console.error(`❌ 服务销毁失败: ${serviceName}`, error);
      }
    }
    
    // 清理容器状态
    this.services.clear();
    this.instances.clear();
    this.resolving.clear();
    this.initializationOrder.length = 0;
    this.isDisposed = true;
    
    console.log('✅ 容器销毁完成 🐱');
  }
  
  /**
   * 检查容器是否已销毁
   * @private
   */
  _checkDisposed() {
    if (this.isDisposed) {
      throw new Error('喵~ 容器已经被销毁了，无法继续使用');
    }
  }
}

// 导出容器类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = AppContainer;
} else {
  // 浏览器环境
  window.AppContainer = AppContainer;
} 
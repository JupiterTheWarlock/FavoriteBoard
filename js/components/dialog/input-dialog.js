/**
 * FavoriteBoard - 输入对话框组件
 * 负责：用户输入对话框的显示和处理
 * 
 * @author JupiterTheWarlock
 * @description 输入对话框组件，继承自DialogComponent，用于获取用户输入 🐱
 */

/**
 * 输入对话框组件 - 用于获取用户输入的对话框
 * 继承自DialogComponent，添加了输入控件
 */
class InputDialogComponent extends DialogComponent {
  constructor(options = {}) {
    super({
      type: 'input',
      title: '请输入',
      confirmText: '确认',
      cancelText: '取消',
      ...options
    });
    
    // 输入配置
    this.inputConfig = {
      type: 'text', // 'text', 'password', 'email', 'number', 'textarea'
      placeholder: '',
      value: '',
      maxLength: null,
      minLength: null,
      required: true,
      pattern: null,
      multiline: false,
      rows: 3,
      validation: null, // 自定义验证函数
      ...options.input
    };
    
    // 输入元素
    this.inputElement = null;
    this.errorElement = null;
    
    console.log(`💬 输入对话框组件创建: ${this.inputConfig.type} 🐱`);
  }
  
  /**
   * 创建自定义内容
   * @protected
   */
  _createCustomContent() {
    // 创建输入组容器
    const inputGroup = document.createElement('div');
    inputGroup.className = 'dialog-input-group';
    
    // 创建输入元素
    this._createInputElement();
    inputGroup.appendChild(this.inputElement);
    
    // 创建错误提示元素
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'dialog-error';
    this.errorElement.style.display = 'none';
    inputGroup.appendChild(this.errorElement);
    
    // 添加到内容区域
    this.elements.content.appendChild(inputGroup);
    
    // 绑定输入事件
    this._bindInputEvents();
  }
  
  /**
   * 创建输入元素
   * @private
   */
  _createInputElement() {
    if (this.inputConfig.type === 'textarea' || this.inputConfig.multiline) {
      // 创建文本域
      this.inputElement = document.createElement('textarea');
      this.inputElement.rows = this.inputConfig.rows;
    } else {
      // 创建输入框
      this.inputElement = document.createElement('input');
      this.inputElement.type = this.inputConfig.type;
    }
    
    // 设置基本属性
    this.inputElement.className = 'dialog-input';
    this.inputElement.placeholder = this.inputConfig.placeholder;
    this.inputElement.value = this.inputConfig.value;
    
    // 设置验证属性
    if (this.inputConfig.required) {
      this.inputElement.required = true;
    }
    
    if (this.inputConfig.maxLength) {
      this.inputElement.maxLength = this.inputConfig.maxLength;
    }
    
    if (this.inputConfig.minLength) {
      this.inputElement.minLength = this.inputConfig.minLength;
    }
    
    if (this.inputConfig.pattern) {
      this.inputElement.pattern = this.inputConfig.pattern;
    }
    
    // 设置自动聚焦
    this.inputElement.autofocus = true;
  }
  
  /**
   * 绑定输入事件
   * @private
   */
  _bindInputEvents() {
    if (!this.inputElement) return;
    
    // 输入验证事件
    this._addEventListener(this.inputElement, 'input', () => {
      this._validateInput();
      this._updateConfirmButton();
    });
    
    // 失焦验证事件
    this._addEventListener(this.inputElement, 'blur', () => {
      this._validateInput();
    });
    
    // 回车确认事件
    this._addEventListener(this.inputElement, 'keydown', (e) => {
      if (e.key === 'Enter') {
        // 单行输入时回车确认，多行输入时Ctrl+Enter确认
        if (!this.inputConfig.multiline || e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this._handleConfirm();
        }
      }
    });
    
    // 实时字符计数（如果有最大长度限制）
    if (this.inputConfig.maxLength) {
      this._createCharacterCounter();
    }
  }
  
  /**
   * 创建字符计数器
   * @private
   */
  _createCharacterCounter() {
    const counter = document.createElement('div');
    counter.className = 'dialog-char-counter';
    
    const updateCounter = () => {
      const current = this.inputElement.value.length;
      const max = this.inputConfig.maxLength;
      counter.textContent = `${current}/${max}`;
      
      if (current > max * 0.9) {
        counter.classList.add('warning');
      } else {
        counter.classList.remove('warning');
      }
    };
    
    // 初始化计数
    updateCounter();
    
    // 绑定更新事件
    this._addEventListener(this.inputElement, 'input', updateCounter);
    
    // 添加到输入组
    const inputGroup = this.inputElement.parentNode;
    inputGroup.appendChild(counter);
  }
  
  /**
   * 验证输入
   * @private
   * @returns {boolean}
   */
  _validateInput() {
    const value = this.inputElement.value;
    let isValid = true;
    let errorMessage = '';
    
    // 必填验证
    if (this.inputConfig.required && !value.trim()) {
      isValid = false;
      errorMessage = '此字段为必填项';
    }
    
    // 长度验证
    if (isValid && this.inputConfig.minLength && value.length < this.inputConfig.minLength) {
      isValid = false;
      errorMessage = `最少需要 ${this.inputConfig.minLength} 个字符`;
    }
    
    if (isValid && this.inputConfig.maxLength && value.length > this.inputConfig.maxLength) {
      isValid = false;
      errorMessage = `最多只能输入 ${this.inputConfig.maxLength} 个字符`;
    }
    
    // 模式验证
    if (isValid && this.inputConfig.pattern) {
      const regex = new RegExp(this.inputConfig.pattern);
      if (!regex.test(value)) {
        isValid = false;
        errorMessage = '输入格式不正确';
      }
    }
    
    // 自定义验证
    if (isValid && typeof this.inputConfig.validation === 'function') {
      try {
        const result = this.inputConfig.validation(value);
        if (result !== true) {
          isValid = false;
          errorMessage = typeof result === 'string' ? result : '输入验证失败';
        }
      } catch (error) {
        isValid = false;
        errorMessage = '验证过程中发生错误';
        console.error('❌ 输入验证错误:', error);
      }
    }
    
    // 显示/隐藏错误信息
    this._showError(isValid ? '' : errorMessage);
    
    return isValid;
  }
  
  /**
   * 显示错误信息
   * @private
   * @param {string} message
   */
  _showError(message) {
    if (!this.errorElement) return;
    
    if (message) {
      this.errorElement.textContent = message;
      this.errorElement.style.display = 'block';
      this.inputElement.classList.add('error');
    } else {
      this.errorElement.style.display = 'none';
      this.inputElement.classList.remove('error');
    }
  }
  
  /**
   * 更新确认按钮状态
   * @private
   */
  _updateConfirmButton() {
    if (!this.elements.confirmBtn) return;
    
    const isValid = this._validateInput();
    this.elements.confirmBtn.disabled = !isValid;
  }
  
  /**
   * 获取对话框结果
   * @protected
   * @returns {string}
   */
  _getResult() {
    return this.inputElement ? this.inputElement.value : '';
  }
  
  /**
   * 验证结果
   * @protected
   * @param {string} result
   * @returns {boolean}
   */
  _validateResult(result) {
    // 重新验证一次，确保数据正确
    return this._validateInput();
  }
  
  /**
   * 聚焦第一个可聚焦元素
   * @private
   */
  _focusFirstElement() {
    if (this.inputElement) {
      this.inputElement.focus();
      
      // 如果有默认值，选中全部文本
      if (this.inputElement.value) {
        this.inputElement.select();
      }
    }
  }
  
  /**
   * 设置输入值
   * @param {string} value
   */
  setValue(value) {
    if (this.inputElement) {
      this.inputElement.value = value;
      this._validateInput();
      this._updateConfirmButton();
    }
  }
  
  /**
   * 获取输入值
   * @returns {string}
   */
  getValue() {
    return this.inputElement ? this.inputElement.value : '';
  }
  
  /**
   * 设置占位符
   * @param {string} placeholder
   */
  setPlaceholder(placeholder) {
    if (this.inputElement) {
      this.inputElement.placeholder = placeholder;
      this.inputConfig.placeholder = placeholder;
    }
  }
  
  /**
   * 设置输入验证
   * @param {Function} validationFn
   */
  setValidation(validationFn) {
    this.inputConfig.validation = validationFn;
    if (this.inputElement) {
      this._validateInput();
      this._updateConfirmButton();
    }
  }
  
  /**
   * 清除错误状态
   */
  clearError() {
    this._showError('');
  }
}

/**
 * 输入对话框工厂函数
 */
class InputDialogFactory {
  
  /**
   * 创建文本输入对话框
   * @param {Object} options
   * @returns {Promise<string>}
   */
  static prompt(options = {}) {
    const dialog = new InputDialogComponent({
      title: '请输入',
      message: options.message || '',
      input: {
        type: 'text',
        placeholder: options.placeholder || '',
        value: options.value || '',
        required: options.required !== false,
        ...options.input
      },
      ...options
    });
    
    return dialog.show().then(result => {
      return result.isConfirm ? result.result : null;
    });
  }
  
  /**
   * 创建文件夹名称输入对话框
   * @param {Object} options
   * @returns {Promise<string>}
   */
  static folderName(options = {}) {
    return InputDialogFactory.prompt({
      title: '创建文件夹',
      message: '请输入文件夹名称：',
      placeholder: '新文件夹',
      input: {
        maxLength: 255,
        validation: (value) => {
          // 验证文件夹名称
          const invalidChars = /[<>:"/\\|?*]/;
          if (invalidChars.test(value)) {
            return '文件夹名称不能包含以下字符：< > : " / \\ | ? *';
          }
          
          if (value.trim() !== value) {
            return '文件夹名称不能以空格开头或结尾';
          }
          
          return true;
        }
      },
      ...options
    });
  }
  
  /**
   * 创建密码输入对话框
   * @param {Object} options
   * @returns {Promise<string>}
   */
  static password(options = {}) {
    return InputDialogFactory.prompt({
      title: '输入密码',
      message: options.message || '请输入密码：',
      input: {
        type: 'password',
        required: true,
        minLength: options.minLength || 1,
        ...options.input
      },
      ...options
    });
  }
  
  /**
   * 创建多行文本输入对话框
   * @param {Object} options
   * @returns {Promise<string>}
   */
  static textarea(options = {}) {
    return InputDialogFactory.prompt({
      title: '输入文本',
      message: options.message || '请输入内容：',
      input: {
        multiline: true,
        rows: options.rows || 5,
        placeholder: options.placeholder || '',
        maxLength: options.maxLength || 1000,
        ...options.input
      },
      ...options
    });
  }
  
  /**
   * 创建URL输入对话框
   * @param {Object} options
   * @returns {Promise<string>}
   */
  static url(options = {}) {
    return InputDialogFactory.prompt({
      title: '输入网址',
      message: options.message || '请输入网址：',
      placeholder: 'https://example.com',
      input: {
        type: 'url',
        validation: (value) => {
          try {
            new URL(value);
            return true;
          } catch {
            return '请输入有效的网址';
          }
        },
        ...options.input
      },
      ...options
    });
  }
  
  /**
   * 创建邮箱输入对话框
   * @param {Object} options
   * @returns {Promise<string>}
   */
  static email(options = {}) {
    return InputDialogFactory.prompt({
      title: '输入邮箱',
      message: options.message || '请输入邮箱地址：',
      placeholder: 'user@example.com',
      input: {
        type: 'email',
        pattern: '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$',
        ...options.input
      },
      ...options
    });
  }
  
  /**
   * 创建数字输入对话框
   * @param {Object} options
   * @returns {Promise<number>}
   */
  static number(options = {}) {
    return InputDialogFactory.prompt({
      title: '输入数字',
      message: options.message || '请输入数字：',
      input: {
        type: 'number',
        min: options.min,
        max: options.max,
        step: options.step || 1,
        validation: (value) => {
          const num = parseFloat(value);
          if (isNaN(num)) {
            return '请输入有效的数字';
          }
          
          if (options.min !== undefined && num < options.min) {
            return `数字不能小于 ${options.min}`;
          }
          
          if (options.max !== undefined && num > options.max) {
            return `数字不能大于 ${options.max}`;
          }
          
          return true;
        },
        ...options.input
      },
      ...options
    }).then(result => {
      return result !== null ? parseFloat(result) : null;
    });
  }
} 
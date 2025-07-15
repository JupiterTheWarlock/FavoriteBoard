/**
 * DialogManager - 对话框管理器
 * 负责对话框的创建、管理和生命周期
 */
class DialogManager {
  constructor(eventBus, notificationManager) {
    this.eventBus = eventBus;
    this.notificationManager = notificationManager;
    
    // 对话框管理
    this.activeDialogs = new Set();
    this.dialogCounter = 0;
    this.zIndexBase = 10000;
    
    // 默认配置
    this.defaultOptions = {
      title: '确认',
      message: '',
      warning: '',
      type: 'confirm', // 'confirm', 'input', 'alert'
      inputValue: '',
      inputPlaceholder: '',
      confirmText: '确认',
      cancelText: '取消',
      isDangerous: false,
      allowEscapeClose: true,
      allowBackdropClose: true,
      autoFocus: true
    };
    
    console.log('📝 DialogManager初始化开始...');
    
    // 绑定全局事件
    this.bindGlobalEvents();
    
    console.log('✅ DialogManager初始化完成');
  }
  
  /**
   * 绑定全局事件
   */
  bindGlobalEvents() {
    // 监听ESC键全局关闭对话框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTopDialog();
      }
    });
    
    console.log('🔗 DialogManager全局事件绑定完成');
  }
  
  /**
   * 创建对话框
   * @param {Object} options - 对话框选项
   * @returns {Object} 对话框对象
   */
  create(options = {}) {
    try {
      // 合并选项
      const config = { ...this.defaultOptions, ...options };
      
      // 生成唯一ID
      const dialogId = `dialog-${++this.dialogCounter}`;
      
      console.log(`📝 创建对话框: ${dialogId}`, config);
      
      // 创建对话框对象
      const dialog = this.createDialogObject(dialogId, config);
      
      // 注册对话框
      this.activeDialogs.add(dialog);
      
      return dialog;
      
    } catch (error) {
      console.error('❌ 创建对话框失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建对话框对象
   * @param {string} dialogId - 对话框ID
   * @param {Object} config - 配置选项
   * @returns {Object} 对话框对象
   */
  createDialogObject(dialogId, config) {
    const {
      title, message, warning, type, inputValue, inputPlaceholder,
      confirmText, cancelText, isDangerous, allowEscapeClose,
      allowBackdropClose, autoFocus
    } = config;
    
    // 创建对话框容器
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.id = `${dialogId}-overlay`;
    
    const dialogElement = document.createElement('div');
    dialogElement.className = `dialog ${isDangerous ? 'dialog-danger' : ''}`;
    dialogElement.id = dialogId;
    
    let inputElement = null;
    
    // 构建对话框HTML
    dialogElement.innerHTML = `
      <div class="dialog-header">
        <h3 class="dialog-title">${title}</h3>
        <button class="dialog-close" title="关闭">×</button>
      </div>
      <div class="dialog-body">
        ${message ? `<p class="dialog-message">${message}</p>` : ''}
        ${warning ? `<p class="dialog-warning">${warning}</p>` : ''}
        ${type === 'input' ? `
          <div class="dialog-input-group">
            <input type="text" class="dialog-input" value="${inputValue}" placeholder="${inputPlaceholder}" />
          </div>
        ` : ''}
      </div>
      <div class="dialog-footer">
        ${type !== 'alert' ? `<button class="dialog-btn dialog-btn-cancel">${cancelText}</button>` : ''}
        <button class="dialog-btn dialog-btn-confirm ${isDangerous ? 'btn-danger' : ''}">${confirmText}</button>
      </div>
    `;
    
    overlay.appendChild(dialogElement);
    
    if (type === 'input') {
      inputElement = dialogElement.querySelector('.dialog-input');
    }
    
    // 创建对话框对象
    const dialog = {
      id: dialogId,
      element: overlay,
      dialogElement: dialogElement,
      inputElement: inputElement,
      config: config,
      isVisible: false,
      onConfirm: null,
      onCancel: null,
      onClose: null,
      
      /**
       * 显示对话框
       */
      show: () => {
        try {
          console.log(`📝 显示对话框: ${dialogId}`);
          
          // 设置z-index
          const zIndex = this.zIndexBase + this.activeDialogs.size;
          overlay.style.zIndex = zIndex;
          
          // 添加到DOM
          document.body.appendChild(overlay);
          
          // 显示动画
          setTimeout(() => {
            overlay.classList.add('show');
          }, 10);
          
          // 自动聚焦
          if (autoFocus) {
            if (inputElement) {
              setTimeout(() => {
                inputElement.focus();
                inputElement.select();
              }, 100);
            } else {
              const confirmBtn = dialogElement.querySelector('.dialog-btn-confirm');
              if (confirmBtn) {
                setTimeout(() => {
                  confirmBtn.focus();
                }, 100);
              }
            }
          }
          
          dialog.isVisible = true;
          
          // 发布对话框显示事件
          this.eventBus.emit('dialog-shown', { dialogId, config });
          
        } catch (error) {
          console.error(`❌ 显示对话框失败: ${dialogId}`, error);
        }
      },
      
      /**
       * 隐藏对话框
       */
      hide: () => {
        try {
          console.log(`📝 隐藏对话框: ${dialogId}`);
          
          if (overlay.parentNode) {
            overlay.classList.remove('show');
            
            // 延迟移除DOM元素
            setTimeout(() => {
              if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
              }
            }, 300); // 等待动画完成
          }
          
          dialog.isVisible = false;
          
          // 从活动对话框列表中移除
          this.activeDialogs.delete(dialog);
          
          // 发布对话框隐藏事件
          this.eventBus.emit('dialog-hidden', { dialogId, config });
          
          // 调用关闭回调
          if (dialog.onClose) {
            dialog.onClose();
          }
          
        } catch (error) {
          console.error(`❌ 隐藏对话框失败: ${dialogId}`, error);
        }
      },
      
      /**
       * 获取输入值
       */
      getInputValue: () => {
        return inputElement ? inputElement.value : null;
      },
      
      /**
       * 设置输入值
       */
      setInputValue: (value) => {
        if (inputElement) {
          inputElement.value = value;
        }
      },
      
      /**
       * 获取对话框配置
       */
      getConfig: () => {
        return { ...config };
      }
    };
    
    // 绑定对话框事件
    this.bindDialogEvents(dialog);
    
    return dialog;
  }
  
  /**
   * 绑定对话框事件
   * @param {Object} dialog - 对话框对象
   */
  bindDialogEvents(dialog) {
    const { dialogElement, inputElement, config } = dialog;
    const { allowBackdropClose, allowEscapeClose } = config;
    
    // 关闭按钮事件
    const closeBtn = dialogElement.querySelector('.dialog-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (dialog.onCancel) {
          dialog.onCancel();
        }
        dialog.hide();
      });
    }
    
    // 取消按钮事件
    const cancelBtn = dialogElement.querySelector('.dialog-btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (dialog.onCancel) {
          dialog.onCancel();
        }
        dialog.hide();
      });
    }
    
    // 确认按钮事件
    const confirmBtn = dialogElement.querySelector('.dialog-btn-confirm');
    if (confirmBtn) {
      const handleConfirm = async () => {
        try {
          if (dialog.onConfirm) {
            const inputValue = dialog.getInputValue();
            const result = await dialog.onConfirm(inputValue);
            
            // 如果返回false，不关闭对话框
            if (result !== false) {
              dialog.hide();
            }
          } else {
            dialog.hide();
          }
        } catch (error) {
          console.error('❌ 对话框确认处理失败:', error);
          
          // 显示错误通知
          if (this.notificationManager) {
            this.notificationManager.show('操作失败: ' + error.message, 'error');
          }
        }
      };
      
      confirmBtn.addEventListener('click', handleConfirm);
    }
    
    // 回车键确认（仅对输入框）
    if (inputElement) {
      inputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          confirmBtn?.click();
        }
      });
    }
    
    // ESC键取消
    if (allowEscapeClose) {
      dialogElement.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          if (dialog.onCancel) {
            dialog.onCancel();
          }
          dialog.hide();
        }
      });
    }
    
    // 点击遮罩关闭
    if (allowBackdropClose) {
      dialog.element.addEventListener('click', (e) => {
        if (e.target === dialog.element) {
          if (dialog.onCancel) {
            dialog.onCancel();
          }
          dialog.hide();
        }
      });
    }
  }
  
  /**
   * 关闭顶层对话框（最后显示的对话框）
   */
  closeTopDialog() {
    if (this.activeDialogs.size === 0) return;
    
    // 找到z-index最高的对话框
    let topDialog = null;
    let maxZIndex = -1;
    
    for (const dialog of this.activeDialogs) {
      if (dialog.isVisible && dialog.config.allowEscapeClose) {
        const zIndex = parseInt(dialog.element.style.zIndex) || 0;
        if (zIndex > maxZIndex) {
          maxZIndex = zIndex;
          topDialog = dialog;
        }
      }
    }
    
    if (topDialog) {
      if (topDialog.onCancel) {
        topDialog.onCancel();
      }
      topDialog.hide();
    }
  }
  
  /**
   * 关闭所有对话框
   */
  closeAllDialogs() {
    console.log('📝 关闭所有对话框...');
    
    const dialogsToClose = Array.from(this.activeDialogs);
    
    for (const dialog of dialogsToClose) {
      if (dialog.isVisible) {
        if (dialog.onCancel) {
          dialog.onCancel();
        }
        dialog.hide();
      }
    }
    
    console.log('✅ 所有对话框已关闭');
  }
  
  /**
   * 获取活动对话框数量
   * @returns {number} 活动对话框数量
   */
  getActiveDialogCount() {
    return this.activeDialogs.size;
  }
  
  /**
   * 创建确认对话框的便捷方法
   * @param {string} message - 确认消息
   * @param {Object} options - 附加选项
   * @returns {Promise<boolean>} 用户选择结果
   */
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const dialog = this.create({
        type: 'confirm',
        message,
        ...options
      });
      
      dialog.onConfirm = () => {
        resolve(true);
        return true;
      };
      
      dialog.onCancel = () => {
        resolve(false);
      };
      
      dialog.show();
    });
  }
  
  /**
   * 创建输入对话框的便捷方法
   * @param {string} message - 输入提示
   * @param {Object} options - 附加选项
   * @returns {Promise<string|null>} 用户输入值或null（取消）
   */
  prompt(message, options = {}) {
    return new Promise((resolve) => {
      const dialog = this.create({
        type: 'input',
        message,
        ...options
      });
      
      dialog.onConfirm = (inputValue) => {
        resolve(inputValue);
        return true;
      };
      
      dialog.onCancel = () => {
        resolve(null);
      };
      
      dialog.show();
    });
  }
  
  /**
   * 创建警告对话框的便捷方法
   * @param {string} message - 警告消息
   * @param {Object} options - 附加选项
   * @returns {Promise<void>} 对话框关闭Promise
   */
  alert(message, options = {}) {
    return new Promise((resolve) => {
      const dialog = this.create({
        type: 'alert',
        message,
        confirmText: '知道了',
        ...options
      });
      
      dialog.onConfirm = () => {
        resolve();
        return true;
      };
      
      dialog.show();
    });
  }
  
  /**
   * 主题变更处理
   * @param {string} theme - 主题名称
   */
  onThemeChange(theme) {
    console.log(`🎨 DialogManager主题变更: ${theme}`);
    
    // 应用主题到所有活动对话框
    for (const dialog of this.activeDialogs) {
      if (dialog.element) {
        dialog.element.setAttribute('data-theme', theme);
      }
    }
  }
  
  /**
   * 窗口大小变化处理
   */
  onWindowResize() {
    console.log('📏 DialogManager处理窗口大小变化');
    
    // 重新计算对话框位置（如果需要）
    for (const dialog of this.activeDialogs) {
      if (dialog.isVisible) {
        // 可以在这里实现对话框位置调整逻辑
      }
    }
  }
  
  /**
   * 清理资源
   */
  destroy() {
    console.log('🧹 清理DialogManager资源...');
    
    // 关闭所有对话框
    this.closeAllDialogs();
    
    // 清理引用
    this.activeDialogs.clear();
    this.dialogCounter = 0;
    
    console.log('✅ DialogManager资源清理完成');
  }
}

// 导出DialogManager类
window.DialogManager = DialogManager; 
class SessionUserManager {
    constructor() {
        // 确保使用稳定的 tabId
        this.tabId = this.getOrCreateStableTabId();
        this.globalKey = 'fitcamp_global_tabs';
        
        console.log('SessionUserManager 初始化，TabId:', this.tabId);
        
        // 初始化时注册当前标签页
        this.registerTab();
        
        // 检查并恢复登录状态
        this.restoreLoginState();
        
        // 监听页面卸载，清理标签页状态
        window.addEventListener('beforeunload', () => {
            this.updateTabActivity(); // 更新活跃时间，不删除数据
        });

        // 定期清理过期的标签页状态
        setInterval(() => {
            this.cleanupExpiredTabs();
        }, 30000); // 每30秒清理一次
    }

    // 获取或创建稳定的 tabId - 修复版本
    getOrCreateStableTabId() {
        // 首先尝试从 sessionStorage 获取已存在的 tabId
        let existingTabId = sessionStorage.getItem('fitcamp_tab_id');
        
        if (existingTabId) {
            console.log('使用现有的 TabId:', existingTabId);
            return existingTabId;
        }
        
        // 如果不存在，生成新的 tabId
        const newTabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // 立即保存到 sessionStorage
        try {
            sessionStorage.setItem('fitcamp_tab_id', newTabId);
            console.log('生成并保存新的 TabId:', newTabId);
            
            // 验证保存是否成功
            const saved = sessionStorage.getItem('fitcamp_tab_id');
            if (saved !== newTabId) {
                console.error('TabId 保存失败！');
            }
        } catch (error) {
            console.error('保存 TabId 失败:', error);
        }
        
        return newTabId;
    }

    // 恢复登录状态
    restoreLoginState() {
        const user = this.getCurrentUser();
        const token = this.getCurrentToken();
        
        console.log('恢复登录状态检查:', {
            tabId: this.tabId,
            hasUser: !!user,
            hasToken: !!token,
            userName: user?.name
        });
        
        if (user && token) {
            console.log(`标签页 ${this.tabId} 恢复登录状态:`, user.name);
            this.updateGlobalTabStatus();
            
            // 触发登录事件，通知其他组件
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('sessionUserLogin', {
                    detail: { user, tabId: this.tabId }
                }));
            }, 100);
            
            return true;
        }
        
        return false;
    }

    // 修复获取当前用户信息
    getCurrentUser() {
        try {
            const sessionKey = `fitcamp_user_${this.tabId}`;
            const stored = sessionStorage.getItem(sessionKey);
            
            if (!stored) {
                console.log('getCurrentUser: 没有存储数据 -', sessionKey);
                return null;
            }
            
            const data = JSON.parse(stored);
            if (data && data.user) {
                console.log('getCurrentUser: 成功获取用户 -', data.user.name);
                return data.user;
            }
            
            console.log('getCurrentUser: 数据格式异常');
            return null;
        } catch (error) {
            console.error('getCurrentUser 失败:', error);
            return null;
        }
    }

    // 修复获取当前token
    getCurrentToken() {
        try {
            const sessionKey = `fitcamp_user_${this.tabId}`;
            const stored = sessionStorage.getItem(sessionKey);
            
            if (!stored) {
                console.log('getCurrentToken: 没有存储数据 -', sessionKey);
                return null;
            }
            
            const data = JSON.parse(stored);
            if (data && data.token) {
                console.log('getCurrentToken: 成功获取token - 长度:', data.token.length);
                return data.token;
            }
            
            console.log('getCurrentToken: token不存在');
            return null;
        } catch (error) {
            console.error('getCurrentToken 失败:', error);
            return null;
        }
    }

    // 修复注册标签页方法
    registerTab() {
        const tabs = this.getGlobalTabs();
        
        // 检查是否已经注册
        if (!tabs[this.tabId]) {
            tabs[this.tabId] = {
                id: this.tabId,
                isLoggedIn: false,
                user: null,
                lastActive: new Date().toISOString(),
                createTime: new Date().toISOString()
            };
            
            localStorage.setItem(this.globalKey, JSON.stringify(tabs));
            console.log(`标签页 ${this.tabId} 已注册`);
        } else {
            // 更新活跃时间
            tabs[this.tabId].lastActive = new Date().toISOString();
            localStorage.setItem(this.globalKey, JSON.stringify(tabs));
            console.log(`标签页 ${this.tabId} 已存在，更新活跃时间`);
        }
    }

    // 修复注销方法 - 不要在 beforeunload 时删除登录数据
    unregisterTab() {
        // 不删除登录数据，只更新活跃时间
        this.updateTabActivity();
        console.log(`标签页 ${this.tabId} 更新最后活跃时间`);
    }

    // 完全清理标签页（只在明确登出时调用）
    clearTabData() {
        // 清理当前标签页的session storage
        const sessionKey = `fitcamp_user_${this.tabId}`;
        sessionStorage.removeItem(sessionKey);
        
        // 从全局标签页状态中移除
        const tabs = this.getGlobalTabs();
        delete tabs[this.tabId];
        localStorage.setItem(this.globalKey, JSON.stringify(tabs));
        
        console.log(`标签页 ${this.tabId} 数据已清理`);
    }

    // 修复登出方法
    logout() {
        try {
            console.log(`标签页 ${this.tabId} 执行登出`);
            
            // 清理标签页数据
            this.clearTabData();
            
            // 触发登出事件
            window.dispatchEvent(new CustomEvent('sessionUserLogout', {
                detail: { tabId: this.tabId }
            }));

            return true;
        } catch (error) {
            console.error('登出过程出错:', error);
            return false;
        }
    }

    // 调试所有存储数据
    debugAllData() {
        console.log('=== 完整存储调试 ===');
        console.log('当前 TabId:', this.tabId);
        console.log('TabId 来源:', sessionStorage.getItem('fitcamp_tab_id'));
        
        // 检查用户数据
        const sessionKey = `fitcamp_user_${this.tabId}`;
        const userData = sessionStorage.getItem(sessionKey);
        console.log('用户数据 Key:', sessionKey);
        console.log('用户数据存在:', !!userData);
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                console.log('用户数据内容:', {
                    hasUser: !!parsed.user,
                    hasToken: !!parsed.token,
                    userName: parsed.user?.name,
                    tokenLength: parsed.token?.length
                });
            } catch (e) {
                console.log('用户数据解析失败:', e);
            }
        }
        
        // 显示所有 fitcamp 相关数据
        console.log('所有 SessionStorage 数据:');
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.includes('fitcamp')) {
                console.log(key, ':', sessionStorage.getItem(key));
            }
        }
        
        console.log('==================');
    }

    // 获取所有已登录的用户信息
    getAllLoggedInUsers() {
        const tabs = this.getGlobalTabs();
        const users = [];
        
        Object.values(tabs).forEach(tab => {
            if (tab.isLoggedIn && tab.user) {
                const existingUser = users.find(u => u.id === tab.user.id);
                if (!existingUser) {
                    users.push({
                        ...tab.user,
                        tabs: [tab.id],
                        lastActive: tab.lastActive
                    });
                } else {
                    existingUser.tabs.push(tab.id);
                    if (new Date(tab.lastActive) > new Date(existingUser.lastActive)) {
                        existingUser.lastActive = tab.lastActive;
                    }
                }
            }
        });
        
        return users;
    }

    // 强制清理所有数据（开发调试用）
    clearAllData() {
        // 清理当前标签页的session storage
        const sessionKey = `fitcamp_user_${this.tabId}`;
        sessionStorage.removeItem(sessionKey);
        
        // 清理tabId
        sessionStorage.removeItem('fitcamp_tab_id');
        
        // 清理全局标签页状态
        localStorage.removeItem(this.globalKey);
        
        console.log('所有用户数据已清理');
        
        // 重新注册当前标签页
        this.registerTab();
    }

    // 导出调试信息
    exportDebugInfo() {
        const debugInfo = {
            currentTabId: this.tabId,
            currentUser: this.getCurrentUser(),
            currentToken: this.getCurrentToken(),
            isLoggedIn: this.isLoggedIn(),
            loginStats: this.getLoginStats(),
            globalTabs: this.getGlobalTabs(),
            sessionStorageData: {}
        };

        // 收集所有相关的session storage数据
        const tabs = this.getGlobalTabs();
        Object.keys(tabs).forEach(tabId => {
            const sessionKey = `fitcamp_user_${tabId}`;
            const data = sessionStorage.getItem(sessionKey);
            if (data) {
                try {
                    debugInfo.sessionStorageData[tabId] = JSON.parse(data);
                } catch (e) {
                    debugInfo.sessionStorageData[tabId] = data;
                }
            }
        });

        return debugInfo;
    }

    // 调试方法：显示所有存储数据
    debugAllStorageData() {
        console.log('=== 完整存储调试信息 ===');
        console.log('当前 TabId:', this.tabId);
        console.log('登录状态:', this.isLoggedIn());
        
        // 显示 sessionStorage 中的所有相关数据
        console.log('SessionStorage 中的所有 fitcamp 相关数据:');
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.includes('fitcamp')) {
                console.log(key, ':', sessionStorage.getItem(key));
            }
        }
        
        // 显示 localStorage 中的全局标签页数据
        console.log('LocalStorage 全局标签页数据:');
        const globalTabs = localStorage.getItem(this.globalKey);
        if (globalTabs) {
            console.log(this.globalKey, ':', JSON.parse(globalTabs));
        }
        
        console.log('========================');
    }

    // 获取全局标签页状态
    getGlobalTabs() {
        try {
            const stored = localStorage.getItem(this.globalKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('获取全局标签页状态失败:', error);
            return {};
        }
    }

    // 更新全局标签页状态
    updateGlobalTabStatus() {
        const tabs = this.getGlobalTabs();
        const currentUser = this.getCurrentUser();
        
        tabs[this.tabId] = {
            id: this.tabId,
            isLoggedIn: !!currentUser,
            user: currentUser,
            lastActive: new Date().toISOString(),
            createTime: tabs[this.tabId]?.createTime || new Date().toISOString()
        };
        
        localStorage.setItem(this.globalKey, JSON.stringify(tabs));
    }

    // 更新标签页活跃状态
    updateTabActivity() {
        const tabs = this.getGlobalTabs();
        if (tabs[this.tabId]) {
            tabs[this.tabId].lastActive = new Date().toISOString();
            localStorage.setItem(this.globalKey, JSON.stringify(tabs));
        }
    }

    // 清理过期的标签页状态（超过1小时未活跃）
    cleanupExpiredTabs() {
        const tabs = this.getGlobalTabs();
        const now = new Date();
        const expiredThreshold = 60 * 60 * 1000; // 1小时
        let hasChanges = false;

        Object.keys(tabs).forEach(tabId => {
            const tab = tabs[tabId];
            const lastActive = new Date(tab.lastActive);
            
            if (now - lastActive > expiredThreshold) {
                delete tabs[tabId];
                hasChanges = true;
                console.log(`清理过期标签页: ${tabId}`);
            }
        });

        if (hasChanges) {
            localStorage.setItem(this.globalKey, JSON.stringify(tabs));
        }
    }

    // 检查是否已登录
    isLoggedIn() {
        const user = this.getCurrentUser();
        const token = this.getCurrentToken();
        const isValid = !!(user && token);
        
        console.log('检查登录状态:', {
            tabId: this.tabId,
            hasUser: !!user,
            hasToken: !!token,
            isLoggedIn: isValid,
            userName: user?.name
        });
        
        return isValid;
    }

    // 获取登录统计信息
    getLoginStats() {
        const tabs = this.getGlobalTabs();
        const currentTab = tabs[this.tabId];
        
        const tabList = Object.values(tabs).map(tab => ({
            ...tab,
            isCurrent: tab.id === this.tabId
        }));

        const loggedInTabs = tabList.filter(tab => tab.isLoggedIn).length;
        const uniqueUsers = new Set(
            tabList
                .filter(tab => tab.isLoggedIn && tab.user)
                .map(tab => tab.user.id)
        ).size;

        return {
            totalTabs: tabList.length,
            loggedInTabs: loggedInTabs,
            uniqueUsers: uniqueUsers,
            currentTab: currentTab,
            tabs: tabList
        };
    }

    // 用户登录
    login(user, token) {
        try {
            if (!user || !token) {
                console.error('登录失败：用户或token为空');
                return false;
            }

            const loginData = {
                user: user,
                token: token,
                loginTime: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };

            // 保存到当前标签页的session storage
            const sessionKey = `fitcamp_user_${this.tabId}`;
            sessionStorage.setItem(sessionKey, JSON.stringify(loginData));
            
            console.log(`标签页 ${this.tabId} 登录成功:`, user.name);
            console.log('保存的token长度:', token.length);
            console.log('SessionStorage Key:', sessionKey);
            
            // 立即验证保存是否成功
            const saved = sessionStorage.getItem(sessionKey);
            if (!saved) {
                console.error('Token保存失败！');
                return false;
            }
            
            console.log('验证保存成功，数据长度:', saved.length);
            
            // 更新全局标签页状态
            this.updateGlobalTabStatus();

            // 触发登录事件
            window.dispatchEvent(new CustomEvent('sessionUserLogin', {
                detail: { user, tabId: this.tabId }
            }));

            return true;
        } catch (error) {
            console.error('登录过程出错:', error);
            return false;
        }
    }

    // 验证token有效性（不会自动登出）
    async validateToken() {
        const token = this.getCurrentToken();
        if (!token) return false;

        try {
            const response = await fetch('http://localhost:7001/user/userInfo', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                // Token有效，更新活跃状态
                this.updateTabActivity();
                return true;
            } else if (response.status === 401) {
                // 401表示未授权，token确实过期了
                console.log('Token已过期，需要重新登录');
                return false;
            } else {
                // 其他错误（如网络错误、服务器错误等）不应该导致自动登出
                console.warn('Token验证请求失败，但不一定是token过期:', response.status);
                return true; // 网络错误时假设token仍然有效
            }
        } catch (error) {
            console.error('Token验证网络错误:', error);
            // 网络错误不应该导致登出
            return true;
        }
    }

    // 安全的token验证方法，只在确认过期时才登出
    async validateAndLogoutIfExpired() {
        const token = this.getCurrentToken();
        if (!token) {
            this.logout();
            return false;
        }

        try {
            const response = await fetch('http://localhost:7001/user/userInfo', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                this.updateTabActivity();
                return true;
            } else if (response.status === 401) {
                // 只有在确认是401未授权时才登出
                console.log('Token已过期，自动登出');
                this.logout();
                return false;
            } else {
                // 其他错误不登出
                console.warn('Token验证失败，但不是认证错误:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Token验证网络错误:', error);
            return false;
        }
    }

    // 调试方法：检查token状态
    debugTokenInfo() {
        const token = this.getCurrentToken();
        const user = this.getCurrentUser();
        const tabId = this.getTabId();
        
        console.log('=== Token Debug Info ===');
        console.log('Tab ID:', tabId);
        console.log('Token exists:', !!token);
        console.log('Token length:', token ? token.length : 0);
        console.log('User exists:', !!user);
        console.log('User name:', user ? user.name : 'N/A');
        console.log('Is Logged In:', this.isLoggedIn());
        
        if (token) {
            try {
                // 解析token payload
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    console.log('Token payload:', payload);
                    console.log('Token issued at:', new Date(payload.iat * 1000));
                    console.log('Token expires at:', new Date(payload.exp * 1000));
                    console.log('Current time:', new Date());
                    console.log('Token expired:', payload.exp * 1000 < Date.now());
                }
            } catch (e) {
                console.log('Token parse error:', e);
            }
        }
        
        console.log('Session storage key:', `fitcamp_user_${tabId}`);
        console.log('Session storage value:', sessionStorage.getItem(`fitcamp_user_${tabId}`));
        console.log('========================');
    }

    // 获取当前标签页ID
    getTabId() {
        return this.tabId;
    }

    // ...保持现有的其他方法不变...
}

// 创建全局实例
const sessionUserManager = new SessionUserManager();

// 导出实例
export default sessionUserManager;
class SessionUserManager {
    constructor() {
        this.sessionPrefix = 'fitcamp_session_';
        this.userKey = `${this.sessionPrefix}user`;
        this.tokenKey = `${this.sessionPrefix}token`;
        this.tabIdKey = `${this.sessionPrefix}tabId`;
        this.globalTabsKey = 'fitcamp_global_tabs'; // 存储在 localStorage，用于跨标签页通信
        
        // 初始化标签页ID
        this.initializeTab();
    }

    // 初始化标签页
    initializeTab() {
        // 为当前标签页生成唯一ID
        let tabId = sessionStorage.getItem(this.tabIdKey);
        if (!tabId) {
            tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem(this.tabIdKey, tabId);
        }
        this.tabId = tabId;

        // 注册当前标签页到全局标签页列表
        this.registerTab();
        
        // 监听页面卸载，清理标签页信息
        window.addEventListener('beforeunload', () => {
            this.unregisterTab();
        });

        console.log(`标签页初始化完成，ID: ${this.tabId}`);
    }

    // 注册标签页到全局列表
    registerTab() {
        try {
            let globalTabs = this.getGlobalTabs();
            globalTabs[this.tabId] = {
                id: this.tabId,
                createTime: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                user: this.getCurrentUser(),
                isActive: true
            };
            localStorage.setItem(this.globalTabsKey, JSON.stringify(globalTabs));
        } catch (error) {
            console.error('注册标签页失败:', error);
        }
    }

    // 注销标签页
    unregisterTab() {
        try {
            let globalTabs = this.getGlobalTabs();
            delete globalTabs[this.tabId];
            localStorage.setItem(this.globalTabsKey, JSON.stringify(globalTabs));
        } catch (error) {
            console.error('注销标签页失败:', error);
        }
    }

    // 获取所有标签页信息
    getGlobalTabs() {
        try {
            const tabs = localStorage.getItem(this.globalTabsKey);
            return tabs ? JSON.parse(tabs) : {};
        } catch (error) {
            console.error('获取全局标签页信息失败:', error);
            return {};
        }
    }

    // 更新标签页活跃状态
    updateTabActivity() {
        try {
            let globalTabs = this.getGlobalTabs();
            if (globalTabs[this.tabId]) {
                globalTabs[this.tabId].lastActive = new Date().toISOString();
                globalTabs[this.tabId].user = this.getCurrentUser();
                localStorage.setItem(this.globalTabsKey, JSON.stringify(globalTabs));
            }
        } catch (error) {
            console.error('更新标签页活跃状态失败:', error);
        }
    }

    // 用户登录
    login(userData, token) {
        try {
            // 存储用户信息到当前标签页的 sessionStorage
            sessionStorage.setItem(this.userKey, JSON.stringify(userData));
            sessionStorage.setItem(this.tokenKey, token);

            // 更新全局标签页信息
            this.registerTab();

            // 触发自定义事件，通知应用状态变化
            window.dispatchEvent(new CustomEvent('sessionUserLogin', {
                detail: {
                    user: userData,
                    token: token,
                    tabId: this.tabId
                }
            }));

            console.log(`标签页 ${this.tabId} 用户登录成功:`, userData.name);
            return true;
        } catch (error) {
            console.error('登录失败:', error);
            return false;
        }
    }

    // 用户登出
    logout() {
        try {
            const user = this.getCurrentUser();
            
            // 清除当前标签页的用户信息
            sessionStorage.removeItem(this.userKey);
            sessionStorage.removeItem(this.tokenKey);

            // 更新全局标签页信息
            this.registerTab();

            // 触发登出事件
            window.dispatchEvent(new CustomEvent('sessionUserLogout', {
                detail: {
                    tabId: this.tabId,
                    user: user
                }
            }));

            console.log(`标签页 ${this.tabId} 用户登出`);
            return true;
        } catch (error) {
            console.error('登出失败:', error);
            return false;
        }
    }

    // 获取当前标签页用户
    getCurrentUser() {
        try {
            const userStr = sessionStorage.getItem(this.userKey);
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('获取当前用户失败:', error);
            return null;
        }
    }

    // 获取当前标签页token
    getCurrentToken() {
        try {
            return sessionStorage.getItem(this.tokenKey);
        } catch (error) {
            console.error('获取当前token失败:', error);
            return null;
        }
    }

    // 检查是否已登录
    isLoggedIn() {
        const user = this.getCurrentUser();
        const token = this.getCurrentToken();
        return !!(user && token);
    }

    // 获取当前标签页ID
    getTabId() {
        return this.tabId;
    }

    // 获取所有活跃标签页的登录状态
    getAllTabsStatus() {
        const globalTabs = this.getGlobalTabs();
        const now = new Date();
        const activeThreshold = 5 * 60 * 1000; // 5分钟内算活跃

        const tabsStatus = {
            totalTabs: 0,
            loggedInTabs: 0,
            activeTabs: 0,
            currentTab: this.tabId,
            tabs: []
        };

        Object.values(globalTabs).forEach(tab => {
            const lastActive = new Date(tab.lastActive);
            const isActive = (now - lastActive) < activeThreshold;
            
            if (isActive) {
                tabsStatus.totalTabs++;
                
                if (tab.user) {
                    tabsStatus.loggedInTabs++;
                }
                
                tabsStatus.activeTabs++;
                
                tabsStatus.tabs.push({
                    id: tab.id,
                    user: tab.user,
                    isLoggedIn: !!tab.user,
                    isCurrent: tab.id === this.tabId,
                    lastActive: tab.lastActive,
                    createTime: tab.createTime
                });
            }
        });

        return tabsStatus;
    }

    // 验证token有效性
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
                this.updateTabActivity();
                return true;
            } else {
                // Token无效，自动登出
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token验证失败:', error);
            return false;
        }
    }

    // 清理非活跃标签页
    cleanupInactiveTabs() {
        try {
            const globalTabs = this.getGlobalTabs();
            const now = new Date();
            const inactiveThreshold = 10 * 60 * 1000; // 10分钟未活跃算过期
            let hasChanges = false;

            Object.keys(globalTabs).forEach(tabId => {
                const tab = globalTabs[tabId];
                const lastActive = new Date(tab.lastActive);
                
                if ((now - lastActive) > inactiveThreshold && tabId !== this.tabId) {
                    delete globalTabs[tabId];
                    hasChanges = true;
                    console.log(`清理非活跃标签页: ${tabId}`);
                }
            });

            if (hasChanges) {
                localStorage.setItem(this.globalTabsKey, JSON.stringify(globalTabs));
            }
        } catch (error) {
            console.error('清理非活跃标签页失败:', error);
        }
    }

    // 获取登录统计信息
    getLoginStats() {
        const tabsStatus = this.getAllTabsStatus();
        const uniqueUsers = new Map();

        tabsStatus.tabs.forEach(tab => {
            if (tab.user) {
                uniqueUsers.set(tab.user.id, {
                    ...tab.user,
                    tabCount: (uniqueUsers.get(tab.user.id)?.tabCount || 0) + 1,
                    hasCurrentTab: tab.isCurrent || uniqueUsers.get(tab.user.id)?.hasCurrentTab
                });
            }
        });

        return {
            totalTabs: tabsStatus.totalTabs,
            loggedInTabs: tabsStatus.loggedInTabs,
            uniqueUsers: uniqueUsers.size,
            currentTabId: this.tabId,
            users: Array.from(uniqueUsers.values()),
            tabs: tabsStatus.tabs
        };
    }
}

// 创建全局实例
const sessionUserManager = new SessionUserManager();

// 定期更新活跃状态和清理
setInterval(() => {
    if (sessionUserManager.isLoggedIn()) {
        sessionUserManager.updateTabActivity();
    }
    sessionUserManager.cleanupInactiveTabs();
}, 30000); // 每30秒执行一次

// 页面可见性变化时更新活跃状态
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        sessionUserManager.updateTabActivity();
        sessionUserManager.validateToken();
    }
});

export default sessionUserManager;
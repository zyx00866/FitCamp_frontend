import { useState, useEffect } from 'react';
import sessionUserManager from './SessionUserManager';

function TabStatusIndicator() {
    const [loginStats, setLoginStats] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const updateStats = () => {
            setLoginStats(sessionUserManager.getLoginStats());
        };

        updateStats();

        // 监听状态变化
        const handleUserLogin = () => updateStats();
        const handleUserLogout = () => updateStats();
        const handleStorageChange = (e) => {
            if (e.key === 'fitcamp_global_tabs') {
                updateStats();
            }
        };

        window.addEventListener('sessionUserLogin', handleUserLogin);
        window.addEventListener('sessionUserLogout', handleUserLogout);
        window.addEventListener('storage', handleStorageChange);

        // 定期更新
        const interval = setInterval(updateStats, 5000);

        return () => {
            window.removeEventListener('sessionUserLogin', handleUserLogin);
            window.removeEventListener('sessionUserLogout', handleUserLogout);
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // 如果没有多个标签页，不显示指示器
    if (!loginStats || loginStats.totalTabs <= 1) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition duration-200 relative"
                title="查看多标签页状态"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {loginStats.totalTabs}
                </span>
            </button>

            {showDetails && (
                <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border p-4 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">多标签页状态</h3>
                        <button
                            onClick={() => setShowDetails(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* 统计信息 */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-center">
                                    <div className="font-medium text-blue-600">{loginStats.totalTabs}</div>
                                    <div className="text-gray-500 text-xs">活跃标签页</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-medium text-green-600">{loginStats.loggedInTabs}</div>
                                    <div className="text-gray-500 text-xs">已登录</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-medium text-purple-600">{loginStats.uniqueUsers}</div>
                                    <div className="text-gray-500 text-xs">独立用户</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-medium text-orange-600">{sessionUserManager.getTabId().slice(-4)}</div>
                                    <div className="text-gray-500 text-xs">当前标签页</div>
                                </div>
                            </div>
                        </div>

                        {/* 标签页列表 */}
                        <div className="space-y-2">
                            {loginStats.tabs.map(tab => (
                                <div key={tab.id} className={`border rounded-lg p-3 ${
                                    tab.isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                                tab.isLoggedIn ? 'bg-green-500' : 'bg-gray-400'
                                            }`}></div>
                                            <span className="text-sm font-medium">
                                                {tab.isCurrent ? '当前标签页' : `标签页 ${tab.id.slice(-4)}`}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {tab.isLoggedIn ? '已登录' : '未登录'}
                                        </span>
                                    </div>
                                    
                                    {tab.user && (
                                        <div className="text-xs text-gray-600 mb-1">
                                            用户: {tab.user.name} (@{tab.user.account})
                                        </div>
                                    )}
                                    
                                    <div className="text-xs text-gray-400">
                                        最后活跃: {new Date(tab.lastActive).toLocaleTimeString('zh-CN')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-500">
                            每个标签页可以独立登录不同用户
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TabStatusIndicator;
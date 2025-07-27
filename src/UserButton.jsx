import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionUserManager from './SessionUserManager';

function UserButton() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userAvatar, setUserAvatar] = useState('/userbutton.svg'); // 默认头像
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // 检查登录状态并获取用户信息
    useEffect(() => {
        const checkLoginStatus = async () => {
            // 使用 sessionUserManager 获取 token 和用户信息
            const token = sessionUserManager.getCurrentToken();
            const user = sessionUserManager.getCurrentUser();
            
            console.log('UserButton 检查登录状态:', {
                tabId: sessionUserManager.getTabId(),
                hasToken: !!token,
                hasUser: !!user,
                userName: user?.name
            });
            
            if (!token || !user) {
                // 未登录状态
                setIsLoggedIn(false);
                setUserAvatar('/userbutton.svg');
                setUserName('');
                setIsLoading(false);
                return;
            }

            // 有本地用户信息，先显示
            setIsLoggedIn(true);
            setUserName(user.name || '');
            setUserAvatar(user.avatar || '/userbutton.svg');

            try {
                // 验证token并获取最新用户信息
                const response = await fetch('http://localhost:7001/user/userInfo', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                console.log('UserButton token验证响应:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('UserButton 获取到最新用户信息:', data);
                    
                    if (data.success && data.data) {
                        // 登录状态有效，更新用户信息
                        setIsLoggedIn(true);
                        setUserName(data.data.name || '');
                        setUserAvatar(data.data.avatar || '/userbutton.svg');
                        
                        // 更新活跃状态
                        sessionUserManager.updateTabActivity();
                        
                        console.log('UserButton 用户信息更新完成:', {
                            name: data.data.name,
                            avatar: data.data.avatar
                        });
                    } else {
                        // token无效，但响应成功 - 数据格式问题
                        console.warn('UserButton 用户信息格式异常');
                        handleLogout();
                    }
                } else if (response.status === 401) {
                    // token过期，自动登出
                    console.log('UserButton token已过期，自动登出');
                    handleLogout();
                } else {
                    // 其他API错误，保持当前登录状态
                    console.warn('UserButton API请求失败:', response.status, '但保持登录状态');
                }
            } catch (error) {
                console.error('UserButton 获取用户信息错误:', error);
                // 网络错误，保持当前登录状态
                console.log('UserButton 网络错误，保持当前登录状态');
            } finally {
                setIsLoading(false);
            }
        };

        checkLoginStatus();

        // 监听登录状态变化事件
        const handleUserLogin = (event) => {
            console.log('UserButton 收到登录事件:', event.detail);
            const { user } = event.detail;
            setIsLoggedIn(true);
            setUserName(user?.name || '');
            setUserAvatar(user?.avatar || '/userbutton.svg');
            setIsLoading(false);
        };

        const handleUserLogout = (event) => {
            console.log('UserButton 收到登出事件:', event.detail);
            setIsLoggedIn(false);
            setUserName('');
            setUserAvatar('/userbutton.svg');
            setIsLoading(false);
        };

        // 添加事件监听器
        window.addEventListener('sessionUserLogin', handleUserLogin);
        window.addEventListener('sessionUserLogout', handleUserLogout);

        return () => {
            // 清理事件监听器
            window.removeEventListener('sessionUserLogin', handleUserLogin);
            window.removeEventListener('sessionUserLogout', handleUserLogout);
        };
    }, []);

    // 处理登出 - 使用 sessionUserManager
    const handleLogout = () => {
        console.log('UserButton 执行登出操作');
        sessionUserManager.logout();
        setIsLoggedIn(false);
        setUserName('');
        setUserAvatar('/userbutton.svg');
    };

    // 处理按钮点击
    const handleClick = () => {
        console.log('UserButton 被点击:', { isLoggedIn, userName });
        
        if (isLoggedIn) {
            // 已登录，跳转到用户页面
            navigate('/userpage');
        } else {
            // 未登录，跳转到登录页面
            navigate('/loginpage');
        }
    };

    // 右键菜单处理（可选功能）
    const handleRightClick = (e) => {
        if (!isLoggedIn) return;
        
        e.preventDefault();
        const confirmed = window.confirm(`确定要登出用户 "${userName}" 吗？`);
        if (confirmed) {
            handleLogout();
        }
    };

    // 加载状态
    if (isLoading) {
        return (
            <button 
                className="absolute flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 animate-pulse shadow-md right-4 top-4"
                disabled
                title="加载中..."
            >
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            </button>
        );
    }


    return (
        <div className="absolute right-4 top-4">

            <button
                onClick={handleClick}
                onContextMenu={handleRightClick}
                className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-gray-100 transition duration-200 group shadow-md bg-white bg-opacity-80 relative"
                title={isLoggedIn ? `${userName} - 个人中心 (右键登出)` : '登录'}
            >
                <img
                    src={userAvatar}
                    alt={isLoggedIn ? `${userName}的头像` : '登录'}
                    className="w-7 h-7 rounded-full object-cover"
                    onError={(e) => {
                        // 头像加载失败时使用默认头像
                        console.log('UserButton 头像加载失败，使用默认头像');
                        e.target.src = '/userbutton.svg';
                    }}
                />
                
                {/* 登录状态指示器 */}
                {isLoggedIn && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}

                {/* 悬停时显示用户名（如果已登录） */}
                {isLoggedIn && userName && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        {userName}
                    </div>
                )}
            </button>
        </div>
    );
}

export default UserButton;
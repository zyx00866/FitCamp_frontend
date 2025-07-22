import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function UserButton() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userAvatar, setUserAvatar] = useState('/userbutton.svg'); // 默认头像
    const [isLoading, setIsLoading] = useState(true);

    // 检查登录状态并获取用户信息
    useEffect(() => {
        const checkLoginStatus = async () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                // 未登录状态
                setIsLoggedIn(false);
                setUserAvatar('/userbutton.svg');
                setIsLoading(false);
                return;
            }

            try {
                // 验证token并获取用户信息
                const response = await fetch('http://localhost:7001/user/userInfo', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('用户信息:', data);
                    
                    if (data.success && data.data) {
                        // 登录状态有效
                        setIsLoggedIn(true);
                        // 使用用户头像，如果没有则使用默认头像
                        setUserAvatar(data.data.avatar || '/userbutton.svg');
                        
                        // 更新localStorage中的用户信息
                        localStorage.setItem('user', JSON.stringify(data.data));
                    } else {
                        // token无效，清除登录状态
                        handleLogout();
                    }
                } else {
                    // API请求失败，token可能过期
                    console.error('获取用户信息失败:', response.status);
                    handleLogout();
                }
            } catch (error) {
                console.error('获取用户信息错误:', error);
                // 网络错误，但token存在，保持登录状态但使用默认头像
                setIsLoggedIn(true);
                setUserAvatar('/userbutton.svg');
            } finally {
                setIsLoading(false);
            }
        };

        checkLoginStatus();
    }, []);

    // 处理登出
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUserAvatar('/userbutton.svg');
    };

    // 处理按钮点击
    const handleClick = () => {
        if (isLoggedIn) {
            // 已登录，跳转到用户页面
            navigate('/userpage');
        } else {
            // 未登录，跳转到登录页面
            navigate('/loginpage');
        }
    };

    // 加载状态
    if (isLoading) {
        return (
            <button 
                className="absolute flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 animate-pulse shadow-md right-4 top-4"
                disabled
            >
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className="absolute flex items-center justify-center w-12 h-12 rounded-full hover:bg-gray-100 transition duration-200 group shadow-md bg-white bg-opacity-80 right-4 top-4"
            title={isLoggedIn ? '个人中心' : '登录'}
        >
            <img
                src={userAvatar}
                alt={isLoggedIn ? '用户头像' : '登录'}
                className="w-7 h-7 rounded-full object-cover"
                onError={(e) => {
                    // 头像加载失败时使用默认头像
                    e.target.src = '/userbutton.svg';
                }}
            />
            
            {/* 登录状态指示器 */}
            {isLoggedIn && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}

        </button>
    );
}

export default UserButton;
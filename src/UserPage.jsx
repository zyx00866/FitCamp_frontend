import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionUserManager from './SessionUserManager';

function UserPage() {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [editedUserData, setEditedUserData] = useState({
        name: '',
        profile: ''
    });
    
    // 用户数据
    const [userData, setUserData] = useState(null);
    
    // 新增：密码确认模态框状态
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');

    // 获取用户信息 - 修复验证逻辑
    useEffect(() => {
        const fetchUserInfo = async () => {
            // 使用 sessionUserManager 获取 token 和用户信息
            const token = sessionUserManager.getCurrentToken();
            const currentUser = sessionUserManager.getCurrentUser();
            
            if (!token || !currentUser) {
                setError('未登录，请先登录');
                navigate('/loginpage');
                return;
            }

            try {
                setIsLoading(true);
                
                // 直接请求用户信息，不使用 validateToken
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
                        setUserData(data.data);
                        setError('');
                        
                        // 请求成功后更新活跃状态
                        sessionUserManager.updateTabActivity();
                    } else {
                        setError(data.message || '获取用户信息失败');
                    }
                } else if (response.status === 401) {
                    // 只有在401时才认为是token过期
                    console.log('Token已过期');
                    sessionUserManager.logout();
                    setError('登录已过期，请重新登录');
                    navigate('/loginpage');
                } else {
                    // 其他错误
                    setError(`获取用户信息失败: ${response.status}`);
                }
            } catch (error) {
                console.error('获取用户信息错误:', error);
                setError('网络连接失败，请稍后重试');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserInfo();

        // 监听当前标签页的登录状态变化
        const handleUserLogin = () => {
            fetchUserInfo();
        };

        const handleUserLogout = () => {
            navigate('/loginpage');
        };

        window.addEventListener('sessionUserLogin', handleUserLogin);
        window.addEventListener('sessionUserLogout', handleUserLogout);
        
        return () => {
            window.removeEventListener('sessionUserLogin', handleUserLogin);
            window.removeEventListener('sessionUserLogout', handleUserLogout);
        };
    }, [navigate]);

    const handleBack = () => {
        navigate('/');
    };

    // 退出登录功能 - 修改为使用 sessionUserManager
    const handleLogout = () => {
        // 确认对话框
        if (window.confirm('确定要退出登录吗？')) {
            // 使用 sessionUserManager 登出
            sessionUserManager.logout();
            
            // 跳转到首页
            navigate('/');
        }
    };

    const handleEditProfile = () => {
        if (userData) {
            setEditedUserData({
                name: userData.name,
                profile: userData.profile
            });
            setIsEditing(true);
        }
    };

    const handleSaveProfile = async () => {
        // 简单的验证
        if (!editedUserData.name.trim()) {
            alert('用户名不能为空');
            return;
        }

        const token = sessionUserManager.getCurrentToken();
        
        try {
            const response = await fetch('http://localhost:7001/user/Profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: userData.id,
                    name: editedUserData.name,
                    profile: editedUserData.profile
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // 更新本地用户数据
                    setUserData({
                        ...userData,
                        name: editedUserData.name,
                        profile: editedUserData.profile
                    });
                    setIsEditing(false);
                    alert('资料更新成功');
                } else {
                    alert(data.message || '更新失败');
                }
            } else {
                alert('更新失败，请稍后重试');
            }
        } catch (error) {
            console.error('更新资料错误:', error);
            alert('网络连接失败，请稍后重试');
        }
    };

    const handleCancelEdit = () => {
        setEditedUserData({
            name: '',
            profile: ''
        });
        setIsEditing(false);
    };

    const handleInputChange = (field, value) => {
        setEditedUserData({
            ...editedUserData,
            [field]: value
        });
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const token = sessionUserManager.getCurrentToken();
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        // 验证文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
            alert('图片大小不能超过10MB');
            return;
        }

        try {
            //上传图片
            console.log('开始上传图片...');
            
            const formData = new FormData();
            formData.append('files', file);
            formData.append('category', 'avatar'); // 指定图片种类为avatar
            
            const uploadResponse = await fetch('http://localhost:7001/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error(`图片上传失败: ${uploadResponse.status}`);
            }

            const uploadData = await uploadResponse.json();
            console.log('图片上传响应:', uploadData);

            if (!uploadData.success || !uploadData.data?.url) {
                throw new Error(uploadData.message || '图片上传失败，未返回URL');
            }

            const imageUrl = uploadData.data.url;
            console.log('获取到图片URL:', imageUrl);

            // 解析token获取用户ID
            let userId;
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    userId = payload.id || payload.userId || payload.user_id || payload.sub;
                    console.log('从token中提取的用户ID:', userId);
                }
            } catch (e) {
                console.error('Token解析失败:', e);
            }

            if (!userId) {
                throw new Error('无法从token中获取用户ID');
            }

            // 更新用户头像
            console.log('开始更新用户头像...');
            
            const updateResponse = await fetch('http://localhost:7001/user/Avatar', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: userId,
                    avatar: imageUrl
                })
            });

            if (!updateResponse.ok) {
                throw new Error(`头像更新失败: ${updateResponse.status}`);
            }

            const updateData = await updateResponse.json();
            console.log('头像更新响应:', updateData);

            if (updateData.success) {
                // 更新本地用户数据
                setUserData({
                    ...userData,
                    avatar: imageUrl // 使用返回的图片URL
                });
                alert('头像更新成功');
            } else {
                throw new Error(updateData.message || '头像更新失败');
            }

        } catch (error) {
            console.error('头像上传错误:', error);
            alert(error.message || '头像上传失败，请稍后重试');
        }
    };

    // 格式化注册时间
    const formatDate = (dateString) => {
        if (!dateString) return "未知";
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return error.message || "日期格式错误";
        }
    };

    // 格式化日期时间
    const formatDateTime = (dateString) => {
        if (!dateString) return "时间待定";
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return error.message || "时间格式错误";
        }
    };

    // 跳转到活动详情页面
    const handleViewActivityDetail = (activityId) => {
        navigate(`/activitydetail?id=${activityId}`);
    };

    // 取消报名功能
    const handleCancelEnroll = async (activityId, activityTitle) => {
        if (!window.confirm(`确定要取消报名 "${activityTitle}" 吗？`)) {
            return;
        }

        const token = sessionUserManager.getCurrentToken();
        
        try {
            const response = await fetch('http://localhost:7001/activity/leave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: userData.id,
                    activityId: String(activityId)
                })
            });

            if (!response.ok) {
                throw new Error(`取消报名失败: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // 重新获取用户信息以更新活动列表
                window.location.reload();
            } else {
                throw new Error(data.message || '取消报名失败');
            }

        } catch (error) {
            console.error('取消报名错误:', error);
            alert(error.message || '取消报名失败，请稍后重试');
        }
    };

    // 获取活动类型颜色
    const getActivityTypeColor = (type) => {
        const colorMap = {
            '健身': 'bg-blue-100 text-blue-600',
            '游泳': 'bg-cyan-100 text-cyan-600',
            '跑步': 'bg-green-100 text-green-600',
            '舞蹈': 'bg-pink-100 text-pink-600',
            '足球': 'bg-yellow-100 text-yellow-600',
            '羽毛球': 'bg-purple-100 text-purple-600',
            '篮球': 'bg-orange-100 text-orange-600',
            '其它': 'bg-gray-100 text-gray-600'
        };
        return colorMap[type] || 'bg-gray-100 text-gray-600';
    };

    // 获取活动状态
    const getActivityStatus = (activity) => {
        const now = new Date();
        const activityDate = new Date(activity.date);
        
        if (activity.status === 0) {
            return { text: '已结束', class: 'bg-gray-100 text-gray-600' };
        } else if (activityDate < now) {
            return { text: '已完成', class: 'bg-green-100 text-green-600' };
        } else {
            return { text: '进行中', class: 'bg-blue-100 text-blue-600' };
        }
    };

    // 修改统计数据计算函数
    const getStatistics = () => {
        if (!userData) return { 
            totalActivities: 0, 
            completedActivities: 0, 
            favoriteActivities: 0, 
            createdActivities: 0 
        };
        
        return {
            totalActivities: userData.activities ? userData.activities.length : 0,
            completedActivities: userData.activities ? userData.activities.filter(activity => {
                const activityDate = new Date(activity.date);
                return activityDate < new Date() || activity.status === 0;
            }).length : 0,
            favoriteActivities: userData.favoriteActivities ? userData.favoriteActivities.length : 0,
            createdActivities: userData.createdActivities ? userData.createdActivities.length : 0
        };
    };

    // 获取当前登录统计（用于显示多标签页信息）
    const loginStats = sessionUserManager.getLoginStats();

    // 加载状态
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在加载用户信息...</p>
                    {loginStats && loginStats.totalTabs > 1 && (
                        <p className="text-xs text-gray-500 mt-2">
                            标签页: {sessionUserManager.getTabId().slice(-6)} | 
                            活跃标签页: {loginStats.totalTabs}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // 错误状态
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">{error}</div>
                    <button
                        onClick={() => navigate('/loginpage')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                    >
                        去登录
                    </button>
                </div>
            </div>
        );
    }

    // 用户数据不存在
    if (!userData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">未找到用户信息</p>
                </div>
            </div>
        );
    }
  // 注销用户功能
    const handleDeleteAccount = async () => {
        // 第一步：基本确认
        const firstConfirm = window.confirm(
            '⚠️ 警告：此操作将永久删除您的账户和所有相关数据！\n\n确定要继续吗？'
        );
        
        if (!firstConfirm) return;
        
        // 第二步：详细确认
        const secondConfirm = window.confirm(
            '最后确认：删除账户后无法恢复，您将失去：\n' +
            '• 所有个人资料和头像\n' +
            '• 参与的活动记录\n' +
            '• 收藏的活动\n' +
            '• 创建的活动\n\n' +
            '确定要永久删除账户吗？'
        );
        
        if (!secondConfirm) return;

        // 第三步：显示密码输入模态框
        setShowPasswordModal(true);
    };

    // 执行删除操作
    const executeAccountDeletion = async () => {
        if (!deletePassword.trim()) {
            alert('请输入密码');
            return;
        }

        const token = sessionUserManager.getCurrentToken();
        
        try {
            setIsLoading(true);
            
            console.log('正在注销用户账户...');
            
            const response = await fetch('http://localhost:7001/user/unregister', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userData.id,
                    password: deletePassword.trim()
                })
            });

            console.log('注销用户响应状态:', response.status);

            if (response.status === 401) {
                alert('登录已过期，请重新登录');
                sessionUserManager.logout();
                navigate('/loginpage');
                return;
            }

            if (response.status === 400) {
                const errorData = await response.json();
                if (errorData.message && errorData.message.includes('密码')) {
                    alert('密码错误！请确认您输入的密码正确。');
                } else {
                    alert(errorData.message || '删除失败，请检查输入信息');
                }
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `注销失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('注销用户响应数据:', data);

            if (data.success) {
                // 关闭模态框
                setShowPasswordModal(false);
                setDeletePassword('');
                
                // 注销成功
                alert('账户已成功删除。感谢您使用 FitCamp！');
                
                // 使用 sessionUserManager 登出
                sessionUserManager.logout();
                
                // 跳转到首页
                navigate('/');
            } else {
                if (data.message && data.message.includes('密码')) {
                    alert('密码错误！');
                } else {
                    throw new Error(data.message || '注销失败');
                }
            }

        } catch (error) {
            console.error('注销用户错误:', error);
            if (error.message.includes('密码')) {
                alert('密码验证失败');
            } else {
                alert(error.message || '注销失败，请稍后重试');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 取消密码确认模态框
    const handleCancelPasswordModal = () => {
        setShowPasswordModal(false);
        setDeletePassword('');
    };

    const statistics = getStatistics();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 头部导航 */}
            <div className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleBack}
                            className="flex items-center text-gray-600 hover:text-gray-800 transition duration-200"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            返回首页
                        </button>
                        
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-800">个人中心</h1>
                        </div>
                        
                        {/* 右侧按钮组 */}
                        <div className="flex items-center space-x-3">
                            
                            {/* 退出登录按钮 */}
                            <button
                                onClick={handleLogout}
                                disabled={isLoading}
                                className={`flex items-center text-red-600 hover:text-red-800 transition duration-200 ${
                                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                {isLoading ? '处理中...' : '退出登录'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 主要内容区域 */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 左侧 - 用户信息卡片 */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                            {/* 用户头像 */}
                            <div className="text-center mb-6">
                                <div className="relative inline-block">
                                    <img
                                        src={userData.avatar || '/userbutton.svg'}
                                        alt={userData.name}
                                        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                                    />
                                    <label className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition duration-200">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </label>
                                </div>
                                
                                {/* 用户名显示/编辑 */}
                                {!isEditing && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{userData.name}</h2>
                                        <p className="text-sm text-gray-500 mb-2">@{userData.account}</p>
                                        <button
                                            onClick={handleEditProfile}
                                            className="text-blue-500 hover:text-blue-700 text-sm transition duration-200"
                                        >
                                            编辑资料
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 用户基本信息 */}
                            {isEditing ? (
                                <div className="space-y-4 mb-6">
                                    {/* 编辑用户名 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                                        <input
                                            type="text"
                                            value={editedUserData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                            placeholder="请输入用户名"
                                        />
                                    </div>
                                    
                                    {/* 编辑个人简介 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                                        <textarea
                                            value={editedUserData.profile}
                                            onChange={(e) => handleInputChange('profile', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                                            placeholder="介绍一下你自己..."
                                            rows="4"
                                        />
                                    </div>
                                    
                                    {/* 保存和取消按钮 */}
                                    <div className="flex space-x-2 pt-2">
                                        <button
                                            onClick={handleSaveProfile}
                                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                                        >
                                            保存
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 mb-6">
                                    {/* 个人简介 */}
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center mb-2">
                                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-medium text-gray-700">个人简介</span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {userData.profile || "这个用户很懒，还没有写个人简介..."}
                                        </p>
                                    </div>
                                    
                                    {/* 注册时间 */}
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm">注册时间: {formatDate(userData.registerTime)}</span>
                                    </div>
                                </div>
                            )}

                            {/* 统计数据和操作按钮 */}
                            {!isEditing && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{statistics.totalActivities}</div>
                                            <div className="text-sm text-gray-600">参与活动</div>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{statistics.completedActivities}</div>
                                            <div className="text-sm text-gray-600">已完成</div>
                                        </div>
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">{statistics.favoriteActivities}</div>
                                            <div className="text-sm text-gray-600">收藏活动</div>
                                        </div>
                                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">{statistics.createdActivities}</div>
                                            <div className="text-sm text-gray-600">创建活动</div>
                                        </div>
                                    </div>

                                    {/* 快捷操作按钮 */}
                                    <div className="pt-4 border-t border-gray-200 space-y-3">
                                        <button
                                            onClick={() => navigate('/createactivity')}
                                            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition duration-200 shadow-md"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                            创建新活动
                                        </button>
                                        
                                        {/* 管理创建的活动按钮 */}
                                        <button
                                            onClick={() => navigate('/managecreatedactivity')}
                                            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition duration-200 shadow-md"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h5.586a1 1 0 00.707-.293l5.414-5.414a1 1 0 00.293-.707V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                            管理我的活动
                                        </button>
                                        
                                        {/* 危险操作区域 */}
                                        <div className="pt-3 border-t border-gray-200">
                                            <p className="text-xs text-gray-500 mb-2 text-center">危险操作</p>
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={isLoading}
                                                className={`w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 text-sm ${
                                                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                                title="永久删除账户和所有相关数据"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                {isLoading ? '处理中...' : '注销账户'}
                                            </button>
                                            <p className="text-xs text-gray-400 mt-1 text-center">
                                                此操作不可恢复
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右侧 - 活动列表 */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-800">我的活动</h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => navigate('/')}
                                        className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                                    >
                                        发现更多活动
                                    </button>
                                </div>
                            </div>
                            
                            {/* 活动列表 */}
                            <div className="space-y-4">
                                {userData.activities && userData.activities.length > 0 ? (
                                    userData.activities.map((activity) => {
                                        const status = getActivityStatus(activity);
                                        const currentParticipants = activity.participants ? activity.participants.length : 0;
                                        
                                        return (
                                            <div 
                                                key={activity.id} 
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200 cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleViewActivityDetail(activity.id)}
                                                title="点击查看活动详情"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        {/* 活动标题和状态 */}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center flex-wrap gap-2">
                                                                <h4 className="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors">
                                                                    {activity.title}
                                                                </h4>
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                                                                    {activity.type}
                                                                </span>
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                                                                    {status.text}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* 活动详细信息 */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                                                            {/* 时间 */}
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="truncate">{formatDateTime(activity.date)}</span>
                                                            </div>
                                                            
                                                            {/* 地点 */}
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="truncate" title={activity.location}>
                                                                    {activity.location}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* 参与人数 */}
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 005 5v1H1v-1a5 5 0 015-5z" />
                                                                </svg>
                                                                <span>
                                                                    {currentParticipants}/{activity.participantsLimit}人
                                                                    {currentParticipants >= activity.participantsLimit && (
                                                                        <span className="text-red-500 ml-1">(已满)</span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* 组织者 */}
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="truncate" title={activity.organizerName}>
                                                                    组织者: {activity.organizerName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* 右侧操作区域 */}
                                                    <div className="flex flex-col items-end space-y-3 ml-4">
                                                        {/* 费用 */}
                                                        <div className="text-right">
                                                            <div className={`text-lg font-semibold ${
                                                                activity.fee === 0 ? 'text-green-600' : 'text-blue-600'
                                                            }`}>
                                                                {activity.fee === 0 ? '免费' : `¥${activity.fee}`}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* 取消报名按钮 - 只有活动未结束时才显示 */}
                                                        {status.text !== '已结束' && status.text !== '已完成' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击
                                                                    handleCancelEnroll(activity.id, activity.title);
                                                                }}
                                                                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 text-sm whitespace-nowrap z-10 relative"
                                                            >
                                                                取消报名
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-gray-500 mb-4">还没有参加任何活动</p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <button
                                                onClick={() => navigate('/')}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                                            >
                                                去发现活动
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 收藏的活动 */}
                            {userData.favoriteActivities && userData.favoriteActivities.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">我的收藏</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userData.favoriteActivities.map((activity) => (
                                            <div 
                                                key={activity.id} 
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200 cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleViewActivityDetail(activity.id)}
                                                title="点击查看活动详情"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-md font-medium text-gray-800 hover:text-blue-600 transition-colors line-clamp-2">
                                                        {activity.title}
                                                    </h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                                                        {activity.type}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-1 text-sm text-gray-600 mb-3">
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="truncate">{formatDateTime(activity.date)}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="truncate">{activity.location}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-sm font-semibold ${
                                                        activity.fee === 0 ? 'text-green-600' : 'text-blue-600'
                                                    }`}>
                                                        {activity.fee === 0 ? '免费' : `¥${activity.fee}`}
                                                    </span>
                                                    <div className="text-xs text-gray-400">
                                                        点击查看详情
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 密码确认模态框 */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="text-center mb-4">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                确认删除账户
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                为了安全起见，请输入您的登录密码来确认删除账户
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                登录密码
                            </label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="请输入您的登录密码"
                                autoComplete="current-password"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && deletePassword.trim()) {
                                        executeAccountDeletion();
                                    }
                                    if (e.key === 'Escape') {
                                        handleCancelPasswordModal();
                                    }
                                }}
                                autoFocus
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={handleCancelPasswordModal}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-200"
                                disabled={isLoading}
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={executeAccountDeletion}
                                disabled={isLoading || !deletePassword.trim()}
                                className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-200 ${
                                    (isLoading || !deletePassword.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isLoading ? '删除中...' : '确认删除'}
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center mt-3">
                            ⚠️ 此操作不可恢复，请谨慎操作
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserPage;
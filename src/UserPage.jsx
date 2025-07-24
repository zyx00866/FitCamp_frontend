import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

    // 获取用户信息
    useEffect(() => {
        const fetchUserInfo = async () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('未登录，请先登录');
                navigate('/loginpage');
                return;
            }

            try {
                setIsLoading(true);
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
                    } else {
                        setError(data.message || '获取用户信息失败');
                    }
                } else {
                    // token可能过期
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setError('登录已过期，请重新登录');
                    navigate('/loginpage');
                }
            } catch (error) {
                console.error('获取用户信息错误:', error);
                setError('网络连接失败，请稍后重试');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserInfo();
    }, [navigate]);

    const handleBack = () => {
        navigate('/');
    };

    // 退出登录功能
    const handleLogout = () => {
        // 确认对话框
        if (window.confirm('确定要退出登录吗？')) {
            // 清除本地存储的用户信息和token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
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

        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('http://localhost:7001/user/updateProfile', {
                method: 'POST',
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

        const token = localStorage.getItem('token');
        
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
            
            const uploadResponse = await fetch('http://localhost:7001/upload/image', {
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
            
            const updateResponse = await fetch('http://localhost:7001/user/updateAvatar', {
                method: 'POST',
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
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // 计算统计数据
    const getStatistics = () => {
        if (!userData) return { totalActivities: 0, completedActivities: 0, favoriteActivities: 0 };
        
        return {
            totalActivities: userData.activities ? userData.activities.length : 0,
            completedActivities: userData.activities ? userData.activities.filter(activity => 
                new Date(activity.endTime) < new Date()
            ).length : 0,
            favoriteActivities: userData.favoriteActivities ? userData.favoriteActivities.length : 0
        };
    };

    // 加载状态
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在加载用户信息...</p>
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
                        <h1 className="text-2xl font-bold text-gray-800">个人中心</h1>
                        
                        {/* 退出登录按钮 */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-red-600 hover:text-red-800 transition duration-200"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            退出登录
                        </button>
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

                            {/* 统计数据 */}
                            {!isEditing && (
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
                                        <div className="text-2xl font-bold text-orange-600">{userData.comments ? userData.comments.length : 0}</div>
                                        <div className="text-sm text-gray-600">评论数</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右侧 - 活动列表 */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-6">我的活动</h3>
                            
                            {/* 活动列表 */}
                            <div className="space-y-4">
                                {userData.activities && userData.activities.length > 0 ? (
                                    userData.activities.map((activity) => (
                                        <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <h4 className="text-lg font-medium text-gray-800 mr-3">{activity.title}</h4>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            new Date(activity.endTime) < new Date() 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {new Date(activity.endTime) < new Date() ? '已完成' : '进行中'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                                                        <div className="flex items-center">
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                            </svg>
                                                            {formatDate(activity.startTime)}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                            </svg>
                                                            {new Date(activity.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                            </svg>
                                                            {activity.location}
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="text-sm text-gray-600">{activity.description}</p>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <div className="text-lg font-semibold text-green-600 mb-2">¥{activity.fee}</div>
                                                    {new Date(activity.endTime) >= new Date() && (
                                                        <button className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 text-sm">
                                                            取消报名
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-gray-500">还没有参加任何活动</p>
                                        <button
                                            onClick={() => navigate('/')}
                                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                                        >
                                            去发现活动
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserPage;
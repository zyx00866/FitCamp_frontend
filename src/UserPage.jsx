import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function UserPage() {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [editedUserData, setEditedUserData] = useState({
        username: '',
        bio: ''
    });
    
    // 模拟用户数据
    const [userData, setUserData] = useState({
        id: 1,
        username: "张运动爱好者",
        avatar: "https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=张",
        bio: "热爱运动，享受健康生活。喜欢瑜伽、游泳和各种健身活动，希望能在运动中找到生活的乐趣和平衡。",
        joinDate: "2024-01-15",
        totalActivities: 25,
        completedActivities: 20,
        upcomingActivities: 5,
        favoriteActivities: 12
    });

    // 参与的活动列表
    const [activities, setActivities] = useState([
        {
            id: 1,
            name: "晨间瑜伽课程",
            date: "2024-07-15",
            time: "08:00",
            status: "upcoming", // upcoming, completed, cancelled
            location: "健身房A区",
            fee: 50
        },
        {
            id: 2,
            name: "游泳训练班",
            date: "2024-07-12",
            time: "19:00",
            status: "completed",
            location: "游泳馆",
            fee: 80
        },
        {
            id: 3,
            name: "拳击基础课",
            date: "2024-07-10",
            time: "20:00",
            status: "completed",
            location: "拳击馆",
            fee: 120
        },
        {
            id: 4,
            name: "舞蹈体验课",
            date: "2024-07-20",
            time: "15:00",
            status: "upcoming",
            location: "舞蹈室B",
            fee: 60
        }
    ]);

    const handleBack = () => {
        navigate('/');
    };

    const handleEditProfile = () => {
        setEditedUserData({
            username: userData.username,
            bio: userData.bio
        });
        setIsEditing(true);
    };

    const handleSaveProfile = () => {
        // 简单的验证
        if (!editedUserData.username.trim()) {
            alert('用户名不能为空');
            return;
        }

        setUserData({
            ...userData,
            username: editedUserData.username,
            bio: editedUserData.bio
        });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedUserData({
            username: '',
            bio: ''
        });
        setIsEditing(false);
    };

    const handleInputChange = (field, value) => {
        setEditedUserData({
            ...editedUserData,
            [field]: value
        });
    };

    const handleAvatarUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUserData({
                    ...userData,
                    avatar: e.target.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'upcoming':
                return '即将开始';
            case 'completed':
                return '已完成';
            case 'cancelled':
                return '已取消';
            default:
                return '未知';
        }
    };

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
                        <div className="w-20"></div>
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
                                        src={userData.avatar}
                                        alt={userData.username}
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
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{userData.username}</h2>
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
                                            value={editedUserData.username}
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                            placeholder="请输入用户名"
                                        />
                                    </div>
                                    
                                    {/* 编辑个人简介 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                                        <textarea
                                            value={editedUserData.bio}
                                            onChange={(e) => handleInputChange('bio', e.target.value)}
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
                                            {userData.bio || "这个人很懒，还没有写个人简介..."}
                                        </p>
                                    </div>
                                    
                                    {/* 加入时间 */}
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm">加入时间: {userData.joinDate}</span>
                                    </div>
                                </div>
                            )}

                            {/* 统计数据 */}
                            {!isEditing && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{userData.totalActivities}</div>
                                        <div className="text-sm text-gray-600">总参与活动</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{userData.completedActivities}</div>
                                        <div className="text-sm text-gray-600">已完成活动</div>
                                    </div>
                                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                                        <div className="text-2xl font-bold text-orange-600">{userData.upcomingActivities}</div>
                                        <div className="text-sm text-gray-600">即将参与</div>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">{userData.favoriteActivities}</div>
                                        <div className="text-sm text-gray-600">收藏活动</div>
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
                                {activities.map((activity) => (
                                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center mb-2">
                                                    <h4 className="text-lg font-medium text-gray-800 mr-3">{activity.name}</h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                                                        {getStatusText(activity.status)}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                        </svg>
                                                        {activity.date}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                        </svg>
                                                        {activity.time}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                        </svg>
                                                        {activity.location}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <div className="text-lg font-semibold text-green-600 mb-2">¥{activity.fee}</div>
                                                {activity.status === 'upcoming' && (
                                                    <button className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 text-sm">
                                                        取消报名
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserPage;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionUserManager from './SessionUserManager';

function ManageActivityPage() {
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, past
    const [userInfo, setUserInfo] = useState(null); // 新增：用户信息状态
    const [showEditModal, setShowEditModal] = useState(false);
    const [editActivityData, setEditActivityData] = useState(null);
    const [editImageFiles, setEditImageFiles] = useState([]);
    const [editImageUploading, setEditImageUploading] = useState(false);

    // 获取当前用户信息和创建的活动列表
    const fetchUserInfoAndActivities = async () => {
        const user = sessionUserManager.getCurrentUser();
        const token = sessionUserManager.getCurrentToken();
        
        if (!user || !token) {
            navigate('/loginpage');
            return;
        }
        
        try {
            setIsLoading(true);
            setError('');
            
            console.log('正在获取用户信息和创建的活动列表...');
            
            const response = await fetch(`http://localhost:7001/user/userInfo`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('用户信息响应状态:', response.status);
            
            if (response.status === 401) {
                alert('登录已过期，请重新登录');
                sessionUserManager.logout();
                navigate('/loginpage');
                return;
            }
            
            if (!response.ok) {
                throw new Error(`获取用户信息失败: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('用户信息响应数据:', data);
            
            if (data.success) {
                const userData = data.data;
                setUserInfo(userData);
                
                // 从用户信息中提取创建的活动列表
                const createdActivities = userData.createdActivities || [];
                console.log('用户创建的活动:', createdActivities);
                
                setActivities(createdActivities);
            } else {
                throw new Error(data.message || '获取用户信息失败');
            }
            
        } catch (error) {
            console.error('获取用户信息错误:', error);
            setError(error.message || '网络连接失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };
    
    // 活动类型映射
    const typeMap = {
        '跑步': 'RUNNING',
        '游泳': 'SWIMMING',
        '健身': 'WORKOUT',
        '舞蹈': 'DANCE',
        '篮球': 'BASKETBALL',
        '足球': 'FOOTBALL',
        '羽毛球': 'BADMINTON',
        '其它': 'OTHERS'
    };

    const typeReverseMap = {
        'RUNNING': '跑步',
        'SWIMMING': '游泳',
        'WORKOUT': '健身',
        'DANCE': '舞蹈',
        'BASKETBALL': '篮球',
        'FOOTBALL': '足球',
        'BADMINTON': '羽毛球',
        'OTHERS': '其它'
    };

    // 编辑活动
    const handleEditActivity = (activity) => {
        // 如果 type 是中文，转换为英文枚举
        const typeValue = typeMap[activity.type] || activity.type;
        setEditActivityData({ ...activity, type: typeValue });
        setShowEditModal(true);
    };

    // 编辑活动字段变化处理
    const handleEditFieldChange = (e) => {
        const { name, value, type } = e.target;
        setEditActivityData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    // 取消编辑活动
    const handleCancelEdit = () => {
        setShowEditModal(false);
        setEditActivityData(null);
    };

    // 更新活动信息的函数
    const updateActivity = async (updatedActivityData) => {
        const token = sessionUserManager.getCurrentToken();
        
        try {
            console.log('正在更新活动信息:', updatedActivityData);

            const response = await fetch(`http://localhost:7001/activity`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedActivityData)
            });

            console.log('更新活动响应状态:', response.status);

            if (response.status === 401) {
                alert('登录已过期，请重新登录');
                sessionUserManager.logout();
                navigate('/loginpage');
                return { success: false };
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `更新失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('更新活动响应数据:', data);

            return data;

        } catch (error) {
            console.error('更新活动错误:', error);
            throw error;
        }
    };
    
    // 删除活动
    const handleDeleteActivity = async () => {
        const token = sessionUserManager.getCurrentToken();

        try {
            setIsLoading(true);

            console.log('正在删除活动:', selectedActivity.id);

            // 不再验证密码，直接传递活动ID
            const response = await fetch(`http://localhost:7001/activity`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectedActivity.id
                })
            });

            console.log('删除活动响应状态:', response.status);

            if (response.status === 401) {
                alert('登录已过期，请重新登录');
                sessionUserManager.logout();
                navigate('/loginpage');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `删除失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('删除活动响应数据:', data);

            if (data.success) {
                // 删除成功
                alert('活动已成功删除');
                setShowDeleteModal(false);
                setSelectedActivity(null);

                // 重新获取用户信息和活动列表
                fetchUserInfoAndActivities();
            } else {
                throw new Error(data.message || '删除失败');
            }

        } catch (error) {
            console.error('删除活动错误:', error);
            alert(error.message || '删除失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 查看活动详情
    const handleViewActivity = (activity) => {
        navigate(`/activitydetail?id=${activity.id}`);
    };
    
    // 确认删除
    const confirmDelete = (activity) => {
        setSelectedActivity(activity);
        setShowDeleteModal(true);
    };
    
    // 取消删除
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSelectedActivity(null);
    };
    
    // 返回首页
    const handleBack = () => {
        navigate('/');
    };
    
    // 筛选活动
    const filteredActivities = activities.filter(activity => {
        // 搜索关键词筛选
        const matchesSearch = !searchKeyword || 
            activity.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            activity.location?.toLowerCase().includes(searchKeyword.toLowerCase());
        
        // 状态筛选
        let matchesStatus = true;
        const now = new Date();
        const activityDate = new Date(activity.date);
        
        if (filterStatus === 'active') {
            matchesStatus = activityDate >= now;
        } else if (filterStatus === 'past') {
            matchesStatus = activityDate < now;
        }
        
        return matchesSearch && matchesStatus;
    });
    
    // 格式化日期
    const formatDate = (dateString) => {
        if (!dateString) return "时间待定";
        // 直接截取前面的年月日和时分，不做时区转换
        // 例如 "2025-07-31T07:46:00.000Z" => "2025-07-31 07:46"
        const match = dateString.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
        if (match) {
            return `${match[1]} ${match[2]}`;
        }
        return dateString;
    };
    
    // 获取活动状态
    const getActivityStatus = (activity) => {
        const now = new Date();
        const activityDate = new Date(activity.date);
        
        if (activityDate < now) {
            return { text: '已结束', className: 'bg-gray-100 text-gray-600' };
        } else {
            return { text: '未开始', className: 'bg-green-100 text-green-600' };
        }
    };
    
    // 页面加载时获取数据
    useEffect(() => {
        fetchUserInfoAndActivities();
    }, []);
        
    // 选择图片（多选，预览）
    const handleEditImageSelect = (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        // 最多4张
        const currentImageCount = editImageFiles.length;
        const remainingSlots = 4 - currentImageCount;
        if (files.length > remainingSlots) {
            alert(`最多只能选择4张图片，当前已有${currentImageCount}张，还可以选择${remainingSlots}张`);
            return;
        }

        // 验证每个文件
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                alert('只能选择图片文件');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('每张图片大小不能超过5MB');
                return;
            }
        }

        setEditImageFiles(prev => [...prev, ...files]);
        event.target.value = '';
    };

    // 删除已选图片
    const handleEditRemoveImage = (index) => {
        setEditImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    // 上传图片到服务器
    const uploadEditImages = async (files) => {
        const token = sessionUserManager.getCurrentToken();
        const uploadedUrls = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formDataUpload = new FormData();
            formDataUpload.append('files', file);
            formDataUpload.append('category', 'activity');

            const response = await fetch('http://localhost:7001/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formDataUpload
            });

            if (!response.ok) {
                throw new Error(`第${i + 1}张图片上传失败: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                let imageUrl;
                if (data.data && data.data.url) {
                    imageUrl = data.data.url;
                } else if (data.data && data.data.filename) {
                    imageUrl = `/uploads/activity/${data.data.filename}`;
                } else if (data.url) {
                    imageUrl = data.url;
                } else if (data.filename) {
                    imageUrl = `/uploads/activity/${data.filename}`;
                } else {
                    throw new Error(`第${i + 1}张图片响应格式无法解析`);
                }
                uploadedUrls.push(imageUrl);
            } else {
                throw new Error(data.message || `第${i + 1}张图片上传失败`);
            }
        }
        return uploadedUrls;
    };

    // 编辑保存时上传图片并保存链接
    const handleSaveEdit = async () => {
        try {
            setIsLoading(true);

            let pictureUrls = [];
            if (editImageFiles.length > 0) {
                setEditImageUploading(true);
                pictureUrls = await uploadEditImages(editImageFiles);
                setEditImageUploading(false);
            }

            // 将图片数组转换为逗号分隔的字符串
            const pictureString = pictureUrls.length > 0 ? pictureUrls.join(',') : editActivityData.picture || '';

            // 类型转换为中文
            const typeForUpload = typeReverseMap[editActivityData.type] || editActivityData.type;

            const result = await updateActivity({
                ...editActivityData,
                type: typeForUpload,
                picture: pictureString
            });

            if (result.success) {
                alert('活动信息已更新');
                setShowEditModal(false);
                setEditActivityData(null);
                setEditImageFiles([]);
                fetchUserInfoAndActivities();
            } else {
                alert(result.message || '更新失败');
            }
        } catch (error) {
            alert(error.message || '更新失败');
        } finally {
            setIsLoading(false);
            setEditImageUploading(false);
        }
    };

    // 图片预览
    const getEditImagePreviewUrl = (file) => {
        return URL.createObjectURL(file);
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
                        
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-800">管理我的活动</h1>
                            {userInfo && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {userInfo.name} 的活动管理
                                </p>
                            )}
                        </div>
                        
                        <button
                            onClick={() => navigate('/createactivity')}
                            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            创建新活动
                        </button>
                    </div>
                </div>
            </div>
            
            {/* 用户信息卡片 */}
            {userInfo && !isLoading && (
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{userInfo.name}</h2>
                                    <p className="text-blue-100">活动创建者</p>
                                    {userInfo.profile && (
                                        <p className="text-blue-100 mt-1 text-sm">{userInfo.profile}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold">{activities.length}</div>
                                <div className="text-blue-100">已创建活动</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 搜索和筛选区域 */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                        {/* 搜索框 */}
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    placeholder="搜索活动名称或地点..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        {/* 状态筛选 */}
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                                    filterStatus === 'all'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                全部活动
                            </button>
                            <button
                                onClick={() => setFilterStatus('active')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                                    filterStatus === 'active'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                未开始
                            </button>
                            <button
                                onClick={() => setFilterStatus('past')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                                    filterStatus === 'past'
                                        ? 'bg-gray-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                已结束
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* 活动统计 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">总活动数</p>
                                <p className="text-2xl font-bold text-gray-800">{activities.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">未开始</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {activities.filter(a => new Date(a.date) >= new Date()).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">已结束</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {activities.filter(a => new Date(a.date) < new Date()).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 加载状态 */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                            <span className="text-gray-600">正在加载用户信息和活动列表...</span>
                        </div>
                    </div>
                )}
                
                {/* 错误信息 */}
                {error && !isLoading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-red-700">{error}</span>
                        </div>
                        <button
                            onClick={fetchUserInfoAndActivities}
                            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                        >
                            重试
                        </button>
                    </div>
                )}
                
                {/* 活动列表 */}
                {!isLoading && !error && (
                    <div className="space-y-4">
                        {filteredActivities.length > 0 ? (
                            filteredActivities.map((activity) => {
                                const status = getActivityStatus(activity);
                                return (
                                    <div key={activity.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition duration-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center mb-2">
                                                    <h3 className="text-xl font-bold text-gray-800 mr-3">
                                                        {activity.title}
                                                    </h3>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                                                        {status.text}
                                                    </span>
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 ml-2">
                                                        {activity.type}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0114 0z" />
                                                        </svg>
                                                        {formatDate(activity.date)}
                                                    </div>
                                                    
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {activity.location}
                                                    </div>
                                                    
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        {activity.currentParticipants || 0}/{activity.participantsLimit}人
                                                    </div>
                                                    
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                        {activity.fee === 0 ? '免费' : `¥${activity.fee}`}
                                                    </div>
                                                </div>
                                                
                                                {activity.profile && (
                                                    <p className="mt-3 text-gray-600 line-clamp-2">
                                                        {activity.profile}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            {/* 操作按钮 */}
                                            <div className="flex items-center space-x-2 ml-4">
                                                <button
                                                    onClick={() => handleViewActivity(activity)}
                                                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-200"
                                                    title="查看详情"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleEditActivity(activity)}
                                                    className="px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800 transition duration-200"
                                                    title="编辑活动"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                
                                                <button
                                                    onClick={() => confirmDelete(activity)}
                                                    className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition duration-200"
                                                    title="删除活动"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                                <div className="text-gray-500 text-lg mb-2">
                                    {searchKeyword || filterStatus !== 'all' ? '没有找到符合条件的活动' : '您还没有创建任何活动'}
                                </div>
                                <div className="text-gray-400">
                                    {searchKeyword || filterStatus !== 'all' 
                                        ? '尝试调整搜索条件或筛选条件'
                                        : '点击右上角的"创建新活动"按钮开始创建您的第一个活动'
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* 删除确认模态框 */}
            {showDeleteModal && selectedActivity && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="text-center mb-4">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                确认删除活动
                            </h3>
                            <p className="text-sm text-gray-500 mb-2">
                                您正在删除活动：<strong>{selectedActivity.title}</strong>
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                此操作不可撤销，确定要删除该活动吗？
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-200"
                                disabled={isLoading}
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteActivity}
                                disabled={isLoading}
                                className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? '删除中...' : '确认删除'}
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center mt-3">
                            ⚠️ 删除后，所有参与此活动的用户将失去活动记录
                        </p>
                    </div>
                </div>
            )}
            
            {/* 编辑活动模态框 */}
            {showEditModal && editActivityData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">编辑活动</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">活动名称</label>
                            <input
                                name="title"
                                type="text"
                                value={editActivityData.title || ''}
                                onChange={handleEditFieldChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">活动简介</label>
                            <textarea
                                name="profile"
                                value={editActivityData.profile || ''}
                                onChange={handleEditFieldChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">活动时间</label>
                            <input
                                name="date"
                                type="datetime-local"
                                value={editActivityData.date ? new Date(editActivityData.date).toISOString().slice(0,16) : ''}
                                onChange={handleEditFieldChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">地点</label>
                            <input
                                name="location"
                                type="text"
                                value={editActivityData.location || ''}
                                onChange={handleEditFieldChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">活动类型</label>
                            <select
                                name="type"
                                value={editActivityData.type}
                                onChange={handleEditFieldChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="RUNNING">跑步</option>
                                <option value="SWIMMING">游泳</option>
                                <option value="WORKOUT">健身</option>
                                <option value="DANCE">舞蹈</option>
                                <option value="BASKETBALL">篮球</option>
                                <option value="FOOTBALL">足球</option>
                                <option value="BADMINTON">羽毛球</option>
                                <option value="OTHERS">其它</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">人数上限</label>
                            <input
                                name="participantsLimit"
                                type="number"
                                min="1"
                                value={editActivityData.participantsLimit || ''}
                                onChange={handleEditFieldChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">费用（元）</label>
                            <input
                                name="fee"
                                type="number"
                                min="0"
                                value={editActivityData.fee || 0}
                                onChange={handleEditFieldChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                活动图片 ({editImageFiles.length}/4)
                            </label>
                            {/* 选择按钮 */}
                            <div className="mb-4">
                                <label className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200 ${
                                    editImageFiles.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleEditImageSelect}
                                        disabled={editImageFiles.length >= 4}
                                        className="hidden"
                                    />
                                    {editImageFiles.length >= 4 ? (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                            </svg>
                                            已达上限 (4/4)
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            选择图片 (可多选)
                                        </>
                                    )}
                                </label>
                            </div>
                            {/* 图片预览网格 */}
                            {editImageFiles.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {editImageFiles.map((file, index) => (
                                        <div key={index} className="relative group">
                                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                                                <img
                                                    src={getEditImagePreviewUrl(file)}
                                                    alt={`活动图片 ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* 删除按钮 */}
                                            <button
                                                type="button"
                                                onClick={() => handleEditRemoveImage(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition duration-200 opacity-0 group-hover:opacity-100"
                                            >
                                                ×
                                            </button>
                                            {/* 图片序号和文件名 */}
                                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                {index + 1}
                                            </div>
                                            <div className="absolute top-2 left-2 bg-blue-500 bg-opacity-75 text-white text-xs px-2 py-1 rounded max-w-20 truncate" title={file.name}>
                                                {file.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* 已有图片预览（数据库已有） */}
                            {editActivityData.picture && !editImageFiles.length && (
                                <div className="mb-2">
                                    <img
                                        src={editActivityData.picture.split(',')[0]}
                                        alt="活动图片预览"
                                        className="w-full h-40 object-cover rounded"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">已保存图片</div>
                                </div>
                            )}
                            <p className="text-xs text-gray-500">
                                • 最多可选择4张图片<br/>
                                • 支持 JPG、PNG、GIF 格式<br/>
                                • 每张图片大小不超过 5MB<br/>
                                • 图片将在点击保存修改时上传
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                                disabled={isLoading}
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isLoading || editImageUploading}
                                className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 ${isLoading || editImageUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLoading || editImageUploading ? '保存中...' : '保存修改'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageActivityPage;
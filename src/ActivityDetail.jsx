import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function ActivityDetail() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activityId = searchParams.get('id');
    
    // 状态管理
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activityData, setActivityData] = useState(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isOperating, setIsOperating] = useState(false); // 添加操作状态
    
    // 评论相关状态
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [userRating, setUserRating] = useState(5);
    const [selectedImages, setSelectedImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);

    // 获取当前用户信息
    const getCurrentUser = () => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('解析用户信息失败:', error);
            return null;
        }
    };

    // 检查用户登录状态
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        const user = getCurrentUser();
        
        if (!token || !user) {
            alert('请先登录');
            navigate('/loginpage');
            return false;
        }
        return true;
    };

    // 获取活动详情
    useEffect(() => {
        const fetchActivityDetail = async () => {
            if (!activityId) {
                setError('活动ID无效');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError('');

                console.log('正在获取活动详情，ID:', activityId);

                const response = await fetch(`http://localhost:7001/activity/detail?id=${activityId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                console.log('活动详情响应状态:', response.status);

                if (!response.ok) {
                    throw new Error(`获取活动详情失败: ${response.status}`);
                }

                const data = await response.json();
                console.log('活动详情响应数据:', data);

                if (data.success) {
                    setActivityData(data.data);
                    console.log('获取到的活动数据:', data.data);
                    
                    // 如果有评论数据，也设置评论
                    if (data.data.comments) {
                        setComments(data.data.comments);
                    }
                } else {
                    throw new Error(data.message || '获取活动详情失败');
                }
            } catch (error) {
                console.error('获取活动详情错误:', error);
                setError(error.message || '网络连接失败，请稍后重试');
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivityDetail();
    }, [activityId]);

    // 检查用户的收藏和报名状态
    useEffect(() => {
        const checkUserStatus = async () => {
            const user = getCurrentUser();
            const token = localStorage.getItem('token');
            
            if (!user || !token || !activityId) return;

            try {
                // 获取用户信息，包括关联的活动和收藏
                const response = await fetch('http://localhost:7001/user/userInfo', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        const userData = data.data;
                        
                        // 检查是否已报名此活动
                        if (userData.activities && Array.isArray(userData.activities)) {
                            const isEnrolledInActivity = userData.activities.some(
                                activity => String(activity.id) === String(activityId)
                            );
                            setIsEnrolled(isEnrolledInActivity);
                            console.log('报名状态检查:', { activityId, isEnrolled: isEnrolledInActivity });
                        }
                        
                        // 检查是否已收藏此活动
                        if (userData.favoriteActivities && Array.isArray(userData.favoriteActivities)) {
                            const isFavoritedActivity = userData.favoriteActivities.some(
                                activity => String(activity.id) === String(activityId)
                            );
                            setIsFavorited(isFavoritedActivity);
                            console.log('收藏状态检查:', { activityId, isFavorited: isFavoritedActivity });
                        }
                    }
                }
            } catch (error) {
                console.error('获取用户状态失败:', error);
            }
        };

        checkUserStatus();
    }, [activityId]);

    // 报名功能
    const handleEnroll = async () => {
        if (!checkAuth()) return;
        if (isOperating) return;

        // 检查活动是否已满
        const currentParticipants = activityData.participants ? activityData.participants.length : 0;
        if (!isEnrolled && currentParticipants >= activityData.participantsLimit) {
            alert('活动名额已满');
            return;
        }

        const user = getCurrentUser();
        const token = localStorage.getItem('token');

        try {
            setIsOperating(true);
            
            // 根据当前状态选择API端点
            const endpoint = isEnrolled ? 'leave' : 'signup';
            const action = isEnrolled ? '取消报名' : '报名';
            
            console.log(`正在${action}:`, { userId: user.id, activityId: String(activityId) });

            const response = await fetch(`http://localhost:7001/activity/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    activityId: String(activityId)
                })
            });

            console.log(`${action}响应状态:`, response.status);

            if (!response.ok) {
                throw new Error(`${action}失败: ${response.status}`);
            }

            const data = await response.json();
            console.log(`${action}响应数据:`, data);

            if (data.success) {
                setIsEnrolled(!isEnrolled);
                console.log(`${action}成功`);
                
                // 直接刷新页面，不显示成功提示
                window.location.reload();
            } else {
                throw new Error(data.message || `${action}失败`);
            }

        } catch (error) {
            console.error('报名操作失败:', error);
            alert(error.message || '操作失败，请稍后重试');
            setIsOperating(false);
        }
    };

    // 收藏功能
    const handleFavorite = async () => {
        if (!checkAuth()) return;
        if (isOperating) return;

        const user = getCurrentUser();
        const token = localStorage.getItem('token');

        try {
            setIsOperating(true);
            
            // 根据当前收藏状态选择API端点
            const endpoint = isFavorited ? 'unfavourite' : 'favourite';
            const action = isFavorited ? '取消收藏' : '收藏';
            
            console.log(`正在${action}:`, { userId: user.id, activityId: String(activityId) });

            const response = await fetch(`http://localhost:7001/activity/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    activityId: String(activityId)
                })
            });

            console.log(`${action}响应状态:`, response.status);

            if (!response.ok) {
                throw new Error(`${action}失败: ${response.status}`);
            }

            const data = await response.json();
            console.log(`${action}响应数据:`, data);

            if (data.success) {
                setIsFavorited(!isFavorited);
                console.log(`${action}成功`);
                
                // 直接刷新页面，不显示成功提示
                window.location.reload();
            } else {
                throw new Error(data.message || `${action}失败`);
            }

        } catch (error) {
            console.error('收藏操作失败:', error);
            alert(error.message || '操作失败，请稍后重试');
            setIsOperating(false);
        }
    };

    // 格式化日期时间显示
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

    // 获取图片URL数组
    const getImageUrls = (pictureString) => {
        if (!pictureString) return [];
        
        const urls = pictureString.split(',').filter(url => url.trim());
        return urls.map(url => {
            if (url.startsWith('/')) {
                return `http://localhost:7001${url}`;
            }
            return url;
        });
    };

    const handleBack = () => {
        navigate('/');
    };

    // 处理图片上传
    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        const maxFiles = 4;
        
        if (selectedImages.length + files.length > maxFiles) {
            alert(`最多只能上传${maxFiles}张图片`);
            return;
        }

        const newPreviews = files.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));

        setSelectedImages(prev => [...prev, ...files]);
        setPreviewImages(prev => [...prev, ...newPreviews]);
    };

    // 删除图片
    const removeImage = (index) => {
        URL.revokeObjectURL(previewImages[index].url);
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
    };

    // 提交评论
    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('请先登录');
                navigate('/loginpage');
                return;
            }

            // TODO: 上传图片和提交评论到后端
            console.log('提交评论:', {
                activityId,
                content: newComment,
                rating: userRating,
                images: selectedImages
            });

            // 临时添加到本地状态（应该从后端获取最新数据）
            const comment = {
                id: Date.now(),
                user: "当前用户",
                avatar: "https://via.placeholder.com/40x40/8B5CF6/FFFFFF?text=我",
                content: newComment,
                time: new Date().toLocaleString('zh-CN'),
                rating: userRating,
                images: previewImages.map(img => img.url)
            };
            
            setComments([comment, ...comments]);
            setNewComment('');
            setUserRating(5);
            setSelectedImages([]);
            setPreviewImages([]);
            
        } catch (error) {
            console.error('提交评论失败:', error);
            alert('提交评论失败，请重试');
        }
    };

    // 渲染星级评分
    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <svg
                key={index}
                className={`w-4 h-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    // 渲染评分选择器
    const renderRatingSelector = () => {
        return Array.from({ length: 5 }, (_, index) => (
            <button
                key={index}
                onClick={() => setUserRating(index + 1)}
                className="focus:outline-none"
            >
                <svg
                    className={`w-6 h-6 ${index < userRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            </button>
        ));
    };

    // 加载状态
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在加载活动详情...</p>
                </div>
            </div>
        );
    }

    // 错误状态
    if (error || !activityData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-lg mb-4">{error || '活动不存在'}</div>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                    >
                        返回首页
                    </button>
                </div>
            </div>
        );
    }

    const imageUrls = getImageUrls(activityData.picture);
    // 计算当前参与人数 - 从participants数组的长度获取
    const currentParticipants = activityData.participants ? activityData.participants.length : 0;
    const isFull = currentParticipants >= activityData.participantsLimit;
    const averageRating = comments.length > 0 
        ? comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length 
        : 0;

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
                        <h1 className="text-2xl font-bold text-gray-800">活动详情</h1>
                        <div className="w-20"></div>
                    </div>
                </div>
            </div>

            {/* 主要内容区域 */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 左侧 - 活动图片和详细信息 */}
                    <div className="lg:col-span-2">
                        {/* 活动图片 */}
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                            {/* 图片轮播 */}
                            {imageUrls.length > 0 ? (
                                <div className="h-64 bg-gray-200 overflow-hidden">
                                    {/* 如果有多张图片，可以做成轮播，这里先显示第一张 */}
                                    <img 
                                        src={imageUrls[0]} 
                                        alt={activityData.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/600x400/4F46E5/FFFFFF?text=活动图片';
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="h-64 bg-gray-200 flex items-center justify-center">
                                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}

                            <div className="p-6">
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">{activityData.title}</h2>
                                
                                {/* 活动基本信息 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        <span>{activityData.location}</span>
                                    </div>
                                    
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        <span>{formatDateTime(activityData.date)}</span>
                                    </div>
                                    
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        <span>{currentParticipants}/{activityData.participantsLimit}人</span>
                                        {isFull && <span className="text-red-500 ml-2">(已满)</span>}
                                    </div>
                                    
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                        </svg>
                                        <span>组织者: {activityData.organizerName}</span>
                                    </div>

                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 3v1h2V3H9zm3 6a1 1 0 012 0v6a1 1 0 11-2 0V9zm-4 0a1 1 0 012 0v6a1 1 0 11-2 0V9z" />
                                        </svg>
                                        <span>活动类型: {activityData.type}</span>
                                    </div>

                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                                        </svg>
                                        <span>活动费用: {activityData.fee ? `¥${activityData.fee}` : '免费'}</span>
                                    </div>
                                </div>

                                {/* 活动简介 */}
                                <div className="mb-6">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">活动简介</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                                            {activityData.profile || "暂无详细介绍"}
                                        </div>
                                    </div>
                                </div>

                                {/* 多张图片展示 */}
                                {imageUrls.length > 1 && (
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">活动图片</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {imageUrls.map((url, index) => (
                                                <img
                                                    key={index}
                                                    src={url}
                                                    alt={`活动图片 ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(url, '_blank')}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 评论区 */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-800">用户评价</h3>
                                <div className="flex items-center">
                                    <div className="flex mr-2">
                                        {renderStars(Math.round(averageRating))}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {averageRating.toFixed(1)} ({comments.length}条评价)
                                    </span>
                                </div>
                            </div>

                            {/* 发表评论 */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="text-lg font-medium text-gray-800 mb-3">发表评价</h4>
                                
                                {/* 评分选择 */}
                                <div className="flex items-center mb-3">
                                    <span className="text-sm text-gray-600 mr-2">评分:</span>
                                    <div className="flex">
                                        {renderRatingSelector()}
                                    </div>
                                </div>

                                {/* 评论输入 */}
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="分享你对这个活动的看法..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                                    rows="3"
                                />
                                
                                {/* 图片上传区域 */}
                                <div className="mt-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600">添加图片 (最多4张)</span>
                                        <label className="cursor-pointer text-blue-500 hover:text-blue-700 text-sm">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                            选择图片
                                        </label>
                                    </div>
                                    
                                    {/* 图片预览 */}
                                    {previewImages.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {previewImages.map((image, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={image.url}
                                                        alt={`预览 ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg"
                                                    />
                                                    <button
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={handleSubmitComment}
                                        disabled={!newComment.trim()}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                                    >
                                        发表评价
                                    </button>
                                </div>
                            </div>

                            {/* 评论列表 */}
                            <div className="space-y-4">
                                {comments.length > 0 ? (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                            <div className="flex items-start space-x-3">
                                                <img
                                                    src={comment.avatar}
                                                    alt={comment.user}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-gray-800 mr-2">{comment.user}</span>
                                                            <div className="flex">
                                                                {renderStars(comment.rating)}
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-gray-500">{comment.time}</span>
                                                    </div>
                                                    <p className="text-gray-700 leading-relaxed mb-2">{comment.content}</p>
                                                
                                                    {/* 评论图片 */}
                                                    {comment.images && comment.images.length > 0 && (
                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                            {comment.images.map((image, imgIndex) => (
                                                                <img
                                                                    key={imgIndex}
                                                                    src={image}
                                                                    alt={`评论图片 ${imgIndex + 1}`}
                                                                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                                    onClick={() => window.open(image, '_blank')}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        暂无评价，快来成为第一个评价的人吧！
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右侧 - 报名卡片 */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                            {/* 价格显示 */}
                            <div className="text-center mb-6">
                                <div className="text-4xl font-bold text-green-600 mb-2">
                                    {activityData.fee ? `¥${activityData.fee}` : '免费'}
                                </div>
                                <div className="text-gray-500">单次活动</div>
                            </div>

                            {/* 报名进度 */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>报名进度</span>
                                    <span>{currentParticipants}/{activityData.participantsLimit}人</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ 
                                            width: `${Math.min(
                                                (currentParticipants / activityData.participantsLimit) * 100, 
                                                100
                                            )}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* 状态标签 */}
                            <div className="flex justify-center space-x-2 mb-4">
                                {isFull && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                        已满
                                    </span>
                                )}
                                {isEnrolled && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                                        已报名
                                    </span>
                                )}
                                {isFavorited && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                        已收藏
                                    </span>
                                )}
                            </div>

                            {/* 操作按钮 */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleEnroll}
                                    disabled={(isFull && !isEnrolled) || isOperating}
                                    className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 ${
                                        isOperating
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : isEnrolled
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : isFull
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                >
                                    {isOperating ? '处理中...' : (isEnrolled ? '取消报名' : isFull ? '名额已满' : '立即报名')}
                                </button>

                                <button
                                    onClick={handleFavorite}
                                    disabled={isOperating}
                                    className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 border-2 ${
                                        isOperating
                                            ? 'border-gray-300 text-gray-500 cursor-not-allowed'
                                            : isFavorited
                                            ? 'border-red-500 text-red-500 hover:bg-red-50'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {isOperating ? '处理中...' : (isFavorited ? '已收藏' : '收藏活动')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivityDetail;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionUserManager from './SessionUserManager';

function ActivityCard({ activity }) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // 从 activity 对象中解构数据，提供默认值防止报错
    const {
        id,
        title = "未知活动",
        location = "待定",
        date,
        participantsLimit = 0,
        participants = [], // 获取参与者数组
        type = "其他",
        organizerName = "未知",
        picture = "",
        fee = 0
    } = activity || {};

    // 计算当前参与人数 - 从participants数组的长度获取
    const currentParticipants = participants ? participants.length : 0;

    // 检查用户登录状态 - 使用sessionUserManager
    const checkAuth = () => {
        const token = sessionUserManager.getCurrentToken();
        const user = sessionUserManager.getCurrentUser();
        
        if (!token || !user) {
            alert('请先登录');
            navigate('/loginpage');
            return false;
        }
        return true;
    };

    // 检查初始状态（从后端获取用户的收藏和报名状态）
    useEffect(() => {
        const checkInitialStatus = async () => {
            const user = sessionUserManager.getCurrentUser();
            const token = sessionUserManager.getCurrentToken();
            
            if (!user || !token || !id) return;

            try {
                // 获取用户信息，包括关联的活动和收藏
                const response = await fetch('http://localhost:7001/user/userInfo', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                console.log('检查活动状态响应:', response.status);

                if (response.status === 401) {
                    // Token过期，使用sessionUserManager登出
                    console.log('Token已过期，自动登出');
                    sessionUserManager.logout();
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        const userData = data.data;
                        
                        // 检查是否已报名此活动 - 改进ID匹配逻辑
                        if (userData.activities && Array.isArray(userData.activities)) {
                            const isEnrolledInActivity = userData.activities.some(
                                activity => {
                                    // 确保转换为字符串进行比较
                                    const activityId = String(activity.id);
                                    const currentId = String(id);
                                    return activityId === currentId;
                                }
                            );
                            setIsEnrolled(isEnrolledInActivity);
                            console.log('报名状态检查:', { activityId: id, isEnrolled: isEnrolledInActivity });
                        }
                        
                        // 检查是否已收藏此活动 - 改进ID匹配逻辑
                        if (userData.favoriteActivities && Array.isArray(userData.favoriteActivities)) {
                            const isFavoritedActivity = userData.favoriteActivities.some(
                                activity => {
                                    // 确保转换为字符串进行比较
                                    const activityId = String(activity.id);
                                    const currentId = String(id);
                                    return activityId === currentId;
                                }
                            );
                            setIsFavorited(isFavoritedActivity);
                            console.log('收藏状态检查:', { activityId: id, isFavorited: isFavoritedActivity });
                        }
                        
                        // 更新活跃状态
                        sessionUserManager.updateTabActivity();
                    }
                }
            } catch (error) {
                console.error('获取活动状态失败:', error);
                // 发生错误时不改变状态，保持默认的 false
            }
        };

        checkInitialStatus();

        // 监听登录状态变化
        const handleUserLogin = () => {
            checkInitialStatus();
        };

        const handleUserLogout = () => {
            setIsFavorited(false);
            setIsEnrolled(false);
        };

        window.addEventListener('sessionUserLogin', handleUserLogin);
        window.addEventListener('sessionUserLogout', handleUserLogout);

        return () => {
            window.removeEventListener('sessionUserLogin', handleUserLogin);
            window.removeEventListener('sessionUserLogout', handleUserLogout);
        };
    }, [id]);

    // 报名功能 - 使用sessionUserManager
    const handleEnroll = async () => {
        if (!checkAuth()) return;
        if (isEnrolled || isLoading) return;
        if (currentParticipants >= participantsLimit) {
            alert('活动名额已满');
            return;
        }

        const user = sessionUserManager.getCurrentUser();
        const token = sessionUserManager.getCurrentToken();

        // 添加用户和token的验证
        if (!user || !user.id) {
            alert('用户信息无效，请重新登录');
            navigate('/loginpage');
            return;
        }

        try {
            setIsLoading(true);
            console.log('正在报名活动:', { 
                userId: user.id, 
                activityId: String(id),
                currentParticipants,
                participantsLimit,
                tabId: sessionUserManager.getTabId()
            });

            const response = await fetch('http://localhost:7001/activity/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    activityId: String(id)
                })
            });

            console.log('报名响应状态:', response.status);

            if (response.status === 401) {
                // Token过期，使用sessionUserManager登出
                alert('登录已过期，请重新登录');
                sessionUserManager.logout();
                navigate('/loginpage');
                return;
            }

            if (!response.ok) {
                throw new Error(`报名失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('报名响应数据:', data);

            if (data.success) {
                setIsEnrolled(true);
                console.log('报名成功:', title);
                
                // 更新活跃状态
                sessionUserManager.updateTabActivity();
                
                // 延迟刷新页面以确保状态更新
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                
            } else {
                throw new Error(data.message || '报名失败');
            }

        } catch (error) {
            console.error('报名错误:', error);
            alert(error.message || '报名失败，请稍后重试');
            setIsLoading(false);
        }
    };

    // 取消报名功能 - 使用sessionUserManager
    const handleCancelEnroll = async () => {
        if (!checkAuth()) return;
        if (!isEnrolled || isLoading) return;

        const user = sessionUserManager.getCurrentUser();
        const token = sessionUserManager.getCurrentToken();

        // 添加用户和token的验证
        if (!user || !user.id) {
            alert('用户信息无效，请重新登录');
            navigate('/loginpage');
            return;
        }

        try {
            setIsLoading(true);
            console.log('正在取消报名:', { 
                userId: user.id, 
                activityId: String(id),
                currentParticipants,
                participantsLimit,
                tabId: sessionUserManager.getTabId()
            });

            const response = await fetch('http://localhost:7001/activity/leave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    activityId: String(id)
                })
            });

            console.log('取消报名响应状态:', response.status);

            if (response.status === 401) {
                // Token过期，使用sessionUserManager登出
                alert('登录已过期，请重新登录');
                sessionUserManager.logout();
                navigate('/loginpage');
                return;
            }

            if (!response.ok) {
                throw new Error(`取消报名失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('取消报名响应数据:', data);

            if (data.success) {
                setIsEnrolled(false);
                console.log('取消报名成功:', title);
                
                // 更新活跃状态
                sessionUserManager.updateTabActivity();
                
                // 延迟刷新页面以确保状态更新
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                
            } else {
                throw new Error(data.message || '取消报名失败');
            }

        } catch (error) {
            console.error('取消报名错误:', error);
            alert(error.message || '取消报名失败，请稍后重试');
            setIsLoading(false);
        }
    };

    // 收藏功能 - 使用sessionUserManager
    const handleFavorite = async () => {
        if (!checkAuth()) return;
        if (isLoading) return;

        const user = sessionUserManager.getCurrentUser();
        const token = sessionUserManager.getCurrentToken();

        // 添加用户和token的验证
        if (!user || !user.id) {
            alert('用户信息无效，请重新登录');
            navigate('/loginpage');
            return;
        }

        try {
            setIsLoading(true);
            
            const endpoint = isFavorited ? 'unfavourite' : 'favourite';
            const action = isFavorited ? '取消收藏' : '收藏';
            
            console.log(`正在${action}:`, { 
                userId: user.id, 
                activityId: String(id),
                tabId: sessionUserManager.getTabId()
            });

            const response = await fetch(`http://localhost:7001/activity/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    activityId: String(id)
                })
            });

            console.log(`${action}响应状态:`, response.status);

            if (response.status === 401) {
                // Token过期，使用sessionUserManager登出
                alert('登录已过期，请重新登录');
                sessionUserManager.logout();
                navigate('/loginpage');
                return;
            }

            if (!response.ok) {
                throw new Error(`${action}失败: ${response.status}`);
            }

            const data = await response.json();
            console.log(`${action}响应数据:`, data);

            if (data.success) {
                setIsFavorited(!isFavorited);
                console.log(`${action}成功:`, title);
                
                // 更新活跃状态
                sessionUserManager.updateTabActivity();
                
                // 延迟刷新页面以确保状态更新
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                
            } else {
                throw new Error(data.message || `${action}失败`);
            }

        } catch (error) {
            console.error(`收藏操作错误:`, error);
            alert(error.message || '操作失败，请稍后重试');
            setIsLoading(false);
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

    // 格式化费用显示
    const formatFee = (feeAmount) => {
        if (!feeAmount || feeAmount === 0) {
            return {
                text: '免费',
                className: 'text-green-600 font-semibold'
            };
        }
        return {
            text: `¥${parseFloat(feeAmount).toFixed(2)}`,
            className: 'text-blue-600 font-semibold'
        };
    };

    // 获取活动类型的显示颜色
    const getTypeColor = (activityType) => {
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
        return colorMap[activityType] || 'bg-gray-100 text-gray-600';
    };

    // 获取第一张图片URL
    const getImageUrl = (pictureString) => {
        if (!pictureString) return null;
        
        // 如果是逗号分隔的多张图片，取第一张
        const firstImage = pictureString.split(',')[0];
        
        // 如果是相对路径，添加服务器地址
        if (firstImage.startsWith('/')) {
            return `http://localhost:7001${firstImage}`;
        }
        
        return firstImage;
    };

    const handleViewDetails = () => {
        // 跳转到活动详情页面，传递活动ID
        navigate(`/activitydetail?id=${id}`);
        console.log('查看详情:', title);
    };

    const isFull = currentParticipants >= participantsLimit;
    const imageUrl = getImageUrl(picture);
    const feeInfo = formatFee(fee);

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-w-sm hover:shadow-xl transition-shadow duration-300">

            {/* 活动图片 */}
            {imageUrl ? (
                <div className="h-48 bg-gray-200 overflow-hidden relative">
                    <img 
                        src={imageUrl} 
                        alt={title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    
                    {/* 图片加载失败时的占位符 */}
                    <div className="hidden w-full h-48 bg-gray-200 items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
            ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            <div className="p-6">
                {/* 活动类型标签和状态 */}
                <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(type)}`}>
                        {type}
                    </span>
                    <div className="flex space-x-1">
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
                </div>

                {/* 活动名称 */}
                <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2" title={title}>
                    {title}
                </h3>

                {/* 费用信息 - 在活动信息顶部显示 */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM6 13a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                            </svg>
                            <span className="text-sm text-gray-600">参与费用</span>
                        </div>
                        <span className={`text-lg ${feeInfo.className}`}>
                            {feeInfo.text}
                        </span>
                    </div>
                    {fee > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            报名时需支付活动费用
                        </p>
                    )}
                </div>
                
                {/* 活动信息 */}
                <div className="space-y-2 mb-4">
                    {/* 地点 */}
                    <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm truncate" title={location}>{location}</span>
                    </div>
                    
                    {/* 时间 */}
                    <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{formatDateTime(date)}</span>
                    </div>
                    
                    {/* 报名人数 */}
                    <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="text-sm">
                            {currentParticipants}/{participantsLimit}人
                        </span>
                        {/* 可选：显示更详细的参与者信息 */}
                        {participants && participants.length > 0 && (
                            <span className="text-xs text-gray-400 ml-1">
                                ({participants.length}人已报名)
                            </span>
                        )}
                    </div>
                    
                    {/* 组织者 */}
                    <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm truncate" title={organizerName}>
                            组织者: {organizerName}
                        </span>
                    </div>
                </div>
                
                {/* 按钮区域 */}
                <div className="flex justify-between items-center mt-6">
                    {/* 收藏按钮 */}
                    <button
                        onClick={handleFavorite}
                        disabled={isLoading}
                        className={`p-2 rounded-full transition duration-200 ${
                            isLoading
                                ? 'opacity-50 cursor-not-allowed'
                                : isFavorited 
                                ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={isLoading ? '处理中...' : (isFavorited ? '取消收藏' : '收藏')}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        ) : (
                            <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        )}
                    </button>
                    
                    {/* 操作按钮区域 */}
                    <div className="flex space-x-2">
                        {/* 详情按钮 */}
                        <button
                            onClick={handleViewDetails}
                            className="px-3 py-2 rounded-full text-sm font-medium transition duration-200 bg-purple-500 text-white hover:bg-purple-600"
                            title="查看详情"
                        >
                            详情
                        </button>
                        
                        {/* 报名/取消报名按钮 */}
                        {isEnrolled ? (
                            <button
                                onClick={handleCancelEnroll}
                                disabled={isLoading}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                    isLoading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                                title={isLoading ? '处理中...' : '取消报名'}
                            >
                                {isLoading ? '处理中...' : '取消报名'}
                            </button>
                        ) : (
                            <button
                                onClick={handleEnroll}
                                disabled={isFull || isLoading}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                    isLoading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : isFull
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                                title={isLoading ? '处理中...' : (fee > 0 ? `需支付 ${feeInfo.text}` : '免费参与')}
                            >
                                {isLoading ? '处理中...' : (isFull ? '已满' : (fee === 0 ? '免费报名' : '报名'))}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivityCard;
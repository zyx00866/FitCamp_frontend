import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ActivityCard({ 
    activityName = "晨间瑜伽课程",
    location = "健身房A区",
    time = "2024-07-10 08:00",
    enrolledCount = 15,
    totalCount = 20,
    fee = 50
}) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const navigate = useNavigate();

    const handleFavorite = () => {
        setIsFavorited(!isFavorited);
        console.log(isFavorited ? '取消收藏' : '收藏成功');
    };

    const handleEnroll = () => {
        if (!isEnrolled && enrolledCount < totalCount) {
            setIsEnrolled(true);
            console.log('报名成功:', activityName);
        }
    };

    const handleCancelEnroll = () => {
        if (isEnrolled) {
            setIsEnrolled(false);
            console.log('取消报名:', activityName);
        }
    };

    const handleViewDetails = () => {
        // 跳转到活动详情页面
        navigate('/activitydetail');
        console.log('查看详情:', activityName);
    };

    const isFull = enrolledCount >= totalCount;

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 m-4 max-w-sm" >
            {/* 活动名称 */}
            <h3 className="text-xl font-bold text-gray-800 mb-3">{activityName}</h3>
            
            {/* 活动信息 */}
            <div className="space-y-2 mb-4">
                {/* 地点 */}
                <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{location}</span>
                </div>
                
                {/* 时间 */}
                <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{time}</span>
                </div>
                
                {/* 报名人数 */}
                <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="text-sm">
                        {enrolledCount}/{totalCount}人
                        {isFull && <span className="text-red-500 ml-1">(已满)</span>}
                    </span>
                </div>
                
                {/* 费用 */}
                <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold text-green-600">¥{fee}</span>
                </div>
            </div>
            
            {/* 按钮区域 */}
            <div className="flex justify-between items-center mt-6">
                {/* 收藏按钮 */}
                <button
                    onClick={handleFavorite}
                    className={`p-2 rounded-full transition duration-200 ${
                        isFavorited 
                            ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={isFavorited ? '取消收藏' : '收藏'}
                >
                    <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>
                
                {/* 报名/取消报名按钮区域 */}
                <div className="flex space-x-2">
                    {/* 详情按钮 */}
                    <button
                        onClick={handleViewDetails}
                        className="px-4 py-2 rounded-full font-medium transition duration-200 bg-purple-500 text-white hover:bg-purple-600"
                        title="查看详情"
                    >
                        详情
                    </button>
                    
                    {/* 报名按钮 */}
                    <button
                        onClick={handleEnroll}
                        disabled={isFull || isEnrolled}
                        className={`px-4 py-2 rounded-full font-medium transition duration-200 ${
                            isEnrolled
                                ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                : isFull
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                        {isEnrolled ? '已报名' : isFull ? '已满' : '立即报名'}
                    </button>
                    
                    {/* 取消报名按钮 - 只在已报名时显示 */}
                    {isEnrolled && (
                        <button
                            onClick={handleCancelEnroll}
                            className="px-4 py-2 rounded-full font-medium transition duration-200 bg-red-500 text-white hover:bg-red-600"
                            title="取消报名"
                        >
                            取消报名
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ActivityCard;
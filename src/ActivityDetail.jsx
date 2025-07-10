import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ActivityDetail() {
    const navigate = useNavigate();
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    
    // 评论相关状态
    const [comments, setComments] = useState([
        {
            id: 1,
            user: "李小明",
            avatar: "https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=李",
            content: "这个瑜伽课程真的很不错，老师很专业，动作指导很详细。对于初学者来说非常友好！",
            time: "2024-07-09 15:30",
            rating: 5,
            images: ["https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=瑜伽练习"]
        },
        {
            id: 2,
            user: "王美丽",
            avatar: "https://via.placeholder.com/40x40/EF4444/FFFFFF?text=王",
            content: "环境很好，时间安排也合理。上完课感觉整个人都放松了很多。",
            time: "2024-07-08 20:15",
            rating: 4,
            images: []
        },
        {
            id: 3,
            user: "张健身",
            avatar: "https://via.placeholder.com/40x40/10B981/FFFFFF?text=张",
            content: "作为一个瑜伽小白，这个课程让我找到了运动的乐趣。推荐给大家！",
            time: "2024-07-07 09:45",
            rating: 5,
            images: [
                "https://via.placeholder.com/300x200/10B981/FFFFFF?text=课程环境",
                "https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=练习效果"
            ]
        }
    ]);
    
    const [newComment, setNewComment] = useState('');
    const [userRating, setUserRating] = useState(5);
    const [selectedImages, setSelectedImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    
    // 模拟活动数据
    const activityData = {
        id: 1,
        name: "晨间瑜伽课程",
        image: "/api/placeholder/600/400",
        fee: 50,
        enrolledCount: 15,
        totalCount: 20,
        location: "健身房A区",
        time: "2024-07-10 08:00-09:00",
        organizer: "张瑜伽老师",
        introduction: `
            【课程简介】
            这是一个专为初学者设计的瑜伽课程，旨在帮助您在繁忙的工作日开始前放松身心，提高柔韧性和专注力。课程内容包括基础瑜伽姿势、呼吸练习和冥想。

            【活动收益】
            • 提高身体柔韧性和平衡能力
            • 增强核心力量和肌肉耐力
            • 减轻工作压力和焦虑情绪
            • 改善睡眠质量和精神状态
            • 提升专注力和内心平静

            【注意事项】
            • 请穿着舒适的运动服装，避免过紧或过松
            • 建议自带瑜伽垫，现场也有提供
            • 课前2小时内请勿大量进食
            • 如有身体不适或特殊疾病请提前告知教练
            • 课程适合所有健身水平的参与者
        `
    };

    const handleEnroll = () => {
        setIsEnrolled(!isEnrolled);
        console.log(isEnrolled ? '取消报名' : '报名成功');
    };

    const handleFavorite = () => {
        setIsFavorited(!isFavorited);
        console.log(isFavorited ? '取消收藏' : '收藏成功');
    };

    const handleBack = () => {
        navigate('/');
    };

    // 处理图片上传
    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        const maxFiles = 4; // 最多4张图片
        
        if (selectedImages.length + files.length > maxFiles) {
            alert(`最多只能上传${maxFiles}张图片`);
            return;
        }

        // 创建预览URL
        const newPreviews = files.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));

        setSelectedImages(prev => [...prev, ...files]);
        setPreviewImages(prev => [...prev, ...newPreviews]);
    };

    // 删除图片
    const removeImage = (index) => {
        // 清理预览URL
        URL.revokeObjectURL(previewImages[index].url);
        
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
    };

    // 提交评论
    const handleSubmitComment = () => {
        if (newComment.trim()) {
            // 模拟上传图片到服务器，这里使用预览URL
            const imageUrls = previewImages.map(img => img.url);
            
            const comment = {
                id: comments.length + 1,
                user: "当前用户",
                avatar: "https://via.placeholder.com/40x40/8B5CF6/FFFFFF?text=我",
                content: newComment,
                time: new Date().toLocaleString('zh-CN'),
                rating: userRating,
                images: imageUrls
            };
            
            setComments([comment, ...comments]);
            setNewComment('');
            setUserRating(5);
            setSelectedImages([]);
            setPreviewImages([]);
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

    const isFull = activityData.enrolledCount >= activityData.totalCount;
    const averageRating = comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length;

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
                            <img 
                                src={activityData.image} 
                                alt={activityData.name}
                                className="w-full h-64 object-cover"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/600x400/4F46E5/FFFFFF?text=活动图片';
                                }}
                            />
                            <div className="p-6">
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">{activityData.name}</h2>
                                
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
                                        <span>{activityData.time}</span>
                                    </div>
                                    
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        <span>{activityData.enrolledCount}/{activityData.totalCount}人</span>
                                        {isFull && <span className="text-red-500 ml-2">(已满)</span>}
                                    </div>
                                    
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                        </svg>
                                        <span>组织者: {activityData.organizer}</span>
                                    </div>
                                </div>

                                {/* 活动简介 */}
                                <div className="mb-6">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">活动简介</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                                            {activityData.introduction}
                                        </div>
                                    </div>
                                </div>
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
                                {comments.map((comment) => (
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
                                                                onClick={() => {
                                                                    // 这里可以添加图片预览功能
                                                                    window.open(image, '_blank');
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 右侧 - 报名卡片 */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                            {/* 价格显示 */}
                            <div className="text-center mb-6">
                                <div className="text-4xl font-bold text-green-600 mb-2">¥{activityData.fee}</div>
                                <div className="text-gray-500">单次课程</div>
                            </div>

                            {/* 报名进度 */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>报名进度</span>
                                    <span>{activityData.enrolledCount}/{activityData.totalCount}人</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(activityData.enrolledCount / activityData.totalCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleEnroll}
                                    disabled={isFull && !isEnrolled}
                                    className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 ${
                                        isEnrolled
                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                            : isFull
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                >
                                    {isEnrolled ? '已报名 - 点击取消' : isFull ? '名额已满' : '立即报名'}
                                </button>

                                <button
                                    onClick={handleFavorite}
                                    className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 border-2 ${
                                        isFavorited
                                            ? 'border-red-500 text-red-500 hover:bg-red-50'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {isFavorited ? '已收藏' : '收藏活动'}
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
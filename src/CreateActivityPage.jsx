import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateActivityPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    
    // 表单数据状态 - 改为存储File对象
    const [formData, setFormData] = useState({
        title: '',
        profile: '',
        date: '',
        location: '',
        imageFiles: [], // 存储File对象，而不是URL
        participantsLimit: '',
        type: '健身',
        organizerName: '',
        fee: 0 // 添加价格字段，默认为0（免费）
    });

    // 表单验证错误
    const [errors, setErrors] = useState({});

    // 活动类型选项（对应ActivityType）
    const activityTypes = ['健身', '游泳', '跑步', '舞蹈', '足球', '羽毛球', '篮球', '其它'];

    // 获取当前用户信息
    useEffect(() => {
        const fetchUserInfo = async () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                alert('请先登录');
                navigate('/loginpage');
                return;
            }

            try {
                const response = await fetch('http://localhost:7001/user/userInfo', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error('获取用户信息失败');
                }

                const data = await response.json();
                
                if (data.success) {
                    setCurrentUser(data.data);
                    setFormData(prev => ({
                        ...prev,
                        organizerName: data.data.name || ''
                    }));
                } else {
                    throw new Error(data.message || '获取用户信息失败');
                }
            } catch (error) {
                console.error('获取用户信息错误:', error);
                alert('获取用户信息失败，请重新登录');
                navigate('/loginpage');
            }
        };

        fetchUserInfo();
    }, [navigate]);

    // 处理输入变化
    const handleInputChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
        
        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: ''
            });
        }
    };

    // 表单验证
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = '活动标题不能为空';
        }

        if (!formData.profile.trim()) {
            newErrors.profile = '活动描述不能为空';
        }

        if (!formData.location.trim()) {
            newErrors.location = '活动地点不能为空';
        }

        if (!formData.participantsLimit || formData.participantsLimit <= 0) {
            newErrors.participantsLimit = '参与人数限制必须大于0';
        }

        if (!formData.date) {
            newErrors.date = '活动时间不能为空';
        }

        if (!formData.organizerName.trim()) {
            newErrors.organizerName = '组织者姓名不能为空';
        }

        // 价格验证
        if (formData.fee < 0) {
            newErrors.fee = '活动价格不能为负数';
        }

        // 检查时间是否为未来时间
        const now = new Date();
        if (formData.date && new Date(formData.date) <= now) {
            newErrors.date = '活动时间必须是未来时间';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 处理图片选择（不上传，只存储File对象）
    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        // 检查当前已有图片数量
        const currentImageCount = formData.imageFiles.length;
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

        // 添加文件到数组
        setFormData(prev => ({
            ...prev,
            imageFiles: [...prev.imageFiles, ...files]
        }));

        // 清空input，允许重新选择相同文件
        event.target.value = '';
    };

    // 删除选中的图片
    const handleRemoveImage = (index) => {
        setFormData(prev => ({
            ...prev,
            imageFiles: prev.imageFiles.filter((_, i) => i !== index)
        }));
    };

    // 上传图片到服务器
    const uploadImages = async (files) => {
        const token = localStorage.getItem('token');
        const uploadedUrls = [];

        console.log(`开始上传${files.length}张图片...`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`上传第${i + 1}张图片: ${file.name}`);

            const formDataUpload = new FormData();
            formDataUpload.append('files', file);
            formDataUpload.append('category', 'activity');

            const response = await fetch('http://localhost:7001/upload/image', {
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
            console.log(`第${i + 1}张图片上传响应:`, data);
            
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
                console.log(`第${i + 1}张图片上传成功: ${imageUrl}`);
            } else {
                throw new Error(data.message || `第${i + 1}张图片上传失败`);
            }
        }

        console.log('所有图片上传完成:', uploadedUrls);
        return uploadedUrls;
    };

    // 提交创建活动
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!currentUser || !currentUser.id) {
            alert('获取用户信息失败，请重新登录');
            navigate('/loginpage');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录');
            navigate('/loginpage');
            return;
        }

        try {
            setIsLoading(true);

            console.log('当前用户信息:', currentUser);
            console.log('提交活动数据:', formData);

            // 先上传图片
            let pictureUrls = [];
            if (formData.imageFiles.length > 0) {
                setImageUploading(true);
                pictureUrls = await uploadImages(formData.imageFiles);
                setImageUploading(false);
            }

            // 将图片数组转换为逗号分隔的字符串
            const pictureString = pictureUrls.length > 0 ? pictureUrls.join(',') : '';

            // 构建活动数据
            const activityData = {
                title: formData.title,
                profile: formData.profile,
                date: new Date(formData.date).toISOString(),
                location: formData.location,
                picture: pictureString,
                participantsLimit: parseInt(formData.participantsLimit),
                type: formData.type,
                organizerName: formData.organizerName,
                fee: parseFloat(formData.fee) || 0,
                createTime: new Date().toISOString(), // 添加创建时间
                organizerId: currentUser.id // 添加组织者ID
            };

            console.log('完整的活动数据:', activityData);

            const response = await fetch('http://localhost:7001/activity/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activityData)
            });

            console.log('创建活动响应状态:', response.status);

            if (!response.ok) {
                throw new Error(`创建活动失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('创建活动响应:', data);

            if (data.success) {
                alert('活动创建成功！');
                navigate('/');
            } else {
                throw new Error(data.message || '创建活动失败');
            }
        } catch (error) {
            console.error('创建活动错误:', error);
            alert(error.message || '创建活动失败，请重试');
        } finally {
            setIsLoading(false);
            setImageUploading(false);
        }
    };

    // 创建图片预览URL
    const getImagePreviewUrl = (file) => {
        return URL.createObjectURL(file);
    };

    // 如果用户信息还在加载中，显示加载状态
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在加载用户信息...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* 页面标题 */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">创建新活动</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                创建时间: {new Date().toLocaleString('zh-CN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-200"
                        >
                            返回首页
                        </button>
                    </div>
                </div>

                {/* 创建表单 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 基本信息说明 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-medium text-blue-800 mb-1">活动信息</h3>
                                    <div className="text-sm text-blue-700 space-y-1">
                                        <p>• 组织者: {currentUser?.name || '未知'}</p>
                                        <p>• 创建时间: {new Date().toLocaleString('zh-CN')}</p>
                                        <p>• 活动将在审核通过后对所有用户可见</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 活动标题 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                活动标题 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="请输入活动标题"
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                        </div>

                        {/* 活动类型、参与人数限制和价格 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    活动类型 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {activityTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    参与人数限制 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.participantsLimit}
                                    onChange={(e) => handleInputChange('participantsLimit', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.participantsLimit ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="请输入参与人数限制"
                                />
                                {errors.participantsLimit && <p className="text-red-500 text-sm mt-1">{errors.participantsLimit}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    活动价格 <span className="text-gray-500">(元)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.fee}
                                        onChange={(e) => handleInputChange('fee', e.target.value)}
                                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.fee ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.fee && <p className="text-red-500 text-sm mt-1">{errors.fee}</p>}
                                <p className="text-xs text-gray-500 mt-1">
                                    输入0表示免费活动
                                </p>
                            </div>
                        </div>

                        {/* 活动地点 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                活动地点 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.location ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="请输入活动地点"
                            />
                            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                        </div>

                        {/* 活动时间和组织者姓名 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    活动时间 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.date}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    组织者姓名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.organizerName}
                                    onChange={(e) => handleInputChange('organizerName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.organizerName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="请输入组织者姓名"
                                />
                                {errors.organizerName && <p className="text-red-500 text-sm mt-1">{errors.organizerName}</p>}
                            </div>
                        </div>

                        {/* 活动描述 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                活动描述 <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows="4"
                                value={formData.profile}
                                onChange={(e) => handleInputChange('profile', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.profile ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="请详细描述活动内容、注意事项等"
                            />
                            {errors.profile && <p className="text-red-500 text-sm mt-1">{errors.profile}</p>}
                        </div>

                        {/* 活动图片 - 只选择不上传 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                活动图片 ({formData.imageFiles.length}/4)
                            </label>
                            
                            {/* 选择按钮 */}
                            <div className="mb-4">
                                <label className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200 ${
                                    formData.imageFiles.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageSelect}
                                        disabled={formData.imageFiles.length >= 4}
                                        className="hidden"
                                    />
                                    {formData.imageFiles.length >= 4 ? (
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
                            {formData.imageFiles.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {formData.imageFiles.map((file, index) => (
                                        <div key={index} className="relative group">
                                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                                                <img
                                                    src={getImagePreviewUrl(file)}
                                                    alt={`活动图片 ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* 删除按钮 */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
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

                            <p className="text-xs text-gray-500">
                                • 最多可选择4张图片<br/>
                                • 支持 JPG、PNG、GIF 格式<br/>
                                • 每张图片大小不超过 5MB<br/>
                                • 图片将在点击创建活动时上传
                            </p>
                        </div>

                        {/* 提交按钮 */}
                        <div className="flex justify-end space-x-4 pt-6">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                disabled={isLoading}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                        {imageUploading ? '上传图片中...' : '创建中...'}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        创建活动
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* 创建活动说明 */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">创建说明</h3>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p>• 活动创建后会自动记录创建时间</p>
                            <p>• 所有必填字段都需要完整填写</p>
                            <p>• 活动时间必须设置为未来时间</p>
                            <p>• 图片将在提交时自动上传到服务器</p>
                            <p>• 创建成功后会自动跳转到首页</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateActivityPage;
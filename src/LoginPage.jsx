import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        account: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // 处理输入框变化
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // 清除错误信息
        if (error) setError('');
    };

    // 处理登录
    const handleLogin = async (e) => {
        e.preventDefault();
        
        // 表单验证
        if (!formData.account.trim()) {
            setError('请输入用户名');
            return;
        }
        
        if (!formData.password.trim()) {
            setError('请输入密码');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:7001/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    account: formData.account,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // 登录成功
                if (data.data.token) {
                    // 保存JWT token到localStorage
                    localStorage.setItem('token', data.data.token);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                    
                    
                    // 跳转到用户详情页面
                    navigate('/userpage');
                } else {
                    setError('登录响应格式错误');
                }
            } else {
                // 登录失败
                setError(data.message || '登录失败，请检查用户名和密码');
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            setError('网络连接失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 检查是否已经登录
    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/usepage');
        }
    };

    // 组件挂载时检查登录状态
    useState(() => {
        checkAuthStatus();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold text-center mb-6">用户登录</h2>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    {/* 错误信息显示 */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            账号
                        </label>
                        <input 
                            type="text"
                            name="account"
                            value={formData.account}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            placeholder="请输入账号"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            密码
                        </label>
                        <input 
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            placeholder="请输入密码"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                登录中...
                            </>
                        ) : (
                            '登录'
                        )}
                    </button>

                    <button 
                        type="button"
                        onClick={() => {navigate('/register');}}
                        disabled={isLoading}
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-200 disabled:bg-green-300"
                    >
                        注册新账号
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => {navigate('/');}}
                        disabled={isLoading}
                        className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200 disabled:bg-gray-200"
                    >
                        返回首页
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
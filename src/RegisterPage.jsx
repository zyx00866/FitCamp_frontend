import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        account: '',
        name: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 处理输入框变化
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // 清除错误信息
        if (error) setError('');
        if (success) setSuccess('');
    };

    // 表单验证
    const validateForm = () => {
        if (!formData.account.trim()) {
            setError('请输入账号');
            return false;
        }

        if (formData.account.length < 3) {
            setError('账号长度至少3位');
            return false;
        }

        if (!formData.name.trim()) {
            setError('请输入用户名');
            return false;
        }

        if (!formData.password.trim()) {
            setError('请输入密码');
            return false;
        }

        if (formData.password.length < 6) {
            setError('密码长度至少6位');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致');
            return false;
        }

        return true;
    };

    // 处理注册
    const handleRegister = async (e) => {
        e.preventDefault();
        
        // 表单验证
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:7001/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    account: formData.account,
                    name: formData.name,
                    password: formData.password
                })
            });

            const data = await response.json();
            console.log('注册响应数据:', data);

            if (response.ok) {
                // 注册成功
                if (data.success) {
                    setSuccess('注册成功！即将跳转到登录页面...');
                    
                    // 延迟2秒后跳转到登录页面
                    setTimeout(() => {
                        navigate('/loginPage');
                    }, 2000);
                } else {
                    setError(data.message || '注册失败');
                }
            } else {
                // 注册失败
                setError(data.message || '注册失败，请稍后重试');
            }
        } catch (error) {
            console.error('注册请求失败:', error);
            setError('网络连接失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold text-center mb-6">用户注册</h2>
                
                <form onSubmit={handleRegister} className="space-y-4">
                    {/* 错误信息显示 */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* 成功信息显示 */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                            {success}
                        </div>
                    )}

                    {/* 账号 */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            账号 <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text"
                            name="account"
                            value={formData.account}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            placeholder="请输入账号（至少3位）"
                            disabled={isLoading}
                            maxLength={20}
                        />
                    </div>

                    {/* 用户名 */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            用户名 <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            placeholder="请输入用户名"
                            disabled={isLoading}
                            maxLength={20}
                        />
                    </div>
                    
                    {/* 密码 */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            密码 <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            placeholder="请输入密码（至少6位）"
                            disabled={isLoading}
                        />
                    </div>

                    {/* 确认密码 */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            确认密码 <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            placeholder="请再次输入密码"
                            disabled={isLoading}
                        />
                    </div>
                    
                    {/* 注册按钮 */}
                    <button 
                        type="submit"
                        disabled={isLoading || success}
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-200 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                注册中...
                            </>
                        ) : success ? (
                            '注册成功'
                        ) : (
                            '立即注册'
                        )}
                    </button>

                    {/* 返回登录 */}
                    <button 
                        type="button"
                        onClick={() => {navigate('/loginpage');}}
                        disabled={isLoading}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 disabled:bg-blue-300"
                    >
                        已有账号？去登录
                    </button>
                    
                    {/* 返回首页 */}
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

export default RegisterPage;  // 这里应该导出 RegisterPage
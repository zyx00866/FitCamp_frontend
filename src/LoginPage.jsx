import { useNavigate } from "react-router-dom";

function LoginPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold text-center mb-6">用户登录</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            用户名
                        </label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            placeholder="请输入用户名"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            密码
                        </label>
                        <input 
                            type="password" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            placeholder="请输入密码"
                        />
                    </div>
                    
                    <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200">
                        登录
                    </button>

                    <button 
                        onClick={() => {navigate('/register');}}
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-200"
                    >
                        注册新账号
                    </button>
                    
                    <button 
                        onClick= {() => {navigate('/');}}
                        className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
                    >
                        返回首页
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
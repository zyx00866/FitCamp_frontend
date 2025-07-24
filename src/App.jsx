import { useState, useEffect } from 'react'
import UserButton from './UserButton.jsx'
import SearchBox from './SearchBox.jsx'
import ActivityCard from './ActivityCard.jsx'
import PageSelector from './PageSelector.jsx'
import fitcamp from '/fitcamp.jpg'
import { useNavigate, Routes, Route } from 'react-router-dom' 
import LoginPage from './LoginPage.jsx' 
import RegisterPage from './RegisterPage.jsx'
import UserPage from './UserPage.jsx'
import ActivityDetail from './ActivityDetail.jsx'
import CreateActivityPage from './CreateActivityPage.jsx'

function App() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [currentPage, setCurrentPage] = useState(1);
  const [activities, setActivities] = useState([]); // 活动列表数据
  const [isLoading, setIsLoading] = useState(false); // 加载状态
  const [error, setError] = useState(''); // 错误信息
  const [totalPages, setTotalPages] = useState(1); // 总页数
  
  const categories = ['全部', '健身', '游泳', '跑步', '舞蹈', '足球', '羽毛球', '篮球', '其它'];

  // 获取活动列表的函数
  const fetchActivities = async (category, page) => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('正在获取活动列表:', { category, page });
      
      // 修改参数构建方式
      const params = new URLSearchParams();
      
      // 改用 type 参数，并且只有非"全部"时才添加
      if (category !== '全部') {
        params.append('type', category); // 改为 type 参数
      }
      
      params.append('page', page.toString());
      params.append('limit', '20');

      const url = `http://localhost:7001/activity/list?${params}`;
      console.log('请求URL:', url);
      console.log('URL编码后的参数:', params.toString());

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('活动列表响应状态:', response.status);

      if (!response.ok) {
        throw new Error(`获取活动列表失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('活动列表响应数据:', data);

      if (data.success) {
        setActivities(data.data.activities || data.data || []);
        setTotalPages(data.data.totalPages || Math.ceil((data.data.total || 0) / 20));
        console.log('获取到的活动数量:', data.data.activities?.length || 0);
      } else {
        throw new Error(data.message || '获取活动列表失败');
      }

    } catch (error) {
      console.error('获取活动列表错误:', error);
      setError(error.message || '网络连接失败，请稍后重试');
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 页面加载时获取初始数据
  useEffect(() => {
    fetchActivities(selectedCategory, currentPage);
  }, []); // 只在组件挂载时执行一次

  // 当分类或页码改变时重新获取数据
  useEffect(() => {
    fetchActivities(selectedCategory, currentPage);
  }, [selectedCategory, currentPage]);

  // 处理分类切换
  const handleCategoryChange = (category) => {
    console.log('切换分类到:', category);
    setSelectedCategory(category);
    setCurrentPage(1); // 切换分类时重置到第一页
  };

  // 处理页码切换
  const handlePageChange = (page) => {
    console.log('切换到第', page, '页');
    setCurrentPage(page);
  };

  const navigate = useNavigate();
  const handleLoginClick = () => {
    navigate('/loginpage');
  };

  return (
    <Routes>
      <Route path="/" element={
        <>
          <div className="flex h-12 top-50 justify-between items-center pl-10 pr-10 mt-4">
            <div className="flex items-center">
              <p className="font-bold text-4xl text-red-400 ">FitCamp</p>
              <img src={fitcamp} alt="FitCamp Logo" className="w-12 h-12 rounded-full ml-3" />
            </div>
            <SearchBox />
          </div>
          <UserButton onUserClick={handleLoginClick}/>
          
          {/* 分类按钮 */}
          <div className="w-full mt-8 mb-6 px-4">
            <div className="flex justify-center space-x-3 bg-gray-100 p-2 rounded-full w-full">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  disabled={isLoading} // 加载时禁用按钮
                  className={`flex-1 py-2 rounded-full font-medium transition duration-200 ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-500'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* 加载状态 */}
          {isLoading && (
            <div className="w-full px-4 py-8 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-gray-600">正在加载活动列表...</span>
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {error && !isLoading && (
            <div className="w-full px-4 py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => fetchActivities(selectedCategory, currentPage)}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                >
                  重试
                </button>
              </div>
            </div>
          )}
          
          {/* 活动卡片网格 */}
          {!isLoading && !error && (
            <div className="w-full px-4 pb-8">
              {activities.length > 0 ? (
                <div className="grid grid-cols-5 gap-4">
                  {activities.map((activity, index) => (
                    <ActivityCard 
                      key={activity.id || index} 
                      activity={activity} // 传递活动数据给ActivityCard
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">暂无活动</div>
                  <div className="text-gray-500">当前分类下没有找到任何活动</div>
                </div>
              )}
            </div>
          )}

          {/* 翻页组件 */}
          {!isLoading && !error && activities.length > 0 && (
            <PageSelector 
              totalPages={totalPages} 
              currentPage={currentPage} 
              onPageChange={handlePageChange} 
            />
          )}
        </>
      } />
      <Route path="/loginpage" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/userpage" element={<UserPage />} />
      <Route path="/activitydetail" element={<ActivityDetail />} />
      <Route path="/createactivity" element={<CreateActivityPage />} />
    </Routes>
  )
}

export default App

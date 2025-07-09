import { useState } from 'react'
import UserButton from './UserButton.jsx'
import SearchBox from './SearchBox.jsx'
import ActivityCard from './ActivityCard.jsx'
import PageSelector from './PageSelector.jsx'
import fitcamp from '/fitcamp.jpg'

function App() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [currentPage, setCurrentPage] = useState(1);
  
  const categories = ['全部', '健身', '游泳', '跑步', '舞蹈', '拳击', '篮球', '其它'];

  const handlePageChange = (page) => {
    setCurrentPage(page);
    console.log('切换到第', page, '页');
    // 添加分页数据加载逻辑
  };

  return (
    <>
    <div className= "flex h-12 top-50 justify-between items-center pl-10 pr-10 mt-4">
      <div className="flex items-center">
        <p className= "font-bold text-4xl text-red-400 ">FitCamp</p>
        <img src={fitcamp} alt="FitCamp Logo" className="w-12 h-12 rounded-full ml-3" />
      </div>
      <SearchBox />
      </div>
      <UserButton />
      
      {/* 分类按钮 */}
      <div className="w-full mt-8 mb-6 px-4">
        <div className="flex justify-center space-x-3 bg-gray-100 p-2 rounded-full w-full">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-1 py-2 rounded-full font-medium transition duration-200 ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-500'
              }`}
            >
              {category}
            </button>
          ))}        </div>
      </div>
      
      {/* 活动卡片网格 */}
      <div className="w-full px-4 pb-8">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 20 }, (_, index) => (
            <ActivityCard key={index} />
          ))}
        </div>
      </div>
      {/*TODO:动态调整卡片数量逻辑 */}

      {/* 翻页组件 */}
      <PageSelector 
        totalPages={5} 
        currentPage={currentPage} 
        onPageChange={handlePageChange} 
      />

    </>
  )
}

export default App

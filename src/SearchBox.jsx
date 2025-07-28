import { useState } from 'react';

function SearchBox({ onSearch, onClear, currentKeyword }) {
  const [keyword, setKeyword] = useState(currentKeyword || '');

  // 处理搜索提交
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedKeyword = keyword.trim();
    
    if (trimmedKeyword) {
      console.log('执行搜索:', trimmedKeyword);
      onSearch(trimmedKeyword);
    } else {
      // 如果搜索框为空，清除搜索
      handleClear();
    }
  };

  // 处理清除搜索
  const handleClear = () => {
    setKeyword('');
    onClear();
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    
    // 如果用户清空了输入框，自动清除搜索
    if (!value.trim() && currentKeyword) {
      onClear();
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className="relative flex-1 max-w-lg ml-8 right-10 top-1">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={keyword}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="搜索活动名称、地点、组织者..."
          className="w-full pl-12 pr-24 py-3 text-base border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
        />
        
        {/* 搜索图标 */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* 右侧按钮组 */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* 清除按钮 */}
          {keyword && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition duration-200"
              title="清除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* 搜索按钮 */}
          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-200 text-sm font-medium"
            title="搜索"
          >
            搜索
          </button>
        </div>
      </form>
      
      {/* 搜索建议（可选功能） */}
      {keyword.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-3 text-sm text-gray-500">
            按 Enter 搜索 "{keyword}"
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBox;
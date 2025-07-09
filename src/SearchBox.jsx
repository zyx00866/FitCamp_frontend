import { useState } from 'react';

function SearchBox() {
    const [searchText, setSearchText] = useState('');

    const handleSearch = () => {
        console.log('搜索:', searchText);
        // 这里可以添加搜索逻辑
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 px-4 py-2 w-[40rem] mr-10 top-4">
            <input
                type="text"
                placeholder="搜索活动项目..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            />
            <button
                onClick={handleSearch}
                className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-full transition duration-200"
            >
                搜索
            </button>
        </div>
    );
}

export default SearchBox;
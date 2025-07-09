import { useState } from 'react';

function PageSelector({ 
    totalPages,
    currentPage, 
    onPageChange = () => {} 
}) {
    const [page, setPage] = useState(currentPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            onPageChange(newPage);
        }
    };

    const handlePrevious = () => {
        handlePageChange(page - 1);
    };

    const handleNext = () => {
        handlePageChange(page + 1);
    };

    // 生成页码数组
    const generatePageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 7; // 最多显示7个页码按钮

        if (totalPages <= maxVisiblePages) {
            // 如果总页数少于等于7，显示所有页码
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // 复杂的页码生成逻辑
            if (page <= 4) {
                // 当前页在前面时：1 2 3 4 5 ... 10
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (page >= totalPages - 3) {
                // 当前页在后面时：1 ... 6 7 8 9 10
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // 当前页在中间时：1 ... 4 5 6 ... 10
                pages.push(1);
                pages.push('...');
                for (let i = page - 1; i <= page + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const pageNumbers = generatePageNumbers();

    return (
        <div className="flex justify-center items-center mt-8 mb-8 space-x-2">
            {/* 上一页按钮 */}
            <button
                onClick={handlePrevious}
                disabled={page === 1}
                className={`px-3 py-2 rounded-lg font-medium transition duration-200 ${
                    page === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
                上一页
            </button>

            {/* 页码按钮 */}
            {pageNumbers.map((pageNum, index) => (
                <button
                    key={index}
                    onClick={() => typeof pageNum === 'number' && handlePageChange(pageNum)}
                    disabled={pageNum === '...'}
                    className={`px-3 py-2 rounded-lg font-medium transition duration-200 min-w-[40px] ${
                        pageNum === page
                            ? 'bg-blue-500 text-white shadow-md'
                            : pageNum === '...'
                            ? 'bg-transparent text-gray-400 cursor-default'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    {pageNum}
                </button>
            ))}

            {/* 下一页按钮 */}
            <button
                onClick={handleNext}
                disabled={page === totalPages}
                className={`px-3 py-2 rounded-lg font-medium transition duration-200 ${
                    page === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
                下一页
            </button>

            {/* 页码信息 */}
            <div className="ml-4 text-sm text-gray-600">
                第 {page} 页，共 {totalPages} 页
            </div>
        </div>
    );
}

export default PageSelector;
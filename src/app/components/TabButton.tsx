interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const TabButton = ({ active, onClick, children }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
      active
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:text-gray-100 hover:bg-gray-800'
    }`}
  >
    {children}
  </button>
); 
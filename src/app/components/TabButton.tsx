interface TabButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}

export const TabButton = ({ children, active, onClick, className = '' }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`${
        active
          ? 'text-blue-500'
          : 'text-gray-400 hover:text-gray-300'
      } transition-colors duration-200 ${className}`}
    >
      {children}
    </button>
  );
}; 
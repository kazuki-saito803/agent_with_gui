import React from 'react'


type CustomButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;


const CustomButton: React.FC<CustomButtonProps> = ({ children, ...props }) => {
    return (
      <button
        {...props}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {children}
      </button>
    );
  };
  export default CustomButton;
import React from 'react'
import '../styles/customButton.css'


type CustomButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;


const CustomButton: React.FC<CustomButtonProps> = ({ children, ...props }) => {
    return (
      <button className='customButton' {...props}>
        {children}
      </button>
    );
  };

  export default CustomButton;
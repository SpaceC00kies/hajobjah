import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  colorScheme?: 'primary' | 'secondary' | 'accent'; // For outline variant
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  colorScheme = 'primary', // Default color scheme for outline
  ...props
}) => {
  const baseStyle = 'font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-150 ease-in-out';
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = `bg-primary text-neutral-dark hover:bg-primary-hover focus:ring-primary 
                      dark:bg-dark-primary-DEFAULT dark:text-dark-textOnPrimaryDark dark:hover:bg-dark-primary-hover dark:focus:ring-dark-primary-DEFAULT`;
      break;
    case 'secondary':
      variantStyle = `bg-secondary text-neutral-dark hover:bg-secondary-hover focus:ring-secondary
                      dark:bg-dark-secondary-DEFAULT dark:text-dark-textOnSecondaryDark dark:hover:bg-dark-secondary-hover dark:focus:ring-dark-secondary-DEFAULT`;
      break;
    case 'accent':
      variantStyle = `bg-accent text-neutral-dark hover:bg-accent-hover focus:ring-accent
                      dark:bg-dark-accent-DEFAULT dark:text-dark-textOnAccentDark dark:hover:bg-dark-accent-hover dark:focus:ring-dark-accent-DEFAULT`;
      break;
    case 'outline':
      const scheme = colorScheme; 
      // Determine text color for dark mode hover based on scheme
      let darkHoverTextColor = 'dark:hover:text-dark-textOnPrimaryDark'; // Default to primary
      if (scheme === 'secondary') {
        darkHoverTextColor = 'dark:hover:text-dark-textOnSecondaryDark';
      } else if (scheme === 'accent') {
        darkHoverTextColor = 'dark:hover:text-dark-textOnAccentDark';
      }

      variantStyle = `bg-transparent border-2 
                      border-${scheme} text-${scheme} 
                      hover:bg-${scheme} hover:text-neutral-dark 
                      focus:ring-${scheme}
                      dark:border-dark-${scheme}-DEFAULT dark:text-dark-${scheme}-DEFAULT
                      dark:hover:bg-dark-${scheme}-DEFAULT ${darkHoverTextColor}
                      dark:focus:ring-dark-${scheme}-DEFAULT`;
      break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm':
      sizeStyle = 'py-1.5 px-2 text-xs sm:py-2 sm:px-3 sm:text-sm'; // Updated for mobile
      break;
    case 'md':
      sizeStyle = 'py-2.5 px-5 text-base';
      break;
    case 'lg':
      sizeStyle = 'py-3 px-6 text-lg';
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
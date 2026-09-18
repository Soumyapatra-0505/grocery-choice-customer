import React from 'react';

export default function Button({
  children,
  variant = 'primary', // primary | secondary | outline | danger | ghost
  size = 'md',        // sm | md | lg
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  icon = null,
  fullWidth = false,
  ...rest
}) {
  const sizeStyles = {
    sm: { padding: '0.4rem 0.85rem', fontSize: '0.84rem', minHeight: '38px' },
    md: { padding: '0.625rem 1.25rem', fontSize: '0.95rem', minHeight: '44px' },
    lg: { padding: '0.85rem 1.65rem', fontSize: '1.05rem', minHeight: '50px' },
  };

  const style = {
    ...sizeStyles[size],
    width: fullWidth ? '100%' : 'auto',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant} ${className}`}
      style={style}
      {...rest}
    >
      {icon && <span className="btn-icon" style={{ display: 'inline-flex' }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

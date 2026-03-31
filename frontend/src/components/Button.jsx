export const Button = ({ children, variant = 'primary', disabled = false, type = 'button', onClick, className = '', ...props }) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

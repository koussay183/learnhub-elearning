export const Input = ({ type = 'text', placeholder = '', value = '', onChange, error = '', label = '', required = false, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          {label}{required && <span className="text-yellow-400 ml-1">*</span>}
        </label>
      )}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        className={`input-field ${error ? 'border-red-500 focus:border-red-400' : ''} ${className}`}
        {...props} />
      {error && <p className="text-red-400 text-sm mt-1.5">{error}</p>}
    </div>
  );
};

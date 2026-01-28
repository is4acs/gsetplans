// Logo GSET Caraïbes
function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <img
      src="/logo.svg"
      alt="GSET Caraïbes"
      className={`${sizes[size]} ${className} object-contain rounded-xl`}
    />
  );
}

export default Logo;

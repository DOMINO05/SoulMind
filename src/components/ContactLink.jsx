import { useState } from 'react';

const ContactLink = ({ value, type, className }) => {
  const [copied, setCopied] = useState(false);

  const handleClick = (e) => {
    // Check if desktop (using simple width check, e.g. > 768px)
    // Or check if touch device?
    // "Gépen" vs "Telefonon" usually correlates with width in responsive design.
    // Let's use 1024px or 768px.
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches; // Laptops/Desktops usually > 1024

    if (isDesktop) {
      e.preventDefault();
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    // If mobile, let default behavior happen (mailto/tel)
  };

  const href = type === 'email' ? `mailto:${value}` : `tel:${value.replace(/\s/g, '')}`; // clean phone number for tel:

  return (
    <a 
      href={href} 
      onClick={handleClick} 
      className={`${className} cursor-pointer relative group`}
      title={copied ? "Másolva!" : "Kattints a másoláshoz"}
    >
      {value}
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded shadow-lg animate-fade-in whitespace-nowrap">
          Másolva!
        </span>
      )}
    </a>
  );
};

export default ContactLink;

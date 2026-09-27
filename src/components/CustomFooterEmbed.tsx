import React, { useEffect, useRef } from 'react';

interface CustomFooterEmbedProps {
  html?: string | null;
  className?: string;
}

export default function CustomFooterEmbed({ html, className = '' }: CustomFooterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !html || !html.trim()) return;

    // Set the HTML inside container
    containerRef.current.innerHTML = html.trim();

    // Re-create and execute any script tags so dynamic badges/widgets run properly
    const scripts = containerRef.current.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.innerHTML) {
        newScript.innerHTML = oldScript.innerHTML;
      }
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [html]);

  if (!html || !html.trim()) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`custom-footer-embed flex flex-wrap items-center justify-center gap-4 py-2 text-center [&_a]:inline-flex [&_a]:items-center [&_img]:max-h-12 [&_img]:w-auto [&_img]:object-contain hover:[&_img]:opacity-90 transition-opacity ${className}`}
    />
  );
}

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function LandingHero() {
  const containerRef = useRef<HTMLElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const scrollHintRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // A imagem hero.jpg aparece clara com o filtro laranja quente; em seguida o texto entra com fade-in suave
      gsap.fromTo(
        bgImageRef.current,
        { scale: 1.04, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }
      );

      const tl = gsap.timeline({ delay: 0.4 });

      tl.fromTo(
        headlineRef.current,
        { opacity: 0, y: 24, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' }
      )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' },
          '-=0.65'
        )
        .fromTo(
          scrollHintRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.8, ease: 'power2.out' },
          '-=0.4'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="inicio"
      ref={containerRef}
      className="relative h-screen min-h-[680px] w-full p-2.5 sm:p-4 bg-[#050505] select-none"
    >
      {/* Moldura cinematográfica arredondada com filtro laranja quente e sem escurecer a foto */}
      <div className="relative w-full h-full rounded-2xl md:rounded-[26px] overflow-hidden flex flex-col items-center justify-center border border-white/10 bg-[#1a0904]">
        
        {/* 1. Imagem hero.jpg com 100% de opacidade + filtro laranja/âmbar quente */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            ref={bgImageRef}
            src="/hero.jpg"
            alt="Paris Clássica"
            className="w-full h-full object-cover object-center"
          />

          {/* Filtro laranja quente sem escurecer a foto */}
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{
              background:
                'radial-gradient(ellipse 95% 85% at 50% 20%, rgba(255, 115, 50, 0.78) 0%, rgba(230, 75, 25, 0.72) 55%, rgba(185, 50, 15, 0.75) 100%)',
            }}
          />
          <div
            className="absolute inset-0 mix-blend-screen opacity-45"
            style={{
              background:
                'radial-gradient(ellipse 75% 55% at 50% 12%, rgba(255, 130, 45, 0.75) 0%, rgba(235, 70, 20, 0.35) 55%, transparent 100%)',
            }}
          />
        </div>

        {/* 2. Tipografia Editorial Centralizada */}
        <div className="relative z-10 px-6 text-center max-w-3xl mx-auto flex flex-col items-center">
          <h1
            ref={headlineRef}
            className="opacity-0 font-serif text-4xl sm:text-6xl md:text-[68px] text-white font-normal leading-[1.04] tracking-[-0.01em] drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
          >
            Imagine um espaço <br />
            entre a <span className="italic font-normal">memória</span> &amp; a{' '}
            <span className="italic font-normal">eternidade</span>
          </h1>

          <p
            ref={subRef}
            className="opacity-0 mt-4 text-xs sm:text-[13px] text-white/90 font-light tracking-wide max-w-md drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
          >
            Mais de 600 obras clássicas preservadas em domínio público.
          </p>
        </div>

        {/* 3. Indicador minimalista na base */}
        <a
          ref={scrollHintRef}
          href="#historia"
          className="opacity-0 absolute bottom-7 left-1/2 -translate-x-1/2 z-10 text-[11px] text-white/80 hover:text-white font-light tracking-wider transition-colors"
        >
          Role para explorar ↓
        </a>
      </div>
    </section>
  );
}

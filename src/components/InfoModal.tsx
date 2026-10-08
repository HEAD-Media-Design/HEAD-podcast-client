import { useEffect } from "react";

interface InfoModalProps {
  onClose?: () => void;
}

function InfoModal({ onClose }: InfoModalProps) {
  useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="absolute inset-x-0 bottom-0 top-[71px] z-50 overflow-auto bg-[#003FADEB] text-white md:top-[160px]">
      {/* Content */}
      <div className="relative z-10 min-h-full flex flex-col">
        {/* Left padding lines the headline's first glyph up with the header's "Supernova" wordmark
            (padding minus the difference in glyph side bearings), per breakpoint. */}
        {/* Main Content: wide screens use three columns; tablet widths put the headline block on
            its own row with About / Dedication / Credits in three columns below, so nothing overlaps. */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[300px_300px_minmax(0,1fr)] xl:grid-cols-[50%_1fr_1fr] gap-8 md:gap-x-10 md:gap-y-16 xl:gap-[70px] p-8 md:p-12 pl-[6.5px] md:pl-[21.5px] lg:pl-[22.5px]">
          {/* Left Column */}
          <div className="flex flex-col md:col-span-3 xl:col-span-1">
            <h1 className="font-spline-sans-mono text-[32px] md:text-[72px] font-medium leading-[38px] md:leading-[90px] text-left">
              Investigating algorithms and machine learning
            </h1>

            <div className="flex flex-col md:flex-row mt-8 md:mt-[80px] text-left gap-4 md:gap-0">
              <div className="max-w-full md:max-w-[264px]">
                <h2 className="font-spline-sans text-[22px] md:text-[64px] leading-[36px] md:leading-[64px] font-medium">
                  Explore the School
                </h2>
              </div>
              <div className="flex flex-col justify-center font-spline-sans text-[18px] md:text-[36px] leading-[28px] md:leading-[44px]">
                <a
                  href="https://mastermediadesign.ch/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline focus:outline-none"
                >
                  → Media Design
                </a>
                <a
                  href="https://www.hesge.ch/head/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline focus:outline-none"
                >
                  → HEAD-Genève
                </a>
                <a
                  href="https://head-publishing.ch/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline focus:outline-none"
                >
                  → HEAD-Publishing
                </a>
                <a
                  href="https://www.hesge.ch/head/issue/en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline focus:outline-none"
                >
                  → ISSUE Journal
                </a>
                <a
                  href="https://www.sindycat.ch/en/community/overshoot/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline focus:outline-none"
                >
                  → Overshoot
                </a>
              </div>
            </div>
          </div>

          {/* Middle Column (its two blocks become separate grid columns below xl) */}
          <div className="flex flex-col gap-8 md:contents xl:mt-[40px] xl:flex xl:gap-[70px] text-left">
            <div>
              <h2 className="font-spline-sans-mono text-[22px] md:text-[36px] leading-[22px] md:leading-[28px] font-semibold mb-3 md:mb-[26px]">
                About
              </h2>
              <p className="text-white/90 leading-[22px] md:leading-[32px] font-spline-sans text-[16px] md:text-[24px]">
                A collection of student podcasts from the Master Media Design
                theory seminar at HEAD–Genève.
              </p>
            </div>

            <div>
              <h2 className="font-spline-sans-mono text-[22px] md:text-[36px] leading-[22px] md:leading-[28px] font-semibold mb-3 md:mb-[26px]">
                Dedication
              </h2>
              <p className="text-white/90 leading-[22px] md:leading-[32px] font-spline-sans text-[16px] md:text-[24px]">
                In honour of Nicolas Nova, who led this seminar with brilliance
                and passion. His profound impact on this institution and the
                students he mentored continues to resonate through our work.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8 xl:mt-[40px] xl:gap-[70px] text-left">
            <div>
              <h2 className="font-spline-sans-mono text-[22px] md:text-[36px] leading-[22px] md:leading-[28px] font-semibold mb-3 md:mb-[26px]">
                Credits
              </h2>

              <div className="mb-4 md:mb-13 font-spline-sans text-[16px] md:text-[24px] leading-[22px] md:leading-[32px]">
                <h3 className="text-[10px] md:text-[12px] font-bold leading-[18px] md:leading-[22px] tracking-[0.24px]">
                  TEAM
                </h3>
                <ul>
                  <li>Antonin Ricou</li>
                  <li>Haneul Lee</li>
                  <li>Peter Ha</li>
                  <li>Tara Hächler</li>
                </ul>
              </div>

              <div className="font-spline-sans text-[16px] md:text-[24px] leading-[22px] md:leading-[32px]">
                <h3 className="text-[10px] md:text-[12px] font-bold leading-[18px] md:leading-[22px] tracking-[0.24px]">
                  TYPOGRAPHY
                </h3>
                <ul>
                  <li>Spline Sans</li>
                  <li>Spline Sans Mono</li>
                  <li>Generative Type with p5.js</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Get in Touch (below stacked columns; address + IG not duplicated in footer) */}
        <div className="md:hidden pl-[6.5px] pr-8 pb-2 text-left">
          <h2 className="font-spline-sans-mono text-[22px] font-semibold leading-[22px] tracking-tight text-white">
            Get in Touch
          </h2>
          <a
            href="https://www.instagram.com/head_mediadesign/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block font-spline-sans text-[18px] font-normal leading-[28px] text-white no-underline hover:underline focus:outline-none"
          >
            Follow Us on Instagram
          </a>
          <div
            className="mt-6 font-spline-sans text-[18px] font-normal leading-[28px] text-white"
            style={{ lineHeight: 1.35 }}
          >
            <p className="m-0">HEAD — Genève</p>
            <p className="m-0">Avenue de Châtelaine 5</p>
            <p className="m-0">CH-1203 Genève</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-14 pl-[6.5px] md:pl-[21.5px] lg:pl-[22.5px] font-spline-sans-mono text-[16px] leading-[38px] tracking-[-0.32px] text-left md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end xl:items-center gap-2 md:gap-4">
            {/* Below xl: Instagram above a two-line address on the left; xl: one row with the copyright. */}
            <div className="hidden md:flex md:flex-col md:gap-6 xl:contents">
              <a
                href="https://www.instagram.com/head_mediadesign/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline md:leading-[22px] xl:order-2 xl:leading-[38px]"
              >
                Follow us on Instagram
              </a>
              <span className="md:leading-[22px] xl:order-1 xl:leading-[38px]">
                <span className="block xl:inline">HEAD — Genève</span> Avenue de
                Châtelaine 5 CH-1203 Genève
              </span>
            </div>
            <span className="w-full text-center md:mt-0 md:w-auto md:text-left md:leading-[22px] xl:order-3 xl:leading-[38px]">
              <span className="md:hidden block text-[12px] leading-[14px] tracking-[-0.24px]">
                © {new Date().getFullYear()} HEAD — Genève
                <br />
                Haute école d&apos;art et de design
              </span>
              <span className="hidden md:inline">
                © {new Date().getFullYear()} HEAD — Genève, Haute école d'art et
                de design
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfoModal;

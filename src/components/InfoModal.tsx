function InfoModal() {
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-[#003FADEB] text-white z-50 overflow-auto">
      {/* Content */}
      <div className="relative z-10 min-h-full flex flex-col">
        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[50%_1fr_1fr] gap-8 p-8 md:p-12">
          {/* Left Column */}
          <div className="flex flex-col">
            <h1 className="font-spline-sans-mono text-[28px] md:text-[72px] font-medium leading-[36px] md:leading-[90px] text-left">
              The voices of students from HEAD-Genève
            </h1>

            <div className="flex flex-col md:flex-row mt-8 md:mt-[70px] text-left gap-4 md:gap-0">
              <div className="max-w-full md:max-w-[264px]">
                <h2 className="font-spline-sans text-[28px] md:text-[64px] leading-[32px] md:leading-[64px] font-medium">
                  Explore the School
                </h2>
              </div>
              <div className="flex flex-col justify-center font-spline-sans text-[18px] md:text-[36px] leading-[28px] md:leading-[44px]">
                <a
                  href="https://www.hesge.ch/head/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline focus:outline-none"
                >
                  → HEAD-Genève
                </a>
                <a
                  href="#"
                  className="no-underline hover:underline focus:outline-none"
                >
                  → HEAD-Publishing
                </a>
                <a
                  href="#"
                  className="no-underline hover:underline focus:outline-none"
                >
                  → ISSUE Journal
                </a>
                <a
                  href="#"
                  className="no-underline hover:underline focus:outline-none"
                >
                  → Overshoot
                </a>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="flex flex-col gap-8 md:gap-[70px] text-left mt-0 md:mt-[30px]">
            <div>
              <h2 className="font-spline-sans-mono text-[20px] md:text-[36px] leading-[24px] md:leading-[28px] font-semibold mb-3 md:mb-[26px]">
                About
              </h2>
              <p className="text-white/90 leading-[24px] md:leading-[32px] font-spline-sans text-[16px] md:text-[24px]">
                A collection of podcasts created by students during their
                studies at HEAD-Genève.
              </p>
            </div>

            <div>
              <h2 className="font-spline-sans-mono text-[20px] md:text-[36px] leading-[24px] md:leading-[28px] font-semibold mb-3 md:mb-[26px]">
                Dedication
              </h2>
              <p className="text-white/90 leading-[24px] md:leading-[32px] font-spline-sans text-[16px] md:text-[24px]">
                In honour of Nicolas Nova who made an impact on the institution
                and the students he taught.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8 md:gap-[70px] mt-0 md:mt-[30px] text-left">
            <div>
              <h2 className="font-spline-sans-mono text-[20px] md:text-[36px] leading-[24px] md:leading-[28px] font-semibold mb-3 md:mb-[26px]">
                Credits
              </h2>

              <div className="mb-4 md:mb-6 font-spline-sans text-[16px] md:text-[24px] leading-[24px] md:leading-[32px]">
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

              <div className="font-spline-sans text-[16px] md:text-[24px] leading-[24px] md:leading-[32px]">
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

        {/* Footer */}
        <div className="p-8 font-spline-sans-mono text-[12px] md:text-[16px] leading-[24px] md:leading-[38px] tracking-[-0.32px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
            <span>HEAD — Genève Avenue de Châtelaine 5 CH-1203 Genève</span>
            <a
              href="mailto:contact@head-podcasts.ch"
              className="hover:underline"
            >
              contact@head-podcasts.ch
            </a>
            <span>
              © {new Date().getFullYear()} HEAD — Genève, Haute école d'art et
              de design
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfoModal;

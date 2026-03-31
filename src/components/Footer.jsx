import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="divider-neon" />
      
      <div className="container footer__container">
        
        {/* Top Half */}
        <div className="footer__top">
          <div className="footer__brand">
            <h2 className="text-hero" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.02em' }}>
              KS.
            </h2>
            <p className="text-mono" style={{ color: 'var(--white-muted)', marginTop: '8px' }}>
              Parametric Insurance Protocol // 2026
            </p>
          </div>
          
          <div className="footer__links">
            <div className="footer__col">
              <span className="text-label" style={{ color: 'var(--neon)', marginBottom: '16px', display: 'block' }}>Navigation</span>
              <a href="#hero">Manifesto</a>
              <a href="#pillars">Architecture</a>
              <a href="#about">About</a>
            </div>
            <div className="footer__col">
              <span className="text-label" style={{ color: 'var(--neon)', marginBottom: '16px', display: 'block' }}>Legal</span>
              <a href="#">Privacy Protocol</a>
              <a href="#">Smart Contract Terms</a>
              <a href="#">Oracle SLAs</a>
            </div>
            <div className="footer__col">
              <span className="text-label" style={{ color: 'var(--neon)', marginBottom: '16px', display: 'block' }}>Social</span>
              <a href="#">Twitter / X</a>
              <a href="#">LinkedIn</a>
              <a href="#">GitHub</a>
            </div>
          </div>
        </div>
        
        {/* Bottom Half */}
        <div className="footer__bottom">
          <p className="text-mono" style={{ color: 'var(--white-muted)' }}>
            © {new Date().getFullYear()} KavachSathi. All rights reserved.
          </p>
          <div className="footer__status">
            <span className="status-dot" />
            <span className="text-mono" style={{ color: 'var(--white-dim)' }}>SYSTEM OPERATIONAL</span>
          </div>
        </div>
        
      </div>
    </footer>
  );
}

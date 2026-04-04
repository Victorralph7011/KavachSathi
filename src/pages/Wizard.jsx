import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, MessageSquare, Phone } from 'lucide-react';
import './Wizard.css';

export default function Wizard() {
  return (
    <div className="wizard-layout">
      {/* Top Navbar */}
      <nav className="wizard-nav">
        <Link to="/" className="navbar__logo" aria-label="KavachSathi Home">
          <span className="navbar__monogram">KS</span>
          <span className="navbar__logo-dot"></span>
        </Link>

        <div className="wizard-nav__steps">
          <div className="wizard-step active">
            <span className="text-mono step-num">01</span>
            <span className="step-label">Policy</span>
          </div>
          <div className="wizard-step">
            <span className="text-mono step-num">02</span>
            <span className="step-label">Billing</span>
          </div>
          <div className="wizard-step">
            <span className="text-mono step-num">03</span>
            <span className="step-label">Claim</span>
          </div>
        </div>
      </nav>

      <div className="wizard-container">
        {/* Deep Slate Charcoal Sidebar */}
        <aside className="wizard-sidebar">
          
          <div className="sidebar-menu">
            <button className="sidebar-item active">
              <span className="sidebar-item__label">Policy Info</span>
              <div className="sidebar-item__indicator" />
            </button>
            <button className="sidebar-item">
              <span className="sidebar-item__label">Gig Worker Line</span>
            </button>
            <button className="sidebar-item">
              <span className="sidebar-item__label">Driver</span>
            </button>
            <button className="sidebar-item">
              <span className="sidebar-item__label">Vehicle</span>
            </button>
            <button className="sidebar-item">
              <span className="sidebar-item__label">Coverages</span>
            </button>
            <button className="sidebar-item">
              <span className="sidebar-item__label">Quote Details</span>
            </button>
          </div>

          <div className="sidebar-help glass">
            <span className="text-label" style={{ color: 'var(--white)' }}>Get Help</span>
            <button className="help-btn">
              <MessageSquare size={16} />
              <span>Chat now</span>
            </button>
            <button className="help-btn">
              <Phone size={16} />
              <span className="text-mono">1-800-KAVACH</span>
            </button>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="wizard-main">
          {/* Asymmetric grid decoration */}
          <div className="wizard-main__bg">
            <div className="grid-line v-line-1" />
            <div className="grid-line h-line-1" />
          </div>

          <div className="wizard-panel glass">
            <div className="wizard-panel__header">
              <span className="text-mono" style={{ color: 'var(--white-muted)' }}>Policy Information</span>
              <h1 className="wizard-panel__title text-heading">Policy Information</h1>
            </div>

            <div className="wizard-form">
              {/* Left Column */}
              <div className="wizard-form__col">
                <div className="form-group-title text-label" style={{ color: 'var(--white)' }}>Policy Details</div>
                
                <div className="form-field has-dropdown active-dropdown">
                  <label className="text-mono neon-text">* termType</label>
                  <div className="input-wrap">
                    <input type="text" value="Weekly" readOnly />
                    <ChevronDown size={16} color="var(--neon)" />
                  </div>
                  {/* Stylized Dropdown Overlay */}
                  <div className="dropdown-menu glass-strong">
                    <div className="dropdown-bg-mesh" />
                    <button className="dropdown-item active">Weekly</button>
                  </div>
                </div>

                <div className="form-field">
                  <label className="text-mono neon-text">periodStart</label>
                  <div className="input-wrap">
                    <input type="text" defaultValue="Jul 5, 2026" />
                  </div>
                </div>

                <div className="form-field">
                  <label className="text-mono neon-text">periodEnd</label>
                  <div className="input-wrap">
                    <input type="text" defaultValue="Jul 12, 2026" />
                  </div>
                </div>

                <div className="form-field has-error">
                  <label className="text-mono amber-text">* baseState</label>
                  <div className="input-wrap">
                    <input type="text" defaultValue="California" />
                  </div>
                  <span className="error-text text-mono">Oracle compliance verified. Action needed.</span>
                </div>

                <div className="form-field">
                  <label className="text-mono neon-text">* primaryInsured</label>
                  <div className="input-wrap">
                    <input type="text" defaultValue="David Woods" />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="wizard-form__col">
                <div className="form-group-title text-label" style={{ color: 'var(--white)' }}>Additional Details</div>
                
                <div className="form-field">
                  <label className="text-mono neon-text">* uwCompany</label>
                  <div className="input-wrap">
                    <input type="text" defaultValue="Default" />
                  </div>
                </div>

                <div className="form-field">
                  <label className="text-mono neon-text">* organization</label>
                  <div className="input-wrap">
                    <input type="text" defaultValue="Armstrong and Company" />
                  </div>
                </div>

                <div className="form-field">
                  <label className="text-mono neon-text">* producerCode</label>
                  <div className="input-wrap">
                    <input type="text" defaultValue="100-002541" />
                  </div>
                </div>

                <div className="form-field">
                  <label className="text-mono neon-text">* policyAddress</label>
                  <div className="input-wrap">
                    <input type="text" defaultValue="7711 Country Road, UCASSVILLE, WI 53806-9663" />
                  </div>
                </div>
              </div>
            </div>

            <div className="wizard-panel__footer">
              <button className="btn-cancel text-mono">Cancel</button>
              <div className="wizard-panel__actions">
                <button className="btn-save glass text-label">Save Policy Information</button>
                <button className="btn-continue text-label">Continue</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import { useRef, useEffect, useState, useMemo } from 'react';
import { Map, Marker, Popup } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Approximate geographic center of India for mapping fallback
const INDIA_CENTER = [78.9629, 20.5937]; // [Longitude, Latitude]

// Heuristic coordinate extraction logic
function getCoordinates(claim) {
  if (!claim) return INDIA_CENTER;
  
  if (claim.origin_coords) return claim.origin_coords;
  if (claim.base_state_coords) return claim.base_state_coords;

  const context = `${claim.reason || ''} ${claim.event || ''} ${claim.city || ''}`.toLowerCase();
  if (context.includes('mumbai')) return [72.8777, 19.0760];
  if (context.includes('delhi')) return [77.2090, 28.6139];
  if (context.includes('bengaluru') || context.includes('bangalore')) return [77.5946, 12.9716];
  if (context.includes('chennai')) return [80.2707, 13.0827];
  if (context.includes('hyderabad')) return [78.4867, 17.3850];
  
  return INDIA_CENTER;
}

export default function TacticalMap({ activeClaim }) {
  const mapRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);

  const coords = useMemo(() => getCoordinates(activeClaim), [activeClaim]);

  // Handle the 'Fly-To' Animation
  useEffect(() => {
    if (!mapRef.current || !activeClaim) return;
    mapRef.current.flyTo({
      center: coords,
      zoom: coords === INDIA_CENTER ? 4 : 12,
      pitch: 45,
      bearing: -10,
      essential: true,
      duration: 2000 // High-speed cinematic swoop
    });
    setShowPopup(true);
  }, [activeClaim, coords]);

  return (
    <div className="relative w-full h-[500px] lg:h-full min-h-[500px] rounded-2xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: coords[0],
          latitude: coords[1],
          zoom: coords === INDIA_CENTER ? 4 : 12,
          pitch: 45,
          bearing: -10,
        }}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        style={{ width: '100%', height: '100%' }}
      >
        {activeClaim && (
          <Marker longitude={coords[0]} latitude={coords[1]} anchor="center">
            <div className="relative flex items-center justify-center pointer-events-none">
              {/* Breach Zone: Rhythmic pulsing orbit representing environmental hazard */}
              <div style={{ animation: 'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} className="absolute w-32 h-32 bg-[#FF6B00]/10 rounded-full border border-[#FF6B00]/20" />
              <div style={{ animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite delay-150' }} className="absolute w-16 h-16 bg-[#FF6B00]/20 rounded-full border border-[#FF6B00]/20" />
              {/* Rider / Focus Marker Core */}
              <div className="w-4 h-4 bg-[#FF6B00] rounded-full shadow-[0_0_15px_#FF6B00]" />
            </div>
          </Marker>
        )}

        {activeClaim && showPopup && (
          <Popup
            longitude={coords[0]}
            latitude={coords[1]}
            anchor="bottom"
            onClose={() => setShowPopup(false)}
            closeButton={false}
            offset={20}
            className="z-50"
            style={{ zIndex: 50 }}
          >
            <div className="bg-white/40 backdrop-blur-2xl border border-white/40 rounded-xl px-5 py-4 w-60 shadow-[0_12px_32px_rgba(0,0,0,0.15)] font-['Inter',sans-serif]">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#0F172A]/10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-[#0F172A] tracking-widest uppercase">
                  {(activeClaim.event || 'Breach Detection').substring(0, 20)}
                </span>
              </div>
              <p className="text-xl font-bold text-[#1A1A1A] mb-1">
                ₹{(activeClaim.payoutAmount || 250).toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-slate-600 mb-2 leading-relaxed">
                {activeClaim.reason || 'Threshold broken.'}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-[#0F172A]/10">
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Tx ID</span>
                 <span className="text-[11px] font-mono font-bold text-[#0F172A]">
                    {(activeClaim.id || activeClaim.paymentId || 'SYS-993').substring(0,8).toUpperCase()}
                 </span>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Atmospheric UI Vignettes (Premium Cinematic Styling) */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0F172A]/50 to-transparent pointer-events-none z-0" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0F172A]/20 to-transparent pointer-events-none z-0" />
      
      {/* Tactical Badge Overlay */}
      <div className="absolute top-5 left-5 z-20 pointer-events-none">
         <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/40 backdrop-blur-md rounded-lg border border-white/40 text-[10px] font-bold text-[#0F172A] tracking-[0.1em] uppercase shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
            Live Tactical Feed
         </span>
      </div>
    </div>
  );
}

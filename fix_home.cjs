const fs = require('fs');
let code = fs.readFileSync('app/HomeClient.tsx', 'utf8');
code = code.replace(/\r\n/g, '\n');

// 1. Remove the mid-page tabs+tags widget (the entire div block after the hero slider)
// It starts with the WIDGET comment and ends before the main content area comment
const midWidgetStart = '\n      {/* ── WIDGET: Edge-to-Edge Popular Tags Navigation ─ */}';
const midWidgetEnd = '\n      </div>';

const startIdx = code.indexOf(midWidgetStart);
if (startIdx === -1) {
  console.error('Mid widget start not found');
  // Try alternate text
  const alt = '\n      {/* ── WIDGET: Edge-to-Edge Tabs';
  const altIdx = code.indexOf(alt);
  console.log('Alt search result:', altIdx);
  process.exit(1);
}

// Find the closing div - it ends with the </div> that closes the tags widget
// The next section is the Main Content Area
const mainContentMarker = '\n      {/* ── Main Content Area';
const mainIdx = code.indexOf(mainContentMarker, startIdx);
if (mainIdx === -1) {
  console.error('Main content area not found');
  process.exit(1);
}

// Remove everything from midWidgetStart to mainIdx
code = code.slice(0, startIdx) + '\n' + code.slice(mainIdx);

// 2. Fix pb-28 on main (restore it since bottom nav is staying)  
// Check if it's already removed
if (!code.includes('pb-28')) {
  code = code.replace(
    '<main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">',
    '<main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">'
  );
}

// 3. Re-add the fixed bottom nav before the closing </div>
const target = '      </footer>\n    </div>\n  );\n}';
const hasNav = code.includes('fixed bottom-0');
if (!hasNav) {
  const replacement = `      </footer>\n\n      {/* ── Fixed Bottom Navigation Bar (always visible while scrolling) ── */}\n      <nav className="fixed bottom-0 left-0 right-0 z-[2000] bg-[#0c0c0c]/95 backdrop-blur-md border-t border-stone-800 shadow-2xl shadow-black/60">\n        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-2 sm:gap-3">\n          <button\n            onClick={() => setActiveTab('latest')}\n            className={\`flex-1 max-w-[160px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-black transition cursor-pointer \${\n              activeTab === 'latest'\n                ? 'bg-orange-500 text-stone-950 shadow-lg shadow-orange-500/30'\n                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800 hover:border-stone-700'\n            }\`}\n          >\n            <Flame className="w-4 h-4" />\n            <span>Latest Drops</span>\n          </button>\n          <button\n            onClick={() => setActiveTab('videos')}\n            className={\`flex-1 max-w-[160px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-black transition cursor-pointer \${\n              activeTab === 'videos'\n                ? 'bg-orange-500 text-stone-950 shadow-lg shadow-orange-500/30'\n                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800 hover:border-stone-700'\n            }\`}\n          >\n            <VideoIcon className="w-4 h-4" />\n            <span>Full Videos</span>\n          </button>\n          <button\n            onClick={() => setActiveTab('photos')}\n            className={\`flex-1 max-w-[160px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-black transition cursor-pointer \${\n              activeTab === 'photos'\n                ? 'bg-orange-500 text-stone-950 shadow-lg shadow-orange-500/30'\n                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800 hover:border-stone-700'\n            }\`}\n          >\n            <ImageIcon className="w-4 h-4" />\n            <span>Photo Leaks</span>\n          </button>\n        </div>\n      </nav>\n    </div>\n  );\n}`;
  
  if (!code.includes(target)) {
    console.error('Footer closing target not found');
    process.exit(1);
  }
  code = code.replace(target, replacement);
}

fs.writeFileSync('app/HomeClient.tsx', code, 'utf8');
console.log('Done.');
console.log('- Mid widget removed:', !code.includes('Edge-to-Edge Popular Tags Navigation'));
console.log('- Bottom nav present:', (code.match(/fixed bottom-0/g)||[]).length);
console.log('- pb-28 on main:', code.includes('pb-28'));

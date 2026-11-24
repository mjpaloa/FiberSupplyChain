import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const frontendDir = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(frontendDir, 'src');

function read(rel) {
  return fs.readFileSync(path.join(frontendDir, rel), 'utf8');
}

// 1. Typography tokens in index.html & tailwind.config.js
const indexHtml = read('index.html');
assert.ok(/Playfair[+ ]Display/.test(indexHtml), 'index.html must load Playfair Display font');
assert.ok(/Plus[+ ]Jakarta[+ ]Sans/.test(indexHtml), 'index.html must load Plus Jakarta Sans font');

const tailwindCfg = read('tailwind.config.js');
assert.ok(tailwindCfg.includes('Playfair Display'), 'tailwind.config.js must configure serif font');
assert.ok(tailwindCfg.includes('Plus Jakarta Sans'), 'tailwind.config.js must configure sans font');

// 2. Scoped portal CSS & accessibility rules in index.css
const indexCss = read('src/index.css');
assert.ok(indexCss.includes('.editorial-portal'), 'index.css must define .editorial-portal');
assert.ok(indexCss.includes('forced-colors: active'), 'index.css must support forced-colors mode');
assert.ok(indexCss.includes('.table-wrapper'), 'index.css must define .table-wrapper');

// 3. All 4 portal shells must use EditorialShell and zero dark slate sidebars
const portalShells = [
  'src/components/MAO/MAODashboard.tsx',
  'src/components/Association/CUSAFADashboard.tsx',
  'src/components/Farmers/FarmerDashboard.tsx',
  'src/components/Buyers/BuyerDashboard.tsx',
];

for (const shell of portalShells) {
  const code = read(shell);
  assert.ok(code.includes('EditorialShell'), `${shell} must use EditorialShell`);
  assert.ok(!code.includes('from-slate-800'), `${shell} must not contain dark slate sidebar`);
  assert.ok(!code.includes('to-slate-900'), `${shell} must not contain dark slate sidebar`);
}

// 4. Zero rainbow gradient KPI cards across active dashboard files
const activeFiles = [
  'components/MAO/MAODashboard.tsx',
  'components/MAO/UserManagement.tsx',
  'components/MAO/AssociationSeedlingManagement.tsx',
  'components/MAO/PlantedSeedlings.tsx',
  'pages/MonitoringPage.tsx',
  'components/MAO/MonitoringDashboard.tsx',
  'components/MAO/MonitoringForm.tsx',
  'pages/MAOHarvestVerificationPage.tsx',
  'components/MAO/UnifiedSalesManagement.tsx',
  'components/MAO/SalesVerificationDashboard.tsx',
  'components/MAO/SalesAnalyticsDashboard.tsx',
  'components/MAO/UserAnalyticsDashboard.tsx',
  'components/MAO/RegistrationTrendsChart.tsx',
  'components/Shared/BuyerPriceListingsViewer.tsx',
  'components/MAO/DeliveryTrackingMonitor.tsx',
  'components/MAO/ArticleManagement.tsx',
  'components/MAO/TeamManagement.tsx',
  'components/MAO/OfficerManagement.tsx',
  'components/MAO/CreateOfficerModal.tsx',
  'components/MAO/ActivityLogsManagement.tsx',
  'components/MAO/MaintenanceToggle.tsx',
  'components/MAO/ProfileCompletion.tsx',
  'components/Association/CUSAFADashboard.tsx',
  'components/Association/AssociationInventory.tsx',
  'components/Association/AssociationSeedlingDistribution.tsx',
  'components/MAO/CUSAFAInventory.tsx',
  'components/Association/CUSAFAFiberDeliveries.tsx',
  'components/Association/AssociationProfile.tsx',
  'components/Association/EditAssociationProfile.tsx',
  'components/Association/ChangePassword.tsx',
  'components/Farmers/FarmerDashboard.tsx',
  'components/Farmers/FarmerMonitoringView.tsx',
  'components/Farmers/FarmerHarvestView.tsx',
  'pages/HarvestSubmissionPage.tsx',
  'components/Farmers/FarmerDeliveryTracking.tsx',
  'components/Farmers/SalesReportsList.tsx',
  'components/Farmers/SalesReportForm.tsx',
  'components/Farmers/FarmerProfile.tsx',
  'components/Farmers/EditFarmerProfile.tsx',
  'components/Farmers/FarmerChangePassword.tsx',
  'components/Buyers/BuyerDashboard.tsx',
  'components/Buyers/BuyerAnalytics.tsx',
  'components/Buyers/BuyerInventory.tsx',
  'components/Buyers/BuyerPriceListings.tsx',
  'components/Buyers/BuyerPriceListingFormWithClasses.tsx',
  'components/Buyers/FiberPurchaseForm.tsx',
  'components/Buyers/BuyerSalesPage.tsx',
  'components/Buyers/BuyerTransactions.tsx',
  'components/Buyers/BuyerProfile.tsx',
];

const loudGradientRegex = /bg-gradient-to-(br|r|b)\s+from-(blue|purple|orange|pink|indigo|cyan|teal|emerald|amber|yellow|red|rose|slate)-(400|500|600|700|800|900)/g;
const violations = [];

for (const rel of activeFiles) {
  const code = fs.readFileSync(path.join(srcDir, rel), 'utf8');
  const matches = code.match(loudGradientRegex);
  if (matches && matches.length > 0) {
    violations.push(`${rel}: ${matches.length} loud gradient(s) [${matches.slice(0, 3).join(', ')}]`);
  }
}

assert.equal(
  violations.length,
  0,
  `Expected zero loud gradient classes in active portal files, found:\n${violations.join('\n')}`
);

console.log(`PASS: Verified fonts, CSS tokens, 4 EditorialShell portals, and 0 loud gradients across ${activeFiles.length} files.`);

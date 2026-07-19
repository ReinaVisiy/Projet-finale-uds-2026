const fs = require('fs');
const path = require('path');

const previewPath = path.join(__dirname, 'preview.html');
let previewContent = fs.readFileSync(previewPath, 'utf8');

const componentsToInject = [
  { file: 'LoginPage.jsx', name: 'LoginPage', styleName: 'loginPageStyles' },
  { file: 'UserProfile.jsx', name: 'UserProfile', styleName: 'userProfileStyles' },
  { file: 'NotificationsCenter.jsx', name: 'NotificationsCenter', styleName: 'notifCenterStyles' },
  { file: 'AdminDashboard.jsx', name: 'AdminDashboard', styleName: 'adminDashStyles' },
  { file: 'SalesHistory.jsx', name: 'SalesHistory', styleName: 'salesHistStyles' },
  { file: 'StockAlerts.jsx', name: 'StockAlerts', styleName: 'stockAlertStyles' },
  { file: 'ModerationPanel.jsx', name: 'ModerationPanel', styleName: 'modPanelStyles' }
];

let injectedComponentsCode = '';

for (const comp of componentsToInject) {
  const compPath = path.join(__dirname, 'src', 'components', comp.file);
  let content = fs.readFileSync(compPath, 'utf8');

  // Remove imports
  content = content.replace(/^import\s+.*?;\s*$/gm, '');
  content = content.replace(/^import\s+.*?\s+from\s+.*?;\s*$/gm, '');

  // Change export default function to function
  content = content.replace(/export\s+default\s+function\s+/, 'function ');

  // Rename styles
  content = content.replace(/const\s+styles\s*=\s*\{/g, `const ${comp.styleName} = {`);
  content = content.replace(/styles\./g, `${comp.styleName}.`);

  injectedComponentsCode += `\n\n// --- INJECTED: ${comp.name} ---\n` + content;
}

// Inject before MAIN APP CONTAINER
const appContainerMarker = '// --- 8. MAIN APP CONTAINER ---';
if (previewContent.includes(appContainerMarker)) {
  previewContent = previewContent.replace(appContainerMarker, injectedComponentsCode + '\n\n    ' + appContainerMarker);
} else {
  console.error("Could not find app container marker.");
}

// Update switch cases
const switchInjectionMarker = '          default:';
const newCases = `
          case 'seller-dashboard':
            return <SellerDashboard onNavigate={(s) => setScreen(s)} />;
          case 'user-profile':
            return <UserProfile onBack={() => setScreen('home')} />;
          case 'notifications':
            return <NotificationsCenter onBack={() => setScreen('home')} />;
          case 'login-page':
            return <LoginPage onLoginSuccess={() => setScreen('home')} onNavigateToRecovery={() => setScreen('recovery')} onNavigateToRegister={() => alert('Wizard inscription non connecté')} />;
          case 'admin-dashboard':
            return <AdminDashboard onNavigate={(s) => setScreen(s)} />;
          case 'sales-history':
            return <SalesHistory onBack={() => setScreen('seller-dashboard')} />;
          case 'stock-alerts':
            return <StockAlerts onBack={() => setScreen('seller-dashboard')} />;
          case 'moderation-panel':
            return <ModerationPanel onBack={() => setScreen('seller-dashboard')} />;
`;

if (previewContent.includes(switchInjectionMarker)) {
  previewContent = previewContent.replace(switchInjectionMarker, newCases + '          default:');
} else {
  console.error("Could not find switch injection marker.");
}

fs.writeFileSync(previewPath, previewContent, 'utf8');
console.log("Successfully updated preview.html with remaining 7 components and routing.");

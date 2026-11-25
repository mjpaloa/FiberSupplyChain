import React from 'react';
import { UserManualView, ManualSection } from '../Shared/UserManualView';

// ponytail: static content, edit this array to update the Buyer manual. No CMS needed.
const SECTIONS: ManualSection[] = [
  {
    id: 'login', group: 'Getting Started', title: 'Buyer Sign In & Create Account', image: '01-login',
    intro: 'Open /buyer-login, enter your Email Address and Password, then click Sign In as Buyer. This page is protected by reCAPTCHA.',
    points: [
      'Use the eye icon in the password field to show or hide your password.',
      'If you are registering a new trading business, select the Create Account tab (requires a valid business permit and MAO verification).',
      'Back to Home – return to the public homepage, or use the Buyer / Farmer / Association switcher at the top-right.',
    ],
  },
  {
    id: 'dashboard', group: 'General', title: 'Dashboard', image: '02-dashboard',
    intro: 'Real-time overview of total purchase spending, sales revenue, fiber volume, and net profit.',
    points: [
      'Performance Overview (with YEAR filter): Total Spent (All Time), Total Sales Revenue, Total Fiber Volume (kg), and Net Profit.',
      'Fiber Analytics: breakdown of MY PURCHASES and MY SALES by fiber class, plus Analysis & Recommendation.',
      'Spending chart: switch between Monthly or Yearly to track purchase expenses over time.',
      'Click Refresh at the top-right to update your analytics.',
    ],
  },
  {
    id: 'inventory', group: 'Inventory & Pricing', title: 'My Inventory', image: '03-inventory',
    intro: 'Track remaining fiber stock by class (Class A, Class B, Class C) and record direct sales.',
    points: [
      'Top summary cards: Total Stock (kg), Inventory Worth (₱), Total Sales Revenue (₱), and Active Classes.',
      'Grade cards (Class A, Class B, Class C): display AVAILABLE STOCK, Purchases count, Avg. Price, and ESTIMATED VALUE.',
      'Click the green Sell Fiber button on any card with available stock to record a sale (disabled as Out of Stock when 0.00 kg).',
    ],
  },
  {
    id: 'price-listings', group: 'Inventory & Pricing', title: 'My Price Listings', image: '04-price-listings',
    intro: 'Manage public buying offers visible to farmers, associations, and MAO officers.',
    points: [
      'Top cards: your current average buying rates for Class A (Premium), Class B (Standard), and Class C (Basic Quality).',
      'Click + Create New Listing to publish new prices (see Action Buttons).',
      'Filters: Search company, quality, or location..., All Qualities, and All Status.',
      'Table columns: COMPANY, CLASS & PRICE, CONTACT, LOCATION, STATUS, and ACTIONS (view 👁, edit ✏, delete 🗑).',
    ],
  },
  {
    id: 'purchase-fiber', group: 'Purchasing & Ledger', title: 'Purchase Fiber', image: '05-purchase-fiber',
    intro: 'Record new abaca fiber purchases directly from verified farmers.',
    points: [
      'Purchase Details: enter Price (₱/kg)*, Contact Number*, Farmer\'s Name*, Abaca Fiber Quality*, Quantity (kg)*, and Variety*.',
      'The system automatically calculates TOTAL PURCHASE PRICE (Unit price × Quantity).',
      'Upload Image (Optional): attach a fiber photo (PNG or JPG up to 5MB) before saving the purchase below.',
    ],
  },
  {
    id: 'transactions', group: 'Purchasing & Ledger', title: 'Transactions', image: '06-transactions',
    intro: 'Complete ledger of all purchases, direct sales, and net profit with CSV/PDF export.',
    points: [
      'Top KPI strip: Total Transactions, Total Sales, Total Purchases, and Net Profit.',
      'Filters & Export: Search by name, ID, quality, variety..., All Types (Sale / Purchase), All Status, and green CSV / PDF download buttons.',
      'Sortable Transaction Ledger: click column headers (TYPE, ID, NAME, QUALITY, QUANTITY, TOTAL PRICE, DATE) to sort; use 👁 or 🗑 under ACTIONS.',
    ],
  },
  {
    id: 'profile', group: 'Account & Profile', title: 'Buyer Profile', image: '07-profile',
    intro: 'Open the profile menu at the bottom-left of the sidebar and select View Profile to check company and security settings.',
    points: [
      'Header card: Verified status, Member since date, and Edit Profile button at the top-right.',
      'Security Settings: use Change Password to update your buyer account password.',
      'Company Information: Company Name, Contact Person, Email Address, Phone Number, Complete Address, Municipality, Barangay, Business Permit No., and Payment Terms.',
      'Right panel: Profile Picture (click photo to upload), Account Status (Active & Verified), and marketplace Visibility info.',
    ],
  },
  {
    id: 'btn-create-listing', group: 'Action Buttons', title: 'Create Price Listing (My Price Listings)', image: '08-btn-create-listing',
    intro: 'Click + Create New Listing in My Price Listings to post public buying rates.',
    points: [
      'Note the Public Listing notice: listings are visible to farmers, associations, and MAO officers.',
      'Company Information: fill out Company Name*, Contact Person*, Phone Number*, Email Address*, Municipality*, Barangay*, and Complete Address / Location*.',
      'Abaca Classes & Pricing: enable Class A, Class B, or Class C and enter your price per kilogram before submitting.',
      'Use X at the top-right to close without publishing.',
    ],
  },
  {
    id: 'btn-sell-fiber', group: 'Action Buttons', title: 'Sell Fiber (My Inventory)', image: '10-btn-sell-fiber',
    intro: 'Click Sell Fiber on any class card with available stock to record a direct sale.',
    points: [
      'The top banner displays how many kilograms of Available stock remain for the selected class.',
      'Enter QUANTITY (KG)* (must not exceed available stock), PRICE PER KG (₱)*, BUYER NAME*, and optional NOTES.',
      'TOTAL AMOUNT is shown automatically in green before you click Complete Sale (or Cancel to discard).',
    ],
  },
];

const BUTTON_LEGEND: [string, string][] = [
  ['Refresh', 'Reload the latest data (top-right of every page).'],
  ['+ Create New Listing', 'Publish new Class A / B / C buying prices in My Price Listings.'],
  ['Sell Fiber', 'Record a direct sale from available stock in My Inventory.'],
  ['CSV / PDF', 'Download the Transaction Ledger report on the Transactions page.'],
  ['View Details (👁)', 'Inspect details or receipts for a price listing or transaction row.'],
  ['Edit (✏) / Delete (🗑)', 'Update or remove a price listing or ledger entry.'],
  ['X / Cancel', 'Close the popup without saving changes.'],
];

const BuyerUserManual: React.FC = () => (
  <UserManualView
    imgBase="/assets/manual/buyer"
    sections={SECTIONS}
    buttonLegend={BUTTON_LEGEND}
    legendGroup="Action Buttons"
  />
);

export default BuyerUserManual;

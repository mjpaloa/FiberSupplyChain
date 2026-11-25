import React from 'react';
import { UserManualView, ManualSection } from '../Shared/UserManualView';

// ponytail: static content, edit this array to update the CUSAFA manual. No CMS needed.
const SECTIONS: ManualSection[] = [
  {
    id: 'login', group: 'Getting Started', title: 'Association Sign In', image: '01-login',
    intro: 'Open /cusafa-login, enter the officer Email Address and Password, then click Sign In as Officer. This page is protected by reCAPTCHA.',
    points: [
      'Use the eye icon in the password field to show or hide your password.',
      'For new officer accounts, open the Create Account tab (MAO admin approval is required before activation).',
      'Back to Home – return to the public homepage, or use the Buyer / Farmer / Association switcher at the top-right.',
    ],
  },
  {
    id: 'overview', group: 'General', title: 'Overview', image: '02-overview',
    intro: 'Summary of association seedling allocations, farmer distributions, planting progress, and fiber deliveries.',
    points: [
      'Summary cards: Seedlings Received, Seedlings Distributed, Inventory Remaining, and Planting Progress.',
      'Seedling Distributions chart: switch between Monthly or Yearly to compare received vs distributed to farmers.',
      'Delivery Status chart: view Total Deliveries (Completed, Delivered, In Transit, Cancelled) and Total Fiber (kg).',
      'Click Refresh at the top-right whenever you need the latest data.',
    ],
  },
  {
    id: 'seedling-inventory', group: 'Seedlings', title: 'Seedling Inventory', image: '03-seedling-inventory',
    intro: 'Review seedling allocations received from MAO and distribute them to member farmers.',
    points: [
      'Cards: Total Received, Completely Distributed, and Remaining Stock.',
      'Search by variety, supplier... and use the All Status dropdown to filter records.',
      'When seedlings are in inventory, click View Details (👁) to inspect a batch or Distribute to Farmer to allocate stock to a member.',
    ],
  },
  {
    id: 'distribution', group: 'Seedlings', title: 'Farmer Distribution', image: '04-distribution',
    intro: 'Track distributed seedlings and each farmer\'s planting status.',
    points: [
      'Cards: Total Distributions, Planted, and Total Seedlings.',
      'Filters: Search variety or farmer..., All Status dropdown, and Show entries selector (10 / 20 / 50).',
      'New farmer seedling distributions are created from the Seedling Inventory page.',
    ],
  },
  {
    id: 'fiber-inventory', group: 'Fiber & Market', title: 'Fiber Inventory', image: '05-fiber-inventory',
    intro: 'Monitor harvested dry fiber stock from members that is ready for delivery to buyers.',
    points: [
      'Cards: Total Stock (kg), In Stock (available for delivery), and Total Items (harvest entries).',
      'Filters: Search farmer or variety..., All Status, All Varieties, and Show entries dropdown.',
      'When stock is listed, you can create a new buyer delivery directly from an inventory item.',
    ],
  },
  {
    id: 'fiber-deliveries', group: 'Fiber & Market', title: 'Fiber Deliveries', image: '06-fiber-deliveries',
    intro: 'Track active, delivered, and completed fiber shipments to buyers.',
    points: [
      'Cards: Total Deliveries, In Transit, Delivered, Completed, and Total Fiber (kg).',
      'Status tabs: All Deliveries, In Transit, Delivered, Completed, Cancelled, plus Search farmers, buyers, variety, location....',
      'Table columns: BUYER / FARMER, VARIETY, QTY, DATE, STATUS, PROGRESS bar, and ACTIONS (View Details 👁 or Delete 🗑).',
      'Click Export CSV to download delivery records.',
    ],
  },
  {
    id: 'buyer-prices', group: 'Fiber & Market', title: 'Buyer Price Listings', image: '07-buyer-prices',
    intro: 'View current abaca buying rates published by verified fiber buyers.',
    points: [
      'Top KPI strip: Active Listings, Available Buyers, Top Class A Offer, and Top Class B Offer.',
      'Class A, Class B, and Class C ranking cards – the highest price per kg appears at the top.',
      'Filters: Search company, municipality..., All Types, All Municipalities, and All Status. Read-only to help you select buyers.',
    ],
  },
  {
    id: 'profile', group: 'Account & Profile', title: 'Association Profile', image: '08-profile',
    intro: 'Open the profile menu at the bottom-left of the sidebar and select View Profile to inspect officer credentials.',
    points: [
      'Displays Verified / Active status, EMAIL, CONTACT, ADDRESS, ASSOCIATION, POSITION, and Valid ID preview.',
      'Click Edit Profile on the right to update your details, or Back to Dashboard to return.',
    ],
  },
  {
    id: 'edit-profile', group: 'Account & Profile', title: 'Edit Profile', image: '09-edit-profile',
    intro: 'Update officer photo, personal details, association info, and valid ID.',
    points: [
      'Upload New Picture – change your profile photo (JPG, PNG, or GIF, max 5MB).',
      'Edit Full Name, Contact Number, Position, Association Name, Address, and Valid ID Photo.',
      'Click Back to Profile to return without saving changes.',
    ],
  },
  {
    id: 'change-password', group: 'Account & Profile', title: 'Change Password', image: '10-change-password',
    intro: 'Update your account password from the profile menu at the bottom-left of the sidebar.',
    points: [
      'Enter Current Password, New Password, and Confirm New Password (use the eye icon to preview).',
      'Password requirements: at least 8 characters, one uppercase letter, one lowercase letter, and one number.',
      'Click Change Password to save, or Cancel / Back to Profile to go back.',
    ],
  },
  {
    id: 'btn-delivery-view', group: 'Action Buttons', title: 'View Delivery Details (Fiber Deliveries)', image: '15-btn-delivery-view',
    intro: 'Click the eye icon (👁) under ACTIONS in Fiber Deliveries to view the full shipment record.',
    points: [
      'Delivery Summary: Variety, Quantity (kg), Date Created, and Status pill.',
      'Farmer Information: name, contact number, barangay, and municipality.',
      'Buyer Information and Logistics Information: buyer name, contact, address, and transport details.',
      'Click X at the top-right to close the popup.',
    ],
  },
];

const BUTTON_LEGEND: [string, string][] = [
  ['Refresh', 'Reload the latest data (top-right of every page).'],
  ['Export CSV', 'Download the Fiber Deliveries list as a CSV file.'],
  ['View Details (👁)', 'Open complete details for a seedling batch, distribution, or fiber delivery.'],
  ['Distribute to Farmer', 'In Seedling Inventory (when stock is available): allocate seedlings to a farmer.'],
  ['Create Delivery', 'In Fiber Inventory (when stock is available): record a buyer delivery.'],
  ['Delete (🗑)', 'Delete a distribution or delivery record after confirmation.'],
  ['X / Cancel / Back', 'Close the popup or return without saving changes.'],
];

const CUSAFAUserManual: React.FC = () => (
  <UserManualView
    imgBase="/assets/manual/cusafa"
    sections={SECTIONS}
    buttonLegend={BUTTON_LEGEND}
    legendGroup="Action Buttons"
  />
);

export default CUSAFAUserManual;

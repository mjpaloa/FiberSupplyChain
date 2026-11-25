import React from 'react';
import { UserManualView, ManualSection } from '../Shared/UserManualView';

// ponytail: static content, edit this array to update the manual. No CMS needed.
const SECTIONS: ManualSection[] = [
  {
    id: 'login', group: 'Getting Started', title: 'Sign In', image: '01-login',
    intro: 'Open /mao, enter your Email Address and Password, then click Sign In to Admin Portal. This page is protected by reCAPTCHA.',
    points: [
      'Use the eye icon in the password field to show or hide your password.',
      'Back to Home – return to the public homepage.',
      'After signing in, you will be redirected to Overview.',
    ],
  },
  {
    id: 'overview', group: 'General', title: 'Overview (Reports & Analytics)', image: '02-dashboard',
    intro: 'Summary of abaca production, field monitoring, deliveries, and sales.',
    points: [
      'Tabs: Abaca Production, Sales & Delivery, and Users.',
      'Cards: Received Seedlings, Completely Distributed, Total Monitoring, Planted Seedlings, Area Planted, Harvest Fiber.',
      'Seedling Distribution Overview: select the year and switch between Monthly or Yearly.',
      'Refresh data / Refresh – load the latest data.',
    ],
  },
  {
    id: 'users', group: 'Field Operations', title: 'User Management', image: '03-user-management',
    intro: 'Manage accounts for farmers, buyers, and association coordinators.',
    points: [
      'Select a tab: Farmers, Buyers, or Association.',
      'Use Search (name, email, organization) and the All Status filter.',
      'Cards: Total Users, Pending Review, Verified, Rejected.',
      'Export CSV or Export PDF to download the list.',
    ],
  },
  {
    id: 'seedlings', group: 'Field Operations', title: 'Seedling Distribution', image: '04-seedling-distribution',
    intro: 'Track seedling batches distributed to partner associations.',
    points: [
      'Cards: Total Distributions, Total Quantity, This Month, Varieties.',
      'Columns: Photo, Date, Variety, Quantity, Recipient, Source, Status, Progress, Actions.',
      'Distribute to Association – record a new distribution (see Action Buttons).',
    ],
  },
  {
    id: 'planted', group: 'Field Operations', title: 'Planted Seedlings', image: '05-planted-seedlings',
    intro: 'Monitor planting progress and farm area coverage across farmers.',
    points: [
      'Filters: search, All Varieties, All Municipalities.',
      'Columns: Farmer, Variety, Quantity (planted/received and unit losses), Planting Date, Location, Association, Photos.',
      'View – inspect full planting details and photos.',
    ],
  },
  {
    id: 'monitoring', group: 'Field Operations', title: 'Field Monitoring – Active', image: '06-field-monitoring-active',
    intro: 'Field visit logs and current farm condition assessments.',
    points: [
      'Cards: Total Monitoring, Healthy Farms, Needs Support, Damaged Farms, Upcoming Visits.',
      'Tabs: Active, Upcoming, Overdue, History, All Records.',
      'Condition: Healthy, Needs Support, or Damaged.',
      'Add New – start a new monitoring record.',
    ],
  },
  {
    id: 'monitoring-history', group: 'Field Operations', title: 'Field Monitoring – History', image: '07-field-monitoring-history',
    intro: 'Completed monitoring records move here automatically to keep the Active list clean.',
    points: [
      'Sub-filters: All History, Completed, Done Monitor, Previous Visits.',
      'The history icon under Actions shows all past visits for that farmer.',
    ],
  },
  {
    id: 'harvest', group: 'Field Operations', title: 'Harvest Verification', image: '08-harvest-verification',
    intro: 'Review and verify abaca harvest submissions from farmers.',
    points: [
      'Cards: Total Harvests, Total Farmers, Total Fiber (kg), Pending, Last 30 Days.',
      'Status dropdown (defaults to Pending) – change it to view other records.',
      'Export CSV to download a report.',
    ],
  },
  {
    id: 'sales', group: 'Market & Logistics', title: 'Sales Management', image: '09-sales-management',
    intro: 'Review, verify, and manage farmer sales reports.',
    points: [
      'Cards: Verified Sales, Pending Reports, Active Farmers, Total Abaca Sold, Total Reports.',
      'Filters: search, All Status, All Time, plus an Export button.',
      'Pending rows offer view, edit, approve (✔), reject (✖), and delete. Approved rows offer view, edit, and delete only.',
      'Verify a Pending report first before it is counted under Verified Sales.',
    ],
  },
  {
    id: 'prices', group: 'Market & Logistics', title: 'Buyer Price Listings', image: '10-buyer-price-listings',
    intro: 'Current abaca buying prices published by verified buyers.',
    points: [
      'Class A / B / C cards – the highest price per kg appears at the top.',
      'Filters: search, All Types, All Municipalities, All Status.',
      'This page is read-only for admins; buyers update their own prices.',
    ],
  },
  {
    id: 'delivery', group: 'Market & Logistics', title: 'Delivery Tracking', image: '11-delivery-tracking',
    intro: 'Monitor fiber deliveries across associations.',
    points: [
      'Tabs: All Deliveries, In Transit, Delivered, Completed, Cancelled.',
      'Columns: Buyer / Farmer, Variety & Grade, Quantity, Date, Status, Progress.',
      'Export CSV and search by farmers, buyers, variety, or location.',
    ],
  },
  {
    id: 'staff', group: 'Administration', title: 'Staff Management (Super Admin Only)', image: '13-staff-management',
    intro: 'Manage MAO administrator and coordinator accounts.',
    points: [
      'Cards: Total Staff, Administrators, Profile Completed, Pending Profile.',
      'Create Coordinator – create a new account (see Action Buttons).',
    ],
  },
  {
    id: 'btn-monitoring-add', group: 'Action Buttons', title: 'Add New (Field Monitoring)', image: '16-btn-monitoring-add-new',
    intro: 'Open the Field Monitoring Form to record a new farm visit.',
    points: [
      'Visit Information: select Date of Visit. Monitored By is automatically filled with your account.',
      'Farmer / Association: select a registered farmer, then enter Association Name and Farm Location.',
      'Crop Growth & Farm Condition: set Farm Condition, Growth Stage, Weather Condition, and Estimated Yield (kg).',
      'Fields marked with a red * are required. New records appear under the Active tab.',
    ],
  },
  {
    id: 'btn-filters', group: 'Action Buttons', title: 'Filters (Field Monitoring)', image: '17-btn-monitoring-filters',
    intro: 'Click Filters to reveal additional filter options. Click again to hide them.',
    points: ['Farm Condition, Date From, and Date To.'],
  },
  {
    id: 'btn-monitoring-view', group: 'Action Buttons', title: 'View (Field Monitoring)', image: '18-btn-monitoring-view',
    intro: 'The eye icon opens the Monitoring Details modal.',
    points: [
      'Basic Information: Monitoring ID, Date of Visit, Coordinator.',
      'Farmer Information and Farm Assessment (condition, growth stage, weather, yield, issues observed).',
    ],
  },
  {
    id: 'btn-distribute', group: 'Action Buttons', title: 'Distribute to Association', image: '19-btn-distribute-to-association',
    intro: 'Record a new seedling distribution to an association.',
    points: [
      'Enter Variety, Quantity, and Date Distributed. Source/Supplier is optional.',
      'Select Recipient Association and Status. Remarks are optional.',
      'Photo Documentation: upload Seedling, Distribution, and Quality photos.',
      'Click Distribute Seedlings to save, or Cancel to discard.',
    ],
  },
  {
    id: 'btn-seedling-view', group: 'Action Buttons', title: 'View (Seedling Distribution)', image: '20-btn-seedling-view',
    intro: 'Displays Distribution Details and Distribution Progress.',
    points: ['Variety, quantity, date, recipient, status, and remarks.', 'Progress to Farmers: Total, Distributed, Remaining.'],
  },
  {
    id: 'btn-planted-view', group: 'Action Buttons', title: 'View (Planted Seedlings)', image: '22-btn-planted-view',
    intro: 'Displays complete Planting Details.',
    points: ['Farmer, variety, quantity distributed, actual planted, and damaged/losses.', 'Date, location, method, and Planting Photos.'],
  },
  {
    id: 'btn-sales-view', group: 'Action Buttons', title: 'View (Sales Management)', image: '23-btn-sales-view',
    intro: 'Displays Sales Report Details. Click Close to dismiss.',
    points: [
      'Report ID, Farmer, Buyer Company, Total Sales, Quantity Sold, Status, Submitted Date.',
      'Approve (✔) and Reject (✖) apply to Pending reports only. Review carefully before confirming.',
    ],
  },
  {
    id: 'btn-create-coordinator', group: 'Action Buttons', title: 'Create Coordinator', image: '24-btn-create-coordinator',
    intro: 'Create a new MAO coordinator account.',
    points: [
      'Enter Full Name, Email Address, Password (min. 8 characters), and Confirm Password.',
      'Check "Make this account a Super Admin" only if full administrative access is required. Grant this only to trusted staff.',
      'Click Create Account to save, or Cancel to go back.',
    ],
  },
];

const BUTTON_LEGEND: [string, string][] = [
  ['Refresh', 'Reload the latest data (top-right of every page).'],
  ['Export', 'Download the current list as CSV or PDF.'],
  ['Filters', 'Show or hide additional filter fields.'],
  ['Add New', 'Record a new field monitoring visit.'],
  ['View (👁)', 'Open the full record details.'],
  ['Edit (✏)', 'Modify an existing record.'],
  ['Approve (✔) / Reject (✖)', 'Verify or reject a Pending sales report.'],
  ['Delete (🗑)', 'Remove the record.'],
  ['X / Cancel / Close', 'Close the popup without saving changes.'],
];

const AdminUserManual: React.FC = () => (
  <UserManualView
    imgBase="/assets/manual/admin"
    sections={SECTIONS}
    buttonLegend={BUTTON_LEGEND}
    legendGroup="Action Buttons"
  />
);

export default AdminUserManual;

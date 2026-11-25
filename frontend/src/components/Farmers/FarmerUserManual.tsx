import React from 'react';
import { UserManualView, ManualSection } from '../Shared/UserManualView';

// ponytail: static content, edit this array to update the farmer manual. No CMS needed.
const SECTIONS: ManualSection[] = [
  {
    id: 'login', group: 'Getting Started', title: 'Sign In & Create Account', image: '01-login',
    intro: 'Open /farmer-login, enter your Email Address and Password, then click Sign In as Farmer. This page is protected by reCAPTCHA.',
    points: [
      'Use the eye icon in the password field to show or hide your password.',
      'If you are new, open the Create Account tab to register and upload a valid ID (verification takes 1–3 business days).',
      'Back to Home – return to the public homepage, or use the Buyer / Farmer / Association switcher at the top-right.',
    ],
  },
  {
    id: 'dashboard', group: 'General', title: 'Dashboard', image: '02-dashboard',
    intro: 'Summary of your abaca farm, seedlings, harvests, sales revenue, and delivery status.',
    points: [
      'Summary cards: Seedlings received, Seedlings planted, Fiber harvested (kg), Total sales, Farm status, and Delivery status.',
      'Seedling Distribution Trends: compare Distributed vs Planted (switch between Monthly or Yearly and select the year).',
      'Farm Status Distribution: percentage of Healthy, Action Needed, and Needs Support based on monitoring records.',
      'Abaca Fiber Production and Sales charts below; click Refresh at the top-right to fetch the latest data.',
    ],
  },
  {
    id: 'seedlings', group: 'Farm Operations', title: 'My Seedlings', image: '03-seedlings',
    intro: 'View seedling batches received from MAO and update them once planted.',
    points: [
      'Cards: Total Seedlings, Damaged Seedlings, Planted, and Not Yet Planted.',
      'Search (Search by variety, source...) and All Status filter (Distributed, Planted, Damaged).',
      'When a batch appears in the table, click View Details (👁) to inspect it or Mark as Planted (sprout icon) to record the planting date, quantity planted, losses, location, and planting photos.',
    ],
  },
  {
    id: 'monitoring', group: 'Farm Operations', title: 'Farm Monitoring', image: '04-monitoring',
    intro: 'Read farm inspection results and recommendations from MAO field visits.',
    points: [
      'Cards: Total Monitoring, Healthy Farms, Needs Support, Damaged Farms, Upcoming Visits.',
      'Tabs: Active, Upcoming, Overdue, History, and All Records (with search by officer or monitoring ID).',
      'When monitoring records are available, click View Details (👁) to view farm condition, recommendations, and visit history.',
    ],
  },
  {
    id: 'harvest', group: 'Farm Operations', title: 'Harvest Records', image: '05-harvest',
    intro: 'Submit new abaca harvest records and track MAO verification.',
    points: [
      'Cards: Total Harvests, Total Fiber (kg), Awaiting Verification, and Verified Harvests.',
      'Filters: Search variety, grade, municipality... and All Status dropdown.',
      'Click Submit New Harvest (or Submit Your First Harvest) to log a new harvest (see Action Buttons).',
    ],
  },
  {
    id: 'deliveries', group: 'Deliveries & Sales', title: 'Track My Deliveries', image: '06-deliveries',
    intro: 'Track the status of abaca deliveries dispatched by CUSAFA to buyers.',
    points: [
      'Cards: Total Deliveries, In Transit, Delivered, and Total Fiber (kg).',
      'Status filters: All, In Transit, Delivered, Completed, Cancelled, plus Search buyers, variety...',
      'Click Export CSV to download your delivery list.',
    ],
  },
  {
    id: 'sales-reports', group: 'Deliveries & Sales', title: 'Sales Reports', image: '07-sales-reports',
    intro: 'Log monthly abaca fiber sales for MAO verification.',
    points: [
      'Cards: Total Revenue, Total Abaca Sold (kg), Pending Review, and Approved Reports.',
      'Search by buyer, type... and All Status dropdown (Pending, Approved, Rejected).',
      'Click Add Sales Report (or Create First Report) to submit a sales report (see Action Buttons).',
    ],
  },
  {
    id: 'profile', group: 'Account & Profile', title: 'My Profile', image: '08-profile',
    intro: 'Open the profile menu at the bottom-left of the sidebar and select View Profile to check your account and farm details.',
    points: [
      'Displays Verified / Active status, Email, Contact, Address, Sex & Age, and Association.',
      'Shows Farm Information (Farm Area, Years Farming, Abaca Type, Average Harvest, Farm Location) and Sales Information.',
      'Includes a Valid ID preview below (click to enlarge) and an Edit Profile button on the right.',
    ],
  },
  {
    id: 'edit-profile', group: 'Account & Profile', title: 'Edit Profile', image: '09-edit-profile',
    intro: 'Update your personal details, profile picture, address, farm info, and valid ID.',
    points: [
      'Upload New Picture – change your profile photo (JPG, PNG, or GIF, max 5MB).',
      'Edit Personal Information, Location, Farm Information, and Sales details; Email is locked for security.',
      'Click Back to Profile to cancel without changes, or save your updates at the bottom of the form.',
    ],
  },
  {
    id: 'change-password', group: 'Account & Profile', title: 'Change Password', image: '10-change-password',
    intro: 'Update your account password from the profile menu at the bottom-left of the sidebar.',
    points: [
      'Enter Current Password, New Password, and Confirm New Password (use the eye icon to preview).',
      'Password must have at least 8 characters, one uppercase letter, one lowercase letter, and one number.',
      'Click Change Password to save, or Cancel / Back to Profile to go back.',
    ],
  },
  {
    id: 'btn-submit-harvest', group: 'Action Buttons', title: 'Submit New Harvest (Harvest Records)', image: '11-btn-submit-harvest',
    intro: 'Click Submit New Harvest to record your harvest for MAO verification.',
    points: [
      'Farmer Information: name, contact, municipality, barangay, and association are auto-filled from your profile.',
      'Farm Location: enter or review Area (Hectares)*, Farm Coordinates, Farm Name, and Landmark.',
      'Below, enter harvest details, abaca variety/grade, dry fiber output (kg), and photos before submitting.',
      'Use the X button at the top-right to close the form without submitting.',
    ],
  },
  {
    id: 'btn-submit-sales', group: 'Action Buttons', title: 'Add New Sales Report (Sales Reports)', image: '12-btn-submit-sales',
    intro: 'Click Add Sales Report to report your monthly fiber sales.',
    points: [
      'Select Report Month* and Date of Sale, then enter Buyer / Company.',
      'Under Product Details, enter Abaca Type/Grade*, Quantity (kg), and Unit Price (₱) — Total Amount (₱) is calculated automatically.',
      'Complete Payment & Logistics (Payment Method, Payment Status, Delivery Location) and save the report.',
    ],
  },
];

const BUTTON_LEGEND: [string, string][] = [
  ['Refresh', 'Reload the latest data (top-right of every page).'],
  ['Submit New Harvest', 'Submit a new harvest entry in Harvest Records.'],
  ['Add Sales Report', 'Create a new sales report in Sales Reports.'],
  ['Export CSV', 'Download your delivery list as a CSV file.'],
  ['Mark as Planted (Sprout)', 'In My Seedlings (when a batch is listed): log planted seedlings.'],
  ['View Details (👁)', 'In tables (when records exist): view full seedling, monitoring, harvest, or delivery details.'],
  ['Edit (✏) / Delete (🗑)', 'In tables (when editable): update or remove a submission.'],
  ['X / Cancel / Back', 'Close the popup or return without saving changes.'],
];

const FarmerUserManual: React.FC = () => (
  <UserManualView
    imgBase="/assets/manual/farmer"
    sections={SECTIONS}
    buttonLegend={BUTTON_LEGEND}
    legendGroup="Action Buttons"
  />
);

export default FarmerUserManual;

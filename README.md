# Medicine Schedule and Reminder Manager

## Problem Statement

People may forget medicine schedules, dosages and reminder times. Inconsistent medication adherence can lead to complications, reduced treatment effectiveness, and accidental overdose or skipped doses.

## Objective

Provide a simple browser-based medicine scheduling and reminder system that works anywhere, anytime without requiring complex installations, backend servers, or internet connectivity.

## Features

* **Interactive Dashboard**:
  * Real-time clock and dynamic date display.
  * Key performance metrics: Total medicines, Today's active medicines, Doses taken today, and Doses missed today.
  * Today's Upcoming Reminders feed with chronological ordering and status tracking.
  * Quick action triggers for medication management and alarm testing.

* **Add & Edit Medicine**:
  * Comprehensive fields: Medicine Name, Dosage, Formulation Type (Tablet, Capsule, Syrup, Injection, Drops, Inhaler, Ointment, Other), Start Date, End Date, Reminder Time, and Special Instructions / Notes.
  * Strict client-side validation to ensure required fields and valid date ranges (End Date $\ge$ Start Date).
  * In-place editing mode that updates existing records without duplicating entries.
  * Clear visual feedback with success and error alerts.

* **Medicine List & Management**:
  * Clean, responsive tabular layout with badges for formulation type and medication lifecycle (Active, Upcoming, Completed).
  * Direct action buttons for editing, deleting with confirmation, and instant reminder testing.

* **Live Search**:
  * Fast, real-time filtering across Medicine Name, Dosage, Formulation Type, and Notes.

* **Automated JavaScript Reminder System**:
  * Background interval checks the current system time every few seconds against active medicines.
  * Intelligent duplicate suppression: Ensures alerts only trigger once per scheduled minute and will not repeatedly fire once logged.
  * Synthesized two-tone audio chime using the Web Audio API without relying on external media files.
  * Clear in-page modal alert displaying:
    * Title: "Time to take your medicine"
    * Medicine Name
    * Dosage
    * Scheduled Time & Notes
    * Interactive **TAKEN** and **MISSED** buttons.

* **Browser Push Notifications**:
  * Opt-in Web Notification API integration.
  * Graceful fallback to the in-page reminder modal if notifications are unsupported, denied, or dismissed.

* **Medication Adherence History**:
  * Permanent adherence log recording medicine name, date, scheduled time, status (TAKEN / MISSED), and exact timestamp.
  * Real-time status filtering: **ALL**, **TAKEN**, and **MISSED** with live counter badges.
  * Secure history clearing option with user confirmation.

* **Client-side LocalStorage Persistence**:
  * Dual storage partition: `medicines` and `medicineHistory`.
  * Preserves all user schedules, adherence records, and preferences across browser sessions, reloads, and closures.

* **Responsive Medical-Themed UI**:
  * Built using pure CSS variables, flexbox, and CSS grid.
  * Optimized for mobile smartphones, tablets, laptops, and wide desktop displays.
  * Clean typography, subtle shadows, and health iconography rendered with standard Unicode characters (no external image dependencies).

## Technologies

* HTML5
* CSS3
* JavaScript
* Browser LocalStorage
* Browser Notifications

## How to Run Locally

You do not need to install Node.js, Python, or any server. You can simply open:

`index.html`

in any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, or Brave).

Alternatively, you can serve it via any static local server (such as Python's `python -m http.server` or VS Code Live Server).

## GitHub Pages Deployment

Deploying this application to GitHub Pages takes less than a minute:

1. Open GitHub repository.
2. Go to Settings.
3. Open Pages.
4. Select Deploy from branch.
5. Select main.
6. Select `/root`.
7. Save.
8. Open the generated GitHub Pages URL.

The application is immediately live and accessible from any smartphone, tablet, or PC worldwide.

## Privacy

All medicine information, dosage details, schedules, notes, and adherence history are stored locally in the browser using `localStorage` and are **not** sent to any external server, third-party analytics, or cloud database. Your personal health information stays private on your own device.

## Future Scope

* Cloud synchronization across multiple personal devices.
* User accounts and encrypted multi-profile support.
* Progressive Web App (PWA) / native mobile application with offline service worker.
* Family medicine management and caregiver alert sharing.
* Doctor prescription integration and digital Rx barcode/QR scanning.
* Advanced reminder scheduling (e.g. alternate day schedules, every N hours, tapering doses).

## AUTHOR

Sasmitha K.M

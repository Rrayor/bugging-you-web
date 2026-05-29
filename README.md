# Bugging you

A simple note-taking PWA for quick reminders. It lets you save short notes locally on your device and instantly send any note to your OS notifications with a **Bug me** button.

## Overview

Bugging you is designed to be:

- **Fast**: open the app and add a note immediately
- **Mobile-first**: optimized for phone-sized screens and touch input
- **Private**: all data stays on the device
- **Simple**: plain HTML, CSS, and JavaScript with no frameworks or dependencies
- **Installable**: works as a Progressive Web App (PWA)

## MVP Features

- Create a short text note
- Edit an existing note
- Remove a note from the in-app list
- Trigger an immediate OS notification from a note using **Bug me**
- Request notification permission the first time the user clicks **Bug me**
- Store all notes locally with `localStorage`
- Show notes in **newest-first** order
- Work offline after the first load
- Meet **WCAG AA** accessibility goals

## Notes and Notification Behavior

### Notes

- A note is a single short text value
- Maximum note length is **255 characters**
- Notes are shown in **newest-first** order

### Notifications

- Each note has a **Bug me** button
- Clicking **Bug me** creates an **immediate** OS notification
- Notifications are **dismissable by the user through the OS**
- The app does **not** track notification dismissal state
- Removing a note from the app does **not** dismiss an already-created OS notification
- Clicking **Bug me** again can create another notification with the same note text
- Tapping a notification does **not** need to reopen the app to a specific note

## UI Direction

- Single-page application
- Input textbox at the top with a save button next to it
- Notes list below the input
- Each note shows actions for:
  - **Bug me**
  - **Edit**
  - **Remove**
- Visual direction: modern dark UI, rounded edges, icon-driven actions, whimsical and friendly tone
- Product feel: closer to a lightweight reminders app than a general notes app

## Technical Direction

- HTML, CSS, and JavaScript only
- No frameworks
- No backend
- No accounts
- No sync between devices
- No network data storage
- Deployed on Vercel

## PWA Requirements

The MVP should include the baseline pieces needed for a full PWA:

- Web app manifest
- Service worker
- Offline capability after first load
- Installable experience on supported devices/browsers

## Accessibility

The app should target **WCAG AA** accessibility, including:

- semantic HTML
- keyboard accessibility
- sufficient color contrast
- clear focus states
- accessible labels for controls and icons

## Project Documentation

More detailed planning and implementation notes live in the [`specs/`](specs) folder.

## License

Uses the MIT license.

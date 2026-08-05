# AttendX Premium

# Build "AttendX" – Smart Attendance & Timetable for CMR University

Create a beautiful, premium Progressive Web App (PWA) called **AttendX**.

This application is designed specifically for **CMR University** students.

Initially support only CMR University because every department uses the same ERP layout. The only difference is the subjects.

This is Version 1.

Only build:

✅ Smart Timetable

✅ Attendance Tracker

Do NOT build yet:

❌ Assignments

❌ Announcements

❌ Notes

❌ Community

❌ Marks

❌ CGPA

Reserve space for future modules.

--------------------------------------------------

DESIGN

--------------------------------------------------

The application should NOT look like a college ERP.

It should look like a premium Apple application.

Inspiration

• Apple Vision Pro

• Nothing OS

• Arc Browser

• Linear

• Notion

• Things 3

Theme

Soft Frosted White

Glassmorphism

Rounded Cards

Minimal UI

Large spacing

Beautiful typography

Smooth animations

Premium micro interactions

Color Palette

Background

#DADDE1

Surface

#F4F5F7

Primary

#AEB5C0

Secondary

#BEC3C8

Text

#2B2F33

Muted

#6E7378

Use beautiful gradients.

No dark mode.

--------------------------------------------------

TECH STACK

--------------------------------------------------

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

Framer Motion

React Router

Lucide Icons

IndexedDB

PWA

Recharts

Architecture should be clean and reusable.

Everything must work OFFLINE after setup.

No backend.

No login.

No cloud.

No authentication.

--------------------------------------------------

FIRST OPEN EXPERIENCE

--------------------------------------------------

When opening the application for the first time

Display

Welcome to AttendX

This setup takes less than 2 minutes.

--------------------------------------------------

STEP 1

Show a tutorial section.

Use an embedded placeholder video component.

Display

▶ Watch Tutorial

Skip

Replay

Tutorial explains

1 Open CMR ERP

2 Open Schedule

3 Select Week

4 Take Screenshot

5 Upload Screenshot

6 Open Attendance

7 Take Screenshot

8 Upload Screenshot

9 Review extracted data

10 Finish

Use a placeholder video now. Make it easy to replace with a real video later.

--------------------------------------------------

STEP 2

Upload Schedule Screenshot

Allow

PNG

JPG

JPEG

Drag & Drop

After upload

Use OCR to extract

Date

Time

Course Code

Course Name

Faculty

Room

Session

Generate an editable timetable automatically.

Allow users to edit any extracted field before saving.

--------------------------------------------------

STEP 3

Upload Attendance Screenshot

Allow

PNG

JPG

JPEG

After upload

Use OCR to detect

Course Code

Course Name

Faculty Name

Present Count

Absent Count

Total Count

Attendance %

Show preview.

Allow editing.

Save locally.

--------------------------------------------------

HOME DASHBOARD

Display

Good Morning

Today's Date

Current Day

Overall Attendance %

Beautiful Attendance Ring

Today's Classes

Upcoming Classes

Attendance Warning

Recent Activity

--------------------------------------------------

SUBJECT CARDS

Each subject card should display

Subject Name

Faculty

Present

Absent

Total

Attendance %

Green

Above 85%

Orange

75–85%

Red

Below 75%

Click card to open detailed attendance.

--------------------------------------------------

SMART TIMETABLE

Automatically generated from OCR.

Views

Today

Week

Each class contains

Subject

Faculty

Room

Time

Course Code

Theory/Lab

Automatically display today's schedule.

--------------------------------------------------

TODAY PAGE

Display today's timetable.

Example

08:30–09:30

VLSI Design

Faculty

Room

Buttons

Present

Absent

Skip

If Present

Present++

Total++

If Absent

Absent++

Total++

Update dashboard immediately.

--------------------------------------------------

ATTENDANCE PAGE

Each subject contains

Present

Absent

Total

Attendance %

History

Buttons

Present

Absent

Edit

Reset

Delete

Automatically calculate

Attendance %

Classes needed for

75%

80%

85%

90%

Maximum classes that can still be missed.

--------------------------------------------------

ANALYTICS

Display

Overall Attendance

Subject Comparison

Best Subject

Weakest Subject

Attendance Trend

Progress Rings

--------------------------------------------------

HISTORY

Store every attendance action.

Display

Date

Subject

Present / Absent

Timestamp

Allow Undo.

--------------------------------------------------

SETTINGS

Edit Subjects

Edit Timetable

Backup JSON

Restore JSON

Export Data

Reset App

--------------------------------------------------

OFFLINE

Store everything using IndexedDB.

The app must continue working without internet.

Make it installable as a PWA.

--------------------------------------------------

OCR

Optimize OCR specifically for CMR University's ERP layout.

The OCR should recognize

Schedule Table

Attendance Table

Extract

Course Code

Course Name

Faculty

Time

Room

Present

Absent

Percentage

After extraction

Always show an editable preview before saving.

--------------------------------------------------

ANIMATIONS

Smooth transitions

Animated attendance rings

Glass hover effects

Loading skeletons

Floating action buttons

Modern page transitions

--------------------------------------------------

FUTURE MODULES

Reserve navigation placeholders only.

Do NOT implement.

Assignments

Announcements

Community

Notes

Marks

CGPA

Teacher Portal

Cloud Sync

Google Login

Supabase

Firebase

ERP Auto Sync

Email Sync

AI Assistant

--------------------------------------------------

IMPORTANT

The application should feel like a premium productivity app instead of a college management system.

Code should be modular, clean, reusable, scalable, and easy to extend.

Focus on user experience, beautiful UI, fast performance, and offline-first architecture.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6ec48bcd-903d-4121-b610-b92b5568a757).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

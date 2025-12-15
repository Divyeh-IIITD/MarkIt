# 📅 Academic Email Auto-Calendar

A Google Apps Script that automatically scans your Gmail for academic deadlines, quizzes, paper showings, and reviews, then adds them to your Google Calendar.

## 🚀 Features
* **Smart Parsing:** Detects specific dates ("20/12/25"), relative days ("Tomorrow", "Next Friday"), and urgency keywords ("Come to C-102 immediately").
* **Course Detection:** Automatically tags events with course codes like `[MT25104]`, `[S&S]`, or `[QUIZ 4]`.
* **Venue Detection:** Extracts locations like "LHC", "Old Academic", "RnD Block", or "Room 101".
* **Notifications:** Sends you an email confirmation immediately when an event is added.

## 🛠️ Setup Guide
1. Go to [script.google.com](https://script.google.com/) and create a **New Project**.
2. Copy the code from `Code.js` in this repository and paste it into the script editor.
3. Save and click **Run** once to authorize permissions.
4. **Set up the Automaton:**
   * Click the **Triggers** (Clock icon) on the left.
   * Click **+ Add Trigger**.
   * Function: `autoMarkDeadlines`
   * Event Source: `Time-driven`
   * Interval: `Every 10 minutes` (or 15).
5. Done! The bot now runs in the background.

## 🔍 Keywords Scanned
The script looks for emails containing:
* "showing", "review", "showcase", "copy"
* "quiz", "midterm", "endsem", "endterm"
* "lab", "viva", "announcement", "assignment"

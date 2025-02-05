# F1M 24 Setup Calculator 🏎️💨

This project is an intuitive **F1 Manager 2024** setup calculator 🧮. It helps you find the optimal car setup for each track, improving your race performance and helping you secure those podium finishes! 🏁

**Try it now!** 👉 [https://alexxmsh.github.io/f1msetup/](https://alexxmsh.github.io/f1msetup/) 👈

## Key Features ✨

*   **Setup Calculation:** 🧮 The application calculates the ideal setup based on feedback provided for different areas, such as oversteer, braking, cornering, traction, and straights.
*   **Intuitive UI:** 👌 Uses sliders and interactive graphs for a smooth and user-friendly experience.
*   **Per-Track Presets:** Preset configurations for every track in the championship are available. You can quickly switch between tracks using the dropdown menu or the "Next Track" button. ⏭️
*   **Dual Driver Support:** 👨‍👨‍👦  Allows you to calculate and manage setups for both of your team's drivers.
*   **Installable as a Web App:** 📱 You can install this calculator on your device (smartphone, tablet, etc.) for quick access, just like a native app!
*   **Responsive Design:** 💻🖥️📱 Adapts seamlessly to different screen sizes.
*   **Open Source:** 🔓 The code is freely accessible and modifiable.

## How to Use the Application 📝

This tool helps you find the optimal car setup in F1 Manager 2024. Here's how to use it:

### 1. Select the Track 🌍

*   Choose the circuit you're working on from the "Track preset:" dropdown menu.  This will automatically set the sliders to a good starting point (preset) for that track.  Using presets is optional, but it can save you time.
*   You can also use the "Next Track" button. This button does the same thing of reset button, but it selects the next track.

### 2. Test the Initial Setup (or Your Own) 🎚️

*   Take the slider values shown on the website and enter them into the F1 Manager 2024 game.
*   Drive several laps with this setup.
*   **Important:** If you decide *not* to use the suggested preset values, make sure to manually adjust the sliders *on the website* to match the setup you're actually using in the game.

### 3. Provide Feedback 🗣️

*   After your test laps, your driver in the game will give you feedback about the car's handling.
*   For *each* of the five areas (Oversteer, Braking, Cornering, Traction, Straights), click the button next to the graph.
*   Each click cycles through the feedback options:
    *   **Unknown**   (use this if you don't have feedback for that area yet)
    *   **Optimal**
    *   **Great**
    *   **Good**
    *   **Bad +**   (the feedback value needs to be *higher*)
    *   **Bad -**   (the feedback value needs to be *lower*)
* You must give, at least, one feedback to continue and this feedback must be different from UNKNOWN.

### 4. Calculate 💻

*   Click the "Calculate" button.
*   The application will process your feedback and suggest a *new* set of slider values. The sliders will *automatically move* to this new suggested setup.
*   The graphs will update to visually show:
     * The suggested values (light blue marker).
     * The current slider values (white marker).
*   The "Info" area will show you how many possible setup combinations are remaining, and any important messages.

### 5. Repeat 🔄

*   Go back to the game and test the *new* suggested setup.
*   Provide updated feedback.
*   Click "Calculate" again.
*   Keep repeating this process until the application finds the single, optimal setup (or until you're happy).

### Button Summary

*   🧮 **Calculate:** Processes your feedback and suggests a new setup.
*   ↩️ **Cancel:** Reverts to the previous setup suggestion.
*   💾 **Preset:** Resets the sliders to the initial preset values for the selected track *without* clearing your feedback history.
*   🔄 **Reset:** Completely resets everything (sliders, feedback, and calculation history) for the current driver.
*   ⏩ **Next Track:** Resets everything and loads the preset for the next track in the list.

### Working with Both Drivers

The "First Driver" and "Second Driver" sections work *independently*. You can use this tool to find optimal setups for both of your drivers simultaneously. The only thing shared between the two is the selected track preset.

## Installation as a Web App 📲

You can install this application as a Progressive Web App (PWA) on your device.

**Instructions for Chrome (Desktop):**

1.  Open the application in your Chrome browser.
2.  Click on the three vertical dots in the top right corner (Chrome menu).
3.  Select "Install F1M 24 Setup Calculator..." (or a similar option).

**Instructions for Safari (iOS):**

1.  Open the application in Safari.
2.  Tap the share icon (square with an upward arrow).
3.  Scroll down and select "Add to Home Screen".

**Instructions for Chrome (Android):**

1.  Open the application in Chrome.
2.  Tap the share icon (usually three vertical dots).
3.  Select "Add to Home Screen" or "Install app".

## Contributing 🤝

If you'd like to contribute to improving this project, feel free to:

*   Report bugs or issues through GitHub **Issues**.
*   Suggest new features.
*   Submit **Pull Requests** with code enhancements.

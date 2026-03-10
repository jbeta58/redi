# REDI — Project Specification
> RGB LED Display Infrastructure
> Last updated: 2026-03-03

---

## 1. Project Overview

<!-- Describe REDI in your own words. What is it? Who is it for? What problem does it solve? -->

**Description:**
_A network of RGB LED matrix displays that show personalized content, managed through a web app._

**Inspiration:**
_Similar to Tidbyt — small ambient displays around the home that show useful, beautiful, and fun information at a glance._

---

## 2. Hardware

### 2.1 Display Unit
- **Matrix:** RGB LED Matrix Panel 64×32, 2048 DOTS Pixels 3mm Pitch, from Waveshare
- **Controller:** Adafruit Matrix Portal M4
    * ATSAMD51J19 Cortex M4 processor, 512KB flash, 192K of SRAM
    * ESP32 WiFi co-processor with TLS support and SPI interface to the M4
    * USB Type C connector for data and power connectivity
    * Two user interface buttons + one reset button
    * Indicator NeoPixel and red LED
    * JST 3-pin connector that also has analog input/output.
- **LDR Photo resistor**
- **Connectivity:** WiFi (built-in Matrix Portal)
- **WiFi setup:** Create a wifi connection between cellphone and device. Device will act as an Access Point, then will render a simple webpage to get the wifi network and password.

### 2.2 Planned Units
<!-- How many units are you planning to build? Who are they for? -->
- About 5 to 10 units to be distributed among friends. 
- The devices do not connect between them. 
- Each user will have their own credentials to access the webapp to manage settings of the device.

### 2.3 Hardware Variations
<!-- Are you considering any hardware variations? e.g. different display sizes, outdoor units, desk vs wall mount -->
- Indoor only
- Wood enclosure
- Only one display size
- Desk stand

### 2.4 Physical Controls
<!-- Should the device have any physical controls? -->
- On/Off button
- Wifi setup button: used whenever it is needed to change the wifi credentials saved in the device.

---

## 3. Device Behavior

### 3.1 Boot Sequence
<!-- What should happen when the device turns on? -->
- Start off
- A single white LED pixel appears at:
    - x = screen_width / 2
    - y = screen_height / 2
    - Hold for about 300 ms
- From the center pixel, a horizontal white line grows: Expands simultaneously left and right. 1 pixel per frame to a predefined width
- From the center of the horizontal line: Animation expands up and down and creates a rectangular reveal mask that Reveals the REDI logo from center outward vertically.
    - Logo specs:
        - Text: "REDI"
        - Retro 3D
        - Bold
        - Pixel-art inspired
        - Slight depth shadow 
        - Centered on screen
        - Display for 2 seconds
- Then fade out and remain black for 2 seconds
- Then show a signature screen
    - specs:
        - centered
        - white or gray
        - small
        - text: "by @jbeta58"
        - display for 2 seconds
- Then fade out and remain black for 2 seconds
- Show WiFi connection screen
    - Behavior animated dots:
        - Connecting.
        - Connecting..
        - Connecting...
        - Loop every 500ms while connection attemp is active
- If it connects to internet then start showing the apps.
- If no connection was established or it is been setup for the first time
    - Show the message "No wifi"

### 3.2 Display Rotation
<!-- How should apps/widgets cycle on the display? -->
- Each app shows for a fixed duration, then moves to the next
- User can set different durations per app. 5, 10 or 20 seconds, configurable in the webapp.
- User can set different week days to show each app. And one start time and end time that will work during the day.

### 3.3 Offline / No Internet Behavior
<!-- What should the display do when there's no internet? -->
- Show a large clock 
- Show a specific "offline" message or icon
- Retry silently in background
- Time is fetched every 5 minutes (or more) from the weatherApi. Time is saved in the Matrix Portal and it will continue counting time until a new retrieve is made.
- Time is synced from the server timestamp included in every successful API response.
  The device keeps counting locally between polls and during outages using the M4's 
  internal clock. On power loss without a prior sync, time is unknown until reconnection.

### 3.4 Night Mode / Quiet Hours
<!-- Should the display behave differently at night? -->
- Have an option to turn off completely the screen between certain hours if the user wants to.
- Dim significantly (low brightness) when the photo resistant senses absence of light.

### 3.5 Brightness
<!-- How should brightness be controlled? -->
- Auto brightness (light sensor )

### 3.6 Alerts / Notifications
<!-- Should the display ever break from its normal rotation to show an urgent alert? -->
- No, always follow normal rotation

### 3.7 Refresh Rate
- I think the device should refresh from the app data every 1 to 5 minutes.
- The TRM api should be called once a day or if fail, try every hour until next day, or similar.
- The weather api should be called every 5 minutes or more, I would like to keep in the API limits of the free tier. And we might need to do more calls when more devices are added.

### 3.8 Device API URL
- The firmware has one hardcoded value: the custom API base URL (e.g. `https://api.rediapp.com`)
- This domain is owned by the project and acts as a stable abstraction layer over 
  whatever backend infrastructure is in use.
- The device API is versioned from day one (e.g. `/v1/render`) to allow future 
  infrastructure migrations without reflashing deployed devices.
- Devices poll: `https://api.rediapp.com/v1/render`


---

## 4. Apps / Widgets

> An "app" is a single screen of content that gets shown during rotation.

### 4.1 App Library
<!-- Check all the apps you want. Add notes on what each should show. -->

- **Birthdays**
    - Photo (possible)
    - If no photo available, a placeholder
    - Names and dates are entered by user on the webapp
- **Word Clock**
    - e.g. HALF PAST NINE
    - Device timezone will be wet by the user
- **Clock**
    - e.g. 12 : 10 PM
- **3 Cities Clock**
    - City Name (e.g. New York)
    - Time (e.g. 03 : 25)
- **Clock and Date**
    - e.g. 11 : 58 PM FRIDAY 27 JUN 2025
- **Date Progress bars**
    - Bars and percentages of
        - Y (year)
        - M (month)
        - D (day)
- **Countdown Timer** 
    — e.g. days until 
        - Christmas
        - New year
        - Halloween
        - Custom
    - Include an icon related to the event
    - Set name and date (month and day). 
- **Weather Today & Tomorrow**
    - Current Weather condition icon
    - Today's name of week (e.g. FRI (friday))
    - Today's highest and lowest temperature
    - Tomorrow's name of week (e.g SAT)
    - Tomorrow's highest and lowest temperature
    - Temperature unit is configurable in the webapp
- **3 days weather**
    - Display current, tomorrow and the day aftertomorrow
    - Include
        - Condition icon
        - Weekday name
        - Highest temperature
        - Lowest temperature
    - Cities are configurable in the webapp
- **Moon phase**
    - show an image of the current moon phase
    - Take data from the weateher API
- **Currency exchange rates**
    - COP DOLAR TRM
    - COP EURO (check if there is a free api), if not found, do not include it
    - Show a line graph with points of the last 30 days or so.
    - Use end of day rate


---

## 5. Scheduling & Configuration

### 5.1 App Scheduling
<!-- Should users be able to schedule which apps show at what times? -->
- All apps rotate all the time. And follow display rotation defined in 3.2.

### 5.2 App Configuration
<!-- For each app, can the user configure it? e.g. which city for weather, which team for sports -->
- Yes — each app has its own settings configurable per device
- If device has no apps enable, when trying to save in the web app, show an error and force they to add at least one app.
- Default app should be the simple clock.

---

## 6. Web App / Dashboard

### 6.1 Core Dashboard Features
<!-- What do you need to be able to do in the web app? -->
- Start with a login page
- For admin. See all the devices and their current status (online/offline)
- Turn on/off apps from a device
- Reorder apps (drag and drop?)
- Configure each app's settings
- View device stats (last seen, uptime, IP address, wifi network name)

### 6.2 Device Management
<!-- How do you add a new device? -->
- Device code is printed in user manual. User login and then input or link the device.

### 6.3 Live Preview
<!-- Can you preview what a device will show without looking at the physical display? -->
- No, not needed

### 6.4 Mobile vs Desktop
<!-- How will you primarily use the web app? -->
- Mostly mobile browser
- Both needs to be responsive

---

## 7. Users & Access

### 7.1 User Roles
<!-- What kinds of users will there be? -->
- **Owner (you):** Full access to all devices, can invite others
- **Device Owner:** Can manage their own device(s) only

### 7.2 Invitations
<!-- How do family/friends get access? -->
- Admin creates an account for them (set their email + password)
- They can reset webapp password if forgotten.

### 7.3 Device Ownership
<!-- Can a device be shared between multiple users? -->
- Each device belongs to exactly one user
- Admin can always see and manage all devices

### 7.4 Content Control
<!-- For family/friends — can they install any app, or only what you allow? -->
- There is a limited number of apps. The user can manage which apps are shown or not.

---

## 8. Notifications

### 8.1 Web App Notifications
<!-- Should the web app notify you of anything? -->
- Device goes offline for more than one week
- Device comes back online
- APIs errors (e.g. weather service is down)

**Notification channels:**
- Email

### 8.2 Display Alerts
<!-- Should the physical display flash/alert for anything? (separate from normal app rotation) -->
- No, never interrupt normal rotation

---

## 9. Integrations

<!-- Which external services do you want to integrate? Mark priority: H=High, M=Medium, L=Low, N=No -->

| Service | URL |
|---------|-----|
| Weather API | https://www.weatherapi.com/ |
| TRM COP peso to Dollar | Superintendencia Financiera de Colombia |

---

## 10. Technical Preferences

### 10.1 Hosting
<!-- Where do you want to host the web app and API? -->
- Managed platform to start (Vercel, Supabase or similar)
- Recommend something

### 10.2 Domain
<!-- Will you use a custom domain? -->
- Yes — I'll buy one, but only after everything is working

### 10.3 Budget
<!-- Rough monthly budget for hosting/services -->
- Free tier to start and as much as possible.
- if needed, pay for service, but keep the budget low.

### 10.4 Open Source
<!-- Will this project be open source? -->
- Private repo to start

### 10.5 Code Languages
- For device Arduino
- For webapp (suggest)

### 10.6 Custom Domain Strategy
- `api.rediapp.com` — device API (what firmware calls, forever)
- `app.rediapp.com` — web dashboard (what users open in browser)
- DNS points these subdomains to Vercel today. If infrastructure changes, 
  only the DNS record needs updating — deployed devices are unaffected.
- Domain purchase deferred until after everything is working locally.

---

## 11. Future / Nice to Have

<!-- Ideas you like but don't need right now. We'll plan for them but not build them in Phase 1. -->

- None for now

---

## 12. Out of Scope

<!-- Things you explicitly do NOT want. Helps avoid scope creep. -->

- No mobile app
- No audio/speakers
- No video content

---

## 13. Open Questions

<!-- Things you're unsure about or want to discuss before deciding -->

- None yet
- 

---


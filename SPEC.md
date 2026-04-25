# REDI — Project Specification
> REDI (Retro Display)
> Last updated: 2026-03-14

---

## 1. Project Overview

<!-- Describe REDI in your own words. What is it? Who is it for? What problem does it solve? -->

**Description:**
_A network of RGB LED matrix displays that show personalized content, managed through a web app._

**Inspiration:**
_Similar to Tidbyt — small ambient display around the home that shows useful, beautiful, and fun information at a glance._

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
- **LDR Photo resistor**: to control leds light intensity.
- **Connectivity:** WiFi (built-in Matrix Portal)
- **WiFi setup:** 
    - Create a wifi connection between cellphone and device. Device will act as an Access Point, then will render a simple webpage to get the wifi network and password.
    - Then it will be connected to wifi and internet, and the REDI can make calls to an online webapp. 

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
- LDR photo resistor will work as a light sensor.

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
- User can set different durations per app. 5, 10, 15 or 20 seconds, configurable in the webapp.
- User can set different week days to show each app. And one start time and end time that will work during the day.

### 3.3 Offline / No Internet Behavior
<!-- What should the display do when there's no internet? -->
- Show a large clock (e.g. 03:15 PM)
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
- I think the device should refresh from the app data every 1 to 5 minutes. (Please provide feedback on this)
- The TRM api should be called once a day or if fail, try every hour until next day, or similar. (Please provide feedback on this)
- The weather API should be called every 5 minutes or more, I would like to keep in the API limits of the free tier. And we might need to do more calls when more devices are added. (Please provide feedback on this too)

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
    - **Layout**: Displays today's birthday person(s) with a cake illustration, their name, and age. Designed as a quick at-a-glance reminder of who is celebrating today.
 
        ```
        [ cake ] [ MARIA          ]
        [  ~   ] [                ]
        [ 25%  ] [ 45 years       ]
        [  w   ] [     ~75% w     ]
        ```
 
        - **Left section (~25% width)** — birthday cake pixel art illustration
        - **Right section (~75% width)** — name on top, age on bottom

    - **Elements**
 
        | Element | Detail |
        |---------|--------|
        | Cake illustration | Pixel art of birthday cake with candles, centered in left section. Warm tones: cream base, strawberries, colored candles with yellow flame |
        | Name | Top right, large white dot-matrix text (e.g. `Maria`) |
        | Age | Bottom right, white dot-matrix text (e.g. `45 years`) |
        | Age unknown | If birth year was not set by the user, display `?? years` |
 
    - **Name Truncation**: The right section fits approximately **8–9 characters** at standard dot-matrix font size. Names longer than the available width are truncated with an ellipsis:
 
        - `Maria` → `Maria` (fits, no truncation)
        - `Sebastian` → `Sebast...`
 
    - **Language variants**
 
        | Language | Bottom Right |
        |----------|--------|
        | English | `45 years` | 
        | Spanish | `45 años` | 
    
    - **Multiple Birthdays on the Same Day**: When two or more people share the same birthday:
 
        - Only **one person is shown per app cycle**
        - On the next rotation cycle, the **next person** is shown
        - Once all people have been shown, it **starts over** from the first
        - Order is determined by the order they were added in the web app
 
    - **Visual Design**
        - **Font:** Dot-matrix pixel font, all caps
        - **Color:** White text; cake illustration uses warm colors (cream, orange, red strawberries, colored candles with yellow flame)
        - **Illustration:** Single pre-stored pixel array in firmware (`PROGMEM`) — same cake for all birthdays
 
    - **Configuration (Web App)**
 
        | Setting | Detail |
        |---------|--------|
        | Name | Required — person's first name or nickname |
        | Birthday | Day and month required; birth year optional |
        
        > If birth year is omitted, age displays as `?? years`.

    - **Data Requirements**
 
        | Data Point | Source |
        |------------|--------|
        | Today's birthdays | Supabase `birthday_entries` table, filtered by today's month and day |
        | Age calculation | Server-side: current year − birth year |
        | Cycle index | Tracked server-side per device — increments each render cycle, resets when all birthdays shown |
        
        All data is computed server-side. The device receives a simple JSON payload and renders only.
 
    - **JSON payload example**
 
        ```json
        {
        "name": "Maria",
        "age": 45
        }
        ```
 
        > If birth year is not set, `age` is sent as `null` and the device displays `?? years`.
 
    - **Notes**
 
        - This app only appears in the rotation **on the birthday date itself** (matching month and day)
        - If no birthdays match today, the app is **skipped entirely** in the rotation
        - The server handles all date matching logic — the device always renders whatever it receives
 
---
- **Happy Birthday Message**
 
    - **Layout**: A celebratory full-screen message app that displays "Happy Birthday" and the person's name alongside a balloon illustration. Designed to be seen by people in the room — a festive ambient display on the birthday itself.
 
    ```
    [ HAPPY      ] [ balloons ]
    [ BIRTHDAY   ] [ balloons]
    [ SEBASTIAN  ] [ balloons ]
    [  ~75% w    ] [25%]
    ```

        - **Left section (~75% width)**: three lines of text, left-aligned
        - **Right section (~25% width)**: 3 balloons pixel art illustration, centered vertically

    - **Text Lines**
 
        | Line | Content | Notes |
        |------|---------|-------|
        | 1 | `HAPPY` | Fixed label — language dependent |
        | 2 | `BIRTHDAY` | Fixed label — language dependent |
        | 3 | Person's name | e.g. `SEBASTIAN` — truncated with ellipsis if too long |
 
    - **Language variants**
 
        | Language | Line 1 | Line 2 |
        |----------|--------|--------|
        | English | `HAPPY` | `BIRTHDAY` |
        | Spanish | `FELIZ` | `CUMPLEAÑOS` |
        
        > `CUMPLEAÑOS` is 10 characters. Verify during implementation whether it fits at standard font size. If it does not fit, reduce font size for that line only before considering abbreviation. Preserve the full word if at all possible.
 
    - **Name Truncation**: The left section fits approximately **8–9 characters** at standard dot-matrix font size. Names longer than the available width are truncated with an ellipsis:
 
        - `MARIA` → `MARIA` (fits)
        - `SEBASTIAN` → `SEBAST...`
 
    - **Balloon Illustration**
 
        - **3 balloons** stacked vertically, centered in the right section
        - Pre-stored pixel array in firmware (`PROGMEM`) — single static illustration
        - Colors: blue (`#4488FF`) top-left, red (`#FF3333`) top-right, yellow (`#FFDD00`) bottom-center (slightly larger)
        - 3 strings converging downward to a single knot point at the bottom of the section
        - Balloon strings rendered as single pixel lines below each balloon
 
    - **Multiple Birthdays on the Same Day**
 
        When two or more people share the same birthday (up to 5 entries per device):
 
        - Only **one person is shown per app cycle**
        - On the next rotation cycle, the **next person** is shown
        - Once all people have been shown, it **starts over** from the first
        - Order is determined by the order they were added in the web app
 
    - **Visual Design**
 
        - **Font:** Dot-matrix pixel font, all caps
        - **Color:** White text only
        - **Illustration:** 3 balloons in bright accent colors, pre-stored pixel array

    - **Configuration (Web App)**
 
        | Setting | Detail |
        |---------|--------|
        | Names | Up to 5 entries — first name or nickname, required |
        | Birthday | Day and month required; birth year not used in this app |
        
        > Birth year is intentionally not shown — this app is purely celebratory, not informational.
 
    - **Data Requirements**
 
        | Data Point | Source |
        |------------|--------|
        | Today's birthdays | Supabase `birthday_entries` table, filtered by today's month and day |
        | Cycle index | Tracked server-side per device — increments each render cycle, resets when all birthdays shown |
        
        All data is computed server-side. The device receives a simple JSON payload and renders only.
 
    - **JSON payload example**
 
        ```json
        {
        "name": "SEBASTIAN"
        }
        ```
 
    - **Notes**
 
        - This app only appears in the rotation **on the birthday date itself** (matching month and day)
        - If no birthdays match today, the app is **skipped entirely** in the rotation
        - No age is shown — name only
        - Maximum of **5 birthday entries** per device for this app
        - The server handles all date matching and cycle logic — the device always renders whatever it receives
        - Both birthday apps (Birthday and Happy Birthday) can be active simultaneously on the same device and will independently cycle through their respective entries

---
- **Word Clock**
    - **Layout**: Displays the current time expressed in natural spoken words, broken into exactly 3 lines with a cascading right indent (staircase effect). All text is white, dot-matrix pixel font, uppercase, large.
 
        ```
        HALF
            PAST
                NINE
        ```
 
        Each line is indented a fixed number of pixels more than the one above, creating a consistent staircase / waterfall effect from top to bottom.
 
 
    - **Time-to-Words Rules**
 
        - **English**
 
            | Minutes | Line 1 | Line 2 | Line 3 |
            |---------|--------|--------|--------|
            | :00 | `NINE` | `O'` | `CLOCK` |
            | :05 | `FIVE` | `PAST` | `NINE` |
            | :10 | `TEN` | `PAST` | `NINE` |
            | :15 | `QUARTER` | `PAST` | `NINE` |
            | :20 | `TWENTY` | `PAST` | `NINE` |
            | :25 | `TWENTY` | `FIVE PAST` | `NINE` |
            | :30 | `HALF` | `PAST` | `NINE` |
            | :35 | `TWENTY` | `FIVE TO` | `TEN` |
            | :40 | `TWENTY` | `TO` | `TEN` |
            | :45 | `QUARTER` | `TO` | `TEN` |
            | :50 | `TEN` | `TO` | `TEN` |
            | :55 | `FIVE` | `TO` | `TEN` |
 
            > `:25` and `:35` are the only cases with two words on one line (`FIVE PAST` / `FIVE TO`), which fit comfortably within the 64px display width at standard font size.

        - **Spanish**
 
            | Minutes | Line 1 | Line 2 | Line 3 |
            |---------|--------|--------|--------|
            | :00 | `LAS` | `NUEVE` | `EN PUNTO` |
            | :05 | `NUEVE` | `Y` | `CINCO` |
            | :10 | `NUEVE` | `Y` | `DIEZ` |
            | :15 | `NUEVE` | `Y` | `CUARTO` |
            | :20 | `NUEVE` | `Y` | `VEINTE` |
            | :25 | `NUEVE` | `Y` | `VEINTICINCO` |
            | :30 | `NUEVE` | `Y` | `MEDIA` |
            | :35 | `DIEZ` | `MENOS` | `VEINTICINCO` |
            | :40 | `DIEZ` | `MENOS` | `VEINTE` |
            | :45 | `DIEZ` | `MENOS` | `CUARTO` |
            | :50 | `DIEZ` | `MENOS` | `DIEZ` |
            | :55 | `DIEZ` | `MENOS` | `CINCO` |
            
            > `VEINTICINCO` is 11 characters — verify it fits within the 64px display width during implementation. If not, abbreviate to `VEINTI` / `CINCO` split across lines, but preserve the full word if possible.
 
    - **Language Support**
 
        Unlike other REDI apps where the server resolves all text, the Word Clock is an **exception** — word conversion logic runs entirely on the device. Both English and Spanish word tables are stored in firmware. The device receives the language setting once during initial configuration and uses it from that point on.
        
        This is necessary because the device polls the server every 5 minutes. If words were resolved server-side, the display could show stale text (e.g. `TWENTY PAST` when the real time is `TWENTY FIVE PAST`). Resolving on-device ensures the displayed words are always accurate to the current minute.
        
        The word tables for both languages are stored as lookup arrays in firmware (`PROGMEM`).
 
 
    - **Visual Design**
 
        - **Font:** Dot-matrix pixel font, all caps
        - **Color:** White text only, no accent colors
        - **Lines:** Always exactly 3
        - **Indent:** Each line shifts right by a fixed pixel offset (staircase effect)
        - **Sizing:** Large — letters are tall relative to row height
 

    - **Configuration (Web App)**
 
        | Setting | Options |
        |---------|---------|
        | Timezone | User-selectable (shared with other clock apps) |
        
        > Language is set at the device level and applies to all apps — not configured per app.
 
    - **Data Requirements**
 
        | Data Point | Source |
        |------------|--------|
        | Current time | Server timestamp → device maintains via internal clock |
        | Word conversion logic | On-device — both EN and ES word tables stored in firmware |
        | Language setting | Sent once during device configuration, stored on device |
        
        No word lines are included in the regular polling payload — the device computes them independently every minute from its internal clock.

---
- **Clock**
    - **Layout**: Displays the current time as a single large centered line in a classic dot-matrix style. Clean and minimal — just the time.
        ```
                12:10 AM
        ```
 
        Single line, perfectly centered horizontally and vertically on the 64×32 display.
  
    - **Elements**
 
        | Element | Detail |
        |---------|--------|
        | Time | Large dot-matrix digits with a `:` separator (e.g. `12:10`) |
        | AM/PM label | Same row, to the right of the time (e.g. `AM`) — hidden in 24h mode |
 
    - **Visual Design**
 
        - **Font:** Dot-matrix pixel font
        - **Color:** White only
        - **Alignment:** Centered horizontally and vertically
        - **Colon:** Static — does not blink
 
    - **Configuration (Web App)**
 
        | Setting | Options |
        |---------|---------|
        | Timezone | User-selectable (shared with other clock apps) |
        | Time format | 12h (shows AM/PM) or 24h (AM/PM label hidden) |
 
 
    - **Data Requirements**
 
        | Data Point | Source |
        |------------|--------|
        | Current time | Server timestamp → device maintains via internal clock |
 
        Fully self-contained — no external APIs needed.

---
- **3 Cities Clock**
    - **Layout**: The screen is divided into 3 horizontal rows, one per city, separated by faint dotted gray divider lines. Each row contains:

        - City name — left-aligned, dot-matrix pixel font, first letter capitalized only (e.g. New york)
        - Current time — right-aligned, dot-matrix digits in HH MM format (no colon, just a space), same cap-height as the city name letters — no oversized digits

    - **Color Coding**: Each city's name color is dynamic based on local solar time:

        - ☀️ Between sunrise and sunset → warm yellow/gold
        - 🌙 After sunset or before sunrise → blue/periwinkle
        - The time digits always remain white, regardless of day/night state.
    - **Dividers**: Rows separated by a horizontal dotted line in muted gray — evoking a departures board or scoreboard aesthetic.

    - **Configuration (web app)**
        - User selects 3 cities (with timezone auto-resolved from city)
        - Cities can be selected by user from a list provided by Weather API
        - Time always displayed in 24h format
        - Color is computed automatically from sunrise/sunset data for each city's location
        - Sunrise/sunset data sourced from the Weather API.

---
- **Clock and Date**
    - **Layout**: Displays the current time, day of week, and full date across three centered lines. A more informative variant of the plain Clock app.
        ```
        11 58 PM
        FRIDAY
        27 JUN 2025
        ```
 
        Three lines, all centered horizontally, filling the display vertically.
 

    -  *Elements*
 
        | Line | Element | Detail |
        |------|---------|--------|
        | 1 | Time | Large dot-matrix digits, space separator — no colon (e.g. `11 58 PM`) |
        | 2 | Day of week | Full day name, centered (e.g. `FRIDAY`) |
        | 3 | Date | Day number + 3-letter month + full year (e.g. `27 JUN 2025`) |
 
 
    - **Visual Design**
 
        - **Font:** Dot-matrix pixel font, all caps
        - **Color:** White only
        - **Alignment:** All three lines centered horizontally
        - **Time separator:** Space only — no colon (distinct from the plain Clock app which uses `:`)
 

   - **Configuration (Web App)**
 
        | Setting | Options |
        |---------|---------|
        | Timezone | User-selectable (shared with other clock apps) |
        | Time format | 12h (shows AM/PM) or 24h (AM/PM label hidden) |
        
    - **Data Requirements**
 
        | Data Point | Source |
        |------------|--------|
        | Current time and date | Server timestamp → device maintains via internal clock |
        | Day name | Resolved on-device from internal clock using firmware lookup table |
        | Month abbreviation | Resolved on-device from internal clock using firmware lookup table |
        | Language setting | Sent once during device configuration, stored on device |
        
        Fully self-contained — no external APIs needed. No translated strings sent in the polling payload.
 
    - **Language Support**
 
        Like the Word Clock, this app derives all displayed text purely from the device's internal clock — no external data needed. Day names and month abbreviations are therefore resolved **on the device**, not the server.
        
        Both English and Spanish lookup tables are stored in firmware (`PROGMEM`). The language setting is sent to the device once during configuration and stored locally.
        
        This avoids the 5-minute staleness problem — e.g. the day flipping from `FRIDAY` to `SATURDAY` at midnight without waiting for the next server poll.
 
    - **Day name lookup tables (firmware)**
 
        | English | Spanish |
        |---------|---------|
        | `MONDAY` | `LUNES` |
        | `TUESDAY` | `MARTES` |
        | `WEDNESDAY` | `MIERCOLES` |
        | `THURSDAY` | `JUEVES` |
        | `FRIDAY` | `VIERNES` |
        | `SATURDAY` | `SABADO` |
        | `SUNDAY` | `DOMINGO` |
        
        > `MIERCOLES` and `SABADO` omit accent marks — dot-matrix font is ASCII only.
 
    - **Month abbreviation lookup tables (firmware)**
 
        | Month | English | Spanish |
        |-------|---------|---------|
        | January | `JAN` | `ENE` |
        | February | `FEB` | `FEB` |
        | March | `MAR` | `MAR` |
        | April | `APR` | `ABR` |
        | May | `MAY` | `MAY` |
        | June | `JUN` | `JUN` |
        | July | `JUL` | `JUL` |
        | August | `AUG` | `AGO` |
        | September | `SEP` | `SEP` |
        | October | `OCT` | `OCT` |
        | November | `NOV` | `NOV` |
        | December | `DEC` | `DIC` |
        
        > Only 4 abbreviations differ between languages: `JAN/ENE`, `APR/ABR`, `AUG/AGO`, `DEC/DIC`. The rest are identical.
 

---
- **Date Progress bars**
    - **Layout**: Displays three horizontal progress bars representing how far through the current year, month, and day we are. Clean, minimal, and fully automatic — no configuration needed.
 
        ```
        Y 86% [████████████        |]
        M 54% [████████████        |]
        D 32% [████████            |]
        ```
 
        Three horizontal rows, one per time unit, evenly distributed vertically across the 32px display height.

 
    - **Elements Per Row**
 
        | Element | Detail |
        |---------|--------|
        | Label | Far left, single white dot-matrix letter, vertically centered |
        | Percentage | Immediately after the label, white digits sitting inside the filled portion (e.g. `86%`) |
        | Filled portion | Bright saturated color, extends rightward from the label area proportional to the percentage |
        | Unfilled portion | Pure black (off pixels) — not dim colored dots |
        | End cap | A single bright vertical line of the same color at the far right edge of the row |
 
        > **Low percentage edge case:** At very low values (e.g. `3%`) the filled area may not fully cover the percentage digits. Handle during implementation — options include always guaranteeing a minimum fill width to cover the label + percentage, or rendering the percentage in white regardless of fill coverage.

    - **The Three Rows**
 
        | Row | Label (EN) | Label (ES) | Color | Calculation |
        |-----|-----------|-----------|-------|-------------|
        | Year progress | `Y` | `A` | Red | `current_day / 365` (or 366 in leap year) |
        | Month progress | `M` | `M` | Green | `current_day_of_month / days_in_month` |
        | Day progress | `D` | `D` | Cyan / teal | `current_minute / 1440` |
        
        > Only the Year label changes between languages — `Y` (Year) in English, `A` (Año) in Spanish. Month and Day labels are identical in both languages.


    - **Progress Bar Visual Behavior**
 
        | Layer | Detail |
        |-------|--------|
        | Filled portion | Bright, saturated color dots from the left, proportional to the percentage |
        | Unfilled portion | Pure black — off pixels, no color |
        | End cap | Single-pixel-wide vertical bright line at far right edge of each row, same color as the bar |
        
        | Row | Filled color | End cap color |
        |-----|-------------|---------------|
        | Year | Bright red | Bright red |
        | Month | Bright green | Bright green |
        | Day | Bright cyan | Bright cyan |

 
    - **Language Support**
 
        Only the Year label is language-dependent. All other text (digits, `%` symbol) is universal.
        
        | Language | Year label |
        |----------|-----------|
        | English | `Y` |
        | Spanish | `A` |
        
        Language setting is stored on the device and applied locally — no language data needed in the server payload.
 
    - **Resolved On-Device**
        
        All three percentage values are derived purely from the device's internal clock. Calculations are performed on the device every minute, not sent from the server.
        
        This is especially important for the **Day progress bar**, which changes every minute — server-side resolution would cause the bar to jump in 5-minute chunks rather than advancing smoothly.
        
    - **Lookup table stored in firmware**
 
        - Days per month (12 values, leap year aware) — stored in `PROGMEM`
        - Language label for Year (`Y` / `A`) — set once during device configuration
 
    - **Calculation rules**
 
        | Row | Formula |
        |-----|---------|
        | Year | `floor((day_of_year / days_in_year) * 100)` |
        | Month | `floor((day_of_month / days_in_month) * 100)` |
        | Day | `floor((current_minute_of_day / 1440) * 100)` |
 
 
    - **Configuration (Web App)**: No user configuration needed — fully automatic. Driven entirely by the device's internal clock.
 
    - **Data Requirements**
 
        | Data Point | Source |
        |------------|--------|
        | Current date and time | Server timestamp → device maintains via internal clock |
        | Percentage calculations | On-device, computed every minute |
        | Days per month lookup | Stored in firmware (`PROGMEM`) |
        | Language label | Sent once during device configuration, stored on device |
        
        No percentage or progress data is included in the regular polling payload.

---
- **Weather Today & Tomorrow**
    
    Displays a two-column weather forecast for today and tomorrow, with a dot-matrix condition illustration for today and high/low temperatures for both days.

    - **Layout**
 
        The screen is split into two vertical columns divided by a faint dotted vertical line:
 
        - Left column — Today
        - Right column — Tomorrow

    - **Left Column — Today**
 
        | Element | Detail |
        |---------|--------|
        | Weather illustration | Top portion of left column, dot-matrix style graphic representing current condition (e.g. clouds + blue dots for rain) |
        | Day abbreviation | Bottom left, large white dot-matrix text (e.g. `FRI`) |
        | High temperature | Bottom right of left column, stacked on top (e.g. `69°`) |
        | Low temperature | Below high temp (e.g. `64°`) |
        
 
    - **Right Column — Tomorrow**
 
        | Element | Detail |
        |---------|--------|
        | Day abbreviation | Top right, large white dot-matrix text (e.g. `SAT`) |
        | High temperature | Center-bottom, stacked on top (e.g. `64°`) |
        | Low temperature | Below high temp (e.g. `63°`) |
        | Weather illustration | None — text data only |

    - **Divider**
 
        A faint **vertical dotted line** separates the two columns, consistent with the dotted dividers used across other REDI apps.
 
    - **Visual Design**
 
        - **Font:** Dot-matrix pixel font, all caps
        - **Color:** White text throughout; condition illustration may use accent colors (e.g. blue dots for rain, yellow for sun)
        - **Illustration style:** Dot-matrix graphic, server-mapped from WeatherAPI condition codes

    - **Condition Illustration System**
 
        - **How it works**
 
            Weather illustrations are **pre-drawn pixel arrays stored in device firmware** (`PROGMEM` flash memory — no RAM cost). Each illustration is identified by a small integer code. The server maps WeatherAPI's 57 fixed condition codes down to a smaller set of REDI illustration codes, and sends only the integer in the JSON payload.
 
        - **Why this approach**
 
            - Zero runtime memory cost — illustrations live in flash, not RAM
            - Works fully offline once firmware is flashed
            - WeatherAPI condition codes are **fixed and finite (57 total)** — weather conditions are a closed set, so the illustration library will never need to grow
        - Server controls the mapping — icon remapping never requires a firmware update
 
        - **REDI illustration codes**
 
            | Code | Condition |
            |------|-----------|
            | 1 | Sunny / Clear |
            | 2 | Partly cloudy |
            | 3 | Cloudy / Overcast |
            | 4 | Rainy |
            | 5 | Thunderstorm |
            | 6 | Snowy |
            | 7 | Foggy / Misty |
 
    - ***Configuration (Web App)**
 
        | Setting | Options |
        |---------|---------|
        | City / location | User-selectable |
        | Temperature unit | °F or °C |
 

    - **Data Requirements**
 
        | Data Point | Source |
        |------------|--------|
        | Today & tomorrow forecast | WeatherAPI |
        | High / low temperatures | WeatherAPI |
        | Condition illustration code | Mapped server-side from WeatherAPI's 57 fixed condition codes |
        | Sunrise / sunset | WeatherAPI (for day/night variant of illustration) |
 
        All data is fetched and pre-computed server-side. The device receives a structured JSON payload and renders only.

    - **Language Support**
        The only language-dependent text in this app is the day abbreviation (e.g. FRI / SAT). Temperatures and degree symbols are universal.
        The server resolves the correct day abbreviation based on the device language setting and sends it directly in the payload. The device renders it as-is — no language logic needed in firmware.
        ElementEnglishSpanishDay abbreviationMON TUE WED THU FRI SAT SUNLUN MAR MIE JUE VIE SAB DOM

        MIE omits the accent from MIÉ — dot-matrix font is ASCII only.



---
- **3 days weather**
    - **Layout**: Displays a three-column weather forecast for today, tomorrow, and the day after. Each column shows a weather illustration, day abbreviation, and high/low temperatures.
 
        ```
        [ icon  ] | [ icon  ] | [ icon  ]
        [  THU  ] | [  FRI  ] | [  SAT  ]
        [  69°  ] | [  69°  ] | [  64°  ]
        [  55°  ] | [  55°  ] | [  56°  ]
        ```
 
        Three equal vertical columns separated by faint dotted vertical dividers.
 
    - **Elements Per Column**
 
        | Element | Detail |
        |---------|--------|
        | Weather illustration | Top portion of column, dot-matrix pixel art icon |
        | Day abbreviation | 3-letter day name, centered in column (e.g. `THU`, `FRI`, `SAT`) with accent color |
        | High temperature | Large digits, centered in column (e.g. `69°`) |
        | Low temperature | Below high temp, same size (e.g. `55°`) |
 
 
    - **Color Coding — Day Abbreviations**
 
        Each column's day label uses a distinct accent color. Temperatures remain white.
 
        | Column | Day | Color |
        |--------|-----|-------|
        | 1 | Today | Warm orange / red |
        | 2 | Tomorrow | Cyan |
        | 3 | Day after | Blue / white |
 
        > Colors are fixed per column position — not dynamic.

    - **Dividers**: Faint **vertical dotted lines** between each column, consistent with the dotted dividers used across other REDI apps.

 
    - **Visual Design**
 
        - **Font:** Dot-matrix pixel font, all caps
        - **Temperature color:** White
        - **Day label color:** Accent color per column (see above)
        - **Illustration style:** Dot-matrix pixel art — same 9-illustration system used in Weather Today & Tomorrow
 
    - **Language Support**
 
        Language is a device-level setting (`language` field on the `devices` table, values: `"en"` or `"es"`). The server resolves the 3-letter day abbreviation in the correct language and sends it as a plain string in the payload. The device has no language logic — it renders whatever string it receives.
 
        **Day Abbreviations**

        | Day | English (`en`) | Spanish (`es`) |
        |-----|----------------|----------------|
        | Monday | `MON` | `LUN` |
        | Tuesday | `TUE` | `MAR` |
        | Wednesday | `WED` | `MIE` |
        | Thursday | `THU` | `JUE` |
        | Friday | `FRI` | `VIE` |
        | Saturday | `SAT` | `SAB` |
        | Sunday | `SUN` | `DOM` |

        > Unaccented forms (`MIE`, `SAB`) are used for Spanish to avoid firmware font requirements for `É` and `Á`. This matches common practice on LED matrix displays and keeps firmware font scope minimal.
    
    
    - **Condition Illustration System**
 
        Reuses the same illustration system defined in the Weather Today & Tomorrow spec:
 
        | Code | Condition |
        |------|-----------|
        | 1_day | Sunny |
        | 1_night | Clear night |
        | 2_day | Partly cloudy (sun) |
        | 2_night | Partly cloudy (moon) |
        | 3 | Cloudy / Overcast |
        | 4 | Rainy |
        | 5 | Thunderstorm |
        | 6 | Snowy |
        | 7 | Foggy / Misty |
 
        Server maps WeatherAPI's 57 fixed condition codes to these 9 codes and sends the integer in the JSON payload. Device renders the matching pre-stored pixel array.
 
    - **Configuration (Web App)**
 
        | Setting | Options |
        |---------|---------|
        | City / location | User-selectable |
        | Temperature unit | °F or °C |
 
    - **Data Requirements**
 
        | Data Point | Source |
        |------------|--------|
        | 3-day forecast | WeatherAPI |
        | High / low temperatures | WeatherAPI |
        | Condition illustration code | Mapped server-side from WeatherAPI's 57 fixed condition codes |
        | Sunrise / sunset | WeatherAPI (for day/night illustration variant for today's column) |
 
        All data is fetched and pre-computed server-side. The device receives a structured JSON payload and renders only.

---
- **Moon phase**
    - **Layout**: Displays the current moon phase as a large dot-matrix illustration on the left half, with the phase name on the right half. Simple, visual, and self-explanatory at a glance.
 
        ```
        [  moon illustration  ] [             ]
        [                     ] [ Waxing      ]
        [       ~50% w        ] [ Crescent    ]
        [                     ] [   ~50% w    ]
        ```
 
        - **Left section (50% width)** — moon phase pixel art illustration
        - **Right section (50% width)** — phase name, two lines, vertically centered
        - A faint vertical dotted divider separates the two sections

    - **Phase Name — Text Layout**: The phase name is split across **two lines**, first letter of each word capitalized:
 
        | Code | English | Spanish |
        |------|---------|---------|
        | 1 | `New` / `Moon` | `Luna` / `Nueva` |
        | 2 | `Waxing` / `Crescent` | `Luna` / `Creciente` |
        | 3 | `First` / `Quarter` | `Cuarto` / `Creciente` |
        | 4 | `Waxing` / `Gibbous` | `Gibosa` / `Creciente` |
        | 5 | `Full` / `Moon` | `Luna` / `Llena` |
        | 6 | `Waning` / `Gibbous` | `Gibosa` / `Menguante` |
        | 7 | `Last` / `Quarter` | `Cuarto` / `Menguante` |
        | 8 | `Waning` / `Crescent` | `Luna` / `Menguante` |
 

    - **Illustration System**: 8 pre-drawn pixel arrays stored in device firmware (`PROGMEM` flash memory — no RAM cost), one per named phase:
 
        | Code | Phase |
        |------|-------|
        | 1 | 🌑 New Moon |
        | 2 | 🌒 Waxing Crescent |
        | 3 | 🌓 First Quarter |
        | 4 | 🌔 Waxing Gibbous |
        | 5 | 🌕 Full Moon |
        | 6 | 🌖 Waning Gibbous |
        | 7 | 🌗 Last Quarter |
        | 8 | 🌘 Waning Crescent |
 
        WeatherAPI's `astronomy` endpoint returns the phase name as a string (e.g. `"Waxing Crescent"`). The server maps that string to one of the 8 codes and sends the integer in the JSON payload. The device looks up the matching illustration and renders it.
        
        > **Trade-off:** The illustration represents the named phase, not the exact illumination percentage. On a 64×32 dot-matrix display this difference is negligible.
 
    - **Visual Design**
 
        - **Font:** Dot-matrix pixel font, first letter of each word capitalized
        - **Color:** White text; moon illustration uses white and dark gray dots to represent illuminated and shadow sides
        - **Background:** Pure black
        - **Text alignment:** Left-aligned within the right section, vertically centered
 
    - **Language Support**: The phase name displayed on the right section follows the device language setting:
 
        | Device Language | Text |
        |----------------|------|
        | English | e.g. `Waxing` / `Crescent` |
        | Spanish | e.g. `Luna` / `Creciente` |
        
        The illustration is the same regardless of language.
 
    - **Configuration (Web App)**: No user configuration needed — fully automatic based on current date.

    - **Data Requirements**
 
        | Data Point | Source |
        |------------|--------|
        | Current moon phase name | WeatherAPI (`astronomy` endpoint) |
        
        All data is fetched server-side. The device receives a single integer code and the phase name string, and renders both.W
 
    - **JSON payload example**
 
        ```json
        {
        "phase": 2,
        "name": "Luna Creciente"
        }
        ```
 
        > The server resolves the correct language based on the device language setting and sends only the appropriate string. The device renders it as-is — no language logic on the firmware.
 
---
- **Currency Exchange Rate — COP/USD (TRM)**
 
    - **Overview**
 
        Displays the official Colombian Peso to US Dollar exchange rate (TRM — Tasa Representativa del
        Mercado), published daily by the Superintendencia Financiera de Colombia. Shows a filled area
        chart of recent history on the left, and the current rate with its daily change on the right.
 
    - **Layout**
 
        **Screen dimensions:** 64 × 32 pixels
        
        ```
        ┌────────────────────────────────────────────────────────────────┐
        │                          │                                     │
        │   [CHART — left ~40%]    │   [INFO — right ~60%]              │
        │                          │                                     │
        │   Filled green area      │   1 USD                            │
        │   chart, 20–30 days      │   4,350 COP                        │
        │                          │   +12.45                           │
        │                          │                                     │
        └────────────────────────────────────────────────────────────────┘
        ```
 
        | Zone  | X start | Width   |
        |-------|---------|---------|
        | Chart | 0       | ~26 px  |
        | Info  | ~28 px  | ~36 px  |
        
        A 2-pixel gap between the two zones acts as a visual separator (empty/black).
        
 
    - **Chart Zone (Left)**
 
        - **Data**
            - Displays the last **20–30 days** of end-of-day TRM rates (as many as fit cleanly at 1 px/column).
            - The server pre-normalizes values to a 0.0–1.0 float array and sends them in the JSON payload.
            - The device does no math on raw rates — it only maps normalized values to pixel heights.
 
        - **Visual Style**
            - **Type:** Filled area chart (mountain/silhouette).
            - **Orientation:** Left = oldest, Right = most recent.
            - **Color:** Always solid green (`#00AA00`) for all columns. TRM is always a positive 4-digit
            value (roughly 3,000–5,000 COP), so there is no concept of a "negative" bar.
            - **Y-axis:** Auto-scaled server-side to the min/max of the displayed window. No axis labels or
            ticks are rendered on screen.
            - **Chart area:** ~26 px wide × ~28 px tall (1–2 px vertical padding top and bottom).
            - Each column is 1 pixel wide. The fill extends from the data point **downward to the baseline**.
 
        - **Baseline**: A 1-pixel horizontal line at the very bottom of the chart area, drawn in dim gray (`#333333`),
  to visually anchor the chart.
 
 
    - **Info Zone (Right) — Exactly 3 Rows**
 
        The right side contains **exactly three rows**, vertically distributed across the 32 px height.
        
        ```
        Row 1 — Y: 2–7     →   1 USD
        Row 2 — Y: 12–21   →   4,350 COP
        Row 3 — Y: 25–31   →   +12.45  or  -3.56
        ```
 
        - **Row 1 — Currency label**
            - Static text: `1 USD`
            - Color: White (`#FFFFFF`)
            - Font: Small pixel font (~5 px tall)
            - Alignment: Left-aligned within the info zone
 
        - **Row 2 — Current rate**
            - Displays today's TRM rate + currency target label.
            - Format: `4,350 COP` (comma thousands separator, no decimals, followed by a space and `COP`)
            - Color: White or light gray (`#DDDDDD`)
            - Font: Medium pixel font (~8–10 px tall) — this is the dominant visual element on this side
            - If the value ever reaches 5 digits, drop the `COP` suffix to a new sub-row or scale font down.
 
        - **Row 3 — Daily delta**
            - Shows the difference between the **two most recent data points** (today vs. yesterday).
            - Format: `+12.45` or `-3.56` — always show sign, always two decimal places.
            - Color rules:
 
            | Condition   | Color                 |
            |-------------|-----------------------|
            | Positive    | Green (`#00AA00`)     |
            | Negative    | Red (`#AA0000`)       |
            | Zero        | Gray (`#888888`)      |
            
            - Font: Small pixel font (~5 px tall)
 
 
        - **Data Payload (from Server)**
 
            The server sends a structured JSON object on each device poll. Example:
            
            ```json
            {
            "app": "currency_trm",
            "current_rate": 4350.00,
            "delta": 12.45,
            "history_normalized": [0.31, 0.35, 0.40, 0.38, 0.52, 0.61, 0.58, 0.70, 0.75, 0.72,
                                    0.68, 0.74, 0.80, 0.77, 0.85, 0.88, 0.83, 0.90, 0.94, 1.00]
            }
            ```
 
            | Field                | Type        | Description                                                      |
            |----------------------|-------------|------------------------------------------------------------------|
            | `current_rate`       | float       | Today's TRM rate (COP per 1 USD), rounded to 2 decimal places   |
            | `delta`              | float       | `today - yesterday`, signed, rounded to 2 decimal places        |
            | `history_normalized` | float array | 20–30 values, each 0.0–1.0, oldest first, newest last            |
 
            - The device maps each normalized value to a column height: `pixel_height = round(value × chart_height_px)`
            - The device formats `current_rate` as a string with a comma separator (e.g. `4350.00` → `4,350`)
            - The device formats `delta` with explicit sign (e.g. `12.45` → `+12.45`, `-3.56` → `-3.56`)
            
 
    - **Data Source & Refresh**
 
        | Property           | Value                                                        |
        |--------------------|--------------------------------------------------------------|
        | Source             | Superintendencia Financiera de Colombia (TRM endpoint)       |
        | Fetch frequency    | Once per day (first poll after midnight)                     |
        | Retry on failure   | Every hour until success, then back to daily schedule        |
        | Storage            | Cached in Supabase `currency_history` table (30-day rolling) |
        | Served by          | REDI backend `/api/v1/render` on device poll                 |
 
 
    - **Display Duration**: Follows the standard rotation duration configured by the user: **5, 10, or 20 seconds**.
 
    - **Edge Cases**
 
        | Scenario                         | Behavior                                                    |
        |----------------------------------|-------------------------------------------------------------|
        | API fetch fails for today        | Show last cached rate; delta row shows `---` in gray        |
        | Only 1 day of data available     | Chart shows single bar; delta row shows `---` in gray       |
        | No history data at all           | Chart zone blank; info zone shows `---` for rate and delta  |
 
    - **App Settings (Configurable in Web App)**
 
        | Setting          | Options             | Default |
        |------------------|---------------------|---------|
        | Display duration | 5 / 10 / 20 seconds | 10 s    |
        
        No other user configuration — currency pair (USD → COP) and source (TRM) are fixed for this app.

---
- **Currency Exchange Rate — COP/EUR**
 
    - **Overview**: Displays the Colombian Peso to Euro exchange rate (COP per 1 EUR). Shows a filled area chart of recent history on the left, and the current rate with its daily change on the right.
    
        This app is identical in layout, payload shape, and firmware rendering logic to the **COP/USD (TRM)** app. The only differences are the data source, the currency label in Row 1 (`1 EUR` instead of `1 USD`), and the `app` identifier in the JSON payload.
 
        > ⚠️ **Status: TBD** — A free, reliable data source for the COP/EUR rate has not yet been
        > confirmed. This app should remain **disabled** in the web app and excluded from device
        > rotation until a source is identified and integrated on the server side. No firmware changes
        > will be required when it is enabled — the payload shape is identical to `currency_trm`.
 
    - **Layout**

        ```
        ┌────────────────────────────────────────────────────────────────┐
        │                          │                                     │
        │   [CHART — left ~40%]    │   [INFO — right ~60%]              │
        │                          │                                     │
        │   Filled green area      │   1 EUR                            │
        │   chart, 20–30 days      │   4,820 COP                        │
        │                          │   -8.30                            │
        │                          │                                     │
        └────────────────────────────────────────────────────────────────┘
        ```
 
        | Zone  | X start | Width   |
        |-------|---------|---------|
        | Chart | 0       | ~26 px  |
        | Info  | ~28 px  | ~36 px  |
        
        A 2-pixel gap between the two zones acts as a visual separator (empty/black).
 
 
    - **Chart Zone (Left)**
 
        - **Data**
            - Displays the last **20–30 days** of end-of-day COP/EUR rates (as many as fit cleanly at 1 px/column).
            - The server pre-normalizes values to a 0.0–1.0 float array and sends them in the JSON payload.
            - The device does no math on raw rates — it only maps normalized values to pixel heights.
 
        - **Visual Style**
            - **Type:** Filled area chart (mountain/silhouette).
            - **Orientation:** Left = oldest, Right = most recent.
            - **Color:** Always solid blue for all columns. The COP/EUR rate is always a positive 4-digit value (roughly in the same range as COP/USD), so there is no concept of a "negative" bar.
            - **Y-axis:** Auto-scaled server-side to the min/max of the displayed window. No axis labels or ticks are rendered on screen.
            - **Chart area:** ~26 px wide × ~28 px tall (1–2 px vertical padding top and bottom).
            - Each column is 1 pixel wide. The fill extends from the data point **downward to the baseline**.
 
        - **Baseline**
            - A 1-pixel horizontal line at the very bottom of the chart area, drawn in dim gray (`#333333`), to visually anchor the chart.
 
    - **Info Zone (Right) — Exactly 3 Rows**
 
        The right side contains **exactly three rows**, vertically distributed across the 32 px height.
 
        ```
        Row 1 — Y: 2–7     →   1 EUR
        Row 2 — Y: 12–21   →   4,820 COP
        Row 3 — Y: 25–31   →   +12.45  or  -3.56
        ```
 
        - **Row 1 — Currency label**
            - Static text: `1 EUR`
            - Color: White (`#FFFFFF`)
            - Font: Small pixel font (~5 px tall)
            - Alignment: Left-aligned within the info zone
 
        - **Row 2 — Current rate**
            - Displays today's COP/EUR rate + currency target label.
            - Format: `4,820 COP` (comma thousands separator, no decimals, followed by a space and `COP`)
            - Color: White or light gray (`#DDDDDD`)
            - Font: Medium pixel font (~8–10 px tall) — this is the dominant visual element on this side
            - If the value ever reaches 5 digits, drop the `COP` suffix or scale font down.
 
        - **Row 3 — Daily delta**
            - Shows the difference between the **two most recent data points** (today vs. yesterday).
            - Format: `+12.45` or `-3.56` — always show sign, always two decimal places.
            - Color rules:
 
                | Condition   | Color                 |
                |-------------|-----------------------|
                | Positive    | Green (`#00AA00`)     |
                | Negative    | Red (`#AA0000`)       |
                | Zero        | Gray (`#888888`)      |
 
            - Font: Small pixel font (~5 px tall)
 
    - **Data Payload (from Server)**
 
        The server sends a structured JSON object on each device poll. Example:

        ```json
        {
        "app": "currency_eur",
        "current_rate": 4820.00,
        "delta": -8.30,
        "history_normalized": [0.31, 0.35, 0.40, 0.38, 0.52, 0.61, 0.58, 0.70, 0.75, 0.72,
                                0.68, 0.74, 0.80, 0.77, 0.85, 0.88, 0.83, 0.90, 0.94, 1.00]
        }
        ```
            
        | Field                | Type        | Description                                                        |
        |----------------------|-------------|--------------------------------------------------------------------|
        | `app`                | string      | Always `"currency_eur"` for this app                               |
        | `current_rate`       | float       | Today's COP/EUR rate (COP per 1 EUR), rounded to 2 decimal places  |
        | `delta`              | float       | `today - yesterday`, signed, rounded to 2 decimal places           |
        | `history_normalized` | float array | 20–30 values, each 0.0–1.0, oldest first, newest last              |
        
        - The device maps each normalized value to a column height: `pixel_height = round(value × chart_height_px)`
        - The device formats `current_rate` as a string with a comma separator (e.g. `4820.00` → `4,820`)
        - The device formats `delta` with explicit sign (e.g. `-8.30` → `-8.30`, `12.45` → `+12.45`)
        
        The firmware rendering logic is **identical** to `currency_trm`. The only difference the device
        sees is the `app` identifier and the `1 EUR` label in Row 1.

 
    - **Data Source & Refresh**
            
        | Property           | Value                                                          |
        |--------------------|----------------------------------------------------------------|
        | Source             | **TBD** — free COP/EUR API not yet confirmed                   |
        | Fetch frequency    | Once per day (first poll after midnight), same as TRM          |
        | Retry on failure   | Every hour until success, then back to daily schedule          |
        | Storage            | Cached in Supabase `currency_history` table (30-day rolling)   |
        | Served by          | REDI backend `/api/v1/render` on device poll                   |

 
    - **Display Duration**
 
        Follows the standard rotation duration configured by the user: **5, 10, or 20 seconds**.
 
    - **Edge Cases**
 
        | Scenario                         | Behavior                                                    |
        |----------------------------------|-------------------------------------------------------------|
        | API fetch fails for today        | Show last cached rate; delta row shows `---` in gray        |
        | Only 1 day of data available     | Chart shows single bar; delta row shows `---` in gray       |
        | No history data at all           | Chart zone blank; info zone shows `---` for rate and delta  |
 
 
    - **App Settings (Configurable in Web App)**
 
        | Setting          | Options             | Default |
        |------------------|---------------------|---------|
        | Display duration | 5 / 10 / 20 seconds | 10 s    |
        
        No other user configuration — currency pair (EUR → COP) is fixed for this app.

---
- **Quotes App**
    - **Overview** Displays an inspiring quote that scrolls upward across the screen, one line at a time. The quote body is shown in white; the author attribution appears at the end in green. Quotes are stored server-side in both English and Spanish and delivered in the device's configured language. A different quote is shown each time the app appears in the rotation, cycling through all active quotes before repeating.

    - **Layout**: The display has 4 visible text rows at any given time. Text enters from the bottom and scrolls upward continuously, one pixel per frame.
        ```
        ┌────────────────────────────────────────────────────────────────┐
        │   Row 1  →  IT ALWAYS                                          │
        │   Row 2  →  SEEMS                                              │
        │   Row 3  →  IMPOSSIBLE                                         │
        │   Row 4  →  UNTIL IT'S                                         │
        └────────────────────────────────────────────────────────────────┘
        ```
        Text color: White (#FFFFFF) for quote body lines Author color: Green (#00CC44)
        
        Font: Standard 5×7 pixel font, uppercase, 1 px letter spacing.

        Alignment: Left-aligned, 1 px left margin

    - **Scroll Animation**

        - Text begins off-screen at the bottom and scrolls upward continuously.
        - Scroll speed: 1 pixel per frame at ~30 fps (≈ 33 ms/frame).
        - The scroll is continuous — no pauses mid-quote.
        - A blank line (4 px gap) separates the last body line from the author line, creating a natural visual pause before the attribution appears.
        - Once the author line exits the top of the screen, the app ends and the next app in rotation begins.
        - The app has no fixed duration — it runs for exactly as long as the scroll takes.

    - **Data Payload (from Server)**
 
        The server sends a structured JSON object on each device poll. Example:
        
        ```json
        {
        "app": "quotes",
        "lines": [
            "IT ALWAYS",
            "SEEMS",
            "IMPOSSIBLE",
            "UNTIL IT'S",
            "DONE."
        ],
        "author": "NELSON MANDELA"
        }
        ```

        | Field    | Type         | Description                                              |
        |----------|--------------|----------------------------------------------------------|
        | `lines`  | string array | Pre-wrapped body lines, uppercased, ≤ 10 chars each      |
        | `author` | string       | Author name, uppercased, ≤ 20 chars                      |
        
        - The server pre-wraps the raw quote text into lines that fit within 64 px (≤ 10 uppercase
        characters per line at 5×7 font + 1 px spacing = 6 px/char × 10 = 60 px, plus 1 px left margin).
        The device does **no text wrapping**.
        - All text is uppercased server-side before delivery.
        - Author names exceeding 20 characters are truncated with an ellipsis: `GABRIEL G. MARQU…`
 
    - **Quote Selection Logic (Server-Side)**
 
        - Quotes are selected **sequentially by `id ASC`**, cycling through all active quotes before
        repeating.
        - The server tracks the last quote shown per device (stored as `last_quote_id` on `device_apps`).
        - Language is determined by the device's configured `language` field (`en` or `es`).
        - If no quote exists for the device's language, the server falls back to English.
        - If the quotes table has no active entries, the app is **skipped silently** in rotation.

    - **Data Source & Refresh**
 
        | Property   | Value                                                         |
        |------------|---------------------------------------------------------------|
        | Source     | `quotes` table in Supabase, managed manually via admin panel  |
        | Languages  | English (`body_en`) and Spanish (`body_es`)                   |
        | Selection  | Sequential, one new quote per rotation appearance             |
        | Served by  | REDI backend `/api/v1/render` on device poll                  |
 
 
    - **Display Duration**
 
        The app duration is **dynamic** — it ends naturally when the author line scrolls off the top.
        No fixed 5/10/20 s setting applies to this app.
        
        Approximate durations:
        
        | Quote length  | Approx. duration |
        |---------------|-----------------|
        | 3 body lines  | ~2.5 s          |
        | 6 body lines  | ~3.5 s          |
        | 10 body lines | ~5.0 s          |

    - **Edge Cases**
 
        | Scenario                       | Behavior                                        |
        |--------------------------------|-------------------------------------------------|
        | No active quotes in database   | App skipped silently in rotation                |
        | No quote for device's language | Fall back to English                            |
        | Author name > 20 chars         | Truncated server-side with `…`                  |
        | Single word > 10 chars         | Placed alone on its line, truncated to 10 chars |
        | Device offline                 | Last cached quote payload is used               |
        
 
    - **App Settings (Configurable in Web App)**
 
        | Setting  | Options                                | Default |
        |----------|----------------------------------------|---------|
        | Language | Inherited from device language setting | —       |
        
        No per-device configuration for this app. Quote content is managed globally by the admin via
        the `/admin/quotes` page.
        
    - **Admin — Quote Management**
 
        A dedicated admin-only page allows adding, editing, and disabling quotes.
        
        | Feature       | Description                                            |
        |---------------|--------------------------------------------------------|
        | Add quote     | Fields: `body_en`, `body_es`, `author`                 |
        | Edit quote    | Update any field inline                                |
        | Toggle active | Enable/disable a quote without deleting                |
        | Delete quote  | Requires confirmation                                  |
        | Wrap preview  | Shows computed line wrapping for both languages        |
 
---
- **Countdown App** 
    - **Overview**: Displays the number of days remaining until five fixed annual events. The app occupies a **single slot** in the device's normal rotation. Each time the slot comes around, it shows **one event** — advancing to the next event on the following cycle, then looping back to the start. Each event has two thematic pixel art icons flanking a centered countdown display.
    
        On the day of the event itself, the number is replaced with the word `TODAY`, displayed as a single centered line between the same icons.

    - **Layout**
        
        ```
        ┌────────────────────────────────────────────────────────────────┐
        │                  │              │                              │
        │   [LEFT ICON]    │    N N N     │    [RIGHT ICON]             │
        │   (~14×20 px)    │    DAYS      │    (~14×20 px)              │
        │                  │              │                              │
        └────────────────────────────────────────────────────────────────┘
        ```
 
        | Zone       | X start | Width   |
        |------------|---------|---------|
        | Left icon  | 0       | ~14 px  |
        | Text       | ~16 px  | ~32 px  |
        | Right icon | ~50 px  | ~14 px  |
        
        A 1–2 px gap on each side of the text zone acts as breathing room between icons and text.

    - **Events**
 
        Five fixed annual events. Each has a fixed calendar date (month + day), two pixel art icons,
        and specific color rules for the countdown text.
 
        | # | Event          | Date    | Left Icon  | Right Icon | Number Color     | Label Color |
        |---|----------------|---------|------------|------------|------------------|-------------|
        | 1 | Valentine's Day| Feb 14  | Heart      | Heart      | Pink `#FF69B4`   | Pink `#FF69B4` |
        | 2 | Halloween      | Oct 31  | Pumpkin    | Ghost      | Orange `#FF6600` | Orange `#FF6600` |
        | 3 | Christmas      | Dec 25  | Xmas Tree  | Gift box   | Green `#00AA44`  | Green `#00AA44` |
        | 4 | New Year's Day | Jan 1   | Fireworks  | Fireworks  | White `#FFFFFF`  | White `#FFFFFF` |
        | 5 | Reyes Magos    | Jan 6   | Crown      | Star       | Gold `#FFD700`   | Gold `#FFD700` |

 
    - **Text Zone**
 
        - **Normal Display (1+ days remaining)**
 
            Two lines, vertically centered as a unit in the text zone:
            
            ```
            Line 1 — number of days remaining
            Line 2 — "DAYS"
            ```
 
        - **Line 1 (number):** Large pixel font (~10–12 px tall). Right-aligned or center-aligned
        within the text zone. Color per event table above.
        - **Line 2 ("DAYS"):** Small pixel font (~5–6 px tall). Centered below the number.
        Color per event table above, slightly dimmer (e.g. 70% brightness) to let the number dominate.
        - Vertical gap between Line 1 and Line 2: ~2 px.
        - The two lines together are centered vertically within the 32 px screen height.
        
    - **Number formatting:**
        
        | Days remaining | Display |
        |----------------|---------|
        | 365            | `365`   |
        | 30             | `30`    |
        | 1              | `1`     |
        | 0              | → see Section 4.2 |
        
        No leading zeros. No comma separators. Maximum value is 365.
 
    - **Event Day Display (0 days remaining)**
 
        Single line, vertically centered in the text zone:
        
        ```
        TODAY
        ```
        
        - **Font:** Medium pixel font (~7–8 px tall).
        - **Color:** Same event color as normal display.
        - Centered both horizontally and vertically within the text zone.
        - Icons remain the same — only the text changes.
 
    - **Pixel Art Icons**
 
        Each icon is stored as a const pixel array in firmware (~14 × 20 px, RGB).
        Icons are rendered left-aligned (left icon) and right-aligned (right icon) within their zones,
        vertically centered on the 32 px screen height.
        
        - **Icon Descriptions**
            
            | Icon        | Key Colors                        | Notes                                        |
            |-------------|-----------------------------------|----------------------------------------------|
            | Heart       | Pink/red `#FF1744`, dark outline  | Classic symmetrical heart shape              |
            | Crown       | Gold `#FFD700`, dark outline, small colored gems at base | 3–4 points on top |
            | Star        | Yellow `#FFD700`, outline, small shine marks at tips | 5-point star       |
            | Pumpkin     | Orange `#FF6600`, green stem, yellow triangle eyes/nose, yellow grin | Jack-o'-lantern |
            | Ghost       | White `#EEEEEE`, dark outline, dot eyes, small tongue in pink/magenta | Friendly ghost |
            | Xmas Tree   | Green `#006600`, brown trunk, small colored dots as ornaments, yellow star on top |
            | Gift box    | Red `#CC0000` body, white ribbon cross, yellow bow on top |
            | Fireworks   | Multicolor burst lines radiating from a center point (~5–6 rays), bright palette |
 
    - **Rotation Within the App**
 
        This app occupies **one slot** in the device rotation. Each time the slot comes around, it
        displays exactly **one event** for the full configured duration. On the next rotation cycle,
        it advances to the next event in the fixed order. After the fifth event, it loops back to the
        first.
 
        **Fixed event order (index 0 → 4):**
        
        ```
        0 — Valentine's Day
        1 — Halloween
        2 — Christmas
        3 — New Year's Day
        4 — Reyes Magos
        → back to 0
        ```
 
        **Starting condition:** The cycle always starts at index 0 (Valentine's Day) — both on first
        setup and after any reboot or offline period.
 
        **State management:** The server tracks which event index was last sent to each device (stored
        in the database, one field per device). On each poll, the server increments the index, wraps
        at 5, and sends only the next event in the payload. The device does not track state locally.
        
        > **Example:** The rotation goes Clock → Weather → Countdown (Halloween) → TRM → …
        > Next full cycle: Clock → Weather → Countdown (Christmas) → TRM → …
 
    - **Data Payload (from Server)**
 
        The server calculates the days remaining to the **current event** based on the device's
        configured timezone. Days are calculated as **calendar days** (not 24-hour periods): if today
        is Dec 24, Christmas is 1 day away.
        
        Only **one event** is sent per poll — whichever is next in the round-robin sequence.
        
        ```json
        {
        "app": "countdown",
        "event": { "key": "halloween", "days": 196 }
        }
        ```
 
        | Field  | Type    | Description                                                        |
        |--------|---------|--------------------------------------------------------------------|
        | `key`  | string  | Matches firmware icon/color lookup table                           |
        | `days` | integer | Calendar days until event; 0 = today is the event day             |
 
        **Server-side state stored in database (per device):**
 
        | Field                    | Type    | Description                                         |
        |--------------------------|---------|-----------------------------------------------------|
        | `countdown_event_index`  | integer | Index (0–4) of the last event sent to this device   |
        
        On each poll the server: reads the current index → increments it (mod 5) → writes it back →
        sends the event at the new index. On first poll (index not yet set), the server starts at 0.
 
    - **Display Duration**
 
        Follows the standard rotation duration configured by the user: **5, 10, or 20 seconds**.
        This is the duration for the single event shown each rotation cycle.

 
    - **Edge Cases**
        
        | Scenario                          | Behavior                                                    |
        |-----------------------------------|-------------------------------------------------------------|
        | `days` = 0                        | Show `TODAY` (single centered line) instead of number       |
        | `days` = 1                        | Show `1` / `DAYS` normally                                  |
        | First poll (no index stored yet)  | Server starts at index 0 (Valentine's Day)                  |
        | Device reboots                    | Server continues from last stored index — no reset          |
        | Device offline for multiple polls | Index does not advance while offline; resumes from last sent |
        | Server payload missing event key  | App shows blank text zone; icons still render               |
        | Device offline during rotation    | App skipped; clock shows instead                            |
 
    - **Visual Reference**
 
        ### Halloween — 137 days
        ```
        ┌────────────────────────────────────────────────────────────────┐
        │  🎃            │     137      │            👻                  │
        │  (pumpkin)     │     DAYS     │          (ghost)               │
        └────────────────────────────────────────────────────────────────┘
        Orange text
        ```
        
        ### Reyes Magos — 260 days
        ```
        ┌────────────────────────────────────────────────────────────────┐
        │  👑            │     260      │             ⭐                 │
        │  (crown)       │     DAYS     │           (star)               │
        └────────────────────────────────────────────────────────────────┘
        Gold text
        ```
        
        ### Christmas — event day
        ```
        ┌────────────────────────────────────────────────────────────────┐
        │  🎄            │    TODAY     │             🎁                 │
        │  (tree)        │              │            (gift)              │
        └────────────────────────────────────────────────────────────────┘
        Green text, single centered line
        ```
 
    - **App Settings (Configurable in Web App)**
 
        | Setting          | Options               | Default |
        |------------------|-----------------------|---------|
        | Display duration | 5 / 10 / 20 seconds   | 10 s    |
        
        No other configuration — the five events are fixed, always enabled, and advance automatically
        on each rotation cycle.

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
- General setting per device to set the City they are located. Should we infere the timezone from the City? or should user specify the timezone?
- General setting for apps display language in device: English or Spanish

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
- **Owner (me):** Full access to all devices, can invite others
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
| COP to EUR exchange rate | Maybe https://frankfurter.dev/ or https://dolarapi.com/docs/colombia/ |

---

## 10. Technical Preferences

### 10.1 Hosting
<!-- Where do you want to host the web app and API? -->
- Managed platform to start (Vercel, Supabase or similar)
- Recommend something

### 10.2 Domain
<!-- Will you use a custom domain? -->
- Yes it is: `rediapp.app`

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
- Maybe `api.rediapp.app` — device API (what firmware calls, forever)
- Maybe `app.rediapp.app` — web dashboard (what users open in browser)
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


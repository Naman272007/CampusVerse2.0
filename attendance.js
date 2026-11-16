
"use strict";

/* =========================================
   1. DATE FORMAT
========================================= */

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

/* =========================================
   2. SETTINGS
========================================= */

const SETTINGS = Object.freeze({
  MODE: "local",
  LOCAL_KEY: "campusverse-attendance-single-student-v1",
  API_ENDPOINT: "/api/attendance/state/",
  YEAR1_START: "2026-08-24",
  YEAR1_END: "2026-12-30"
});

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday"
];

const CLASS_TIMES = {
  1: ["09:00", "09:55"],
  2: ["10:00", "10:55"],
  3: ["11:00", "11:55"],
  4: ["12:00", "12:55"],
  5: ["14:00", "14:55"],
  6: ["15:00", "15:55"],
  7: ["16:00", "16:55"],
  8: ["17:00", "17:55"]
};

const SUBJECTS = {
  music: "Music",
  iot: "Internet of Things",
  linear: "Linear Algebra & Matrix Analysis",
  programming: "Programming with C",
  entrepreneurship: "Entrepreneurship",
  digital: "Digital Electronics using Verilog",
  calculus: "Calculus",
  workshop: "IT Workshop",
  advance1: "ILC-Advance 1",
  advance2: "ILC-Advance 2",
  basic: "ILC-Basic",
  yoga: "Yoga"
};

const lesson = (subject, lectures, code = "") => ({
  subject,
  lectures,
  code
});

/* =========================================
   3. YEAR I TIMETABLES
========================================= */

const TIMETABLES = {
  "1": {
    DSAI: {
      Monday: [
        lesson("music", [1, 2]),
        lesson("iot", [3, 4], "C"),
        lesson("advance1", [5]),
        lesson("linear", [6], "F")
      ],

      Tuesday: [
        lesson("programming", [1], "M"),
        lesson("entrepreneurship", [2, 3], "A"),
        lesson("linear", [5, 6], "F"),
        lesson("digital", [7, 8], "B")
      ],

      Wednesday: [
        lesson("basic", [1]),
        lesson("workshop", [2], "G"),
        lesson("digital", [3], "B"),
        lesson("calculus", [4], "N"),
        lesson("advance1", [5, 6]),
        lesson("music", [7, 8])
      ],

      Thursday: [
        lesson("workshop", [1, 2], "G"),
        lesson("programming", [3], "M"),
        lesson("advance2", [4]),
        lesson("programming", [5, 6], "M"),
        lesson("calculus", [7], "N"),
        lesson("digital", [8], "B")
      ],

      Friday: [
        lesson("calculus", [1, 2], "N"),
        lesson("iot", [3], "C"),
        lesson("linear", [4], "F"),
        lesson("advance2", [5, 6])
      ]
    },

    CSE: {
      Monday: [
        lesson("music", [1, 2]),
        lesson("digital", [3], "L"),
        lesson("programming", [4], "B"),
        lesson("advance1", [5]),
        lesson("linear", [6], "A")
      ],

      Tuesday: [
        lesson("calculus", [1, 2], "Z"),
        lesson("workshop", [3], "P"),
        lesson("programming", [4], "B"),
        lesson("calculus", [5], "Z"),
        lesson("iot", [6], "F"),
        lesson("entrepreneurship", [7, 8], "E")
      ],

      Wednesday: [
        lesson("basic", [1]),
        lesson("linear", [2], "A"),
        lesson("calculus", [3], "Z"),
        lesson("advance1", [5, 6]),
        lesson("music", [7, 8])
      ],

      Thursday: [
        lesson("linear", [1, 2], "A"),
        lesson("digital", [3], "L"),
        lesson("advance2", [4]),
        lesson("digital", [5, 6], "L"),
        lesson("iot", [7, 8], "F")
      ],

      Friday: [
        lesson("programming", [1, 2], "B"),
        lesson("workshop", [3, 4], "P"),
        lesson("advance2", [5, 6])
      ]
    },

    ECE: {
      Monday: [
        lesson("music", [1, 2]),
        lesson("workshop", [3], "H"),
        lesson("linear", [4], "V"),
        lesson("advance1", [5]),
        lesson("programming", [6], "A")
      ],

      Tuesday: [
        lesson("programming", [1, 2], "A"),
        lesson("linear", [3], "V"),
        lesson("calculus", [4], "B"),
        lesson("workshop", [5, 6], "H"),
        lesson("calculus", [7, 8], "B")
      ],

      Wednesday: [
        lesson("basic", [1]),
        lesson("entrepreneurship", [3, 4], "D"),
        lesson("advance1", [5, 6]),
        lesson("music", [7, 8])
      ],

      Thursday: [
        lesson("programming", [3], "A"),
        lesson("advance2", [4]),
        lesson("iot", [5], "C"),
        lesson("linear", [6, 7], "V")
      ],

      Friday: [
        lesson("calculus", [2], "B"),
        lesson("iot", [3, 4], "C"),
        lesson("advance2", [5, 6])
      ]
    }
  },

  "2": { DSAI: null, CSE: null, ECE: null },
  "3": { DSAI: null, CSE: null, ECE: null },
  "4": { DSAI: null, CSE: null, ECE: null }
};

/* =========================================
   4. STORAGE DATA
========================================= */

const EMPTY = () => ({
  version: 1,
  marks: {},
  cancelledDays: {},
  excludedCourses: {},
  excludedSlots: {}
});

function validateData(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    value.version !== 1
  ) {
    throw new Error("Unsupported attendance data version.");
  }

  const result = EMPTY();

  for (const key of [
    "marks",
    "cancelledDays",
    "excludedCourses",
    "excludedSlots"
  ]) {
    if (
      !value[key] ||
      typeof value[key] !== "object" ||
      Array.isArray(value[key])
    ) {
      throw new Error(`Invalid ${key} in attendance data.`);
    }

    result[key] = Object.fromEntries(
      Object.entries(value[key]).filter(
        ([name]) =>
          name !== "__proto__" &&
          name !== "constructor"
      )
    );
  }

  return result;
}

/* =========================================
   5. STORAGE ADAPTER
========================================= */

const AttendanceStore = {
  async load() {
    if (SETTINGS.MODE === "local") {
      const saved = localStorage.getItem(SETTINGS.LOCAL_KEY);

      return saved
        ? validateData(JSON.parse(saved))
        : EMPTY();
    }

    const response = await fetch(SETTINGS.API_ENDPOINT, {
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Unable to load attendance.");
    }

    return validateData(await response.json());
  },

  async save(value) {
    if (SETTINGS.MODE === "local") {
      localStorage.setItem(
        SETTINGS.LOCAL_KEY,
        JSON.stringify(value)
      );
      return;
    }

    const csrf = document.cookie.match(
      /(?:^|;\s*)csrftoken=([^;]+)/
    );

    const response = await fetch(SETTINGS.API_ENDPOINT, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf
          ? decodeURIComponent(csrf[1])
          : ""
      },
      body: JSON.stringify(value)
    });

    if (!response.ok) {
      throw new Error("Unable to save attendance.");
    }
  }
};

/* =========================================
   6. APPLICATION STATE
========================================= */

let data = EMPTY();
let selectedYear = "1";
let selectedBranch = "DSAI";
let activeTab = "mark";

let selectedDate = (() => {
  const now = new Date();

  const today =
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`;

  if (today < SETTINGS.YEAR1_START) {
    return SETTINGS.YEAR1_START;
  }

  if (today > SETTINGS.YEAR1_END) {
    return SETTINGS.YEAR1_END;
  }

  return today;
})();

let saveQueue = Promise.resolve();

const el = id => document.getElementById(id);
const pad = value => String(value).padStart(2, "0");

function parseDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isoDate(date) {
  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}`
  );
}

function getWeekday(iso) {
  return DAYS[parseDate(iso).getDay()];
}

function className(item) {
  const prefix = item.code ? item.code + ". " : "";
  return prefix + SUBJECTS[item.subject];
}

function contextKey() {
  return `${selectedYear}|${selectedBranch}`;
}

function dateKey(date = selectedDate) {
  return `${contextKey()}|${date}`;
}

function courseKey(subject) {
  return `${contextKey()}|${subject}`;
}

function specialKey(slot) {
  return `${contextKey()}|${slot}`;
}

function markKey(date, slot) {
  return `${dateKey(date)}|${slot}`;
}

function slotId(item) {
  return `${item.lectures.join("-")}:${item.subject}`;
}

function currentTimetable() {
  return TIMETABLES[selectedYear]?.[selectedBranch] || null;
}

function inRange(date) {
  return (
    selectedYear !== "1" ||
    (
      date >= SETTINGS.YEAR1_START &&
      date <= SETTINGS.YEAR1_END
    )
  );
}

function has(dictionary, key) {
  return Boolean(dictionary[key]);
}

function setFlag(dictionary, key, enabled) {
  if (enabled) {
    dictionary[key] = true;
  } else {
    delete dictionary[key];
  }
}

function showNotice(message, error = false) {
  el("notice").textContent = message;
  el("notice").style.color = error
    ? "var(--red)"
    : "var(--cyan)";
}

function save() {
  const snapshot = structuredClone(data);

  saveQueue = saveQueue
    .then(() => AttendanceStore.save(snapshot))
    .catch(error => showNotice(error.message, true));

  return saveQueue;
}

/* =========================================
   7. TIME FORMATTING
========================================= */

function formatClock(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const hour12 = hours % 12 || 12;

  return `${pad(hour12)}:${pad(minutes)}`;
}

function timeSpan(lectures) {
  const first = CLASS_TIMES[lectures[0]][0];
  const last = CLASS_TIMES[lectures.at(-1)][1];

  const firstSuffix =
    Number(first.slice(0, 2)) < 12 ? "AM" : "PM";

  const lastSuffix =
    Number(last.slice(0, 2)) < 12 ? "AM" : "PM";

  if (firstSuffix === lastSuffix) {
    return (
      `${formatClock(first)}–` +
      `${formatClock(last)} ${lastSuffix}`
    );
  }

  return (
    `${formatClock(first)} ${firstSuffix}–` +
    `${formatClock(last)} ${lastSuffix}`
  );
}

function lectureLabel(lectures) {
  if (lectures.length === 1) {
    return `Lecture ${lectures[0]}`;
  }

  return `Lectures ${lectures[0]}–${lectures.at(-1)}`;
}

/* =========================================
   8. INDIVIDUAL ATTENDANCE DROPDOWN
========================================= */

function statusDropdown(slot, disabled, label) {
  const value =
    data.marks[markKey(selectedDate, slot)] || "unmarked";

  const statuses = [
    ["unmarked", "Not Marked"],
    ["present", "Present"],
    ["absent", "Absent"],
    ["cancelled", "Cancel This Class"]
  ];

  return `
    <select
      class="status"
      data-mark="${slot}"
      aria-label="${label} attendance"
      ${disabled ? "disabled" : ""}>

      ${statuses.map(([status, name]) => `
        <option
          value="${status}"
          ${value === status ? "selected" : ""}>
          ${name}
        </option>
      `).join("")}
    </select>
  `;
}

/* =========================================
   9. NORMAL COURSE CARD
========================================= */

function normalCard(item) {
  const slot = slotId(item);

  const dayCancelled = has(
    data.cancelledDays,
    dateKey()
  );

  const excluded = has(
    data.excludedCourses,
    courseKey(item.subject)
  );

  return `
    <article class="class-card">
      <div class="class-head">
        <div>
          <h3 class="class-name">${className(item)}</h3>
          <div class="class-time">
            ${timeSpan(item.lectures)}
          </div>
        </div>

        <span class="pill">
          ${lectureLabel(item.lectures)}
        </span>
      </div>

      <div class="control-row">
        ${statusDropdown(
          slot,
          dayCancelled || excluded,
          SUBJECTS[item.subject]
        )}

        <label class="checkbox-label">
          <input
            type="checkbox"
            data-course="${item.subject}"
            ${excluded ? "checked" : ""}
            ${dayCancelled ? "disabled" : ""}>

          Not Applicable to Me
        </label>
      </div>
    </article>
  `;
}

/* =========================================
   10. MONDAY OPTIONAL CLASSES
========================================= */

function mondayOption(name, slot) {
  const combinedExcluded = has(
    data.excludedSlots,
    specialKey("monday-neither")
  );

  const excluded = has(
    data.excludedSlots,
    specialKey(slot)
  );

  const dayCancelled = has(
    data.cancelledDays,
    dateKey()
  );

  const disabled =
    dayCancelled || combinedExcluded || excluded;

  return `
    <div class="special-option">
      <div class="class-head">
        <div>
          <h4 class="class-name">${name}</h4>
          <div class="class-time">04:00–05:55 PM</div>
        </div>
      </div>

      <div class="control-row">
        ${statusDropdown(slot, disabled, name)}

        <label class="checkbox-label">
          <input
            type="checkbox"
            data-special="${slot}"
            ${excluded ? "checked" : ""}
            ${dayCancelled || combinedExcluded
              ? "disabled" : ""}>

          Not Applicable to Me — this option
        </label>
      </div>
    </div>
  `;
}

function mondaySpecial() {
  const neither = has(
    data.excludedSlots,
    specialKey("monday-neither")
  );

  const dayCancelled = has(
    data.cancelledDays,
    dateKey()
  );

  return `
    <article class="class-card">
      <div class="class-head">
        <div>
          <h3 class="class-name">Yoga / ILC-Basic</h3>
          <div class="class-time">04:00–05:55 PM</div>
        </div>

        <span class="pill">Lectures 7–8</span>
      </div>

      ${mondayOption("Yoga", "monday-yoga")}
      ${mondayOption("ILC-Basic", "monday-basic")}

      <div class="special-option combined">
        <label class="checkbox-label">
          <input
            type="checkbox"
            data-special="monday-neither"
            ${neither ? "checked" : ""}
            ${dayCancelled ? "disabled" : ""}>

          Not Applicable to Me —
          neither Yoga nor ILC-Basic
        </label>
      </div>
    </article>
  `;
}

/* =========================================
   11. FRIDAY YOGA
========================================= */

function fridaySpecial() {
  const excluded = has(
    data.excludedSlots,
    specialKey("friday-yoga")
  );

  const dayCancelled = has(
    data.cancelledDays,
    dateKey()
  );

  return `
    <article class="class-card">
      <div class="class-head">
        <div>
          <h3 class="class-name">Yoga</h3>
          <div class="class-time">04:00–05:55 PM</div>
        </div>

        <span class="pill">Lectures 7–8</span>
      </div>

      <div class="control-row">
        ${statusDropdown(
          "friday-yoga",
          dayCancelled || excluded,
          "Friday Yoga"
        )}

        <label class="checkbox-label">
          <input
            type="checkbox"
            data-special="friday-yoga"
            ${excluded ? "checked" : ""}
            ${dayCancelled ? "disabled" : ""}>

          Not Applicable to Me — Friday only
        </label>
      </div>
    </article>
  `;
}

/* =========================================
   12. APPLICABLE SLOTS FOR BULK ACTIONS
========================================= */

function getApplicableSlots() {
  const timetable = currentTimetable();
  const day = getWeekday(selectedDate);

  if (
    !timetable ||
    !inRange(selectedDate) ||
    !WEEKDAYS.includes(day)
  ) {
    return [];
  }

  const slots = [];

  for (const item of timetable[day] || []) {
    if (
      has(
        data.excludedCourses,
        courseKey(item.subject)
      )
    ) {
      continue;
    }

    slots.push(slotId(item));
  }

  if (day === "Monday") {
    const neither = has(
      data.excludedSlots,
      specialKey("monday-neither")
    );

    if (!neither) {
      if (
        !has(
          data.excludedSlots,
          specialKey("monday-yoga")
        )
      ) {
        slots.push("monday-yoga");
      }

      if (
        !has(
          data.excludedSlots,
          specialKey("monday-basic")
        )
      ) {
        slots.push("monday-basic");
      }
    }
  }

  if (day === "Friday") {
    if (
      !has(
        data.excludedSlots,
        specialKey("friday-yoga")
      )
    ) {
      slots.push("friday-yoga");
    }
  }

  return slots;
}

/* =========================================
   13. PRESENT ALL / ABSENT ALL
========================================= */

function bulkSetAttendance(status, checked) {
  if (
    has(data.cancelledDays, dateKey()) ||
    !currentTimetable() ||
    !inRange(selectedDate)
  ) {
    renderAll();
    return;
  }

  const slots = getApplicableSlots();

  if (!slots.length) {
    renderAll();
    return;
  }

  for (const slot of slots) {
    const key = markKey(selectedDate, slot);

    if (checked) {
      // Replaces existing attendance for applicable slots.
      data.marks[key] = status;
    } else if (data.marks[key] === status) {
      // Reset matching marks to Not Marked.
      delete data.marks[key];
    }
  }

  save();
  renderAll();
}

/* =========================================
   14. MUTUALLY EXCLUSIVE BULK CONTROLS
========================================= */

function updateBulkControls() {
  const cancelToggle = el("cancelAll");
  const presentToggle = el("presentAll");
  const absentToggle = el("absentAll");

  const cancelled = has(
    data.cancelledDays,
    dateKey()
  );

  const slots = getApplicableSlots();

  const validDay =
    currentTimetable() &&
    inRange(selectedDate) &&
    WEEKDAYS.includes(getWeekday(selectedDate));

  const disableBulk =
    !validDay ||
    cancelled ||
    slots.length === 0;

  cancelToggle.checked = cancelled;
  cancelToggle.disabled = !validDay;

  presentToggle.disabled = disableBulk;
  absentToggle.disabled = disableBulk;

  if (disableBulk) {
    presentToggle.checked = false;
    absentToggle.checked = false;
    return;
  }

  const allPresent = slots.every(
    slot =>
      data.marks[markKey(selectedDate, slot)] ===
      "present"
  );

  const allAbsent = slots.every(
    slot =>
      data.marks[markKey(selectedDate, slot)] ===
      "absent"
  );

  presentToggle.checked = allPresent;
  absentToggle.checked = allAbsent;
}

/* =========================================
   15. WEEKDAY NAVIGATION
========================================= */

function renderWeekdayNav() {
  const selectedDay = getWeekday(selectedDate);

  el("weekdayBar").innerHTML = WEEKDAYS.map(day => `
    <button
      type="button"
      class="weekday ${selectedDay === day ? "active" : ""}"
      data-day="${day}"
      ${!currentTimetable() ? "disabled" : ""}>

      ${day.slice(0, 3)}
    </button>
  `).join("");
}

/* =========================================
   16. RENDER CLASSES
========================================= */

function renderClasses() {
  const day = getWeekday(selectedDate);

  el("dayTitle").textContent = `${day} Timetable`;

  el("dateInfo").textContent =
    parseDate(selectedDate).toLocaleDateString(
      "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );

  updateBulkControls();
  renderWeekdayNav();

  const timetable = currentTimetable();

  if (!timetable) {
    el("classes").innerHTML = `
      <div class="empty">
        Timetable not added yet.
      </div>
    `;
    return;
  }

  if (!inRange(selectedDate)) {
    el("classes").innerHTML = `
      <div class="empty">
        No timetable is available for this date.
      </div>
    `;
    return;
  }

  if (!WEEKDAYS.includes(day)) {
    el("classes").innerHTML = `
      <div class="empty">
        No scheduled classes on this day.
      </div>
    `;
    return;
  }

  const entries = (timetable[day] || []).map(item => ({
    order: item.lectures[0],
    html: normalCard(item)
  }));

  if (day === "Monday") {
    entries.push({
      order: 7,
      html: mondaySpecial()
    });
  }

  if (day === "Friday") {
    entries.push({
      order: 7,
      html: fridaySpecial()
    });
  }

  const hasAfternoon = entries.some(
    item => item.order >= 5
  );

  if (hasAfternoon) {
    entries.push({
      order: 4.5,
      html: `
        <div class="lunch">
          LUNCH · 01:00–02:00 PM
        </div>
      `
    });
  }

  entries.sort((a, b) => a.order - b.order);

  const cancelled = has(
    data.cancelledDays,
    dateKey()
  );

  const warning = cancelled
    ? `
      <div class="warning">
        All classes cancelled for this date.
        Previous attendance marks are preserved.
      </div>
    `
    : "";

  el("classes").innerHTML =
    warning + entries.map(item => item.html).join("");
}

/* =========================================
   17. CALCULATE TOTAL ATTENDANCE
========================================= */

function calculateTotals() {
  const timetable = currentTimetable();

  if (!timetable) return [];

  const totals = new Map();

  function ensure(subject) {
    if (!totals.has(subject)) {
      totals.set(subject, {
        name: SUBJECTS[subject],
        present: 0,
        absent: 0,
        cancelled: 0,
        unmarked: 0
      });
    }

    return totals.get(subject);
  }

  // Create a summary for every scheduled subject.
  for (const lessons of Object.values(timetable)) {
    for (const item of lessons) {
      ensure(item.subject);
    }
  }

  ensure("yoga");
  ensure("basic");

  const start = SETTINGS.YEAR1_START;
  const end = SETTINGS.YEAR1_END;

  const current = parseDate(start);
  const last = parseDate(end);

  while (current <= last) {
    const date = isoDate(current);
    const weekday = DAYS[current.getDay()];

    current.setDate(current.getDate() + 1);

    if (!WEEKDAYS.includes(weekday)) continue;

    if (
      has(
        data.cancelledDays,
        dateKey(date)
      )
    ) {
      continue;
    }

    const sessions = (
      timetable[weekday] || []
    ).map(item => ({
      slot: slotId(item),
      subject: item.subject,
      special: null
    }));

    if (weekday === "Monday") {
      sessions.push(
        {
          slot: "monday-yoga",
          subject: "yoga",
          special: "monday-yoga"
        },
        {
          slot: "monday-basic",
          subject: "basic",
          special: "monday-basic"
        }
      );
    }

    if (weekday === "Friday") {
      sessions.push({
        slot: "friday-yoga",
        subject: "yoga",
        special: "friday-yoga"
      });
    }

    for (const session of sessions) {
      let excluded;

      if (session.special) {
        excluded =
          has(
            data.excludedSlots,
            specialKey(session.special)
          ) ||
          (
            weekday === "Monday" &&
            has(
              data.excludedSlots,
              specialKey("monday-neither")
            )
          );
      } else {
        excluded = has(
          data.excludedCourses,
          courseKey(session.subject)
        );
      }

      if (excluded) continue;

      const status =
        data.marks[markKey(date, session.slot)] ||
        "unmarked";

      const total = ensure(session.subject);

      if (status in total) {
        total[status]++;
      }
    }
  }

  return [...totals.entries()].map(
    ([id, record]) => ({
      id,
      ...record
    })
  );
}

/* =========================================
   18. RENDER TOTAL ATTENDANCE
========================================= */

function renderTotals() {
  if (!currentTimetable()) {
    el("overview").innerHTML = "";
    el("totals").innerHTML = `
      <div class="empty">
        Timetable not added yet.
      </div>
    `;
    return;
  }

  const entries = calculateTotals();

  const sum = field =>
    entries.reduce(
      (total, item) => total + item[field],
      0
    );

  const present = sum("present");
  const absent = sum("absent");
  const cancelled = sum("cancelled");

  const overall = present + absent
    ? (
      100 * present / (present + absent)
    ).toFixed(1) + "%"
    : "—";

  const metrics = [
    ["Attendance", overall],
    ["Present", present],
    ["Absent", absent],
    ["Cancelled", cancelled]
  ];

  el("overview").innerHTML = metrics.map(
    ([label, value]) => `
      <div class="metric">
        <label>${label}</label>
        <strong>${value}</strong>
      </div>
    `
  ).join("");

  el("totals").innerHTML = entries.map(item => {
    const conducted =
      item.present + item.absent;

    const percentage = conducted
      ? (
        100 * item.present / conducted
      ).toFixed(1) + "%"
      : "—";

    const excluded = has(
      data.excludedCourses,
      courseKey(item.id)
    );

    return `
      <article class="total-card">
        <div class="total-top">
          <span>${item.name}</span>
          <span class="percent">${percentage}</span>
        </div>

        <div class="details">
          Conducted: ${conducted} ·
          Present: ${item.present} ·
          Absent: ${item.absent} ·
          Cancelled: ${item.cancelled} ·
          Not marked: ${item.unmarked}
        </div>

        ${excluded
          ? `
            <p class="exclude-hint">
              Regular course occurrences excluded.
            </p>
          `
          : ""}
      </article>
    `;
  }).join("");
}

/* =========================================
   19. RENDER ENTIRE PAGE
========================================= */

function renderAll() {
  const romanYears = ["", "I", "II", "III", "IV"];

  el("branchBadge").textContent =
    `${romanYears[Number(selectedYear)]} Year · ` +
    selectedBranch;

  const dateInput = el("date");

  dateInput.min = selectedYear === "1"
    ? SETTINGS.YEAR1_START
    : "";

  dateInput.max = selectedYear === "1"
    ? SETTINGS.YEAR1_END
    : "";

  dateInput.value = selectedDate;

  el("dateDisplay").textContent =
    formatDate(selectedDate);

  el("year").value = selectedYear;
  el("branch").value = selectedBranch;

  renderClasses();
  renderTotals();
}

/* =========================================
   20. WEEKDAY SELECTION
========================================= */

function moveToWeekday(name) {
  const target = WEEKDAYS.indexOf(name) + 1;

  if (target < 1) return;

  const current = parseDate(selectedDate);

  const offset =
    (current.getDay() + 6) % 7;

  const monday = new Date(current);

  monday.setDate(monday.getDate() - offset);

  const candidate = new Date(monday);

  candidate.setDate(
    candidate.getDate() + target - 1
  );

  const date = isoDate(candidate);

  if (inRange(date)) {
    selectedDate = date;
    renderAll();
    return;
  }

  if (selectedYear === "1") {
    const first = parseDate(SETTINGS.YEAR1_START);
    const last = parseDate(SETTINGS.YEAR1_END);

    for (
      let d = new Date(first);
      d <= last;
      d.setDate(d.getDate() + 1)
    ) {
      if (DAYS[d.getDay()] === name) {
        selectedDate = isoDate(d);
        renderAll();
        return;
      }
    }
  }
}

/* =========================================
   21. SWITCH TABS
========================================= */

function switchTab(value) {
  activeTab = value;

  el("markPanel").hidden = value !== "mark";
  el("totalPanel").hidden = value !== "total";

  el("markTab").classList.toggle(
    "active",
    value === "mark"
  );

  el("totalTab").classList.toggle(
    "active",
    value === "total"
  );

  el("markTab").setAttribute(
    "aria-selected",
    String(value === "mark")
  );

  el("totalTab").setAttribute(
    "aria-selected",
    String(value === "total")
  );

  if (value === "total") {
    renderTotals();
  }
}

/* =========================================
   22. EXPORT AND IMPORT
========================================= */

function exportBackup() {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "campusverse-attendance-backup.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  showNotice("Backup exported successfully.");
}

async function importBackup(file) {
  if (!file) return;

  try {
    const json = await file.text();
    const imported = validateData(JSON.parse(json));

    if (!window.confirm(
      "Replace all saved attendance with this backup?"
    )) {
      return;
    }

    data = imported;

    await save();
    renderAll();

    showNotice("Backup imported successfully.");
  } catch (error) {
    showNotice(error.message, true);
  }
}

/* =========================================
   23. EVENT LISTENERS
========================================= */

function registerEvents() {
  // Year selection
  el("year").addEventListener("change", event => {
    selectedYear = event.target.value;

    if (
      selectedYear === "1" &&
      !inRange(selectedDate)
    ) {
      selectedDate = SETTINGS.YEAR1_START;
    }

    renderAll();
  });

  // Branch selection
  el("branch").addEventListener("change", event => {
    selectedBranch = event.target.value;
    renderAll();
  });

  // Date selection
  el("date").addEventListener("change", event => {
    const newDate = event.target.value;

    if (
      !newDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(newDate) ||
      !inRange(newDate)
    ) {
      renderAll();
      return;
    }

    selectedDate = newDate;
    renderAll();
  });

  // Calendar popup
  el("date").addEventListener("click", event => {
    if (typeof event.target.showPicker === "function") {
      try {
        event.target.showPicker();
      } catch (_) {
        // Use browser's default date-picker behavior.
      }
    }
  });

  // Weekday navigation
  el("weekdayBar").addEventListener("click", event => {
    const button = event.target.closest(
      "button[data-day]"
    );

    if (button) {
      moveToWeekday(button.dataset.day);
    }
  });

  // CANCEL ALL CLASSES
  el("cancelAll").addEventListener("change", event => {
    setFlag(
      data.cancelledDays,
      dateKey(),
      event.target.checked
    );

    // Existing marks are preserved.
    save();
    renderAll();
  });

  // PRESENT ALL
  el("presentAll").addEventListener("change", event => {
    bulkSetAttendance(
      "present",
      event.target.checked
    );
  });

  // ABSENT ALL
  el("absentAll").addEventListener("change", event => {
    bulkSetAttendance(
      "absent",
      event.target.checked
    );
  });

  // Individual attendance and exclusions
  el("classes").addEventListener("change", event => {
    const input = event.target;

    if (input.dataset.mark) {
      const key = markKey(
        selectedDate,
        input.dataset.mark
      );

      if (input.value === "unmarked") {
        delete data.marks[key];
      } else {
        data.marks[key] = input.value;
      }

    } else if (input.dataset.course) {
      setFlag(
        data.excludedCourses,
        courseKey(input.dataset.course),
        input.checked
      );

    } else if (input.dataset.special) {
      setFlag(
        data.excludedSlots,
        specialKey(input.dataset.special),
        input.checked
      );

    } else {
      return;
    }

    save();
    renderAll();
  });

  // Tabs
  el("markTab").addEventListener(
    "click",
    () => switchTab("mark")
  );

  el("totalTab").addEventListener(
    "click",
    () => switchTab("total")
  );

  // Export
  el("exportBtn").addEventListener(
    "click",
    exportBackup
  );

  // Import
  el("importBtn").addEventListener("click", () => {
    el("importFile").click();
  });

  el("importFile").addEventListener(
    "change",
    async event => {
      await importBackup(event.target.files[0]);
      event.target.value = "";
    }
  );

  // Reset
  el("clearBtn").addEventListener("click", () => {
    if (!window.confirm(
      "Delete all attendance records and preferences?"
    )) {
      return;
    }

    data = EMPTY();

    save();
    renderAll();

    showNotice("Local attendance data reset.");
  });
}

/* =========================================
   24. START APPLICATION
========================================= */

async function start() {
  registerEvents();

  try {
    data = await AttendanceStore.load();
  } catch (error) {
    showNotice(
      `Unable to load data: ${error.message}`,
      true
    );
  }

  renderAll();
}

document.addEventListener(
  "DOMContentLoaded",
  start
);

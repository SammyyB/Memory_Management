// --- Helper Functions ---
function timeToMinutes(t) {
  if (!t) return NaN;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  if (isNaN(mins)) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// --- Parse Job Data ---
function parseJobs() {
  const rows = document.querySelectorAll("#jobTable tbody tr");
  return Array.from(rows)
    .map((row, index) => {
      const cells = row.querySelectorAll("input");
      const size = parseInt(cells[0].value);
      const arrival = timeToMinutes(cells[1].value);
      const run = parseInt(cells[2].value);
      if (isNaN(size) || isNaN(arrival) || isNaN(run)) return null;
      return { id: index + 1, size, arrival, run };
    })
    .filter(Boolean)
    .sort((a, b) => a.arrival - b.arrival);
}

// --- Display Results ---
function displayResults(jobs, title) {
  const tbody = document.querySelector("#resultTable tbody");
  tbody.innerHTML = "";
  let lastFinish = 0;

  jobs.forEach(j => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${j.id}</td>
      <td>${minutesToTime(j.arrival)}</td>
      <td>${j.run}</td>
      <td>${j.start === "-" ? "-" : minutesToTime(j.start)}</td>
      <td>${j.finish === "-" ? "-" : minutesToTime(j.finish)}</td>
      <td>${j.wait === "-" ? "-" : j.wait}</td>
      <td>${j.memoryAfter === "-" ? "-" : j.memoryAfter}</td>
    `;
    tbody.appendChild(tr);
    if (!isNaN(j.finish)) lastFinish = Math.max(lastFinish, j.finish);
  });

  const firstArrival = Math.min(...jobs.map(j => j.arrival));
  const totalTime = lastFinish - firstArrival;
  document.querySelector("#summary").textContent =
    `${title} — All jobs finished at: ${minutesToTime(lastFinish)} (Total elapsed time: ${totalTime} minutes)`;
}

// --- Timeline-Based Simulation ---
function simulateJobs(jobs, totalMemory, compaction) {
  const timeline = []; // {start, finish, size}
  const results = [];

  for (let job of jobs) {
    if (job.size > totalMemory) {
      results.push({ ...job, start: "-", finish: "-", wait: "-", memoryAfter: "-" });
      continue;
    }

    let currentTime = job.arrival;

    while (true) {
      // Clean up finished jobs from timeline
      const runningJobs = timeline.filter(j => j.finish > currentTime);
      const usedMemory = runningJobs.reduce((sum, j) => sum + j.size, 0);

      if (usedMemory + job.size <= totalMemory) break;

      // Move time to the earliest finish among running jobs
      const nextFinish = Math.min(...runningJobs.map(j => j.finish));
      currentTime = nextFinish;
    }

    const start = currentTime;
    const finish = start + job.run;
    const wait = start - job.arrival;

    timeline.push({ start, finish, size: job.size });

    let memoryAfter;
    if (compaction) {
      // Memory available at start = totalMemory - sum of running jobs at this start time
      memoryAfter = totalMemory - timeline.reduce((sum, j) => sum + j.size, 0);
    } else {
      // Without compaction: sequential, memory only freed by jobs that finished before this start
      const active = timeline.filter(j => j.finish > start);
      memoryAfter = totalMemory - active.reduce((sum, j) => sum + j.size, 0);
    }

    results.push({ ...job, start, finish, wait, memoryAfter });
  }

  return results;
}

// --- Run With Compaction ---
function runWithCompaction() {
  const memory = parseInt(document.getElementById("memorySize").value);
  const os = parseInt(document.getElementById("osSize").value);
  const available = memory - os;
  const jobs = parseJobs();
  if (!jobs.length) return alert("Please enter at least one valid job.");

  const results = simulateJobs(jobs, available, true);
  displayResults(results, "With Compaction");
}

// --- Run Without Compaction ---
function runWithoutCompaction() {
  const memory = parseInt(document.getElementById("memorySize").value);
  const os = parseInt(document.getElementById("osSize").value);
  const available = memory - os;
  const jobs = parseJobs();
  if (!jobs.length) return alert("Please enter at least one valid job.");

  const results = simulateJobs(jobs, available, false);
  displayResults(results, "Without Compaction");
}

// --- Add / Remove Job Rows ---
function addJobRow() {
  const tbody = document.querySelector("#jobTable tbody");
  const rowCount = tbody.rows.length + 1;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${rowCount}</td>
    <td><input type="number" min="1" placeholder="Size (K)" /></td>
    <td><input type="time" /></td>
    <td><input type="number" min="1" placeholder="Run Time (min)" /></td>
    <td><button class="remove-btn">✖</button></td>
  `;
  tbody.appendChild(tr);

  tr.querySelector(".remove-btn").addEventListener("click", () => {
    tr.remove();
    updateJobNumbers();
  });
}

function updateJobNumbers() {
  document.querySelectorAll("#jobTable tbody tr").forEach((tr, i) => {
    tr.cells[0].textContent = i + 1;
  });
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#addJob").addEventListener("click", addJobRow);
  document.querySelector("#withCompaction").addEventListener("click", runWithCompaction);
  document.querySelector("#withoutCompaction").addEventListener("click", runWithoutCompaction);

  if (document.querySelector("#jobTable tbody").rows.length === 0) addJobRow();
});
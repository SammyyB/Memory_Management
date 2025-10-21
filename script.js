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

  jobs.forEach((j) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${j.id}</td>
      <td>${minutesToTime(j.arrival)}</td>
      <td>${j.run}</td>
      <td>${minutesToTime(j.start)}</td>
      <td>${minutesToTime(j.finish)}</td>
      <td>${j.wait}</td>
      <td>${j.memoryAfter}</td>
    `;
    tbody.appendChild(tr);
    lastFinish = Math.max(lastFinish, j.finish);
  });

  const firstArrival = Math.min(...jobs.map((j) => j.arrival));
  const totalTime = lastFinish - firstArrival;

  document.querySelector("#summary").textContent =
    `${title} — All jobs finished at: ${minutesToTime(lastFinish)} (Total elapsed time: ${totalTime} minutes)`;
}

// --- With Compaction ---
function runWithCompaction() {
  const memory = parseInt(document.getElementById("memorySize").value);
  const os = parseInt(document.getElementById("osSize").value);
  const available = memory - os;

  let jobs = parseJobs();
  if (!jobs.length) return alert("Please enter at least one valid job.");

  // Clone jobs to avoid previous mutation
  jobs = jobs.map(j => ({ ...j }));
  let memoryBlocks = [];

  jobs = jobs.map((j) => {
    if (j.size > available) {
      return { ...j, start: "-", finish: "-", wait: "-", memoryAfter: "-" };
    }

    let start = j.arrival;

    // Remove finished jobs from memory
    memoryBlocks = memoryBlocks.filter(b => b.finish > start);

    // Wait until enough memory is available
    while (memoryBlocks.reduce((sum, b) => sum + b.size, 0) + j.size > available) {
      const earliestFinish = Math.min(...memoryBlocks.map(b => b.finish));
      start = Math.max(start, earliestFinish);
      memoryBlocks = memoryBlocks.filter(b => b.finish > start);
    }

    const wait = start - j.arrival;
    const finish = start + j.run;

    memoryBlocks.push({ start, finish, size: j.size });
    const memoryAfter = available - memoryBlocks.reduce((sum, b) => sum + b.size, 0);

    return { ...j, start, wait, finish, memoryAfter };
  });

  displayResults(jobs, "With Compaction");
}

// --- Without Compaction ---
function runWithoutCompaction() {
  const memory = parseInt(document.getElementById("memorySize").value);
  const os = parseInt(document.getElementById("osSize").value);
  const totalMemory = memory - os;

  let jobs = parseJobs();
  if (!jobs.length) return alert("Please enter at least one valid job.");

  // Clone jobs to avoid previous mutation
  jobs = jobs.map(j => ({ ...j }));
  let memoryBlocks = [];

  jobs = jobs.map((j) => {
    if (j.size > totalMemory) {
      return { ...j, start: "-", finish: "-", wait: "-", memoryAfter: "-" };
    }

    let start = j.arrival;

    // Wait until enough memory is available
    while (true) {
      memoryBlocks = memoryBlocks.filter(b => b.finish > start);
      const usedMemory = memoryBlocks.reduce((sum, b) => sum + b.size, 0);

      if (usedMemory + j.size <= totalMemory) break;

      const nextFree = Math.min(...memoryBlocks.map(b => b.finish));
      start = Math.max(start, nextFree);
    }

    const wait = start - j.arrival;
    const finish = start + j.run;

    memoryBlocks.push({ start, finish, size: j.size });
    const memoryAfter = totalMemory - memoryBlocks.reduce((sum, b) => sum + b.size, 0);

    return { ...j, start, wait, finish, memoryAfter };
  });

  displayResults(jobs, "Without Compaction");
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

  if (document.querySelector("#jobTable tbody").rows.length === 0) {
    addJobRow();
  }
});
function parseJobs() {
  const rows = document.querySelectorAll("#jobTable tbody tr");
  return Array.from(rows).map((row, index) => {
    const cells = row.querySelectorAll("input");
    return {
      id: index + 1,
      size: parseInt(cells[0].value),
      arrival: timeToMinutes(cells[1].value),
      run: parseInt(cells[2].value)
    };
  });
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

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
      <td>${minutesToTime(j.start)}</td>
      <td>${minutesToTime(j.finish)}</td>
      <td>${j.wait}</td>
      <td>${j.memoryAfter}</td>
    `;
    tbody.appendChild(tr);
    lastFinish = Math.max(lastFinish, j.finish);
  });

  document.querySelector("#summary").textContent = `All jobs finished at: ${minutesToTime(lastFinish)}`;
}

function runWithCompaction() {
  const memory = parseInt(document.getElementById("memorySize").value);
  const os = parseInt(document.getElementById("osSize").value);
  const available = memory - os;
  let jobs = parseJobs().sort((a, b) => a.arrival - b.arrival);

  let currentTime = jobs[0].arrival;
  let memAvail = available;

  jobs = jobs.map(j => {
    const wait = Math.max(0, currentTime - j.arrival);
    const start = Math.max(currentTime, j.arrival);
    const finish = start + j.run;
    memAvail = available - j.size;
    currentTime = finish;
    return { ...j, wait, start, finish, memoryAfter: memAvail };
  });

  displayResults(jobs, "With Compaction");
}

function runWithoutCompaction() {
  const memory = parseInt(document.getElementById("memorySize").value);
  const os = parseInt(document.getElementById("osSize").value);
  const available = memory - os;
  let jobs = parseJobs().sort((a, b) => a.arrival - b.arrival);

  let currentTime = jobs[0].arrival;
  let memAvail = available;

  jobs = jobs.map(j => {
    const wait = Math.max(0, currentTime - j.arrival);
    const start = Math.max(currentTime, j.arrival);
    const finish = start + j.run;
    memAvail -= j.size; // no compaction → memory keeps decreasing
    currentTime = finish;
    return { ...j, wait, start, finish, memoryAfter: memAvail };
  });

  displayResults(jobs, "Without Compaction");
}
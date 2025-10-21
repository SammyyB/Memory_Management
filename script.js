function parseTimeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}
function runSimulation(withCompaction) {
    const memorySize = Number(document.getElementById("memorySize").value);
    const osSize = Number(document.getElementById("osSize").value);
    const text = document.getElementById("jobs").value.trim();
    const jobs = text.split("\n").map((line, i) => {
        const [size, arrival, runtime] = line.split(",");
        return {
            id: i + 1,
            size: Number(size),
            arrival: parseTimeToMinutes(arrival),
            runtime: Number(runtime)
        };
    });
    let availableMemory = memorySize - osSize;
    let currentTime = jobs[0].arrival;
    let memoryBlocks = [];
    const results = [];
    for (const job of jobs) {
        currentTime = Math.max(currentTime, job.arrival);
        if (withCompaction) {
            // Remove finished jobs (compaction)
            memoryBlocks = memoryBlocks.filter(j => j.finish > currentTime);
        }
        else {
            // Non-compaction: memory freed when finished, but fragmentation possible
            memoryBlocks = memoryBlocks.filter(j => j.finish > currentTime);
        }
        const usedMemory = memoryBlocks.reduce((sum, j) => sum + j.size, 0);
        availableMemory = memorySize - osSize - usedMemory;
        if (job.size <= availableMemory) {
            job.start = currentTime;
            job.finish = job.start + job.runtime;
            job.wait = job.start - job.arrival;
            memoryBlocks.push(job);
        }
        else {
            // Wait until memory available
            const earliestFinish = Math.min(...memoryBlocks.map(j => j.finish));
            currentTime = earliestFinish;
            job.start = currentTime;
            job.finish = job.start + job.runtime;
            job.wait = job.start - job.arrival;
            memoryBlocks.push(job);
        }
        results.push(Object.assign({}, job));
    }
    displayResults(results, withCompaction);
}
function displayResults(jobs, withCompaction) {
    const container = document.getElementById("results");
    let html = `<h4>${withCompaction ? "With" : "Without"} Compaction</h4>`;
    html += `<table>
    <tr><th>Job #</th><th>Arrival</th><th>Start</th><th>Finish</th><th>Wait (min)</th></tr>`;
    for (const j of jobs) {
        html += `<tr>
      <td>${j.id}</td>
      <td>${j.arrival}</td>
      <td>${j.start}</td>
      <td>${j.finish}</td>
      <td>${j.wait}</td>
    </tr>`;
    }
    html += `</table>`;
    container.innerHTML = html;
}
document.getElementById("withCompaction").addEventListener("click", () => runSimulation(true));
document.getElementById("withoutCompaction").addEventListener("click", () => runSimulation(false));
export {};
//# sourceMappingURL=script.js.map
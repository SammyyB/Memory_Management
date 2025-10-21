
You sent
interface Job {
  id: number;
  size: number;
  arrival: number;
  runtime: number;
  start?: number;
  finish?: number;
  wait?: number;
}

class MemorySimulator {
  private osSize: number;
  private totalSize: number;
  private compaction: boolean;
  private jobs: Job[];
  private available: number;
  private runningJobs: Job[];

  constructor(osSize: number, totalSize: number, compaction: boolean, jobs: Job[]) {
    this.osSize = osSize;
    this.totalSize = totalSize;
    this.compaction = compaction;
    this.jobs = structuredClone(jobs);
    this.available = totalSize - osSize;
    this.runningJobs = [];
  }

  public allocate(): Job[] {
    let time = Math.min(...this.jobs.map(j => j.arrival));
    let allFinished = false;

    while (!allFinished) {
      // Release finished jobs
      this.runningJobs = this.runningJobs.filter(job => {
        if (job.finish === time) {
          this.available += job.size;
          return false;
        }
        return true;
      });

      // Try to allocate waiting jobs
      for (const job of this.jobs.sort((a, b) => a.arrival - b.arrival)) {
        if (job.start === undefined && job.arrival <= time) {
          if (job.size <= this.available) {
            this.allocateJob(job, time);
          } else if (this.compaction) {
            const totalFree = this.totalSize - this.osSize - this.runningJobs.reduce((s, j) => s + j.size, 0);
            if (job.size <= totalFree) this.allocateJob(job, time);
          }
        }
      }

      allFinished = this.jobs.every(j => j.finish !== undefined && time >= j.finish);
      time++;
    }
    return this.jobs;
  }

  private allocateJob(job: Job, t: number) {
    job.start = t;
    job.finish = t + job.runtime;
    job.wait = job.start - job.arrival;
    this.runningJobs.push(job);
    this.available -= job.size;
  }
}

document.getElementById("solve")?.addEventListener("click", () => {
  const osSize = parseInt((<HTMLInputElement>document.getElementById("osSize")).value);
  const totalSize = parseInt((<HTMLInputElement>document.getElementById("totalSize")).value);
  const compaction = (<HTMLSelectElement>document.getElementById("compaction")).value === "with";

  const jobsText = (<HTMLTextAreaElement>document.getElementById("jobs")).value.trim();
  const jobs: Job[] = jobsText.split("\n").map(line => {
    const [id, size, arrival, runtime] = line.split(" ").map(Number);
    return { id, size, arrival, runtime };
  });

  const sim = new MemorySimulator(osSize, totalSize, compaction, jobs);
  const result = sim.allocate();

  let tableHTML = <table><tr><th>Job</th><th>Arrival</th><th>Size(K)</th><th>Run</th><th>Start</th><th>Finish</th><th>Wait</th></tr>;
  result.forEach(j => {
    tableHTML += <tr><td>${j.id}</td><td>${j.arrival}</td><td>${j.size}</td><td>${j.runtime}</td><td>${j.start}</td><td>${j.finish}</td><td>${j.wait}</td></tr>;
  });
  tableHTML += "</table>";

  const output = document.getElementById("output");
  if (output) output.innerHTML = tableHTML;
});
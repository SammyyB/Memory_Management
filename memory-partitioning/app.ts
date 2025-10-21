type Partition = { size: number; allocated: boolean; process?: string };

function allocateMemoryWithCompaction(partitions: Partition[], processes: number[]): Partition[] {
    let mem = partitions.slice();
    for (let i = 0; i < processes.length; i++) {
        const index = mem.findIndex(p => !p.allocated && p.size >= processes[i]);
        if (index !== -1) {
            mem[index].allocated = true;
            mem[index].process = P${ i + 1 };
            mem[index].size -= processes[i];
        } else {
            const totalFree = mem.filter(p => !p.allocated).reduce((a, b) => a + b.size, 0);
            if (totalFree >= processes[i]) {
                const compacted = [{ size: totalFree, allocated: false }];
                mem = mem.filter(p => p.allocated).concat(compacted);
                i--; // retry this process
            }
        }
    }
    return mem;
}

function allocateMemoryWithoutCompaction(partitions: Partition[], processes: number[]): Partition[] {
    let mem = partitions.slice();
    for (let i = 0; i < processes.length; i++) {
        const index = mem.findIndex(p => !p.allocated && p.size >= processes[i]);
        if (index !== -1) {
            mem[index].allocated = true;
            mem[index].process = P${ i + 1 };
            mem[index].size -= processes[i];
        }
    }
    return mem;
}

// Example run:
const partitions: Partition[] = [
    { size: 100, allocated: false },
    { size: 200, allocated: false },
    { size: 300, allocated: false },
];

const processes = [120, 80, 200];
console.log("Without compaction:", allocateMemoryWithoutCompaction(partitions, processes));
console.log("With compaction:", allocateMemoryWithCompaction(partitions, processes));
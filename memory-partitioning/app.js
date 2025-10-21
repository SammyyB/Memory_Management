function allocateMemoryWithCompaction(partitions, processes) {
    var mem = partitions.slice();
    var _loop_1 = function (i) {
        var index = mem.findIndex(function (p) { return !p.allocated && p.size >= processes[i]; });
        if (index !== -1) {
            mem[index].allocated = true;
            mem[index].process = P$;
            {
                i + 1;
            }
            ;
            mem[index].size -= processes[i];
        }
        else {
            var totalFree = mem.filter(function (p) { return !p.allocated; }).reduce(function (a, b) { return a + b.size; }, 0);
            if (totalFree >= processes[i]) {
                var compacted = [{ size: totalFree, allocated: false }];
                mem = mem.filter(function (p) { return p.allocated; }).concat(compacted);
                i--; // retry this process
            }
        }
        out_i_1 = i;
    };
    var out_i_1;
    for (var i = 0; i < processes.length; i++) {
        _loop_1(i);
        i = out_i_1;
    }
    return mem;
}
function allocateMemoryWithoutCompaction(partitions, processes) {
    var mem = partitions.slice();
    var _loop_2 = function (i) {
        var index = mem.findIndex(function (p) { return !p.allocated && p.size >= processes[i]; });
        if (index !== -1) {
            mem[index].allocated = true;
            mem[index].process = P$;
            {
                i + 1;
            }
            ;
            mem[index].size -= processes[i];
        }
    };
    for (var i = 0; i < processes.length; i++) {
        _loop_2(i);
    }
    return mem;
}
// Example run:
var partitions = [
    { size: 100, allocated: false },
    { size: 200, allocated: false },
    { size: 300, allocated: false },
];
var processes = [120, 80, 200];
console.log("Without compaction:", allocateMemoryWithoutCompaction(partitions, processes));
console.log("With compaction:", allocateMemoryWithCompaction(partitions, processes));

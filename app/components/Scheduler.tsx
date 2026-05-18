"use client";
import { useState } from "react";

type Process = {
  id: string;
  arrival: number;
  burst: number;
  priority: number;
};

type Result = {
  pid: string;
  waiting: number;
  turnaround: number;
};

type GanttItem = {
  pid: string;
  start: number;
  end: number;
};

type AlgorithmResult = {
  results: Result[];
  gantt: GanttItem[];
  avgW: string;
  avgT: string;
};

// Default processes
const defaultProcesses: Process[] = [
  { id: "P1", arrival: 0, burst: 5, priority: 2 },
  { id: "P2", arrival: 1, burst: 3, priority: 1 },
  { id: "P3", arrival: 2, burst: 8, priority: 4 },
];

export default function Scheduler() {
  const [processes, setProcesses] = useState<Process[]>(defaultProcesses);
  const [quantum, setQuantum] = useState(2);
  const [selectedAlgo, setSelectedAlgo] = useState<string>("all");
  const [results, setResults] = useState<{
    fcfs: AlgorithmResult;
    sjf: AlgorithmResult;
    rr: AlgorithmResult;
    priority: AlgorithmResult;
  } | null>(null);

  // FCFS with Gantt Chart
  const fcfs = (procs: Process[]): AlgorithmResult => {
    const sorted = [...procs].sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    const res: Result[] = [];
    const gantt: GanttItem[] = [];
    
    for (const p of sorted) {
      if (time < p.arrival) {
        if (time < p.arrival) {
          gantt.push({ pid: "Idle", start: time, end: p.arrival });
        }
        time = p.arrival;
      }
      const waiting = time - p.arrival;
      const turnaround = waiting + p.burst;
      res.push({ pid: p.id, waiting, turnaround });
      gantt.push({ pid: p.id, start: time, end: time + p.burst });
      time += p.burst;
    }
    
    const avgW = (res.reduce((a, b) => a + b.waiting, 0) / res.length).toFixed(2);
    const avgT = (res.reduce((a, b) => a + b.turnaround, 0) / res.length).toFixed(2);
    
    return { results: res, gantt, avgW, avgT };
  };

  // SJF (Non-preemptive) with Gantt Chart
  const sjf = (procs: Process[]): AlgorithmResult => {
    const remaining = [...procs.map((p) => ({ ...p, remaining: p.burst }))];
    let time = 0;
    let done = 0;
    const res: Result[] = [];
    const gantt: GanttItem[] = [];
    const completed = new Set();
    
    while (done < procs.length) {
      const available = remaining.filter(
        (p) => p.arrival <= time && p.remaining > 0 && !completed.has(p.id)
      );
      
      if (available.length === 0) {
        const nextArrival = Math.min(...remaining.filter(p => !completed.has(p.id)).map(p => p.arrival));
        if (nextArrival > time) {
          gantt.push({ pid: "Idle", start: time, end: nextArrival });
          time = nextArrival;
        }
        continue;
      }
      
      available.sort((a, b) => a.burst - b.burst);
      const curr = available[0];
      const waiting = time - curr.arrival;
      const turnaround = waiting + curr.burst;
      res.push({ pid: curr.id, waiting, turnaround });
      gantt.push({ pid: curr.id, start: time, end: time + curr.burst });
      time += curr.burst;
      completed.add(curr.id);
      done++;
    }
    
    const avgW = (res.reduce((a, b) => a + b.waiting, 0) / res.length).toFixed(2);
    const avgT = (res.reduce((a, b) => a + b.turnaround, 0) / res.length).toFixed(2);
    
    return { results: res, gantt, avgW, avgT };
  };

  // Round Robin with Gantt Chart
  const roundRobin = (procs: Process[], quantumVal: number): AlgorithmResult => {
    const queue = [...procs.map((p) => ({ ...p, remaining: p.burst }))];
    queue.sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    const res: Result[] = [];
    const gantt: GanttItem[] = [];
    let complete = 0;
    const completedSet = new Set();
    let idx = 0;
    
    while (complete < procs.length) {
      if (idx >= queue.length) idx = 0;
      const p = queue[idx];
      
      if (p.remaining <= 0 || completedSet.has(p.id)) {
        idx++;
        continue;
      }
      
      if (time < p.arrival) {
        const nextArrival = p.arrival;
        if (time < nextArrival) {
          gantt.push({ pid: "Idle", start: time, end: nextArrival });
          time = nextArrival;
        }
        continue;
      }
      
      const exec = Math.min(quantumVal, p.remaining);
      gantt.push({ pid: p.id, start: time, end: time + exec });
      time += exec;
      p.remaining -= exec;
      
      if (p.remaining === 0) {
        const turnaround = time - p.arrival;
        const waiting = turnaround - p.burst;
        res.push({ pid: p.id, waiting, turnaround });
        completedSet.add(p.id);
        complete++;
      }
      idx++;
    }
    
    const avgW = (res.reduce((a, b) => a + b.waiting, 0) / res.length).toFixed(2);
    const avgT = (res.reduce((a, b) => a + b.turnaround, 0) / res.length).toFixed(2);
    
    return { results: res, gantt, avgW, avgT };
  };

  // Priority Scheduling with Gantt Chart
  const prioritySched = (procs: Process[]): AlgorithmResult => {
    const remaining = [...procs.map((p) => ({ ...p, remaining: p.burst }))];
    let time = 0;
    let done = 0;
    const res: Result[] = [];
    const gantt: GanttItem[] = [];
    const completed = new Set();
    
    while (done < procs.length) {
      const available = remaining.filter(
        (p) => p.arrival <= time && p.remaining > 0 && !completed.has(p.id)
      );
      
      if (available.length === 0) {
        const nextArrival = Math.min(...remaining.filter(p => !completed.has(p.id)).map(p => p.arrival));
        if (nextArrival > time) {
          gantt.push({ pid: "Idle", start: time, end: nextArrival });
          time = nextArrival;
        }
        continue;
      }
      
      available.sort((a, b) => a.priority - b.priority);
      const curr = available[0];
      const waiting = time - curr.arrival;
      const turnaround = waiting + curr.burst;
      res.push({ pid: curr.id, waiting, turnaround });
      gantt.push({ pid: curr.id, start: time, end: time + curr.burst });
      time += curr.burst;
      completed.add(curr.id);
      done++;
    }
    
    const avgW = (res.reduce((a, b) => a + b.waiting, 0) / res.length).toFixed(2);
    const avgT = (res.reduce((a, b) => a + b.turnaround, 0) / res.length).toFixed(2);
    
    return { results: res, gantt, avgW, avgT };
  };

  const calculate = () => {
    const fcfsRes = fcfs(processes);
    const sjfRes = sjf(processes);
    const rrRes = roundRobin(processes, quantum);
    const prioRes = prioritySched(processes);
    setResults({ fcfs: fcfsRes, sjf: sjfRes, rr: rrRes, priority: prioRes });
  };

  // Add new process
  const addProcess = () => {
    const newId = `P${processes.length + 1}`;
    setProcesses([...processes, { id: newId, arrival: 0, burst: 1, priority: 1 }]);
    setResults(null);
  };

  // Remove last process
  const removeLastProcess = () => {
    if (processes.length > 1) {
      setProcesses(processes.slice(0, -1));
      setResults(null);
    } else {
      alert("At least one process is required!");
    }
  };

  // Reset to default
  const resetAll = () => {
    setProcesses(defaultProcesses);
    setQuantum(2);
    setResults(null);
    setSelectedAlgo("all");
  };

  // Clear all results
  const clearResults = () => {
    setResults(null);
  };

  // Gantt Chart Component
  const GanttChart = ({ gantt }: { gantt: GanttItem[] }) => {
    return (
      <div className="mt-4">
        <h3 className="font-semibold text-lg mb-2">📊 Gantt Chart</h3>
        <div className="overflow-x-auto">
          <div className="flex min-w-max border rounded bg-gray-50">
            {gantt.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center border-r">
                <div
                  className={`px-3 py-2 text-center font-semibold ${
                    item.pid === "Idle" 
                      ? "bg-gray-300 text-gray-600" 
                      : "bg-blue-500 text-white"
                  }`}
                  style={{ minWidth: `${Math.max(60, (item.end - item.start) * 20)}px` }}
                >
                  {item.pid}
                </div>
                <div className="text-xs mt-1 text-gray-600">
                  {item.start}-{item.end}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          ⏱️ Time units (each block shows process execution)
        </div>
      </div>
    );
  };

  // Get visible columns based on selected algorithm
  const getVisibleColumns = () => {
    if (selectedAlgo === "fcfs") {
      return { arrival: true, burst: true, priority: false };
    } else if (selectedAlgo === "sjf") {
      return { arrival: true, burst: true, priority: false };
    } else if (selectedAlgo === "rr") {
      return { arrival: true, burst: true, priority: false };
    } else if (selectedAlgo === "priority") {
      return { arrival: true, burst: true, priority: true };
    } else {
      return { arrival: true, burst: true, priority: true };
    }
  };

  const visibleColumns = getVisibleColumns();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
         CPU Scheduling Simulator
      </h1>

      {/* Algorithm Selection Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">🎯 Select Scheduling Algorithm</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setSelectedAlgo("all")}
            className={`px-4 py-2 rounded font-semibold transition ${
              selectedAlgo === "all" 
                ? "bg-white text-blue-600 shadow-lg" 
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            📊 All Algorithms
          </button>
          <button
            onClick={() => setSelectedAlgo("fcfs")}
            className={`px-4 py-2 rounded font-semibold transition ${
              selectedAlgo === "fcfs" 
                ? "bg-white text-blue-600 shadow-lg" 
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            ⏰ FCFS
          </button>
          <button
            onClick={() => setSelectedAlgo("sjf")}
            className={`px-4 py-2 rounded font-semibold transition ${
              selectedAlgo === "sjf" 
                ? "bg-white text-blue-600 shadow-lg" 
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            ⚡ SJF
          </button>
          <button
            onClick={() => setSelectedAlgo("rr")}
            className={`px-4 py-2 rounded font-semibold transition ${
              selectedAlgo === "rr" 
                ? "bg-white text-blue-600 shadow-lg" 
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            🔄 Round Robin
          </button>
          <button
            onClick={() => setSelectedAlgo("priority")}
            className={`px-4 py-2 rounded font-semibold transition ${
              selectedAlgo === "priority" 
                ? "bg-white text-blue-600 shadow-lg" 
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            🎯 Priority
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">📝 Process Details</h2>
        
        {/* Show warning based on selection */}
        {selectedAlgo === "priority" && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mb-3 text-sm">
            💡 <strong>Note:</strong> Lower priority number = Higher priority
          </div>
        )}
        
        {selectedAlgo === "rr" && (
          <div className="bg-blue-100 border-l-4 border-blue-500 p-3 mb-3 text-sm">
            💡 <strong>Note:</strong> Don&apos;t forget to set Time Quantum below
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full border mb-4">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">Process ID</th>
                {visibleColumns.arrival && (
                  <th className="border p-2">Arrival Time</th>
                )}
                {visibleColumns.burst && (
                  <th className="border p-2">Burst Time</th>
                )}
                {visibleColumns.priority && (
                  <th className="border p-2">Priority</th>
                )}
              </tr>
            </thead>
            <tbody>
              {processes.map((p, i) => (
                <tr key={i}>
                  <td className="border p-2">
                    <input
                      value={p.id}
                      onChange={(e) => {
                        const newP = [...processes];
                        newP[i].id = e.target.value;
                        setProcesses(newP);
                        setResults(null);
                      }}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  {visibleColumns.arrival && (
                    <td className="border p-2">
                      <input
                        type="number"
                        value={p.arrival}
                        onChange={(e) => {
                          const newP = [...processes];
                          newP[i].arrival = +e.target.value;
                          setProcesses(newP);
                          setResults(null);
                        }}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  )}
                  {visibleColumns.burst && (
                    <td className="border p-2">
                      <input
                        type="number"
                        value={p.burst}
                        onChange={(e) => {
                          const newP = [...processes];
                          newP[i].burst = +e.target.value;
                          setProcesses(newP);
                          setResults(null);
                        }}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  )}
                  {visibleColumns.priority && (
                    <td className="border p-2">
                      <input
                        type="number"
                        value={p.priority}
                        onChange={(e) => {
                          const newP = [...processes];
                          newP[i].priority = +e.target.value;
                          setProcesses(newP);
                          setResults(null);
                        }}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 mt-3">
          <button
            onClick={addProcess}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
          >
            ➕ Add Process
          </button>
          <button
            onClick={removeLastProcess}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
          >
            ❌ Remove Last
          </button>
          <button
            onClick={resetAll}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition"
          >
            🔄 Reset
          </button>
          <button
            onClick={clearResults}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
          >
            🧹 Clear Results
          </button>
        </div>

        {/* Time Quantum - Only show for Round Robin */}
        {(selectedAlgo === "rr" || selectedAlgo === "all") && (
          <div className="mt-4">
            <label className="font-semibold mr-2">⏱️ Time Quantum (for RR): </label>
            <input
              type="number"
              value={quantum}
              onChange={(e) => setQuantum(+e.target.value)}
              className="border p-1 w-24 rounded"
              min="1"
            />
          </div>
        )}

        {/* Run Button */}
        <button
          onClick={calculate}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full transition font-semibold text-lg"
        >
           RUN {selectedAlgo === "all" ? "ALL ALGORITHMS" : selectedAlgo.toUpperCase()}
        </button>
      </div>

      {/* Results Section - Show only selected algorithm or all */}
      {results && (
        <div className="space-y-8">
          {selectedAlgo === "all" && (
            <>
              {[
                { key: "fcfs", name: "FCFS (First Come First Serve)", color: "blue" },
                { key: "sjf", name: "SJF (Shortest Job First - Non Preemptive)", color: "green" },
                { key: "rr", name: "Round Robin Scheduling", color: "purple" },
                { key: "priority", name: "Priority Scheduling (Lower Number = Higher Priority)", color: "orange" }
              ].map((algo) => {
                const data = results[algo.key as keyof typeof results] as AlgorithmResult;
                return (
                  <div key={algo.key} className={`bg-white p-4 rounded shadow border-l-8 border-${algo.color}-500`}>
                    <h2 className={`text-2xl font-bold text-${algo.color}-700 mb-3`}>📊 {algo.name}</h2>
                    <h3 className="font-semibold text-lg mt-2">📋 Process Table</h3>
                    <table className="w-full border mt-2">
                      <thead className={`bg-${algo.color}-100`}>
                        <tr><th className="border p-2">Process</th><th className="border p-2">Waiting Time</th><th className="border p-2">Turnaround Time</th></tr>
                      </thead>
                      <tbody>
                        {data.results.map((p, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="border p-2 text-center font-semibold">{p.pid}</td>
                            <td className="border p-2 text-center">{p.waiting}</td>
                            <td className="border p-2 text-center">{p.turnaround}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <p className="font-semibold">📈 Average Waiting Time: <span className="text-blue-600">{data.avgW}</span></p>
                      <p className="font-semibold">📈 Average Turnaround Time: <span className="text-green-600">{data.avgT}</span></p>
                    </div>
                    <GanttChart gantt={data.gantt} />
                  </div>
                );
              })}
            </>
          )}

          {/* Show only selected single algorithm */}
          {selectedAlgo !== "all" && (
            <div className="space-y-4">
              {selectedAlgo === "fcfs" && results.fcfs && (
                <div className="bg-white p-4 rounded shadow border-l-8 border-blue-500">
                  <h2 className="text-2xl font-bold text-blue-700 mb-3">📊 FCFS (First Come First Serve)</h2>
                  <h3 className="font-semibold text-lg mt-2">📋 Process Table</h3>
                  <table className="w-full border mt-2">
                    <thead className="bg-blue-100"><tr><th className="border p-2">Process</th><th className="border p-2">Waiting Time</th><th className="border p-2">Turnaround Time</th></tr></thead>
                    <tbody>
                      {results.fcfs.results.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50"><td className="border p-2 text-center font-semibold">{p.pid}</td><td className="border p-2 text-center">{p.waiting}</td><td className="border p-2 text-center">{p.turnaround}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 p-2 bg-gray-50 rounded"><p className="font-semibold">📈 Average Waiting Time: <span className="text-blue-600">{results.fcfs.avgW}</span></p><p className="font-semibold">📈 Average Turnaround Time: <span className="text-green-600">{results.fcfs.avgT}</span></p></div>
                  <GanttChart gantt={results.fcfs.gantt} />
                </div>
              )}
              {selectedAlgo === "sjf" && results.sjf && (
                <div className="bg-white p-4 rounded shadow border-l-8 border-green-500">
                  <h2 className="text-2xl font-bold text-green-700 mb-3">📊 SJF (Shortest Job First)</h2>
                  <h3 className="font-semibold text-lg mt-2">📋 Process Table</h3>
                  <table className="w-full border mt-2">
                    <thead className="bg-green-100"><tr><th className="border p-2">Process</th><th className="border p-2">Waiting Time</th><th className="border p-2">Turnaround Time</th></tr></thead>
                    <tbody>
                      {results.sjf.results.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50"><td className="border p-2 text-center font-semibold">{p.pid}</td><td className="border p-2 text-center">{p.waiting}</td><td className="border p-2 text-center">{p.turnaround}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 p-2 bg-gray-50 rounded"><p className="font-semibold">📈 Average Waiting Time: <span className="text-blue-600">{results.sjf.avgW}</span></p><p className="font-semibold">📈 Average Turnaround Time: <span className="text-green-600">{results.sjf.avgT}</span></p></div>
                  <GanttChart gantt={results.sjf.gantt} />
                </div>
              )}
              {selectedAlgo === "rr" && results.rr && (
                <div className="bg-white p-4 rounded shadow border-l-8 border-purple-500">
                  <h2 className="text-2xl font-bold text-purple-700 mb-3">📊 Round Robin (Quantum: {quantum})</h2>
                  <h3 className="font-semibold text-lg mt-2">📋 Process Table</h3>
                  <table className="w-full border mt-2">
                    <thead className="bg-purple-100"><tr><th className="border p-2">Process</th><th className="border p-2">Waiting Time</th><th className="border p-2">Turnaround Time</th></tr></thead>
                    <tbody>
                      {results.rr.results.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50"><td className="border p-2 text-center font-semibold">{p.pid}</td><td className="border p-2 text-center">{p.waiting}</td><td className="border p-2 text-center">{p.turnaround}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 p-2 bg-gray-50 rounded"><p className="font-semibold">📈 Average Waiting Time: <span className="text-blue-600">{results.rr.avgW}</span></p><p className="font-semibold">📈 Average Turnaround Time: <span className="text-green-600">{results.rr.avgT}</span></p></div>
                  <GanttChart gantt={results.rr.gantt} />
                </div>
              )}
              {selectedAlgo === "priority" && results.priority && (
                <div className="bg-white p-4 rounded shadow border-l-8 border-orange-500">
                  <h2 className="text-2xl font-bold text-orange-700 mb-3">📊 Priority Scheduling (Lower = Higher Priority)</h2>
                  <h3 className="font-semibold text-lg mt-2">📋 Process Table</h3>
                  <table className="w-full border mt-2">
                    <thead className="bg-orange-100"><tr><th className="border p-2">Process</th><th className="border p-2">Waiting Time</th><th className="border p-2">Turnaround Time</th></tr></thead>
                    <tbody>
                      {results.priority.results.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50"><td className="border p-2 text-center font-semibold">{p.pid}</td><td className="border p-2 text-center">{p.waiting}</td><td className="border p-2 text-center">{p.turnaround}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 p-2 bg-gray-50 rounded"><p className="font-semibold">📈 Average Waiting Time: <span className="text-blue-600">{results.priority.avgW}</span></p><p className="font-semibold">📈 Average Turnaround Time: <span className="text-green-600">{results.priority.avgT}</span></p></div>
                  <GanttChart gantt={results.priority.gantt} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!results && processes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-6 text-center text-gray-600">
          <p className="text-lg">⚙️ Click <strong>&quot;RUN {selectedAlgo === "all" ? "ALL ALGORITHMS" : selectedAlgo.toUpperCase()}&quot;</strong> to see scheduling results</p>
          <p className="text-sm mt-2">📊 You will see: Process Tables, Waiting/Turnaround Times, Averages, and GANTT CHARTS</p>
        </div>
      )}
    </div>
  );
} 
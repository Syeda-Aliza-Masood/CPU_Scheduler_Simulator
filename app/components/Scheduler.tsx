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
  const [results, setResults] = useState<{
    fcfs: AlgorithmResult;
    sjf: AlgorithmResult;
    rr: AlgorithmResult;
    priority: AlgorithmResult;
  } | null>(null);

  // FCFS with Gantt Chart
  const fcfs = (procs: Process[]): AlgorithmResult => {
    let sorted = [...procs].sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    let res: Result[] = [];
    let gantt: GanttItem[] = [];
    
    for (let p of sorted) {
      if (time < p.arrival) {
        // Add idle time
        if (time < p.arrival) {
          gantt.push({ pid: "Idle", start: time, end: p.arrival });
        }
        time = p.arrival;
      }
      let waiting = time - p.arrival;
      let turnaround = waiting + p.burst;
      res.push({ pid: p.id, waiting, turnaround });
      gantt.push({ pid: p.id, start: time, end: time + p.burst });
      time += p.burst;
    }
    
    let avgW = (res.reduce((a, b) => a + b.waiting, 0) / res.length).toFixed(2);
    let avgT = (res.reduce((a, b) => a + b.turnaround, 0) / res.length).toFixed(2);
    
    return { results: res, gantt, avgW, avgT };
  };

  // SJF (Non-preemptive) with Gantt Chart
  const sjf = (procs: Process[]): AlgorithmResult => {
    let remaining = [...procs.map((p) => ({ ...p, remaining: p.burst }))];
    let time = 0;
    let done = 0;
    let res: Result[] = [];
    let gantt: GanttItem[] = [];
    let completed = new Set();
    
    while (done < procs.length) {
      let available = remaining.filter(
        (p) => p.arrival <= time && p.remaining > 0 && !completed.has(p.id)
      );
      
      if (available.length === 0) {
        // Idle time - find next arrival
        let nextArrival = Math.min(...remaining.filter(p => !completed.has(p.id)).map(p => p.arrival));
        if (nextArrival > time) {
          gantt.push({ pid: "Idle", start: time, end: nextArrival });
          time = nextArrival;
        }
        continue;
      }
      
      available.sort((a, b) => a.burst - b.burst);
      let curr = available[0];
      let waiting = time - curr.arrival;
      let turnaround = waiting + curr.burst;
      res.push({ pid: curr.id, waiting, turnaround });
      gantt.push({ pid: curr.id, start: time, end: time + curr.burst });
      time += curr.burst;
      completed.add(curr.id);
      done++;
    }
    
    let avgW = (res.reduce((a, b) => a + b.waiting, 0) / res.length).toFixed(2);
    let avgT = (res.reduce((a, b) => a + b.turnaround, 0) / res.length).toFixed(2);
    
    return { results: res, gantt, avgW, avgT };
  };

  // Round Robin with Gantt Chart
  const roundRobin = (procs: Process[], quantumVal: number): AlgorithmResult => {
    let queue = [...procs.map((p) => ({ ...p, remaining: p.burst }))];
    queue.sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    let res: Result[] = [];
    let gantt: GanttItem[] = [];
    let complete = 0;
    let completedSet = new Set();
    let idx = 0;
    
    while (complete < procs.length) {
      if (idx >= queue.length) idx = 0;
      let p = queue[idx];
      
      if (p.remaining <= 0 || completedSet.has(p.id)) {
        idx++;
        continue;
      }
      
      if (time < p.arrival) {
        let nextArrival = p.arrival;
        if (time < nextArrival) {
          gantt.push({ pid: "Idle", start: time, end: nextArrival });
          time = nextArrival;
        }
        continue;
      }
      
      let exec = Math.min(quantumVal, p.remaining);
      gantt.push({ pid: p.id, start: time, end: time + exec });
      time += exec;
      p.remaining -= exec;
      
      if (p.remaining === 0) {
        let turnaround = time - p.arrival;
        let waiting = turnaround - p.burst;
        res.push({ pid: p.id, waiting, turnaround });
        completedSet.add(p.id);
        complete++;
      }
      idx++;
    }
    
    let avgW = (res.reduce((a, b) => a + b.waiting, 0) / res.length).toFixed(2);
    let avgT = (res.reduce((a, b) => a + b.turnaround, 0) / res.length).toFixed(2);
    
    return { results: res, gantt, avgW, avgT };
  };

  // Priority Scheduling with Gantt Chart
  const prioritySched = (procs: Process[]): AlgorithmResult => {
    let remaining = [...procs.map((p) => ({ ...p, remaining: p.burst }))];
    let time = 0;
    let done = 0;
    let res: Result[] = [];
    let gantt: GanttItem[] = [];
    let completed = new Set();
    
    while (done < procs.length) {
      let available = remaining.filter(
        (p) => p.arrival <= time && p.remaining > 0 && !completed.has(p.id)
      );
      
      if (available.length === 0) {
        let nextArrival = Math.min(...remaining.filter(p => !completed.has(p.id)).map(p => p.arrival));
        if (nextArrival > time) {
          gantt.push({ pid: "Idle", start: time, end: nextArrival });
          time = nextArrival;
        }
        continue;
      }
      
      available.sort((a, b) => a.priority - b.priority);
      let curr = available[0];
      let waiting = time - curr.arrival;
      let turnaround = waiting + curr.burst;
      res.push({ pid: curr.id, waiting, turnaround });
      gantt.push({ pid: curr.id, start: time, end: time + curr.burst });
      time += curr.burst;
      completed.add(curr.id);
      done++;
    }
    
    let avgW = (res.reduce((a, b) => a + b.waiting, 0) / res.length).toFixed(2);
    let avgT = (res.reduce((a, b) => a + b.turnaround, 0) / res.length).toFixed(2);
    
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
        ⚙️ CPU Scheduling Simulator
      </h1>

      {/* Input Section */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">📝 Process Details</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border mb-4">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Arrival Time</th>
                <th className="border p-2">Burst Time</th>
                <th className="border p-2">Priority</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p, i) => (
                <tr key={i}>
                  <td className="border p-2">
                    <input
                      value={p.id}
                      onChange={(e) => {
                        let newP = [...processes];
                        newP[i].id = e.target.value;
                        setProcesses(newP);
                        setResults(null);
                      }}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={p.arrival}
                      onChange={(e) => {
                        let newP = [...processes];
                        newP[i].arrival = +e.target.value;
                        setProcesses(newP);
                        setResults(null);
                      }}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={p.burst}
                      onChange={(e) => {
                        let newP = [...processes];
                        newP[i].burst = +e.target.value;
                        setProcesses(newP);
                        setResults(null);
                      }}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={p.priority}
                      onChange={(e) => {
                        let newP = [...processes];
                        newP[i].priority = +e.target.value;
                        setProcesses(newP);
                        setResults(null);
                      }}
                      className="w-full p-1 border rounded"
                    />
                  </td>
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

        {/* Time Quantum */}
        <div className="mt-4">
          <label className="font-semibold mr-2">⏱️ Time Quantum (RR): </label>
          <input
            type="number"
            value={quantum}
            onChange={(e) => setQuantum(+e.target.value)}
            className="border p-1 w-24 rounded"
            min="1"
          />
        </div>

        {/* Run Button */}
        <button
          onClick={calculate}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full transition font-semibold text-lg"
        >
          🚀 RUN ALL ALGORITHMS
        </button>
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-8">
          {[
            { key: "fcfs", name: "FCFS (First Come First Serve)", color: "blue" },
            { key: "sjf", name: "SJF (Shortest Job First - Non Preemptive)", color: "green" },
            { key: "rr", name: "Round Robin Scheduling", color: "purple" },
            { key: "priority", name: "Priority Scheduling (Lower = Higher Priority)", color: "orange" }
          ].map((algo) => {
            const data = results[algo.key as keyof typeof results] as AlgorithmResult;
            
            return (
              <div key={algo.key} className={`bg-white p-4 rounded shadow border-l-8 border-${algo.color}-500`}>
                <h2 className={`text-2xl font-bold text-${algo.color}-700 mb-3`}>
                  📊 {algo.name}
                </h2>
                
                {/* Process Table */}
                <h3 className="font-semibold text-lg mt-2">📋 Process Table</h3>
                <table className="w-full border mt-2">
                  <thead className={`bg-${algo.color}-100`}>
                    <tr>
                      <th className="border p-2">Process</th>
                      <th className="border p-2">Waiting Time</th>
                      <th className="border p-2">Turnaround Time</th>
                    </tr>
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
                
                {/* Averages */}
                <div className="mt-3 p-2 bg-gray-50 rounded">
                  <p className="font-semibold">
                    📈 Average Waiting Time: <span className="text-blue-600">{data.avgW}</span>
                  </p>
                  <p className="font-semibold">
                    📈 Average Turnaround Time: <span className="text-green-600">{data.avgT}</span>
                  </p>
                </div>
                
                {/* Gantt Chart */}
                <GanttChart gantt={data.gantt} />
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!results && processes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-6 text-center text-gray-600">
          <p className="text-lg">⚙️ Click <strong>"RUN ALL ALGORITHMS"</strong> to see scheduling results</p>
          <p className="text-sm mt-2">📊 You will see: Process Tables, Waiting/Turnaround Times, Averages, and GANTT CHARTS</p>
        </div>
      )}
    </div>
  );
}
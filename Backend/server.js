const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

function isValidEdge(edge) {
  const trimmed = edge.trim();
  return /^[A-Z]->[A-Z]$/.test(trimmed) && trimmed[0] !== trimmed[3];
}

app.post("/bfhl", (req, res) => {
  const { data } = req.body;

  const user_id = "ratnesh_08092005";
  const email_id = "ratneshgudipudi008@email.com";
  const college_roll_number = "AP23110011134";

  let valid = [];
  let invalid = [];
  let duplicates = new Set();
  let seen = new Set();

  // Validate + duplicates
  for (let edge of data) {
    if (!isValidEdge(edge)) {
      invalid.push(edge);
      continue;
    }

    if (seen.has(edge)) {
      duplicates.add(edge);
    } else {
      seen.add(edge);
      valid.push(edge);
    }
  }

  // Build graph
  let graph = {};
  let childSet = new Set();

  valid.forEach(edge => {
    const [parent, child] = edge.split("->");

    if (!graph[parent]) graph[parent] = [];
    graph[parent].push(child);

    childSet.add(child);
  });

  // Find roots
  let roots = Object.keys(graph).filter(n => !childSet.has(n));

  let hierarchies = [];

  function dfs(node, visited) {
    if (visited.has(node)) return null; // cycle
    visited.add(node);

    let children = graph[node] || [];
    let obj = {};

    for (let child of children) {
      const sub = dfs(child, new Set(visited));
      if (sub === null) return null;
      obj[child] = sub;
    }

    return obj;
  }

  function depth(node) {
    let children = graph[node] || [];
    if (children.length === 0) return 1;

    let max = 0;
    for (let child of children) {
      max = Math.max(max, depth(child));
    }
    return max + 1;
  }

  let total_cycles = 0;

  for (let root of roots) {
    const tree = dfs(root, new Set());

    if (tree === null) {
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
      total_cycles++;
    } else {
      hierarchies.push({
        root,
        tree: { [root]: tree },
        depth: depth(root)
      });
    }
  }

  // Summary
  let validTrees = hierarchies.filter(h => !h.has_cycle);
  let largest = validTrees.sort((a, b) => b.depth - a.depth)[0];

  const response = {
    user_id,
    email_id,
    college_roll_number,
    hierarchies,
    invalid_entries: invalid,
    duplicate_edges: [...duplicates],
    summary: {
      total_trees: validTrees.length,
      total_cycles,
      largest_tree_root: largest ? largest.root : null
    }
  };

  res.json(response);
});

app.listen(3000, () => console.log("Server running on port 3000"));

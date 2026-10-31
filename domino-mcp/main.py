from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
from collections import defaultdict

app = FastAPI(title="Domino MCP Server")

class GraphPayload(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

def calculate_critical_path(nodes: List[Dict], edges: List[Dict]) -> List[str]:
    # 1. Build the graph (adjacency list) and track incoming edges
    graph = defaultdict(list)
    in_degree = {node['id']: 0 for node in nodes}
    
    for edge in edges:
        graph[edge['source']].append(edge['target'])
        if edge['target'] in in_degree:
            in_degree[edge['target']] += 1

    # 2. Identify the root nodes (nodes with no incoming dependencies)
    roots = [node_id for node_id, count in in_degree.items() if count == 0]

    # 3. Use DFS with memoization to find the longest path
    memo = {}
    def dfs(current_node):
        if current_node in memo:
            return memo[current_node]
        
        longest_subpath = []
        for neighbor in graph[current_node]:
            subpath = dfs(neighbor)
            if len(subpath) > len(longest_subpath):
                longest_subpath = subpath
                
        memo[current_node] = [current_node] + longest_subpath
        return memo[current_node]

    # 4. Calculate the path for all roots and find the absolute longest
    critical_path = []
    for root in roots:
        path = dfs(root)
        if len(path) > len(critical_path):
            critical_path = path
            
    return critical_path

@app.post("/analyze")
async def analyze_blast_radius(payload: GraphPayload):
    print(f"Analyzing graph with {len(payload.nodes)} nodes and {len(payload.edges)} edges...")
    
    # Run the calculation
    critical_path = calculate_critical_path(payload.nodes, payload.edges)
    
    print(f"CRITICAL PATH FOUND: {' -> '.join(critical_path)}")
    
    return {
        "status": "success",
        "metrics": {
            "total_nodes": len(payload.nodes),
            "total_edges": len(payload.edges),
            "max_depth": len(critical_path)
        },
        "critical_path": critical_path,
        "risk_level": "High" if len(critical_path) > 3 else "Moderate"
    }
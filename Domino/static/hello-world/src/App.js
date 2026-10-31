import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { router, invoke } from '@forge/bridge';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 250;
const nodeHeight = 60;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = direction === 'TB' ? 'top' : 'left';
    node.sourcePosition = direction === 'TB' ? 'bottom' : 'right';
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [insights, setInsights] = useState(null);
  
  // 1. Added loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFromBackend() {
      try {
        const graphData = await invoke('fetchGraphData');

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          graphData.nodes || [], 
          graphData.edges || []
        );
        
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        
        setInsights({
          critical_path: graphData.critical_path || (graphData.insights && graphData.insights.critical_path) || [],
          risk_level: graphData.risk_level || (graphData.insights && graphData.insights.risk_level) || 'Moderate'
        });
      } catch (err) {
        console.error("Error fetching blast radius:", err);
      } finally {
        // 2. Turn off the loading screen whether the request succeeds or fails
        setIsLoading(false); 
      }
    }
    
    fetchFromBackend();
  }, [setNodes, setEdges]);

  const onNodeClick = (event, node) => {
    router.navigate(`/browse/${node.id}`);
  };

  // 3. The loading UI that shows while waiting for Python
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column' }}>
        <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #0052CC', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <h4 style={{ color: '#0052CC', marginTop: '15px' }}>Analyzing dependency blast radius...</h4>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {insights && (
        <div style={{ padding: '15px', backgroundColor: '#E9F2FF', border: '1px solid #0052CC', borderRadius: '8px' }}>
          <strong style={{ color: '#0052CC', fontSize: '16px' }}>AI Blast Radius Analysis</strong>
          <p style={{ margin: '8px 0 0 0' }}><strong>Critical Path:</strong> {insights.critical_path?.join(' → ')}</p>
          <p style={{ margin: '4px 0 0 0' }}><strong>Risk Level:</strong> {insights.risk_level}</p>
        </div>
      )}
      <div style={{ width: '100%', height: '400px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          style={{ cursor: 'pointer' }}
        >
          <Background color="#f4f5f7" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;
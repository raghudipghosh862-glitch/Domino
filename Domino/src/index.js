import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

resolver.define('fetchGraphData', async (req) => {
  // 1. DYNAMICALLY extract the exact issue key from the Jira UI context
  const rootKey = req.context.extension.issue.key;
  
  const fetchedNodes = [];
  const fetchedEdges = [];
  const visited = new Set();
  const queue = [rootKey];

  while (queue.length > 0) {
    const currentKey = queue.shift();
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);

    // Fetch Jira Issue (REST)
    const response = await api.asUser().requestJira(route`/rest/api/3/issue/${currentKey}`);
    const issueData = await response.json();

    fetchedNodes.push({
      id: currentKey,
      data: { label: `${currentKey}: ${issueData.fields?.summary || ''}` },
      style: {
        border: currentKey === rootKey ? '2px solid #6554C0' : '2px solid #FF5630',
        padding: '10px', borderRadius: '5px', background: '#fff', width: 250
      }
    });

    // Fetch Linked Confluence Pages
    const remoteLinksResponse = await api.asUser().requestJira(route`/rest/api/3/issue/${currentKey}/remotelink`);
    const remoteLinks = await remoteLinksResponse.json();

    remoteLinks.forEach(link => {
      if (link.application && link.application.type === 'com.atlassian.confluence') {
        const confNodeId = `conf-${link.id}`;
        if (!visited.has(confNodeId)) {
          fetchedNodes.push({
            id: confNodeId,
            data: { label: `Docs: ${link.object.title}` },
            style: { border: '2px solid #0052CC', padding: '10px', borderRadius: '5px', background: '#E9F2FF', width: 250 }
          });

          fetchedEdges.push({
            id: `e-${currentKey}-${confNodeId}`,
            source: currentKey,
            target: confNodeId,
            animated: true,
            label: 'impacts doc'
          });
          visited.add(confNodeId);
        }
      }
    });

    // Queue linked Jira issues
    const linkedIssues = issueData.fields?.issuelinks || [];
    for (const link of linkedIssues) {
      const linkedIssue = link.outwardIssue || link.inwardIssue;
      const linkType = link.outwardIssue ? link.type.outward : link.type.inward;

      if (linkedIssue && !visited.has(linkedIssue.key)) {
        fetchedEdges.push({
          id: `e-${currentKey}-${linkedIssue.key}`,
          source: currentKey,
          target: linkedIssue.key,
          animated: true,
          label: linkType
        });
        queue.push(linkedIssue.key);
      }
    }
  }

  let mcpInsights = null;
  // 2. Send the correct JSON payload (nodes and edges) to Python to prevent the 422 error
  const mcpResponse = await api.fetch('https://domino-iwtr.onrender.com/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes: fetchedNodes, edges: fetchedEdges })
  });
  
  if (!mcpResponse.ok) {
    throw new Error(`Python backend returned ${mcpResponse.status}`);
  }
  
  mcpInsights = await mcpResponse.json();

  return { 
    nodes: fetchedNodes, 
    edges: fetchedEdges, 
    insights: mcpInsights 
  };
});

export const handler = resolver.getDefinitions();
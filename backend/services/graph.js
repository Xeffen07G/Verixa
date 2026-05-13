const { GraphNode, GraphEdge } = require('../models/Graph');
const { askGroq } = require('./groq');

/**
 * Knowledge Graph Intelligence Service.
 * Handles entity extraction and relationship mapping.
 */
class GraphService {
  /**
   * Extract entities and relationships from a text chunk.
   */
  async extractIntelligence(chunkId, text, documentId) {
    const prompt = `Extract atomic intelligence from this text.
    Identify:
    1. Entities (Concept, Author, Dataset, etc.)
    2. Relationships (SUPPORTS, CONTRADICTS, CITES, etc.)
    
    TEXT:
    ${text}
    
    Respond in JSON:
    {
      "nodes": [ { "id": "slug", "type": "...", "label": "..." } ],
      "edges": [ { "from": "slugA", "to": "slugB", "relationship": "..." } ]
    }`;

    try {
      const raw = await askGroq(prompt, true, "llama-3.1-8b-instant");
      const { nodes, edges } = JSON.parse(raw);

      // Persist Nodes
      for (const nodeData of nodes) {
        await GraphNode.findOneAndUpdate(
          { id: nodeData.id },
          { ...nodeData, "metadata.documentId": documentId },
          { upsert: true }
        );
      }

      // Persist Edges
      for (const edgeData of edges) {
        await GraphEdge.create({
          ...edgeData,
          "metadata.sourceId": chunkId
        });
      }

      return { nodes: nodes.length, edges: edges.length };
    } catch (err) {
      console.error("[GraphService] Extraction failed:", err.message);
      return { nodes: 0, edges: 0 };
    }
  }

  /**
   * Find contradictions for a given entity or concept.
   */
  async findContradictions(nodeId) {
    return await GraphEdge.find({
      $or: [{ from: nodeId }, { to: nodeId }],
      relationship: 'CONTRADICTS'
    }).lean();
  }

  /**
   * Get the influence graph for a concept (transitive closure).
   */
  async getInfluenceGraph(nodeId, depth = 2) {
    // Basic BFS for relationship traversal
    let nodes = new Set([nodeId]);
    let edges = [];
    let currentLevel = [nodeId];

    for (let i = 0; i < depth; i++) {
      const nextLevel = [];
      const foundEdges = await GraphEdge.find({ from: { $in: currentLevel } }).lean();
      
      for (const edge of foundEdges) {
        edges.push(edge);
        if (!nodes.has(edge.to)) {
          nodes.add(edge.to);
          nextLevel.push(edge.to);
        }
      }
      currentLevel = nextLevel;
      if (currentLevel.length === 0) break;
    }

    const nodeDetails = await GraphNode.find({ id: { $in: Array.from(nodes) } }).lean();
    return { nodes: nodeDetails, edges };
  }
}

module.exports = new GraphService();

/**
 * KV Shared Memory for Multi-Agent Coordination
 * Uses Cloudflare KV as shared memory between agents
 */

class KVMemory {
  constructor() {
    this.workerUrl = process.env.WORKER_URL || 'http://localhost:3000';
  }

  async set(key, value, expirationTtl = 3600) {
    try {
      const response = await fetch(`${this.workerUrl}/__kv/${key}`, {
        method: 'PUT',
        body: JSON.stringify(value),
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      console.error(`❌ KV set failed: ${error.message}`);
      throw error;
    }
  }

  async get(key) {
    try {
      const response = await fetch(`${this.workerUrl}/__kv/${key}`);
      if (!response.ok) return null;
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error(`❌ KV get failed: ${error.message}`);
      return null;
    }
  }

  async delete(key) {
    try {
      const response = await fetch(`${this.workerUrl}/__kv/${key}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error(`❌ KV delete failed: ${error.message}`);
      throw error;
    }
  }

  // Agent-specific memory
  async setAgentMemory(agentId, conversationId, data) {
    const key = `agent:${agentId}:conv:${conversationId}`;
    return this.set(key, data);
  }

  async getAgentMemory(agentId, conversationId) {
    const key = `agent:${agentId}:conv:${conversationId}`;
    return this.get(key);
  }

  // Shared context between agents
  async setSharedContext(conversationId, data) {
    const key = `shared:${conversationId}`;
    return this.set(key, data);
  }

  async getSharedContext(conversationId) {
    const key = `shared:${conversationId}`;
    return this.get(key);
  }

  // Agent coordination
  async registerAgent(conversationId, agentId, role) {
    const key = `agents:${conversationId}`;
    const agents = await this.get(key) || [];
    agents.push({ agentId, role, timestamp: Date.now() });
    return this.set(key, agents);
  }

  async getActiveAgents(conversationId) {
    const key = `agents:${conversationId}`;
    return this.get(key) || [];
  }

  // Agent output sharing
  async publishAgentOutput(conversationId, agentId, output) {
    const key = `output:${conversationId}:${agentId}`;
    return this.set(key, output);
  }

  async getAgentOutput(conversationId, agentId) {
    const key = `output:${conversationId}:${agentId}`;
    return this.get(key);
  }

  async getAllAgentOutputs(conversationId) {
    const agents = await this.getActiveAgents(conversationId);
    const outputs = {};
    for (const agent of agents) {
      outputs[agent.agentId] = await this.getAgentOutput(conversationId, agent.agentId);
    }
    return outputs;
  }
}

module.exports = KVMemory;

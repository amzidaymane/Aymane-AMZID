
import { Player, Match, Fixture } from '../types';

const REPO_OWNER = 'amzidaymane';
const REPO_NAME = 'Aymane-AMZID';
const FILE_PATH = 'db.json';
const BRANCH = 'main';

const GITHUB_TOKEN = (process.env as any).GITHUB_TOKEN || '';

export interface AppData {
  players: Player[];
  matches: Match[];
  fixtures: Fixture[];
  version: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'unauthorized' | 'conflict' | 'rate-limited';

class GitHubStorageService {
  private lastSha: string | null = null;

  async loadData(): Promise<AppData | null> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      }

      const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}&t=${Date.now()}`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 403) {
          console.warn('GitHub API Rate Limit Exceeded (403). Falling back to local data.');
          return null;
        }
        if (response.status === 404) return null;
        throw new Error(`GitHub Load Error: ${response.status}`);
      }

      const data = await response.json();
      this.lastSha = data.sha;
      const content = decodeURIComponent(escape(atob(data.content)));
      const parsed = JSON.parse(content);
      
      return {
        players: parsed.players || [],
        matches: parsed.matches || [],
        fixtures: parsed.fixtures || [],
        version: parsed.version || 0
      };
    } catch (error) {
      console.error('Storage Load Error:', error);
      return null;
    }
  }

  async saveData(data: AppData): Promise<SyncStatus> {
    if (!GITHUB_TOKEN) return 'unauthorized';

    try {
      const headers = { 
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      const headResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}&t=${Date.now()}`,
        { headers }
      );
      
      let currentSha = this.lastSha;
      if (headResponse.ok) {
        const headData = await headResponse.json();
        currentSha = headData.sha;
      } else if (headResponse.status === 403) {
        return 'rate-limited';
      }

      const jsonString = JSON.stringify(data, null, 2);
      const content = btoa(unescape(encodeURIComponent(jsonString)));
      
      const putResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `arena_sync: update registry ${new Date().toISOString()}`,
            content,
            sha: currentSha || undefined,
            branch: BRANCH,
          }),
        }
      );

      if (!putResponse.ok) {
        if (putResponse.status === 403) return 'rate-limited';
        const errData = await putResponse.json();
        console.error('GitHub API Save Conflict:', errData);
        return 'conflict';
      }
      
      const result = await putResponse.json();
      this.lastSha = result.content.sha;
      return 'synced';
    } catch (error) {
      console.error('Storage Save Error:', error);
      return 'error';
    }
  }
}

export const githubStorage = new GitHubStorageService();

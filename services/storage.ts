
import { Player, Match, Fixture } from '../types';

const REPO_OWNER = 'aymamzid';
const REPO_NAME = 'PGD-FC';
const FILE_PATH = 'db.json';
const BRANCH = 'main';

const GITHUB_TOKEN = (process.env as any).GITHUB_TOKEN || '';

export interface AppData {
  players: Player[];
  matches: Match[];
  fixtures: Fixture[];
  version: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'unauthorized' | 'conflict';

class GitHubStorageService {
  private lastSha: string | null = null;

  async loadData(): Promise<AppData | null> {
    try {
      // Add a cache buster to the URL to ensure we always get the latest from GitHub's servers
      const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}&t=${Date.now()}`,
        {
          headers: GITHUB_TOKEN ? { 
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          } : {
            'Accept': 'application/vnd.github.v3+json'
          },
        }
      );

      if (!response.ok) {
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
      // STEP 1: Always fetch the latest SHA immediately before writing. 
      // This is crucial for multi-user environments (you and your friend).
      const headResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}&t=${Date.now()}`,
        {
          headers: { 
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          },
        }
      );
      
      let currentSha = this.lastSha;
      if (headResponse.ok) {
        const headData = await headResponse.json();
        currentSha = headData.sha;
      }

      // STEP 2: Prepare the content
      const jsonString = JSON.stringify(data, null, 2);
      const content = btoa(unescape(encodeURIComponent(jsonString)));
      
      // STEP 3: Push to GitHub
      const putResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
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

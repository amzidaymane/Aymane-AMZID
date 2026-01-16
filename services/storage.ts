
import { Player, Match, Fixture } from '../types';

const REPO_OWNER = 'aymamzid';
const REPO_NAME = 'PGD-FC';
const FILE_PATH = 'db.json';
const BRANCH = 'main';

// The GitHub token is assumed to be provided via environment
const GITHUB_TOKEN = (process.env as any).GITHUB_TOKEN || '';

export interface AppData {
  players: Player[];
  matches: Match[];
  fixtures: Fixture[];
  version: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'unauthorized';

class GitHubStorageService {
  private lastSha: string | null = null;

  async loadData(): Promise<AppData | null> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
        {
          headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch data from GitHub');
      }

      const data = await response.json();
      this.lastSha = data.sha;
      const content = atob(data.content);
      const parsed = JSON.parse(content);
      
      return {
        players: parsed.players || [],
        matches: parsed.matches || [],
        fixtures: parsed.fixtures || [],
        version: parsed.version || Date.now()
      };
    } catch (error) {
      console.error('Storage Load Error:', error);
      return null;
    }
  }

  async saveData(data: AppData): Promise<SyncStatus> {
    if (!GITHUB_TOKEN) return 'unauthorized';

    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
        {
          headers: { Authorization: `token ${GITHUB_TOKEN}` },
        }
      );
      
      if (getResponse.ok) {
        const existingData = await getResponse.json();
        this.lastSha = existingData.sha;
      }

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
      
      const putResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `chore: automatic database sync ${new Date().toISOString()}`,
            content,
            sha: this.lastSha || undefined,
            branch: BRANCH,
          }),
        }
      );

      if (!putResponse.ok) throw new Error('Failed to save to GitHub');
      
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

const SERVER_ACTION_ERROR = 'Failed to find Server Action';

export function isStaleDeployError(error: unknown): boolean {
  return error instanceof Error && error.message?.includes(SERVER_ACTION_ERROR);
}

export function reloadIfStaleDeploy(error: unknown): void {
  if (isStaleDeployError(error) && typeof window !== 'undefined') {
    window.location.reload();
  }
}

export function SMTPDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
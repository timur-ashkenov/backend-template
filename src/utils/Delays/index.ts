export class Delays {
  public static async smtp(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
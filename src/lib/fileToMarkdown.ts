import { execFile } from "child_process";
import { writeFile, unlink, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function fileToMarkdown(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "markitdown-"));
  const tmpPath = join(dir, originalName);

  await writeFile(tmpPath, buffer);

  try {
    const markdown = await new Promise<string>((resolve, reject) => {
      execFile(
        "python3",
        [join(process.cwd(), "scripts", "file_to_markdown.py"), tmpPath],
        { maxBuffer: 20 * 1024 * 1024, timeout: 60_000 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    return markdown.trim();
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}
